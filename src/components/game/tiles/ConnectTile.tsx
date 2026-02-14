import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { Alert } from '@/types/game';
import { useGame } from '@/contexts/GameContext';
import { useAccessibility } from '@/contexts/AccessibilityContext';
import { useSpatialAudio } from '@/hooks/useSpatialAudio';
import { useTextToSpeech } from '@/hooks/useTextToSpeech';
import { generateConnectTask } from '@/lib/alertGenerator';
import { motion } from 'framer-motion';

interface ConnectTileProps {
  alert: Alert;
  compact?: boolean;
}

export function ConnectTile({ alert, compact }: ConnectTileProps) {
  const { completeTask } = useGame();
  const { state: accessibilityState } = useAccessibility();
  const { playCorrectBeep, playErrorBuzz, playSuccessChime } = useSpatialAudio();
  const { speakNow } = useTextToSpeech();
  
  const { nodes, correctConnections } = useMemo(() => generateConnectTask(), []);
  const hasAnnouncedRef = useRef(false);
  
  const [connections, setConnections] = useState<Record<string, string>>({});
  const [selectedNode, setSelectedNode] = useState<string | null>(null);

  const leftNodes = nodes.filter(n => n.side === 'left');
  const rightNodes = nodes.filter(n => n.side === 'right');

  // Announce task in blind mode
  useEffect(() => {
    if (accessibilityState.blindMode && !hasAnnouncedRef.current) {
      hasAnnouncedRef.current = true;
      const pairs = Object.entries(correctConnections)
        .map(([left, right]) => {
          const leftNode = leftNodes.find(n => n.id === left);
          const rightNode = rightNodes.find(n => n.id === right);
          return `${leftNode?.label} to ${rightNode?.label}`;
        })
        .join(', ');
      speakNow(`Connect matching pairs: ${pairs}. Press letter then number.`);
    }
  }, [accessibilityState.blindMode, correctConnections, leftNodes, rightNodes, speakNow]);

  // Handle keyboard input for blind mode
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (!accessibilityState.blindMode) return;

    const key = e.key.toUpperCase();
    
    // Letters select left nodes
    if (key.match(/^[A-C]$/)) {
      const node = leftNodes.find(n => n.label === key);
      if (node && !connections[node.id]) {
        setSelectedNode(node.id);
        playCorrectBeep();
        speakNow(`Selected ${key}`);
      }
    }
    
    // Numbers select right nodes
    if (key.match(/^[1-3]$/) && selectedNode) {
      const node = rightNodes.find(n => n.label === key);
      if (node && !Object.values(connections).includes(node.id)) {
        const isCorrect = correctConnections[selectedNode] === node.id;
        const newConnections = { ...connections, [selectedNode]: node.id };
        setConnections(newConnections);
        
        if (isCorrect) {
          playCorrectBeep();
        } else {
          playErrorBuzz();
        }

        const allCorrect = Object.entries(correctConnections).every(
          ([left, right]) => newConnections[left] === right
        );

        if (allCorrect && Object.keys(newConnections).length === Object.keys(correctConnections).length) {
          playSuccessChime();
          completeTask(alert.id, 80);
        }
        
        setSelectedNode(null);
      }
    }
  }, [accessibilityState.blindMode, leftNodes, rightNodes, selectedNode, connections, correctConnections, alert.id, completeTask, playCorrectBeep, playErrorBuzz, playSuccessChime, speakNow]);

  useEffect(() => {
    if (accessibilityState.blindMode) {
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [accessibilityState.blindMode, handleKeyDown]);

  const handleNodeClick = useCallback((nodeId: string, side: 'left' | 'right') => {
    if (!selectedNode) {
      if (side === 'left') {
        setSelectedNode(nodeId);
      }
    } else {
      if (side === 'right' && selectedNode !== nodeId) {
        const newConnections = { ...connections, [selectedNode]: nodeId };
        setConnections(newConnections);

        const allCorrect = Object.entries(correctConnections).every(
          ([left, right]) => newConnections[left] === right
        );

        if (allCorrect && Object.keys(newConnections).length === Object.keys(correctConnections).length) {
          completeTask(alert.id, 80);
        }
      }
      setSelectedNode(null);
    }
  }, [selectedNode, connections, correctConnections, alert.id, completeTask]);

  const getConnectionStatus = (leftId: string) => {
    const connectedTo = connections[leftId];
    if (!connectedTo) return null;
    return correctConnections[leftId] === connectedTo ? 'correct' : 'incorrect';
  };

  const isNodeConnected = (nodeId: string) => {
    return Object.keys(connections).includes(nodeId) || 
           Object.values(connections).includes(nodeId);
  };

  const nodeSize = compact ? 'w-8 h-8 text-xs' : 'w-14 h-14 text-xl';
  const gap = compact ? 'gap-2' : 'gap-4';
  const lineGap = compact ? 48 : 72;
  const lineWidth = compact ? 48 : 128;

  return (
    <div 
      className="h-full flex items-center justify-center relative"
      role="region"
      aria-label="Connect task: Match left nodes to right nodes"
    >
      <div className={`flex items-center ${compact ? 'gap-6' : 'gap-24'}`}>
        {/* Left nodes */}
        <div className={`flex flex-col ${gap}`}>
          {leftNodes.map((node) => {
            const status = getConnectionStatus(node.id);
            const isSelected = selectedNode === node.id;

            return (
              <motion.button
                key={node.id}
                onClick={() => handleNodeClick(node.id, 'left')}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className={`${nodeSize} rounded-full border-2 flex items-center justify-center
                            font-display transition-all
                            ${status === 'correct' ? 'border-success bg-success/20 text-success' :
                              status === 'incorrect' ? 'border-destructive bg-destructive/20 text-destructive' :
                              isSelected ? 'border-warning bg-warning/20 text-warning' :
                              'border-primary bg-primary/20 text-primary hover:bg-primary/30'}`}
                aria-label={`Node ${node.label}${status === 'correct' ? ', connected correctly' : status === 'incorrect' ? ', connected incorrectly' : isSelected ? ', selected' : ''}`}
              >
                {node.label}
              </motion.button>
            );
          })}
        </div>

        {/* Connection lines visualization */}
        <div className="relative" style={{ width: lineWidth, height: leftNodes.length * lineGap - (compact ? 16 : 24) }} aria-hidden="true">
          <svg className="absolute inset-0 w-full h-full overflow-visible">
            {Object.entries(connections).map(([leftId, rightId]) => {
              const leftIndex = leftNodes.findIndex(n => n.id === leftId);
              const rightIndex = rightNodes.findIndex(n => n.id === rightId);
              const isCorrect = correctConnections[leftId] === rightId;

              const nodeOffset = compact ? 16 : 28;
              const y1 = nodeOffset + leftIndex * lineGap;
              const y2 = nodeOffset + rightIndex * lineGap;

              return (
                <motion.line
                  key={`${leftId}-${rightId}`}
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  x1="0"
                  y1={y1}
                  x2={lineWidth}
                  y2={y2}
                  stroke={isCorrect ? 'hsl(var(--success))' : 'hsl(var(--destructive))'}
                  strokeWidth={compact ? 2 : 3}
                  strokeLinecap="round"
                />
              );
            })}
          </svg>
        </div>

        {/* Right nodes */}
        <div className={`flex flex-col ${gap}`}>
          {rightNodes.map((node) => {
            const isConnected = isNodeConnected(node.id);

            return (
              <motion.button
                key={node.id}
                onClick={() => handleNodeClick(node.id, 'right')}
                whileHover={{ scale: selectedNode ? 1.05 : 1 }}
                whileTap={{ scale: 0.95 }}
                disabled={!selectedNode}
                className={`${nodeSize} rounded-full border-2 flex items-center justify-center
                            font-display transition-all
                            ${isConnected ? 'border-muted bg-muted/20 text-muted-foreground' :
                              selectedNode ? 'border-accent bg-accent/20 text-accent hover:bg-accent/30' :
                              'border-muted bg-muted/20 text-muted-foreground'}`}
                aria-label={`Node ${node.label}${isConnected ? ', already connected' : ''}`}
              >
                {node.label}
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Blind mode hint */}
      {accessibilityState.blindMode && (
        <div className="absolute bottom-1 left-1/2 -translate-x-1/2 font-mono text-[10px] text-muted-foreground">
          PRESS LETTER + NUMBER
        </div>
      )}

      {/* Screen reader status */}
      <div className="sr-only" role="status" aria-live="polite">
        {Object.keys(connections).length} of {Object.keys(correctConnections).length} connections made
      </div>
    </div>
  );
}
