
import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Eye, EyeOff, Lock, Mail } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { UserRole } from '@/lib/types';
import { supabase, createTestUser } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface LoginFormProps {
  className?: string;
}

const LoginForm: React.FC<LoginFormProps> = ({ className }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [creatingTestUsers, setCreatingTestUsers] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const navigate = useNavigate();
  
  // Helper function to create test users with throttling
  const setupTestUsers = async () => {
    if (creatingTestUsers) return;
    
    setCreatingTestUsers(true);
    toast.info("Setting up test users, please wait...");
    
    try {
      // Create admin user first
      await createTestUser('admin@example.com', 'adminpassword', 'admin', 'Admin User');
      
      // Wait before creating supervisor users to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Create just one supervisor to avoid rate limits
      await createTestUser('supervisor1@example.com', 'password', 'supervisor', 'Mithlesh Singh');
      
      toast.success("Test users set up successfully!");
    } catch (error) {
      console.error("Error setting up test users:", error);
      toast.error("Failed to set up test users");
    } finally {
      setCreatingTestUsers(false);
    }
  };
  
  // Create test users when component loads - but only once
  useEffect(() => {
    const hasCreatedUsers = localStorage.getItem('hasCreatedTestUsers');
    if (!hasCreatedUsers) {
      setupTestUsers();
      localStorage.setItem('hasCreatedTestUsers', 'true');
    }
  }, []);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    
    try {
      // Sign in with Supabase
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      
      if (error) {
        throw error;
      }
      
      if (data.user) {
        // Fetch user profile to get role
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('role, full_name')
          .eq('id', data.user.id)
          .single();
        
        if (profileError) {
          throw profileError;
        }
        
        // Store user info in localStorage
        localStorage.setItem('userRole', profileData.role);
        localStorage.setItem('userName', profileData.full_name || email.split('@')[0]);
        
        // If user is supervisor, fetch supervisor ID
        if (profileData.role === UserRole.SUPERVISOR) {
          const { data: supervisorData, error: supervisorError } = await supabase
            .from('supervisors')
            .select('id')
            .eq('user_id', data.user.id)
            .single();
          
          if (supervisorError) {
            console.warn('Could not fetch supervisor ID:', supervisorError);
          } else if (supervisorData) {
            localStorage.setItem('supervisorId', supervisorData.id);
          }
        }
        
        // Redirect based on user role
        if (profileData.role === UserRole.ADMIN) {
          navigate('/admin');
        } else if (profileData.role === UserRole.SUPERVISOR) {
          navigate('/expenses');
        } else {
          navigate('/dashboard');
        }
        
        toast.success('Signed in successfully');
      }
    } catch (err: any) {
      console.error('Login error:', err);
      if (err.message === 'Invalid login credentials') {
        setError('Invalid email or password. Please check your credentials and try again.');
      } else {
        setError(err.message || 'Failed to sign in');
      }
      toast.error('Failed to sign in');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className={cn("w-full max-w-md px-8 py-12 bg-card rounded-lg shadow-subtle border animate-fade-in", className)}>
      <div className="text-center mb-8">
        <div className="h-12 w-12 rounded-md bg-primary flex items-center justify-center mx-auto mb-4">
          <span className="text-primary-foreground font-semibold text-xl">F</span>
        </div>
        <h1 className="text-2xl font-semibold">FinTrack</h1>
        <p className="text-muted-foreground mt-2">Sign in to your account</p>
      </div>
      
      {error && (
        <div className="mb-6 p-3 bg-red-50 border border-red-200 text-red-600 rounded-md text-sm">
          {error}
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-2">
          <label htmlFor="email" className="text-sm font-medium">
            Email
          </label>
          <div className="relative">
            <Mail className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              className="w-full py-2 pl-10 pr-4 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
              required
            />
          </div>
        </div>
        
        <div className="space-y-2">
          <label htmlFor="password" className="text-sm font-medium">
            Password
          </label>
          <div className="relative">
            <Lock className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              className="w-full py-2 pl-10 pr-10 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground"
            >
              {showPassword ? (
                <EyeOff className="h-5 w-5" />
              ) : (
                <Eye className="h-5 w-5" />
              )}
            </button>
          </div>
        </div>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <input
              id="remember"
              type="checkbox"
              className="h-4 w-4 border border-gray-300 rounded"
            />
            <label htmlFor="remember" className="ml-2 text-sm text-muted-foreground">
              Remember me
            </label>
          </div>
          <a href="#" className="text-sm text-primary hover:text-primary/90 transition-colors">
            Forgot password?
          </a>
        </div>
        
        <button
          type="submit"
          disabled={loading || creatingTestUsers}
          className={cn(
            "w-full py-2 rounded-md bg-primary text-primary-foreground font-medium transition-all",
            (loading || creatingTestUsers) ? "opacity-70" : "hover:bg-primary/90"
          )}
        >
          {loading ? 'Signing in...' : creatingTestUsers ? 'Setting up users...' : 'Sign in'}
        </button>
        
        <div className="text-center text-sm text-muted-foreground mt-6">
          <p className="font-semibold">Demo Credentials:</p>
          <div className="mt-2 p-3 bg-blue-50 border border-blue-100 rounded-md">
            <p className="mb-1"><span className="font-medium">Admin:</span> admin@example.com</p>
            <p className="text-sm text-blue-600">Password: adminpassword</p>
            
            <div className="mt-3 pt-3 border-t border-blue-100">
              <p className="mb-1"><span className="font-medium">Supervisor:</span> supervisor1@example.com</p>
              <p className="text-sm text-blue-600">Password: password</p>
            </div>
          </div>
          
          {creatingTestUsers && (
            <p className="mt-2 text-amber-600">Setting up test users...</p>
          )}
        </div>
      </form>
    </div>
  );
};

export default LoginForm;
