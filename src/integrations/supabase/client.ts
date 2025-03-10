
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = "https://jourdleqqgzkwdaylrcc.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpvdXJkbGVxcWd6a3dkYXlscmNjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDE2MDM0NzUsImV4cCI6MjA1NzE3OTQ3NX0.7s1WzoYy-t72agRmpoA_CP_MOykOZkhUFQ5jNqWEs0o";

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

// Helper function to assign a role to a user
export const assignRoleToUser = async (userId: string, role: 'admin' | 'supervisor' | 'viewer') => {
  const { error } = await supabase
    .from('user_roles')
    .insert({ user_id: userId, role });
  
  if (error) {
    console.error('Error assigning role:', error);
    return false;
  }
  
  return true;
};

// Get the primary role for the current user
export const getCurrentUserRole = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) return null;
  
  // Use the get_primary_role function we created in the database
  const { data, error } = await supabase.rpc('get_primary_role', {
    _user_id: user.id
  });
  
  if (error) {
    console.error('Error getting user role:', error);
    return null;
  }
  
  return data;
};
