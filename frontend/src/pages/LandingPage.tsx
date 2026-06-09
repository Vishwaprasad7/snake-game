import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Gamepad2, Upload, Trophy, Users, Zap, Shield } from 'lucide-react';
import ParticleBackground from '../components/ParticleBackground';
import GlassCard from '../components/GlassCard';

const features = [
  { icon: <Upload size={28} />, title: 'Upload Faces', desc: 'Your face becomes the snake, friends become food!' },
  { icon: <Gamepad2 size={28} />, title: '5 Game Modes', desc: 'Classic, Survival, Time Attack, Chaos & AI' },
  { icon: <Zap size={28} />, title: 'Power-Ups', desc: 'Speed boost, magnet, shield, freeze & more' },
  { icon: <Trophy size={28} />, title: 'Leaderboards', desc: 'Compete globally and challenge friends' },
  { icon: <Users size={28} />, title: 'Social Sharing', desc: 'Share your scores on WhatsApp & Instagram' },
  { icon: <Shield size={28} />, title: 'Achievements', desc: 'Unlock badges and become the Snake King' },
];

const LandingPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen grid-bg relative overflow-hidden">
      <ParticleBackground />

      <div className="relative z-10">
        {/* HERO */}
        <section className="min-h-screen flex flex-col items-center justify-center px-4 text-center">
          {/* Animated Logo */}
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.2 }}
            className="text-7xl mb-6"
          >
            🐍
          </motion.div>

          <motion.h1
            className="text-5xl md:text-7xl font-black mb-4 neon-text"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.6 }}
            style={{
              background: 'linear-gradient(135deg, #6C63FF 0%, #00E5FF 50%, #FF4D8D 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            Friend Snake Game
          </motion.h1>

          <motion.p
            className="text-xl md:text-2xl text-[#94a3b8] mb-10 max-w-lg"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.5 }}
          >
            Turn yourself into a snake and eat your friends 😂
          </motion.p>

          <motion.button
            className="btn-accent text-lg md:text-xl px-12 py-5 rounded-2xl"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.8, type: 'spring', stiffness: 300 }}
            whileHover={{ scale: 1.05, boxShadow: '0 0 50px rgba(255, 77, 141, 0.5)' }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate('/auth')}
          >
            🎮 Start Playing
          </motion.button>

          {/* Scroll indicator */}
          <motion.div
            className="absolute bottom-8 flex flex-col items-center text-[#94a3b8]"
            animate={{ y: [0, 10, 0] }}
            transition={{ repeat: Infinity, duration: 2 }}
          >
            <span className="text-sm mb-2">Scroll to explore</span>
            <span>↓</span>
          </motion.div>
        </section>

        {/* FEATURES */}
        <section className="py-24 px-4 max-w-6xl mx-auto">
          <motion.h2
            className="text-3xl md:text-4xl font-bold text-center mb-16 neon-text"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
          >
            Why You'll <span className="text-[#FF4D8D]">Love</span> It
          </motion.h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
              >
                <GlassCard hover className="h-full cursor-default">
                  <div className="text-[#6C63FF] mb-4">{f.icon}</div>
                  <h3 className="text-lg font-bold mb-2">{f.title}</h3>
                  <p className="text-[#94a3b8] text-sm">{f.desc}</p>
                </GlassCard>
              </motion.div>
            ))}
          </div>
        </section>

        {/* HOW IT WORKS */}
        <section className="py-24 px-4 max-w-4xl mx-auto text-center">
          <motion.h2
            className="text-3xl md:text-4xl font-bold mb-16 neon-text"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
          >
            How It Works
          </motion.h2>

          <div className="flex flex-col md:flex-row items-center justify-center gap-8 md:gap-4">
            {[
              { step: '1', title: 'Upload Your Face', icon: '📸' },
              { step: '2', title: 'Add Friend Photos', icon: '👥' },
              { step: '3', title: 'Choose Game Mode', icon: '🎮' },
              { step: '4', title: 'Eat Your Friends!', icon: '🐍' },
            ].map((item, i) => (
              <motion.div
                key={i}
                className="flex flex-col items-center"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15 }}
              >
                <div className="w-20 h-20 rounded-full glass-strong flex items-center justify-center text-3xl mb-3 animate-float" style={{ animationDelay: `${i * 0.3}s` }}>
                  {item.icon}
                </div>
                <span className="text-[#6C63FF] font-bold text-sm mb-1">Step {item.step}</span>
                <span className="text-white font-semibold text-sm">{item.title}</span>
                {i < 3 && <span className="hidden md:block text-[#94a3b8] text-2xl mt-4 mx-4">→</span>}
              </motion.div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="py-24 px-4 text-center">
          <GlassCard className="max-w-xl mx-auto text-center" neon="accent">
            <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}>
              <h2 className="text-2xl md:text-3xl font-bold mb-4">Ready to Play? 🎮</h2>
              <p className="text-[#94a3b8] mb-8">It's free, fun, and your friends will hate you for it 😈</p>
              <button
                className="btn-primary text-lg px-10 py-4"
                onClick={() => navigate('/auth')}
              >
                Get Started Now
              </button>
            </motion.div>
          </GlassCard>
        </section>

        {/* Footer */}
        <footer className="py-8 text-center text-[#94a3b8] text-sm border-t border-[rgba(255,255,255,0.05)]">
          <p>Friend Snake Game © {new Date().getFullYear()} — Made with 🐍 and ❤️</p>
        </footer>
      </div>
    </div>
  );
};

export default LandingPage;
