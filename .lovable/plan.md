
# Blind-Accessible Mode Implementation Plan

## Overview

This plan implements a **first-class blind-accessible gameplay mode** for COMMAND OVERLOAD that provides an equally intense, fully playable experience using audio, keyboard navigation, and voice interactions - with no visual dependency.

---

## Architecture

```text
┌─────────────────────────────────────────────────────────────────────┐
│                      ACCESSIBILITY CONTEXT                          │
│  ┌─────────────┐  ┌──────────────┐  ┌─────────────────────────────┐ │
│  │ Mode Toggle │  │ User Prefs   │  │ Keyboard Navigation State   │ │
│  │ (blind/vis) │  │ (volume,etc) │  │ (focused tile, queue pos)   │ │
│  └─────────────┘  └──────────────┘  └─────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────┘
                               │
           ┌───────────────────┼───────────────────┐
           ▼                   ▼                   ▼
┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
│  SPATIAL AUDIO  │  │  TEXT-TO-SPEECH │  │  VOICE COMMANDS │
│    ENGINE       │  │     ENGINE      │  │    ENGINE       │
│                 │  │                 │  │                 │
│ • PannerNode    │  │ • SpeechSynth   │  │ • SpeechRecog   │
│ • Position map  │  │ • Alert queue   │  │ • Command parse │
│ • Urgency layer │  │ • Task prompts  │  │ • Confirmation  │
└─────────────────┘  └─────────────────┘  └─────────────────┘
           │                   │                   │
           └───────────────────┼───────────────────┘
                               ▼
                    ┌─────────────────┐
                    │   GAME CONTEXT  │
                    │   (existing)    │
                    └─────────────────┘
```

---

## Implementation Phases

### Phase 1: Core Accessibility Infrastructure

**New Files:**
- `src/contexts/AccessibilityContext.tsx` - Central accessibility state management
- `src/hooks/useSpatialAudio.ts` - Enhanced audio with 3D positioning
- `src/hooks/useTextToSpeech.ts` - TTS announcements via Web Speech API
- `src/hooks/useVoiceCommands.ts` - Voice recognition for commands
- `src/hooks/useKeyboardNavigation.ts` - Full keyboard control system

**AccessibilityContext will manage:**
- `blindMode: boolean` - Toggle between visual and blind modes
- `focusedTileIndex: number` - Current keyboard focus position (0-5)
- `focusedAlertIndex: number` - Position in alert queue
- `masterVolume: number` - Global audio level
- `speechRate: number` - TTS speed preference
- `spatialEnabled: boolean` - 3D audio toggle

---

### Phase 2: Spatial Audio Engine

**Audio Identity System** - Each task type gets a unique sound signature:

| Task Type | Audio Signature |
|-----------|-----------------|
| TYPE | Mechanical keyboard clicks (short, crisp) |
| DRAG | Magnetic sliding whoosh + snap |
| SORT | Ascending/descending chime scales |
| CONNECT | Electric arc/spark zaps |
| HOLD | Continuous hum that builds |
| TRACK | Rising/falling pitch sweep |
| SENTENCE | Typewriter rhythm pattern |

**Urgency Encoding:**
- **Tempo:** Low=1x, Medium=1.5x, High=2x, Critical=3x (pulse rate)
- **Pitch:** Low=220Hz, Medium=330Hz, High=440Hz, Critical=660Hz
- **Volume:** Low=40%, Medium=60%, High=80%, Critical=100%
- **Layers:** Critical adds distortion overlay

**System Pressure Feedback:**
- Background drone increases with alert count
- Low-frequency heartbeat starts at stability < 50%
- Audio distortion increases as stability drops
- Near-crash: stuttering, jittering effects

**Spatial Positioning (Stereo Panning):**
- Tile grid mapped to left-center-right positions
- TYPE/DRAG/SORT = left channel (-1 to -0.3)
- CONNECT/HOLD/TRACK = right channel (0.3 to 1)
- Alert queue announcements from center

---

### Phase 3: Text-to-Speech System

**Announcement Types:**

1. **Alert Announcements:**
   - "Critical alert: Type task. Code: Alpha Seven X-ray Nine. 8 seconds."
   - "High alert: Sort task. Arrange five numbers. 12 seconds."

2. **Task Instructions:**
   - TYPE: "Type: [spelled phonetically] Delta Echo Charlie Kilo"
   - SORT: "Sort ascending: 47, 12, 89, 23, 56"
   - DRAG: "Place Alpha in slot 2, Beta in slot 1"
   - CONNECT: "Connect A to 3, B to 1, C to 2"
   - HOLD: "Hold Space key for 3 seconds"
   - TRACK: "Match the pitch using up and down arrows"

3. **Feedback:**
   - "Correct!" / "Error!" / "Task complete! 150 points"
   - "Alert expired. Stability at 65 percent."

4. **System Status (on demand):**
   - "Status: Stability 72 percent. 4 alerts pending. Score 2400."

**TTS Queue Management:**
- Priority system: Critical alerts interrupt lower priority
- Abbreviations expanded: "A7X9" → "Alpha Seven X-ray Nine"

---

### Phase 4: Keyboard Navigation System

**Control Scheme:**

