import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Trophy, Medal, Clock, Flame, ChevronLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { scoresAPI } from '../utils/api';
import { LeaderboardEntry } from '../types';
import ParticleBackground from '../components/ParticleBackground';
import GlassCard from '../components/GlassCard';

const tabs = [
  { id: 'global', label: 'Global', icon: <Trophy size={16} /> },
  { id: 'weekly', label: 'Weekly', icon: <Clock size={16} /> },
  { id: 'monthly', label: 'Monthly', icon: <Medal size={16} /> },
];

const LeaderboardPage: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('global');
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      setLoading(true);
      try {
        const { data } = await scoresAPI.leaderboard(activeTab, 'classic', 20);
        setEntries(data.scores || []);
      } catch {
        // Use mock data if API unavailable
        setEntries([
          { _id: '1', username: 'SnakeKing', avatar: '', score: 2450, mode: 'classic', friendsEaten: 45, maxCombo: 8, createdAt: new Date().toISOString() },
          { _id: '2', username: 'FriendEater', avatar: '', score: 1890, mode: 'classic', friendsEaten: 32, maxCombo: 6, createdAt: new Date().toISOString() },
          { _id: '3', username: 'ChaosLord', avatar: '', score: 1650, mode: 'classic', friendsEaten: 28, maxCombo: 5, createdAt: new Date().toISOString() },
          { _id: '4', username: 'NeonViper', avatar: '', score: 1200, mode: 'classic', friendsEaten: 22, maxCombo: 4, createdAt: new Date().toISOString() },
          { _id: '5', username: 'PixelSnake', avatar: '', score: 980, mode: 'classic', friendsEaten: 18, maxCombo: 3, createdAt: new Date().toISOString() },
        ]);
      } finally {
        setLoading(false);
      }
    };
    fetchLeaderboard();
  }, [activeTab]);

  const getRankStyle = (i: number) => {
    if (i === 0) return { bg: 'rgba(255, 184, 0, 0.15)', border: '#FFB800', badge: '🥇' };
    if (i === 1) return { bg: 'rgba(192, 192, 192, 0.1)', border: '#C0C0C0', badge: '🥈' };
    if (i === 2) return { bg: 'rgba(205, 127, 50, 0.1)', border: '#CD7F32', badge: '🥉' };
    return { bg: 'rgba(255,255,255,0.03)', border: 'rgba(255,255,255,0.05)', badge: `#${i + 1}` };
  };

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
          <div>
            <h1 className="text-3xl font-bold neon-text">🏆 Leaderboard</h1>
            <p className="text-[#94a3b8] text-sm">Top snake players worldwide</p>
          </div>
        </motion.div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                activeTab === tab.id
                  ? 'bg-[#6C63FF] text-white shadow-lg shadow-[#6C63FF]/30'
                  : 'glass text-[#94a3b8] hover:text-white'
              }`}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>

        {/* Entries */}
        <div className="space-y-3">
          {loading ? (
            <div className="text-center py-20">
              <div className="w-8 h-8 border-2 border-[#6C63FF] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              <p className="text-[#94a3b8]">Loading leaderboard...</p>
            </div>
          ) : (
            entries.map((entry, i) => {
              const style = getRankStyle(i);
              return (
                <motion.div
                  key={entry._id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <div
                    className="flex items-center gap-4 p-4 rounded-xl border transition-all hover:scale-[1.01]"
                    style={{ backgroundColor: style.bg, borderColor: style.border }}
                  >
                    <span className="text-2xl w-10 text-center">{style.badge}</span>
                    <div className="w-10 h-10 rounded-full bg-[rgba(108,99,255,0.2)] flex items-center justify-center text-lg font-bold">
                      {entry.avatar ? (
                        <img src={entry.avatar} alt="" className="w-full h-full rounded-full object-cover" />
                      ) : (
                        entry.username[0]?.toUpperCase()
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-white truncate">{entry.username}</p>
                      <p className="text-xs text-[#94a3b8]">
                        {entry.friendsEaten} friends • x{entry.maxCombo} combo
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-black" style={{ color: i < 3 ? style.border : '#ffffff' }}>
                        {entry.score.toLocaleString()}
                      </p>
                      <p className="text-xs text-[#94a3b8]">pts</p>
                    </div>
                  </div>
                </motion.div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

export default LeaderboardPage;
