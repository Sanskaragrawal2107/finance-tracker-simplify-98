
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { UserRole } from './types';

export type UserData = {
  id: string;
  email: string;
  role: UserRole;
  supervisorId?: string;
};

export const fetchUserRole = async (): Promise<{ role: UserRole, supervisorId?: string } | null> => {
  try {
    // Get the current user session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) throw sessionError;
    if (!session) return null;

    // Get the user's role from the users table
    const { data, error } = await supabase
      .from('users')
      .select('role, supervisor_id')
      .eq('id', session.user.id)
      .maybeSingle();

    if (error) throw error;
    if (!data) return null;

    console.log("Fetched user role data:", data);

    return {
      role: data.role as UserRole,
      supervisorId: data.supervisor_id
    };
  } catch (error) {
    console.error('Error fetching user role:', error);
    return null;
  }
};

export const useCurrentUser = () => {
  const [user, setUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUser = async () => {
      try {
        // Get the current user session
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session) {
          setLoading(false);
          return;
        }

        // Get the user's role from the users table
        const { data, error } = await supabase
          .from('users')
          .select('role, supervisor_id')
          .eq('id', session.user.id)
          .single();

        if (error) {
          console.error('Error fetching user data:', error);
          throw error;
        }

        console.log("User data fetched:", data);

        // Store supervisor ID in localStorage
        if (data.supervisor_id) {
          console.log("Setting supervisor_id in localStorage:", data.supervisor_id);
          localStorage.setItem('supervisorId', data.supervisor_id);
        } else {
          console.warn("No supervisor_id found for user");
        }

        setUser({
          id: session.user.id,
          email: session.user.email || '',
          role: data.role as UserRole,
          supervisorId: data.supervisor_id
        });
      } catch (error) {
        console.error('Error fetching user data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUser();

    // Subscribe to auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' && session) {
          fetchUser();
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
          localStorage.removeItem('supervisorId');
          navigate('/');
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [navigate]);

  return { user, loading };
};

export const isAdminUser = (role: UserRole): boolean => {
  return role === UserRole.ADMIN;
};

export const isSupervisorUser = (role: UserRole): boolean => {
  return role === UserRole.SUPERVISOR;
};
