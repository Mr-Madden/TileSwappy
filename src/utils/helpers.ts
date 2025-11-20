export const formatTime = (ms: number): string => {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  const centiseconds = Math.floor((ms % 1000) / 10);
  
  if (minutes > 0) {
    return `${minutes}:${seconds.toString().padStart(2, '0')}.${centiseconds.toString().padStart(2, '0')}`;
  }
  return `${seconds}.${centiseconds.toString().padStart(2, '0')}s`;
};

export const getCurrentDate = (): string => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  
  const result = `${year}-${month}-${day}`;
  console.log('getCurrentDate:', result);
  return result;
};

export const formatDisplayDate = (dateStr: string): string => {
  // Parse YYYY-MM-DD
  const [year, month, day] = dateStr.split('-').map(num => parseInt(num, 10));
  
  // Create date in local timezone (month is 0-indexed in JS)
  const date = new Date(year, month - 1, day);
  
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  
  const displayMonth = months[date.getMonth()];
  const displayDay = date.getDate();
  
  return `${displayMonth} ${displayDay}`;
};

export const addDays = (dateStr: string, days: number): string => {
  // Parse YYYY-MM-DD
  const [year, month, day] = dateStr.split('-').map(num => parseInt(num, 10));
  
  // Create date (month is 0-indexed)
  const date = new Date(year, month - 1, day);
  
  // Add days
  date.setDate(date.getDate() + days);
  
  // Format back to YYYY-MM-DD
  const newYear = date.getFullYear();
  const newMonth = String(date.getMonth() + 1).padStart(2, '0');
  const newDay = String(date.getDate()).padStart(2, '0');
  
  return `${newYear}-${newMonth}-${newDay}`;
};

export const getRelativeDayLabel = (daysFromToday: number): string => {
  if (daysFromToday === -3) return '3 Days Ago';
  if (daysFromToday === -2) return '2 Days Ago';
  if (daysFromToday === -1) return 'Yesterday';
  if (daysFromToday === 0) return 'Today';
  if (daysFromToday === 1) return 'Tomorrow';
  if (daysFromToday === 2) return 'In 2 Days';
  if (daysFromToday === 3) return 'In 3 Days';
  return `${Math.abs(daysFromToday)} days ${daysFromToday > 0 ? 'from now' : 'ago'}`;
};