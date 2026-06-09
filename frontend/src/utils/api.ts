import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    }
    return Promise.reject(err);
  }
);

// Auth
export const authAPI = {
  register: (data: { username: string; email: string; password: string }) =>
    api.post('/auth/register', data),
  login: (data: { email: string; password: string }) =>
    api.post('/auth/login', data),
  guest: () => api.post('/auth/guest'),
  getMe: () => api.get('/auth/me'),
};

// Upload
export const uploadAPI = {
  playerPhoto: (file: File) => {
    const fd = new FormData();
    fd.append('photo', file);
    return api.post('/upload/player', fd, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  friendPhotos: (files: File[]) => {
    const fd = new FormData();
    files.forEach((f) => fd.append('photos', f));
    return api.post('/upload/friends', fd, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  deleteFriend: (id: string) => api.delete(`/upload/friends/${id}`),
};

// Scores
export const scoresAPI = {
  save: (data: any) => api.post('/scores', data),
  leaderboard: (type = 'global', mode = 'classic', limit = 20) =>
    api.get('/scores/leaderboard', { params: { type, mode, limit } }),
  myScores: () => api.get('/scores/my'),
};

// Profile
export const profileAPI = {
  get: (id: string) => api.get(`/profile/${id}`),
  update: (data: any) => api.put('/profile', data),
  achievements: (id: string) => api.get(`/profile/${id}/achievements`),
};

// Admin
export const adminAPI = {
  users: (page = 1, search = '') =>
    api.get('/admin/users', { params: { page, search } }),
  analytics: () => api.get('/admin/analytics'),
  banUser: (id: string) => api.put(`/admin/users/${id}/ban`),
  deleteUser: (id: string) => api.delete(`/admin/users/${id}`),
};

export default api;
