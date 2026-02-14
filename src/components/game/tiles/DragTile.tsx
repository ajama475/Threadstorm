import { useState, useMemo } from 'react';
import { Alert } from '@/types/game';
import { useGame } from '@/contexts/GameContext';
import { generateDragTask } from '@/lib/alertGenerator';
import { motion } from 'framer-motion';

interface DragTileProps {
  alert: Alert;
  compact?: boolean;
}

export function DragTile({ alert, compact }: DragTileProps) {
  const { completeTask } = useGame();
  const { items, zones } = useMemo(() => generateDragTask(), []);
  
  const [placedItems, setPlacedItems] = useState<Record<string, string>>({});
  const [draggedItem, setDraggedItem] = useState<string | null>(null);

  const handleDragStart = (itemId: string) => {
    setDraggedItem(itemId);
  };

  const handleDragEnd = () => {
    setDraggedItem(null);
  };

  const handleDrop = (zoneId: string) => {
    if (!draggedItem) return;

    const newPlacements = { ...placedItems, [draggedItem]: zoneId };
    setPlacedItems(newPlacements);

    const allPlaced = items.every(item => {
      const zone = zones.find(z => z.acceptsId === item.id);
      return newPlacements[item.id] === zone?.id;
    });

    if (allPlaced) {
      completeTask(alert.id, 75);
    }
  };

  const isItemPlaced = (itemId: string) => !!placedItems[itemId];
  const getItemInZone = (zoneId: string) => {
    const itemId = Object.entries(placedItems).find(([_, z]) => z === zoneId)?.[0];
    return items.find(i => i.id === itemId);
  };

  const itemSize = compact ? 'w-10 h-10 text-lg' : 'w-16 h-16 text-2xl';
  const zoneSize = compact ? 'w-12 h-12 text-lg' : 'w-20 h-20 text-2xl';

  return (
    <div className="h-full flex flex-col items-center justify-center gap-3">
      {/* Draggable items */}
      <div className="flex gap-2">
        {items.map((item) => (
          <motion.div
            key={item.id}
            draggable={!isItemPlaced(item.id)}
            onDragStart={() => handleDragStart(item.id)}
            onDragEnd={handleDragEnd}
            whileHover={{ scale: isItemPlaced(item.id) ? 1 : 1.05 }}
            whileDrag={{ scale: 1.1, cursor: 'grabbing' }}
            className={`${itemSize} border-2 flex items-center justify-center font-display
                        cursor-grab transition-all
                        ${isItemPlaced(item.id) 
                          ? 'border-success/30 bg-success/10 text-success/50 cursor-not-allowed' 
                          : 'border-primary bg-primary/20 text-primary hover:bg-primary/30'}`}
          >
            {item.label}
          </motion.div>
        ))}
      </div>

      {/* Arrow */}
      <div className="text-muted-foreground font-mono text-xs">↓</div>

      {/* Drop zones */}
      <div className="flex gap-2">
        {zones.map((zone) => {
          const placedItem = getItemInZone(zone.id);
          const isCorrect = placedItem && zone.acceptsId === placedItem.id;

          return (
            <motion.div
              key={zone.id}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => handleDrop(zone.id)}
              className={`${zoneSize} border-2 border-dashed flex flex-col items-center justify-center
                          transition-all
                          ${placedItem 
                            ? isCorrect 
                              ? 'border-success bg-success/20' 
                              : 'border-destructive bg-destructive/20'
                            : draggedItem 
                              ? 'border-primary bg-primary/10' 
                              : 'border-muted bg-muted/20'}`}
            >
              {placedItem ? (
                <span className="font-display text-foreground">
                  {placedItem.label}
                </span>
              ) : (
                <span className="font-mono text-[10px] text-muted-foreground">
                  {zone.label}
                </span>
              )}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
