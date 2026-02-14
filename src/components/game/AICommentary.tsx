import { useState, useEffect, useRef } from 'react';
import { useGame } from '@/contexts/GameContext';
import { motion, AnimatePresence } from 'framer-motion';
import { gameConfig } from '@/lib/gameConfig';

const TRASH_TALK = [
  "Wow. That was embarrassingly slow.",
  "My grandmother could've done that faster. She's dead.",
  "Are you even trying? Genuinely asking.",
  "I've seen faster reactions from a screensaver.",
  "That alert had a whole life. Got married. Had kids. You still missed it.",
  "Plot twist: YOU are the system failure.",
  "I'm not mad. Just disappointed. Actually, I'm mad too.",
  "Did your brain buffer? Should I wait?",
  "At this rate, we'll crash before you finish reading this.",
  "Fun fact: Sloths are faster. Look it up.",
  "ERROR 404: Your skills not found.",
  "I've calculated your success rate. It's embarrassing.",
  "Remember when you said you were 'pretty good at games'? Hilarious.",
  "The alerts are winning. The ALERTS. They don't even have hands.",
  "Maybe try a different hobby? Like watching paint dry?",
  "Your reaction time is measured in geological epochs.",
  "I'm starting to think YOU'RE the malware.",
  "Even my loading spinner is faster than you.",
];

const MILD_ROASTS = [
  "Hmm. That could've gone better.",
  "Not your best work there, champ.",
  "The system noticed that. Just saying.",
  "Stability called. It's worried about you.",
  "That alert deserved better.",
  "I've seen better. From you. Once.",
  "Room for improvement. Lots of room.",
  "My expectations were low. You still disappointed.",
];

const PRAISE = [
  "Okay, that was actually impressive.",
  "Fine. I'll admit that was good.",
  "The system... approves? This feels weird.",
  "Look at you go! Who IS this?",
  "Stability restored. I'm almost proud.",
  "That was clean. Very clean.",
  "Error in my calculations... you're actually decent?",
  "Keep that up and I might respect you.",
];

const EXCITED_PRAISE = [
  "WAIT. You're actually GOOD at this??",
  "System stability: IMMACULATE. I'm shook.",
  "Okay operator, I see you!",
  "That streak is giving main character energy.",
  "The alerts fear you now. As they should.",
  "I... I might have misjudged you.",
  "You're making this look EASY. Suspicious.",
  "Critical systems stabilized. You absolute legend.",
];

const RECOVERY_PRAISE = [
  "Oh? Making a comeback? Interesting.",
  "From chaos to control. Respect.",
  "You almost had me worried there. Almost.",
  "System recovering. Maybe you're not hopeless.",
];

const QUEUE_WARNINGS = [
  "The queue is getting crowded. Just like your inbox.",
  "That's a LOT of pending alerts. You good?",
  "Alert overload incoming. Try... going faster?",
];

type CommentaryMood = 'trash' | 'mild' | 'praise' | 'hype' | 'recovery' | 'neutral';

function pick(arr: string[]): string { return arr[Math.floor(Math.random() * arr.length)]; }

export function AICommentary() {
  const { state } = useGame();
  const [message, setMessage] = useState<string | null>(null);
  const [mood, setMood] = useState<CommentaryMood>('neutral');
  const lastStabilityRef = useRef(state.stability);
  const lastStreakRef = useRef(state.streak);
  const lastFailedRef = useRef(state.failedTasks);
  const lastAlertCountRef = useRef(state.alerts.length);
  const messageTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastVoiceRef = useRef(0);
  const lastSpokenRef = useRef<string | null>(null);
  const crossedThresholds = useRef(new Set<number>());

  // Reset thresholds on new run
  useEffect(() => {
    if (state.status === 'playing' && state.completedTasks === 0) {
      crossedThresholds.current.clear();
    }
  }, [state.status, state.completedTasks]);

  useEffect(() => {
    if (state.status !== 'playing') { setMessage(null); return; }

    const showMsg = (msg: string, m: CommentaryMood) => {
      setMessage(msg);
      setMood(m);
      if (messageTimeoutRef.current) clearTimeout(messageTimeoutRef.current);
      messageTimeoutRef.current = setTimeout(() => setMessage(null), 3500);
    };

    // Fails
    if (state.failedTasks > lastFailedRef.current) {
      const drop = lastStabilityRef.current - state.stability;
      if (drop >= 15 || state.stability < 30) showMsg(pick(TRASH_TALK), 'trash');
      else showMsg(pick(MILD_ROASTS), 'mild');
    }
    // Streaks
    else if (state.streak > lastStreakRef.current && state.streak >= 3) {
      if (state.streak >= 7) showMsg(pick(EXCITED_PRAISE), 'hype');
      else showMsg(pick(PRAISE), 'praise');
    }
    // Recovery
    else if (state.stability > lastStabilityRef.current + 5 && lastStabilityRef.current < 60) {
      showMsg(pick(RECOVERY_PRAISE), 'recovery');
    }
    // Stability threshold crossings
    else {
      for (const threshold of gameConfig.voiceStabilityThresholds) {
        if (state.stability < threshold && lastStabilityRef.current >= threshold && !crossedThresholds.current.has(threshold)) {
          crossedThresholds.current.add(threshold);
          showMsg(pick(TRASH_TALK), 'trash');
          break;
        }
      }
    }

    // Queue warning
    if (state.alerts.length >= gameConfig.voiceAlertQueueThreshold && lastAlertCountRef.current < gameConfig.voiceAlertQueueThreshold) {
      showMsg(pick(QUEUE_WARNINGS), 'mild');
    }

    lastStabilityRef.current = state.stability;
    lastStreakRef.current = state.streak;
    lastFailedRef.current = state.failedTasks;
    lastAlertCountRef.current = state.alerts.length;

    return () => { if (messageTimeoutRef.current) clearTimeout(messageTimeoutRef.current); };
  }, [state.stability, state.streak, state.failedTasks, state.alerts.length, state.status]);

  // Voice synthesis
  useEffect(() => {
    if (!message || state.muted || message === lastSpokenRef.current) return;
    lastSpokenRef.current = message;

    const now = Date.now();
    if (now - lastVoiceRef.current < gameConfig.voiceCooldownMs) return;

    try {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        const utt = new SpeechSynthesisUtterance(message);
        utt.rate = 1.1;
        utt.pitch = 0.8;
        utt.volume = 0.7;
        window.speechSynthesis.speak(utt);
        lastVoiceRef.current = now;
      }
    } catch { /* speechSynthesis unavailable */ }
  }, [message, state.muted]);

  const moodColors: Record<CommentaryMood, string> = {
    trash: 'text-destructive border-destructive/50 bg-destructive/10',
    mild: 'text-warning border-warning/50 bg-warning/10',
    praise: 'text-success border-success/50 bg-success/10',
    hype: 'text-primary border-primary/50 bg-primary/10',
    recovery: 'text-accent border-accent/50 bg-accent/10',
    neutral: 'text-muted-foreground border-muted bg-muted/10',
  };

  return (
    <AnimatePresence>
      {message && (
        <motion.div
          initial={{ opacity: 0, y: -20, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -10, scale: 0.95 }}
          className={`fixed top-20 left-1/2 -translate-x-1/2 z-50
                      max-w-md px-4 py-3 border rounded-lg backdrop-blur-sm
                      font-mono text-sm text-center ${moodColors[mood]}`}
        >
          <div className="flex items-center gap-2 justify-center">
            <span className="text-xs opacity-60">[SYSTEM]</span>
            <span>{message}</span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
