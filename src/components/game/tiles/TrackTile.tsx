import { useState, useEffect, useRef, useCallback } from 'react';
import { Alert } from '@/types/game';
import { useGame } from '@/contexts/GameContext';
import { useAccessibility } from '@/contexts/AccessibilityContext';
import { useSpatialAudio } from '@/hooks/useSpatialAudio';
import { useTextToSpeech } from '@/hooks/useTextToSpeech';
import { motion } from 'framer-motion';

interface TrackTileProps {
  alert: Alert;
  compact?: boolean;
}

export function TrackTile({ alert, compact }: TrackTileProps) {
  const { completeTask } = useGame();
  const { state: accessibilityState } = useAccessibility();
  const { playTrackPitch, playSuccessChime } = useSpatialAudio();
  const { speakNow } = useTextToSpeech();
  
  const containerRef = useRef<HTMLDivElement>(null);
  const hasAnnouncedRef = useRef(false);
  const lastPitchRef = useRef(0);
  
  const [targetPos, setTargetPos] = useState({ x: 50, y: 50 });
  const [playerPos, setPlayerPos] = useState(50); // For blind mode: 0-100 position
  const [isTracking, setIsTracking] = useState(false);
  const [trackProgress, setTrackProgress] = useState(0);
  const [isComplete, setIsComplete] = useState(false);

  const requiredTrackTime = compact ? 2000 : 3000;
  const targetSize = compact ? 'w-8 h-8' : 'w-12 h-12';
  const dotSize = compact ? 'w-2 h-2' : 'w-3 h-3';

  // Announce task in blind mode
  useEffect(() => {
    if (accessibilityState.blindMode && !hasAnnouncedRef.current) {
      hasAnnouncedRef.current = true;
      speakNow('Match the pitch using left and right arrow keys');
    }
  }, [accessibilityState.blindMode, speakNow]);

  // Handle keyboard for blind mode pitch matching
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (!accessibilityState.blindMode || isComplete) return;

    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      setPlayerPos(prev => Math.max(0, prev - 5));
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      setPlayerPos(prev => Math.min(100, prev + 5));
    }
  }, [accessibilityState.blindMode, isComplete]);

  useEffect(() => {
    if (accessibilityState.blindMode) {
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [accessibilityState.blindMode, handleKeyDown]);

  // Play pitch audio in blind mode
  useEffect(() => {
    if (!accessibilityState.blindMode || isComplete) return;

    const interval = setInterval(() => {
      const targetPitch = targetPos.x / 100;
      const playerPitch = playerPos / 100;
      
      // Only play if position changed significantly
      if (Math.abs(playerPitch - lastPitchRef.current) > 0.02) {
        playTrackPitch(targetPitch, playerPitch);
        lastPitchRef.current = playerPitch;
      }
    }, 200);

    return () => clearInterval(interval);
  }, [accessibilityState.blindMode, isComplete, targetPos.x, playerPos, playTrackPitch]);

  // Check tracking in blind mode
  useEffect(() => {
    if (!accessibilityState.blindMode || isComplete) return;

    const distance = Math.abs(playerPos - targetPos.x);
    setIsTracking(distance < 15);
  }, [accessibilityState.blindMode, playerPos, targetPos.x, isComplete]);

  // Move target randomly
  useEffect(() => {
    if (isComplete) return;

    const moveTarget = () => {
      setTargetPos({
        x: 15 + Math.random() * 70,
        y: 15 + Math.random() * 70,
      });
    };

    moveTarget();
    const interval = setInterval(moveTarget, compact ? 1200 : 1500);
    return () => clearInterval(interval);
  }, [isComplete, compact]);

  // Check if cursor is over target (visual mode)
  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (accessibilityState.blindMode || isComplete || !containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    const distance = Math.sqrt(
      Math.pow(x - targetPos.x, 2) + Math.pow(y - targetPos.y, 2)
    );

    setIsTracking(distance < (compact ? 12 : 8));
  }, [targetPos, isComplete, compact, accessibilityState.blindMode]);

  // Progress tracking
  useEffect(() => {
    if (!isTracking || isComplete) return;

    const interval = setInterval(() => {
      setTrackProgress((prev) => {
        const newProgress = prev + (100 / (requiredTrackTime / 50));
        if (newProgress >= 100) {
          setIsComplete(true);
          if (accessibilityState.blindMode) {
            playSuccessChime();
          }
          completeTask(alert.id, 90);
          return 100;
        }
        return newProgress;
      });
    }, 50);

    return () => clearInterval(interval);
  }, [isTracking, isComplete, alert.id, completeTask, requiredTrackTime, accessibilityState.blindMode, playSuccessChime]);

  // Decay progress when not tracking
  useEffect(() => {
    if (isTracking || isComplete) return;

    const interval = setInterval(() => {
      setTrackProgress((prev) => Math.max(0, prev - 1));
    }, 50);

    return () => clearInterval(interval);
  }, [isTracking, isComplete]);

  return (
    <div 
      className="h-full flex flex-col gap-2"
      role="region"
      aria-label="Track task: Follow the target with your cursor or match the pitch with arrow keys"
    >
      {/* Progress bar */}
      <div className="flex items-center gap-2">
        <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
          <motion.div
            className={`h-full ${isComplete ? 'bg-success' : isTracking ? 'bg-primary' : 'bg-warning'}`}
            animate={{ width: `${trackProgress}%` }}
            transition={{ duration: 0.1 }}
          />
        </div>
        <span className="font-mono text-[10px] text-primary">{trackProgress.toFixed(0)}%</span>
      </div>

      {/* Tracking area */}
      <div
        ref={containerRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={() => !accessibilityState.blindMode && setIsTracking(false)}
        className="flex-1 relative border border-border bg-background/50 cursor-crosshair overflow-hidden rounded"
      >
        {/* Grid pattern */}
        <div className="absolute inset-0 grid-pattern opacity-30" aria-hidden="true" />

        {/* Target */}
        <motion.div
          animate={{ 
            left: `${targetPos.x}%`, 
            top: accessibilityState.blindMode ? '50%' : `${targetPos.y}%`,
            scale: isTracking ? 1.2 : 1,
          }}
          transition={{ type: 'spring', damping: 15, stiffness: 100 }}
          className={`absolute ${targetSize} -translate-x-1/2 -translate-y-1/2 rounded-full
                      border-2 flex items-center justify-center
                      ${isComplete ? 'border-success bg-success/30' :
                        isTracking ? 'border-primary bg-primary/30' : 
                        'border-warning bg-warning/20'}`}
          aria-hidden="true"
        >
          <div className={`${dotSize} rounded-full ${
            isComplete ? 'bg-success' : isTracking ? 'bg-primary' : 'bg-warning'
          }`} />
        </motion.div>

        {/* Player position indicator (blind mode) */}
        {accessibilityState.blindMode && (
          <motion.div
            animate={{ left: `${playerPos}%`, top: '50%' }}
            className="absolute w-4 h-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-accent bg-accent/50"
            aria-hidden="true"
          />
        )}

        {/* Status text */}
        <div className="absolute bottom-1 left-1/2 -translate-x-1/2">
          <p className={`font-mono text-[10px] ${
            isComplete ? 'text-success' : isTracking ? 'text-primary' : 'text-muted-foreground'
          }`}>
            {isComplete ? 'LOCKED!' : isTracking ? 'TRACKING...' : accessibilityState.blindMode ? 'USE ←→ KEYS' : 'FOLLOW TARGET'}
          </p>
        </div>
      </div>

      {/* Screen reader status */}
      <div className="sr-only" role="status" aria-live="polite">
        {isComplete ? 'Tracking complete!' : isTracking ? `Tracking, ${Math.round(trackProgress)}% complete` : 'Move to match the target'}
      </div>
    </div>
  );
}
