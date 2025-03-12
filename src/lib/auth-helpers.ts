
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { UserRole } from './types';

export type UserData = {
  id: string;
  email: string;
  role: "admin" | "supervisor" | "viewer";
  supervisorId?: string;
};

export const fetchUserRole = async (): Promise<{ role: string, supervisorId: string } | null> => {
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

    return {
      role: data.role,
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

        if (error) throw error;

        setUser({
          id: session.user.id,
          email: session.user.email || '',
          role: data.role as "admin" | "supervisor" | "viewer",  // Cast to the string literal type
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

export const isAdminUser = (role: string): boolean => {
  return role === 'admin';
};

export const isSupervisorUser = (role: string): boolean => {
  return role === 'supervisor';
};
