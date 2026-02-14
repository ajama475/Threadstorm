import { GameProvider, useGame } from '@/contexts/GameContext';
import { AccessibilityProvider, useAccessibility } from '@/contexts/AccessibilityContext';
import { BootScreen } from '@/components/game/BootScreen';
import { StartScreen } from '@/components/game/StartScreen';
import { TutorialOverlay } from '@/components/game/TutorialOverlay';
import { GameDashboard } from '@/components/game/GameDashboard';
import { GameOver } from '@/components/game/GameOver';
import { DangerPulse } from '@/components/game/DangerPulse';
import { PopupsManager } from '@/components/game/PopupsManager';
import { BlindModeAudioManager } from '@/components/game/BlindModeAudioManager';
import { useEffect } from 'react';

function GameContent() {
  const { state, dispatch, startPlaying } = useGame();
  const { state: accessibilityState } = useAccessibility();

  // Auto-boot on idle
  useEffect(() => {
    if (state.status === 'idle') dispatch({ type: 'BOOT' });
  }, [state.status, dispatch]);

  if (state.status === 'idle' || state.status === 'booting') {
    return <BootScreen onComplete={() => dispatch({ type: 'SHOW_START' })} />;
  }

  if (state.status === 'startScreen') {
    return (
      <StartScreen
        onStart={() => {
          if (state.tutorialCompleted) {
            startPlaying();
          } else {
            dispatch({ type: 'START_TUTORIAL' });
          }
        }}
      />
    );
  }

  if (state.status === 'gameOver') {
    return <GameOver />;
  }

  // tutorial | playing | paused
  return (
    <>
      <GameDashboard />
      {state.status === 'tutorial' && (
        <TutorialOverlay onComplete={startPlaying} />
      )}
      {(state.status === 'playing' || state.status === 'paused') && (
        <>
          <DangerPulse />
          <PopupsManager />
        </>
      )}
      {accessibilityState.blindMode && <BlindModeAudioManager />}
    </>
  );
}

const Index = () => {
  return (
    <AccessibilityProvider>
      <GameProvider>
        <div
          className="min-h-screen bg-background grid-pattern relative overflow-hidden"
          role="application"
          aria-label="Command Overload game"
        >
          <div className="fixed inset-0 pointer-events-none">
            <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
            <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-accent/10 rounded-full blur-3xl" />
          </div>

          <GameContent />

          <div aria-live="polite" aria-atomic="true" className="sr-only" id="game-announcements" />
        </div>
      </GameProvider>
    </AccessibilityProvider>
  );
};

export default Index;
