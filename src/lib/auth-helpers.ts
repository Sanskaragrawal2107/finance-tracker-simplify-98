
import { supabase } from '@/integrations/supabase/client';
import { UserRole } from './types';

export const registerUser = async (
  email: string, 
  password: string, 
  role: UserRole = UserRole.SUPERVISOR, 
  supervisorId?: string
) => {
  try {
    // Register user with Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
    });
    
    if (authError) throw authError;
    
    // If it's a supervisor, update the supervisorId in the users table
    if (authData.user && (role === UserRole.SUPERVISOR) && supervisorId) {
      const { error: updateError } = await supabase
        .from('users')
        .update({ 
          role,
          supervisor_id: supervisorId
        })
        .eq('id', authData.user.id);
      
      if (updateError) throw updateError;
    }
    
    return { success: true, user: authData.user };
  } catch (error) {
    console.error('Registration error:', error);
    return { success: false, error };
  }
};

export const updateUserRole = async (userId: string, role: UserRole, supervisorId?: string) => {
  try {
    const { error } = await supabase
      .from('users')
      .update({ 
        role,
        supervisor_id: supervisorId
      })
      .eq('id', userId);
    
    if (error) throw error;
    
    return { success: true };
  } catch (error) {
    console.error('Update user role error:', error);
    return { success: false, error };
  }
};

export const signOut = async () => {
  try {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    
    localStorage.removeItem('userRole');
    localStorage.removeItem('userName');
    localStorage.removeItem('supervisorId');
    
    return { success: true };
  } catch (error) {
    console.error('Sign out error:', error);
    return { success: false, error };
  }
};
