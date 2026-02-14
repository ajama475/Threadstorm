import React, { createContext, useContext, useReducer, useCallback, useRef, useEffect } from 'react';
import { GameState, GameAction, Alert, TaskType, AlertUrgency } from '@/types/game';
import { generateAlert } from '@/lib/alertGenerator';
import { useSoundEffects } from '@/hooks/useSoundEffects';
import { gameConfig } from '@/lib/gameConfig';
import { toast } from 'sonner';

const initialState: GameState = {
  status: 'idle',
  score: 0,
  stability: 100,
  alerts: [],
  activeAlertId: null,
  completedTasks: 0,
  failedTasks: 0,
  streak: 0,
  maxStreak: 0,
  startTime: null,
  elapsedTime: 0,
  difficulty: 1,
  entropy: 0,
  commandDebt: 0,
  aiTrust: 100,
  tier: 0,
  unlockedPanels: [gameConfig.unlockOrder[0]],
  completionTimestamps: [],
  runStartTime: 0,
  tutorialCompleted: false,
  muted: false,
};

function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'BOOT':
      return {
        ...initialState,
        status: 'booting',
        tutorialCompleted: state.tutorialCompleted,
        muted: state.muted,
      };

    case 'SHOW_START':
      return { ...state, status: 'startScreen' };

    case 'START_TUTORIAL':
      return {
        ...initialState,
        status: 'tutorial',
        startTime: Date.now(),
        runStartTime: Date.now(),
        tutorialCompleted: false,
        muted: state.muted,
        tier: 0,
        unlockedPanels: ['type', 'drag'],
      };

    case 'START_GAME':
      return {
        ...initialState,
        status: 'playing',
        startTime: Date.now(),
        runStartTime: Date.now(),
        tutorialCompleted: true,
        muted: state.muted,
        tier: 0,
        unlockedPanels: [gameConfig.unlockOrder[0]],
      };

    case 'PAUSE_GAME':
      return { ...state, status: 'paused' };

    case 'RESUME_GAME':
      return { ...state, status: 'playing' };

    case 'END_GAME':
      return { ...state, status: 'gameOver' };

    case 'ADD_ALERT':
      if (state.alerts.some((alert) =>
        alert.id === action.payload.id ||
        (alert.taskType === action.payload.taskType &&
         alert.title === action.payload.title &&
         alert.description === action.payload.description)
      )) {
        return state;
      }
      return { ...state, alerts: [...state.alerts, action.payload] };

    case 'REMOVE_ALERT':
      return {
        ...state,
        alerts: state.alerts.filter(a => a.id !== action.payload),
        activeAlertId: state.activeAlertId === action.payload ? null : state.activeAlertId,
      };

    case 'SELECT_ALERT':
      return {
        ...state,
        activeAlertId: state.alerts.some(alert => alert.id === action.payload) ? action.payload : null,
      };

    case 'COMPLETE_TASK': {
      const { alertId, bonus = 0 } = action.payload;
      const alert = state.alerts.find(a => a.id === alertId);
      if (!alert) return state;

      const timeBonus = Math.floor(alert.timeRemaining * 2);
      const urgencyMultiplier =
        alert.urgency === 'critical' ? 4 :
        alert.urgency === 'high' ? 3 :
        alert.urgency === 'medium' ? 2 : 1;

      const points = (100 + timeBonus + bonus) * urgencyMultiplier;
      const newStreak = state.streak + 1;
      const newCompleted = state.completedTasks + 1;

      // Tier unlock (only during playing)
      let newTier = state.tier;
      let newUnlocked = [...state.unlockedPanels];
      if (state.status === 'playing') {
        const nextIdx = newTier + 1;
        if (nextIdx < gameConfig.unlockOrder.length &&
            newCompleted >= gameConfig.unlockEveryN * (newTier + 1)) {
          newTier++;
          const panel = gameConfig.unlockOrder[nextIdx];
          if (!newUnlocked.includes(panel)) newUnlocked.push(panel);
        }
      }

      return {
        ...state,
        score: state.score + points,
        completedTasks: newCompleted,
        streak: newStreak,
        maxStreak: Math.max(state.maxStreak, newStreak),
        alerts: state.alerts.filter(a => a.id !== alertId),
        activeAlertId: state.activeAlertId === alertId ? null : state.activeAlertId,
        stability: Math.min(100, state.stability + 5),
        entropy: Math.max(0, state.entropy - 8),
        commandDebt: Math.max(0, state.commandDebt - 3),
        aiTrust: Math.min(100, state.aiTrust + 1),
        tier: newTier,
        unlockedPanels: newUnlocked,
        completionTimestamps: [...state.completionTimestamps, Date.now()],
      };
    }

    case 'FAIL_TASK': {
      const alert = state.alerts.find(a => a.id === action.payload);
      const stabilityPenalty =
        alert?.urgency === 'critical' ? 25 :
        alert?.urgency === 'high' ? 15 :
        alert?.urgency === 'medium' ? 10 : 5;

      const newStability = state.stability - stabilityPenalty;

      return {
        ...state,
        failedTasks: state.failedTasks + 1,
        streak: 0,
        alerts: state.alerts.map((existing) =>
          existing.id === action.payload
            ? { ...existing, timeRemaining: Math.max(1, existing.timeRemaining - 2) }
            : existing
        ),
        stability: newStability,
        entropy: state.entropy + 10,
        commandDebt: state.commandDebt + 5,
        aiTrust: Math.max(0, state.aiTrust - 5),
        status: newStability <= 0 && state.status === 'playing' ? 'gameOver' : state.status,
      };
    }

    case 'UPDATE_STABILITY':
      return {
        ...state,
        stability: Math.max(0, Math.min(100, action.payload)),
        status: action.payload <= 0 && state.status === 'playing' ? 'gameOver' : state.status,
      };

    case 'TICK': {
      const updatedAlerts = state.alerts.map(alert => ({
        ...alert,
        timeRemaining: alert.timeRemaining - action.payload,
      }));

      const expiredAlerts = updatedAlerts.filter(a => a.timeRemaining <= 0);
      const validAlerts = updatedAlerts.filter(a => a.timeRemaining > 0);

      let stabilityLoss = 0;
      expiredAlerts.forEach(alert => {
        stabilityLoss +=
          alert.urgency === 'critical' ? 20 :
          alert.urgency === 'high' ? 12 :
          alert.urgency === 'medium' ? 8 : 4;
      });

      const newStability = state.stability - stabilityLoss;

      return {
        ...state,
        alerts: validAlerts,
        activeAlertId: validAlerts.some(a => a.id === state.activeAlertId) ? state.activeAlertId : null,
        stability: Math.max(0, newStability),
        elapsedTime: state.elapsedTime + action.payload,
        failedTasks: state.failedTasks + expiredAlerts.length,
        streak: expiredAlerts.length > 0 ? 0 : state.streak,
        entropy: state.entropy + expiredAlerts.length * 5,
        status: newStability <= 0 && state.status === 'playing' ? 'gameOver' : state.status,
      };
    }

    case 'INCREASE_DIFFICULTY':
      return { ...state, difficulty: Math.min(10, state.difficulty + 1) };

    case 'UNLOCK_PANEL': {
      if (state.unlockedPanels.includes(action.payload)) return state;
      return {
        ...state,
        tier: state.tier + 1,
        unlockedPanels: [...state.unlockedPanels, action.payload],
      };
    }

    case 'TOGGLE_MUTE':
      return { ...state, muted: !state.muted };

    default:
      return state;
  }
}

