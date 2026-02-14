import { Alert, TaskType, AlertUrgency } from '@/types/game';

const TASK_TYPES: TaskType[] = ['type', 'drag', 'sort', 'connect', 'hold', 'track', 'sentence'];

const ALERT_TITLES: Record<TaskType, string[]> = {
  type: ['CODE SEQUENCE REQUIRED', 'AUTHENTICATION KEY', 'DECRYPT INPUT', 'ACCESS CODE'],
  drag: ['COMPONENT ALIGNMENT', 'MODULE TRANSFER', 'SYSTEM CALIBRATION', 'DATA ROUTING'],
  sort: ['PRIORITY REORDER', 'SEQUENCE FIX', 'ARRAY SORT', 'QUEUE OPTIMIZATION'],
  connect: ['CIRCUIT LINK', 'NODE BRIDGE', 'NETWORK PATH', 'POWER ROUTE'],
  hold: ['SYSTEM OVERRIDE', 'MANUAL BYPASS', 'PRESSURE LOCK', 'HOLD SEQUENCE'],
  track: ['TARGET LOCK', 'SIGNAL TRACE', 'TRACKING BEAM', 'CURSOR SYNC'],
  sentence: ['LOG ENTRY', 'COMMAND STRING', 'PROTOCOL TEXT', 'SYSTEM MESSAGE'],
};

const ALERT_DESCRIPTIONS: Record<TaskType, string[]> = {
  type: ['Type the displayed code', 'Enter authentication sequence', 'Input decryption key'],
  drag: ['Drag items to correct zones', 'Move components to targets', 'Align modules properly'],
  sort: ['Arrange in correct order', 'Sort by priority level', 'Reorder the sequence'],
  connect: ['Link the nodes together', 'Complete the circuit', 'Establish connections'],
  hold: ['Hold the specified key', 'Maintain pressure input', 'Keep key depressed'],
  track: ['Follow the moving target', 'Keep cursor on target', 'Track the signal'],
  sentence: ['Type the full sentence', 'Enter the command text', 'Input the protocol'],
};

function getRandomElement<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function generateId(): string {
  return `alert-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

function getUrgency(difficulty: number, entropy: number): AlertUrgency {
  const roll = Math.random() * 100;
  const criticalThreshold = 5 + difficulty * 2 + entropy * 0.5;
  const highThreshold = criticalThreshold + 15 + difficulty * 3;
  const mediumThreshold = highThreshold + 30;

  if (roll < criticalThreshold) return 'critical';
  if (roll < highThreshold) return 'high';
  if (roll < mediumThreshold) return 'medium';
  return 'low';
}

function getTimeLimit(urgency: AlertUrgency, difficulty: number): number {
  const baseTimes: Record<AlertUrgency, number> = {
    low: 25,
    medium: 18,
    high: 12,
    critical: 8,
  };

  const base = baseTimes[urgency];
  const reduction = difficulty * 0.5;
  return Math.max(5, base - reduction);
}

export function generateAlert(difficulty: number, entropy: number, aiTrust: number, allowedTypes?: TaskType[]): Alert {
  const types = allowedTypes && allowedTypes.length > 0 ? allowedTypes : TASK_TYPES;
  const taskType = getRandomElement(types);
  const urgency = getUrgency(difficulty, entropy);
  const timeLimit = getTimeLimit(urgency, difficulty);

  // Low AI trust can generate decoy alerts
  const isDecoy = aiTrust < 50 && Math.random() < (50 - aiTrust) / 100;

  return {
    id: generateId(),
    taskType,
    title: getRandomElement(ALERT_TITLES[taskType]),
    description: getRandomElement(ALERT_DESCRIPTIONS[taskType]),
    urgency,
    timeLimit,
    timeRemaining: timeLimit,
    createdAt: Date.now(),
    isDecoy,
  };
}

// Task data generators
const WORDS = ['ALPHA', 'BRAVO', 'DELTA', 'ECHO', 'FOXTROT', 'GAMMA', 'OMEGA', 'SIGMA', 'THETA', 'ZETA'];
const CODES = ['A7X9', 'B3K2', 'C5M8', 'D1N4', 'E9P6', 'F2Q7', 'G8R3', 'H4S1', 'J6T5', 'K0U2'];

export function generateTypeTask(): string {
  return Math.random() > 0.5 ? getRandomElement(WORDS) : getRandomElement(CODES);
}

export function generateSentenceTask(): string {
  const sentences = [
    'SYSTEM OVERRIDE INITIATED',
    'CONFIRM ACCESS GRANTED',
    'ENABLE BACKUP PROTOCOL',
    'VERIFY USER IDENTITY',
    'INITIALIZE CORE SYSTEMS',
    'TRANSFER COMPLETE NOW',
  ];
  return getRandomElement(sentences);
}

export function generateSortTask(): { id: string; value: number; label: string }[] {
  const count = Math.floor(Math.random() * 3) + 4; // 4-6 items
  const items: { id: string; value: number; label: string }[] = [];
  
  for (let i = 0; i < count; i++) {
    items.push({
      id: `sort-${i}`,
      value: Math.floor(Math.random() * 100),
      label: `${Math.floor(Math.random() * 100)}`,
    });
  }

  // Shuffle
  return items.sort(() => Math.random() - 0.5);
}

export function generateDragTask(): { items: { id: string; label: string }[]; zones: { id: string; acceptsId: string; label: string }[] } {
  const labels = ['α', 'β', 'γ', 'δ'];
  const count = Math.floor(Math.random() * 2) + 2; // 2-3 items
  
  const items = labels.slice(0, count).map((label, i) => ({
    id: `drag-${i}`,
    label,
  }));

  const zones = items.map((item, i) => ({
    id: `zone-${i}`,
    acceptsId: item.id,
    label: item.label,
  })).sort(() => Math.random() - 0.5);

  return { items, zones };
}

export function generateConnectTask(): { nodes: { id: string; label: string; side: 'left' | 'right' }[]; correctConnections: Record<string, string> } {
  const count = Math.floor(Math.random() * 2) + 3; // 3-4 connections
  const leftLabels = ['A', 'B', 'C', 'D'];
  const rightLabels = ['1', '2', '3', '4'];

  const leftNodes = leftLabels.slice(0, count).map((label, i) => ({
    id: `left-${i}`,
    label,
    side: 'left' as const,
  }));

  const rightNodes = rightLabels.slice(0, count).map((label, i) => ({
    id: `right-${i}`,
    label,
    side: 'right' as const,
  }));

  // Create correct connections (randomized pairing)
  const shuffledRight = [...rightNodes].sort(() => Math.random() - 0.5);
  const correctConnections: Record<string, string> = {};
  leftNodes.forEach((node, i) => {
    correctConnections[node.id] = shuffledRight[i].id;
  });

  return {
    nodes: [...leftNodes, ...rightNodes],
    correctConnections,
  };
}

export function generateHoldTask(): { key: string; duration: number } {
  const keys = ['SPACE', 'SHIFT', 'ENTER'];
  return {
    key: getRandomElement(keys),
    duration: Math.floor(Math.random() * 2000) + 2000, // 2-4 seconds
  };
}
