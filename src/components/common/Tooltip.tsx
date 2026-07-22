// src/components/common/Tooltip.tsx
import React from 'react';

interface TooltipProps {
  label: string;
  position?: 'top' | 'bottom';
  children: React.ReactNode;
}

// A hover/focus-triggered label for icon-only buttons (Home, the
// hamburger menu, How to Play's "i") -- those lost their visible text
// when the gameboard's top bar got compacted down to icons-only to make
// more room for the board itself, so there's nothing left on screen
// identifying what they do except this. group-focus-within (not just
// group-hover) so keyboard users tabbing through get the same label,
// not just mouse users.
export const Tooltip: React.FC<TooltipProps> = ({ label, position = 'bottom', children }) => (
  <div className="relative inline-flex group">
    {children}
    <div
      role="tooltip"
      className={`pointer-events-none absolute left-1/2 -translate-x-1/2 ${
        position === 'bottom' ? 'top-full mt-2' : 'bottom-full mb-2'
      } whitespace-nowrap rounded-md bg-navy-dark border border-navy-light px-2 py-1 text-[11px] text-offwhite opacity-0 scale-95 transition-all duration-150 group-hover:opacity-100 group-hover:scale-100 group-focus-within:opacity-100 group-focus-within:scale-100 z-50`}
    >
      {label}
    </div>
  </div>
);

export default Tooltip;
