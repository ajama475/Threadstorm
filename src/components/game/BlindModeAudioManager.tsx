import { useEffect, useRef } from 'react';
import { useGame } from '@/contexts/GameContext';
import { useAccessibility } from '@/contexts/AccessibilityContext';
import { useTextToSpeech } from '@/hooks/useTextToSpeech';
import { useSpatialAudio } from '@/hooks/useSpatialAudio';
import { useKeyboardNavigation } from '@/hooks/useKeyboardNavigation';
import { useVoiceCommands } from '@/hooks/useVoiceCommands';

/**
 * This component manages all blind mode audio feedback.
 * It watches game state and triggers TTS announcements and spatial audio cues.
 */
export function BlindModeAudioManager() {
  const { state: gameState } = useGame();
  const { state: accessibilityState } = useAccessibility();
  const { 
    announceAlert, 
    announceFeedback, 
    speakNow,
    stopSpeech 
  } = useTextToSpeech();
  const { 
    playTaskAudio, 
    playSuccessChime, 
    playFailureSound,
    startPressureDrone,
    stopPressureDrone,
    startHeartbeat,
    stopHeartbeat 
  } = useSpatialAudio();

  // Initialize keyboard navigation and voice commands
  useKeyboardNavigation();
  useVoiceCommands();

  // Track previous state for change detection
  const prevStateRef = useRef(gameState);
  const prevAlertsRef = useRef<string[]>([]);

  // Announce new alerts
  useEffect(() => {
    if (!accessibilityState.blindMode) return;

    const currentAlertIds = gameState.alerts.map(a => a.id);
    const prevAlertIds = prevAlertsRef.current;

    // Find new alerts
    const newAlerts = gameState.alerts.filter(a => !prevAlertIds.includes(a.id));
    
    // Announce each new alert
    newAlerts.forEach(alert => {
      announceAlert(alert);
      playTaskAudio(alert.taskType, alert.urgency);
    });

    prevAlertsRef.current = currentAlertIds;
  }, [gameState.alerts, accessibilityState.blindMode, announceAlert, playTaskAudio]);

  // Track task completions and failures
  useEffect(() => {
    if (!accessibilityState.blindMode) return;

    const prev = prevStateRef.current;

    // Task completed
    if (gameState.completedTasks > prev.completedTasks) {
      playSuccessChime();
      // Calculate approximate points for the announcement
      const points = (gameState.score - prev.score);
      if (points > 0) {
        announceFeedback('complete', points);
      }
    }

    // Task failed
    if (gameState.failedTasks > prev.failedTasks) {
      playFailureSound();
      announceFeedback('fail');
    }

    prevStateRef.current = gameState;
  }, [
    gameState.completedTasks, 
    gameState.failedTasks,
    gameState.score,
    accessibilityState.blindMode,
    playSuccessChime,
    playFailureSound,
    announceFeedback,
  ]);

  // System pressure audio
  useEffect(() => {
    if (!accessibilityState.blindMode || accessibilityState.muted) {
      stopPressureDrone();
      stopHeartbeat();
      return;
    }

    if (gameState.status === 'playing') {
      startPressureDrone(gameState.alerts.length, gameState.stability);
      startHeartbeat(gameState.stability);
    } else {
      stopPressureDrone();
      stopHeartbeat();
    }

    return () => {
      stopPressureDrone();
      stopHeartbeat();
    };
  }, [
    gameState.status,
    gameState.alerts.length,
    gameState.stability,
    accessibilityState.blindMode,
    accessibilityState.muted,
    startPressureDrone,
    stopPressureDrone,
    startHeartbeat,
    stopHeartbeat,
  ]);

  // Game start/end announcements
  useEffect(() => {
    if (!accessibilityState.blindMode) return;

    if (gameState.status === 'playing' && prevStateRef.current.status === 'idle') {
      speakNow('System initialized. Alerts incoming. Good luck, operator.');
    }

    if (gameState.status === 'gameOver' && prevStateRef.current.status === 'playing') {
      stopSpeech();
      setTimeout(() => {
        speakNow(`System crashed. Final score: ${gameState.score}. Tasks completed: ${gameState.completedTasks}.`);
      }, 500);
    }
  }, [
    gameState.status,
    gameState.score,
    gameState.completedTasks,
    accessibilityState.blindMode,
    speakNow,
    stopSpeech,
  ]);

  // This is a headless component - it only manages audio
  return null;
}
