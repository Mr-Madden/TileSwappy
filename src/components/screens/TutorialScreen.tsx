import React, { useState, useEffect } from 'react';
import { Check, Move } from 'lucide-react';
import { useTileDragGesture } from '../../hooks/useTileDragGesture';

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

// Steps where the mini board actually responds to input -- everything
// else (welcome, static info) leaves gestures inert.
const INTERACTIVE_STEPS = new Set([1, 2, 3]);

// Brief auto-advancing toast after each interactive step succeeds, instead
// of a whole separate "Great Job!"/"Excellent!"/"Nice Move!" step the
// player had to tap "Next" on -- same information, half the taps. Keyed by
// the step index that was just completed.
const TOAST_MESSAGES: Record<number, string> = {
  1: 'Great job! 🎉 Tiles can face any direction.',
  2: 'Excellent! ✨ Use this to rearrange the puzzle.',
  3: 'Nice move! 🖐️ Works everywhere — use whichever feels faster.'
};

// Small celebratory burst for the final step -- theme-variable colors so it
// re-themes correctly, same reasoning as the mock solved-puzzle grid below.
const TUTORIAL_CONFETTI = [
  { left: '20%', size: 7, delay: '0s', color: 'rgb(var(--color-coral))' },
  { left: '32%', size: 5, delay: '0.08s', color: 'rgb(var(--color-teal))' },
  { left: '44%', size: 6, delay: '0.03s', color: 'rgb(var(--color-gold))' },
  { left: '56%', size: 5, delay: '0.12s', color: 'rgb(var(--color-violet))' },
  { left: '68%', size: 7, delay: '0.05s', color: 'rgb(var(--color-coral))' },
  { left: '80%', size: 6, delay: '0.1s', color: 'rgb(var(--color-teal))' },
  { left: '26%', size: 5, delay: '0.16s', color: 'rgb(var(--color-gold))' },
  { left: '74%', size: 5, delay: '0.14s', color: 'rgb(var(--color-violet))' }
];

