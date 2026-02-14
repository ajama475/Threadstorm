import { useState, useEffect, useCallback } from 'react';
import { useGame } from '@/contexts/GameContext';
import { motion } from 'framer-motion';
import { generateAlert } from '@/lib/alertGenerator';

const TUTORIAL_STEPS = [
  {
    title: 'TYPE PANEL',
    instruction: 'Alerts appear in the queue on the right. The TYPE panel shows a code — type it to clear the alert before time runs out!',
    taskType: 'type' as const,
  },
  {
    title: 'DRAG PANEL',
    instruction: 'Drag items to their matching zones. Speed matters — every second you waste ticks down the timer!',
    taskType: 'drag' as const,
  },
  {
    title: 'STABILITY SYSTEM',
    instruction: 'Missing alerts drops your stability bar. Hit 0% and the system crashes. Keep it alive!',
    taskType: null,
  },
];

interface TutorialOverlayProps {
  onComplete: () => void;
}

export function TutorialOverlay({ onComplete }: TutorialOverlayProps) {
  const { state, dispatch } = useGame();
  const [step, setStep] = useState(0);
  const [waitingForTask, setWaitingForTask] = useState(false);
  const [taskStartCompleted, setTaskStartCompleted] = useState(0);

  const currentStep = TUTORIAL_STEPS[step];

  const advanceStep = useCallback(() => {
    if (step < TUTORIAL_STEPS.length - 1) {
      setStep(s => s + 1);
    } else {
      onComplete();
    }
  }, [step, onComplete]);

  // Spawn tutorial alert for current step
  useEffect(() => {
    if (!currentStep?.taskType) return;

    const alert = generateAlert(1, 0, 100, [currentStep.taskType]);
    alert.timeLimit = 30;
    alert.timeRemaining = 30;
    alert.urgency = 'low';
    dispatch({ type: 'ADD_ALERT', payload: alert });
    setTaskStartCompleted(state.completedTasks);
    setWaitingForTask(true);
  }, [step]); // eslint-disable-line react-hooks/exhaustive-deps

  // Detect task completion
  useEffect(() => {
    if (waitingForTask && state.alerts.length === 0 && state.completedTasks > taskStartCompleted) {
      setWaitingForTask(false);
      setTimeout(advanceStep, 800);
    }
  }, [state.alerts.length, state.completedTasks, waitingForTask, taskStartCompleted, advanceStep]);

  // Esc to skip
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onComplete(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onComplete]);

  // Auto-advance non-task steps
  useEffect(() => {
    if (currentStep && !currentStep.taskType) {
      const timer = setTimeout(advanceStep, 5000);
      return () => clearTimeout(timer);
    }
  }, [step, currentStep, advanceStep]);

  if (!currentStep) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 pointer-events-none"
    >
      <div className="absolute inset-0 bg-background/30" />

      <div className="absolute bottom-0 left-0 right-0 pointer-events-auto">
        <motion.div
          key={step}
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="mx-auto max-w-2xl mb-8 p-6 border border-primary/50 bg-card/90 backdrop-blur-sm"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <span className="font-mono text-xs text-primary bg-primary/20 px-2 py-1">
                STEP {step + 1}/{TUTORIAL_STEPS.length}
              </span>
              <h3 className="font-display text-lg text-primary tracking-wider">{currentStep.title}</h3>
            </div>
            <button onClick={onComplete} className="font-mono text-xs text-muted-foreground hover:text-foreground transition-colors">
              SKIP TUTORIAL [ESC]
            </button>
          </div>

          <p className="font-mono text-sm text-foreground">{currentStep.instruction}</p>

          {!currentStep.taskType && (
            <button
              onClick={advanceStep}
              className="mt-4 px-4 py-2 border border-primary text-primary font-mono text-sm hover:bg-primary hover:text-primary-foreground transition-all"
            >
              {step === TUTORIAL_STEPS.length - 1 ? 'START GAME' : 'NEXT'}
            </button>
          )}
        </motion.div>
      </div>
    </motion.div>
  );
}
