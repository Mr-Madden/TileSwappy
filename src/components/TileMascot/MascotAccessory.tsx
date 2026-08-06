import React from 'react';
import type { AccessoryKind } from './useMascotTheme';
import './MascotAccessory.css';

interface MascotAccessoryProps {
  kind: AccessoryKind;
  size: number;
}

// A small nod to whichever theme is active -- deliberately scoped to a
// few of the most visually iconic themes rather than all fourteen, so
// each one is a clean, confident shape instead of something thin and
// generic stretched across every theme.
export const MascotAccessory: React.FC<MascotAccessoryProps> = ({ kind, size }) => {
  if (kind === 'desert') {
    // Sunglasses pushed up on the forehead, not over the eyes -- so his
    // actual expression underneath stays fully visible.
    const lensW = size * 0.27;
    const lensH = size * 0.15;
    return (
      <div className="mascot-accessory mascot-accessory--sunglasses" style={{ top: size * 0.05 }}>
        <div className="mascot-sunglasses-lens" style={{ width: lensW, height: lensH }} />
        <div className="mascot-sunglasses-bridge" style={{ width: size * 0.05, height: lensH * 0.3 }} />
        <div className="mascot-sunglasses-lens" style={{ width: lensW, height: lensH }} />
      </div>
    );
  }

  if (kind === 'ice') {
    const domeW = size * 0.86;
    const domeH = size * 0.34;
    const pomD = size * 0.16;
    return (
      <div className="mascot-accessory" style={{ top: -(domeH * 0.62), left: '50%', transform: 'translateX(-50%)' }}>
        <div className="mascot-beanie-pom" style={{ width: pomD, height: pomD, margin: '0 auto' }} />
        <div className="mascot-beanie-dome" style={{ width: domeW, height: domeH }} />
      </div>
    );
  }

  if (kind === 'candy') {
    // A lollipop on a stick, using the same peppermint swirl gradient as
    // the Candy Shop theme background for visual consistency.
    const swirlD = size * 0.3;
    const stemH = size * 0.22;
    return (
      <div
        className="mascot-accessory"
        style={{ top: -(swirlD + stemH * 0.5), left: '50%', transform: 'translateX(-50%)' }}
      >
        <div className="mascot-lollipop-swirl" style={{ width: swirlD, height: swirlD, margin: '0 auto' }} />
        <div className="mascot-lollipop-stem" style={{ width: size * 0.035, height: stemH, margin: '0 auto' }} />
      </div>
    );
  }

  if (kind === 'halloween') {
    // A witch hat -- a wide brim disc plus a tapered cone with a small
    // buckled band, tilted a few degrees so it reads as worn, not glued on straight.
    const brimW = size * 0.62;
    const brimH = size * 0.14;
    const coneH = size * 0.4;
    return (
      <div
        className="mascot-accessory"
        style={{ top: -(coneH + brimH * 0.4), left: '50%', transform: 'translateX(-50%) rotate(-6deg)' }}
      >
        <div className="mascot-witch-cone" style={{ width: size * 0.36, height: coneH, margin: '0 auto' }}>
          <div className="mascot-witch-band" style={{ height: size * 0.05 }} />
        </div>
        <div className="mascot-witch-brim" style={{ width: brimW, height: brimH }} />
      </div>
    );
  }

  if (kind === 'winter') {
    // A Santa hat -- red cone drooping to one side with a white fur trim
    // band and a pom at the tip, the classic silhouette.
    const coneH = size * 0.42;
    return (
      <div
        className="mascot-accessory"
        style={{ top: -(coneH * 0.78), left: '50%', transform: 'translateX(-50%)' }}
      >
        <div className="mascot-santa-cone" style={{ width: size * 0.5, height: coneH }}>
          <div className="mascot-santa-pom" style={{ width: size * 0.16, height: size * 0.16 }} />
        </div>
        <div className="mascot-santa-band" style={{ width: size * 0.56, height: size * 0.13, margin: '0 auto' }} />
      </div>
    );
  }

  // valentine: a thin headband with a heart floating above it on a short
  // stem -- reuses the same two-circles-plus-rotated-square heart shape
  // as TileMascot's own 'love' expression eyes, just scaled up.
  const heartSize = size * 0.22;
  return (
    <div
      className="mascot-accessory"
      style={{ top: -(size * 0.32), left: '50%', transform: 'translateX(-50%)' }}
    >
      <div className="mascot-valentine-heart" style={{ ['--heart-size' as any]: `${heartSize}px` }} />
      <div className="mascot-valentine-stem" style={{ height: size * 0.1, margin: '0 auto' }} />
      <div className="mascot-valentine-band" style={{ width: size * 0.7 }} />
    </div>
  );
};
