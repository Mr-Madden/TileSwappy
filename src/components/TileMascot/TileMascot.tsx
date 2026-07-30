import React, { useState, useRef } from 'react';
import './TileMascot.css';

export type MascotExpression =
  | 'happy'
  | 'excited'
  | 'wink'
  | 'sleepy'
  | 'surprised'
  | 'thinking'
  | 'laughing'
  | 'love'
  | 'confused';

// Written out as literal class names (not interpolated) so Tailwind's
// content scanner -- which greps source files for whole class strings,
// not runtime values -- can actually find and generate them.
const BODY_COLOR_CLASS: Record<'coral' | 'teal' | 'gold' | 'violet', string> = {
  coral: 'bg-coral',
  teal: 'bg-teal',
  gold: 'bg-gold',
  violet: 'bg-violet'
};

interface TileMascotProps {
  size?: number;
  expression?: MascotExpression;
  /** One of the app's themed color tokens (bg-coral, bg-teal, ...) so Tilo re-skins with the active theme instead of clashing with it. */
  color?: 'coral' | 'teal' | 'gold' | 'violet';
  bounce?: boolean;
  className?: string;
  /** Wherever Tilo shows up, touching him should feel alive -- pass this
      to make him clickable, play a little squash-and-stretch "poke", and
      briefly flash a reaction expression before settling back. */
  onClick?: () => void;
}

