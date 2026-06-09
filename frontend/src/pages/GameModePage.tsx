import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { GAME_MODES } from '../utils/constants';
import ParticleBackground from '../components/ParticleBackground';
import GlassCard from '../components/GlassCard';

const GameModePage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen grid-bg relative px-4 py-12 flex flex-col items-center justify-center">
      <ParticleBackground />

      <div className="relative z-10 w-full max-w-3xl">
        <motion.div
          className="text-center mb-12"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-4xl md:text-5xl font-bold neon-text mb-3">Choose Your Mode</h1>
          <p className="text-[#94a3b8] text-lg">How do you want to eat your friends? 😈</p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {GAME_MODES.map((mode, i) => (
            <motion.div
              key={mode.id}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
            >
              <GlassCard
                hover
                onClick={() => navigate(`/game/${mode.id}`)}
                className="cursor-pointer text-center py-8 group"
              >
                <motion.div
                  className="text-5xl mb-4"
                  whileHover={{ scale: 1.2, rotate: 10 }}
                >
                  {mode.icon}
                </motion.div>
                <h3 className="text-xl font-bold mb-2" style={{ color: mode.color }}>
                  {mode.name}
                </h3>
                <p className="text-[#94a3b8] text-sm">{mode.description}</p>

                <motion.div
                  className="mt-4 opacity-0 group-hover:opacity-100 transition-opacity"
                  initial={false}
                >
                  <span
                    className="inline-block px-6 py-2 rounded-full text-sm font-bold text-white"
                    style={{ backgroundColor: mode.color }}
                  >
                    Play Now →
                  </span>
                </motion.div>
              </GlassCard>
            </motion.div>
          ))}
        </div>

        <motion.div
          className="text-center mt-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
        >
          <button
            onClick={() => navigate('/upload')}
            className="text-[#94a3b8] hover:text-white transition-colors text-sm"
          >
            ← Back to Photos
          </button>
        </motion.div>
      </div>
    </div>
  );
};

export default GameModePage;
