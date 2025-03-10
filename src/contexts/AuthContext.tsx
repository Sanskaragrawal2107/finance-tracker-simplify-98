
import React, { createContext, useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase, getCurrentUserRole } from '@/integrations/supabase/client';
import { User } from '@supabase/supabase-js';
import { toast } from 'sonner';
import { UserRole } from '@/lib/types';

interface AuthContextProps {
  user: User | null;
  role: UserRole | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, fullName: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextProps | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const navigate = useNavigate();

  // Check initial auth state and set up subscription
  useEffect(() => {
    const fetchUserAndRole = async () => {
      try {
        // Get current session
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session?.user) {
          setUser(session.user);
          
          // Fetch user role from our custom function
          const userRole = await getCurrentUserRole();
          if (userRole) {
            setRole(userRole as UserRole);
            
            // Save role in localStorage for compatibility with existing code
            localStorage.setItem('userRole', userRole);
            localStorage.setItem('userName', session.user.email || 'User');
          }
        }
      } catch (error) {
        console.error('Error fetching user:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchUserAndRole();
    
    // Subscribe to auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      setUser(session?.user || null);
      
      if (session?.user) {
        const userRole = await getCurrentUserRole();
        if (userRole) {
          setRole(userRole as UserRole);
          localStorage.setItem('userRole', userRole);
          localStorage.setItem('userName', session.user.email || 'User');
        }
        
        // Redirect based on role
        if (userRole === 'admin') {
          navigate('/admin');
        } else if (userRole === 'supervisor') {
          navigate('/expenses');
        } else {
          navigate('/dashboard');
        }
      } else {
        setRole(null);
        localStorage.removeItem('userRole');
        localStorage.removeItem('userName');
      }
    });
    
    return () => {
      subscription.unsubscribe();
    };
  }, [navigate]);

  // Sign in function
  const signIn = async (email: string, password: string) => {
    try {
      setLoading(true);
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) throw error;
      
      // Roles and redirects are handled by the auth state change listener
    } catch (error: any) {
      toast.error(error.message || 'Error signing in');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Sign up function
  const signUp = async (email: string, password: string, fullName: string) => {
    try {
      setLoading(true);
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          },
        },
      });
      
      if (error) throw error;
      
      toast.success('Registration successful! Please verify your email.');
    } catch (error: any) {
      toast.error(error.message || 'Error signing up');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Sign out function
  const signOut = async () => {
    try {
      await supabase.auth.signOut();
      navigate('/');
    } catch (error: any) {
      toast.error(error.message || 'Error signing out');
    }
  };

  return (
    <AuthContext.Provider value={{ user, role, loading, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
