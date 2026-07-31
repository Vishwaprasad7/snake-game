import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { User, FriendPhoto } from '../types';
import { authAPI } from '../utils/api';

interface AuthContextType {
  user: User | null;
  token: string | null;
  playerImage: string | null;
  friendPhotos: FriendPhoto[];
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (username: string, email: string, password: string) => Promise<void>;
  loginAsGuest: () => Promise<void>;
  logout: () => void;
  setPlayerImage: (url: string) => void;
  setFriendPhotos: React.Dispatch<React.SetStateAction<FriendPhoto[]>>;
  updateUser: (data: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [playerImage, setPlayerImage] = useState<string | null>(localStorage.getItem('playerImage'));
  const [friendPhotos, setFriendPhotos] = useState<FriendPhoto[]>(() => {
    const stored = localStorage.getItem('friendPhotos');
    return stored ? JSON.parse(stored) : [];
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (playerImage) {
      try {
        localStorage.setItem('playerImage', playerImage);
      } catch (err) {
        console.warn('Failed to save playerImage to localStorage (quota exceeded):', err);
      }
    }
  }, [playerImage]);

  useEffect(() => {
    try {
      localStorage.setItem('friendPhotos', JSON.stringify(friendPhotos));
    } catch (err) {
      console.warn('Failed to save friendPhotos to localStorage (quota exceeded):', err);
    }
  }, [friendPhotos]);

  const fetchUser = useCallback(async () => {
    if (!token) {
      setIsLoading(false);
      return;
    }
    try {
      const { data } = await authAPI.getMe();
      setUser(data.user);
      if (data.user.playerImageUrl) setPlayerImage(data.user.playerImageUrl);
    } catch {
      localStorage.removeItem('token');
      setToken(null);
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  // Handle OAuth callback token
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const callbackToken = params.get('token');
    if (callbackToken) {
      localStorage.setItem('token', callbackToken);
      setToken(callbackToken);
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, []);

  const login = async (email: string, password: string) => {
    const { data } = await authAPI.login({ email, password });
    localStorage.setItem('token', data.token);
    setToken(data.token);
    setUser(data.user);
  };

  const register = async (username: string, email: string, password: string) => {
    const { data } = await authAPI.register({ username, email, password });
    localStorage.setItem('token', data.token);
    setToken(data.token);
    setUser(data.user);
  };

  const loginAsGuest = async () => {
    try {
      const { data } = await authAPI.guest();
      localStorage.setItem('token', data.token);
      setToken(data.token);
      setUser(data.user);
    } catch {
      // Offline guest mode
      const guestUser: User = {
        _id: 'guest-' + Date.now(),
        username: 'Guest Snake 🐍',
        avatar: '',
        playerImageUrl: '',
        provider: 'guest',
        isGuest: true,
        isAdmin: false,
        stats: { totalGames: 0, totalFriendsEaten: 0, highestScore: 0, totalTimePlayed: 0, maxCombo: 0 },
        achievements: [],
        createdAt: new Date().toISOString(),
      };
      setUser(guestUser);
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('playerImage');
    localStorage.removeItem('friendPhotos');
    setToken(null);
    setUser(null);
    setPlayerImage(null);
    setFriendPhotos([]);
  };

  const updateUser = (data: Partial<User>) => {
    setUser(prev => prev ? { ...prev, ...data } : null);
  };

  return (
    <AuthContext.Provider value={{
      user, token, playerImage, friendPhotos, isLoading,
      isAuthenticated: !!user,
      login, register, loginAsGuest, logout,
      setPlayerImage, setFriendPhotos, updateUser,
    }}>
      {children}
    </AuthContext.Provider>
  );
};
