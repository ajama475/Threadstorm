import { useGame } from '@/contexts/GameContext';
import { Alert } from '@/types/game';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, Clock, Keyboard, MousePointer, ArrowUpDown, Link2, Timer, Target, Type } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

const TASK_ICONS = {
  type: Keyboard,
  drag: MousePointer,
  sort: ArrowUpDown,
  connect: Link2,
  hold: Timer,
  track: Target,
  sentence: Type,
};

const URGENCY_COLORS = {
  low: 'border-primary/50 bg-primary/5',
  medium: 'border-accent/50 bg-accent/5',
  high: 'border-warning/50 bg-warning/5',
  critical: 'border-destructive/50 bg-destructive/5 animate-pulse',
};

const URGENCY_TEXT = {
  low: 'text-primary',
  medium: 'text-accent',
  high: 'text-warning',
  critical: 'text-destructive',
};

const URGENCY_PRIORITY = {
  critical: 4,
  high: 3,
  medium: 2,
  low: 1,
} as const;

function compareAlerts(a: Alert, b: Alert) {
  const urgencyDelta = URGENCY_PRIORITY[b.urgency] - URGENCY_PRIORITY[a.urgency];
  if (urgencyDelta !== 0) return urgencyDelta;

  const timeDelta = a.timeRemaining - b.timeRemaining;
  if (timeDelta !== 0) return timeDelta;

  const createdDelta = a.createdAt - b.createdAt;
  if (createdDelta !== 0) return createdDelta;

  return a.id.localeCompare(b.id);
}

export function AlertPanel() {
  const { state, selectAlert } = useGame();
  const sortedAlerts = [...state.alerts].sort(compareAlerts);

  return (
    <motion.div
      initial={{ x: 50, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      className="h-full border border-border bg-card/50 backdrop-blur-sm flex flex-col"
    >
      {/* Header */}
      <div className="p-3 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-warning" />
          <h2 className="font-display text-sm tracking-wider">ALERT QUEUE</h2>
        </div>
        <span className="font-mono text-xs text-muted-foreground">
          {state.alerts.length} PENDING
        </span>
      </div>

      {/* Alert list */}
      <ScrollArea className="flex-1 min-h-0">
        <div className="p-2 space-y-2">
          <AnimatePresence mode="popLayout">
            {state.alerts.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="p-4 text-center"
              >
                <p className="font-mono text-sm text-muted-foreground">
                  [ NO ACTIVE ALERTS ]
                </p>
                <p className="font-mono text-xs text-muted-foreground mt-1">
                  SYSTEM NOMINAL
                </p>
              </motion.div>
            ) : (
              sortedAlerts.map((alert) => (
                  <AlertCard
                    key={alert.id}
                    alert={alert}
                    isActive={state.activeAlertId === alert.id}
                    onSelect={() => selectAlert(alert)}
                  />
                ))
            )}
          </AnimatePresence>
        </div>
      </ScrollArea>
    </motion.div>
  );
}

function AlertCard({ 
  alert, 
  isActive, 
  onSelect 
}: { 
  alert: Alert; 
  isActive: boolean; 
  onSelect: () => void;
}) {
  const Icon = TASK_ICONS[alert.taskType];
  const timePercent = (alert.timeRemaining / alert.timeLimit) * 100;

  return (
    <motion.button
      layout
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20, scale: 0.9 }}
      onClick={onSelect}
      className={`w-full text-left p-3 border transition-all relative overflow-hidden ${
        URGENCY_COLORS[alert.urgency]
      } ${isActive ? 'ring-2 ring-primary' : 'hover:bg-card/80'}`}
    >
      {/* Time bar */}
      <div className="absolute bottom-0 left-0 h-1 bg-muted w-full">
        <motion.div
          className={`h-full ${
            alert.urgency === 'critical' ? 'bg-destructive' :
            alert.urgency === 'high' ? 'bg-warning' :
            'bg-primary'
          }`}
          initial={{ width: '100%' }}
          animate={{ width: `${timePercent}%` }}
          transition={{ duration: 0.1 }}
        />
      </div>

      {/* Content */}
      <div className="flex items-start gap-3">
        <div className={`p-2 rounded ${URGENCY_COLORS[alert.urgency]}`}>
          <Icon className={`w-4 h-4 ${URGENCY_TEXT[alert.urgency]}`} />
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className={`font-mono text-xs uppercase ${URGENCY_TEXT[alert.urgency]}`}>
              {alert.urgency}
            </span>
            <span className="font-mono text-xs text-muted-foreground">
              {alert.taskType.toUpperCase()}
            </span>
          </div>
          
          <p className="font-display text-sm text-foreground truncate">
            {alert.title}
          </p>
          
          <div className="flex items-center gap-1 mt-1">
            <Clock className="w-3 h-3 text-muted-foreground" />
            <span className={`font-mono text-xs ${
              alert.timeRemaining < 5 ? 'text-destructive' :
              alert.timeRemaining < 10 ? 'text-warning' : 'text-muted-foreground'
            }`}>
              {alert.timeRemaining.toFixed(1)}s
            </span>
          </div>
        </div>
      </div>
    </motion.button>
  );
}
