import React from 'react';
import { X } from 'lucide-react';

interface Puzzle {
  id: string;
  title: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  gradient: string[];
  imageUrl?: string;
}

interface ArchiveModalProps {
  onClose: () => void;
  onStartPuzzle: (puzzle: Puzzle) => void;
  completedPuzzleIds: Set<string>;
  favoritePuzzleIds: Set<string>;
  onToggleFavorite: (puzzleId: string) => void;
}

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
        { id: 'abstract-001', title: 'Ocean Waves', difficulty: 'Easy' as const, gradient: ['#0077be', '#00a8e8', '#00d4ff'] },
        { id: 'abstract-002', title: 'Sunset Sky', difficulty: 'Easy' as const, gradient: ['#ff6b6b', '#ffa500', '#ffd700'] },
        { id: 'abstract-003', title: 'Forest Green', difficulty: 'Easy' as const, gradient: ['#2d5016', '#4a7c2c', '#6fa84a'] },
        { id: 'abstract-004', title: 'Purple Dreams', difficulty: 'Medium' as const, gradient: ['#6a0dad', '#9370db', '#dda0dd'] },
        { id: 'abstract-005', title: 'Cherry Blossom', difficulty: 'Medium' as const, gradient: ['#ffb7c5', '#ffc0cb', '#ffd1dc'] },
      ]
    },
    {
      name: 'Seasonal',
      icon: '🍂',
      puzzles: [
        { id: 'seasonal-001', title: 'Autumn Leaves', difficulty: 'Easy' as const, gradient: ['#ff4500', '#ff8c00', '#ffa500'] },
        { id: 'seasonal-002', title: 'Winter Snow', difficulty: 'Medium' as const, gradient: ['#e0f7fa', '#b2ebf2', '#80deea'] },
        { id: 'seasonal-003', title: 'Spring Bloom', difficulty: 'Medium' as const, gradient: ['#ff69b4', '#ff1493', '#c71585'] },
      ]
    },
    {
      name: 'Cosmic & Space',
      icon: '🌌',
      puzzles: [
        { id: 'cosmic-001', title: 'Galaxy Spiral', difficulty: 'Hard' as const, gradient: ['#191970', '#8a2be2', '#ff69b4'] },
        { id: 'cosmic-002', title: 'Neon Nights', difficulty: 'Hard' as const, gradient: ['#ff00ff', '#00ffff', '#ffff00'] },
        { id: 'cosmic-003', title: 'Toxic Flares', difficulty: 'Hard' as const, gradient: ['#bb00bb', '#6fa84a', '#00bb00'] },

      ]
    }
  ];

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-navy-light rounded-2xl max-w-2xl w-full h-[85vh] shadow-2xl flex flex-col border-2 border-navy-dark">
        <div className="bg-navy-dark px-6 py-4 flex items-center justify-between flex-shrink-0 rounded-t-2xl border-b border-navy">
          <div>
            <h2 className="text-2xl font-bold text-offwhite flex items-center gap-2">
              📅 Puzzle Archive
            </h2>
            <p className="text-sm text-teal">Browse and play all puzzles</p>
          </div>
          <button onClick={onClose} className="text-coral hover:text-teal transition">
            <X size={24} />
          </button>
        </div>
        
        <div className="p-6 overflow-y-auto flex-1">
          <div className="mb-6 bg-navy-dark rounded-xl p-4 border border-navy">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-coral">{completedPuzzleIds.size}</div>
                <div className="text-sm text-teal">Puzzles Completed</div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-teal">
                  {Math.round((completedPuzzleIds.size / 15) * 100)}%
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
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {category.puzzles.map((puzzle) => {
                  const isCompleted = completedPuzzleIds.has(puzzle.id);
                  const isFavorite = favoritePuzzleIds.has(puzzle.id);

                  return (
                    <button
                      key={puzzle.id}
                      onClick={() => {
                        onStartPuzzle(puzzle);
                        onClose(); // Add this line
                        }}
                      className="relative group"
                    >
                      <div className="aspect-square rounded-xl overflow-hidden border-2 border-navy-dark hover:border-teal transition-all">
                        <div 
                          className="w-full h-full"
                          style={{ 
                            background: `linear-gradient(135deg, ${puzzle.gradient.join(', ')})` 
                          }}
                        />
                        {isCompleted && (
                          <div className="absolute top-2 left-2 bg-teal text-navy rounded-full p-1">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                              <polyline points="20 6 9 17 4 12"></polyline>
                            </svg>
                          </div>
                        )}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onToggleFavorite(puzzle.id);
                          }}
                          className="absolute top-2 right-2 bg-navy-dark/80 hover:bg-navy/80 rounded-full p-1.5 transition"
                        >
                          <svg 
                            width="16" 
                            height="16" 
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
                      <div className="mt-2 text-left">
                        <div className="text-offwhite text-xs font-semibold truncate">{puzzle.title}</div>
                        <div className={`text-[10px] font-medium ${
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
        </div>
      </div>
    </div>
  );
};