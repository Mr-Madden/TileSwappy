import React, { useState } from 'react';

interface TutorialScreenProps {
  onComplete: () => void;
}

export const TutorialScreen: React.FC<TutorialScreenProps> = ({ onComplete }) => {
  const [dontShowAgain, setDontShowAgain] = useState(false);

  const handleComplete = () => {
    if (dontShowAgain) {
      localStorage.setItem('tutorialCompleted', 'true');
    }
    onComplete();
  };

  return (
    <div className="fixed inset-0 bg-navy overflow-y-auto z-[100]">
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="max-w-3xl w-full py-6">
          {/* Header */}
          <div className="text-center mb-6">
            <h1 className="text-3xl md:text-4xl font-bold text-cyan-400 mb-2">
              HOW TO PLAY
            </h1>
            <p className="text-offwhite text-base md:text-lg">
              Learn the basics in 30 seconds
            </p>
          </div>

          {/* Main Content Card */}
          <div className="bg-navy-light/30 backdrop-blur-sm rounded-2xl p-4 md:p-6 border border-navy-light space-y-5">
            
            {/* Rotate Tiles Section */}
            <div className="space-y-3">
              <div className="flex items-center gap-3 justify-center">
                <div className="bg-teal-900/50 p-2 rounded-lg">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#2EC4B6" strokeWidth="2">
                    <polyline points="23 4 23 10 17 10"></polyline>
                    <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"></path>
                  </svg>
                </div>
                <h2 className="text-xl md:text-2xl font-bold text-cyan-400">
                  Rotate Tiles
                </h2>
              </div>
              
              {/* Rotation Animations */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-navy-dark/50 rounded-xl p-3 border border-navy-light">
                  <img 
                    src="/animations/rotate-left-demo.svg" 
                    alt="Rotate left demo" 
                    className="w-full h-auto"
                  />
                </div>
                <div className="bg-navy-dark/50 rounded-xl p-3 border border-navy-light">
                  <img 
                    src="/animations/rotate-right-demo.svg" 
                    alt="Rotate right demo" 
                    className="w-full h-auto"
                  />
                </div>
              </div>
              
              <p className="text-offwhite text-center text-base md:text-lg leading-relaxed">
                Drag any tile <span className="font-bold text-xl md:text-2xl text-cyan-400">←</span> left or right <span className="font-bold text-xl md:text-2xl text-cyan-400">→</span> to spin it 90 degrees
              </p>
            </div>

            {/* Divider */}
            <div className="border-t border-navy-light"></div>

            {/* Swap Tiles Section */}
            <div className="space-y-3">
              <div className="flex items-center gap-3 justify-center">
                <div className="bg-red-900/50 p-2 rounded-lg">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#FC8181" strokeWidth="2">
                    <path d="M16 3h5v5M4 20L21 3M21 16v5h-5M15 15l6 6M4 4l5 5"></path>
                  </svg>
                </div>
                <h2 className="text-xl md:text-2xl font-bold text-red-400">
                  Swap Tiles
                </h2>
              </div>
              
              {/* Swap Animations */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-navy-dark/50 rounded-xl p-3 border border-navy-light">
                  <img 
                    src="/animations/select-tile-demo.svg" 
                    alt="Select tile demo" 
                    className="w-full h-auto"
                  />
                </div>
                <div className="bg-navy-dark/50 rounded-xl p-3 border border-navy-light">
                  <img 
                    src="/animations/swap-tiles-demo.svg" 
                    alt="Swap tiles demo" 
                    className="w-full h-auto"
                  />
                </div>
              </div>
              
              <p className="text-offwhite text-center text-base md:text-lg leading-relaxed">
                Click a tile (it gets a <span className="font-bold text-red-400">red border</span>), then click another tile to swap their places
              </p>
            </div>

            {/* Divider */}
            <div className="border-t border-navy-light"></div>

            {/* Goal Section */}
            <div className="space-y-3">
              <div className="flex items-center gap-3 justify-center">
                <div className="bg-green-900/50 p-2 rounded-lg">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="2">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                    <polyline points="22 4 12 14.01 9 11.01"></polyline>
                  </svg>
                </div>
                <h2 className="text-xl md:text-2xl font-bold text-green-400">
                  Match All Edges
                </h2>
              </div>
              
              <div className="bg-navy-dark/50 rounded-xl p-3 border border-green-500/30 text-center">
                <p className="text-offwhite text-base md:text-lg leading-relaxed mb-2">
                  When edges match correctly, a <span className="font-bold text-green-400">green glow</span> appears between tiles
                </p>
                <p className="text-teal text-sm md:text-base">
                  ✨ Match every touching edge to win! ✨
                </p>
              </div>
            </div>

            {/* Important Note */}
            <div className="bg-coral/10 border border-coral/30 rounded-xl p-3">
              <p className="text-coral font-semibold text-center text-sm md:text-base mb-1">
                🎯 Important:
              </p>
              <p className="text-offwhite text-center text-sm md:text-base">
                The final image orientation doesn't matter. Only edge matches count!
              </p>
            </div>

            {/* Don't Show Again Checkbox */}
            <div className="flex items-center justify-center gap-3 pt-1">
              <input
                type="checkbox"
                id="tutorialDontShow"
                checked={dontShowAgain}
                onChange={(e) => setDontShowAgain(e.target.checked)}
                className="w-4 h-4 md:w-5 md:h-5 rounded border-gray-400 text-cyan-400 focus:ring-cyan-400 cursor-pointer"
              />
              <label
                htmlFor="tutorialDontShow"
                className="text-cyan-400 text-xs md:text-sm cursor-pointer select-none"
              >
                Don't show this tutorial again
              </label>
            </div>

            {/* Start Playing Button */}
            <button
              onClick={handleComplete}
              className="w-full bg-gradient-to-r from-cyan-400 to-teal-500 hover:from-cyan-500 hover:to-teal-600 text-navy font-bold py-3 md:py-4 px-6 md:px-8 rounded-xl transition-all text-lg md:text-xl shadow-lg transform hover:scale-105"
            >
              Let's Play! 🎮
            </button>
          </div>

          {/* Skip Link */}
          <div className="text-center mt-4">
            <button
              onClick={handleComplete}
              className="text-teal hover:text-cyan-400 text-xs md:text-sm underline transition-colors"
            >
              Skip tutorial (you can access it later)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};