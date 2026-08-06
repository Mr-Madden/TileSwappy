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
      {/* A shooting star streaks across every so often -- same
          "mostly invisible, occasionally pops" pattern as Ocean's big
          bubble and Autumn's breeze, just diagonal instead of vertical. */}
      <div className="bg-effect-shootingstar" />
      <div className="bg-effect-shootingstar s2" />
    </div>
  );
};

const BubbleLayer: React.FC = () => {
  const canvasRef = useCanvasParticles('bubbles');
  return (
    <div className="theme-bg-layer">
      <canvas ref={canvasRef} />
      <div className="bg-effect-swell" />
      <div
        className="bg-effect-bigbubble"
        style={{ left: '18%', width: 34, height: 34, animationDelay: '0s' }}
      />
      <div
        className="bg-effect-bigbubble"
        style={{ left: '68%', width: 22, height: 22, animationDuration: '19s', animationDelay: '-7s' }}
      />
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
    {/* Persistent handheld-LCD texture and a slow CRT-style sweep so
        there's always some motion, plus a more frequent/bigger glitch
        with a chromatic-split fringe for the moment it fires. */}
    <div className="bg-effect-pixelgrid" />
    <div className="bg-effect-scanlines" />
    <div className="bg-effect-crtsweep" />
    <div className="bg-effect-glitch" />
    <div className="bg-effect-glitch-fringe r" />
    <div className="bg-effect-glitch-fringe b" />
  </div>
);

interface BotanicalPlant {
  left?: string;
  right?: string;
  height: string;
  delay: string;
  buds: Array<{ bottom: string; side: 'left' | 'right'; delay: string; rotate: number }>;
}

const BOTANICAL_PLANTS: BotanicalPlant[] = [
  {
    left: '4%',
    height: '38vh',
    delay: '0s',
    buds: [
      { bottom: '35%', side: 'right', delay: '0s', rotate: 18 },
      { bottom: '65%', side: 'left', delay: '-1.2s', rotate: -22 },
    ],
  },
  {
    right: '6%',
    height: '26vh',
    delay: '-3s',
    buds: [{ bottom: '45%', side: 'left', delay: '-2.1s', rotate: 20 }],
  },
  {
    left: '46%',
    height: '18vh',
    delay: '-5.5s',
    buds: [{ bottom: '50%', side: 'right', delay: '-4s', rotate: -16 }],
  },
];

const BotanicalLayer: React.FC = () => (
  <div className="theme-bg-layer">
    <div className="bg-effect-sun" />
    <div className="bg-effect-leaf l1" />
    <div className="bg-effect-leaf l2" />
    {/* Growing vines along the bottom edge -- each stem loops through a
        slow grow/shrink cycle, with its buds fading in only partway
        through so they read as sprouting rather than just always there. */}
    {BOTANICAL_PLANTS.map((plant, i) => (
      <div
        key={i}
        className="bg-effect-plant"
        style={{
          left: plant.left,
          right: plant.right,
          height: plant.height,
          animationDelay: plant.delay,
        }}
      >
        {plant.buds.map((bud, j) => (
          <div
            key={j}
            className="bg-effect-bud"
            style={{
              bottom: bud.bottom,
              [bud.side]: '-1.2vh',
              animationDelay: bud.delay,
              ['--bud-rotate' as any]: `${bud.rotate}deg`,
            }}
          />
        ))}
      </div>
    ))}
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
      <div className="bg-effect-sandgust" />
      <div className="bg-effect-sandgust g2" />
    </div>
  );
};

const IceLayer: React.FC = () => {
  const canvasRef = useCanvasParticles('snow');
  return (
    <div className="theme-bg-layer">
      {/* A constant cool-blue wash so the theme actually reads as icy
          overall, not just a couple of small corner facets on a plain
          dark background. */}
      <div className="bg-effect-frostwash" />
      <canvas ref={canvasRef} />
      <div className="bg-effect-facet f1" />
      <div className="bg-effect-facet f2" />
      <div className="bg-effect-facet f3" />
      {/* Light catching the ice -- a soft glint sweeps through now and
          then, same occasional-flourish pattern as the other themes. */}
      <div className="bg-effect-glint" />
      <div className="bg-effect-glint g2" />
    </div>
  );
};

interface CandyPiece {
  type: string;
  top?: string;
  bottom?: string;
  left?: string;
  right?: string;
  size: number;
  rotate: number;
  delay: string;
}

