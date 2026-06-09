import { useRef, useCallback } from 'react';

const SOUNDS = {
  eat: { frequency: 520, type: 'sine' as OscillatorType, duration: 0.1, ramp: 800 },
  combo: { frequency: 660, type: 'square' as OscillatorType, duration: 0.2, ramp: 1200 },
  powerup: { frequency: 440, type: 'triangle' as OscillatorType, duration: 0.3, ramp: 880 },
  gameover: { frequency: 200, type: 'sawtooth' as OscillatorType, duration: 0.5, ramp: 80 },
  click: { frequency: 1000, type: 'sine' as OscillatorType, duration: 0.05, ramp: 800 },
};

export const useSoundManager = () => {
  const audioCtxRef = useRef<AudioContext | null>(null);
  const volumeRef = useRef(0.3);
  const mutedRef = useRef(false);

  const getAudioContext = useCallback(() => {
    if (!audioCtxRef.current) {
      audioCtxRef.current = new AudioContext();
    }
    if (audioCtxRef.current.state === 'suspended') {
      audioCtxRef.current.resume();
    }
    return audioCtxRef.current;
  }, []);

  const playSound = useCallback((soundName: keyof typeof SOUNDS) => {
    if (mutedRef.current) return;
    try {
      const ctx = getAudioContext();
      const sound = SOUNDS[soundName];
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = sound.type;
      osc.frequency.setValueAtTime(sound.frequency, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(sound.ramp, ctx.currentTime + sound.duration);
      gain.gain.setValueAtTime(volumeRef.current, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + sound.duration);
      osc.connect(gain).connect(ctx.destination);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + sound.duration);
    } catch { /* ignore audio errors */ }
  }, [getAudioContext]);

  const setVolume = useCallback((v: number) => { volumeRef.current = v; }, []);
  const setMuted = useCallback((m: boolean) => { mutedRef.current = m; }, []);

  return { playSound, setVolume, setMuted, volumeRef, mutedRef };
};
