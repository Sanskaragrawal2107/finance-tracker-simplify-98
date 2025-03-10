
import { createClient } from '@supabase/supabase-js';
import { UserRole } from '@/lib/types';

const supabaseUrl = 'https://ejwfqmacjzheawhxvhfw.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVqd2ZxbWFjanpoZWF3aHh2aGZ3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDE1ODc3MzIsImV4cCI6MjA1NzE2MzczMn0.7_cQFZGS6Zfhu0hJnzP96ZYLcKIm2jr1jEs4gH7Vgfs';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Add function to create a user if it doesn't exist
export const ensureUserExists = async (email: string, password: string, userData: { full_name: string, role: UserRole }) => {
  try {
    // First check if user exists by trying to sign in
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    
    // If sign in succeeds, user exists
    if (signInData.user) {
      console.log('User exists, signed in successfully');
      return { user: signInData.user, error: null };
    }
    
    // If error is not "invalid_credentials", there might be another issue
    if (signInError && signInError.message !== 'Invalid login credentials') {
      console.error('Error signing in:', signInError);
      return { user: null, error: signInError };
    }
    
    // User doesn't exist, try to create one
    console.log('User does not exist, creating new user...');
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: userData.full_name,
          role: userData.role
        }
      }
    });
    
    if (signUpError) {
      console.error('Error creating user:', signUpError);
      return { user: null, error: signUpError };
    }
    
    console.log('User created successfully');
    return { user: signUpData.user, error: null };
    
  } catch (error) {
    console.error('Unexpected error:', error);
    return { user: null, error };
  }
};

export type Database = any;
