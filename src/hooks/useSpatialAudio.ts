import { useCallback, useRef, useEffect } from 'react';
import { useAccessibility } from '@/contexts/AccessibilityContext';
import { TaskType, AlertUrgency } from '@/types/game';
import { 
  TASK_AUDIO_SIGNATURES, 
  URGENCY_MODIFIERS,
  TaskAudioSignature,
  UrgencyAudioModifier 
} from '@/types/accessibility';

interface SpatialAudioOptions {
  frequency?: number;
  duration?: number;
  waveform?: OscillatorType;
  volume?: number;
  pan?: number; // -1 (left) to 1 (right)
  delay?: number;
}

export function useSpatialAudio() {
  const { state } = useAccessibility();
  const audioContextRef = useRef<AudioContext | null>(null);
  const droneNodeRef = useRef<OscillatorNode | null>(null);
  const droneGainRef = useRef<GainNode | null>(null);
  const heartbeatRef = useRef<NodeJS.Timeout | null>(null);

  const getAudioContext = useCallback(() => {
    if (!audioContextRef.current || audioContextRef.current.state === 'closed') {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (audioContextRef.current.state === 'suspended') {
      audioContextRef.current.resume();
    }
    return audioContextRef.current;
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (heartbeatRef.current) clearInterval(heartbeatRef.current);
      if (droneNodeRef.current) {
        try { droneNodeRef.current.stop(); } catch {}
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  // Play a spatial tone with panning
  const playSpatialTone = useCallback((options: SpatialAudioOptions) => {
    if (state.muted) return;
    
    const ctx = getAudioContext();
    const {
      frequency = 440,
      duration = 0.1,
      waveform = 'sine',
      volume = 0.3,
      pan = 0,
      delay = 0,
    } = options;

    const adjustedVolume = volume * state.masterVolume;

    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();
    const pannerNode = ctx.createStereoPanner();

    oscillator.connect(gainNode);
    gainNode.connect(pannerNode);
    pannerNode.connect(ctx.destination);

    oscillator.type = waveform;
    oscillator.frequency.setValueAtTime(frequency, ctx.currentTime + delay);
    
    if (state.spatialEnabled) {
      pannerNode.pan.setValueAtTime(pan, ctx.currentTime + delay);
    }

    gainNode.gain.setValueAtTime(0, ctx.currentTime + delay);
    gainNode.gain.linearRampToValueAtTime(adjustedVolume, ctx.currentTime + delay + 0.01);
    gainNode.gain.linearRampToValueAtTime(0, ctx.currentTime + delay + duration);

    oscillator.start(ctx.currentTime + delay);
    oscillator.stop(ctx.currentTime + delay + duration);
  }, [getAudioContext, state.muted, state.masterVolume, state.spatialEnabled]);

  // Play task-specific audio signature
  const playTaskAudio = useCallback((taskType: TaskType, urgency: AlertUrgency = 'medium') => {
    if (state.muted) return;

    const signature = TASK_AUDIO_SIGNATURES[taskType];
    const modifier = URGENCY_MODIFIERS[urgency];
    
    const adjustedFrequency = signature.baseFrequency * modifier.pitchMultiplier;
    const adjustedVolume = modifier.volumeMultiplier;
    const tempo = 0.15 / modifier.tempoMultiplier;

    switch (signature.pattern) {
      case 'click':
        // Short crisp clicks (typing)
        playSpatialTone({
          frequency: adjustedFrequency,
          duration: 0.03,
          waveform: 'square',
          volume: adjustedVolume * 0.4,
          pan: signature.panPosition,
        });
        break;

      case 'whoosh':
        // Sliding tone (drag)
        playSpatialTone({
          frequency: adjustedFrequency * 0.5,
          duration: 0.2,
          waveform: 'sine',
          volume: adjustedVolume * 0.5,
          pan: signature.panPosition,
        });
        playSpatialTone({
          frequency: adjustedFrequency,
          duration: 0.1,
          waveform: 'sine',
          volume: adjustedVolume * 0.6,
          pan: signature.panPosition,
          delay: 0.15,
        });
        break;

      case 'chime':
        // Ascending chimes (sort)
        [1, 1.25, 1.5].forEach((mult, i) => {
          playSpatialTone({
            frequency: adjustedFrequency * mult,
            duration: tempo,
            waveform: 'sine',
            volume: adjustedVolume * 0.5,
            pan: signature.panPosition,
            delay: i * tempo,
          });
        });
        break;

      case 'spark':
        // Electric zaps (connect)
        for (let i = 0; i < 3; i++) {
          playSpatialTone({
            frequency: adjustedFrequency * (1 + Math.random() * 0.5),
            duration: 0.02,
            waveform: 'sawtooth',
            volume: adjustedVolume * 0.6,
            pan: signature.panPosition + (Math.random() - 0.5) * 0.2,
            delay: i * 0.04,
          });
        }
        break;

      case 'hum':
        // Continuous building hum (hold)
        playSpatialTone({
          frequency: adjustedFrequency,
          duration: 0.5,
          waveform: 'sine',
          volume: adjustedVolume * 0.3,
          pan: signature.panPosition,
        });
        break;

      case 'sweep':
        // Rising/falling pitch (track)
        playSpatialTone({
          frequency: adjustedFrequency * 0.8,
          duration: 0.3,
          waveform: 'sine',
          volume: adjustedVolume * 0.4,
          pan: signature.panPosition,
        });
        break;

      case 'typewriter':
        // Rapid clicks (sentence)
        for (let i = 0; i < 5; i++) {
          playSpatialTone({
            frequency: adjustedFrequency * (0.9 + Math.random() * 0.2),
            duration: 0.02,
            waveform: 'square',
            volume: adjustedVolume * 0.3,
            pan: signature.panPosition,
            delay: i * 0.06,
          });
        }
        break;
    }
  }, [playSpatialTone, state.muted]);

  // Play confirmation beep for correct input
  const playCorrectBeep = useCallback(() => {
    if (state.muted) return;
    playSpatialTone({ frequency: 880, duration: 0.08, volume: 0.4, waveform: 'sine' });
  }, [playSpatialTone, state.muted]);

  // Play error buzz for wrong input
  const playErrorBuzz = useCallback(() => {
    if (state.muted) return;
    playSpatialTone({ frequency: 200, duration: 0.15, volume: 0.5, waveform: 'sawtooth' });
  }, [playSpatialTone, state.muted]);

  // Play success chime for task completion
  const playSuccessChime = useCallback(() => {
    if (state.muted) return;
    playSpatialTone({ frequency: 523, duration: 0.1, volume: 0.4, delay: 0 });
    playSpatialTone({ frequency: 659, duration: 0.1, volume: 0.4, delay: 0.08 });
    playSpatialTone({ frequency: 784, duration: 0.15, volume: 0.5, delay: 0.16 });
  }, [playSpatialTone, state.muted]);

  // Play failure sound
  const playFailureSound = useCallback(() => {
    if (state.muted) return;
    playSpatialTone({ frequency: 400, duration: 0.15, volume: 0.4, delay: 0 });
    playSpatialTone({ frequency: 300, duration: 0.15, volume: 0.4, delay: 0.12 });
    playSpatialTone({ frequency: 200, duration: 0.25, volume: 0.5, delay: 0.24 });
  }, [playSpatialTone, state.muted]);

  // Start background drone based on system pressure
  const startPressureDrone = useCallback((alertCount: number, stability: number) => {
    if (state.muted) return;
    
    const ctx = getAudioContext();
    
    // Clean up existing drone
    if (droneNodeRef.current) {
      try { droneNodeRef.current.stop(); } catch {}
    }

    // Only start drone if there's pressure
    if (alertCount < 3 && stability > 50) return;

    const droneGain = ctx.createGain();
    const droneOsc = ctx.createOscillator();
    
    droneOsc.type = 'sine';
    droneOsc.frequency.setValueAtTime(55, ctx.currentTime); // Low A
    
    // Volume based on pressure
    const pressureLevel = Math.min(1, (alertCount / 10) + ((100 - stability) / 100));
    droneGain.gain.setValueAtTime(pressureLevel * 0.15 * state.masterVolume, ctx.currentTime);
    
    droneOsc.connect(droneGain);
    droneGain.connect(ctx.destination);
    droneOsc.start();
    
    droneNodeRef.current = droneOsc;
    droneGainRef.current = droneGain;
  }, [getAudioContext, state.muted, state.masterVolume]);

  // Stop the pressure drone
  const stopPressureDrone = useCallback(() => {
    if (droneNodeRef.current) {
      try { droneNodeRef.current.stop(); } catch {}
      droneNodeRef.current = null;
    }
  }, []);

  // Play heartbeat for critical stability
  const startHeartbeat = useCallback((stability: number) => {
    if (state.muted || stability > 30) {
      if (heartbeatRef.current) {
        clearInterval(heartbeatRef.current);
        heartbeatRef.current = null;
      }
      return;
    }

    if (heartbeatRef.current) return; // Already running

    const beatInterval = Math.max(300, 800 - (30 - stability) * 20);
    
    heartbeatRef.current = setInterval(() => {
      playSpatialTone({ frequency: 60, duration: 0.1, volume: 0.3, waveform: 'sine' });
      playSpatialTone({ frequency: 55, duration: 0.15, volume: 0.4, waveform: 'sine', delay: 0.12 });
    }, beatInterval);
  }, [playSpatialTone, state.muted]);

  const stopHeartbeat = useCallback(() => {
    if (heartbeatRef.current) {
      clearInterval(heartbeatRef.current);
      heartbeatRef.current = null;
    }
  }, []);

  // Play hold progress tone (rising frequency)
  const playHoldProgress = useCallback((progress: number) => {
    if (state.muted) return;
    const frequency = 200 + progress * 400; // 200Hz to 600Hz
    playSpatialTone({
      frequency,
      duration: 0.1,
      volume: 0.2 + progress * 0.2,
      waveform: 'sine',
      pan: 0.6,
    });
  }, [playSpatialTone, state.muted]);

  // Play pitch for track task (position-based)
  const playTrackPitch = useCallback((targetPitch: number, playerPitch: number) => {
    if (state.muted) return;
    // Target pitch
    playSpatialTone({
      frequency: 200 + targetPitch * 400,
      duration: 0.15,
      volume: 0.3,
      waveform: 'sine',
      pan: -0.5,
    });
    // Player pitch
    playSpatialTone({
      frequency: 200 + playerPitch * 400,
      duration: 0.15,
      volume: 0.3,
      waveform: 'triangle',
      pan: 0.5,
    });
  }, [playSpatialTone, state.muted]);

  return {
    playSpatialTone,
    playTaskAudio,
    playCorrectBeep,
    playErrorBuzz,
    playSuccessChime,
    playFailureSound,
    startPressureDrone,
    stopPressureDrone,
    startHeartbeat,
    stopHeartbeat,
    playHoldProgress,
    playTrackPitch,
  };
}
