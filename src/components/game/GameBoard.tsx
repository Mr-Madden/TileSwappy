import React from 'react';
import { Tile } from '../../models/types';

interface GameBoardProps {
  tiles: Tile[];
  selectedTile: string | null;
  matchingEdges: Set<string>;
  onTileInteraction: (tileId: string, deltaX: number, deltaY: number) => void;
  onUndo: () => void;
  onShuffle: () => void;
  onPause: () => void;
  onRestart: () => void;
  canUndo: boolean;
  isPaused: boolean;
  showControlsModal?: boolean;
  showHowToSolveModal?: boolean;
  onCloseControlsModal?: () => void;
  onCloseHowToSolveModal?: () => void;
}

export const GameBoard: React.FC<GameBoardProps> = ({
  tiles,
  selectedTile,
  matchingEdges,
  onTileInteraction,
  onUndo,
  onShuffle,
  onPause,
  onRestart,
  canUndo,
  isPaused,
  showControlsModal = false,
  showHowToSolveModal = false,
  onCloseControlsModal,
  onCloseHowToSolveModal
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

  const handleCloseControls = (dontShowAgain: boolean) => {
    if (dontShowAgain) {
      localStorage.setItem('hideControlsModal', 'true');
    }
    onCloseControlsModal?.();
  };

  const handleCloseHowToSolve = (dontShowAgain: boolean) => {
    if (dontShowAgain) {
      localStorage.setItem('hideHowToSolveModal', 'true');
    }
    onCloseHowToSolveModal?.();
  };

  return (
    <>
      {/* Game Board - Properly sized without fixed positioning */}
      <div 
        className="grid grid-cols-3 gap-1 bg-navy-light backdrop-blur-sm p-1.5 rounded-xl border-2 border-navy-dark mx-auto" 
        style={{ 
          width: 'min(90vw, 65vh)', 
          height: 'min(90vw, 65vh)',
          maxWidth: '600px',
          maxHeight: '600px'
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
            
            {/* Edge matching indicators - full edge illumination */}
            {matchingEdges.has(`${tile.row}-${tile.col}-right`) && tile.col < 2 && (
              <div 
                className="absolute top-0 -right-1 bg-green-500 transform animate-pulse"
                style={{ 
                  width: '5px', 
                  height: '100%',
                  boxShadow: '0 0 20px rgba(34, 197, 94, 1), 0 0 40px rgba(34, 197, 94, 0.6), 0 0 60px rgba(34, 197, 94, 0.3)'
                }}
              ></div>
            )}
            {matchingEdges.has(`${tile.row}-${tile.col}-bottom`) && tile.row < 2 && (
              <div 
                className="absolute -bottom-1 left-0 bg-green-500 transform animate-pulse"
                style={{ 
                  width: '100%', 
                  height: '5px',
                  boxShadow: '0 0 20px rgba(34, 197, 94, 1), 0 0 40px rgba(34, 197, 94, 0.6), 0 0 60px rgba(34, 197, 94, 0.3)'
                }}
              ></div>
            )}
          </div>
        ))}
      </div>

      {/* Controls Modal */}
      {showControlsModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
          <div className="bg-navy-light rounded-xl border-2 border-teal/30 p-6 max-w-md w-full shadow-2xl">
            <div className="text-center pb-4 border-b border-teal/20">
              <h3 className="text-teal font-bold text-2xl tracking-wide">CONTROLS</h3>
            </div>
            
            <div className="space-y-6 mt-6">
              {/* Rotate Section */}
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-lg bg-teal/20 flex items-center justify-center flex-shrink-0">
                    <svg className="w-7 h-7 text-teal" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                  </div>
                  <h4 className="text-teal font-semibold text-lg">Rotate Tiles</h4>
                </div>
                <p className="text-white leading-relaxed pl-1">
              Drag any tile <span className="font-bold text-xl">←</span> left or right <span className="font-bold text-xl">→</span> to spin it 90 degrees
                </p>
              </div>

              {/* Swap Section */}
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-lg bg-coral/20 flex items-center justify-center flex-shrink-0">
                    <svg className="w-7 h-7 text-coral" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                    </svg>
                  </div>
                  <h4 className="text-coral font-semibold text-lg">Swap Tiles</h4>
                </div>
                <p className="text-white leading-relaxed pl-1">
              Click a tile (it gets a red border), then click another tile to swap their places
                </p>
              </div>
            </div>

            {/* Checkbox and Close Button */}
            <div className="mt-8 space-y-4">
              <label className="flex items-center gap-3 cursor-pointer group">
                <input
                  type="checkbox"
                  className="w-5 h-5 rounded border-2 border-teal bg-navy-dark checked:bg-teal checked:border-teal cursor-pointer"
                  onChange={(e) => {
                    if (e.target.checked) {
                      handleCloseControls(true);
                    }
                  }}
                />
                <span className="text-teal group-hover:text-coral transition-colors">
                  Don't show this message again
                </span>
              </label>
              
              <button
                onClick={() => handleCloseControls(false)}
                className="w-full px-6 py-3 bg-teal text-navy-dark rounded-lg font-semibold hover:bg-teal/90 transition-all duration-200"
              >
                Got it!
              </button>
            </div>
          </div>
        </div>
      )}

      {/* How to Solve Modal */}
      {showHowToSolveModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
          <div className="bg-navy-light rounded-xl border-2 border-coral/30 p-6 max-w-md w-full shadow-2xl">
            <div className="text-center pb-4 border-b border-coral/20">
              <h3 className="text-coral font-bold text-2xl tracking-wide">HOW TO SOLVE</h3>
            </div>
            
            <div className="space-y-5 mt-6">
              {/* Step 1 */}
              <div className="space-y-2">
                <div className="flex items-start gap-3">
                  <span className="text-teal font-bold text-2xl flex-shrink-0">1.</span>
                  <div>
                    <p className="text-teal text-base font-semibold leading-relaxed">
                      Make the edges match​
                    </p>
                    <p className="text-white text-sm leading-relaxed mt-1">
                      Where two tiles touch their colors, shape, or patterns must be the same.
                    </p>
                  </div>
                </div>
              </div>

              {/* Step 2 */}
              <div className="space-y-2">
                <div className="flex items-start gap-3">
                  <span className="text-teal font-bold text-2xl flex-shrink-0">2.</span>
                  <div>
                    <p className="text-teal text-base font-semibold leading-relaxed">
                      Green glow | between pieces = correct!​
                    </p>
                    <p className="text-white text-sm leading-relaxed mt-1">
                      You'll see the space between pieces light up green when the edges match​!
                    </p>
                  </div>
                </div>
              </div>

              {/* Step 3 */}
              <div className="space-y-2">
                <div className="flex items-start gap-3">
                  <span className="text-teal font-bold text-2xl flex-shrink-0">3.</span>
                  <div>
                    <p className="text-teal text-base font-semibold leading-relaxed">
                      Get all edges glowing green.
                      </p>
                    <p className="text-white text-sm leading-relaxed mt-1">
                      Match every touching edge to solve the puzzle!
                    </p>
                  </div>
                </div>
              </div>

              {/* Important Note */}
              <div className="bg-coral/10 rounded-lg p-4 border border-coral/20">
                <p className="text-coral text-sm font-semibold mb-1">Remember:</p>
                <p className="text-white text-sm leading-relaxed">
                  It doesn't matter which way the picture faces. Only the matching edges matter!​
​                </p>
              </div>
            </div>

            {/* Checkbox and Close Button */}
            <div className="mt-8 space-y-4">
              <label className="flex items-center gap-3 cursor-pointer group">
                <input
                  type="checkbox"
                  className="w-5 h-5 rounded border-2 border-coral bg-navy-dark checked:bg-coral checked:border-coral cursor-pointer"
                  onChange={(e) => {
                    if (e.target.checked) {
                      handleCloseHowToSolve(true);
                    }
                  }}
                />
                <span className="text-teal group-hover:text-coral transition-colors">
                  Don't show this message again
                </span>
              </label>
              
              <button
                onClick={() => handleCloseHowToSolve(false)}
                className="w-full px-6 py-3 bg-coral text-white rounded-lg font-semibold hover:bg-coral/90 transition-all duration-200"
              >
                Got it!
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};