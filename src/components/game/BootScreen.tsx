import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { gameConfig } from '@/lib/gameConfig';

const BOOT_LINES = [
  'INITIALIZING CORE SYSTEMS...',
  'LOADING NEURAL INTERFACE v2.7.4...',
  'CALIBRATING SENSOR ARRAY...',
  'ESTABLISHING SECURE CHANNEL...',
  'VERIFYING OPERATOR CREDENTIALS...',
  'MOUNTING ALERT SUBSYSTEM...',
  'COMPILING TASK MODULES...',
  'LINKING STABILITY MONITOR...',
  'LOADING AI COMMENTARY ENGINE...',
  'RUNNING FINAL DIAGNOSTICS...',
  'ALL SYSTEMS NOMINAL.',
  'READY FOR OPERATOR INPUT.',
];

interface BootScreenProps {
  onComplete: () => void;
}

export function BootScreen({ onComplete }: BootScreenProps) {
  const [lines, setLines] = useState<string[]>([]);
  const [progress, setProgress] = useState(0);
  const [canSkip, setCanSkip] = useState(false);
  const completedRef = { current: false };

  const finish = useCallback(() => {
    if (completedRef.current) return;
    completedRef.current = true;
    onComplete();
  }, [onComplete]);

  useEffect(() => {
    const skipTimer = setTimeout(() => setCanSkip(true), gameConfig.bootSkipAfterMs);
    const lineInterval = gameConfig.bootDurationMs / BOOT_LINES.length;
    const timers: ReturnType<typeof setTimeout>[] = [];

    BOOT_LINES.forEach((line, i) => {
      timers.push(setTimeout(() => {
        setLines(prev => [...prev, line]);
        setProgress(((i + 1) / BOOT_LINES.length) * 100);
      }, lineInterval * i));
    });

    timers.push(setTimeout(finish, gameConfig.bootDurationMs + 500));

    return () => {
      clearTimeout(skipTimer);
      timers.forEach(clearTimeout);
    };
  }, [finish]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.key === ' ' || e.key === 'Enter') && canSkip) {
        e.preventDefault();
        finish();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [canSkip, finish]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="w-full max-w-2xl px-8">
        <div className="border border-border bg-card/50 p-6 font-mono text-sm">
          <div className="mb-4 flex items-center gap-2 text-muted-foreground text-xs">
            <span className="w-2 h-2 bg-success rounded-full" />
            COMMAND OVERLOAD — SYSTEM BOOTSTRAP
          </div>

          <div className="space-y-1 mb-6 h-64 overflow-hidden">
            {lines.map((line, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className={i === lines.length - 1 ? 'text-primary' : 'text-muted-foreground'}
              >
                <span className="text-primary/50 mr-2">&gt;</span>
                {line}
              </motion.div>
            ))}
            <span className="inline-block w-2 h-4 bg-primary animate-pulse" />
          </div>

          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <motion.div className="h-full bg-primary" animate={{ width: `${progress}%` }} transition={{ duration: 0.3 }} />
          </div>

          <div className="flex justify-between mt-3 text-xs text-muted-foreground">
            <span>{Math.round(progress)}% COMPLETE</span>
            {canSkip && (
              <motion.button
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-primary hover:underline"
                onClick={finish}
              >
                PRESS SPACE TO SKIP
              </motion.button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
