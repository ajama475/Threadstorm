import { useGame } from '@/contexts/GameContext';
import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

export function GameOver() {
  const { state, startGame } = useGame();
  const [highScore, setHighScore] = useState(0);
  const [isNewHighScore, setIsNewHighScore] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem('commandOverload_highScore');
    const previousHigh = stored ? parseInt(stored, 10) : 0;
    
    if (state.score > previousHigh) {
      localStorage.setItem('commandOverload_highScore', state.score.toString());
      setHighScore(state.score);
      setIsNewHighScore(true);
    } else {
      setHighScore(previousHigh);
    }

    // Store other stats
    const gamesPlayed = parseInt(localStorage.getItem('commandOverload_gamesPlayed') || '0', 10) + 1;
    localStorage.setItem('commandOverload_gamesPlayed', gamesPlayed.toString());

    const bestStreak = parseInt(localStorage.getItem('commandOverload_bestStreak') || '0', 10);
    if (state.maxStreak > bestStreak) {
      localStorage.setItem('commandOverload_bestStreak', state.maxStreak.toString());
    }
  }, [state.score, state.maxStreak]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative">
      {/* Glitch effect background */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          className="absolute inset-0 bg-destructive/5"
          animate={{ opacity: [0.05, 0.1, 0.05] }}
          transition={{ duration: 0.5, repeat: Infinity }}
        />
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 text-center p-8 border border-destructive/50 bg-background/80 backdrop-blur-sm max-w-lg w-full mx-4"
      >
        {/* System crash header */}
        <motion.div
          animate={{ x: [-2, 2, -2, 0] }}
          transition={{ duration: 0.3, repeat: 3 }}
        >
          <h1 className="font-display text-4xl md:text-5xl font-bold text-destructive text-glow-red mb-2">
            SYSTEM OVERLOAD
          </h1>
        </motion.div>

        <p className="font-mono text-muted-foreground text-sm mb-8">
          [ CRITICAL FAILURE • ALL SYSTEMS OFFLINE ]
        </p>

        {/* Stats grid */}
        <div className="grid grid-cols-2 gap-4 mb-8">
          <div className="p-4 border border-border bg-card/50">
            <p className="font-mono text-xs text-muted-foreground mb-1">FINAL SCORE</p>
            <p className="font-display text-3xl text-primary">
              {state.score.toLocaleString()}
            </p>
            {isNewHighScore && (
              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="font-mono text-xs text-warning mt-1"
              >
                NEW HIGH SCORE!
              </motion.p>
            )}
          </div>

          <div className="p-4 border border-border bg-card/50">
            <p className="font-mono text-xs text-muted-foreground mb-1">SURVIVAL TIME</p>
            <p className="font-display text-3xl text-primary">
              {formatTime(state.elapsedTime)}
            </p>
          </div>

          <div className="p-4 border border-border bg-card/50">
            <p className="font-mono text-xs text-muted-foreground mb-1">TASKS COMPLETED</p>
            <p className="font-display text-2xl text-success">
              {state.completedTasks}
            </p>
          </div>

          <div className="p-4 border border-border bg-card/50">
            <p className="font-mono text-xs text-muted-foreground mb-1">TASKS FAILED</p>
            <p className="font-display text-2xl text-destructive">
              {state.failedTasks}
            </p>
          </div>

          <div className="p-4 border border-border bg-card/50">
            <p className="font-mono text-xs text-muted-foreground mb-1">BEST STREAK</p>
            <p className="font-display text-2xl text-accent">
              {state.maxStreak}
            </p>
          </div>

          <div className="p-4 border border-border bg-card/50">
            <p className="font-mono text-xs text-muted-foreground mb-1">HIGH SCORE</p>
            <p className="font-display text-2xl text-warning">
              {highScore.toLocaleString()}
            </p>
          </div>
        </div>

        {/* Restart button */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={startGame}
          className="px-8 py-3 bg-primary/20 border-2 border-primary text-primary font-display text-lg tracking-widest
                     hover:bg-primary hover:text-primary-foreground transition-all duration-300 glow-cyan"
        >
          REINITIALIZE SYSTEM
        </motion.button>

        {/* Hidden stats reveal */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="mt-6 pt-4 border-t border-border/50"
        >
          <p className="font-mono text-xs text-muted-foreground mb-2">[ SYSTEM ANALYSIS ]</p>
          <div className="flex justify-center gap-6 font-mono text-xs">
            <span className="text-muted-foreground">
              ENTROPY: <span className="text-warning">{state.entropy.toFixed(0)}</span>
            </span>
            <span className="text-muted-foreground">
              CMD DEBT: <span className="text-destructive">{state.commandDebt.toFixed(0)}</span>
            </span>
            <span className="text-muted-foreground">
              AI TRUST: <span className="text-success">{state.aiTrust.toFixed(0)}%</span>
            </span>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}
