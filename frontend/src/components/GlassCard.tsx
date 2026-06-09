import React from 'react';
import { motion } from 'framer-motion';

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
  onClick?: () => void;
  neon?: 'primary' | 'accent' | 'success' | 'none';
}

const neonColors = {
  primary: 'rgba(108, 99, 255, 0.3)',
  accent: 'rgba(255, 77, 141, 0.3)',
  success: 'rgba(0, 255, 136, 0.3)',
  none: 'transparent',
};

const GlassCard: React.FC<GlassCardProps> = ({
  children, className = '', hover = false, onClick, neon = 'none',
}) => {
  return (
    <motion.div
      className={`glass p-6 ${className}`}
      style={{
        boxShadow: neon !== 'none' ? `0 0 20px ${neonColors[neon]}, inset 0 0 20px ${neonColors[neon]}33` : undefined,
      }}
      whileHover={hover ? { scale: 1.02, y: -4 } : undefined}
      whileTap={onClick ? { scale: 0.98 } : undefined}
      onClick={onClick}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      {children}
    </motion.div>
  );
};

export default GlassCard;
