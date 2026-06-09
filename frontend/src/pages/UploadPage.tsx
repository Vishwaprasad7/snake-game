import React, { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useDropzone } from 'react-dropzone';
import Cropper from 'react-easy-crop';
import { Upload, RotateCw, ZoomIn, ZoomOut, Check, ArrowRight, X, Plus, Trash2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import ParticleBackground from '../components/ParticleBackground';
import GlassCard from '../components/GlassCard';
import toast from 'react-hot-toast';

// Helper to get cropped image
const getCroppedImg = (imageSrc: string, crop: any): Promise<string> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = crop.width;
      canvas.height = crop.height;
      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(img, crop.x, crop.y, crop.width, crop.height, 0, 0, crop.width, crop.height);
      resolve(canvas.toDataURL('image/jpeg', 0.9));
    };
    img.src = imageSrc;
  });
};

const UploadPage: React.FC = () => {
  const navigate = useNavigate();
  const { playerImage, setPlayerImage, friendPhotos, setFriendPhotos } = useAuth();

  // Player image state
  const [playerSrc, setPlayerSrc] = useState<string | null>(playerImage);
  const [cropMode, setCropMode] = useState(false);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [croppedArea, setCroppedArea] = useState<any>(null);

  // Friend photos state
  const [friendPreviews, setFriendPreviews] = useState<{ id: string; url: string; name: string }[]>(
    friendPhotos.map(f => ({ id: f._id, url: f.imageUrl, name: f.name }))
  );
  const [step, setStep] = useState<'player' | 'friends'>(playerImage ? 'friends' : 'player');

  // Player dropzone
  const onPlayerDrop = useCallback((files: File[]) => {
    if (files[0]) {
      const reader = new FileReader();
      reader.onload = () => {
        setPlayerSrc(reader.result as string);
        setCropMode(true);
      };
      reader.readAsDataURL(files[0]);
    }
  }, []);

  const { getRootProps: getPlayerProps, getInputProps: getPlayerInput } = useDropzone({
    onDrop: onPlayerDrop,
    accept: { 'image/*': [] },
    maxFiles: 1,
    maxSize: 10 * 1024 * 1024,
  });

  const handleCropComplete = useCallback((_: any, croppedPixels: any) => {
    setCroppedArea(croppedPixels);
  }, []);

  const saveCrop = async () => {
    if (!playerSrc || !croppedArea) return;
    const cropped = await getCroppedImg(playerSrc, croppedArea);
    setPlayerSrc(cropped);
    setPlayerImage(cropped);
    setCropMode(false);
    toast.success('Looking good! 😎');
    setStep('friends');
  };

  // Friend dropzone
  const onFriendDrop = useCallback((files: File[]) => {
    const remaining = 50 - friendPreviews.length;
    const toAdd = files.slice(0, remaining);
    toAdd.forEach(file => {
      const reader = new FileReader();
      reader.onload = () => {
        const newFriend = {
          id: `local-${Date.now()}-${Math.random()}`,
          url: reader.result as string,
          name: file.name.replace(/\.[^.]+$/, ''),
        };
        setFriendPreviews(prev => [...prev, newFriend]);
      };
      reader.readAsDataURL(file);
    });
  }, [friendPreviews.length]);

  const { getRootProps: getFriendProps, getInputProps: getFriendInput } = useDropzone({
    onDrop: onFriendDrop,
    accept: { 'image/*': [] },
    maxFiles: 50,
    maxSize: 10 * 1024 * 1024,
  });

  const removeFriend = (id: string) => {
    setFriendPreviews(prev => prev.filter(f => f.id !== id));
  };

  const startGame = () => {
    if (!playerSrc) {
      toast.error('Please upload your photo first!');
      return;
    }
    if (friendPreviews.length === 0) {
      toast.error('Add at least one friend photo!');
      return;
    }
    // Store locally for the game
    setPlayerImage(playerSrc);
    setFriendPhotos(friendPreviews.map((f, i) => ({
      _id: f.id,
      name: f.name,
      imageUrl: f.url,
      order: i,
    })));
    navigate('/mode');
  };

  return (
    <div className="min-h-screen grid-bg relative px-4 py-8">
      <ParticleBackground />

      <div className="relative z-10 max-w-2xl mx-auto">
        {/* Header */}
        <motion.div
          className="text-center mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-3xl md:text-4xl font-bold neon-text mb-2">
            {step === 'player' ? '📸 Upload Your Photo' : '👥 Add Friend Photos'}
          </h1>
          <p className="text-[#94a3b8]">
            {step === 'player'
              ? 'Your face becomes the snake head!'
              : 'These become the food items 😂'}
          </p>
        </motion.div>

        {/* Step Tabs */}
        <div className="flex justify-center gap-4 mb-8">
          {['player', 'friends'].map((s) => (
            <button
              key={s}
              onClick={() => setStep(s as any)}
              className={`px-6 py-2 rounded-full text-sm font-semibold transition-all ${
                step === s
                  ? 'bg-[#6C63FF] text-white shadow-lg shadow-[#6C63FF]/30'
                  : 'glass text-[#94a3b8] hover:text-white'
              }`}
            >
              {s === 'player' ? '1. Your Photo' : '2. Friends'}
            </button>
          ))}
        </div>

        {/* PLAYER UPLOAD */}
        {step === 'player' && (
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3 }}
          >
            {cropMode && playerSrc ? (
              <GlassCard neon="primary">
                <div className="relative w-full aspect-square max-h-[400px] rounded-xl overflow-hidden mb-4">
                  <Cropper
                    image={playerSrc}
                    crop={crop}
                    zoom={zoom}
                    rotation={rotation}
                    aspect={1}
                    cropShape="round"
                    onCropChange={setCrop}
                    onZoomChange={setZoom}
                    onCropComplete={handleCropComplete}
                  />
                </div>

                <div className="flex items-center justify-center gap-4 mb-4">
                  <button onClick={() => setZoom(z => Math.max(1, z - 0.1))} className="glass p-2 rounded-lg hover:bg-white/10">
                    <ZoomOut size={20} />
                  </button>
                  <input
                    type="range" min="1" max="3" step="0.1"
                    value={zoom} onChange={e => setZoom(Number(e.target.value))}
                    className="w-32 accent-[#6C63FF]"
                  />
                  <button onClick={() => setZoom(z => Math.min(3, z + 0.1))} className="glass p-2 rounded-lg hover:bg-white/10">
                    <ZoomIn size={20} />
                  </button>
                  <button onClick={() => setRotation(r => r + 90)} className="glass p-2 rounded-lg hover:bg-white/10">
                    <RotateCw size={20} />
                  </button>
                </div>

                <div className="flex gap-3">
                  <button onClick={() => setCropMode(false)} className="btn-secondary flex-1 flex items-center justify-center gap-2">
                    <X size={18} /> Cancel
                  </button>
                  <button onClick={saveCrop} className="btn-primary flex-1 flex items-center justify-center gap-2">
                    <Check size={18} /> Save
                  </button>
                </div>
              </GlassCard>
            ) : (
              <GlassCard neon="primary">
                {playerSrc ? (
                  <div className="text-center">
                    <div className="w-40 h-40 mx-auto rounded-full overflow-hidden border-4 border-[#6C63FF] shadow-lg shadow-[#6C63FF]/30 mb-4">
                      <img src={playerSrc} alt="You" className="w-full h-full object-cover" />
                    </div>
                    <p className="text-[#00FF88] font-semibold mb-4">✓ Looking great!</p>
                    <div className="flex gap-3 justify-center">
                      <div {...getPlayerProps()} className="cursor-pointer">
                        <input {...getPlayerInput()} />
                        <button className="btn-secondary text-sm">Change Photo</button>
                      </div>
                      <button onClick={() => { setCropMode(true); }} className="btn-secondary text-sm">
                        Re-crop
                      </button>
                      <button onClick={() => setStep('friends')} className="btn-primary text-sm flex items-center gap-1">
                        Next <ArrowRight size={16} />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div {...getPlayerProps()} className="cursor-pointer text-center py-12 border-2 border-dashed border-[rgba(255,255,255,0.15)] rounded-xl hover:border-[#6C63FF] transition-colors">
                    <input {...getPlayerInput()} />
                    <Upload size={48} className="mx-auto mb-4 text-[#6C63FF]" />
                    <p className="text-lg font-semibold mb-1">Drop your photo here</p>
                    <p className="text-[#94a3b8] text-sm">or click to browse</p>
                  </div>
                )}
              </GlassCard>
            )}
          </motion.div>
        )}

        {/* FRIEND UPLOAD */}
        {step === 'friends' && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3 }}
          >
            <GlassCard neon="accent">
              <div {...getFriendProps()} className="cursor-pointer text-center py-8 border-2 border-dashed border-[rgba(255,255,255,0.15)] rounded-xl hover:border-[#FF4D8D] transition-colors mb-6">
                <input {...getFriendInput()} />
                <Plus size={36} className="mx-auto mb-2 text-[#FF4D8D]" />
                <p className="font-semibold">Add Friend Photos</p>
                <p className="text-[#94a3b8] text-sm">{friendPreviews.length}/50 photos</p>
              </div>

              {friendPreviews.length > 0 && (
                <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-3">
                  {friendPreviews.map((friend, i) => (
                    <motion.div
                      key={friend.id}
                      className="relative group"
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: i * 0.03 }}
                    >
                      <div className="aspect-square rounded-full overflow-hidden border-2 border-[#FF4D8D]/50">
                        <img src={friend.url} alt={friend.name} className="w-full h-full object-cover" />
                      </div>
                      <button
                        onClick={() => removeFriend(friend.id)}
                        className="absolute -top-1 -right-1 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Trash2 size={12} />
                      </button>
                      <p className="text-[10px] text-center text-[#94a3b8] mt-1 truncate">{friend.name}</p>
                    </motion.div>
                  ))}
                </div>
              )}
            </GlassCard>

            {/* Start Game Button */}
            <motion.div className="mt-8 text-center">
              <motion.button
                className="btn-accent text-lg px-12 py-4"
                onClick={startGame}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                disabled={!playerSrc || friendPreviews.length === 0}
                style={{
                  opacity: (!playerSrc || friendPreviews.length === 0) ? 0.5 : 1,
                }}
              >
                🎮 Choose Game Mode
              </motion.button>
            </motion.div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default UploadPage;
