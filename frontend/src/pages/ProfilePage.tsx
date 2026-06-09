import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Trophy, Target, Clock, Flame, Star, Gamepad2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { ACHIEVEMENT_DEFINITIONS } from '../utils/constants';
import ParticleBackground from '../components/ParticleBackground';
import GlassCard from '../components/GlassCard';

const ProfilePage: React.FC = () => {
  const navigate = useNavigate();
  const { user, playerImage, logout } = useAuth();

  const stats = user?.stats || {
    totalGames: 0,
    totalFriendsEaten: 0,
    highestScore: 0,
    totalTimePlayed: 0,
    maxCombo: 0,
  };

  const statCards = [
    { label: 'Games Played', value: stats.totalGames, icon: <Gamepad2 size={20} />, color: '#6C63FF' },
    { label: 'Friends Eaten', value: stats.totalFriendsEaten, icon: <Target size={20} />, color: '#FF4D8D' },
    { label: 'Highest Score', value: stats.highestScore, icon: <Trophy size={20} />, color: '#FFB800' },
    { label: 'Max Combo', value: `x${stats.maxCombo}`, icon: <Flame size={20} />, color: '#00FF88' },
    { label: 'Time Played', value: `${Math.floor(stats.totalTimePlayed / 60)}m`, icon: <Clock size={20} />, color: '#00E5FF' },
  ];

  const userAchievements = user?.achievements?.map(a => a.type) || [];

  return (
    <div className="min-h-screen grid-bg relative px-4 py-8">
      <ParticleBackground />

      <div className="relative z-10 max-w-2xl mx-auto">
        <motion.div
          className="flex items-center gap-4 mb-8"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
        >
          <button onClick={() => navigate('/')} className="glass p-2 rounded-xl hover:bg-white/10">
            <ChevronLeft size={20} />
          </button>
          <h1 className="text-3xl font-bold neon-text">Profile</h1>
        </motion.div>

        {/* User Card */}
        <GlassCard className="mb-8 text-center" neon="primary">
          <div className="w-24 h-24 mx-auto rounded-full overflow-hidden border-4 border-[#6C63FF] shadow-lg shadow-[#6C63FF]/30 mb-4">
            {playerImage ? (
              <img src={playerImage} alt="Avatar" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-[rgba(108,99,255,0.2)] flex items-center justify-center text-3xl">
                🐍
              </div>
            )}
          </div>
          <h2 className="text-2xl font-bold">{user?.username || 'Guest Snake'}</h2>
          <p className="text-[#94a3b8] text-sm">{user?.email || 'Playing as guest'}</p>
        </GlassCard>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-8">
          {statCards.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
            >
              <GlassCard className="text-center py-4">
                <div className="mb-2 mx-auto" style={{ color: stat.color }}>{stat.icon}</div>
                <p className="text-2xl font-black" style={{ color: stat.color }}>{stat.value}</p>
                <p className="text-[#94a3b8] text-xs mt-1">{stat.label}</p>
              </GlassCard>
            </motion.div>
          ))}
        </div>

        {/* Achievements */}
        <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
          <Star size={20} className="text-[#FFB800]" /> Achievements
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-8">
          {ACHIEVEMENT_DEFINITIONS.map((ach, i) => {
            const unlocked = userAchievements.includes(ach.type);
            return (
              <motion.div
                key={ach.type}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <div className={`glass p-4 rounded-xl flex items-center gap-3 ${unlocked ? '' : 'opacity-40'}`}>
                  <span className="text-2xl">{ach.icon}</span>
                  <div>
                    <p className="font-bold text-sm">{ach.title}</p>
                    <p className="text-[#94a3b8] text-xs">{ach.description}</p>
                  </div>
                  {unlocked && <span className="ml-auto text-[#00FF88]">✓</span>}
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Actions */}
        <div className="flex gap-4 justify-center">
          <button onClick={() => navigate('/upload')} className="btn-primary">
            🎮 Play Again
          </button>
          <button onClick={() => navigate('/leaderboard')} className="btn-secondary">
            🏆 Leaderboard
          </button>
        </div>

        {user && !user.isGuest && (
          <div className="text-center mt-8">
            <button
              onClick={() => { logout(); navigate('/'); }}
              className="text-[#94a3b8] hover:text-red-400 text-sm transition-colors"
            >
              Sign Out
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProfilePage;
