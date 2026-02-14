import { TaskType, AlertUrgency } from './game';

export interface AccessibilityState {
  blindMode: boolean;
  focusedTileIndex: number; // 0-5 for the 6 task types
  focusedAlertIndex: number; // Position in alert queue
  masterVolume: number; // 0-1
  speechRate: number; // 0.5-2
  spatialEnabled: boolean;
  voiceCommandsEnabled: boolean;
  muted: boolean;
  lastAnnouncement: string;
}

export interface AccessibilityPreferences {
  blindMode: boolean;
  masterVolume: number;
  speechRate: number;
  spatialEnabled: boolean;
  voiceCommandsEnabled: boolean;
}

export type AccessibilityAction =
  | { type: 'SET_BLIND_MODE'; payload: boolean }
  | { type: 'SET_FOCUSED_TILE'; payload: number }
  | { type: 'SET_FOCUSED_ALERT'; payload: number }
  | { type: 'SET_MASTER_VOLUME'; payload: number }
  | { type: 'SET_SPEECH_RATE'; payload: number }
  | { type: 'SET_SPATIAL_ENABLED'; payload: boolean }
  | { type: 'SET_VOICE_COMMANDS'; payload: boolean }
  | { type: 'TOGGLE_MUTE' }
  | { type: 'SET_LAST_ANNOUNCEMENT'; payload: string }
  | { type: 'LOAD_PREFERENCES'; payload: Partial<AccessibilityPreferences> };

// Audio signature for each task type
export interface TaskAudioSignature {
  baseFrequency: number;
  waveform: OscillatorType;
  pattern: 'click' | 'whoosh' | 'chime' | 'spark' | 'hum' | 'sweep' | 'typewriter';
  panPosition: number; // -1 (left) to 1 (right)
}

export const TASK_AUDIO_SIGNATURES: Record<TaskType, TaskAudioSignature> = {
  type: { baseFrequency: 800, waveform: 'square', pattern: 'click', panPosition: -0.8 },
  drag: { baseFrequency: 300, waveform: 'sine', pattern: 'whoosh', panPosition: -0.4 },
  sort: { baseFrequency: 440, waveform: 'sine', pattern: 'chime', panPosition: 0 },
  connect: { baseFrequency: 600, waveform: 'sawtooth', pattern: 'spark', panPosition: 0.4 },
  hold: { baseFrequency: 220, waveform: 'sine', pattern: 'hum', panPosition: 0.6 },
  track: { baseFrequency: 330, waveform: 'sine', pattern: 'sweep', panPosition: 0.8 },
  sentence: { baseFrequency: 700, waveform: 'square', pattern: 'typewriter', panPosition: -0.6 },
};

// Urgency audio modifiers
export interface UrgencyAudioModifier {
  tempoMultiplier: number;
  pitchMultiplier: number;
  volumeMultiplier: number;
  addDistortion: boolean;
}

export const URGENCY_MODIFIERS: Record<AlertUrgency, UrgencyAudioModifier> = {
  low: { tempoMultiplier: 1, pitchMultiplier: 1, volumeMultiplier: 0.4, addDistortion: false },
  medium: { tempoMultiplier: 1.5, pitchMultiplier: 1.25, volumeMultiplier: 0.6, addDistortion: false },
  high: { tempoMultiplier: 2, pitchMultiplier: 1.5, volumeMultiplier: 0.8, addDistortion: false },
  critical: { tempoMultiplier: 3, pitchMultiplier: 2, volumeMultiplier: 1, addDistortion: true },
};

// NATO phonetic alphabet for code expansion
export const PHONETIC_ALPHABET: Record<string, string> = {
  'A': 'Alpha', 'B': 'Bravo', 'C': 'Charlie', 'D': 'Delta', 'E': 'Echo',
  'F': 'Foxtrot', 'G': 'Golf', 'H': 'Hotel', 'I': 'India', 'J': 'Juliet',
  'K': 'Kilo', 'L': 'Lima', 'M': 'Mike', 'N': 'November', 'O': 'Oscar',
  'P': 'Papa', 'Q': 'Quebec', 'R': 'Romeo', 'S': 'Sierra', 'T': 'Tango',
  'U': 'Uniform', 'V': 'Victor', 'W': 'Whiskey', 'X': 'X-ray', 'Y': 'Yankee',
  'Z': 'Zulu', '0': 'Zero', '1': 'One', '2': 'Two', '3': 'Three',
  '4': 'Four', '5': 'Five', '6': 'Six', '7': 'Seven', '8': 'Eight', '9': 'Nine',
};

// Keyboard navigation mappings
export const TILE_HOTKEYS: Record<string, TaskType> = {
  '1': 'type',
  '2': 'drag',
  '3': 'sort',
  '4': 'connect',
  '5': 'hold',
  '6': 'track',
};

export const TASK_TO_INDEX: Record<TaskType, number> = {
  type: 0,
  drag: 1,
  sort: 2,
  connect: 3,
  hold: 4,
  track: 5,
  sentence: 6,
};
