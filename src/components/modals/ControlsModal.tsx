import React, { useState } from 'react';
import { RefreshCw, ArrowLeftRight } from 'lucide-react';

interface ControlsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ControlsModal: React.FC<ControlsModalProps> = ({ isOpen, onClose }) => {
  const [dontShowAgain, setDontShowAgain] = useState(false);

  const handleClose = () => {
    if (dontShowAgain) {
      localStorage.setItem('hideControlsModal', 'true');
    }
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 rounded-lg max-w-lg w-full shadow-xl">
        {/* Header */}
        <div className="bg-slate-900 rounded-t-lg py-6 px-6">
          <h2 className="text-3xl font-bold text-teal text-center">
            CONTROLS
          </h2>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Rotate Tiles Section */}
          <div className="space-y-3">
            <div className="flex items-center gap-4">
              <div className="bg-teal-900/50 p-4 rounded-lg">
                <RefreshCw className="w-7 h-7 text-teal" />
              </div>
              <h3 className="text-xl font-semibold text-teal">
                Rotate Tiles
              </h3>
            </div>
            <p className="text-gray-200 text-base leading-relaxed pl-2">
              Drag any tile <span className="font-bold text-xl">←</span> left or right <span className="font-bold text-xl">→</span> to spin it 90 degrees
            </p>
          </div>

          {/* Swap Tiles Section */}
          <div className="space-y-3">
            <div className="flex items-center gap-4">
              <div className="bg-red-900/50 p-4 rounded-lg">
                <ArrowLeftRight className="w-7 h-7 text-red-400" />
              </div>
              <h3 className="text-xl font-semibold text-red-400">
                Swap Tiles
              </h3>
            </div>
            <p className="text-gray-200 text-base leading-relaxed pl-2">
              Click a tile (it gets a red border), then click another tile to swap their places
            </p>
          </div>

          {/* Checkbox */}
          <div className="flex items-center gap-3 pt-4">
            <input
              type="checkbox"
              id="dontShowAgain"
              checked={dontShowAgain}
              onChange={(e) => setDontShowAgain(e.target.checked)}
              className="w-5 h-5 rounded border-gray-400 text-teal focus:ring-teal focus:ring-offset-slate-800 cursor-pointer"
            />
            <label
              htmlFor="dontShowAgain"
              className="text-teal text-sm cursor-pointer select-none"
            >
              Don't show this message again
            </label>
          </div>

          {/* Got it Button */}
          <button
            onClick={handleClose}
            className="w-full bg-teal hover:bg-teal-200 text-slate-900 font-bold py-3 px-6 rounded-lg transition-colors text-lg"
          >
            Got it!
          </button>
        </div>
      </div>
    </div>
  );
};

export default ControlsModal;