import { useState, useEffect, useRef, useCallback } from 'react';
import { useGame } from '@/contexts/GameContext';
import { gameConfig } from '@/lib/gameConfig';
import { motion, AnimatePresence } from 'framer-motion';

const TRASH_TALK_LINES = [
  'NOTICE: Your performance has been flagged for review.',
  'MEMO: The system expected better. Much better.',
  'ALERT: Competence levels critically low. Please recalibrate.',
  'REMINDER: Other operators completed this task. First try.',
  'FYI: The AI considered helping you. Then it laughed.',
  'UPDATE: Your failure has been logged and forwarded to management.',
  'NOTE: This would be embarrassing if anyone was watching. They are.',
  'ADVISORY: Perhaps consider a career in something less demanding.',
];

const SPEED_MESSAGES = [
  'SAFETY VIOLATION: Excessive efficiency detected. Please slow down.',
  'WARNING: Operator speed exceeds approved parameters. Compliance required.',
  'ALERT: Unauthorized productivity spike detected. Throttle immediately.',
];

const ACKNOWLEDGE_BUTTONS = [
  'I ACKNOWLEDGE MY FAILURE',
  'I UNDERSTAND',
  'I WILL DO BETTER',
  'ACKNOWLEDGED',
  'YES, I AM AWARE',
  'I ACCEPT RESPONSIBILITY',
];

function pick<T>(arr: T[]): T { return arr[Math.floor(Math.random() * arr.length)]; }

interface PopupData { type: 'trashTalk' | 'speed'; message: string; button: string; }

export function PopupsManager() {
  const { state } = useGame();
  const [popup, setPopup] = useState<PopupData | null>(null);
  const lastTrashRef = useRef(0);
  const lastSpeedRef = useRef(0);
  const prevFailed = useRef(state.failedTasks);
  const prevCompleted = useRef(state.completedTasks);

  const dismiss = useCallback(() => setPopup(null), []);

  // Reset refs on new run
  useEffect(() => {
    if (state.status === 'playing' && state.completedTasks === 0) {
      prevFailed.current = 0;
      prevCompleted.current = 0;
      lastTrashRef.current = 0;
      lastSpeedRef.current = 0;
    }
  }, [state.status, state.completedTasks]);

  // Trash-talk popup: stability >= 70 AND fail
  useEffect(() => {
    if (state.status !== 'playing' || popup) return;
    const now = Date.now();
    if (now - state.runStartTime < gameConfig.popupGracePeriodMs) { prevFailed.current = state.failedTasks; return; }

    if (state.failedTasks > prevFailed.current &&
        state.stability >= gameConfig.trashTalkPopupMinStability &&
        now - lastTrashRef.current > gameConfig.trashTalkPopupCooldownMs) {
      lastTrashRef.current = now;
      setPopup({ type: 'trashTalk', message: pick(TRASH_TALK_LINES), button: pick(ACKNOWLEDGE_BUTTONS) });
    }
    prevFailed.current = state.failedTasks;
  }, [state.failedTasks, state.status, state.stability, state.runStartTime, popup]);

  // Speed popup
  useEffect(() => {
    if (state.status !== 'playing' || popup) return;
    const now = Date.now();
    if (now - state.runStartTime < gameConfig.popupGracePeriodMs) { prevCompleted.current = state.completedTasks; return; }

    if (state.completedTasks > prevCompleted.current && state.completionTimestamps.length >= gameConfig.speedBurstCount) {
      if (now - lastSpeedRef.current > gameConfig.speedPopupCooldownMs) {
        const recent = state.completionTimestamps.slice(-gameConfig.speedBurstCount);
        const burst = recent[recent.length - 1] - recent[0] < gameConfig.speedBurstWindowMs;

        let avgFast = false;
        if (state.completionTimestamps.length >= gameConfig.avgSpeedCount) {
          const last = state.completionTimestamps.slice(-gameConfig.avgSpeedCount);
          const gaps = last.slice(1).map((t, i) => t - last[i]);
          avgFast = gaps.reduce((a, b) => a + b, 0) / gaps.length < gameConfig.avgSpeedThresholdMs;
        }

        if (burst || avgFast) {
          lastSpeedRef.current = now;
          setPopup({ type: 'speed', message: pick(SPEED_MESSAGES), button: 'I WILL COMPLY' });
        }
      }
    }
    prevCompleted.current = state.completedTasks;
  }, [state.completedTasks, state.status, state.completionTimestamps, state.runStartTime, popup]);

  return (
    <AnimatePresence>
      {popup && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-background/80 backdrop-blur-sm"
        >
          <motion.div
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 20 }}
            className={`max-w-md w-full mx-4 p-8 border-2 bg-card/95 backdrop-blur-sm text-center ${
              popup.type === 'speed' ? 'border-warning glow-yellow' : 'border-destructive glow-red'
            }`}
          >
            <div className="font-mono text-xs text-muted-foreground mb-4">
              {popup.type === 'speed' ? '[ COMPLIANCE DIVISION ]' : '[ PERFORMANCE REVIEW ]'}
            </div>
            <p className="font-mono text-foreground text-sm leading-relaxed mb-8">{popup.message}</p>
            <button
              onClick={dismiss}
              className={`px-6 py-3 border-2 font-mono text-sm tracking-wider transition-all duration-300 ${
                popup.type === 'speed'
                  ? 'border-warning text-warning hover:bg-warning hover:text-warning-foreground'
                  : 'border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground'
              }`}
            >
              {popup.button}
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
