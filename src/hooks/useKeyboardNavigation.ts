import { useEffect, useCallback } from 'react';
import { useAccessibility } from '@/contexts/AccessibilityContext';
import { useGame } from '@/contexts/GameContext';
import { useTextToSpeech } from './useTextToSpeech';
import { useSpatialAudio } from './useSpatialAudio';
import { TILE_HOTKEYS, TASK_TO_INDEX } from '@/types/accessibility';
import { TaskType } from '@/types/game';

const TASK_TYPES: TaskType[] = ['type', 'drag', 'sort', 'connect', 'hold', 'track'];

export function useKeyboardNavigation() {
  const { state: accessibilityState, setFocusedTile, setFocusedAlert, toggleMute } = useAccessibility();
  const { state: gameState } = useGame();
  const { announceStatus, announceFocus, repeatLast } = useTextToSpeech();
  const { playCorrectBeep } = useSpatialAudio();

  // Get alert for a specific tile
  const getAlertForTile = useCallback((tileIndex: number): boolean => {
    const taskType = TASK_TYPES[tileIndex];
    return gameState.alerts.some(a => a.taskType === taskType);
  }, [gameState.alerts]);

  // Handle keyboard navigation
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    // Only active during gameplay and in blind mode
    if (gameState.status !== 'playing') return;
    if (!accessibilityState.blindMode) return;

    const key = event.key.toLowerCase();

    // Number keys 1-6: Jump to specific tile
    if (TILE_HOTKEYS[key]) {
      event.preventDefault();
      const taskType = TILE_HOTKEYS[key];
      const index = TASK_TO_INDEX[taskType];
      setFocusedTile(index);
      playCorrectBeep();
      announceFocus(taskType, getAlertForTile(index));
      return;
    }

    switch (key) {
      // Arrow navigation between tiles
      case 'arrowleft':
        event.preventDefault();
        const prevTile = Math.max(0, accessibilityState.focusedTileIndex - 1);
        setFocusedTile(prevTile);
        announceFocus(TASK_TYPES[prevTile], getAlertForTile(prevTile));
        break;

      case 'arrowright':
        event.preventDefault();
        const nextTile = Math.min(5, accessibilityState.focusedTileIndex + 1);
        setFocusedTile(nextTile);
        announceFocus(TASK_TYPES[nextTile], getAlertForTile(nextTile));
        break;

      // Alert queue navigation
      case 'arrowup':
        event.preventDefault();
        if (gameState.alerts.length > 0) {
          const prevAlert = Math.max(0, accessibilityState.focusedAlertIndex - 1);
          setFocusedAlert(prevAlert);
        }
        break;

      case 'arrowdown':
        event.preventDefault();
        if (gameState.alerts.length > 0) {
          const nextAlert = Math.min(gameState.alerts.length - 1, accessibilityState.focusedAlertIndex + 1);
          setFocusedAlert(nextAlert);
        }
        break;

      // Status announcement
      case 's':
        if (!event.ctrlKey && !event.metaKey) {
          event.preventDefault();
          announceStatus(gameState.stability, gameState.alerts.length, gameState.score);
        }
        break;

      // Repeat last announcement
      case 'r':
        if (!event.ctrlKey && !event.metaKey) {
          event.preventDefault();
          repeatLast();
        }
        break;

      // Mute toggle
      case 'm':
        if (!event.ctrlKey && !event.metaKey) {
          event.preventDefault();
          toggleMute();
        }
        break;
    }
  }, [
    gameState.status,
    gameState.alerts,
    gameState.stability,
    gameState.score,
    accessibilityState.blindMode,
    accessibilityState.focusedTileIndex,
    accessibilityState.focusedAlertIndex,
    setFocusedTile,
    setFocusedAlert,
    toggleMute,
    announceStatus,
    announceFocus,
    repeatLast,
    playCorrectBeep,
    getAlertForTile,
  ]);

  // Register keyboard listener
  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  return {
    focusedTileIndex: accessibilityState.focusedTileIndex,
    focusedAlertIndex: accessibilityState.focusedAlertIndex,
    getAlertForTile,
  };
}
