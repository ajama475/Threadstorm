import { useGame } from '@/contexts/GameContext';
import { motion } from 'framer-motion';
import { AlertTriangle, Zap, Target, Clock, Volume2, VolumeX } from 'lucide-react';

export function StatusBar() {
  const { state, dispatch } = useGame();

  const stabilityColor = 
    state.stability > 60 ? 'bg-success' :
    state.stability > 30 ? 'bg-warning' : 'bg-destructive';

  const stabilityGlow = 
    state.stability > 60 ? 'glow-green' :
    state.stability > 30 ? 'glow-yellow' : 'glow-red';

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <motion.div
      initial={{ y: -50, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="sticky top-0 z-40 bg-background/90 backdrop-blur-sm border-b border-border p-4"
    >
      <div className="flex items-center justify-between gap-4">
        {/* Left: Title & Timer */}
        <div className="flex items-center gap-6">
          <h1 className="font-display text-xl tracking-wider text-primary hidden md:block">
            COMMAND OVERLOAD
          </h1>
          <div className="flex items-center gap-2 font-mono text-sm">
            <Clock className="w-4 h-4 text-muted-foreground" />
            <span className="text-foreground">{formatTime(state.elapsedTime)}</span>
          </div>
        </div>

        {/* Center: Stability Meter */}
        <div className="flex-1 max-w-md">
          <div className="flex items-center gap-2 mb-1">
            <Zap className="w-4 h-4 text-primary" />
            <span className="font-mono text-xs text-muted-foreground uppercase tracking-wider">
              System Stability
            </span>
            <span className={`font-mono text-sm ${
              state.stability > 60 ? 'text-success' :
              state.stability > 30 ? 'text-warning' : 'text-destructive'
            }`}>
              {state.stability.toFixed(0)}%
            </span>
          </div>
          <div className="relative h-3 bg-muted rounded-full overflow-hidden">
            <motion.div
              className={`absolute inset-y-0 left-0 ${stabilityColor} ${stabilityGlow}`}
              initial={{ width: '100%' }}
              animate={{ width: `${state.stability}%` }}
              transition={{ duration: 0.3 }}
            />
            {/* Critical warning pulse */}
            {state.stability < 30 && (
              <motion.div
                className="absolute inset-0 bg-destructive/30"
                animate={{ opacity: [0, 0.5, 0] }}
                transition={{ duration: 0.5, repeat: Infinity }}
              />
            )}
          </div>
        </div>

        {/* Right: Stats */}
        <div className="flex items-center gap-4">
          {/* Alert count */}
          <div className="flex items-center gap-2 px-3 py-1 border border-border bg-card/50 rounded">
            <AlertTriangle className={`w-4 h-4 ${
              state.alerts.length > 5 ? 'text-destructive' :
              state.alerts.length > 3 ? 'text-warning' : 'text-primary'
            }`} />
            <span className="font-mono text-sm">{state.alerts.length}</span>
          </div>

          {/* Score */}
          <div className="flex items-center gap-2 px-3 py-1 border border-primary/50 bg-primary/10 rounded">
            <Target className="w-4 h-4 text-primary" />
            <span className="font-display text-lg text-primary">
              {state.score.toLocaleString()}
            </span>
          </div>

          {/* Streak */}
          {state.streak > 0 && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="flex items-center gap-1 px-2 py-1 bg-accent/20 border border-accent rounded"
            >
              <span className="font-mono text-xs text-accent">×{state.streak}</span>
            </motion.div>
          )}

          {/* Difficulty indicator */}
          <div className="hidden md:flex items-center gap-1">
            {Array.from({ length: 10 }).map((_, i) => (
              <div
                key={i}
                className={`w-1 h-4 rounded-full transition-colors ${
                  i < state.difficulty ? 'bg-primary' : 'bg-muted'
                }`}
              />
            ))}
          </div>

          {/* Mute toggle */}
          <button
            onClick={() => dispatch({ type: 'TOGGLE_MUTE' })}
            className="p-1.5 border border-border rounded hover:bg-muted/50 transition-colors"
            aria-label={state.muted ? 'Unmute audio' : 'Mute audio'}
          >
            {state.muted ? (
              <VolumeX className="w-4 h-4 text-muted-foreground" />
            ) : (
              <Volume2 className="w-4 h-4 text-primary" />
            )}
          </button>
        </div>
      </div>
    </motion.div>
  );
}
