import { useCallback, useRef } from 'react';

type SoundType = 'complete' | 'alert' | 'warning' | 'critical' | 'fail' | 'tick';

export function useSoundEffects() {
  const audioContextRef = useRef<AudioContext | null>(null);

  const getAudioContext = useCallback(() => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    return audioContextRef.current;
  }, []);

  const playTone = useCallback((
    frequency: number,
    duration: number,
    type: OscillatorType = 'sine',
    volume: number = 0.3,
    delay: number = 0
  ) => {
    const ctx = getAudioContext();
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, ctx.currentTime + delay);

    gainNode.gain.setValueAtTime(0, ctx.currentTime + delay);
    gainNode.gain.linearRampToValueAtTime(volume, ctx.currentTime + delay + 0.01);
    gainNode.gain.linearRampToValueAtTime(0, ctx.currentTime + delay + duration);

    oscillator.start(ctx.currentTime + delay);
    oscillator.stop(ctx.currentTime + delay + duration);
  }, [getAudioContext]);

  const playSound = useCallback((sound: SoundType) => {
    switch (sound) {
      case 'complete':
        // Success chime - ascending notes
        playTone(523, 0.1, 'sine', 0.2, 0);      // C5
        playTone(659, 0.1, 'sine', 0.2, 0.08);   // E5
        playTone(784, 0.15, 'sine', 0.25, 0.16); // G5
        break;

      case 'alert':
        // New alert - attention beep
        playTone(440, 0.08, 'square', 0.15, 0);
        playTone(550, 0.08, 'square', 0.15, 0.1);
        break;

      case 'warning':
        // Warning - pulsing tone
        playTone(380, 0.15, 'sawtooth', 0.2, 0);
        playTone(380, 0.15, 'sawtooth', 0.2, 0.2);
        break;

      case 'critical':
        // Critical alert - urgent alarm
        playTone(800, 0.1, 'square', 0.25, 0);
        playTone(600, 0.1, 'square', 0.25, 0.12);
        playTone(800, 0.1, 'square', 0.25, 0.24);
        playTone(600, 0.1, 'square', 0.25, 0.36);
        break;

      case 'fail':
        // Failure - descending sad tone
        playTone(400, 0.15, 'sine', 0.2, 0);
        playTone(300, 0.15, 'sine', 0.2, 0.12);
        playTone(200, 0.25, 'sine', 0.25, 0.24);
        break;

      case 'tick':
        // Timer tick - subtle click
        playTone(1000, 0.02, 'sine', 0.05, 0);
        break;
    }
  }, [playTone]);

  return { playSound };
}
