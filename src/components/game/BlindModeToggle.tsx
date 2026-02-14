import { motion } from 'framer-motion';
import { Eye, EyeOff } from 'lucide-react';
import { useAccessibility } from '@/contexts/AccessibilityContext';

export function BlindModeToggle() {
  const { state, setBlindMode } = useAccessibility();

  return (
    <motion.button
      onClick={() => setBlindMode(!state.blindMode)}
      className={`
        flex items-center gap-2 px-4 py-2 rounded-lg font-mono text-sm
        border-2 transition-all duration-300
        ${state.blindMode 
          ? 'bg-accent text-accent-foreground border-accent glow-cyan' 
          : 'bg-muted/50 text-muted-foreground border-muted hover:border-primary/50'
        }
      `}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      aria-pressed={state.blindMode}
      aria-label={state.blindMode ? 'Disable blind mode' : 'Enable blind mode'}
    >
      {state.blindMode ? (
        <>
          <EyeOff className="w-4 h-4" />
          <span>AUDIO MODE: ON</span>
        </>
      ) : (
        <>
          <Eye className="w-4 h-4" />
          <span>AUDIO MODE: OFF</span>
        </>
      )}
    </motion.button>
  );
}
