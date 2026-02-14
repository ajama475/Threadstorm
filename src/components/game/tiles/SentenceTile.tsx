import { useState, useCallback, useMemo } from 'react';
import { Alert } from '@/types/game';
import { useGame } from '@/contexts/GameContext';
import { generateSentenceTask } from '@/lib/alertGenerator';

interface SentenceTileProps {
  alert: Alert;
  compact?: boolean;
}

export function SentenceTile({ alert, compact }: SentenceTileProps) {
  const { completeTask } = useGame();
  const targetSentence = useMemo(() => generateSentenceTask(), []);
  const [typed, setTyped] = useState('');
  const [errors, setErrors] = useState(0);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.toUpperCase();
    setTyped(value);

    let newErrors = 0;
    for (let i = 0; i < value.length; i++) {
      if (value[i] !== targetSentence[i]) {
        newErrors++;
      }
    }
    setErrors(newErrors);

    if (value === targetSentence) {
      const bonus = Math.max(0, 100 - errors * 10);
      completeTask(alert.id, bonus);
    }
  }, [targetSentence, errors, alert.id, completeTask]);

  const fontSize = compact ? 'text-xs' : 'text-lg';
  const inputSize = compact ? 'px-2 py-1 text-xs' : 'px-4 py-3 text-lg';

  return (
    <div className="h-full flex flex-col items-center justify-center gap-3 p-2">
      {/* Target sentence */}
      <div className={`font-mono ${fontSize} text-center leading-relaxed tracking-wide`}>
        {targetSentence.split('').map((char, i) => {
          const typedChar = typed[i];
          const isCorrect = typedChar === char;
          const isTyped = i < typed.length;

          return (
            <span
              key={i}
              className={`${
                !isTyped ? 'text-muted-foreground' :
                isCorrect ? 'text-success' : 'text-destructive'
              }`}
            >
              {char}
            </span>
          );
        })}
      </div>

      {/* Input field */}
      <input
        type="text"
        value={typed}
        onChange={handleChange}
        autoFocus
        className={`w-full max-w-full ${inputSize} bg-background border-2 border-primary 
                   font-mono text-center tracking-widest
                   focus:outline-none focus:ring-1 focus:ring-primary`}
        placeholder="TYPE..."
      />

      {/* Progress */}
      <div className="flex items-center gap-3 font-mono text-[10px]">
        <span className="text-muted-foreground">
          {typed.length}/{targetSentence.length}
        </span>
        {errors > 0 && (
          <span className="text-destructive">
            {errors} err
          </span>
        )}
      </div>
    </div>
  );
}
