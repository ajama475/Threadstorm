import { useEffect, useRef, useCallback, useState } from 'react';
import { useAccessibility } from '@/contexts/AccessibilityContext';
import { useGame } from '@/contexts/GameContext';
import { useTextToSpeech } from './useTextToSpeech';
import { useSpatialAudio } from './useSpatialAudio';
import { TASK_TO_INDEX } from '@/types/accessibility';

// Type declarations for Web Speech API
interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
}

interface SpeechRecognitionInstance extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  onstart: ((this: SpeechRecognitionInstance, ev: Event) => void) | null;
  onend: ((this: SpeechRecognitionInstance, ev: Event) => void) | null;
  onresult: ((this: SpeechRecognitionInstance, ev: SpeechRecognitionEvent) => void) | null;
  onerror: ((this: SpeechRecognitionInstance, ev: SpeechRecognitionErrorEvent) => void) | null;
}

interface VoiceCommand {
  patterns: string[];
  action: () => void;
  feedback: string;
}

export function useVoiceCommands() {
  const { state: accessibilityState, setFocusedTile, toggleMute } = useAccessibility();
  const { state: gameState } = useGame();
  const { announceStatus, repeatLast, speakNow } = useTextToSpeech();
  const { playCorrectBeep } = useSpatialAudio();
  
  const [isListening, setIsListening] = useState(false);
  const [lastCommand, setLastCommand] = useState<string>('');
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);

  // Define available commands
  const getCommands = useCallback((): VoiceCommand[] => [
    {
      patterns: ['status', 'system status', 'what is status'],
      action: () => announceStatus(gameState.stability, gameState.alerts.length, gameState.score),
      feedback: 'Status',
    },
    {
      patterns: ['repeat', 'say again', 'what'],
      action: () => repeatLast(),
      feedback: 'Repeating',
    },
    {
      patterns: ['mute', 'silence', 'quiet'],
      action: () => toggleMute(),
      feedback: 'Toggling mute',
    },
    {
      patterns: ['type', 'typing', 'do type', 'clear typing'],
      action: () => {
        setFocusedTile(TASK_TO_INDEX.type);
        playCorrectBeep();
      },
      feedback: 'Type tile',
    },
    {
      patterns: ['drag', 'do drag'],
      action: () => {
        setFocusedTile(TASK_TO_INDEX.drag);
        playCorrectBeep();
      },
      feedback: 'Drag tile',
    },
    {
      patterns: ['sort', 'sorting', 'do sort'],
      action: () => {
        setFocusedTile(TASK_TO_INDEX.sort);
        playCorrectBeep();
      },
      feedback: 'Sort tile',
    },
    {
      patterns: ['connect', 'connection', 'do connect'],
      action: () => {
        setFocusedTile(TASK_TO_INDEX.connect);
        playCorrectBeep();
      },
      feedback: 'Connect tile',
    },
    {
      patterns: ['hold', 'do hold'],
      action: () => {
        setFocusedTile(TASK_TO_INDEX.hold);
        playCorrectBeep();
      },
      feedback: 'Hold tile',
    },
    {
      patterns: ['track', 'tracking', 'do track'],
      action: () => {
        setFocusedTile(TASK_TO_INDEX.track);
        playCorrectBeep();
      },
      feedback: 'Track tile',
    },
  ], [
    gameState.stability,
    gameState.alerts.length,
    gameState.score,
    announceStatus,
    repeatLast,
    toggleMute,
    setFocusedTile,
    playCorrectBeep,
  ]);

  // Process recognized speech
  const processCommand = useCallback((transcript: string) => {
    const normalized = transcript.toLowerCase().trim();
    const commands = getCommands();

    for (const command of commands) {
      for (const pattern of command.patterns) {
        if (normalized.includes(pattern)) {
          setLastCommand(normalized);
          speakNow(command.feedback);
          command.action();
          return true;
        }
      }
    }

    return false;
  }, [getCommands, speakNow]);

  // Initialize speech recognition
  useEffect(() => {
    if (!accessibilityState.voiceCommandsEnabled || !accessibilityState.blindMode) {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
        setIsListening(false);
      }
      return;
    }

    // Check for browser support
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      console.warn('Speech recognition not supported in this browser');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    recognition.onstart = () => {
      setIsListening(true);
    };

    recognition.onend = () => {
      setIsListening(false);
      // Restart if still enabled
      if (accessibilityState.voiceCommandsEnabled && accessibilityState.blindMode) {
        try {
          recognition.start();
        } catch (e) {
          // Already started
        }
      }
    };

    recognition.onresult = (event) => {
      const results = (event as SpeechRecognitionEvent).results;
      const last = results.length - 1;
      const transcript = results[last][0].transcript;
      processCommand(transcript);
    };

    recognition.onerror = (event) => {
      const error = (event as SpeechRecognitionErrorEvent).error;
      console.warn('Speech recognition error:', error);
      if (error !== 'no-speech') {
        setIsListening(false);
      }
    };

    recognitionRef.current = recognition as SpeechRecognitionInstance;

    // Start listening during gameplay
    if (gameState.status === 'playing') {
      try {
        recognition.start();
      } catch (e) {
        // May already be started
      }
    }

    return () => {
      recognition.stop();
    };
  }, [
    accessibilityState.voiceCommandsEnabled,
    accessibilityState.blindMode,
    gameState.status,
    processCommand,
  ]);

  // Stop when game ends
  useEffect(() => {
    if (gameState.status !== 'playing' && recognitionRef.current) {
      recognitionRef.current.stop();
    }
  }, [gameState.status]);

  return {
    isListening,
    lastCommand,
  };
}