interface GameContextValue {
  state: GameState;
  dispatch: React.Dispatch<GameAction>;
  startGame: () => void;
  startPlaying: () => void;
  pauseGame: () => void;
  resumeGame: () => void;
  selectAlert: (alert: Alert) => void;
  completeTask: (alertId: string, bonus?: number) => void;
  failTask: (alertId: string) => void;
}

const GameContext = createContext<GameContextValue | null>(null);

export function GameProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(gameReducer, initialState);
  const { playSound } = useSoundEffects();
  const gameLoopRef = useRef<NodeJS.Timeout | null>(null);
  const alertSpawnRef = useRef<NodeJS.Timeout | null>(null);
  const difficultyRef = useRef<NodeJS.Timeout | null>(null);
  const spawnStateRef = useRef(state);
  const prevStateRef = useRef(state);
  const prevTierRef = useRef(state.tier);
  const lastSpawnedTaskRef = useRef<TaskType | null>(null);

  useEffect(() => {
    spawnStateRef.current = state;
  }, [state]);

  // Sound effects based on state changes
  useEffect(() => {
    if (state.muted) { prevStateRef.current = state; return; }
    const prev = prevStateRef.current;

    if (state.completedTasks > prev.completedTasks) playSound('complete');
    if (state.failedTasks > prev.failedTasks) playSound('fail');

    if (state.alerts.length > prev.alerts.length) {
      const newAlert = state.alerts[state.alerts.length - 1];
      if (newAlert?.urgency === 'critical') playSound('critical');
      else if (newAlert?.urgency === 'high') playSound('warning');
      else playSound('alert');
    }

    if (state.stability < 30 && prev.stability >= 30) playSound('critical');
    else if (state.stability < 50 && prev.stability >= 50) playSound('warning');

    prevStateRef.current = state;
  }, [state, playSound]);

  // Unlock toast
  useEffect(() => {
    if (state.tier > prevTierRef.current && state.status === 'playing') {
      const panel = gameConfig.unlockOrder[state.tier];
      if (panel) toast(`NEW MODULE ONLINE: ${panel.toUpperCase()}`, { duration: 3000 });
    }
    prevTierRef.current = state.tier;
  }, [state.tier, state.status]);

  // Fallback unlock timer
  useEffect(() => {
    if (state.status !== 'playing') return;
    const nextIdx = state.tier + 1;
    if (nextIdx >= gameConfig.unlockOrder.length) return;

    const timer = setTimeout(() => {
      const panel = gameConfig.unlockOrder[nextIdx];
      if (panel && !state.unlockedPanels.includes(panel)) {
        dispatch({ type: 'UNLOCK_PANEL', payload: panel });
      }
    }, gameConfig.fallbackUnlockTimeSec * 1000);

    return () => clearTimeout(timer);
  }, [state.status, state.tier, state.unlockedPanels]);

  const startGame = useCallback(() => { dispatch({ type: 'BOOT' }); }, []);
  const startPlaying = useCallback(() => { dispatch({ type: 'START_GAME' }); }, []);
  const pauseGame = useCallback(() => { dispatch({ type: 'PAUSE_GAME' }); }, []);
  const resumeGame = useCallback(() => { dispatch({ type: 'RESUME_GAME' }); }, []);
  const selectAlert = useCallback((alert: Alert) => { dispatch({ type: 'SELECT_ALERT', payload: alert.id }); }, []);
  const completeTask = useCallback((alertId: string, bonus?: number) => { dispatch({ type: 'COMPLETE_TASK', payload: { alertId, bonus } }); }, []);
  const failTask = useCallback((alertId: string) => { dispatch({ type: 'FAIL_TASK', payload: alertId }); }, []);

  // Game loop — runs during playing AND tutorial
  useEffect(() => {
    if (state.status === 'playing' || state.status === 'tutorial') {
      gameLoopRef.current = setInterval(() => {
        dispatch({ type: 'TICK', payload: 0.1 });
      }, 100);
    } else {
      if (gameLoopRef.current) clearInterval(gameLoopRef.current);
    }
    return () => { if (gameLoopRef.current) clearInterval(gameLoopRef.current); };
  }, [state.status]);

  // Alert spawning — only during playing
  useEffect(() => {
    if (state.status !== 'playing') {
      if (alertSpawnRef.current) clearTimeout(alertSpawnRef.current);
      return;
    }

    const scheduleNext = (delay: number) => {
      alertSpawnRef.current = setTimeout(() => {
        const current = spawnStateRef.current;
        if (current.status !== 'playing') return;

        const activeTypes = new Set(current.alerts.map((alert) => alert.taskType));
        let candidateTypes = current.unlockedPanels.filter((type) => !activeTypes.has(type));
        if (candidateTypes.length === 0) candidateTypes = [...current.unlockedPanels];
        if (candidateTypes.length > 1 && lastSpawnedTaskRef.current) {
          candidateTypes = candidateTypes.filter((type) => type !== lastSpawnedTaskRef.current);
        }
        if (candidateTypes.length === 0) candidateTypes = [...current.unlockedPanels];

        const timeMult = Math.max(0.8, gameConfig.initialTimeMultiplier - current.tier * gameConfig.timeMultiplierDecayPerTier);
        const alert = generateAlert(current.difficulty, current.entropy, current.aiTrust, candidateTypes);
        alert.timeLimit = Math.round(alert.timeLimit * timeMult);
        alert.timeRemaining = alert.timeLimit;
        lastSpawnedTaskRef.current = alert.taskType;
        dispatch({ type: 'ADD_ALERT', payload: alert });

        const baseInterval = Math.max(
          2000,
          gameConfig.baseAlertIntervalMs -
            (current.difficulty * 300) -
            (current.entropy * 20) -
            (current.tier * gameConfig.alertIntervalReductionPerTier),
        );
        scheduleNext(baseInterval + Math.random() * 1000);
      }, delay);
    };

    scheduleNext(1000);
    return () => {
      if (alertSpawnRef.current) clearTimeout(alertSpawnRef.current);
    };
  }, [state.status]);

  // Difficulty escalation
  useEffect(() => {
    if (state.status === 'playing') {
      difficultyRef.current = setInterval(() => { dispatch({ type: 'INCREASE_DIFFICULTY' }); }, 30000);
    }
    return () => { if (difficultyRef.current) clearInterval(difficultyRef.current); };
  }, [state.status]);

  return (
    <GameContext.Provider value={{ state, dispatch, startGame, startPlaying, pauseGame, resumeGame, selectAlert, completeTask, failTask }}>
      {children}
    </GameContext.Provider>
  );
}

export function useGame() {
  const context = useContext(GameContext);
  if (!context) throw new Error('useGame must be used within a GameProvider');
  return context;
}
