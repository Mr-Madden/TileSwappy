import React, { useState, useMemo, useEffect } from 'react';
import { getCurrentDate, formatDisplayDate, addDays, getRelativeDayLabel } from '../../utils/helpers';
import { getWeekPuzzles } from '../../services/supabase';
import { IdleHintsPopup } from '../IdleHintsPopup';

interface HomeScreenProps {
  onStartPuzzle: (puzzle?: any) => void;
  onOpenArchive?: () => void;
  onOpenStreak?: () => void;
  onOpenStats?: () => void;
  onOpenSettings?: () => void;
  onOpenTutorial?: () => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({
  onStartPuzzle,
  onOpenArchive,
  onOpenStreak,
  onOpenStats,
  onOpenSettings,
  onOpenTutorial
}) => {
  const [carouselOffset, setCarouselOffset] = useState(0);
  const [carouselSwipeStart, setCarouselSwipeStart] = useState({ x: 0, y: 0, touching: false, startTime: 0 });
  const [realPuzzles, setRealPuzzles] = useState<any[]>([]);
  const [isLoadingPuzzles, setIsLoadingPuzzles] = useState(true);
  const [showIdleHints, setShowIdleHints] = useState(true);

  // Auto-load puzzles on mount - no authentication needed
  useEffect(() => {
    const fetchPuzzles = async () => {
      const today = getCurrentDate();
      const startDate = addDays(today, -3);
      const endDate = addDays(today, 3);
      
      console.log('=== PUZZLE FETCH DEBUG ===');
      console.log('Today:', today);
      console.log('Date range:', startDate, 'to', endDate);
      
      try {
        const puzzles = await getWeekPuzzles(startDate, endDate);
        console.log('Fetched puzzles:', puzzles);
        console.log('Number of puzzles:', puzzles?.length || 0);
        setRealPuzzles(puzzles || []);
        setCarouselOffset(0);
      } catch (error) {
        console.error('Failed to fetch puzzles:', error);
      } finally {
        setIsLoadingPuzzles(false);
      }
    };
    
    fetchPuzzles();
  }, []);

  useEffect(() => {
    setCarouselOffset(0);
  }, [realPuzzles]);

  const dailyPuzzles = useMemo(() => {
    const today = getCurrentDate();
    
    return Array.from({ length: 7 }, (_, index) => {
      const daysFromToday = index - 3;
      const dateStr = addDays(today, daysFromToday);
      const displayDate = formatDisplayDate(dateStr);
      const label = getRelativeDayLabel(daysFromToday);
      
      const realPuzzle = realPuzzles.find(p => p.date === dateStr);
      
      let status: 'past' | 'today' | 'future';
      if (daysFromToday < 0) status = 'past';
      else if (daysFromToday === 0) status = 'today';
      else status = 'future';
      
      const defaultGradients = [
        'linear-gradient(135deg, #4b5563, #6b7280)',
        'linear-gradient(135deg, #6b7280, #9ca3af)',
        'linear-gradient(135deg, #6b7280, #9ca3af, #d1d5db)',
        'linear-gradient(135deg, #ff6b6b, #4ecdc4, #45b7d1)',
        'linear-gradient(135deg, #8b5cf6, #ec4899, #f59e0b)',
        'linear-gradient(135deg, #3b82f6, #8b5cf6, #ec4899)',
        'linear-gradient(135deg, #10b981, #3b82f6, #8b5cf6)',
      ];
      
      const gradient = realPuzzle?.gradient 
        ? `linear-gradient(135deg, ${realPuzzle.gradient.join(', ')})`
        : defaultGradients[index];
      
      return {
        id: index,
        dateStr,
        date: displayDate,
        label,
        gradient,
        status,
        imageUrl: realPuzzle?.image_url,
        title: realPuzzle?.title || 'Daily Puzzle',
        difficulty: realPuzzle?.difficulty || 'Medium',
        realPuzzleData: realPuzzle
      };
    });
  }, [realPuzzles]);

  // Find today's puzzle
  const todaysPuzzle = dailyPuzzles.find(p => p.status === 'today');

  useEffect(() => {
    console.log('=== DAILY PUZZLES DEBUG ===');
    console.log('Daily puzzles array:', dailyPuzzles);
    console.log('Today puzzle:', todaysPuzzle);
    console.log('Today has real data:', todaysPuzzle?.realPuzzleData);
  }, [dailyPuzzles, todaysPuzzle]);

  const handleCarouselSwipeStart = (x: number, y: number) => {
    setCarouselSwipeStart({ x, y, touching: true, startTime: Date.now() });
  };

  const handleCarouselSwipeEnd = (x: number, y: number) => {
    if (!carouselSwipeStart.touching) return;
    
    const deltaX = x - carouselSwipeStart.x;
    const deltaY = y - carouselSwipeStart.y;
    const timeDelta = Date.now() - carouselSwipeStart.startTime;
    
    if (Math.abs(deltaX) > Math.abs(deltaY) * 1.5 && Math.abs(deltaX) > 30 && timeDelta < 500) {
      if (deltaX > 0) {
        setCarouselOffset((prev) => (prev - 1 + 7) % 7);
      } else {
        setCarouselOffset((prev) => (prev + 1) % 7);
      }
    }
    
    setCarouselSwipeStart({ x: 0, y: 0, touching: false, startTime: 0 });
  };

  return (
    <div className="min-h-screen bg-navy overflow-hidden">
      {/* Tutorial Button - Top Left - MOVED DOWN */}
      <button
        onClick={onOpenTutorial}
        aria-label="How to Play Tutorial"
        className="fixed top-24 left-6 bg-navy-light hover:bg-navy-dark rounded-xl transition shadow-lg z-50 border border-navy-dark flex flex-col items-center p-3 gap-1"
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#2EC4B6" strokeWidth="2">
          <circle cx="12" cy="12" r="10"></circle>
          <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path>
          <line x1="12" y1="17" x2="12.01" y2="17"></line>
        </svg>
        <span className="text-teal text-[10px] font-semibold">Tutorial</span>
      </button>

      {/* Settings Button - Top Right - MOVED DOWN */}
      <button
        onClick={onOpenSettings}
        aria-label="Settings"
        className="fixed top-24 right-6 bg-navy-light hover:bg-navy-dark rounded-xl transition shadow-lg z-50 border border-navy-dark flex flex-col items-center p-3 gap-1"
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#F4F4F4" strokeWidth="2">
          <circle cx="12" cy="12" r="3"></circle>
          <path d="M12 1v6m0 6v6"></path>
          <path d="M4.22 4.22l4.24 4.24m5.66 5.66l4.24 4.24"></path>
          <path d="M1 12h6m6 0h6"></path>
          <path d="M4.22 19.78l4.24-4.24m5.66-5.66l4.24-4.24"></path>
          <path d="M19.78 4.22l-4.24 4.24m-5.66 5.66l-4.24-4.24"></path>
          <path d="M23 12h-6m-6 0H1"></path>
          <path d="M20.78 19.78l-4.24-4.24m-5.66-5.66l-4.24-4.24"></path>
        </svg>
        <span className="text-offwhite text-[10px] font-semibold">Settings</span>
      </button>

      <div className="flex items-center justify-center p-4">
        <div className="max-w-md w-full py-8">
          {/* Logo and Title */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-36 h-36 bg-navy-light backdrop-blur-sm rounded-5xl mb-4 shadow-2xl border-2 border-navy-light">
              <img 
                src="/icon.png" 
                alt="TileSwappy Logo" 
                className="w-36 h-36 object-contain"
              />
            </div>
            <p className="text-teal text-lg font-medium">Addictive tile puzzle madness</p>
          </div>
          
          {/* Main Game Content - No login required */}
          <div className="space-y-6">
            {/* Daily Puzzle Carousel */}
            <div className="bg-navy-light/10 backdrop-blur-sm rounded-2xl p-6 border border-navy-light">
              <h2 className="text-offwhite text-lg font-semibold mb-4 text-center">Daily Puzzles</h2>
              
              <div 
                className="relative h-64 mb-4 overflow-hidden rounded-xl"
                onTouchStart={(e) => handleCarouselSwipeStart(e.touches[0].clientX, e.touches[0].clientY)}
                onTouchEnd={(e) => handleCarouselSwipeEnd(e.changedTouches[0].clientX, e.changedTouches[0].clientY)}
                onMouseDown={(e) => handleCarouselSwipeStart(e.clientX, e.clientY)}
                onMouseUp={(e) => handleCarouselSwipeEnd(e.clientX, e.clientY)}
              >
                {isLoadingPuzzles ? (
                  // Loading State
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center">
                      <div className="animate-spin rounded-full h-12 w-12 border-4 border-teal border-t-coral mx-auto mb-3"></div>
                      <div className="text-offwhite text-sm">Loading today's puzzle...</div>
                    </div>
                  </div>
                ) : (
                  <div className="relative w-full h-full">
                    {dailyPuzzles.map((day, index) => {
                      const centerOffset = (index - 3 - carouselOffset + 7) % 7;
                      const adjustedOffset = centerOffset > 3 ? centerOffset - 7 : centerOffset;
                      const xPos = adjustedOffset * 95;
                      const yPos = Math.abs(adjustedOffset) * 6;
                      
                      let scale = 1;
                      let width = 180;
                      let opacity = 1;
                      
                      if (adjustedOffset === 0) {
                        scale = 1.3;
                        width = 120;
                        opacity = 1;
                      } else if (Math.abs(adjustedOffset) === 1) {
                        scale = 0.85;
                        width = 105;
                        opacity = 1;
                      } else if (Math.abs(adjustedOffset) === 2) {
                        scale = 0.65;
                        width = 90;
                        opacity = 1;
                      } else if (Math.abs(adjustedOffset) === 3) {
                        scale = 0.5;
                        width = 75;
                        opacity = 1;
                      } else {
                        scale = 0.3;
                        width = 50;
                        opacity = 1;
                      }

                      const isToday = day.status === 'today';
                      const isCentered = adjustedOffset === 0;
                      const hasPuzzleData = !!day.realPuzzleData;

                      const cardStyle: React.CSSProperties = {
                        position: 'absolute',
                        left: '50%',
                        top: '50%',
                        transform: `translate3d(-50%, -50%, 0) translateX(${xPos}px) translateY(${yPos}px) scale(${scale})`,
                        transition: 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
                        width: `${width}px`,
                        opacity: opacity,
                        zIndex: 10 - Math.abs(adjustedOffset),
                        pointerEvents: (isCentered && isToday && hasPuzzleData ? 'auto' : 'none')
                      };

                      if (isToday && isCentered) {
                        return (
                          <div key={day.id} style={cardStyle}>
                            {hasPuzzleData ? (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  const puzzleData = {
                                    id: day.id,
                                    title: day.title,
                                    difficulty: day.difficulty,
                                    gradient: day.gradient.match(/#[a-fA-F0-9]{6}/g) || ['#FF4C4C', '#2EC4B6'],
                                    imageUrl: day.imageUrl,
                                    fromDatabase: !!day.realPuzzleData
                                  };
                                  onStartPuzzle(puzzleData);
                                }}
                                className="w-full transform hover:scale-105 transition-all"
                              >
                                <div className="rounded-2xl overflow-hidden border-4 border-coral shadow-coral-glow">
                                  <div className="aspect-square relative overflow-hidden">
                                    {day.imageUrl ? (
                                      <>
                                        <img src={day.imageUrl} alt={day.title} className="absolute inset-0 w-full h-full object-cover blur-sm opacity-70" />
                                        <div className="absolute inset-0 bg-gradient-to-br from-teal/30 to-coral/30" />
                                      </>
                                    ) : (
                                      <div className="w-full h-full bg-gradient-to-br from-teal to-coral" />
                                    )}
                                    <div className="absolute top-2 right-2 bg-coral text-offwhite text-xs font-bold px-2 py-1 rounded-full">TODAY</div>
                                  </div>
                                  <div className="p-3 text-center bg-gradient-to-b from-coral/20 to-transparent">
                                    <div className="text-offwhite text-sm font-bold">{day.label}</div>
                                    <div className="text-teal text-xs">{day.date}</div>
                                  </div>
                                </div>
                              </button>
                            ) : (
                              <div className="w-full">
                                <div className="rounded-2xl overflow-hidden border-4 border-navy-light bg-navy-dark">
                                  <div className="aspect-square relative overflow-hidden flex items-center justify-center">
                                    <div className="text-center p-4">
                                      <div className="text-3xl mb-2">😔</div>
                                      <div className="text-offwhite text-xs font-semibold mb-1">No Puzzle</div>
                                      <div className="text-teal text-[10px]">Check back later</div>
                                    </div>
                                  </div>
                                  <div className="p-3 text-center bg-gradient-to-b from-navy-light/20 to-transparent">
                                    <div className="text-offwhite text-sm font-bold">{day.label}</div>
                                    <div className="text-teal text-xs">{day.date}</div>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      }

                      return (
                        <div key={day.id} style={cardStyle}>
                          <div className="bg-navy-dark rounded-xl overflow-hidden border-2 border-navy-light">
                            <div className="aspect-square relative overflow-hidden">
                              {day.imageUrl ? (
                                <>
                                  <img src={day.imageUrl} alt={day.title} className="absolute inset-0 w-full h-full object-cover blur-md opacity-60" />
                                  <div className="absolute inset-0 bg-navy/60" />
                                </>
                              ) : (
                                <div className="w-full h-full bg-navy-light" />
                              )}
                              {day.status === 'past' && (
                                <div className="absolute inset-0 flex items-center justify-center bg-navy/40">
                                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#2EC4B6" strokeWidth="3">
                                    <polyline points="20 6 9 17 4 12"></polyline>
                                  </svg>
                                </div>
                              )}
                              {day.status === 'future' && (
                                <div className="absolute inset-0 flex items-center justify-center bg-navy/60">
                                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#FF4C4C" strokeWidth="2">
                                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                                    <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                                  </svg>
                                </div>
                              )}
                            </div>
                            <div className="p-2 text-center">
                              <div className="text-offwhite text-xs font-semibold truncate">{day.label}</div>
                              <div className="text-teal text-[10px]">{day.date}</div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <p className="text-teal text-[12px] text-center mb-6">
                Swipe to browse • New puzzles release at midnight
              </p>

              {/* Stats Row */}
              <div className="grid grid-cols-3 gap-2">
                <button 
                  data-button="archive"
                  onClick={onOpenArchive}
                  className="bg-navy-dark hover:bg-navy rounded-xl p-3 transition border border-navy-light"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#F4F4F4" strokeWidth="2" className="mx-auto mb-1">
                    <rect x="3" y="3" width="7" height="7"></rect>
                    <rect x="14" y="3" width="7" height="7"></rect>
                    <rect x="14" y="14" width="7" height="7"></rect>
                    <rect x="3" y="14" width="7" height="7"></rect>
                  </svg>
                  <p className="text-[15px] text-offwhite font-semibold">Archive</p>
                  <p className="text-[12px] text-teal">Browse</p>
                </button>

                <button 
                  data-button="streak"
                  onClick={onOpenStreak}
                  className="bg-navy-dark hover:bg-navy rounded-xl p-3 transition border border-navy-light"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#FF4C4C" strokeWidth="2" className="mx-auto mb-1">
                    <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"></path>
                  </svg>
                  <p className="text-[15px] text-offwhite font-semibold">Streak</p>
                  <p className="text-[12px] text-teal">Track</p>
                </button>

                <button 
                  data-button="stats"
                  onClick={onOpenStats}
                  className="bg-navy-dark hover:bg-navy rounded-xl p-3 transition border border-navy-light"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#F4F4F4" strokeWidth="2" className="mx-auto mb-1">
                    <line x1="12" y1="20" x2="12" y2="10"></line>
                    <line x1="18" y1="20" x2="18" y2="4"></line>
                    <line x1="6" y1="20" x2="6" y2="16"></line>
                  </svg>
                  <p className="text-[15px] text-offwhite font-semibold">Stats</p>
                  <p className="text-[12px] text-teal">View</p>
                </button>
              </div>        
            </div>
          </div>
        </div>
      </div>

      {/* Idle Hints Popup */}
      {showIdleHints && (
        <IdleHintsPopup
          onOpenArchive={onOpenArchive || (() => console.log('onOpenArchive not provided'))}
          onOpenStreak={onOpenStreak || (() => console.log('onOpenStreak not provided'))}
          onOpenStats={onOpenStats || (() => console.log('onOpenStats not provided'))}
        />
      )}
    </div>
  );
};