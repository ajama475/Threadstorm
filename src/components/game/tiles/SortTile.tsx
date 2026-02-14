import { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { Alert } from '@/types/game';
import { useGame } from '@/contexts/GameContext';
import { useAccessibility } from '@/contexts/AccessibilityContext';
import { useSpatialAudio } from '@/hooks/useSpatialAudio';
import { useTextToSpeech } from '@/hooks/useTextToSpeech';
import { generateSortTask } from '@/lib/alertGenerator';
import { motion, Reorder } from 'framer-motion';

interface SortTileProps {
  alert: Alert;
  compact?: boolean;
}

export function SortTile({ alert, compact }: SortTileProps) {
  const { completeTask } = useGame();
  const { state: accessibilityState } = useAccessibility();
  const { playCorrectBeep, playErrorBuzz, playSuccessChime } = useSpatialAudio();
  const { speakNow } = useTextToSpeech();
  
  const initialItems = useMemo(() => generateSortTask(), []);
  const [items, setItems] = useState(initialItems);
  const [blindModeInput, setBlindModeInput] = useState<number[]>([]);
  const hasAnnouncedRef = useRef(false);

  const correctOrder = [...initialItems].sort((a, b) => a.value - b.value);
  const isCorrect = items.every((item, i) => item.id === correctOrder[i].id);

  // Announce task in blind mode
  useEffect(() => {
    if (accessibilityState.blindMode && !hasAnnouncedRef.current) {
      hasAnnouncedRef.current = true;
      const numbers = initialItems.map(i => i.value).join(', ');
      speakNow(`Sort ascending: ${numbers}. Press numbers in correct order.`);
    }
  }, [accessibilityState.blindMode, initialItems, speakNow]);

  // Handle keyboard input for blind mode sorting
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (!accessibilityState.blindMode) return;

    const num = parseInt(e.key);
    if (!isNaN(num) && num >= 1 && num <= items.length) {
      const itemIndex = num - 1;
      const expectedIndex = blindModeInput.length;
      const expectedValue = correctOrder[expectedIndex]?.value;
      const selectedValue = items[itemIndex]?.value;

      if (selectedValue === expectedValue) {
        playCorrectBeep();
        const newInput = [...blindModeInput, itemIndex];
        setBlindModeInput(newInput);

        if (newInput.length === items.length) {
          // Reorder items based on input
          const newItems = newInput.map(i => items[i]);
          setItems(newItems);
          playSuccessChime();
          completeTask(alert.id, 60);
        }
      } else {
        playErrorBuzz();
        setBlindModeInput([]);
        speakNow('Error. Start again.');
      }
    }
  }, [accessibilityState.blindMode, items, correctOrder, blindModeInput, alert.id, completeTask, playCorrectBeep, playErrorBuzz, playSuccessChime, speakNow]);

  useEffect(() => {
    if (accessibilityState.blindMode) {
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [accessibilityState.blindMode, handleKeyDown]);

  const handleReorder = (newOrder: typeof items) => {
    setItems(newOrder);

    const sorted = newOrder.every((item, i) => {
      const correctItem = correctOrder[i];
      return item.id === correctItem.id;
    });

    if (sorted) {
      completeTask(alert.id, 60);
    }
  };

  const itemSize = compact ? 'w-10 h-12 text-sm' : 'w-16 h-20 text-xl';

  return (
    <div 
      className="h-full flex flex-col items-center justify-center gap-3"
      role="region"
      aria-label="Sort task: Arrange numbers from lowest to highest"
    >
      {!compact && (
        <p className="font-mono text-sm text-muted-foreground">
          {accessibilityState.blindMode ? 'PRESS NUMBERS IN ORDER: LOW → HIGH' : 'DRAG TO SORT: LOW → HIGH'}
        </p>
      )}

      <Reorder.Group
        axis="x"
        values={items}
        onReorder={handleReorder}
        className="flex gap-2"
      >
        {items.map((item, index) => {
          const isInCorrectPosition = item.id === correctOrder[index].id;
          const isSelected = blindModeInput.includes(index);

          return (
            <Reorder.Item
              key={item.id}
              value={item}
              className={`cursor-grab active:cursor-grabbing ${accessibilityState.blindMode ? 'pointer-events-none' : ''}`}
              drag={!accessibilityState.blindMode}
            >
              <motion.div
                layout
                whileHover={accessibilityState.blindMode ? {} : { scale: 1.05 }}
                whileDrag={accessibilityState.blindMode ? {} : { scale: 1.1, cursor: 'grabbing' }}
                className={`${itemSize} border-2 flex flex-col items-center justify-center font-mono
                            transition-colors relative
                            ${isInCorrectPosition 
                              ? 'border-success bg-success/20 text-success' 
                              : isSelected
                              ? 'border-accent bg-accent/20 text-accent'
                              : 'border-primary bg-primary/20 text-primary'}`}
              >
                {/* Position number for blind mode */}
                {accessibilityState.blindMode && (
                  <span className="absolute -top-2 -left-2 w-5 h-5 rounded-full bg-muted text-muted-foreground text-xs flex items-center justify-center">
                    {index + 1}
                  </span>
                )}
                {item.label}
              </motion.div>
            </Reorder.Item>
          );
        })}
      </Reorder.Group>

      {/* Position indicators */}
      <div className="flex gap-2">
        {items.map((_, i) => (
          <div key={i} className={`${compact ? 'w-10' : 'w-16'} text-center font-mono text-[10px] text-muted-foreground`}>
            {i + 1}
          </div>
        ))}
      </div>

      {/* Blind mode progress */}
      {accessibilityState.blindMode && blindModeInput.length > 0 && (
        <p className="font-mono text-xs text-accent">
          {blindModeInput.length} of {items.length} selected
        </p>
      )}

      {isCorrect && (
        <motion.p
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          className="font-mono text-xs text-success"
        >
          CORRECT!
        </motion.p>
      )}

      {/* Screen reader status */}
      <div className="sr-only" role="status" aria-live="polite">
        {isCorrect ? 'Sorted correctly!' : `${blindModeInput.length} of ${items.length} in correct position`}
      </div>
    </div>
  );
}
