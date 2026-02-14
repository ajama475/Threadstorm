import { useState, useEffect, useCallback, useRef } from 'react';
import { Alert } from '@/types/game';
import { useGame } from '@/contexts/GameContext';
import { useAccessibility } from '@/contexts/AccessibilityContext';
import { useSpatialAudio } from '@/hooks/useSpatialAudio';
import { useTextToSpeech } from '@/hooks/useTextToSpeech';
import { generateTypeTask } from '@/lib/alertGenerator';
import { motion } from 'framer-motion';

interface TypeTileProps {
  alert: Alert;
  compact?: boolean;
}

export function TypeTile({ alert, compact }: TypeTileProps) {
  const { completeTask } = useGame();
  const { state: accessibilityState } = useAccessibility();
  const { playCorrectBeep, playErrorBuzz } = useSpatialAudio();
  const { toPhonetic, speakNow } = useTextToSpeech();
  
  const [targetWord] = useState(() => generateTypeTask());
  const [typedChars, setTypedChars] = useState('');
  const [isComplete, setIsComplete] = useState(false);
  const hasAnnouncedRef = useRef(false);

  // Announce task in blind mode
  useEffect(() => {
    if (accessibilityState.blindMode && !hasAnnouncedRef.current) {
      hasAnnouncedRef.current = true;
      speakNow(`Type: ${toPhonetic(targetWord)}`);
    }
  }, [accessibilityState.blindMode, targetWord, toPhonetic, speakNow]);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (isComplete) return;

    const key = e.key.toUpperCase();
    const expectedChar = targetWord[typedChars.length];

    if (key === expectedChar) {
      const newTyped = typedChars + key;
      setTypedChars(newTyped);
      
      // Audio feedback for correct key
      if (accessibilityState.blindMode) {
        playCorrectBeep();
      }

      if (newTyped === targetWord) {
        setIsComplete(true);
        completeTask(alert.id, 50);
      }
    } else if (key.length === 1 && key.match(/[A-Z0-9]/)) {
      setTypedChars('');
      
      // Audio feedback for error
      if (accessibilityState.blindMode) {
        playErrorBuzz();
        // Re-announce the target after error
        setTimeout(() => {
          speakNow(`Error. Type: ${toPhonetic(targetWord)}`);
        }, 200);
      }
    }
  }, [typedChars, targetWord, isComplete, alert.id, completeTask, accessibilityState.blindMode, playCorrectBeep, playErrorBuzz, speakNow, toPhonetic]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  const charSize = compact ? 'w-8 h-10 text-lg' : 'w-14 h-16 text-3xl';

  return (
    <div 
      className="h-full flex flex-col items-center justify-center gap-3"
      role="region"
      aria-label={`Type task: ${targetWord}`}
    >
      {/* Target word display */}
      <div className="flex gap-1" aria-hidden="true">
        {targetWord.split('').map((char, i) => {
          const isTyped = i < typedChars.length;
          const isCurrent = i === typedChars.length;

          return (
            <motion.div
              key={i}
              animate={isCurrent ? { scale: [1, 1.1, 1] } : {}}
              transition={{ duration: 0.5, repeat: isCurrent ? Infinity : 0 }}
              className={`${charSize} border-2 flex items-center justify-center font-mono
                          ${isTyped ? 'border-success bg-success/20 text-success' :
                            isCurrent ? 'border-primary bg-primary/10 text-primary' :
                            'border-muted bg-muted/50 text-muted-foreground'}`}
            >
              {char}
            </motion.div>
          );
        })}
      </div>

      {/* Progress indicator */}
      <div className="flex gap-1" aria-hidden="true">
        {targetWord.split('').map((_, i) => (
          <div
            key={i}
            className={`w-1.5 h-1.5 rounded-full transition-colors ${
              i < typedChars.length ? 'bg-success' : 'bg-muted'
            }`}
          />
        ))}
      </div>

      {/* Screen reader status */}
      <div className="sr-only" role="status" aria-live="polite">
        {typedChars.length} of {targetWord.length} characters typed
      </div>

      {!compact && (
        <p className="font-mono text-sm text-muted-foreground">
          TYPE THE CODE ABOVE
        </p>
      )}
    </div>
  );
}