// Tilo is built from the same rounded-tile-with-curved-eye-marks motif as
// the "Tile 2" face already hiding in TileSwappyLogo -- rather than
// invent a new character style, this just gives that existing face a
// body, a mouth, and a few expressions so it can act as the game's
// narrator/mascot across the app.
export const TileMascot: React.FC<TileMascotProps> = ({
  size = 96,
  expression = 'happy',
  color = 'coral',
  bounce = true,
  className = '',
  onClick
}) => {
  const [poked, setPoked] = useState(false);
  const pokeTimeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  // A quick surprised flash on top of whatever expression was passed in
  // -- reads as "oh, you got me!" rather than just a generic bounce, and
  // reverts on its own so callers don't have to manage it.
  const effectiveExpression: MascotExpression = poked ? 'surprised' : expression;

  const handleClick = () => {
    if (!onClick) return;
    onClick();
    setPoked(true);
    clearTimeout(pokeTimeoutRef.current);
    pokeTimeoutRef.current = setTimeout(() => setPoked(false), 350);
  };

  // The logo's mark is ~2.5x taller than wide (tileSize*0.08 by
  // tileSize*0.2) -- a near-square box with border-radius:999px just
  // reads as a blob, not a curve, so the arc eyes need that same thin,
  // elongated ratio to actually look like closed/smiling eyes.
  const arcW = size * 0.045;
  const arcH = size * 0.2;
  const roundEye = size * 0.11;
  const mouthW = size * 0.32;

  const renderEye = (side: 'left' | 'right') => {
    const rot = side === 'left' ? -1 : 1;

    if (effectiveExpression === 'love') {
      return (
        <div
          className="mascot-eye mascot-eye--heart"
          style={{ ['--heart-size' as any]: `${roundEye * 0.8}px` }}
        />
      );
    }
    if (effectiveExpression === 'laughing') {
      // Even bigger/more sharply curved than excited -- eyes squeezed
      // shut laughing so hard rather than just a happy squint.
      return (
        <div
          className="mascot-eye mascot-eye--arc"
          style={{ width: arcW * 1.3, height: arcH * 1.4, transform: `rotate(${rot * 25}deg)` }}
        />
      );
    }
    if (effectiveExpression === 'confused' && side === 'right') {
      // One eye wide, one normal -- reads as puzzled/skeptical rather
      // than the symmetric wink (which uses this same shape both sides
      // would look identical, hence the asymmetry here).
      return <div className="mascot-eye mascot-eye--round" style={{ width: roundEye * 1.15, height: roundEye * 1.15 }} />;
    }
    if (effectiveExpression === 'surprised') {
      return <div className="mascot-eye mascot-eye--round" style={{ width: roundEye * 1.3, height: roundEye * 1.3 }} />;
    }
    if (effectiveExpression === 'thinking' && side === 'right') {
      // Looking off to the side -- "pondering" rather than at rest.
      return (
        <div
          className="mascot-eye mascot-eye--round"
          style={{ width: roundEye, height: roundEye, transform: 'translate(-35%, -25%)' }}
        />
      );
    }
    if (effectiveExpression === 'wink' && side === 'right') {
      return <div className="mascot-eye mascot-eye--round" style={{ width: roundEye, height: roundEye }} />;
    }
    if (effectiveExpression === 'sleepy') {
      // Shorter and barely rotated -- half-lidded rather than a full smile arc.
      return (
        <div
          className="mascot-eye mascot-eye--arc"
          style={{ width: arcW, height: arcH * 0.55, transform: `rotate(${rot * 6}deg)` }}
        />
      );
    }
    if (effectiveExpression === 'excited') {
      // Bigger and more sharply curved -- eyes squeezed shut laughing.
      return (
        <div
          className="mascot-eye mascot-eye--arc"
          style={{ width: arcW * 1.2, height: arcH * 1.25, transform: `rotate(${rot * 22}deg)` }}
        />
      );
    }
    // happy (default) / wink's closed side / thinking's normal side --
    // the signature closed-arc mark straight from TileSwappyLogo's
    // "Tile 2" face.
    return (
      <div
        className="mascot-eye mascot-eye--arc"
        style={{ width: arcW, height: arcH, transform: `rotate(${rot * 15}deg)` }}
      />
    );
  };

  const mouthStyle: React.CSSProperties = (() => {
    switch (effectiveExpression) {
      case 'excited':
        return { width: mouthW * 0.85, height: mouthW * 0.6, borderRadius: '45%', background: 'var(--mascot-ink)' };
      case 'laughing':
        return { width: mouthW * 0.95, height: mouthW * 0.7, borderRadius: '45%', background: 'var(--mascot-ink)' };
      case 'surprised':
        return { width: mouthW * 0.4, height: mouthW * 0.4, borderRadius: '50%', background: 'var(--mascot-ink)' };
      case 'sleepy':
        return { width: mouthW * 0.5, height: 3, borderRadius: 999, background: 'var(--mascot-ink)' };
      case 'thinking':
        return { width: mouthW * 0.45, height: 3, borderRadius: 999, background: 'var(--mascot-ink)', transform: 'rotate(-8deg) translateX(15%)' };
      case 'confused':
        return { width: mouthW * 0.4, height: 3, borderRadius: 999, background: 'var(--mascot-ink)', transform: 'rotate(-20deg) translateX(10%)' };
      case 'wink':
      case 'love':
      case 'happy':
      default:
        return {
          width: mouthW,
          height: mouthW * 0.5,
          borderBottomLeftRadius: '999px',
          borderBottomRightRadius: '999px',
          borderBottom: `${Math.max(2, size * 0.035)}px solid var(--mascot-ink)`
        };
    }
  })();

  return (
    <div
      className={`mascot-body ${BODY_COLOR_CLASS[color]} ${bounce ? 'mascot-bounce' : ''} ${onClick ? 'mascot-clickable' : ''} ${poked ? 'mascot-poked' : ''} ${className}`}
      style={{ width: size, height: size, borderRadius: size * 0.28 }}
      onClick={onClick ? handleClick : undefined}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      aria-label={onClick ? 'Tilo the TileSwappy mascot' : undefined}
      onKeyDown={onClick ? (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleClick(); } } : undefined}
    >
      <div className="mascot-face">
        {/* Percentage `gap` measured out too small in practice to keep
            the two eyes from visually merging into a single "V" at
            small sizes -- a size-relative px value reproduces the
            spacing that was actually verified to look right. */}
        <div className="mascot-eyes" style={{ gap: size * 0.3 }}>
          {renderEye('left')}
          {renderEye('right')}
        </div>
        <div className="mascot-mouth" style={mouthStyle} />
      </div>
    </div>
  );
};
