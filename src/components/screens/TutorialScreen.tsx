import React, { useState, useEffect } from 'react';

interface Tile {
  id: string;
  row: number;
  col: number;
  imageData: string;
  rotation: number;
  number: number;
}

interface TutorialScreenProps {
  onComplete: () => void;
}

export const TutorialScreen: React.FC<TutorialScreenProps> = ({ onComplete }) => {
  const [step, setStep] = useState(0);
  const [tiles, setTiles] = useState<Tile[]>([]);
  const [selectedTile, setSelectedTile] = useState<string | null>(null);
  const [swipeStart, setSwipeStart] = useState({ x: 0, y: 0, tileId: '' });
  const [dontShowAgain, setDontShowAgain] = useState(false);

  // Initialize tutorial tiles with numbered gradient tiles
  useEffect(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 600;
    canvas.height = 600;
    const ctx = canvas.getContext('2d');
    
    if (ctx) {
      // Create gradient
      const gradient = ctx.createLinearGradient(0, 0, 600, 600);
      gradient.addColorStop(0, '#FF6B6B');
      gradient.addColorStop(0.5, '#4ECDC4');
      gradient.addColorStop(1, '#45B7D1');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, 600, 600);

      const tileSize = 200;
      const newTiles: Tile[] = [];

      for (let row = 0; row < 3; row++) {
        for (let col = 0; col < 3; col++) {
          const tileCanvas = document.createElement('canvas');
          tileCanvas.width = tileSize;
          tileCanvas.height = tileSize;
          const tileCtx = tileCanvas.getContext('2d');
          
          if (tileCtx) {
            tileCtx.drawImage(canvas, col * tileSize, row * tileSize, tileSize, tileSize, 0, 0, tileSize, tileSize);
            
            // Add number overlay
            tileCtx.fillStyle = 'rgba(13, 27, 42, 0.6)';
            tileCtx.fillRect(0, 0, tileSize, tileSize);
            tileCtx.fillStyle = '#F4F4F4';
            tileCtx.font = 'bold 120px sans-serif';
            tileCtx.textAlign = 'center';
            tileCtx.textBaseline = 'middle';
            const number = row * 3 + col + 1;
            tileCtx.fillText(number.toString(), tileSize / 2, tileSize / 2);
            
            newTiles.push({
              id: `${row}-${col}`,
              row,
              col,
              imageData: tileCanvas.toDataURL(),
              rotation: 0,
              number
            });
          }
        }
      }
      
      setTiles(newTiles);
    }
  }, []);

  const handlePointerDown = (e: React.MouseEvent | React.TouchEvent, tileId: string) => {
    if (step !== 1 && step !== 3) return; // Only allow interaction on specific steps
    
    e.preventDefault();
    const x = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const y = 'touches' in e ? e.touches[0].clientY : e.clientY;
    setSwipeStart({ x, y, tileId });
  };

  const handlePointerUp = (e: React.MouseEvent | React.TouchEvent, tileId: string) => {
    if (step !== 1 && step !== 3) return;
    
    e.preventDefault();
    const x = 'changedTouches' in e ? e.changedTouches[0].clientX : e.clientX;
    const y = 'changedTouches' in e ? e.changedTouches[0].clientY : e.clientY;
    
    if (swipeStart.tileId === tileId) {
      const deltaX = x - swipeStart.x;
      const deltaY = y - swipeStart.y;
      
      // Step 1: Rotate tile 5 (center)
      if (step === 1 && tileId === '1-1') {
        if (Math.abs(deltaX) > 50 && Math.abs(deltaX) > Math.abs(deltaY) * 2) {
          const direction = deltaX > 0 ? -1 : 1;
          rotateTile(tileId, direction);
          markStepComplete(1);
        }
      }
      
      // Step 3: Swap tiles
      if (step === 3) {
        if (Math.abs(deltaX) < 15 && Math.abs(deltaY) < 15) {
          if (selectedTile === null && (tileId === '0-0' || tileId === '0-2')) {
            setSelectedTile(tileId);
          } else if (selectedTile && selectedTile !== tileId) {
            if ((selectedTile === '0-0' && tileId === '0-2') || (selectedTile === '0-2' && tileId === '0-0')) {
              swapTiles(selectedTile, tileId);
              markStepComplete(3);
            }
            setSelectedTile(null);
          } else if (selectedTile === tileId) {
            setSelectedTile(null);
          }
        }
      }
    }
    setSwipeStart({ x: 0, y: 0, tileId: '' });
  };

  const rotateTile = (tileId: string, direction: number) => {
    setTiles(prev => prev.map(t =>
      t.id === tileId ? { ...t, rotation: (t.rotation + direction + 4) % 4 } : t
    ));
  };

  const swapTiles = (tile1Id: string, tile2Id: string) => {
    setTiles(prev => {
      const tile1 = prev.find(t => t.id === tile1Id);
      const tile2 = prev.find(t => t.id === tile2Id);
      if (!tile1 || !tile2) return prev;
      
      return prev.map(t => {
        if (t.id === tile1Id) return { ...t, row: tile2.row, col: tile2.col };
        if (t.id === tile2Id) return { ...t, row: tile1.row, col: tile1.col };
        return t;
      });
    });
  };

  const markStepComplete = (stepNum: number) => {
    setTimeout(() => {
      setStep(stepNum + 1);
    }, 800);
  };

  const handleComplete = () => {
    if (dontShowAgain) {
      localStorage.setItem('tutorialCompleted', 'true');
    }
    onComplete();
  };

  const handleSkip = () => {
    if (window.confirm('Skip tutorial? You can access it later from the settings.')) {
      handleComplete();
    }
  };

  const steps = [
    {
      title: 'Welcome to TileSwappy!',
      description: "Let's learn how to play with this interactive tutorial.",
      action: 'Tap "Next" to begin',
      highlight: null
    },
    {
      title: 'Rotate Tiles',
      description: 'Drag the center tile (5) left or right to rotate it.',
      action: 'Try rotating tile 5 now!',
      highlight: '1-1'
    },
    {
      title: 'Great Job! 🎉',
      description: 'You rotated the tile! Tiles can face any direction.',
      action: 'Tap "Next" to continue',
      highlight: null
    },
    {
      title: 'Swap Tiles',
      description: 'Tap tile 1, then tap tile 3 to swap their positions.',
      action: 'Try swapping tiles 1 and 3!',
      highlight: ['0-0', '0-2']
    },
    {
      title: 'Excellent! ✨',
      description: 'You swapped the tiles! Use this to rearrange the puzzle.',
      action: 'Tap "Next" to continue',
      highlight: null
    },
    {
      title: 'Match the Edges',
      description: 'In the real game, make edges match between tiles. When they match correctly, a green glow appears!',
      action: 'Tap "Next" to continue',
      highlight: null
    },
    {
      title: "You're Ready! 🚀",
      description: 'Combine rotating and swapping to solve puzzles. Match all edges to win!',
      action: 'Start playing',
      highlight: null
    }
  ];

  const currentStep = steps[step];

  return (
    <div className="fixed inset-0 bg-navy overflow-y-auto z-[100]">
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <div className="max-w-2xl w-full">
          {/* Progress Bar */}
          <div className="mb-6">
            <div className="flex justify-between items-center mb-2">
              <span className="text-teal text-sm font-semibold">
                Step {step + 1} of {steps.length}
              </span>
              <button
                onClick={handleSkip}
                className="text-offwhite/60 hover:text-offwhite text-sm underline transition-colors"
              >
                Skip Tutorial
              </button>
            </div>
            <div className="h-2 bg-navy-light rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-teal to-coral transition-all duration-500"
                style={{ width: `${((step + 1) / steps.length) * 100}%` }}
              />
            </div>
          </div>

          {/* Instruction Card */}
          <div className="bg-navy-light/90 backdrop-blur-sm rounded-2xl p-6 mb-6 border-2 border-teal/30 shadow-2xl">
            <h2 className="text-2xl md:text-3xl font-bold text-teal mb-3">
              {currentStep.title}
            </h2>
            <p className="text-offwhite text-base md:text-lg mb-4 leading-relaxed">
              {currentStep.description}
            </p>
            <div className="bg-coral/20 border border-coral/40 rounded-lg p-3">
              <p className="text-coral font-semibold text-center">
                {currentStep.action}
              </p>
            </div>
          </div>

          {/* Interactive Game Board */}
          {step >= 1 && step <= 4 && (
            <div className="flex justify-center mb-6">
              <div className="relative">
                <div 
                  className="grid grid-cols-3 gap-1 bg-navy-light backdrop-blur-sm p-1.5 rounded-xl border-2 border-navy-dark"
                  style={{ 
                    width: 'min(80vw, 400px)', 
                    height: 'min(80vw, 400px)',
                  }}
                >
                  {[...tiles].sort((a, b) => {
                    if (a.row !== b.row) return a.row - b.row;
                    return a.col - b.col;
                  }).map((tile) => {
                    const isHighlighted = Array.isArray(currentStep.highlight) 
                      ? currentStep.highlight.includes(tile.id)
                      : currentStep.highlight === tile.id;
                    const isSelected = selectedTile === tile.id;

                    return (
                      <div key={tile.id} className="relative aspect-square">
                        <div
                          onMouseDown={(e) => handlePointerDown(e, tile.id)}
                          onMouseUp={(e) => handlePointerUp(e, tile.id)}
                          onTouchStart={(e) => handlePointerDown(e, tile.id)}
                          onTouchEnd={(e) => handlePointerUp(e, tile.id)}
                          className={`w-full h-full rounded-lg overflow-hidden cursor-pointer touch-none transition-all duration-300 ${
                            isSelected
                              ? 'border-4 border-coral shadow-coral-glow scale-105' 
                              : isHighlighted
                              ? 'border-4 border-teal shadow-teal-glow animate-pulse'
                              : 'border-2 border-navy-dark'
                          }`}
                          style={{ 
                            transform: `rotate(${tile.rotation * 90}deg) ${isSelected || isHighlighted ? 'scale(1.05)' : ''}`, 
                            transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)' 
                          }}
                        >
                          <img 
                            src={tile.imageData} 
                            alt={`Tile ${tile.number}`} 
                            className="w-full h-full object-cover" 
                            draggable={false} 
                          />
                        </div>

                        {/* Pointer indicator for highlighted tiles */}
                        {isHighlighted && (
                          <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 animate-bounce">
                            <div className="text-3xl">👇</div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Visual cues for actions */}
                {step === 1 && (
                  <div className="absolute top-1/2 left-0 right-0 transform -translate-y-1/2 flex justify-between px-4 pointer-events-none">
                    <div className="text-4xl animate-pulse">←</div>
                    <div className="text-4xl animate-pulse">→</div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Info Cards for Steps 5-6 */}
          {(step === 5 || step === 6) && (
            <div className="space-y-4 mb-6">
              {step === 5 && (
                <div className="bg-navy-light/90 rounded-xl p-4 border border-green-500/30">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center">
                      <svg className="w-6 h-6 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-bold text-green-400">Matching Edges</h3>
                  </div>
                  <p className="text-offwhite text-sm leading-relaxed">
                    When two tiles' edges match, you'll see a bright green glow between them. 
                    Your goal is to get all 12 edges glowing green!
                  </p>
                </div>
              )}

              {step === 6 && (
                <div className="bg-gradient-to-br from-coral/20 to-teal/20 rounded-xl p-6 border-2 border-teal/40">
                  <div className="text-center space-y-3">
                    <div className="text-5xl mb-2">🎯</div>
                    <h3 className="text-xl font-bold text-teal">Completed Puzzle Example</h3>
                    
                    {/* Mini solved puzzle visualization */}
                    <div className="bg-navy-dark/50 rounded-lg p-4 mb-3">
                      <div className="relative w-48 h-48 mx-auto">
                        <div className="grid grid-cols-3 gap-1 w-full h-full">
                          {/* Row 1 */}
                          <div className="bg-gradient-to-br from-purple-600 to-blue-600 rounded-tl border border-navy-dark"></div>
                          <div className="bg-gradient-to-br from-blue-600 to-teal-600 border border-navy-dark"></div>
                          <div className="bg-gradient-to-br from-teal-600 to-green-600 rounded-tr border border-navy-dark"></div>
                          {/* Row 2 */}
                          <div className="bg-gradient-to-br from-purple-500 to-blue-500 border border-navy-dark"></div>
                          <div className="bg-gradient-to-br from-blue-500 to-teal-500 border border-navy-dark"></div>
                          <div className="bg-gradient-to-br from-teal-500 to-green-500 border border-navy-dark"></div>
                          {/* Row 3 */}
                          <div className="bg-gradient-to-br from-purple-400 to-blue-400 rounded-bl border border-navy-dark"></div>
                          <div className="bg-gradient-to-br from-blue-400 to-teal-400 border border-navy-dark"></div>
                          <div className="bg-gradient-to-br from-teal-400 to-green-400 rounded-br border border-navy-dark"></div>
                        </div>
                        
                        {/* Green glowing edges - Vertical lines */}
                        <div className="absolute top-0 left-[33%] w-1 h-full bg-green-500 animate-pulse" style={{boxShadow: '0 0 15px rgba(34, 197, 94, 0.8), 0 0 30px rgba(34, 197, 94, 0.4)'}}></div>
                        <div className="absolute top-0 left-[66%] w-1 h-full bg-green-500 animate-pulse" style={{boxShadow: '0 0 15px rgba(34, 197, 94, 0.8), 0 0 30px rgba(34, 197, 94, 0.4)'}}></div>
                        
                        {/* Green glowing edges - Horizontal lines */}
                        <div className="absolute top-[33%] left-0 w-full h-1 bg-green-500 animate-pulse" style={{boxShadow: '0 0 15px rgba(34, 197, 94, 0.8), 0 0 30px rgba(34, 197, 94, 0.4)'}}></div>
                        <div className="absolute top-[66%] left-0 w-full h-1 bg-green-500 animate-pulse" style={{boxShadow: '0 0 15px rgba(34, 197, 94, 0.8), 0 0 30px rgba(34, 197, 94, 0.4)'}}></div>
                      </div>
                      <div className="mt-3 flex items-center justify-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                        <p className="text-green-400 text-xs font-semibold">All 12 edges glowing green!</p>
                        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                      </div>
                    </div>

                    <h3 className="text-xl font-bold text-teal">Key Tips</h3>
                    <ul className="text-offwhite text-sm space-y-2 text-left">
                      <li className="flex items-start gap-2">
                        <span className="text-teal mt-0.5">✓</span>
                        <span>The picture's orientation doesn't matter - only matching edges count</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-teal mt-0.5">✓</span>
                        <span>Use undo if you make a mistake</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-teal mt-0.5">✓</span>
                        <span>Start by finding corner pieces, then work on edges</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-teal mt-0.5">✓</span>
                        <span>Look for color patterns that should connect</span>
                      </li>
                    </ul>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="space-y-3">
            {(step === 0 || step === 2 || step === 4 || step === 5) && (
              <button
                onClick={() => setStep(step + 1)}
                className="w-full bg-gradient-to-r from-teal to-cyan-500 hover:from-teal/90 hover:to-cyan-500/90 text-navy font-bold py-4 px-6 rounded-xl transition-all shadow-lg transform hover:scale-105 text-lg"
              >
                Next →
              </button>
            )}

            {step === 6 && (
              <>
                <label className="flex items-center justify-center gap-3 cursor-pointer mb-2">
                  <input
                    type="checkbox"
                    checked={dontShowAgain}
                    onChange={(e) => setDontShowAgain(e.target.checked)}
                    className="w-5 h-5 rounded border-gray-400 text-teal focus:ring-teal cursor-pointer"
                  />
                  <span className="text-offwhite text-sm">
                    Don't show this tutorial again
                  </span>
                </label>

                <button
                  onClick={handleComplete}
                  className="w-full bg-gradient-to-r from-coral to-red-500 hover:from-coral/90 hover:to-red-500/90 text-white font-bold py-4 px-6 rounded-xl transition-all shadow-lg transform hover:scale-105 text-lg"
                >
                  Start Playing! 🎮
                </button>
              </>
            )}

            {step > 0 && step < 6 && (
              <button
                onClick={() => setStep(Math.max(0, step - 1))}
                className="w-full bg-navy-light/50 text-offwhite font-semibold py-3 px-6 rounded-xl hover:bg-navy-light transition-all"
              >
                ← Back
              </button>
            )}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes bounce {
          0%, 100% { transform: translateY(0) translateX(-50%); }
          50% { transform: translateY(-10px) translateX(-50%); }
        }
        
        .animate-bounce {
          animation: bounce 1s ease-in-out infinite;
        }

        .shadow-coral-glow {
          box-shadow: 0 0 20px rgba(255, 76, 76, 0.6);
        }

        .shadow-teal-glow {
          box-shadow: 0 0 20px rgba(46, 196, 182, 0.6);
        }
      `}</style>
    </div>
  );
};