export const TutorialScreen: React.FC<TutorialScreenProps> = ({ onComplete }) => {
  const [step, setStep] = useState(0);
  const [tiles, setTiles] = useState<Tile[]>([]);
  const [selectedTile, setSelectedTile] = useState<string | null>(null);
  const [dontShowAgain, setDontShowAgain] = useState(false);
  const [showSkipConfirm, setShowSkipConfirm] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

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

  // Same gesture recognition the real GameBoard uses (via the shared
  // useTileDragGesture hook) -- flick to rotate, tap to select/swap,
  // hold-and-move to drag-and-drop -- so the tutorial actually teaches
  // the controls players will use, instead of a second implementation
  // that could quietly drift out of sync with the real game.
  const { dragState, hoverTargetId, getTileHandlers, tileAttr } = useTileDragGesture({
    onTap: (tileId) => {
      if (step !== 2) return;
      if (selectedTile === null && (tileId === '0-0' || tileId === '0-2')) {
        setSelectedTile(tileId);
      } else if (selectedTile && selectedTile !== tileId) {
        if ((selectedTile === '0-0' && tileId === '0-2') || (selectedTile === '0-2' && tileId === '0-0')) {
          swapTiles(selectedTile, tileId);
          markStepComplete(2);
        }
        setSelectedTile(null);
      } else if (selectedTile === tileId) {
        setSelectedTile(null);
      }
    },
    onRotate: (tileId, direction) => {
      if (step !== 1 || tileId !== '1-1') return;
      rotateTile(tileId, direction);
      markStepComplete(1);
    },
    onDrop: (draggedTileId, targetTileId) => {
      if (step !== 3 || !targetTileId) return;
      if ((draggedTileId === '2-0' && targetTileId === '2-2') || (draggedTileId === '2-2' && targetTileId === '2-0')) {
        swapTiles(draggedTileId, targetTileId);
        markStepComplete(3);
      }
    }
  });

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
    setToast(TOAST_MESSAGES[stepNum] ?? null);
    setTimeout(() => {
      setToast(null);
      setStep(stepNum + 1);
    }, 1400);
  };

  const handleComplete = () => {
    if (dontShowAgain) {
      localStorage.setItem('tutorialCompleted', 'true');
    }
    onComplete();
  };

  const handleSkip = () => {
    setShowSkipConfirm(true);
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
      description: 'Quickly flick the center tile (5) left or right to rotate it. A fast flick — not a slow drag.',
      action: 'Try flicking tile 5 now!',
      highlight: '1-1'
    },
    {
      title: 'Swap Tiles',
      description: 'Tap tile 1, then tap tile 3 to swap their positions.',
      action: 'Try swapping tiles 1 and 3!',
      highlight: ['0-0', '0-2']
    },
    {
      title: 'Drag & Drop',
      description: 'Prefer dragging? Press and hold tile 7, then drag it onto tile 9 to swap them the same way.',
      action: 'Try dragging tile 7 onto tile 9!',
      highlight: ['2-0', '2-2']
    },
    {
      title: 'Match the Edges',
      description: 'In the real game, make edges match between tiles. When they match correctly, a green glow appears!',
      action: 'Tap "Next" to continue',
      highlight: null
    },
    {
      title: "You're Ready! 🚀",
      description: 'Combine flicking, tapping, and dragging to solve puzzles. Match all edges to win!',
      action: 'Start playing',
      highlight: null
    }
  ];

  const currentStep = steps[step];

  return (
    <div className="fixed inset-0 bg-navy overflow-y-auto z-[100]">
      {toast && (
        <div
          key={toast}
          className="fixed top-6 left-1/2 z-[120] bg-navy-light border-2 border-teal shadow-2xl rounded-xl px-6 py-3 max-w-[90vw] tutorial-toast"
        >
          <p className="text-teal font-bold text-center text-sm md:text-base">{toast}</p>
        </div>
      )}
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
          <div
            key={step}
            className="tutorial-step-enter bg-navy-light/90 backdrop-blur-sm rounded-2xl p-6 mb-6 border-2 border-teal/30 shadow-2xl"
          >
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
          {step >= 1 && step <= 3 && (
            <div className="flex justify-center mb-6">
              <div className="relative">
                <div
                  className="grid grid-cols-3 gap-1 bg-navy-light backdrop-blur-sm p-1.5 rounded-xl border-2 border-navy-dark relative"
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
                    const isBeingDragged = INTERACTIVE_STEPS.has(step) && dragState?.tileId === tile.id;
                    const isHoverTarget = INTERACTIVE_STEPS.has(step) && hoverTargetId === tile.id;

                    return (
                      <div key={tile.id} className="relative aspect-square">
                        <div
                          {...(INTERACTIVE_STEPS.has(step) ? { [tileAttr]: tile.id, ...getTileHandlers(tile.id) } : {})}
                          className={`w-full h-full rounded-lg overflow-hidden cursor-pointer touch-none transition-all duration-300 ${
                            isSelected
                              ? 'border-4 border-coral shadow-coral-glow scale-105'
                              : isHoverTarget
                              ? 'border-4 border-teal shadow-teal-glow'
                              : isHighlighted
                              ? 'border-4 border-teal shadow-teal-glow animate-pulse'
                              : 'border-2 border-navy-dark'
                          } ${isBeingDragged ? 'opacity-30' : ''}`}
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
                            <div className="text-3xl">{step === 3 ? '✋' : '👇'}</div>
                          </div>
                        )}
                      </div>
                    );
                  })}

                  {/* Floating drag preview -- mirrors GameBoard's own
                      overlay so the tutorial demonstrates the exact
                      visual the real drag-and-drop gesture produces. */}
                  {dragState && (() => {
                    const dragged = tiles.find(t => t.id === dragState.tileId);
                    if (!dragged) return null;
                    return (
                      <div
                        className="absolute pointer-events-none z-30"
                        style={{
                          left: `${(dragged.col / 3) * 100}%`,
                          top: `${(dragged.row / 3) * 100}%`,
                          width: `${(1 / 3) * 100}%`,
                          height: `${(1 / 3) * 100}%`,
                          padding: '2px',
                          transform: `translate(${dragState.dx}px, ${dragState.dy}px)`
                        }}
                      >
                        <div
                          className="w-full h-full rounded-lg overflow-hidden ring-2 ring-teal"
                          style={{
                            transform: `rotate(${dragged.rotation * 90}deg) scale(1.08)`,
                            boxShadow: '0 12px 24px rgba(0,0,0,0.5)'
                          }}
                        >
                          <img src={dragged.imageData} alt="" className="w-full h-full object-cover" draggable={false} />
                        </div>
                      </div>
                    );
                  })()}
                </div>

                {/* Visual cues for actions */}
                {step === 1 && (
                  <div className="absolute top-1/2 left-0 right-0 transform -translate-y-1/2 flex justify-between px-4 pointer-events-none">
                    <div className="text-4xl animate-pulse">←</div>
                    <div className="text-4xl animate-pulse">→</div>
                  </div>
                )}
                {step === 3 && (
                  <div className="absolute -bottom-10 left-0 right-0 flex items-center justify-center gap-2 pointer-events-none">
                    <Move size={18} className="text-teal animate-pulse" />
                    <span className="text-teal text-xs font-semibold">Press, hold, then drag</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Info Cards for Steps 4-5 */}
          {(step === 4 || step === 5) && (
            <div key={step} className="tutorial-step-enter space-y-4 mb-6">
              {step === 4 && (
                <div className="bg-navy-light/90 rounded-xl p-4 border border-match/30">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-12 h-12 bg-match/20 rounded-lg flex items-center justify-center">
                      <Check className="w-6 h-6 text-match" strokeWidth={3} />
                    </div>
                    <h3 className="text-lg font-bold text-match">Matching Edges</h3>
                  </div>
                  <p className="text-offwhite text-sm leading-relaxed">
                    When two tiles' edges match, you'll see a bright green glow between them.
                    Your goal is to get all 12 edges glowing green!
                  </p>
                </div>
              )}

              {step === 5 && (
                <div className="bg-gradient-to-br from-coral/20 to-teal/20 rounded-xl p-6 border-2 border-teal/40">
                  <div className="text-center space-y-3">
                    <div className="relative inline-block mb-2">
                      {/* Small celebratory burst -- plays once per entry into
                          this step (remounts with the step===5 block itself,
                          same key={step} pattern the surrounding card already
                          uses). Deliberately lighter than the real game's
                          full completion overlay (App.tsx): this is a screen
                          most players click past quickly, not the actual win
                          moment. */}
                      <div className="absolute inset-0 pointer-events-none">
                        {TUTORIAL_CONFETTI.map((c, i) => (
                          <div
                            key={i}
                            className="absolute rounded-full tutorial-confetti"
                            style={{
                              left: c.left, top: '50%', width: c.size, height: c.size,
                              background: c.color, animationDelay: c.delay
                            }}
                          />
                        ))}
                      </div>
                      <div className="text-5xl tutorial-bounce-in">🎯</div>
                    </div>
                    <h3 className="text-xl font-bold text-teal">This Is What Solved Looks Like</h3>

                    {/* Mini solved puzzle visualization -- uses the app's own
                        theme variables (violet/coral/teal/gold, darkening
                        toward the top row) instead of arbitrary purple/blue/
                        green, so it actually re-themes along with everything
                        else instead of looking stuck on one fixed palette. */}
                    <div className="bg-navy-dark/50 rounded-lg p-4 mb-3">
                      <div className="relative w-48 h-48 mx-auto">
                        <div className="grid grid-cols-3 gap-1 w-full h-full">
                          {/* Row 1 -- dark variant */}
                          <div className="rounded-tl border border-navy-dark" style={{ background: 'linear-gradient(135deg, rgb(var(--color-violet-dark)), rgb(var(--color-coral-dark)))' }}></div>
                          <div className="border border-navy-dark" style={{ background: 'linear-gradient(135deg, rgb(var(--color-coral-dark)), rgb(var(--color-teal-dark)))' }}></div>
                          <div className="rounded-tr border border-navy-dark" style={{ background: 'linear-gradient(135deg, rgb(var(--color-teal-dark)), rgb(var(--color-gold-dark)))' }}></div>
                          {/* Row 2 -- default variant */}
                          <div className="border border-navy-dark" style={{ background: 'linear-gradient(135deg, rgb(var(--color-violet)), rgb(var(--color-coral)))' }}></div>
                          <div className="border border-navy-dark" style={{ background: 'linear-gradient(135deg, rgb(var(--color-coral)), rgb(var(--color-teal)))' }}></div>
                          <div className="border border-navy-dark" style={{ background: 'linear-gradient(135deg, rgb(var(--color-teal)), rgb(var(--color-gold)))' }}></div>
                          {/* Row 3 -- light variant */}
                          <div className="rounded-bl border border-navy-dark" style={{ background: 'linear-gradient(135deg, rgb(var(--color-violet-light)), rgb(var(--color-coral-light)))' }}></div>
                          <div className="border border-navy-dark" style={{ background: 'linear-gradient(135deg, rgb(var(--color-coral-light)), rgb(var(--color-teal-light)))' }}></div>
                          <div className="rounded-br border border-navy-dark" style={{ background: 'linear-gradient(135deg, rgb(var(--color-teal-light)), rgb(var(--color-gold-light)))' }}></div>
                        </div>

                        {/* Match-glow edges - Vertical lines */}
                        <div className="absolute top-0 left-[33%] w-1 h-full bg-match animate-pulse" style={{boxShadow: '0 0 15px rgba(34, 197, 94, 0.8), 0 0 30px rgba(34, 197, 94, 0.4)'}}></div>
                        <div className="absolute top-0 left-[66%] w-1 h-full bg-match animate-pulse" style={{boxShadow: '0 0 15px rgba(34, 197, 94, 0.8), 0 0 30px rgba(34, 197, 94, 0.4)'}}></div>

                        {/* Match-glow edges - Horizontal lines */}
                        <div className="absolute top-[33%] left-0 w-full h-1 bg-match animate-pulse" style={{boxShadow: '0 0 15px rgba(34, 197, 94, 0.8), 0 0 30px rgba(34, 197, 94, 0.4)'}}></div>
                        <div className="absolute top-[66%] left-0 w-full h-1 bg-match animate-pulse" style={{boxShadow: '0 0 15px rgba(34, 197, 94, 0.8), 0 0 30px rgba(34, 197, 94, 0.4)'}}></div>
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
            {(step === 0 || step === 4) && (
              <button
                onClick={() => setStep(step + 1)}
                className="w-full bg-gradient-to-r from-teal to-teal-dark hover:from-teal-dark hover:to-teal text-navy font-bold py-4 px-6 rounded-xl transition-all shadow-lg transform hover:scale-105 text-lg"
              >
                Next →
              </button>
            )}

            {step === 5 && (
              <>
                <label className="flex items-center justify-center gap-3 cursor-pointer mb-2">
                  <input
                    type="checkbox"
                    checked={dontShowAgain}
                    onChange={(e) => setDontShowAgain(e.target.checked)}
                    className="w-5 h-5 rounded border-navy-dark text-teal focus:ring-teal cursor-pointer"
                  />
                  <span className="text-offwhite text-sm">
                    Don't show this tutorial again
                  </span>
                </label>

                <button
                  onClick={handleComplete}
                  className="w-full bg-gradient-to-r from-coral to-teal hover:from-coral-dark hover:to-teal-dark text-offwhite font-bold py-4 px-6 rounded-xl transition-all shadow-lg transform hover:scale-105 text-lg"
                >
                  Start Playing! 🎮
                </button>
              </>
            )}

            {step > 0 && step < 5 && (
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

      {showSkipConfirm && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[110] flex items-center justify-center p-4">
          <div className="tutorial-step-enter bg-navy-light rounded-2xl w-full max-w-sm shadow-2xl border-2 border-navy-dark p-6">
            <h3 className="text-xl font-bold text-offwhite mb-2">Skip tutorial?</h3>
            <p className="text-offwhite/70 text-sm mb-6">
              You can start it again anytime from the Tutorial button on the home screen.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowSkipConfirm(false)}
                className="flex-1 bg-navy-dark text-offwhite font-semibold py-2.5 px-4 rounded-xl hover:bg-navy transition-all"
              >
                Keep Learning
              </button>
              <button
                onClick={handleComplete}
                className="flex-1 bg-coral/20 border border-coral/40 text-coral font-semibold py-2.5 px-4 rounded-xl hover:bg-coral/30 transition-all"
              >
                Skip
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes bounce {
          0%, 100% { transform: translateY(0) translateX(-50%); }
          50% { transform: translateY(-10px) translateX(-50%); }
        }

        .animate-bounce {
          animation: bounce 1s ease-in-out infinite;
        }

        @keyframes tutorial-step-enter {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .tutorial-step-enter {
          animation: tutorial-step-enter 0.3s ease-out;
        }

        @keyframes tutorial-confetti-burst {
          0% { transform: translate(-50%, 0) scale(0.6); opacity: 1; }
          100% { transform: translate(-50%, -60px) scale(1); opacity: 0; }
        }

        .tutorial-confetti {
          animation: tutorial-confetti-burst 0.9s ease-out forwards;
        }

        @keyframes tutorial-bounce-in {
          0% { transform: scale(0.3); opacity: 0; }
          60% { transform: scale(1.15); opacity: 1; }
          100% { transform: scale(1); opacity: 1; }
        }

        .tutorial-bounce-in {
          animation: tutorial-bounce-in 0.5s cubic-bezier(0.68, -0.55, 0.265, 1.55);
        }

        /* Pop in, hold, fade out -- matches markStepComplete's 1400ms timer
           so the toast disappears right as the step advances underneath it. */
        @keyframes tutorial-toast-inout {
          0% { opacity: 0; transform: translate(-50%, -12px) scale(0.9); }
          12% { opacity: 1; transform: translate(-50%, 0) scale(1); }
          82% { opacity: 1; transform: translate(-50%, 0) scale(1); }
          100% { opacity: 0; transform: translate(-50%, -8px) scale(0.95); }
        }

        .tutorial-toast {
          animation: tutorial-toast-inout 1.4s ease-in-out forwards;
        }

        @media (prefers-reduced-motion: reduce) {
          .tutorial-step-enter,
          .tutorial-confetti,
          .tutorial-bounce-in,
          .tutorial-toast {
            animation: none;
          }
        }
      `}</style>
    </div>
  );
};