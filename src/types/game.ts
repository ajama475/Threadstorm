export type TaskType = 
  | 'type' 
  | 'drag' 
  | 'sort' 
  | 'connect' 
  | 'hold' 
  | 'track'
  | 'sentence';

export type AlertUrgency = 'low' | 'medium' | 'high' | 'critical';

export interface Alert {
  id: string;
  taskType: TaskType;
  title: string;
  description: string;
  urgency: AlertUrgency;
  timeLimit: number;
  timeRemaining: number;
  createdAt: number;
  isDecoy?: boolean;
}

export interface TaskConfig {
  type: TaskType;
  targetWord?: string;
  dragItems?: { id: string; label: string }[];
  dropZones?: { id: string; acceptsId: string }[];
  sortItems?: { id: string; value: number; label: string }[];
  connections?: { from: string; to: string }[];
  nodes?: { id: string; label: string; x: number; y: number }[];
  holdKey?: string;
  holdDuration?: number;
  trackDuration?: number;
  targetSentence?: string;
}

export interface GameState {
  status: 'idle' | 'booting' | 'startScreen' | 'tutorial' | 'playing' | 'paused' | 'gameOver';
  score: number;
  stability: number;
  alerts: Alert[];
  activeAlert: Alert | null;
  completedTasks: number;
  failedTasks: number;
  streak: number;
  maxStreak: number;
  startTime: number | null;
  elapsedTime: number;
  difficulty: number;
  entropy: number;
  commandDebt: number;
  aiTrust: number;
  // Progressive difficulty
  tier: number;
  unlockedPanels: TaskType[];
  completionTimestamps: number[];
  runStartTime: number;
  tutorialCompleted: boolean;
  muted: boolean;
}

export interface GameStats {
  highScore: number;
  bestStreak: number;
  totalGamesPlayed: number;
  totalTasksCompleted: number;
  averageSurvivalTime: number;
}

export type GameAction =
  | { type: 'BOOT' }
  | { type: 'SHOW_START' }
  | { type: 'START_TUTORIAL' }
  | { type: 'START_GAME' }
  | { type: 'PAUSE_GAME' }
  | { type: 'RESUME_GAME' }
  | { type: 'END_GAME' }
  | { type: 'ADD_ALERT'; payload: Alert }
  | { type: 'REMOVE_ALERT'; payload: string }
  | { type: 'SELECT_ALERT'; payload: Alert }
  | { type: 'COMPLETE_TASK'; payload: { alertId: string; bonus?: number } }
  | { type: 'FAIL_TASK'; payload: string }
  | { type: 'UPDATE_STABILITY'; payload: number }
  | { type: 'TICK'; payload: number }
  | { type: 'INCREASE_DIFFICULTY' }
  | { type: 'UNLOCK_PANEL'; payload: TaskType }
  | { type: 'TOGGLE_MUTE' };