| Key | Action |
|-----|--------|
| `1-6` | Jump directly to tile (TYPE=1, DRAG=2, SORT=3, CONNECT=4, HOLD=5, TRACK=6) |
| `Arrow Left/Right` | Navigate between tiles |
| `Arrow Up/Down` | Navigate alert queue |
| `Enter` | Activate/select focused tile or alert |
| `Space` | Execute action (confirm placement, complete hold) |
| `Escape` | Cancel current action, return to grid |
| `Tab` | Cycle focus between grid and alert panel |
| `S` | Speak current system status |
| `R` | Repeat last announcement |
| `M` | Mute/unmute |

**Focus Management:**
- Visual focus ring maintained for sighted users in blind mode
- ARIA live regions announce focus changes
- Focus trap within active task until complete/cancelled

---

### Phase 5: Task Redesign for Blind Mode

**1. TYPE Task (Blind Mode):**
- TTS speaks: "Type: Delta Seven Alpha"
- Player types characters
- Each correct key: confirmation beep
- Each wrong key: error buzz + repeat target
- Complete: success chime + points announced

**2. SORT Task (Blind Mode):**
- TTS reads: "Sort ascending: 47, 12, 89, 23"
- Player uses number keys to input correct order
- Example: Press 2, 1, 4, 3 for [12, 47, 23, 89]
- Audio confirmation after each input
- Complete when sequence correct

**3. DRAG Task (Blind Mode):**
- TTS: "Place Alpha in zone 2, Beta in zone 1"
- Player navigates items with arrows
- Enter to pick up, number to place in zone
- Confirmation sound on correct placement

**4. CONNECT Task (Blind Mode):**
- TTS: "Connect A to 3, B to 1, C to 2"
- Player uses: A+3, B+1, C+2 (letter+number combos)
- Electric spark sound on each connection
- Full circuit sound on completion

**5. HOLD Task (Blind Mode):**
- TTS: "Hold Space for 3 seconds"
- Continuous rising tone while holding
- Tone reaches peak = complete
- Release early = fail sound + restart

**6. TRACK Task (Pitch Matching):**
- Target position encoded as pitch (low=left, high=right)
- Player uses Left/Right arrows to adjust their pitch
- Match pitch for 2 seconds = complete
- Audio-only feedback: player's pitch vs target pitch

---

### Phase 6: Voice Command Integration (Optional Enhancement)

**Supported Commands:**
- "Clear typing" / "Do type task"
- "Status" / "System status"
- "Next alert"
- "Ignore" (skip current)
- "Mute" / "Unmute"
- "Repeat"

**Implementation:**
- Web Speech API `SpeechRecognition`
- Continuous listening with wake-word optional
- Audio confirmation of recognized commands

---

### Phase 7: Overload & Failure Audio

**Progressive Degradation:**
1. Stability 100-70%: Clean audio, normal pace
2. Stability 70-50%: Subtle background drone begins
3. Stability 50-30%: Heartbeat pulse, TTS slightly faster
4. Stability 30-10%: Distortion, overlapping alerts, TTS jitters
5. Stability 10-0%: Audio chaos, stuttering
6. Crash: Silence → Deep pulse → "System crashed" → Restart sound

---

### Phase 8: UI Components for Blind Mode

**New Components:**
- `src/components/game/BlindModeToggle.tsx` - Settings button
- `src/components/game/BlindModeDashboard.tsx` - Simplified/keyboard-nav layout
- `src/components/game/BlindModeTaskTile.tsx` - Audio-first tile wrapper
- `src/components/game/AccessibilitySettings.tsx` - Volume, speech rate, etc.

**ARIA Enhancements:**
- `role="application"` on game container
- `aria-live="assertive"` for critical alerts
- `aria-live="polite"` for status updates
- Proper `tabIndex` management
- Screen reader-friendly labels

---

## File Changes Summary

| File | Change Type |
|------|-------------|
| `src/contexts/AccessibilityContext.tsx` | New |
| `src/hooks/useSpatialAudio.ts` | New |
| `src/hooks/useTextToSpeech.ts` | New |
| `src/hooks/useVoiceCommands.ts` | New |
| `src/hooks/useKeyboardNavigation.ts` | New |
| `src/components/game/BlindModeToggle.tsx` | New |
| `src/components/game/BlindModeDashboard.tsx` | New |
| `src/components/game/AccessibilitySettings.tsx` | New |
| `src/hooks/useSoundEffects.ts` | Modify (add spatial positioning, urgency layers) |
| `src/components/game/StartScreen.tsx` | Modify (add blind mode toggle) |
| `src/components/game/GameDashboard.tsx` | Modify (conditional render blind/visual) |
| `src/pages/Index.tsx` | Modify (wrap with AccessibilityProvider) |
| `src/types/game.ts` | Modify (add accessibility-related types) |
| Tile components (all 7) | Modify (add blind mode interaction handlers) |

---

## Technical Notes

- **Web Audio API**: Use `PannerNode` with `HRTF` model for spatial audio, `StereoPannerNode` for simpler left/right positioning
- **Web Speech API**: `SpeechSynthesis` for TTS (works in all modern browsers), `SpeechRecognition` for voice commands (Chrome/Edge primarily)
- **Performance**: Audio contexts are expensive; reuse single `AudioContext` instance
- **Fallbacks**: Voice commands are optional; full keyboard control is primary
- **Testing**: Will need manual testing with screen readers (NVDA, VoiceOver)

---

## Success Criteria

1. Complete game playable with screen off
2. All 6 task types have audio-only completion paths
3. Keyboard navigation covers 100% of functionality
4. No gameplay disadvantage vs visual mode
5. Urgency and system pressure clearly communicated via audio
6. Settings persist in localStorage
