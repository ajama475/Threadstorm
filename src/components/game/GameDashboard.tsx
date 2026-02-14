import { useAccessibility } from '@/contexts/AccessibilityContext';
import { StatusBar } from './StatusBar';
import { AlertPanel } from './AlertPanel';
import { TaskGrid } from './TaskGrid';
import { AccessibilitySettings } from './AccessibilitySettings';

export function GameDashboard() {
  const { state: accessibilityState } = useAccessibility();

  return (
    <div 
      className="min-h-screen flex flex-col relative"
      role="main"
      aria-label="Game dashboard"
    >

      {/* Accessibility settings - always visible */}
      <div className="absolute top-4 right-4 z-40">
        <AccessibilitySettings />
      </div>

      {/* Status Bar */}
      <StatusBar />

      {/* Blind mode indicator */}
      {accessibilityState.blindMode && (
        <div 
          className="bg-accent/20 border-b border-accent/30 px-4 py-2 font-mono text-sm text-accent-foreground flex items-center justify-center gap-4"
          role="status"
          aria-live="polite"
        >
          <span>🎧 AUDIO MODE ACTIVE</span>
          <span className="text-muted-foreground">Press S for status • R to repeat • M to mute</span>
        </div>
      )}

      {/* Main content area */}
      <div className="flex-1 flex gap-4 p-4 pt-0">
        {/* Task Grid - Main area */}
        <div 
          className="flex-1"
          role="region"
          aria-label="Task grid"
        >
          <TaskGrid />
        </div>

        {/* Alert Panel - Side */}
        <div 
          className="w-80 flex-shrink-0"
          role="region"
          aria-label="Alert queue"
        >
          <AlertPanel />
        </div>
      </div>
    </div>
  );
}
