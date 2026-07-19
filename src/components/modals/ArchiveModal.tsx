import React from 'react';
import { Calendar } from 'lucide-react';
import { ModalShell } from '../common/ModalShell';

interface Puzzle {
  id: string;
  title: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  gradient: string[];
  pattern?: string;
  direction?: string;
  imageUrl?: string;
}

interface ArchiveModalProps {
  onClose: () => void;
  onStartPuzzle: (puzzle: Puzzle) => void;
  completedPuzzleIds: Set<string>;
  favoritePuzzleIds: Set<string>;
  onToggleFavorite: (puzzleId: string) => void;
}

// Utility function to generate gradient styles
const getGradientStyle = (gradient: string[], pattern?: string, direction?: string): React.CSSProperties => {
  // Handle custom direction for linear gradients
  if (direction && !pattern) {
    return {
      background: `linear-gradient(${direction}, ${gradient.join(', ')})`
    };
  }

  if (!pattern || pattern === 'linear') {
    return {
      background: `linear-gradient(135deg, ${gradient.join(', ')})`
    };
  }

  switch (pattern) {
    case 'radial':
      return {
        background: `radial-gradient(circle, ${gradient.join(', ')})`
      };

    case 'conic':
      return {
        background: `conic-gradient(from 0deg, ${gradient.join(', ')})`
      };

    case 'striped':
      const stripeStops = gradient.map((color, i) => {
        const start = (i / gradient.length) * 100;
        const end = ((i + 1) / gradient.length) * 100;
        return `${color} ${start}%, ${color} ${end}%`;
      }).join(', ');
      return {
        background: `linear-gradient(0deg, ${stripeStops})`
      };

    case 'diamond':
      return {
        background: `conic-gradient(from 45deg at 50% 50%, ${gradient[0]} 0deg, ${gradient[1]} 90deg, ${gradient[2]} 180deg, ${gradient[1]} 270deg, ${gradient[0]} 360deg)`
      };

    case 'checkerboard':
      return {
        background: `repeating-conic-gradient(${gradient[0]} 0% 25%, ${gradient[1]} 0% 50%) 50% / 40px 40px`
      };

    case 'wavy':
      return {
        background: `linear-gradient(180deg, ${gradient.join(', ')})`
      };

    case 'dots':
      return {
        backgroundColor: gradient[0],
        backgroundImage: `radial-gradient(circle, ${gradient[1]} 20%, transparent 20%)`,
        backgroundSize: '30px 30px'
      };

    default:
      return {
        background: `linear-gradient(135deg, ${gradient.join(', ')})`
      };
  }
};