const CANDY_PIECES: CandyPiece[] = [
  { type: 'peppermint', top: '4%', left: '5%', size: 46, rotate: -10, delay: '0s' },
  { type: 'peppermint', bottom: '6%', right: '7%', size: 38, rotate: 15, delay: '-2s' },
  { type: 'gumdrop c1', top: '8%', right: '5%', size: 40, rotate: 8, delay: '-1s' },
  { type: 'gumdrop c2', bottom: '10%', left: '8%', size: 34, rotate: -14, delay: '-3.4s' },
  // Bottom-center, not mid-height -- anything placed behind the Daily
  // Puzzles card gets muddied by its backdrop-blur, so these sit below
  // the card instead, in the same clear margin as the other corner pieces.
  { type: 'chocolate', bottom: '2%', left: '36%', size: 32, rotate: -6, delay: '-2.6s' },
  { type: 'chocolate', bottom: '2%', right: '36%', size: 32, rotate: 5, delay: '-0.6s' },
];

const CandyLayer: React.FC = () => (
  <div className="theme-bg-layer">
    <div className="bg-effect-dotgrid" />
    {/* Peppermints, gum drops, and chocolate squares framing the edges
        of the screen -- kept out of the center so they read as a
        border, not clutter over the puzzle. */}
    {CANDY_PIECES.map((piece, i) => (
      <div
        key={i}
        className={`bg-effect-candy ${piece.type}`}
        style={{
          top: piece.top,
          bottom: piece.bottom,
          left: piece.left,
          right: piece.right,
          width: piece.size,
          height: piece.size,
          animationDelay: piece.delay,
          ['--candy-rotate' as any]: `${piece.rotate}deg`,
        }}
      />
    ))}
  </div>
);

const AUTUMN_LEAVES = [
  { left: '4%', size: 22, delay: '0s' },
  { left: '16%', size: 17, delay: '0.9s' },
  { left: '27%', size: 20, delay: '1.8s' },
  { left: '38%', size: 15, delay: '2.7s' },
  { left: '49%', size: 21, delay: '3.6s' },
  { left: '58%', size: 16, delay: '4.5s' },
  { left: '67%', size: 19, delay: '5.4s' },
  { left: '76%', size: 15, delay: '6.3s' },
  { left: '85%', size: 22, delay: '7.2s' },
  { left: '93%', size: 17, delay: '8.1s' },
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
    {/* Visible gusts sweeping through every so often, layered on top of
        the leaves' own gust-timed sideways drift (see theme-fall). */}
    <div className="bg-effect-breeze" />
    <div className="bg-effect-breeze g2" />
  </div>
);

const DecoLayer: React.FC = () => (
  <div className="theme-bg-layer">
    <div className="bg-effect-sunburst" />
  </div>
);

// Thunderstorm -- my own theme. Continuous rain and slowly drifting
// storm clouds carry the ambient mood; the lightning flash is the
// occasional "spectacular" moment, same tier as Ocean's big bubble or
// Ice's glint, just brighter since a storm's whole point is that flash.
const StormLayer: React.FC = () => {
  const canvasRef = useCanvasParticles('rain');
  return (
    <div className="theme-bg-layer">
      <div className="bg-effect-stormcloud c1" />
      <div className="bg-effect-stormcloud c2" />
      <div className="bg-effect-stormcloud c3" />
      <canvas ref={canvasRef} />
      <div className="bg-effect-lightning" />
      <div className="bg-effect-lightning s2" />
    </div>
  );
};

// Inferno -- Fire's rising embers and drifting smoke carry the ambient
// mood, same tier as Thunderstorm's rain/clouds; the flare-up is the
// occasional "spectacular" moment, echoing the lightning flash but
// surging up from below instead of lighting up from above.
const FireLayer: React.FC = () => {
  const canvasRef = useCanvasParticles('embers');
  return (
    <div className="theme-bg-layer">
      <div className="bg-effect-smoke s1" />
      <div className="bg-effect-smoke s2" />
      <div className="bg-effect-smoke s3" />
      <canvas ref={canvasRef} />
      <div className="bg-effect-flare" />
      <div className="bg-effect-flare s2" />
    </div>
  );
};

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
  storm: StormLayer,
  fire: FireLayer,
};

export const ThemeBackground: React.FC<ThemeBackgroundProps> = ({ theme }) => {
  const Layer = LAYERS[theme];
  if (!Layer) return null;
  return <Layer />;
};
