import React, { useRef, useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useParams, useNavigate } from 'react-router-dom';
import { Pause, Play, RotateCcw, Home, Volume2, VolumeX, Share2 } from 'lucide-react';
import { GameEngine } from '../game/GameEngine';
import { useAuth } from '../context/AuthContext';
import { useSoundManager } from '../hooks/useSoundManager';
import { GameMode, GameState } from '../types';
import { getComboMultiplier, formatTime } from '../utils/constants';
import GlassCard from '../components/GlassCard';
import toast from 'react-hot-toast';

const GamePage: React.FC = () => {
  const { mode = 'classic' } = useParams<{ mode: string }>();
  const navigate = useNavigate();
  const { playerImage, friendPhotos } = useAuth();

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<GameEngine | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [comboMultiplier, setComboMultiplier] = useState(1);
  const [friendsEaten, setFriendsEaten] = useState(0);
  const [timeSurvived, setTimeSurvived] = useState(0);
  const [isGameOver, setIsGameOver] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [started, setStarted] = useState(false);
  const [message, setMessage] = useState('');
  const [messageVisible, setMessageVisible] = useState(false);
  const [activePowerUp, setActivePowerUp] = useState('');
  const [finalState, setFinalState] = useState<GameState | null>(null);
  const [muted, setMuted] = useState(false);

  const { playSound, setMuted: setSoundMuted } = useSoundManager();

  // Time display update
  useEffect(() => {
    if (!started || isGameOver || isPaused) return;
    const interval = setInterval(() => {
      const state = engineRef.current?.getState();
      if (state) {
        setTimeSurvived(state.timeSurvived);
        setCombo(state.combo);
      }
    }, 200);
    return () => clearInterval(interval);
  }, [started, isGameOver, isPaused]);

  // Load images and init engine
  useEffect(() => {
    if (!canvasRef.current || !playerImage || friendPhotos.length === 0) return;

    const loadImage = (src: string): Promise<HTMLImageElement> => {
      return new Promise((resolve) => {
        const img = new Image();
        if (src.startsWith('http')) {
          img.crossOrigin = 'anonymous';
        }
        img.onload = () => resolve(img);
        img.onerror = (e) => {
          console.error('Failed to load image:', src.slice(0, 100), e);
          resolve(img);
        };
        img.src = src;
      });
    };

    const init = async () => {
      const playerImg = await loadImage(playerImage);
      const friendImgs = await Promise.all(friendPhotos.map(f => loadImage(f.imageUrl)));
      const friendNames = friendPhotos.map(f => f.name);

      const engine = new GameEngine(canvasRef.current!, mode as GameMode, {
        onScoreChange: (s) => setScore(s),
        onCombo: (c, m) => {
          setCombo(c);
          setComboMultiplier(m);
        },
        onFriendEaten: (_, msg) => {
          setFriendsEaten(prev => prev + 1);
          setMessage(msg);
          setMessageVisible(true);
          setTimeout(() => setMessageVisible(false), 2000);
        },
        onPowerUp: (name) => {
          setActivePowerUp(name);
          toast(`⚡ ${name} activated!`, { icon: '🎯', duration: 2000 });
          setTimeout(() => setActivePowerUp(''), 3000);
        },
        onGameOver: (state) => {
          setIsGameOver(true);
          setFinalState(state);
        },
        onAchievement: () => {},
        playSound,
      });

      engine.setPlayerImage(playerImg);
      engine.setFriendImages(friendImgs, friendNames);
      engineRef.current = engine;
    };

    init();

    return () => {
      engineRef.current?.destroy();
    };
  }, [playerImage, friendPhotos, mode, playSound]);

  const startGame = useCallback(() => {
    if (!engineRef.current) return;
    engineRef.current.start();
    setStarted(true);
    setIsGameOver(false);
    setScore(0);
    setCombo(0);
    setFriendsEaten(0);
    setTimeSurvived(0);
    setFinalState(null);
    playSound('click');
  }, [playSound]);

  const togglePause = useCallback(() => {
    if (!engineRef.current) return;
    engineRef.current.pause();
    setIsPaused(prev => !prev);
    playSound('click');
  }, [playSound]);

  const restartGame = useCallback(() => {
    if (!engineRef.current) return;
    engineRef.current.restart();
    setIsGameOver(false);
    setStarted(false);
    setScore(0);
    setCombo(0);
    setFriendsEaten(0);
    setTimeSurvived(0);
    setFinalState(null);
    setIsPaused(false);
    playSound('click');
  }, [playSound]);

  const toggleMute = () => {
    setMuted(m => {
      setSoundMuted(!m);
      return !m;
    });
  };

  // Keyboard controls
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (!engineRef.current) return;
      switch (e.key) {
        case 'ArrowUp': case 'w': case 'W':
          e.preventDefault(); engineRef.current.setDirection('up'); break;
        case 'ArrowDown': case 's': case 'S':
          e.preventDefault(); engineRef.current.setDirection('down'); break;
        case 'ArrowLeft': case 'a': case 'A':
          e.preventDefault(); engineRef.current.setDirection('left'); break;
        case 'ArrowRight': case 'd': case 'D':
          e.preventDefault(); engineRef.current.setDirection('right'); break;
        case ' ':
          e.preventDefault();
          if (!started) startGame();
          else togglePause();
          break;
        case 'r': case 'R':
          if (isGameOver) restartGame();
          break;
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [started, isGameOver, startGame, togglePause, restartGame]);

  // Touch/Swipe controls
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let startX = 0, startY = 0;

    const touchStart = (e: TouchEvent) => {
      startX = e.touches[0].clientX;
      startY = e.touches[0].clientY;
    };

    const touchEnd = (e: TouchEvent) => {
      if (!engineRef.current) return;
      const dx = e.changedTouches[0].clientX - startX;
      const dy = e.changedTouches[0].clientY - startY;
      const minSwipe = 30;

      if (Math.abs(dx) > Math.abs(dy)) {
        if (Math.abs(dx) > minSwipe) {
          engineRef.current.setDirection(dx > 0 ? 'right' : 'left');
        }
      } else {
        if (Math.abs(dy) > minSwipe) {
          engineRef.current.setDirection(dy > 0 ? 'down' : 'up');
        }
      }
    };

    canvas.addEventListener('touchstart', touchStart, { passive: true });
    canvas.addEventListener('touchend', touchEnd, { passive: true });
    return () => {
      canvas.removeEventListener('touchstart', touchStart);
      canvas.removeEventListener('touchend', touchEnd);
    };
  }, []);

  const shareScore = () => {
    const text = `🐍 I scored ${score} points in Friend Snake Game! I ate ${friendsEaten} friends 😂\nCan you beat me? Play now!`;
    if (navigator.share) {
      navigator.share({ title: 'Friend Snake Game', text, url: window.location.origin });
    } else {
      navigator.clipboard.writeText(text);
      toast.success('Score copied to clipboard!');
    }
  };

  const comboData = getComboMultiplier(combo);

  return (
    <div className="min-h-screen bg-[#0a0e1a] flex flex-col items-center justify-center px-2 py-4" ref={containerRef}>
      {/* HUD */}
      <div className="w-full max-w-[600px] mb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="glass px-4 py-2 rounded-xl">
              <span className="text-[#94a3b8] text-xs">SCORE</span>
              <p className="text-xl font-bold text-white">{score}</p>
            </div>
            <div className="glass px-4 py-2 rounded-xl">
              <span className="text-[#94a3b8] text-xs">EATEN</span>
              <p className="text-xl font-bold text-[#FF4D8D]">{friendsEaten}</p>
            </div>
            <div className="glass px-4 py-2 rounded-xl hidden sm:block">
              <span className="text-[#94a3b8] text-xs">TIME</span>
              <p className="text-xl font-bold text-[#00E5FF]">{formatTime(timeSurvived)}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={toggleMute} className="glass p-2 rounded-lg hover:bg-white/10 transition-colors">
              {muted ? <VolumeX size={18} /> : <Volume2 size={18} />}
            </button>
            {started && (
              <button onClick={togglePause} className="glass p-2 rounded-lg hover:bg-white/10 transition-colors">
                {isPaused ? <Play size={18} /> : <Pause size={18} />}
              </button>
            )}
          </div>
        </div>

        {/* Combo bar */}
        <AnimatePresence>
          {combo >= 2 && (
            <motion.div
              className="mt-2 text-center"
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.5 }}
            >
              <span
                className="inline-block px-4 py-1 rounded-full text-sm font-black animate-combo-pop"
                style={{ backgroundColor: comboData.color, color: '#0a0e1a' }}
              >
                🔥 {comboData.label}
              </span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Active power-up */}
        <AnimatePresence>
          {activePowerUp && (
            <motion.div
              className="mt-2 text-center"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <span className="inline-block px-4 py-1 rounded-full text-sm font-bold glass text-[#FFB800]">
                ⚡ {activePowerUp}
              </span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* CANVAS */}
      <div className="relative w-full max-w-[600px] aspect-square">
        <canvas
          ref={canvasRef}
          className="game-canvas w-full h-full rounded-2xl"
          style={{ touchAction: 'none' }}
        />

        {/* Floating message */}
        <AnimatePresence>
          {messageVisible && (
            <motion.div
              className="absolute top-4 left-1/2 -translate-x-1/2 z-20"
              initial={{ opacity: 0, y: -20, scale: 0.8 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -30 }}
            >
              <span className="glass-strong px-5 py-2 rounded-full text-sm font-bold text-white whitespace-nowrap">
                {message}
              </span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Start overlay */}
        {!started && !isGameOver && (
          <motion.div
            className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 rounded-2xl"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <motion.div
              className="text-6xl mb-6"
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ repeat: Infinity, duration: 1.5 }}
            >
              🐍
            </motion.div>
            <h2 className="text-2xl font-bold mb-2 capitalize">{mode} Mode</h2>
            <p className="text-[#94a3b8] mb-6 text-sm">
              {mode === 'ai' ? 'Watch the AI play!' : 'Swipe or use arrow keys'}
            </p>
            <motion.button
              className="btn-accent px-10 py-4 text-lg"
              onClick={startGame}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              ▶ START
            </motion.button>
          </motion.div>
        )}

        {/* Game Over overlay */}
        <AnimatePresence>
          {isGameOver && (
            <motion.div
              className="absolute inset-0 flex items-center justify-center bg-black/70 rounded-2xl z-30"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <GlassCard className="mx-4 text-center max-w-sm w-full" neon="accent">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', delay: 0.2 }}
                >
                  <h2 className="text-3xl font-black mb-1 text-[#FF4D8D]">Game Over!</h2>
                  <p className="text-[#94a3b8] text-sm mb-6">Your snake crashed 💀</p>

                  <div className="grid grid-cols-2 gap-3 mb-6">
                    <div className="glass p-3 rounded-xl">
                      <p className="text-[#94a3b8] text-xs">Score</p>
                      <p className="text-2xl font-black text-white">{finalState?.score || score}</p>
                    </div>
                    <div className="glass p-3 rounded-xl">
                      <p className="text-[#94a3b8] text-xs">Friends Eaten</p>
                      <p className="text-2xl font-black text-[#FF4D8D]">{finalState?.friendsEaten || friendsEaten}</p>
                    </div>
                    <div className="glass p-3 rounded-xl">
                      <p className="text-[#94a3b8] text-xs">Max Combo</p>
                      <p className="text-2xl font-black text-[#FFB800]">x{getComboMultiplier(finalState?.combo || combo).multiplier}</p>
                    </div>
                    <div className="glass p-3 rounded-xl">
                      <p className="text-[#94a3b8] text-xs">Time</p>
                      <p className="text-2xl font-black text-[#00E5FF]">{formatTime(finalState?.timeSurvived || timeSurvived)}</p>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <button onClick={restartGame} className="btn-primary flex-1 flex items-center justify-center gap-2 text-sm">
                      <RotateCcw size={16} /> Play Again
                    </button>
                    <button onClick={shareScore} className="btn-secondary flex-1 flex items-center justify-center gap-2 text-sm">
                      <Share2 size={16} /> Share
                    </button>
                  </div>
                  <button onClick={() => navigate('/')} className="mt-3 text-[#94a3b8] hover:text-white text-sm flex items-center justify-center gap-1 mx-auto transition-colors">
                    <Home size={14} /> Home
                  </button>
                </motion.div>
              </GlassCard>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Mobile virtual buttons */}
      <div className="mt-4 sm:hidden">
        <div className="flex flex-col items-center gap-2">
          <button
            onTouchStart={() => engineRef.current?.setDirection('up')}
            className="glass w-14 h-14 rounded-xl flex items-center justify-center text-2xl active:bg-white/10"
          >
            ↑
          </button>
          <div className="flex gap-2">
            <button
              onTouchStart={() => engineRef.current?.setDirection('left')}
              className="glass w-14 h-14 rounded-xl flex items-center justify-center text-2xl active:bg-white/10"
            >
              ←
            </button>
            <button
              onTouchStart={() => engineRef.current?.setDirection('down')}
              className="glass w-14 h-14 rounded-xl flex items-center justify-center text-2xl active:bg-white/10"
            >
              ↓
            </button>
            <button
              onTouchStart={() => engineRef.current?.setDirection('right')}
              className="glass w-14 h-14 rounded-xl flex items-center justify-center text-2xl active:bg-white/10"
            >
              →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GamePage;
