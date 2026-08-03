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

  // candy: a lollipop on a stick, using the same peppermint swirl
  // gradient as the Candy Shop theme background for visual consistency.
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
};
