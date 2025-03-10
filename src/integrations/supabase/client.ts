
import { createClient } from '@supabase/supabase-js';
import { Database } from './types';

const supabaseUrl = 'https://ejwfqmacjzheawhxvhfw.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVqd2ZxbWFjanpoZWF3aHh2aGZ3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDE1ODc3MzIsImV4cCI6MjA1NzE2MzczMn0.7_cQFZGS6Zfhu0hJnzP96ZYLcKIm2jr1jEs4gH7Vgfs';

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);

// Helper function to format date objects for Supabase
export const formatDateForSupabase = (date: Date): string => {
  return date.toISOString();
};

// Wait function to help with rate limiting
const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Helper function to create test users for development
export const createTestUser = async (email: string, password: string, role: 'admin' | 'supervisor', fullName: string) => {
  try {
    // First try to sign in to check if user exists
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (!signInError) {
      console.log(`User with email ${email} already exists and credentials are valid`);
      return;
    }
    
    // Add a small delay to avoid rate limiting
    await wait(500);
    
    // Create new user
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          role: role,
        }
      }
    });
    
    if (error) {
      if (error.message.includes('rate limit') || error.status === 429) {
        console.log(`Rate limited when creating ${email}. Will try again later.`);
      } else {
        console.error('Error creating test user:', error.message);
      }
      return;
    }
    
    console.log(`Test user created: ${email} with role ${role}`);
    
    // If user is supervisor, we need to create supervisor record
    if (role === 'supervisor' && data.user) {
      // Wait for auth trigger to create profile
      await wait(1500);
      
      // Create supervisor record
      const { error: supervisorError } = await supabase
        .from('supervisors')
        .insert({
          name: fullName,
          email: email,
          user_id: data.user.id
        });
      
      if (supervisorError) {
        console.error('Error creating supervisor record:', supervisorError.message);
      }
    }
    
    return data;
  } catch (error) {
    console.error('Error in createTestUser:', error);
  }
};
