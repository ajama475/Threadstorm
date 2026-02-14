import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Settings, Volume2, VolumeX, Mic, MicOff, Headphones } from 'lucide-react';
import { useAccessibility } from '@/contexts/AccessibilityContext';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { BlindModeToggle } from './BlindModeToggle';

export function AccessibilitySettings() {
  const [isOpen, setIsOpen] = useState(false);
  const { 
    state, 
    setMasterVolume, 
    setSpeechRate, 
    setSpatialEnabled, 
    setVoiceCommands,
    toggleMute 
  } = useAccessibility();

  return (
    <div className="relative">
      {/* Settings button */}
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 rounded-lg border border-primary/30 bg-background/80 hover:bg-primary/10 transition-colors"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        aria-label="Accessibility settings"
        aria-expanded={isOpen}
      >
        <Settings className="w-5 h-5 text-primary" />
      </motion.button>

      {/* Settings panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            className="absolute right-0 top-12 w-80 p-4 bg-card border-2 border-primary/30 rounded-xl shadow-2xl z-50"
          >
            <h3 className="font-display text-lg text-primary mb-4 tracking-wider">
              ACCESSIBILITY
            </h3>

            <div className="space-y-5">
              {/* Blind Mode Toggle */}
              <div className="pb-4 border-b border-muted">
                <BlindModeToggle />
                <p className="text-xs text-muted-foreground mt-2 font-mono">
                  Audio-only gameplay with TTS announcements
                </p>
              </div>

              {/* Master Volume */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="font-mono text-sm flex items-center gap-2">
                    {state.muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                    Volume
                  </label>
                  <button
                    onClick={toggleMute}
                    className="text-xs font-mono text-muted-foreground hover:text-primary transition-colors"
                  >
                    {state.muted ? 'UNMUTE' : 'MUTE'}
                  </button>
                </div>
                <Slider
                  value={[state.masterVolume * 100]}
                  onValueChange={([v]) => setMasterVolume(v / 100)}
                  max={100}
                  step={5}
                  disabled={state.muted}
                  className="w-full"
                  aria-label="Master volume"
                />
                <span className="text-xs text-muted-foreground font-mono">
                  {Math.round(state.masterVolume * 100)}%
                </span>
              </div>

              {/* Speech Rate */}
              <div className="space-y-2">
                <label className="font-mono text-sm flex items-center gap-2">
                  <Headphones className="w-4 h-4" />
                  Speech Rate
                </label>
                <Slider
                  value={[state.speechRate * 50]}
                  onValueChange={([v]) => setSpeechRate(v / 50)}
                  min={25}
                  max={100}
                  step={5}
                  className="w-full"
                  aria-label="Text-to-speech rate"
                />
                <span className="text-xs text-muted-foreground font-mono">
                  {state.speechRate.toFixed(1)}x
                </span>
              </div>

              {/* Spatial Audio Toggle */}
              <div className="flex items-center justify-between">
                <label className="font-mono text-sm">Spatial Audio</label>
                <Switch
                  checked={state.spatialEnabled}
                  onCheckedChange={setSpatialEnabled}
                  aria-label="Enable spatial audio"
                />
              </div>

              {/* Voice Commands Toggle */}
              <div className="flex items-center justify-between">
                <label className="font-mono text-sm flex items-center gap-2">
                  {state.voiceCommandsEnabled ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
                  Voice Commands
                </label>
                <Switch
                  checked={state.voiceCommandsEnabled}
                  onCheckedChange={setVoiceCommands}
                  aria-label="Enable voice commands"
                />
              </div>

              {/* Keyboard shortcuts hint */}
              {state.blindMode && (
                <div className="pt-4 border-t border-muted">
                  <p className="text-xs font-mono text-muted-foreground mb-2">KEYBOARD SHORTCUTS:</p>
                  <div className="grid grid-cols-2 gap-1 text-xs font-mono">
                    <span className="text-primary">1-6</span>
                    <span className="text-muted-foreground">Jump to tile</span>
                    <span className="text-primary">S</span>
                    <span className="text-muted-foreground">Status</span>
                    <span className="text-primary">R</span>
                    <span className="text-muted-foreground">Repeat</span>
                    <span className="text-primary">M</span>
                    <span className="text-muted-foreground">Mute</span>
                    <span className="text-primary">←→</span>
                    <span className="text-muted-foreground">Navigate tiles</span>
                  </div>
                </div>
              )}
            </div>

            {/* Close button */}
            <button
              onClick={() => setIsOpen(false)}
              className="absolute top-2 right-2 p-1 text-muted-foreground hover:text-primary transition-colors"
              aria-label="Close settings"
            >
              ×
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
