import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';

interface StartScreenProps {
  onStart: (skipTutorial: boolean) => void;
}

export function StartScreen({ onStart }: StartScreenProps) {
  const [input, setInput] = useState('');
  const [capsWarningShown, setCapsWarningShown] = useState(false);
  const [history, setHistory] = useState<{ text: string; type: 'input' | 'error' | 'system' }[]>([
    { text: 'COMMAND OVERLOAD v2.7.4 — READY', type: 'system' },
    { text: 'Type START to initialize system.', type: 'system' },
  ]);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const raf = window.requestAnimationFrame(() => {
      const active = document.activeElement;
      const canFocus =
        !active ||
        active === document.body ||
        active === document.documentElement;

      if (canFocus) {
        inputRef.current?.focus();
      }
    });

    return () => window.cancelAnimationFrame(raf);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = input.trim();
    const command = trimmed || 'START';

    setHistory(prev => [...prev, { text: `> ${command}`, type: 'input' }]);

    if (command === 'start' && !capsWarningShown) {
      setCapsWarningShown(true);
      setHistory(prev => [...prev, {
        text: 'ERROR: CAPS LOCK REQUIRED. This is a PROFESSIONAL system. Try again.',
        type: 'error',
      }]);
      setInput('');
      return;
    }

    if (command.toUpperCase() === 'START') {
      setHistory(prev => [...prev, { text: 'INITIALIZING...', type: 'system' }]);
      setTimeout(() => onStart(false), 500);
      return;
    }

    setHistory(prev => [...prev, {
      text: `UNKNOWN COMMAND: "${command}". Type START to begin.`,
      type: 'error',
    }]);
    setInput('');
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative scanlines">
      {/* Animated background */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          className="absolute top-1/4 left-1/4 w-64 h-64 border border-primary/20 rounded-full"
          animate={{ rotate: 360 }}
          transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
        />
        <motion.div
          className="absolute bottom-1/4 right-1/4 w-72 h-72 border border-primary/10 rounded-full"
          animate={{ rotate: -360 }}
          transition={{ duration: 25, repeat: Infinity, ease: 'linear' }}
        />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="relative z-10 w-full max-w-xl px-6"
      >
        {/* Title */}
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.6 }}
          className="text-center mb-8"
        >
          <h1 className="font-display text-5xl md:text-7xl font-bold tracking-wider text-glow-cyan text-primary mb-2">
            COMMAND
          </h1>
          <h1 className="font-display text-4xl md:text-6xl font-bold tracking-wider text-glow-cyan text-primary">
            OVERLOAD
          </h1>
        </motion.div>

        {/* Terminal */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="border border-border bg-card/80 backdrop-blur-sm font-mono text-sm"
        >
          <div className="flex items-center gap-2 px-4 py-2 border-b border-border bg-muted/30">
            <span className="w-2 h-2 bg-destructive rounded-full" />
            <span className="w-2 h-2 bg-warning rounded-full" />
            <span className="w-2 h-2 bg-success rounded-full" />
            <span className="text-xs text-muted-foreground ml-2">terminal://command-overload</span>
          </div>

          <div className="p-4 max-h-48 overflow-y-auto space-y-1">
            {history.map((line, i) => (
              <div key={i} className={
                line.type === 'error' ? 'text-destructive' :
                line.type === 'system' ? 'text-primary' :
                'text-muted-foreground'
              }>
                {line.text}
              </div>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="flex items-center px-4 py-3 border-t border-border">
            <span className="text-primary mr-2">&gt;</span>
            <input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className="flex-1 bg-transparent outline-none text-foreground font-mono text-sm caret-primary"
              placeholder="TYPE COMMAND..."
              autoFocus
              autoComplete="off"
              spellCheck={false}
            />
            <span className="w-2 h-4 bg-primary animate-pulse" />
          </form>
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.3 }}
          className="mt-6 text-center text-muted-foreground text-xs font-mono"
        >
          COMPLETE TASKS • CLEAR ALERTS • PREVENT OVERLOAD
        </motion.p>
      </motion.div>

      <div className="absolute top-4 left-4 w-16 h-16 border-l-2 border-t-2 border-primary/50" />
      <div className="absolute bottom-4 left-4 w-16 h-16 border-l-2 border-b-2 border-primary/50" />
      <div className="absolute bottom-4 right-4 w-16 h-16 border-r-2 border-b-2 border-primary/50" />
    </div>
  );
}
