import React from 'react';
import { X } from 'lucide-react';

interface ModalShellProps {
  onClose: () => void;
  title: string;
  // Duck-typed rather than lucide's own `LucideIcon` export to avoid
  // depending on an internal type name -- any lucide icon component
  // satisfies this shape.
  titleIcon?: React.ComponentType<{ className?: string; size?: number }>;
  subtitle?: string;
  maxWidth?: 'md' | 'lg' | '2xl';
  bodyClassName?: string;
  // Rendered as its own flex-shrink-0 row between the header and the
  // scrollable body -- only PlayerStatsModal's tabs need this today.
  headerExtra?: React.ReactNode;
  footer?: React.ReactNode;
  children: React.ReactNode;
}

const MAX_WIDTH_CLASSES: Record<NonNullable<ModalShellProps['maxWidth']>, string> = {
  md: 'max-w-md',
  lg: 'max-w-lg',
  '2xl': 'max-w-2xl',
};

// Shared modal chrome (backdrop, shell, header, close button, optional
// footer) -- extracted after an audit found the 5 modals in this
// directory had each independently drifted on backdrop opacity, header
// background, close-button color, and shell border. This is the one
// place that drift now has to happen deliberately, not by accident.
export const ModalShell: React.FC<ModalShellProps> = ({
  onClose,
  title,
  titleIcon: TitleIcon,
  subtitle,
  maxWidth = 'lg',
  bodyClassName = 'p-6',
  headerExtra,
  footer,
  children,
}) => {
  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div
        className={`bg-navy-light rounded-2xl w-full ${MAX_WIDTH_CLASSES[maxWidth]} max-h-[90vh] shadow-2xl border-2 border-navy-dark flex flex-col`}
      >
        <div className="bg-navy-dark px-6 py-4 flex items-center justify-between rounded-t-2xl border-b border-navy flex-shrink-0">
          <div>
            <h2 className="text-2xl font-bold text-offwhite flex items-center gap-2">
              {TitleIcon && <TitleIcon className="text-coral" size={24} />}
              {title}
            </h2>
            {subtitle && <p className="text-sm text-teal">{subtitle}</p>}
          </div>
          <button onClick={onClose} className="text-offwhite/60 hover:text-offwhite transition flex-shrink-0">
            <X size={24} />
          </button>
        </div>
        {headerExtra}
        <div className={`overflow-y-auto flex-1 ${bodyClassName}`}>{children}</div>
        {footer && <div className="px-6 py-4 border-t border-navy flex-shrink-0">{footer}</div>}
      </div>
    </div>
  );
};
