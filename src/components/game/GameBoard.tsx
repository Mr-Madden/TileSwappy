import React from 'react';
import { Tile } from '../../models/types';

interface GameBoardProps {
  tiles: Tile[];
  selectedTile: string | null;
  matchingEdges: Set<string>;
  onTileInteraction: (tileId: string, deltaX: number, deltaY: number) => void;
}

export const GameBoard: React.FC<GameBoardProps> = ({
  tiles,
  selectedTile,
  matchingEdges,
  onTileInteraction
}) => {
  const [swipeStart, setSwipeStart] = React.useState({ x: 0, y: 0, tileId: '' });

  const handlePointerDown = (e: React.MouseEvent | React.TouchEvent, tileId: string) => {
    e.preventDefault();
    const x = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const y = 'touches' in e ? e.touches[0].clientY : e.clientY;
    setSwipeStart({ x, y, tileId });
  };

  const handlePointerUp = (e: React.MouseEvent | React.TouchEvent, tileId: string) => {
    e.preventDefault();
    const x = 'changedTouches' in e ? e.changedTouches[0].clientX : e.clientX;
    const y = 'changedTouches' in e ? e.changedTouches[0].clientY : e.clientY;
    
    if (swipeStart.tileId === tileId) {
      onTileInteraction(tileId, x - swipeStart.x, y - swipeStart.y);
    }
    setSwipeStart({ x: 0, y: 0, tileId: '' });
  };

  return (
    <div 
      className="grid grid-cols-3 gap-1 mx-auto bg-navy-light backdrop-blur-sm p-1.5 rounded-xl border-2 border-navy-dark" 
      style={{ 
        width: 'min(92vw, min(92vh, 450px))', 
        aspectRatio: '1',
        maxWidth: '450px'
      }}
    >
      {[...tiles].sort((a, b) => {
        if (a.row !== b.row) return a.row - b.row;
        return a.col - b.col;
      }).map((tile) => (
        <div key={tile.id} className="relative aspect-square">
          <div
            onMouseDown={(e) => handlePointerDown(e, tile.id)}
            onMouseUp={(e) => handlePointerUp(e, tile.id)}
            onTouchStart={(e) => handlePointerDown(e, tile.id)}
            onTouchEnd={(e) => handlePointerUp(e, tile.id)}
            className={`w-full h-full rounded-lg overflow-hidden cursor-pointer touch-none transition-all duration-300 ${
              selectedTile === tile.id 
                ? 'border-4 border-coral shadow-coral-glow' 
                : 'border-2 border-navy-dark hover:border-teal'
            }`}
            style={{ 
              transform: `rotate(${tile.rotation * 90}deg)`, 
              transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)' 
            }}
          >
            <img src={tile.imageData} alt="" className="w-full h-full object-cover" draggable={false} />
          </div>
          
          {/* Edge matching indicators - responsive sizing */}
          {matchingEdges.has(`${tile.row}-${tile.col}-right`) && tile.col < 2 && (
            <div 
              className="absolute top-1/2 -right-0.5 bg-teal rounded transform -translate-y-1/2 shadow-teal-glow"
              style={{ 
                width: 'clamp(6px, 1.5vw, 8px)', 
                height: 'clamp(24px, 6vw, 32px)' 
              }}
            ></div>
          )}
          {matchingEdges.has(`${tile.row}-${tile.col}-bottom`) && tile.row < 2 && (
            <div 
              className="absolute -bottom-0.5 left-1/2 bg-teal rounded transform -translate-x-1/2 shadow-teal-glow"
              style={{ 
                width: 'clamp(24px, 6vw, 32px)', 
                height: 'clamp(6px, 1.5vw, 8px)' 
              }}
            ></div>
          )}
        </div>
      ))}
    </div>
  );
};