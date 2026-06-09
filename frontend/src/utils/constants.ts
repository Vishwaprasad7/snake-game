export const FUNNY_MESSAGES = [
  'Got You! 😂',
  'Friend Eliminated 😂',
  'Target Destroyed 😎',
  'Snack Acquired 🍔',
  'Nom Nom Nom 😋',
  'Devoured! 🔥',
  'Another One Bites the Dust 💀',
  'Friendship Over 😈',
  'Easy Meal! 🍽️',
  'Yummy Friend! 😜',
  'No Escape! 🐍',
  'Swallowed Whole! 😱',
  'Tastes Like Victory! 🏆',
  'RIP Friend 💐',
  'Ssssnack Time! 🐍',
];

export const getEatenMessage = (friendName?: string) => {
  if (friendName && friendName !== 'Friend') {
    const namedMessages = [
      `${friendName} was eaten 😂`,
      `${friendName} got devoured! 🔥`,
      `Bye bye ${friendName}! 👋`,
      `${friendName} is now a snack 🍔`,
      `RIP ${friendName} 💀`,
      `${friendName} never saw it coming 😈`,
    ];
    return namedMessages[Math.floor(Math.random() * namedMessages.length)];
  }
  return FUNNY_MESSAGES[Math.floor(Math.random() * FUNNY_MESSAGES.length)];
};

export const COMBO_THRESHOLDS = [
  { count: 2, label: 'Combo x2', multiplier: 2, color: '#00E5FF' },
  { count: 3, label: 'Combo x3', multiplier: 3, color: '#00FF88' },
  { count: 5, label: 'Combo x5', multiplier: 5, color: '#FFB800' },
  { count: 10, label: 'COMBO x10!', multiplier: 10, color: '#FF4D8D' },
];

export const getComboMultiplier = (combo: number) => {
  for (let i = COMBO_THRESHOLDS.length - 1; i >= 0; i--) {
    if (combo >= COMBO_THRESHOLDS[i].count) return COMBO_THRESHOLDS[i];
  }
  return { count: 0, label: '', multiplier: 1, color: '#ffffff' };
};

export const POWER_UP_CONFIG = {
  speed: { icon: '⚡', color: '#FFB800', name: 'Speed Boost', duration: 5000 },
  double: { icon: '✨', color: '#00FF88', name: 'Double Points', duration: 10000 },
  magnet: { icon: '🧲', color: '#00E5FF', name: 'Magnet', duration: 8000 },
  shield: { icon: '🛡️', color: '#6C63FF', name: 'Shield', duration: 15000 },
  freeze: { icon: '❄️', color: '#80D8FF', name: 'Freeze Time', duration: 7000 },
};

export const ACHIEVEMENT_DEFINITIONS = [
  { type: 'first_friend', title: 'First Friend Eaten', description: 'Eat your first friend', icon: '🍽️' },
  { type: 'combo_master', title: 'Combo Master', description: 'Reach a x5 combo', icon: '🔥' },
  { type: 'snake_king', title: 'Snake King', description: 'Score 1000 points', icon: '👑' },
  { type: 'speed_demon', title: 'Speed Demon', description: 'Eat 5 friends in 10 seconds', icon: '⚡' },
  { type: 'friend_hunter', title: 'Friend Hunter', description: 'Eat 50 total friends', icon: '🎯' },
  { type: 'survivor', title: 'Survivor', description: 'Survive 5 minutes', icon: '⏱️' },
  { type: 'power_collector', title: 'Power Collector', description: 'Collect 10 power-ups', icon: '💎' },
  { type: 'untouchable', title: 'Untouchable', description: 'Use a shield to survive', icon: '🛡️' },
];

export const GAME_MODES = [
  { id: 'classic' as const, name: 'Classic', description: 'Eat friends, grow longer', icon: '🐍', color: '#6C63FF' },
  { id: 'survival' as const, name: 'Survival', description: 'Speed increases over time', icon: '💀', color: '#FF4D8D' },
  { id: 'time-attack' as const, name: 'Time Attack', description: '60-second challenge', icon: '⏱️', color: '#FFB800' },
  { id: 'chaos' as const, name: 'Chaos', description: 'Multiple friends at once', icon: '🌪️', color: '#00E5FF' },
  { id: 'wrap' as const, name: 'Wrap Mode', description: 'Pass through walls. Only die when eating own body', icon: '🌀', color: '#a855f7' },
  { id: 'ai' as const, name: 'AI Auto Play', description: 'Watch the AI play', icon: '🤖', color: '#00FF88' },
];

export const formatTime = (seconds: number) => {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
};

export const clamp = (val: number, min: number, max: number) =>
  Math.max(min, Math.min(max, val));
