import { TaskType } from '@/types/game';

export const gameConfig = {
  // Panel unlock order (TYPE is always first/default)
  unlockOrder: ['type', 'drag', 'sort', 'hold', 'connect', 'track'] as TaskType[],
  unlockEveryN: 5,            // completions per unlock
  fallbackUnlockTimeSec: 25,  // auto-unlock if struggling

  // Difficulty scaling
  initialTimeMultiplier: 1.5,       // generous timers at tier 0
  timeMultiplierDecayPerTier: 0.1,  // reduce per tier (floor 0.8)
  baseAlertIntervalMs: 5000,        // ms between alerts at tier 0
  alertIntervalReductionPerTier: 400,

  // Boot sequence
  bootDurationMs: 6000,
  bootSkipAfterMs: 2000,

  // Popup rate-limits
  popupGracePeriodMs: 20000,          // no popups first 20s
  trashTalkPopupCooldownMs: 15000,
  trashTalkPopupMinStability: 70,     // only when doing well
  speedPopupCooldownMs: 25000,
  speedBurstCount: 3,
  speedBurstWindowMs: 4000,
  avgSpeedCount: 5,
  avgSpeedThresholdMs: 1200,

  // Voice trash talk
  voiceCooldownMs: 10000,
  voiceStabilityThresholds: [60, 40, 25] as number[],
  voiceAlertQueueThreshold: 3,

  // Danger pulse (hysteresis)
  dangerPulseOnThreshold: 30,
  dangerPulseOffThreshold: 40,
  dangerPulseFastThreshold: 15,
};