export const ArchiveModal: React.FC<ArchiveModalProps> = ({
  onClose,
  onStartPuzzle,
  completedPuzzleIds,
  favoritePuzzleIds,
  onToggleFavorite
}) => {
  const puzzleCategories = [
    {
      name: 'Abstract & Gradients',
      icon: '🎨',
      puzzles: [
        { id: 'abstract-001', title: 'Ocean Waves', difficulty: 'Easy' as const, gradient: ['#0077be', '#00a8e8', '#00d4ff'], pattern: undefined, direction: undefined },
        { id: 'abstract-002', title: 'Sunset Sky', difficulty: 'Easy' as const, gradient: ['#ff6b6b', '#ffa500', '#ffd700'], pattern: undefined, direction: undefined },
        { id: 'abstract-003', title: 'Forest Green', difficulty: 'Easy' as const, gradient: ['#2d5016', '#4a7c2c', '#6fa84a'], pattern: undefined, direction: undefined },
        { id: 'abstract-004', title: 'Purple Dreams', difficulty: 'Medium' as const, gradient: ['#6a0dad', '#9370db', '#dda0dd'], pattern: undefined, direction: undefined },
        { id: 'abstract-005', title: 'Cherry Blossom', difficulty: 'Medium' as const, gradient: ['#ffb7c5', '#ffc0cb', '#ffd1dc'], pattern: undefined, direction: undefined },
      ]
    },
    {
      name: 'Seasonal',
      icon: '🍂',
      puzzles: [
        { id: 'seasonal-001', title: 'Autumn Leaves', difficulty: 'Easy' as const, gradient: ['#ff4500', '#ff8c00', '#ffa500'], pattern: undefined, direction: undefined },
        { id: 'seasonal-002', title: 'Winter Snow', difficulty: 'Medium' as const, gradient: ['#e0f7fa', '#b2ebf2', '#80deea'], pattern: undefined, direction: undefined },
        { id: 'seasonal-003', title: 'Spring Bloom', difficulty: 'Medium' as const, gradient: ['#ff69b4', '#ff1493', '#c71585'], pattern: undefined, direction: undefined },
      ]
    },
    {
      name: 'Cosmic & Space',
      icon: '🌌',
      puzzles: [
        { id: 'cosmic-001', title: 'Galaxy Spiral', difficulty: 'Hard' as const, gradient: ['#191970', '#8a2be2', '#ff69b4'], pattern: undefined, direction: undefined },
        { id: 'cosmic-002', title: 'Neon Nights', difficulty: 'Hard' as const, gradient: ['#ff00ff', '#00ffff', '#ffff00'], pattern: undefined, direction: undefined },
        { id: 'cosmic-003', title: 'Toxic Flares', difficulty: 'Hard' as const, gradient: ['#bb00bb', '#6fa84a', '#00bb00'], pattern: undefined, direction: undefined },
      ]
    },
    {
      name: 'Vertical Flows',
      icon: '⬇️',
      puzzles: [
        { id: 'vertical-001', title: 'Sky to Ground', difficulty: 'Easy' as const, gradient: ['#87ceeb', '#4a90e2', '#2c5f8d'], pattern: undefined, direction: 'to bottom' },
        { id: 'vertical-002', title: 'Lava Rise', difficulty: 'Easy' as const, gradient: ['#ff4500', '#ff6347', '#ffa500'], pattern: undefined, direction: 'to top' },
        { id: 'vertical-003', title: 'Deep Ocean', difficulty: 'Medium' as const, gradient: ['#001f3f', '#003d5c', '#006ba6', '#0496ff'], pattern: undefined, direction: 'to bottom' },
        { id: 'vertical-004', title: 'Mountain Peak', difficulty: 'Medium' as const, gradient: ['#2d3142', '#4f5d75', '#bfc0c0', '#ffffff'], pattern: undefined, direction: 'to top' },
        { id: 'vertical-005', title: 'Jungle Canopy', difficulty: 'Hard' as const, gradient: ['#064e3b', '#047857', '#10b981', '#6ee7b7', '#d1fae5'], pattern: undefined, direction: 'to bottom' },
      ]
    },
    {
      name: 'Horizontal Sweeps',
      icon: '➡️',
      puzzles: [
        { id: 'horizontal-001', title: 'Dawn to Dusk', difficulty: 'Easy' as const, gradient: ['#ff6b6b', '#ffa500', '#4a90e2', '#2c3e50'], pattern: undefined, direction: 'to right' },
        { id: 'horizontal-002', title: 'Desert Horizon', difficulty: 'Easy' as const, gradient: ['#c77c11', '#e9b44c', '#f4e4c1'], pattern: undefined, direction: 'to right' },
        { id: 'horizontal-003', title: 'Ocean Depth', difficulty: 'Medium' as const, gradient: ['#e0f7fa', '#80deea', '#26c6da', '#0097a7', '#006064'], pattern: undefined, direction: 'to right' },
        { id: 'horizontal-004', title: 'Fire to Ice', difficulty: 'Hard' as const, gradient: ['#ff0000', '#ff4500', '#ffa500', '#4a90e2', '#0000ff'], pattern: undefined, direction: 'to right' },
      ]
    },
    {
      name: 'Corner Flows',
      icon: '↗️',
      puzzles: [
        { id: 'corner-001', title: 'Northeast Rise', difficulty: 'Medium' as const, gradient: ['#667eea', '#764ba2', '#f093fb'], pattern: undefined, direction: 'to top right' },
        { id: 'corner-002', title: 'Southeast Storm', difficulty: 'Medium' as const, gradient: ['#1a1a2e', '#16213e', '#0f3460', '#533483'], pattern: undefined, direction: 'to bottom right' },
        { id: 'corner-003', title: 'Northwest Chill', difficulty: 'Medium' as const, gradient: ['#00d2ff', '#3a7bd5', '#2d3561'], pattern: undefined, direction: 'to top left' },
        { id: 'corner-004', title: 'Southwest Heat', difficulty: 'Hard' as const, gradient: ['#ff512f', '#dd2476', '#8e2de2'], pattern: undefined, direction: 'to bottom left' },
      ]
    },
    {
      name: 'Multi-Color Blends',
      icon: '🌈',
      puzzles: [
        { id: 'multi-001', title: 'Rainbow Arc', difficulty: 'Easy' as const, gradient: ['#ff0000', '#ff7f00', '#ffff00', '#00ff00', '#0000ff', '#8b00ff'], pattern: undefined, direction: undefined },
        { id: 'multi-002', title: 'Tropical Sunset', difficulty: 'Easy' as const, gradient: ['#ff0080', '#ff8c00', '#40e0d0', '#4169e1'], pattern: undefined, direction: undefined },
        { id: 'multi-003', title: 'Neon City', difficulty: 'Medium' as const, gradient: ['#ff00ff', '#00ffff', '#ff1493', '#00ff00', '#ffff00'], pattern: undefined, direction: undefined },
        { id: 'multi-004', title: 'Aurora Borealis', difficulty: 'Medium' as const, gradient: ['#00ff87', '#60efff', '#7b68ee', '#ff1493', '#00ff87'], pattern: undefined, direction: undefined },
        { id: 'multi-005', title: 'Cosmic Burst', difficulty: 'Hard' as const, gradient: ['#1a1a2e', '#16213e', '#e94560', '#f4a261', '#e76f51', '#2a9d8f'], pattern: undefined, direction: undefined },
      ]
    },
    {
      name: 'Pastel Dreams',
      icon: '🌸',
      puzzles: [
        { id: 'pastel-001', title: 'Cotton Candy', difficulty: 'Easy' as const, gradient: ['#ffb3d9', '#ffc2e2', '#ffd9f0', '#ffe5f7'], pattern: undefined, direction: undefined },
        { id: 'pastel-002', title: 'Mint Breeze', difficulty: 'Easy' as const, gradient: ['#c7f0db', '#b8e6d5', '#a9ddd6', '#9ad4d6'], pattern: undefined, direction: undefined },
        { id: 'pastel-003', title: 'Lavender Fields', difficulty: 'Medium' as const, gradient: ['#e6d5f5', '#d4c5e8', '#c2b5db', '#b0a5ce'], pattern: undefined, direction: undefined },
        { id: 'pastel-004', title: 'Peach Sorbet', difficulty: 'Medium' as const, gradient: ['#ffd4a3', '#ffcba4', '#ffc1a6', '#ffb8a7'], pattern: undefined, direction: undefined },
        { id: 'pastel-005', title: 'Baby Blue', difficulty: 'Easy' as const, gradient: ['#c8e7f5', '#b8dff0', '#a8d7eb', '#98cfe6'], pattern: undefined, direction: undefined },
      ]
    },
    {
      name: 'Dark & Moody',
      icon: '🌑',
      puzzles: [
        { id: 'dark-001', title: 'Midnight Oil', difficulty: 'Medium' as const, gradient: ['#000000', '#1a1a1a', '#2d2d2d', '#404040'], pattern: undefined, direction: undefined },
        { id: 'dark-002', title: 'Deep Purple', difficulty: 'Medium' as const, gradient: ['#1a0033', '#2d0052', '#400070', '#53008f'], pattern: undefined, direction: undefined },
        { id: 'dark-003', title: 'Blood Moon', difficulty: 'Hard' as const, gradient: ['#1a0000', '#330000', '#660000', '#990000', '#cc0000'], pattern: undefined, direction: undefined },
        { id: 'dark-004', title: 'Forest Night', difficulty: 'Hard' as const, gradient: ['#001a00', '#003300', '#004d00', '#006600'], pattern: undefined, direction: undefined },
      ]
    },
    {
      name: 'Metallic Sheen',
      icon: '✨',
      puzzles: [
        { id: 'metal-001', title: 'Silver Chrome', difficulty: 'Medium' as const, gradient: ['#c0c0c0', '#d3d3d3', '#e8e8e8', '#f5f5f5'], pattern: undefined, direction: undefined },
        { id: 'metal-002', title: 'Gold Rush', difficulty: 'Medium' as const, gradient: ['#c49102', '#d4af37', '#e5c158', '#f7d379'], pattern: undefined, direction: undefined },
        { id: 'metal-003', title: 'Bronze Age', difficulty: 'Medium' as const, gradient: ['#804000', '#996515', '#b38728', '#cca43b'], pattern: undefined, direction: undefined },
        { id: 'metal-004', title: 'Copper Penny', difficulty: 'Hard' as const, gradient: ['#b87333', '#cd7f32', '#e29c5c', '#f2b88a'], pattern: undefined, direction: undefined },
        { id: 'metal-005', title: 'Platinum', difficulty: 'Hard' as const, gradient: ['#8c8c8c', '#9c9c9c', '#adadad', '#bebebe', '#d0d0d0'], pattern: undefined, direction: undefined },
      ]
    },
    {
      name: 'Earth Tones',
      icon: '🌍',
      puzzles: [
        { id: 'earth-001', title: 'Sandy Beach', difficulty: 'Easy' as const, gradient: ['#daa520', '#e5b73b', '#f0ca66', '#fbdd90'], pattern: undefined, direction: undefined },
        { id: 'earth-002', title: 'Clay Pottery', difficulty: 'Easy' as const, gradient: ['#8b4513', '#a0522d', '#b5651d', '#cd853f'], pattern: undefined, direction: undefined },
        { id: 'earth-003', title: 'Moss Garden', difficulty: 'Medium' as const, gradient: ['#556b2f', '#6b8e23', '#8fbc8f', '#9dc183'], pattern: undefined, direction: undefined },
        { id: 'earth-004', title: 'Canyon Rocks', difficulty: 'Medium' as const, gradient: ['#8b4500', '#a0522d', '#cd853f', '#daa520', '#f4a460'], pattern: undefined, direction: undefined },
      ]
    },
    {
      name: 'Neon Glow',
      icon: '💡',
      puzzles: [
        { id: 'neon-001', title: 'Hot Pink', difficulty: 'Easy' as const, gradient: ['#ff006e', '#ff1a8c', '#ff4db3', '#ff80d9'], pattern: undefined, direction: undefined },
        { id: 'neon-002', title: 'Electric Blue', difficulty: 'Easy' as const, gradient: ['#0066ff', '#1a75ff', '#4d94ff', '#80b3ff'], pattern: undefined, direction: undefined },
        { id: 'neon-003', title: 'Lime Light', difficulty: 'Medium' as const, gradient: ['#00ff00', '#33ff33', '#66ff66', '#99ff99'], pattern: undefined, direction: undefined },
        { id: 'neon-004', title: 'Cyber Purple', difficulty: 'Medium' as const, gradient: ['#9d00ff', '#b733ff', '#d166ff', '#eb99ff'], pattern: undefined, direction: undefined },
        { id: 'neon-005', title: 'Toxic Yellow', difficulty: 'Hard' as const, gradient: ['#ccff00', '#d6ff33', '#e0ff66', '#ebff99'], pattern: undefined, direction: undefined },
      ]
    },
    {
      name: 'Cool Blues',
      icon: '🧊',
      puzzles: [
        { id: 'blue-001', title: 'Ice Glacier', difficulty: 'Easy' as const, gradient: ['#e0f2f7', '#b3e5fc', '#81d4fa', '#4fc3f7'], pattern: undefined, direction: undefined },
        { id: 'blue-002', title: 'Navy Depths', difficulty: 'Easy' as const, gradient: ['#001f3f', '#003d5c', '#005c7a', '#007a99'], pattern: undefined, direction: undefined },
        { id: 'blue-003', title: 'Sapphire Gem', difficulty: 'Medium' as const, gradient: ['#0f52ba', '#1560c8', '#1e6ed6', '#2a7ee0'], pattern: undefined, direction: undefined },
        { id: 'blue-004', title: 'Turquoise Waters', difficulty: 'Medium' as const, gradient: ['#00bcd4', '#26c6da', '#4dd0e1', '#80deea'], pattern: undefined, direction: undefined },
      ]
    },
    {
      name: 'Warm Reds',
      icon: '🔥',
      puzzles: [
        { id: 'red-001', title: 'Cherry Red', difficulty: 'Easy' as const, gradient: ['#8b0000', '#b22222', '#dc143c', '#ff6347'], pattern: undefined, direction: undefined },
        { id: 'red-002', title: 'Rose Petal', difficulty: 'Easy' as const, gradient: ['#ff1493', '#ff69b4', '#ffb6c1', '#ffc0cb'], pattern: undefined, direction: undefined },
        { id: 'red-003', title: 'Rust Belt', difficulty: 'Medium' as const, gradient: ['#8b4513', '#a0522d', '#b8860b', '#cd853f'], pattern: undefined, direction: undefined },
        { id: 'red-004', title: 'Volcano', difficulty: 'Hard' as const, gradient: ['#8b0000', '#b22222', '#ff4500', '#ff6347', '#ffa500'], pattern: undefined, direction: undefined },
      ]
    },
    {
      name: 'Radial Gradients',
      icon: '⭕',
      puzzles: [
        { id: 'radial-001', title: 'Sunset Burst', difficulty: 'Easy' as const, gradient: ['#ff6b6b', '#ffa500', '#ffd700'], pattern: 'radial', direction: undefined },
        { id: 'radial-002', title: 'Ocean Depth', difficulty: 'Easy' as const, gradient: ['#001f3f', '#0074D9', '#7FDBFF'], pattern: 'radial', direction: undefined },
        { id: 'radial-003', title: 'Forest Ring', difficulty: 'Medium' as const, gradient: ['#1a4d2e', '#4f7942', '#90be6d'], pattern: 'radial', direction: undefined },
        { id: 'radial-004', title: 'Purple Haze', difficulty: 'Medium' as const, gradient: ['#2d004d', '#7209b7', '#f72585'], pattern: 'radial', direction: undefined },
        { id: 'radial-005', title: 'Fire Core', difficulty: 'Hard' as const, gradient: ['#370617', '#dc2f02', '#ffba08'], pattern: 'radial', direction: undefined },
      ]
    },
    {
      name: 'Conic Spirals',
      icon: '🌀',
      puzzles: [
        { id: 'conic-001', title: 'Rainbow Spin', difficulty: 'Medium' as const, gradient: ['#ff0000', '#ffff00', '#00ff00', '#0000ff', '#ff0000'], pattern: 'conic', direction: undefined },
        { id: 'conic-002', title: 'Twilight Twist', difficulty: 'Medium' as const, gradient: ['#1e3a8a', '#7c3aed', '#ec4899', '#1e3a8a'], pattern: 'conic', direction: undefined },
        { id: 'conic-003', title: 'Neon Vortex', difficulty: 'Hard' as const, gradient: ['#00ffff', '#ff00ff', '#ffff00', '#00ffff'], pattern: 'conic', direction: undefined },
        { id: 'conic-004', title: 'Earth Rotation', difficulty: 'Hard' as const, gradient: ['#064e3b', '#fbbf24', '#dc2626', '#064e3b'], pattern: 'conic', direction: undefined },
      ]
    },
    {
      name: 'Striped Patterns',
      icon: '📊',
      puzzles: [
        { id: 'stripe-001', title: 'Candy Cane', difficulty: 'Easy' as const, gradient: ['#dc2626', '#ffffff', '#dc2626'], pattern: 'striped', direction: undefined },
        { id: 'stripe-002', title: 'Beach Towel', difficulty: 'Easy' as const, gradient: ['#0ea5e9', '#fbbf24', '#0ea5e9'], pattern: 'striped', direction: undefined },
        { id: 'stripe-003', title: 'Zebra Crossing', difficulty: 'Medium' as const, gradient: ['#000000', '#ffffff', '#000000', '#ffffff'], pattern: 'striped', direction: undefined },
        { id: 'stripe-004', title: 'Sunset Layers', difficulty: 'Medium' as const, gradient: ['#ff6b6b', '#ffa500', '#ffd700', '#87ceeb'], pattern: 'striped', direction: undefined },
      ]
    },
    {
      name: 'Diamond Patterns',
      icon: '💎',
      puzzles: [
        { id: 'diamond-001', title: 'Gem Stone', difficulty: 'Medium' as const, gradient: ['#4c1d95', '#7c3aed', '#c084fc'], pattern: 'diamond', direction: undefined },
        { id: 'diamond-002', title: 'Ice Crystal', difficulty: 'Medium' as const, gradient: ['#0c4a6e', '#38bdf8', '#e0f2fe'], pattern: 'diamond', direction: undefined },
        { id: 'diamond-003', title: 'Emerald Cut', difficulty: 'Hard' as const, gradient: ['#064e3b', '#10b981', '#6ee7b7'], pattern: 'diamond', direction: undefined },
        { id: 'diamond-004', title: 'Ruby Facet', difficulty: 'Hard' as const, gradient: ['#7f1d1d', '#dc2626', '#fca5a5'], pattern: 'diamond', direction: undefined },
      ]
    },
    {
      name: 'Checkerboard',
      icon: '⬛',
      puzzles: [
        { id: 'checker-001', title: 'Classic Board', difficulty: 'Medium' as const, gradient: ['#1f2937', '#f3f4f6'], pattern: 'checkerboard', direction: undefined },
        { id: 'checker-002', title: 'Bubblegum', difficulty: 'Medium' as const, gradient: ['#ec4899', '#fce7f3'], pattern: 'checkerboard', direction: undefined },
        { id: 'checker-003', title: 'Cyber Grid', difficulty: 'Hard' as const, gradient: ['#00ffff', '#ff00ff'], pattern: 'checkerboard', direction: undefined },
      ]
    },
    {
      name: 'Wavy Patterns',
      icon: '🌊',
      puzzles: [
        { id: 'wave-001', title: 'Ocean Waves', difficulty: 'Medium' as const, gradient: ['#0369a1', '#0ea5e9', '#bae6fd'], pattern: 'wavy', direction: undefined },
        { id: 'wave-002', title: 'Desert Dunes', difficulty: 'Medium' as const, gradient: ['#78350f', '#d97706', '#fcd34d'], pattern: 'wavy', direction: undefined },
        { id: 'wave-003', title: 'Aurora Flow', difficulty: 'Hard' as const, gradient: ['#1e3a8a', '#7c3aed', '#ec4899', '#06b6d4'], pattern: 'wavy', direction: undefined },
        { id: 'wave-004', title: 'Lava Flow', difficulty: 'Hard' as const, gradient: ['#7f1d1d', '#dc2626', '#fb923c'], pattern: 'wavy', direction: undefined },
      ]
    },
    {
      name: 'Dots & Circles',
      icon: '⚪',
      puzzles: [
        { id: 'dots-001', title: 'Polka Party', difficulty: 'Easy' as const, gradient: ['#ec4899', '#fce7f3'], pattern: 'dots', direction: undefined },
        { id: 'dots-002', title: 'Starry Night', difficulty: 'Medium' as const, gradient: ['#0f172a', '#1e40af', '#60a5fa'], pattern: 'dots', direction: undefined },
        { id: 'dots-003', title: 'Confetti', difficulty: 'Medium' as const, gradient: ['#ff0000', '#ffff00', '#00ff00', '#0000ff'], pattern: 'dots', direction: undefined },
      ]
    }
  ];

  // Calculate total puzzles
  const totalPuzzles = puzzleCategories.reduce((sum, cat) => sum + cat.puzzles.length, 0);

  return (
    <ModalShell
      onClose={onClose}
      title="Puzzle Archive"
      titleIcon={Calendar}
      subtitle="Browse and play all puzzles"
      maxWidth="2xl"
      bodyClassName="p-6"
    >
          <div className="mb-6 bg-navy-dark rounded-xl p-4 border border-navy">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-coral">{completedPuzzleIds.size}</div>
                <div className="text-sm text-teal">Puzzles Completed</div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-teal">
                  {Math.round((completedPuzzleIds.size / totalPuzzles) * 100)}%
                </div>
                <div className="text-sm text-offwhite/60">Archive Progress</div>
              </div>
            </div>
          </div>

          {favoritePuzzleIds.size > 0 && (
            <div className="mb-6">
              <h3 className="text-offwhite font-semibold text-sm mb-2 flex items-center gap-2">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" className="text-coral">
                  <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                </svg>
                Your Favorites ({favoritePuzzleIds.size})
              </h3>
            </div>
          )}

          {puzzleCategories.map((category) => (
            <div key={category.name} className="mb-6">
              <h3 className="text-offwhite font-semibold text-sm mb-3 flex items-center gap-2">
                <span>{category.icon}</span>
                {category.name}
              </h3>
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                {category.puzzles.map((puzzle) => {
                  const isCompleted = completedPuzzleIds.has(puzzle.id);
                  const isFavorite = favoritePuzzleIds.has(puzzle.id);

                  return (
                    <button
                      key={puzzle.id}
                      onClick={() => {
                        onStartPuzzle(puzzle);
                        onClose();
                        }}
                      className="relative group"
                    >
                      <div className="aspect-square rounded-lg overflow-hidden border-2 border-navy-dark hover:border-teal transition-all">
                        <div 
                          className="w-full h-full"
                          style={getGradientStyle(puzzle.gradient, puzzle.pattern, puzzle.direction)}
                        />
                        {isCompleted && (
                          <div className="absolute top-1 left-1 bg-teal text-navy rounded-full p-0.5">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                              <polyline points="20 6 9 17 4 12"></polyline>
                            </svg>
                          </div>
                        )}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onToggleFavorite(puzzle.id);
                          }}
                          className="absolute top-1 right-1 bg-navy-dark/80 hover:bg-navy/80 rounded-full p-1 transition"
                        >
                          <svg 
                            width="12" 
                            height="12" 
                            viewBox="0 0 24 24" 
                            fill={isFavorite ? 'currentColor' : 'none'}
                            stroke="currentColor"
                            strokeWidth="2"
                            className={isFavorite ? 'text-coral' : 'text-offwhite'}
                          >
                            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                          </svg>
                        </button>
                      </div>
                      <div className="mt-1 text-left">
                        <div className="text-offwhite text-[10px] font-semibold truncate">{puzzle.title}</div>
                        <div className={`text-[9px] font-medium ${
                          puzzle.difficulty === 'Easy' ? 'text-teal' :
                          puzzle.difficulty === 'Medium' ? 'text-yellow-400' :
                          'text-coral'
                        }`}>
                          {puzzle.difficulty}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
    </ModalShell>
  );
};