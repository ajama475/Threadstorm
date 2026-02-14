import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Alert } from '@/types/game';
import { useGame } from '@/contexts/GameContext';
import { useAccessibility } from '@/contexts/AccessibilityContext';
import { useSpatialAudio } from '@/hooks/useSpatialAudio';
import { useTextToSpeech } from '@/hooks/useTextToSpeech';
import { generateHoldTask } from '@/lib/alertGenerator';
import { motion } from 'framer-motion';

interface HoldTileProps {
  alert: Alert;
  compact?: boolean;
}

export function HoldTile({ alert, compact }: HoldTileProps) {
  const { completeTask } = useGame();
  const { state: accessibilityState } = useAccessibility();
  const { playHoldProgress, playSuccessChime, playFailureSound } = useSpatialAudio();
  const { speakNow } = useTextToSpeech();
  
  const { key, duration } = useMemo(() => generateHoldTask(), []);
  
  const [isHolding, setIsHolding] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const lastAudioProgressRef = useRef(0);
  const hasAnnouncedRef = useRef(false);

  const keyCode = key === 'SPACE' ? ' ' : key === 'SHIFT' ? 'Shift' : 'Enter';

  // Announce task in blind mode
  useEffect(() => {
    if (accessibilityState.blindMode && !hasAnnouncedRef.current) {
      hasAnnouncedRef.current = true;
      speakNow(`Hold ${key} key for ${duration / 1000} seconds`);
    }
  }, [accessibilityState.blindMode, key, duration, speakNow]);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (isComplete) return;
    
    if (e.key === keyCode || (key === 'SPACE' && e.code === 'Space')) {
      e.preventDefault();
      setIsHolding(true);
    }
  }, [keyCode, key, isComplete]);

  const handleKeyUp = useCallback((e: KeyboardEvent) => {
    if (e.key === keyCode || (key === 'SPACE' && e.code === 'Space')) {
      setIsHolding(false);
      if (!isComplete) {
        setProgress(0);
        lastAudioProgressRef.current = 0;
        
        // Audio feedback for release
        if (accessibilityState.blindMode && progress > 10) {
          playFailureSound();
          setTimeout(() => {
            speakNow(`Released early. Hold ${key} again.`);
          }, 200);
        }
      }
    }
  }, [keyCode, key, isComplete, accessibilityState.blindMode, progress, playFailureSound, speakNow]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [handleKeyDown, handleKeyUp]);

  useEffect(() => {
    if (!isHolding || isComplete) return;

    const interval = setInterval(() => {
      setProgress((prev) => {
        const newProgress = prev + (100 / (duration / 50));
        
        // Play audio feedback every 20% progress in blind mode
        if (accessibilityState.blindMode) {
          const progressStep = Math.floor(newProgress / 20);
          if (progressStep > lastAudioProgressRef.current) {
            lastAudioProgressRef.current = progressStep;
            playHoldProgress(newProgress / 100);
          }
        }
        
        if (newProgress >= 100) {
          setIsComplete(true);
          if (accessibilityState.blindMode) {
            playSuccessChime();
          }
          completeTask(alert.id, 70);
          return 100;
        }
        return newProgress;
      });
    }, 50);

    return () => clearInterval(interval);
  }, [isHolding, isComplete, duration, alert.id, completeTask, accessibilityState.blindMode, playHoldProgress, playSuccessChime]);

  const keySize = compact ? 'w-16 h-16' : 'w-32 h-32';
  const svgSize = compact ? 64 : 128;
  const radius = compact ? 26 : 58;
  const circumference = 2 * Math.PI * radius;

  return (
    <div 
      className="h-full flex flex-col items-center justify-center gap-3"
      role="region"
      aria-label={`Hold task: Hold ${key} for ${duration / 1000} seconds`}
    >
      {/* Key indicator */}
      <motion.div
        animate={isHolding ? { scale: 0.95 } : { scale: 1 }}
        className={`relative ${keySize} border-4 rounded-lg flex items-center justify-center
                    transition-colors
                    ${isComplete ? 'border-success bg-success/20' :
                      isHolding ? 'border-warning bg-warning/20' : 
                      'border-primary bg-primary/20'}`}
        aria-hidden="true"
      >
        <span className={`font-display ${compact ? 'text-lg' : 'text-3xl'}`}>
          {key}
        </span>

        {/* Progress ring */}
        <svg className="absolute inset-0 w-full h-full -rotate-90">
          <circle
            cx={svgSize / 2}
            cy={svgSize / 2}
            r={radius}
            fill="none"
            stroke="hsl(var(--muted))"
            strokeWidth="3"
          />
          <motion.circle
            cx={svgSize / 2}
            cy={svgSize / 2}
            r={radius}
            fill="none"
            stroke={isComplete ? 'hsl(var(--success))' : 'hsl(var(--primary))'}
            strokeWidth="3"
            strokeDasharray={circumference}
            strokeDashoffset={circumference - (circumference * progress) / 100}
            strokeLinecap="round"
          />
        </svg>
      </motion.div>

      {/* Progress text */}
      <div className="text-center">
        <p className={`font-mono ${compact ? 'text-lg' : 'text-2xl'} text-primary`}>
          {progress.toFixed(0)}%
        </p>
        <p className="font-mono text-[10px] text-muted-foreground">
          {isComplete ? 'DONE!' : isHolding ? 'HOLDING...' : `HOLD ${key}`}
        </p>
      </div>

      {/* Screen reader status */}
      <div className="sr-only" role="status" aria-live="polite">
        {isComplete ? 'Complete!' : isHolding ? `Holding, ${Math.round(progress)}% complete` : `Press and hold ${key}`}
      </div>
    </div>
  );
}
