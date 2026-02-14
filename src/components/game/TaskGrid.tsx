import { useGame } from '@/contexts/GameContext';
import { useAccessibility } from '@/contexts/AccessibilityContext';
import { TypeTile } from './tiles/TypeTile';
import { DragTile } from './tiles/DragTile';
import { SortTile } from './tiles/SortTile';
import { ConnectTile } from './tiles/ConnectTile';
import { HoldTile } from './tiles/HoldTile';
import { TrackTile } from './tiles/TrackTile';
import { SentenceTile } from './tiles/SentenceTile';
import { motion, AnimatePresence } from 'framer-motion';
import { Alert, TaskType } from '@/types/game';
import { TASK_TO_INDEX } from '@/types/accessibility';
import { Lock } from 'lucide-react';

const TILE_CONFIG: { type: TaskType; label: string; description: string; hotkey: string }[] = [
  { type: 'type', label: 'TYPE', description: 'Enter codes', hotkey: '1' },
  { type: 'drag', label: 'DRAG', description: 'Move items', hotkey: '2' },
  { type: 'sort', label: 'SORT', description: 'Order sequence', hotkey: '3' },
  { type: 'connect', label: 'CONNECT', description: 'Link nodes', hotkey: '4' },
  { type: 'hold', label: 'HOLD', description: 'Press & hold', hotkey: '5' },
  { type: 'track', label: 'TRACK', description: 'Follow target', hotkey: '6' },
];

export function TaskGrid() {
  const { state } = useGame();
  const { state: accessibilityState } = useAccessibility();

  return (
    <div
      className="h-full min-h-0 grid grid-cols-2 lg:grid-cols-3 auto-rows-fr gap-4"
      role="grid"
      aria-label="Task tiles grid"
    >
      {TILE_CONFIG.map((tile, index) => {
        const pendingAlert = state.alerts.find(a => a.taskType === tile.type);
        const isFocused = accessibilityState.blindMode && accessibilityState.focusedTileIndex === index;
        const isLocked = !state.unlockedPanels.includes(tile.type);

        return (
          <TaskTileWrapper
            key={tile.type}
            type={tile.type}
            label={tile.label}
            description={tile.description}
            hotkey={tile.hotkey}
            alert={pendingAlert}
            isFocused={isFocused}
            tileIndex={index}
            isLocked={isLocked}
          />
        );
      })}
    </div>
  );
}

interface TaskTileWrapperProps {
  type: TaskType;
  label: string;
  description: string;
  hotkey: string;
  alert?: Alert;
  isFocused: boolean;
  tileIndex: number;
  isLocked: boolean;
}

function TaskTileWrapper({ type, label, description, hotkey, alert, isFocused, tileIndex, isLocked }: TaskTileWrapperProps) {
  const hasPending = !!alert;
  const urgencyClass = alert?.urgency === 'critical' ? 'border-destructive glow-red' :
                       alert?.urgency === 'high' ? 'border-warning glow-yellow' :
                       hasPending ? 'border-primary glow-cyan' : 'border-border';

  const focusClass = isFocused ? 'ring-4 ring-accent ring-offset-2 ring-offset-background' : '';

  return (
    <motion.div
      layout
      className={`relative h-full min-h-0 max-h-full border-2 bg-card/30 backdrop-blur-sm
                  flex flex-col transition-all overflow-hidden
                  ${urgencyClass} ${hasPending ? '' : 'opacity-50'} ${focusClass}
                  ${isLocked ? 'opacity-30' : ''}`}
      role="gridcell"
      aria-label={isLocked ? `${label} tile, locked` : `${label} tile${hasPending ? `, active alert, ${Math.ceil(alert!.timeRemaining)} seconds remaining` : ', no alert'}`}
      aria-current={isFocused ? 'true' : undefined}
      tabIndex={isFocused ? 0 : -1}
    >
      {/* Corner accents */}
      <div className="absolute top-0 left-0 w-4 h-4 border-l-2 border-t-2 border-inherit z-10" aria-hidden="true" />
      <div className="absolute top-0 right-0 w-4 h-4 border-r-2 border-t-2 border-inherit z-10" aria-hidden="true" />
      <div className="absolute bottom-0 left-0 w-4 h-4 border-l-2 border-b-2 border-inherit z-10" aria-hidden="true" />
      <div className="absolute bottom-0 right-0 w-4 h-4 border-r-2 border-b-2 border-inherit z-10" aria-hidden="true" />

      {/* Locked overlay */}
      {isLocked && (
        <div className="absolute inset-0 bg-background/60 z-30 flex flex-col items-center justify-center gap-2">
          <Lock className="w-6 h-6 text-muted-foreground/40" />
          <span className="font-mono text-xs text-muted-foreground/40 tracking-wider">LOCKED</span>
        </div>
      )}

      {/* Header */}
      <div className="shrink-0 flex items-center justify-between p-3 border-b border-inherit/30 bg-card/50">
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs text-muted-foreground bg-muted/50 px-1.5 py-0.5 rounded">
            {hotkey}
          </span>
          <span className="font-display text-lg tracking-wider text-foreground">
            {label}
          </span>
          {hasPending && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="w-2 h-2 bg-primary rounded-full animate-pulse"
              aria-hidden="true"
            />
          )}
        </div>
        {alert && (
          <div
            className={`font-mono text-sm ${
              alert.timeRemaining < 5 ? 'text-destructive animate-pulse' :
              alert.timeRemaining < 10 ? 'text-warning' : 'text-primary'
            }`}
            aria-label={`${Math.ceil(alert.timeRemaining)} seconds remaining`}
          >
            {alert.timeRemaining.toFixed(1)}s
          </div>
        )}
      </div>

      {/* Content area */}
      <div className="flex-1 min-h-0 relative overflow-hidden">
        <AnimatePresence mode="wait">
          {hasPending && !isLocked ? (
            <motion.div
              key="active"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 overflow-y-auto"
            >
              <ActiveTileContent type={type} alert={alert!} />
            </motion.div>
          ) : (
            <motion.div
              key="idle"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 px-2 flex flex-col items-center justify-center gap-2 overflow-hidden"
            >
              {!isLocked && (
                <>
                  <span className="font-mono text-xs text-muted-foreground">{description}</span>
                  <span className="font-mono text-xs text-muted-foreground/50">AWAITING ALERT</span>
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

function ActiveTileContent({ type, alert }: { type: TaskType; alert: Alert }) {
  const TileComponent = {
    type: TypeTile,
    drag: DragTile,
    sort: SortTile,
    connect: ConnectTile,
    hold: HoldTile,
    track: TrackTile,
    sentence: SentenceTile,
  }[type];

  if (!TileComponent) return null;

  return (
    <div className="h-full p-2 overflow-y-auto">
      <TileComponent alert={alert} compact />
    </div>
  );
}
