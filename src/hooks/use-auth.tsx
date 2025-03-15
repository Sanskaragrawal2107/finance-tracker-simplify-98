
import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { UserRole, AuthUser } from '@/lib/types';

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  signUp: (email: string, password: string, name: string, role?: UserRole) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const fetchUserProfile = async (userId: string) => {
    try {
      console.log("Fetching user profile for ID:", userId);
      // Use type assertion to bypass TypeScript errors with Supabase
      const { data, error } = await (supabase
        .from('users') as any)
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Error fetching user profile:', error);
        return null;
      }

      console.log("Found user profile:", data);
      return data as AuthUser;
    } catch (error) {
      console.error('Error in fetchUserProfile:', error);
      return null;
    }
  };

  // Check active session and fetch user data on mount
  useEffect(() => {
    const checkSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session) {
          const profile = await fetchUserProfile(session.user.id);
          if (profile) {
            setUser(profile);
          }
        }
      } catch (error) {
        console.error('Session check error:', error);
      } finally {
        setLoading(false);
      }
    };

    checkSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setLoading(true);
        
        if (event === 'SIGNED_IN' && session) {
          console.log("Auth state change - SIGNED_IN:", session.user.id);
          const profile = await fetchUserProfile(session.user.id);
          if (profile) {
            console.log("Setting user with role:", profile.role);
            setUser(profile);
            
            // Redirect based on role
            if (profile.role === UserRole.ADMIN) {
              navigate('/admin');
            } else if (profile.role === UserRole.SUPERVISOR) {
              navigate('/expenses');
            } else {
              navigate('/dashboard');
            }
          }
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
          navigate('/');
        }
        
        setLoading(false);
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [navigate]);

  const login = async (email: string, password: string) => {
    try {
      setLoading(true);
      setError(null);
      
      console.log("Attempting login for:", email);
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        throw error;
      }

      if (data.user) {
        console.log("Login successful for:", data.user.id);
        const profile = await fetchUserProfile(data.user.id);
        if (profile) {
          console.log("Found user profile with role:", profile.role);
          setUser(profile);

          // Redirect based on role - forcing navigation
          console.log("Redirecting based on role:", profile.role);
          if (profile.role === UserRole.ADMIN) {
            console.log("Redirecting to /admin");
            navigate('/admin', { replace: true });
          } else if (profile.role === UserRole.SUPERVISOR) {
            console.log("Redirecting to /expenses");
            navigate('/expenses', { replace: true });
          } else {
            console.log("Redirecting to /dashboard");
            navigate('/dashboard', { replace: true });
          }
        } else {
          console.error("No user profile found for:", data.user.id);
          toast.error("User profile not found");
        }
      }
    } catch (error: any) {
      console.error('Login error:', error);
      setError(error.message || 'An error occurred during login');
      toast.error(error.message || 'An error occurred during login');
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (email: string, password: string, name: string, role: UserRole = UserRole.SUPERVISOR) => {
    try {
      setLoading(true);
      setError(null);
      
      // First, create the user in auth.users
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) {
        throw error;
      }

      if (data.user) {
        // Then, create a record in public.users with the same ID
        const { error: profileError } = await (supabase
          .from('users') as any)
          .insert({
            id: data.user.id,
            email: email,
            name: name,
            role: role
          });

        if (profileError) {
          console.error('Error creating user profile:', profileError);
          // Try to delete the auth user if profile creation fails
          await supabase.auth.admin.deleteUser(data.user.id);
          throw profileError;
        }

        toast.success('Registration successful! Please check your email for verification.');
      }
    } catch (error: any) {
      console.error('Signup error:', error);
      setError(error.message || 'An error occurred during registration');
      toast.error(error.message || 'An error occurred during registration');
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      setLoading(true);
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        throw error;
      }
      
      setUser(null);
      navigate('/');
    } catch (error: any) {
      console.error('Logout error:', error);
      toast.error(error.message || 'An error occurred during logout');
    } finally {
      setLoading(false);
    }
  };

  const value = {
    user,
    loading,
    error,
    login,
    logout,
    signUp
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
