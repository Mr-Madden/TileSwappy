import React from 'react';
import { useCanvasParticles } from '../../hooks/useCanvasParticles';

interface ThemeBackgroundProps {
  theme: string;
}

const StarfieldLayer: React.FC = () => {
  const canvasRef = useCanvasParticles('stars');
  return (
    <div className="theme-bg-layer">
      <canvas ref={canvasRef} />
      <div className="bg-effect-aurora" />
    </div>
  );
};

const BubbleLayer: React.FC = () => {
  const canvasRef = useCanvasParticles('bubbles');
  return (
    <div className="theme-bg-layer">
      <canvas ref={canvasRef} />
      <div className="bg-effect-swell" />
    </div>
  );
};

const ArcadeLayer: React.FC = () => (
  <div className="theme-bg-layer">
    <div className="bg-effect-blob b1" />
    <div className="bg-effect-blob b2" />
    <div className="bg-effect-blob b3" />
  </div>
);

const NeonLayer: React.FC = () => (
  <div className="theme-bg-layer">
    <div className="bg-effect-grid" />
    <div className="bg-effect-scan" />
  </div>
);

const RetroLayer: React.FC = () => (
  <div className="theme-bg-layer">
    <div className="bg-effect-scanlines" />
  </div>
);

const BotanicalLayer: React.FC = () => (
  <div className="theme-bg-layer">
    <div className="bg-effect-sun" />
    <div className="bg-effect-leaf l1" />
    <div className="bg-effect-leaf l2" />
  </div>
);

const ZenLayer: React.FC = () => (
  <div className="theme-bg-layer">
    <div className="bg-effect-ripple r1" />
    <div className="bg-effect-ripple r2" />
  </div>
);

const DesertLayer: React.FC = () => {
  const canvasRef = useCanvasParticles('sand');
  return (
    <div className="theme-bg-layer">
      <canvas ref={canvasRef} />
      <div className="bg-effect-haze" />
      <div className="bg-effect-dune" />
    </div>
  );
};

const IceLayer: React.FC = () => (
  <div className="theme-bg-layer">
    <div className="bg-effect-facet f1" />
    <div className="bg-effect-facet f2" />
  </div>
);

const CandyLayer: React.FC = () => (
  <div className="theme-bg-layer">
    <div className="bg-effect-dotgrid" />
  </div>
);

const AUTUMN_LEAVES = [
  { left: '12%', size: 16, delay: '0s' },
  { left: '30%', size: 12, delay: '1.6s' },
  { left: '48%', size: 14, delay: '3.2s' },
  { left: '65%', size: 11, delay: '4.8s' },
  { left: '82%', size: 15, delay: '6.4s' },
];

const AutumnLayer: React.FC = () => (
  <div className="theme-bg-layer">
    {AUTUMN_LEAVES.map((leaf, i) => (
      <div
        key={i}
        className="bg-effect-leafdrop"
        style={{
          left: leaf.left,
          width: leaf.size,
          height: leaf.size,
          background: i % 2 === 0 ? 'rgb(var(--color-gold))' : 'rgb(var(--color-coral))',
          animationDelay: leaf.delay,
        }}
      />
    ))}
  </div>
);

const DecoLayer: React.FC = () => (
  <div className="theme-bg-layer">
    <div className="bg-effect-sunburst" />
  </div>
);

const LAYERS: Record<string, React.FC | null> = {
  current: null,
  mono: null,
  cosmic: StarfieldLayer,
  ocean: BubbleLayer,
  arcade: ArcadeLayer,
  neon: NeonLayer,
  retro: RetroLayer,
  botanical: BotanicalLayer,
  zen: ZenLayer,
  desert: DesertLayer,
  ice: IceLayer,
  candy: CandyLayer,
  autumn: AutumnLayer,
  deco: DecoLayer,
};

export const ThemeBackground: React.FC<ThemeBackgroundProps> = ({ theme }) => {
  const Layer = LAYERS[theme];
  if (!Layer) return null;
  return <Layer />;
};
