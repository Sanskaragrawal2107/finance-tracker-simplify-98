
import { supabase } from '@/integrations/supabase/client';
import { UserRole } from './types';
import { toast } from 'sonner';

/**
 * Checks if the current user has a specific role
 * Uses maybeSingle() to avoid errors when no profile exists
 */
export async function checkUserRole(requiredRole?: UserRole): Promise<{ 
  hasRole: boolean; 
  role: UserRole | null;
  userId: string | null;
}> {
  try {
    const { data: session } = await supabase.auth.getSession();
    if (!session.session) {
      return { hasRole: false, role: null, userId: null };
    }
    
    const userId = session.session.user.id;
    
    // Use maybeSingle() instead of single() to handle cases where no profile exists
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', userId)
      .maybeSingle();
    
    if (error) {
      console.error('Error checking user role:', error);
      return { hasRole: false, role: null, userId };
    }
    
    if (!profile) {
      // User is authenticated but doesn't have a profile yet
      console.info('User authenticated but no profile found');
      return { hasRole: false, role: null, userId };
    }
    
    const userRole = profile.role as UserRole;
    
    // If no specific role is required, just return the current role
    if (!requiredRole) {
      return { hasRole: true, role: userRole, userId };
    }
    
    // Check if user has the required role
    return { 
      hasRole: userRole === requiredRole, 
      role: userRole,
      userId
    };
  } catch (error) {
    console.error('Error in checkUserRole:', error);
    return { hasRole: false, role: null, userId: null };
  }
}

/**
 * Creates a profile for a user if it doesn't exist yet
 */
export async function ensureUserProfile(userId: string, role: UserRole, fullName?: string): Promise<boolean> {
  try {
    // Check if profile already exists
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', userId)
      .maybeSingle();
    
    if (existingProfile) {
      // Profile already exists
      return true;
    }
    
    // Create new profile
    const { error } = await supabase
      .from('profiles')
      .insert({
        id: userId,
        role,
        full_name: fullName
      });
    
    if (error) {
      console.error('Error creating user profile:', error);
      toast.error('Failed to create user profile');
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Error in ensureUserProfile:', error);
    return false;
  }
}
