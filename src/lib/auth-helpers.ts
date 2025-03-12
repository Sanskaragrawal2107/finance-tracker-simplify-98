import { supabase } from '@/integrations/supabase/client';
import { UserRole } from '@/lib/types';

interface UserData {
  id: string;
  email: string;
  role: string;
  supervisor_id?: string;
}

interface LocalStorageData {
  userId: string;
  email: string;
  role: UserRole;
  supervisorId?: string;
}

export const signInWithEmail = async (email: string, password: string): Promise<boolean> => {
  try {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      console.error('Error signing in:', error.message);
      return false;
    }

    // Fetch user data from the users table
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single();

    if (userError) {
      console.error('Error fetching user data:', userError.message);
      return false;
    }

    // Store user data in localStorage
    const localStorageData: LocalStorageData = {
      userId: userData.id,
      email: userData.email,
      role: userData.role as UserRole,
      supervisorId: userData.supervisor_id,
    };

    localStorage.setItem('userData', JSON.stringify(localStorageData));
    localStorage.setItem('userRole', localStorageData.role);
    if (localStorageData.supervisorId) {
      localStorage.setItem('supervisorId', localStorageData.supervisorId);
    }

    return true;
  } catch (error: any) {
    console.error('Error during sign in:', error.message);
    return false;
  }
};

export const signOut = async (): Promise<void> => {
  try {
    await supabase.auth.signOut();
    localStorage.removeItem('userData');
    localStorage.removeItem('userRole');
    localStorage.removeItem('supervisorId');
    localStorage.removeItem('selectedSiteId');
  } catch (error: any) {
    console.error('Error signing out:', error.message);
  }
};

export const isAuthenticated = async (): Promise<boolean> => {
  try {
    const { data } = await supabase.auth.getSession();
    return !!data.session;
  } catch (error) {
    return false;
  }
};

export const getUserRole = (): UserRole | null => {
  const userDataString = localStorage.getItem('userData');
  if (!userDataString) return null;
  
  try {
    const userData = JSON.parse(userDataString) as LocalStorageData;
    return userData.role;
  } catch (error) {
    return null;
  }
};

export const getSupervisorId = (): string | null => {
  return localStorage.getItem('supervisorId');
};
