import React, { useState } from 'react';
import { RefreshCw, ArrowLeftRight } from 'lucide-react';
import { ModalShell } from '../common/ModalShell';

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
    <ModalShell
      onClose={handleClose}
      title="Controls"
      maxWidth="lg"
      bodyClassName="p-6 space-y-6"
      footer={
        <>
          {/* Checkbox */}
          <div className="flex items-center gap-3 mb-4">
            <input
              type="checkbox"
              id="dontShowAgain"
              checked={dontShowAgain}
              onChange={(e) => setDontShowAgain(e.target.checked)}
              className="w-5 h-5 rounded border-navy text-teal focus:ring-teal focus:ring-offset-navy-light cursor-pointer"
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
            className="w-full bg-gradient-to-r from-coral to-teal hover:from-coral-dark hover:to-teal-dark text-offwhite font-bold py-3 px-6 rounded-xl transition shadow-lg text-lg"
          >
            Got it!
          </button>
        </>
      }
    >
      {/* Rotate Tiles Section */}
      <div className="space-y-3">
        <div className="flex items-center gap-4">
          <div className="bg-teal/10 p-4 rounded-lg">
            <RefreshCw className="w-7 h-7 text-teal" />
          </div>
          <h3 className="text-xl font-semibold text-teal">
            Rotate Tiles
          </h3>
        </div>
        <p className="text-offwhite/80 text-base leading-relaxed pl-2">
          Drag any tile <span className="font-bold text-xl">←</span> left or right <span className="font-bold text-xl">→</span> to spin it 90 degrees
        </p>
      </div>

      {/* Swap Tiles Section */}
      <div className="space-y-3">
        <div className="flex items-center gap-4">
          <div className="bg-coral/10 p-4 rounded-lg">
            <ArrowLeftRight className="w-7 h-7 text-coral" />
          </div>
          <h3 className="text-xl font-semibold text-coral">
            Swap Tiles
          </h3>
        </div>
        <p className="text-offwhite/80 text-base leading-relaxed pl-2">
          Click a tile (it gets a coral border), then click another tile to swap their places
        </p>
      </div>
    </ModalShell>
  );
};

export default ControlsModal;