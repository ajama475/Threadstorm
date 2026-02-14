import { useCallback, useRef, useEffect } from 'react';
import { useAccessibility } from '@/contexts/AccessibilityContext';
import { TaskType, AlertUrgency, Alert } from '@/types/game';
import { PHONETIC_ALPHABET } from '@/types/accessibility';

type AnnouncementPriority = 'low' | 'normal' | 'high' | 'critical';

interface QueuedAnnouncement {
  text: string;
  priority: AnnouncementPriority;
  timestamp: number;
}

const PRIORITY_LEVELS: Record<AnnouncementPriority, number> = {
  low: 0,
  normal: 1,
  high: 2,
  critical: 3,
};

export function useTextToSpeech() {
  const { state, setLastAnnouncement } = useAccessibility();
  const queueRef = useRef<QueuedAnnouncement[]>([]);
  const isSpeakingRef = useRef(false);
  const synthRef = useRef<SpeechSynthesis | null>(null);

  // Initialize speech synthesis
  useEffect(() => {
    if ('speechSynthesis' in window) {
      synthRef.current = window.speechSynthesis;
    }
  }, []);

  // Process the announcement queue
  const processQueue = useCallback(() => {
    if (!synthRef.current || isSpeakingRef.current || state.muted) return;
    if (queueRef.current.length === 0) return;

    // Sort by priority (highest first), then by timestamp (oldest first)
    queueRef.current.sort((a, b) => {
      const priorityDiff = PRIORITY_LEVELS[b.priority] - PRIORITY_LEVELS[a.priority];
      if (priorityDiff !== 0) return priorityDiff;
      return a.timestamp - b.timestamp;
    });

    const announcement = queueRef.current.shift();
    if (!announcement) return;

    isSpeakingRef.current = true;

    const utterance = new SpeechSynthesisUtterance(announcement.text);
    utterance.rate = state.speechRate;
    utterance.volume = state.masterVolume;
    
    // Adjust rate for urgency
    if (announcement.priority === 'critical') {
      utterance.rate = Math.min(2, state.speechRate * 1.2);
    }

    utterance.onend = () => {
      isSpeakingRef.current = false;
      setLastAnnouncement(announcement.text);
      // Process next in queue
      setTimeout(() => processQueue(), 100);
    };

    utterance.onerror = () => {
      isSpeakingRef.current = false;
      setTimeout(() => processQueue(), 100);
    };

    synthRef.current.speak(utterance);
  }, [state.muted, state.speechRate, state.masterVolume, setLastAnnouncement]);

  // Add announcement to queue
  const queueAnnouncement = useCallback((text: string, priority: AnnouncementPriority = 'normal') => {
    if (!state.blindMode || state.muted) return;

    // For critical announcements, cancel current speech and clear low priority items
    if (priority === 'critical' && synthRef.current) {
      synthRef.current.cancel();
      isSpeakingRef.current = false;
      queueRef.current = queueRef.current.filter(a => 
        PRIORITY_LEVELS[a.priority] >= PRIORITY_LEVELS.high
      );
    }

    queueRef.current.push({
      text,
      priority,
      timestamp: Date.now(),
    });

    processQueue();
  }, [state.blindMode, state.muted, processQueue]);

  // Speak immediately (cancels current speech)
  const speakNow = useCallback((text: string) => {
    if (!synthRef.current || state.muted) return;

    synthRef.current.cancel();
    isSpeakingRef.current = false;

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = state.speechRate;
    utterance.volume = state.masterVolume;

    utterance.onend = () => {
      isSpeakingRef.current = false;
      setLastAnnouncement(text);
      processQueue();
    };

    synthRef.current.speak(utterance);
    isSpeakingRef.current = true;
  }, [state.muted, state.speechRate, state.masterVolume, setLastAnnouncement, processQueue]);

  // Convert code to phonetic spelling
  const toPhonetic = useCallback((text: string): string => {
    return text.toUpperCase().split('').map(char => 
      PHONETIC_ALPHABET[char] || char
    ).join(' ');
  }, []);

  // Announce new alert
  const announceAlert = useCallback((alert: Alert) => {
    if (!state.blindMode) return;

    const urgencyLabel = alert.urgency.charAt(0).toUpperCase() + alert.urgency.slice(1);
    const taskLabel = alert.taskType.charAt(0).toUpperCase() + alert.taskType.slice(1);
    const timeLabel = Math.ceil(alert.timeRemaining);
    
    const priority: AnnouncementPriority = 
      alert.urgency === 'critical' ? 'critical' :
      alert.urgency === 'high' ? 'high' : 'normal';

    queueAnnouncement(
      `${urgencyLabel} alert: ${taskLabel} task. ${timeLabel} seconds.`,
      priority
    );
  }, [state.blindMode, queueAnnouncement]);

  // Announce task instructions
  const announceTaskInstructions = useCallback((taskType: TaskType, config: any) => {
    if (!state.blindMode) return;

    let instruction = '';

    switch (taskType) {
      case 'type':
        instruction = `Type: ${toPhonetic(config.targetWord || '')}`;
        break;
      case 'sort':
        const numbers = config.sortItems?.map((i: any) => i.value).join(', ') || '';
        instruction = `Sort ascending: ${numbers}`;
        break;
      case 'drag':
        const placements = config.dragItems?.map((item: any, idx: number) => 
          `${item.label} in zone ${idx + 1}`
        ).join(', ') || '';
        instruction = `Place ${placements}`;
        break;
      case 'connect':
        instruction = 'Connect matching pairs. Use letter plus number keys.';
        break;
      case 'hold':
        instruction = `Hold Space key for ${config.holdDuration || 3} seconds`;
        break;
      case 'track':
        instruction = 'Match the pitch using left and right arrows';
        break;
      case 'sentence':
        instruction = `Type the sentence: ${config.targetSentence || ''}`;
        break;
    }

    queueAnnouncement(instruction, 'high');
  }, [state.blindMode, queueAnnouncement, toPhonetic]);

  // Announce feedback
  const announceFeedback = useCallback((type: 'correct' | 'error' | 'complete' | 'fail', points?: number) => {
    if (!state.blindMode) return;

    const messages: Record<string, string> = {
      correct: 'Correct!',
      error: 'Error!',
      complete: points ? `Task complete! ${points} points.` : 'Task complete!',
      fail: 'Task failed. Alert expired.',
    };

    const priority: AnnouncementPriority = 
      type === 'complete' ? 'high' :
      type === 'fail' ? 'high' : 'normal';

    queueAnnouncement(messages[type], priority);
  }, [state.blindMode, queueAnnouncement]);

  // Announce system status
  const announceStatus = useCallback((stability: number, alertCount: number, score: number) => {
    if (!state.blindMode) return;

    speakNow(
      `Status: Stability ${Math.round(stability)} percent. ${alertCount} alerts pending. Score ${score}.`
    );
  }, [state.blindMode, speakNow]);

  // Announce focus change
  const announceFocus = useCallback((taskType: TaskType, hasAlert: boolean) => {
    if (!state.blindMode) return;

    const label = taskType.charAt(0).toUpperCase() + taskType.slice(1);
    const status = hasAlert ? 'Active alert' : 'No alert';
    
    queueAnnouncement(`${label} tile. ${status}.`, 'low');
  }, [state.blindMode, queueAnnouncement]);

  // Repeat last announcement
  const repeatLast = useCallback(() => {
    if (state.lastAnnouncement) {
      speakNow(state.lastAnnouncement);
    }
  }, [state.lastAnnouncement, speakNow]);

  // Stop all speech
  const stopSpeech = useCallback(() => {
    if (synthRef.current) {
      synthRef.current.cancel();
      isSpeakingRef.current = false;
      queueRef.current = [];
    }
  }, []);

  return {
    queueAnnouncement,
    speakNow,
    toPhonetic,
    announceAlert,
    announceTaskInstructions,
    announceFeedback,
    announceStatus,
    announceFocus,
    repeatLast,
    stopSpeech,
  };
}
