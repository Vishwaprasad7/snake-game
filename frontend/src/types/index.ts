export interface User {
  _id: string;
  username: string;
  email?: string;
  avatar: string;
  playerImageUrl: string;
  provider: 'local' | 'google' | 'github' | 'guest';
  isGuest: boolean;
  isAdmin: boolean;
  stats: UserStats;
  achievements: Achievement[];
  createdAt: string;
}

export interface UserStats {
  totalGames: number;
  totalFriendsEaten: number;
  highestScore: number;
  totalTimePlayed: number;
  maxCombo: number;
}

export interface Achievement {
  type: string;
  title: string;
  description: string;
  unlockedAt: string;
}

export interface FriendPhoto {
  _id: string;
  name: string;
  imageUrl: string;
  order: number;
}

export interface GameScore {
  _id: string;
  userId: string;
  username: string;
  avatar: string;
  score: number;
  mode: GameMode;
  friendsEaten: number;
  timeSurvived: number;
  maxCombo: number;
  createdAt: string;
}

export type GameMode = 'classic' | 'survival' | 'time-attack' | 'chaos' | 'ai' | 'wrap';

export interface PowerUp {
  type: 'speed' | 'double' | 'magnet' | 'shield' | 'freeze';
  x: number;
  y: number;
  active: boolean;
  duration: number;
  icon: string;
  color: string;
}

export interface GameState {
  snake: SnakeSegment[];
  foods: FoodItem[];
  powerUps: PowerUp[];
  score: number;
  combo: number;
  comboTimer: number;
  friendsEaten: number;
  timeSurvived: number;
  speed: number;
  direction: Direction;
  nextDirection: Direction;
  isRunning: boolean;
  isGameOver: boolean;
  isPaused: boolean;
  mode: GameMode;
  activePowerUps: ActivePowerUp[];
  shieldActive: boolean;
  magnetActive: boolean;
  doublePointsActive: boolean;
}

export interface SnakeSegment {
  x: number;
  y: number;
}

export interface FoodItem {
  x: number;
  y: number;
  friendIndex: number;
  image?: HTMLImageElement;
}

export interface ActivePowerUp {
  type: string;
  remainingTime: number;
}

export type Direction = 'up' | 'down' | 'left' | 'right';

export interface LeaderboardEntry {
  _id: string;
  username: string;
  avatar: string;
  score: number;
  mode: string;
  friendsEaten: number;
  maxCombo: number;
  createdAt: string;
}
