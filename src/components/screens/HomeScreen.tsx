import React, { useState, useMemo, useEffect, useRef } from 'react';
import { HelpCircle, Settings, Check, Lock, LayoutGrid, Flame, BarChart2 } from 'lucide-react';
import { getCurrentDate, formatDisplayDate, addDays, getRelativeDayLabel } from '../../utils/helpers';
import { getWeekPuzzles } from '../../services/supabase';
import { IdleHintsPopup } from '../IdleHintsPopup';
import { TileSwappyLogo } from '../TileSwappyLogo/TileSwappyLogo';

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
  const [showIdleHints] = useState(true);
  const [selectedDifficulty, setSelectedDifficulty] = useState<'Easy' | 'Medium' | 'Hard'>('Medium');

  // The carousel's card widths/positions used to be fixed pixel constants
  // tuned for the old max-w-md (~416px usable) container -- widening the
  // container on desktop alone would've just left the same small cards
  // floating in more empty space instead of actually filling it. Measuring
  // the carousel's real width and scaling every constant relative to that
  // 416px baseline keeps the exact proportions/spacing that were already
  // tuned, just applied fluidly to however wide the container actually is.
  const CAROUSEL_BASELINE_WIDTH = 416;
  const [carouselWidth, setCarouselWidth] = useState(CAROUSEL_BASELINE_WIDTH);
  const carouselRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const el = carouselRef.current;
    if (!el || typeof ResizeObserver === 'undefined') return;

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) return;
      setCarouselWidth(entry.contentRect.width);
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Capped both directions -- floor keeps cards legible on very narrow
  // phones, ceiling keeps them from ballooning to an odd size on
  // ultra-wide desktop windows.
  const carouselScale = Math.min(1.8, Math.max(0.85, carouselWidth / CAROUSEL_BASELINE_WIDTH));

  // Factory puzzles can publish up to 3 difficulty tiers for the same
  // date (db/migrations/0006_puzzle_calendar_per_difficulty.sql); a
  // legacy daily_puzzles row has none, so falls back to itself untouched.
  const getVariantForDifficulty = (realPuzzleData: any, difficulty: string) => {
    const variants = realPuzzleData?.difficultyVariants;
    return variants?.[difficulty.toLowerCase()] ?? realPuzzleData;
  };

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
    <div className="min-h-screen bg-navy overflow-hidden flex items-center justify-center p-4">
      {/* Tutorial Button - Top Left */}
      <button
        onClick={onOpenTutorial}
        aria-label="How to Play Tutorial"
        className="fixed top-20 left-4 bg-navy-light hover:bg-navy-dark rounded-lg transition shadow-lg z-50 border border-navy-dark flex flex-col items-center p-2 gap-0.5"
      >
        <HelpCircle size={18} className="text-teal" />
        <span className="text-teal text-[9px] font-semibold">Tutorial</span>
      </button>

      {/* Settings Button - Top Right */}
      <button
        onClick={onOpenSettings}
        aria-label="Settings"
        className="fixed top-20 right-4 bg-navy-light hover:bg-navy-dark rounded-lg transition shadow-lg z-50 border border-navy-dark flex flex-col items-center p-2 gap-0.5"
      >
        <Settings size={18} className="text-offwhite" />
        <span className="text-offwhite text-[9px] font-semibold">Settings</span>
      </button>

      <div className="max-w-md md:max-w-2xl lg:max-w-3xl w-full py-4">
          {/* Logo and Title */}
          <div className="text-center mb-4">
            <div className="inline-block mb-2 rounded-2xl shadow-2xl">
              <TileSwappyLogo size={96} />
            </div>
            <p className="text-teal text-sm font-medium">Addictive tile puzzle madness</p>
          </div>

          {/* Main Game Content - No login required */}
          <div className="space-y-4">
            {/* Daily Puzzle Carousel */}
            <div className="bg-navy-light/10 backdrop-blur-sm rounded-2xl p-4 border border-navy-light">
              <h2 className="text-offwhite text-base font-semibold mb-2 text-center">Daily Puzzles</h2>

              <div
                ref={carouselRef}
                className="relative mb-3 overflow-hidden rounded-xl"
                // Cards are square-based (aspect-square + a text footer),
                // so a wider card is also a taller one -- this used to be
                // a fixed h-80 (320px) regardless of carouselScale, which
                // is exactly why a scaled-up desktop card ended up taller
                // than its own container and got clipped top/bottom. 320px
                // was the baseline height tuned for carouselScale === 1,
                // so it needs to scale right along with the cards.
                style={{ height: 320 * carouselScale }}
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
                      // Every size/position constant below is tuned for
                      // CAROUSEL_BASELINE_WIDTH and scaled by carouselScale
                      // (the carousel's actual measured width relative to
                      // that baseline), so cards fill however wide the
                      // container really is instead of just floating in
                      // extra empty space on a wider desktop screen.
                      const xPos = adjustedOffset * 119 * carouselScale;
                      const yPos = Math.abs(adjustedOffset) * 7.5 * carouselScale;

                      let scale = 1;
                      let width = 225 * carouselScale;
                      let opacity = 1;

                      if (adjustedOffset === 0) {
                        scale = 1.3;
                        width = 150 * carouselScale;
                        opacity = 1;
                      } else if (Math.abs(adjustedOffset) === 1) {
                        scale = 0.85;
                        width = 131 * carouselScale;
                        opacity = 1;
                      } else if (Math.abs(adjustedOffset) === 2) {
                        scale = 0.65;
                        width = 113 * carouselScale;
                        opacity = 1;
                      } else if (Math.abs(adjustedOffset) === 3) {
                        scale = 0.5;
                        width = 94 * carouselScale;
                        opacity = 1;
                      } else {
                        scale = 0.3;
                        width = 63 * carouselScale;
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
                                  const variant = getVariantForDifficulty(day.realPuzzleData, selectedDifficulty);
                                  const puzzleData = {
                                    id: day.id,
                                    title: day.title,
                                    difficulty: day.realPuzzleData?.difficultyVariants ? selectedDifficulty : day.difficulty,
                                    gradient: day.gradient.match(/#[a-fA-F0-9]{6}/g) || ['#FF4C4C', '#2EC4B6'],
                                    imageUrl: variant?.image_url ?? day.imageUrl,
                                    tiles: variant?.tiles,
                                    themeName: variant?.themeName,
                                    themeCategory: variant?.themeCategory,
                                    themeStyleTag: variant?.themeStyleTag,
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
                                        {/* The image itself always renders at full opacity --
                                            dimming comes from the dark scrim on top instead
                                            (its own opacity is the "transparency" amount), so
                                            solving today's puzzle is still the first time you
                                            see the actual picture clearly. */}
                                        <img src={day.imageUrl} alt={day.title} className="absolute inset-0 w-full h-full object-cover" />
                                        <div className="absolute inset-0 bg-navy" style={{ opacity: 0.5 }} />
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
                                  {/* The image itself always renders at full opacity --
                                      dimming comes from the dark scrim on top instead
                                      (its own opacity is the "transparency" amount).
                                      Already-completed puzzles have nothing left to
                                      spoil, so they get no scrim at all. Today's
                                      puzzle stays scrimmed here too, not just in its
                                      own centered/isToday render above -- this branch
                                      also renders today's card once it's swiped off
                                      center, and status stays 'today' regardless of
                                      carousel position. */}
                                  <img
                                    src={day.imageUrl}
                                    alt={day.title}
                                    className="absolute inset-0 w-full h-full object-cover"
                                  />
                                  {day.status !== 'past' && (
                                    <div
                                      className="absolute inset-0 bg-navy"
                                      style={{ opacity: day.status === 'today' ? 0.5 : 0.75 }}
                                    />
                                  )}
                                </>
                              ) : (
                                <div className="w-full h-full bg-navy-light" />
                              )}
                              {day.status === 'past' && (
                                <div className="absolute top-1.5 right-1.5 bg-teal rounded-full p-1 shadow">
                                  <Check size={14} strokeWidth={3} className="text-navy-dark" />
                                </div>
                              )}
                              {day.status === 'future' && (
                                <div className="absolute inset-0 flex items-center justify-center">
                                  <Lock size={24} className="text-coral" />
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

              {todaysPuzzle?.realPuzzleData?.difficultyVariants &&
                Object.keys(todaysPuzzle.realPuzzleData.difficultyVariants).length > 1 && (
                  <div className="flex justify-center gap-2 mb-2">
                    {(['Easy', 'Medium', 'Hard'] as const).map((tier) => {
                      const available = tier.toLowerCase() in todaysPuzzle.realPuzzleData.difficultyVariants;
                      const isSelected = selectedDifficulty === tier;
                      return (
                        <button
                          key={tier}
                          disabled={!available}
                          onClick={() => setSelectedDifficulty(tier)}
                          className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${
                            isSelected
                              ? 'bg-coral text-offwhite'
                              : available
                              ? 'bg-navy-light text-teal hover:bg-navy-dark'
                              : 'bg-navy-light/40 text-teal/30 cursor-not-allowed'
                          }`}
                        >
                          {tier}
                        </button>
                      );
                    })}
                  </div>
                )}

              <p className="text-teal text-[11px] text-center mb-3">
                Swipe to browse • New puzzles release at midnight
              </p>

              {/* Stats Row */}
              <div className="grid grid-cols-3 gap-2">
                <button
                  data-button="archive"
                  onClick={onOpenArchive}
                  className="bg-navy-dark hover:bg-navy rounded-xl p-2 transition border border-navy-light"
                >
                  <LayoutGrid size={18} className="text-offwhite mx-auto mb-0.5" />
                  <p className="text-[13px] text-offwhite font-semibold">Archive</p>
                  <p className="text-[11px] text-teal">Browse</p>
                </button>

                <button
                  data-button="streak"
                  onClick={onOpenStreak}
                  className="bg-navy-dark hover:bg-navy rounded-xl p-2 transition border border-navy-light"
                >
                  <Flame size={18} className="text-coral mx-auto mb-0.5" />
                  <p className="text-[13px] text-offwhite font-semibold">Streak</p>
                  <p className="text-[11px] text-teal">Track</p>
                </button>

                <button
                  data-button="stats"
                  onClick={onOpenStats}
                  className="bg-navy-dark hover:bg-navy rounded-xl p-2 transition border border-navy-light"
                >
                  <BarChart2 size={18} className="text-offwhite mx-auto mb-0.5" />
                  <p className="text-[13px] text-offwhite font-semibold">Stats</p>
                  <p className="text-[11px] text-teal">View</p>
                </button>
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