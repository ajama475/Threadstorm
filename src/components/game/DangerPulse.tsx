import { useState, useEffect } from 'react';
import { useGame } from '@/contexts/GameContext';
import { motion } from 'framer-motion';
import { gameConfig } from '@/lib/gameConfig';

export function DangerPulse() {
  const { state } = useGame();
  const [active, setActive] = useState(false);

  useEffect(() => {
    if (state.status !== 'playing') { setActive(false); return; }
    if (!active && state.stability < gameConfig.dangerPulseOnThreshold) setActive(true);
    else if (active && state.stability > gameConfig.dangerPulseOffThreshold) setActive(false);
  }, [state.stability, state.status, active]);

  if (!active || state.status !== 'playing') return null;

  const isFast = state.stability < gameConfig.dangerPulseFastThreshold;

  return (
    <motion.div
      className="fixed inset-0 pointer-events-none z-50 border-4 border-destructive/60"
      animate={{
        opacity: [0.3, 0.7, 0.3],
        boxShadow: [
          'inset 0 0 30px hsl(0 80% 55% / 0.2)',
          'inset 0 0 60px hsl(0 80% 55% / 0.4)',
          'inset 0 0 30px hsl(0 80% 55% / 0.2)',
        ],
      }}
      transition={{ duration: isFast ? 0.4 : 0.8, repeat: Infinity, ease: 'easeInOut' }}
      aria-hidden="true"
    />
  );
}
