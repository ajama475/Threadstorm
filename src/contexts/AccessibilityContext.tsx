import React, { createContext, useContext, useReducer, useCallback, useEffect } from 'react';
import { AccessibilityState, AccessibilityAction, AccessibilityPreferences } from '@/types/accessibility';

const STORAGE_KEY = 'command-overload-accessibility';

const initialState: AccessibilityState = {
  blindMode: false,
  focusedTileIndex: 0,
  focusedAlertIndex: 0,
  masterVolume: 0.7,
  speechRate: 1.2,
  spatialEnabled: true,
  voiceCommandsEnabled: false,
  muted: false,
  lastAnnouncement: '',
};

function accessibilityReducer(state: AccessibilityState, action: AccessibilityAction): AccessibilityState {
  switch (action.type) {
    case 'SET_BLIND_MODE':
      return { ...state, blindMode: action.payload };
    case 'SET_FOCUSED_TILE':
      return { ...state, focusedTileIndex: Math.max(0, Math.min(5, action.payload)) };
    case 'SET_FOCUSED_ALERT':
      return { ...state, focusedAlertIndex: Math.max(0, action.payload) };
    case 'SET_MASTER_VOLUME':
      return { ...state, masterVolume: Math.max(0, Math.min(1, action.payload)) };
    case 'SET_SPEECH_RATE':
      return { ...state, speechRate: Math.max(0.5, Math.min(2, action.payload)) };
    case 'SET_SPATIAL_ENABLED':
      return { ...state, spatialEnabled: action.payload };
    case 'SET_VOICE_COMMANDS':
      return { ...state, voiceCommandsEnabled: action.payload };
    case 'TOGGLE_MUTE':
      return { ...state, muted: !state.muted };
    case 'SET_LAST_ANNOUNCEMENT':
      return { ...state, lastAnnouncement: action.payload };
    case 'LOAD_PREFERENCES':
      return { ...state, ...action.payload };
    default:
      return state;
  }
}

interface AccessibilityContextValue {
  state: AccessibilityState;
  dispatch: React.Dispatch<AccessibilityAction>;
  setBlindMode: (enabled: boolean) => void;
  setFocusedTile: (index: number) => void;
  setFocusedAlert: (index: number) => void;
  setMasterVolume: (volume: number) => void;
  setSpeechRate: (rate: number) => void;
  setSpatialEnabled: (enabled: boolean) => void;
  setVoiceCommands: (enabled: boolean) => void;
  toggleMute: () => void;
  setLastAnnouncement: (text: string) => void;
}

const AccessibilityContext = createContext<AccessibilityContextValue | null>(null);

export function AccessibilityProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(accessibilityReducer, initialState);

  // Load preferences from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const prefs: Partial<AccessibilityPreferences> = JSON.parse(stored);
        dispatch({ type: 'LOAD_PREFERENCES', payload: prefs });
      }
    } catch (e) {
      console.warn('Failed to load accessibility preferences:', e);
    }
  }, []);

  // Save preferences to localStorage when they change
  useEffect(() => {
    const prefs: AccessibilityPreferences = {
      blindMode: state.blindMode,
      masterVolume: state.masterVolume,
      speechRate: state.speechRate,
      spatialEnabled: state.spatialEnabled,
      voiceCommandsEnabled: state.voiceCommandsEnabled,
    };
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
    } catch (e) {
      console.warn('Failed to save accessibility preferences:', e);
    }
  }, [state.blindMode, state.masterVolume, state.speechRate, state.spatialEnabled, state.voiceCommandsEnabled]);

  const setBlindMode = useCallback((enabled: boolean) => {
    dispatch({ type: 'SET_BLIND_MODE', payload: enabled });
  }, []);

  const setFocusedTile = useCallback((index: number) => {
    dispatch({ type: 'SET_FOCUSED_TILE', payload: index });
  }, []);

  const setFocusedAlert = useCallback((index: number) => {
    dispatch({ type: 'SET_FOCUSED_ALERT', payload: index });
  }, []);

  const setMasterVolume = useCallback((volume: number) => {
    dispatch({ type: 'SET_MASTER_VOLUME', payload: volume });
  }, []);

  const setSpeechRate = useCallback((rate: number) => {
    dispatch({ type: 'SET_SPEECH_RATE', payload: rate });
  }, []);

  const setSpatialEnabled = useCallback((enabled: boolean) => {
    dispatch({ type: 'SET_SPATIAL_ENABLED', payload: enabled });
  }, []);

  const setVoiceCommands = useCallback((enabled: boolean) => {
    dispatch({ type: 'SET_VOICE_COMMANDS', payload: enabled });
  }, []);

  const toggleMute = useCallback(() => {
    dispatch({ type: 'TOGGLE_MUTE' });
  }, []);

  const setLastAnnouncement = useCallback((text: string) => {
    dispatch({ type: 'SET_LAST_ANNOUNCEMENT', payload: text });
  }, []);

  return (
    <AccessibilityContext.Provider
      value={{
        state,
        dispatch,
        setBlindMode,
        setFocusedTile,
        setFocusedAlert,
        setMasterVolume,
        setSpeechRate,
        setSpatialEnabled,
        setVoiceCommands,
        toggleMute,
        setLastAnnouncement,
      }}
    >
      {children}
    </AccessibilityContext.Provider>
  );
}

export function useAccessibility() {
  const context = useContext(AccessibilityContext);
  if (!context) {
    throw new Error('useAccessibility must be used within an AccessibilityProvider');
  }
  return context;
}
