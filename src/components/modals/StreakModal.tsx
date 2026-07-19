import React, { useState, useEffect } from 'react';
import { Zap, ChevronLeft, ChevronRight, Trophy, Lock, Clock } from 'lucide-react';
import { getCurrentDate } from '../../utils/helpers';
import { getMonthPuzzles, isPuzzleUnlocked } from '../../services/supabase';
import { ModalShell } from '../common/ModalShell';

interface StreakModalProps {
  onClose: () => void;
  completedDates: Set<string>;
  onDateSelect: (dateStr: string, puzzleData?: any) => void;
  userScores?: Map<string, number>;
}

export const StreakModal: React.FC<StreakModalProps> = ({ 
  onClose, 
  completedDates,
  onDateSelect,
  userScores = new Map()
}) => {
  const todayDate = new Date();
  const [currentMonth, setCurrentMonth] = useState(todayDate.getMonth());
  const [currentYear, setCurrentYear] = useState(todayDate.getFullYear());
  const [allPuzzleData, setAllPuzzleData] = useState<Map<string, any>>(new Map());
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [hoveredDate, setHoveredDate] = useState<string | null>(null);

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  // Load ALL puzzles when modal opens
  useEffect(() => {
    const fetchAllPuzzles = async () => {
      setIsInitialLoading(true);
      try {
        console.log('🔄 Loading ALL puzzles for calendar...');
        
        const startDate = new Date();
        startDate.setFullYear(startDate.getFullYear() - 1);
        const endDate = new Date();
        endDate.setMonth(endDate.getMonth() + 1);
        
        const startDateStr = startDate.toISOString().split('T')[0];
        const endDateStr = endDate.toISOString().split('T')[0];
        
        console.log('📅 Fetching puzzles from:', startDateStr, 'to', endDateStr);
        
        const puzzles = await getMonthPuzzles(startDateStr, endDateStr);
        
        console.log('🎯 Total puzzles loaded:', puzzles.length);
        
        const dataMap = new Map(puzzles.map(p => [p.date, p]));
        
        setAllPuzzleData(dataMap);
        preloadPuzzleImages(puzzles);
      } catch (error) {
        console.error('❌ Failed to fetch puzzles:', error);
      } finally {
        setIsInitialLoading(false);
      }
    };

    fetchAllPuzzles();
  }, []);

  const preloadPuzzleImages = (puzzles: any[]) => {
    puzzles.forEach(puzzle => {
      if (puzzle.image_url) {
        const img = new Image();
        img.src = puzzle.image_url;
      } else if (puzzle.imageUrl) {
        const img = new Image();
        img.src = puzzle.imageUrl;
      }
    });
  };

  const getDaysInMonth = (month: number, year: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (month: number, year: number) => {
    return new Date(year, month, 1).getDay();
  };

  const formatTimeUntilUnlock = (releaseTime: string): string => {
    const now = new Date();
    const release = new Date(releaseTime);
    const diff = release.getTime() - now.getTime();
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 24) {
      const days = Math.floor(hours / 24);
      return `${days}d`;
    } else if (hours > 0) {
      return `${hours}h`;
    } else if (minutes > 0) {
      return `${minutes}m`;
    } else {
      return 'Soon';
    }
  };

  const generateCalendar = () => {
    const daysInMonth = getDaysInMonth(currentMonth, currentYear);
    const firstDay = getFirstDayOfMonth(currentMonth, currentYear);
    const days = [];
    const todayStr = getCurrentDate();

    for (let i = 0; i < firstDay; i++) {
      days.push(null);
    }

    for (let i = 1; i <= daysInMonth; i++) {
      const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
      const puzzleData = allPuzzleData.get(dateStr);
      const hasAdminPuzzle = !!puzzleData;
      const isCompleted = completedDates.has(dateStr);
      const isToday = dateStr === todayStr;

      days.push({
        day: i,
        dateStr,
        hasAdminPuzzle,
        isCompleted,
        isToday,
        puzzleData
      });
    }

    return days;
  };

  const handleDateClick = (dateStr: string, hasAdminPuzzle: boolean, isUnlocked: boolean, isFutureDate: boolean, puzzleData?: any) => {
    // Prevent clicking on future dates
    if (isFutureDate) {
      console.log('🚫 Cannot play future puzzle:', dateStr);
      return;
    }
    
    if (hasAdminPuzzle && isUnlocked) {
      console.log('🎯 Date clicked:', dateStr);
      console.log('📦 Puzzle data being passed:', puzzleData);
      onDateSelect(dateStr, puzzleData);
      onClose();
    } else if (hasAdminPuzzle && !isUnlocked) {
      console.log('🔒 Puzzle is locked until:', puzzleData?.release_time);
    }
  };

  const goToPreviousMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const goToNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  const renderPuzzleThumbnail = (puzzleData: any) => {
    if (!puzzleData) return null;
    
    if (puzzleData.image_url) {
      return (
        <img 
          src={puzzleData.image_url} 
          alt="Puzzle thumbnail"
          className="w-full h-full object-cover"
          loading="eager"
        />
      );
    }
    
    if (puzzleData.imageUrl) {
      return (
        <img 
          src={puzzleData.imageUrl} 
          alt="Puzzle thumbnail"
          className="w-full h-full object-cover"
          loading="eager"
        />
      );
    }
    
    if (puzzleData.gradient && Array.isArray(puzzleData.gradient)) {
      return (
        <div 
          className="w-full h-full"
          style={{
            background: `linear-gradient(135deg, ${puzzleData.gradient.join(', ')})`
          }}
        />
      );
    }
    
    return (
      <div 
        className="w-full h-full"
        style={{
          background: 'linear-gradient(135deg, #FF6B6B, #4ECDC4, #45b7d1)'
        }}
      />
    );
  };

  const calendar = generateCalendar();
  const todayStr = getCurrentDate();
  
  const adminPuzzleDates = Array.from(allPuzzleData.keys());
  const totalAdminPuzzles = adminPuzzleDates.length;
  
  const currentMonthStart = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-01`;
  const currentMonthEnd = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-31`;
  const completedAdminPuzzles = adminPuzzleDates.filter(date => 
    completedDates.has(date) && date >= currentMonthStart && date <= currentMonthEnd
  ).length;

  return (
    <ModalShell
      onClose={onClose}
      title="Your Puzzle Calendar"
      titleIcon={Zap}
      subtitle="Click any unlocked puzzle to play"
      maxWidth="lg"
      bodyClassName="p-6"
      footer={
        <button
          onClick={onClose}
          className="w-full bg-gradient-to-r from-coral to-teal hover:from-coral-dark hover:to-teal-dark text-offwhite font-bold py-3 px-6 rounded-xl transition shadow-lg"
        >
          Continue Playing
        </button>
      }
    >
          {/* Stats */}
          <div className="bg-black/20 rounded-xl p-4 mb-4">
            <div className="flex justify-between items-center">
              <div className="text-center">
                <div className="text-3xl font-bold text-teal">{completedDates.size}</div>
                <div className="text-xs text-white/60">Total Completed</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-teal">{completedAdminPuzzles}</div>
                <div className="text-xs text-white/60">This Month</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-coral">
                  {totalAdminPuzzles > 0 ? Math.round((completedDates.size / totalAdminPuzzles) * 100) : 0}%
                </div>
                <div className="text-xs text-white/60">Overall</div>
              </div>
            </div>
          </div>

          {/* Month Navigation */}
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={goToPreviousMonth}
              className="bg-white/10 hover:bg-white/20 p-2 rounded-lg transition"
            >
              <ChevronLeft className="text-white" size={20} />
            </button>
            <div className="text-white font-bold text-lg">
              {monthNames[currentMonth]} {currentYear}
            </div>
            <button
              onClick={goToNextMonth}
              className="bg-white/10 hover:bg-white/20 p-2 rounded-lg transition"
            >
              <ChevronRight className="text-white" size={20} />
            </button>
          </div>

          {/* Calendar */}
          <div className="bg-black/20 rounded-xl p-4">
            {isInitialLoading ? (
              <div className="flex flex-col items-center justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-teal border-t-coral mb-4"></div>
                <p className="text-white/60 text-sm">Loading puzzle calendar...</p>
              </div>
            ) : (
              <>
                {/* Day Headers */}
                <div className="grid grid-cols-7 gap-2 text-center mb-2">
                  {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                    <div key={day} className="text-xs text-white/60 font-semibold">
                      {day}
                    </div>
                  ))}
                </div>

                {/* Calendar Days */}
                <div className="grid grid-cols-7 gap-2">
                  {calendar.map((day, index) => {
                    if (!day) {
                      return <div key={`empty-${index}`} className="aspect-square"></div>;
                    }

                    const { day: dayNum, dateStr, hasAdminPuzzle, isCompleted, isToday, puzzleData } = day;
                    const userScore = userScores.get(dateStr);
                    const isHovered = hoveredDate === dateStr;
                    
                    // Determine status based on date and unlock time
                    const isFutureDate = dateStr > todayStr;
                    const isUnlocked = puzzleData ? isPuzzleUnlocked(puzzleData.release_time) : false;

                    // No admin puzzle - empty
                    if (!hasAdminPuzzle) {
                      return (
                        <div
                          key={dayNum}
                          className="aspect-square rounded-lg flex items-center justify-center text-sm font-semibold bg-white/5 text-white/20"
                        >
                          {dayNum}
                        </div>
                      );
                    }

                    // Future date (tomorrow or later) - show as "Coming Soon"
                    if (isFutureDate) {
                      return (
                        <div
                          key={dayNum}
                          onMouseEnter={() => setHoveredDate(dateStr)}
                          onMouseLeave={() => setHoveredDate(null)}
                          className={`aspect-square rounded-lg relative overflow-hidden transition-all cursor-not-allowed`}
                        >
                          {/* Blurred Thumbnail Background */}
                          <div className="absolute inset-0 blur-sm scale-110 opacity-50">
                            {renderPuzzleThumbnail(puzzleData)}
                          </div>
                          
                          {/* Future overlay */}
                          <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center">
                            <Clock size={16} className="text-blue-400 mb-1" />
                            <div className="text-[9px] text-blue-300 font-bold">Coming</div>
                          </div>

                          {/* Day number */}
                          <div className="absolute top-0.5 left-0.5 text-[10px] font-bold text-white bg-black/70 px-1.5 py-0.5 rounded z-10">
                            {dayNum}
                          </div>
                        </div>
                      );
                    }

                    // Past or today, but LOCKED (not released yet based on time)
                    if (!isUnlocked && !isCompleted) {
                      return (
                        <div
                          key={dayNum}
                          onMouseEnter={() => setHoveredDate(dateStr)}
                          onMouseLeave={() => setHoveredDate(null)}
                          className={`aspect-square rounded-lg relative overflow-hidden transition-all cursor-not-allowed ${
                            isToday
                              ? 'ring-2 ring-yellow-500 ring-offset-2 ring-offset-navy-light'
                              : ''
                          }`}
                        >
                          {/* Blurred Thumbnail Background */}
                          <div className="absolute inset-0 blur-sm scale-110">
                            {renderPuzzleThumbnail(puzzleData)}
                          </div>
                          
                          {/* Lock overlay */}
                          <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center">
                            <Lock size={16} className="text-yellow-500 mb-1" />
                            {isHovered && puzzleData?.release_time ? (
                              <div className="text-[9px] text-yellow-300 font-bold flex items-center gap-1">
                                <Clock size={10} />
                                {formatTimeUntilUnlock(puzzleData.release_time)}
                              </div>
                            ) : (
                              <div className="text-[9px] text-yellow-300 font-bold">Locked</div>
                            )}
                          </div>

                          {/* Day number */}
                          <div className="absolute top-0.5 left-0.5 text-[10px] font-bold text-white bg-black/70 px-1.5 py-0.5 rounded z-10">
                            {dayNum}
                          </div>
                        </div>
                      );
                    }

                    // Has puzzle, UNLOCKED but not completed - AVAILABLE TO PLAY
                    if (isUnlocked && !isCompleted) {
                      return (
                        <button
                          key={dayNum}
                          onClick={() => handleDateClick(dateStr, hasAdminPuzzle, isUnlocked, isFutureDate, puzzleData)}
                          onMouseEnter={() => setHoveredDate(dateStr)}
                          onMouseLeave={() => setHoveredDate(null)}
                          className={`aspect-square rounded-lg relative overflow-hidden transition-all shadow-lg hover:scale-105 cursor-pointer group ${
                            isToday
                              ? 'ring-2 ring-coral ring-offset-2 ring-offset-navy-light'
                              : ''
                          }`}
                        >
                          {/* Puzzle Thumbnail */}
                          <div className="absolute inset-0">
                            {renderPuzzleThumbnail(puzzleData)}
                          </div>
                          
                          {/* Hover overlay */}
                          <div className="absolute inset-0 bg-black/60 group-hover:bg-black/40 transition flex items-center justify-center">
                            {isHovered ? (
                              <div className="flex flex-col items-center gap-1">
                                <svg 
                                  width="20" 
                                  height="20" 
                                  viewBox="0 0 24 24" 
                                  fill="none" 
                                  stroke="white" 
                                  strokeWidth="2"
                                >
                                  <polygon points="5 3 19 12 5 21 5 3"></polygon>
                                </svg>
                                <span className="text-xs text-white font-bold">Play</span>
                              </div>
                            ) : (
                              <div className="w-8 h-8 bg-coral/80 rounded-full flex items-center justify-center">
                                <svg 
                                  width="16" 
                                  height="16" 
                                  viewBox="0 0 24 24" 
                                  fill="white" 
                                  stroke="white" 
                                  strokeWidth="2"
                                >
                                  <polygon points="5 3 19 12 5 21 5 3"></polygon>
                                </svg>
                              </div>
                            )}
                          </div>

                          {/* Day number */}
                          <div className="absolute top-0.5 left-0.5 text-[10px] font-bold text-white bg-black/70 px-1.5 py-0.5 rounded z-10">
                            {dayNum}
                          </div>
                        </button>
                      );
                    }

                    // Completed puzzle - CAN REPLAY
                    return (
                      <button
                        key={dayNum}
                        onClick={() => handleDateClick(dateStr, hasAdminPuzzle, isUnlocked, isFutureDate, puzzleData)}
                        onMouseEnter={() => setHoveredDate(dateStr)}
                        onMouseLeave={() => setHoveredDate(null)}
                        className={`aspect-square rounded-lg relative overflow-hidden transition-all shadow-lg hover:scale-105 cursor-pointer group ${
                          isToday
                            ? 'ring-2 ring-white ring-offset-2 ring-offset-navy-light'
                            : ''
                        }`}
                      >
                        {/* Puzzle Thumbnail */}
                        <div className="absolute inset-0">
                          {renderPuzzleThumbnail(puzzleData)}
                        </div>
                        
                        {/* Checkmark overlay */}
                        <div className="absolute inset-0 bg-black/30 group-hover:bg-black/20 transition flex items-center justify-center">
                          {isHovered ? (
                            <div className="flex flex-col items-center gap-1">
                              <Trophy size={18} className="text-white drop-shadow-lg" />
                              <span className="text-[10px] text-white font-bold drop-shadow-lg">Replay</span>
                            </div>
                          ) : (
                            <div className="flex flex-col items-center">
                              <div className="w-7 h-7 bg-teal rounded-full flex items-center justify-center text-white text-sm font-bold shadow-lg">
                                ✓
                              </div>
                              {userScore && (
                                <div className="text-[10px] text-white font-bold mt-1 bg-black/60 px-1.5 py-0.5 rounded">
                                  {userScore}
                                </div>
                              )}
                            </div>
                          )}
                        </div>

                        {/* Day number */}
                        <div className="absolute top-0.5 left-0.5 text-[10px] font-bold text-white bg-black/70 px-1.5 py-0.5 rounded drop-shadow-lg z-10">
                          {dayNum}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </>
            )}
          </div>

          {/* Legend */}
          <div className="mt-4 flex justify-center gap-4 text-xs flex-wrap">
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 bg-teal rounded flex items-center justify-center text-white text-[10px] shadow">✓</div>
              <span className="text-white/60">Completed</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 bg-coral/80 rounded flex items-center justify-center">
                <svg width="10" height="10" viewBox="0 0 24 24" fill="white">
                  <polygon points="5 3 19 12 5 21 5 3"></polygon>
                </svg>
              </div>
              <span className="text-white/60">Available</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 bg-black/60 rounded flex items-center justify-center">
                <Lock size={10} className="text-yellow-500" />
              </div>
              <span className="text-white/60">Locked</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 bg-black/80 rounded flex items-center justify-center">
                <Clock size={10} className="text-blue-400" />
              </div>
              <span className="text-white/60">Coming</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 bg-white/5 rounded"></div>
              <span className="text-white/60">No Puzzle</span>
            </div>
          </div>
    </ModalShell>
  );
};