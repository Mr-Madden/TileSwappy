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
  const { data, error } = await supabase.storage
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

// Fetch week of puzzles
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
  
  return data;
};

// Fetch month of puzzles for calendar
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
    
    console.log('✅ Supabase returned', data?.length || 0, 'puzzles');
    console.log('📦 First puzzle:', data?.[0]);
    
    return data || [];
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