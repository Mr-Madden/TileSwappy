import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL!;
const serviceRoleKey = process.env.REACT_APP_SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !serviceRoleKey) {
  throw new Error('Missing Supabase admin environment variables!');
}

// Admin client with elevated permissions (bypasses RLS)
export const adminSupabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Upload image with admin privileges
export const adminUploadPuzzleImage = async (file: File, fileName: string) => {
  const { data, error } = await adminSupabase.storage
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
  const { data: urlData } = adminSupabase.storage
    .from('puzzle-images')
    .getPublicUrl(fileName);

  return urlData.publicUrl;
};

// Upload puzzle with admin privileges
export const adminUploadPuzzle = async (puzzle: {
  date: string;
  title: string;
  difficulty: string;
  gradient: string[];
  image_url?: string;
}) => {
  const { data, error } = await adminSupabase
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