import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables!');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    flowType: 'pkce'
  }
});

// Upload image to storage
export const uploadPuzzleImage = async (file: File, fileName: string) => {
  const { error } = await supabase.storage
    .from('puzzle-images')
    .upload(fileName, file, {
      cacheControl: '3600',
      upsert: false
    });

  if (error) {
    console.error('Error uploading image:', error);
    throw error;
  }

  // Get public URL
  const { data: urlData } = supabase.storage
    .from('puzzle-images')
    .getPublicUrl(fileName);

  return urlData.publicUrl;
};

// Fetch daily puzzle
export const getDailyPuzzle = async (date: string) => {
  const { data, error } = await supabase
    .from('daily_puzzles')
    .select('*')
    .eq('date', date)
    .single();
  
  if (error) {
    console.error('Error fetching puzzle:', error);
    return null;
  }
  
  return data;
};

// Fetch Factory-generated puzzles (puzzle_calendar joined to
// puzzles/puzzle_tiles) scheduled in a date range, shaped to match
// daily_puzzles' row shape plus a `tiles` array -- see
// db/migrations/0004_client_side_solution_read.sql (tileswappy-factory
// repo) for why anon can read puzzles/puzzle_tiles directly here
// (client-side win-check, matching daily_puzzles' existing model).
//
// A date can now have up to 3 calendar rows, one per difficulty tier
// (db/migrations/0006_puzzle_calendar_per_difficulty.sql) -- this groups
// them per date and returns ONE row per date (so callers built around
// "one puzzle per day", like the carousel card shape, keep working
// unchanged) defaulting to the medium variant, plus a `difficultyVariants`
// map carrying all tiers actually published that day for a picker UI.
export const getFactoryPuzzlesForDateRange = async (startDate: string, endDate: string) => {
  const { data, error } = await supabase
    .from('puzzle_calendar')
    .select(`
      scheduled_date,
      difficulty,
      puzzle:puzzles!inner (
        id,
        status,
        surface:surfaces (image_url, theme:themes (name, category, style_tag)),
        puzzle_tiles (tile_index, image_url, correct_position, correct_rotation)
      )
    `)
    .gte('scheduled_date', startDate)
    .lte('scheduled_date', endDate)
    .eq('puzzle.status', 'published');

  if (error) {
    console.error('Error fetching Factory puzzles:', error);
    return [];
  }

  const toVariant = (row: any) => ({
    difficulty: row.difficulty.charAt(0).toUpperCase() + row.difficulty.slice(1),
    image_url: row.puzzle.surface?.image_url,
    // Kept off the carousel card on purpose -- these power the post-solve
    // "You solved: X" reveal (App.tsx completion screen), which only
    // means something if the theme wasn't already visible before playing.
    themeName: row.puzzle.surface?.theme?.name,
    themeCategory: row.puzzle.surface?.theme?.category,
    themeStyleTag: row.puzzle.surface?.theme?.style_tag,
    tiles: (row.puzzle.puzzle_tiles || [])
      .sort((a: any, b: any) => a.tile_index - b.tile_index)
      .map((t: any) => ({
        tileIndex: t.tile_index,
        imageUrl: t.image_url,
        correctPosition: t.correct_position,
        correctRotation: t.correct_rotation
      }))
  });

  const byDate = new Map<string, Record<string, ReturnType<typeof toVariant>>>();
  for (const row of data || []) {
    const variants = byDate.get(row.scheduled_date) || {};
    variants[row.difficulty] = toVariant(row);
    byDate.set(row.scheduled_date, variants);
  }

  return Array.from(byDate.entries()).map(([date, variants]) => {
    const defaultVariant = variants.medium || variants.easy || variants.hard;
    return {
      date,
      title: `Puzzle for ${date}`,
      gradient: ['#ff6b6b', '#4ecdc4', '#45b7d1'],
      ...defaultVariant,
      difficultyVariants: variants
    };
  });
};

// Fetch week of puzzles -- merges Factory puzzles (getFactoryPuzzlesForDateRange)
// with the legacy daily_puzzles table, Factory taking priority for any
// date present in both (a date fully migrated to the Factory should
// stop showing its old daily_puzzles row).
export const getWeekPuzzles = async (startDate: string, endDate: string) => {
  const { data, error } = await supabase
    .from('daily_puzzles')
    .select('*')
    .gte('date', startDate)
    .lte('date', endDate)
    .order('date', { ascending: true });

  if (error) {
    console.error('Error fetching puzzles:', error);
    return [];
  }

  const factoryPuzzles = await getFactoryPuzzlesForDateRange(startDate, endDate);
  const factoryDates = new Set(factoryPuzzles.map(p => p.date));

  const merged = [
    ...factoryPuzzles,
    ...(data || []).filter((p: any) => !factoryDates.has(p.date))
  ];

  return merged.sort((a: any, b: any) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));
};

// Fetch month of puzzles for calendar -- merges Factory puzzles the
// same way getWeekPuzzles does (Factory takes priority for any date
// present in both), so StreakModal's calendar view doesn't miss them.
export const getMonthPuzzles = async (startDate: string, endDate: string) => {
  try {
    console.log('🔍 Querying Supabase for puzzles from:', startDate, 'to:', endDate);

    const { data, error } = await supabase
      .from('daily_puzzles')
      .select('*')
      .gte('date', startDate)
      .lte('date', endDate)
      .order('date', { ascending: true });

    if (error) {
      console.error('❌ Supabase error:', error);
      throw error;
    }

    const factoryPuzzles = await getFactoryPuzzlesForDateRange(startDate, endDate);
    const factoryDates = new Set(factoryPuzzles.map(p => p.date));
    const merged = [
      ...factoryPuzzles,
      ...(data || []).filter((p: any) => !factoryDates.has(p.date))
    ].sort((a: any, b: any) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));

    console.log('✅ Supabase returned', data?.length || 0, 'legacy +', factoryPuzzles.length, 'Factory puzzles');

    return merged;
  } catch (error) {
    console.error('❌ Error fetching month puzzles:', error);
    return [];
  }
};

// Upload puzzle with image and release time
export const uploadPuzzle = async (puzzle: {
  date: string;
  title: string;
  difficulty: string;
  gradient: string[];
  image_url?: string;
  release_time?: string; // ISO timestamp when puzzle becomes available
}) => {
  // If no release_time provided, default to the date at midnight UTC
  if (!puzzle.release_time) {
    puzzle.release_time = `${puzzle.date}T00:00:00Z`;
  }
  
  const { data, error } = await supabase
    .from('daily_puzzles')
    .insert([puzzle])
    .select()
    .single();
  
  if (error) {
    console.error('Error uploading puzzle:', error);
    throw error;
  }
  
  return data;
};

// Check if puzzle is unlocked
export const isPuzzleUnlocked = (releaseTime: string | undefined): boolean => {
  if (!releaseTime) return true; // If no release time, it's always available
  
  const now = new Date();
  const release = new Date(releaseTime);
  
  return now >= release;
};