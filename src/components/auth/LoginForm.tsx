import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Eye, EyeOff, Lock, Mail } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { UserRole } from '@/lib/types';
import { supabase, ensureUserExists } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface LoginFormProps {
  className?: string;
}

const TEST_USERS = [
  {
    email: 'finance.admin@example.com',
    password: 'Admin@12345',
    full_name: 'Finance Admin',
    role: UserRole.ADMIN
  },
  {
    email: 'site.supervisor@example.com',
    password: 'Super@12345',
    full_name: 'Site Supervisor',
    role: UserRole.SUPERVISOR
  }
];

const LoginForm: React.FC<LoginFormProps> = ({ className }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const navigate = useNavigate();
  
  // Create test users on component mount
  useEffect(() => {
    const createTestUsers = async () => {
      try {
        for (const user of TEST_USERS) {
          await ensureUserExists(user.email, user.password, {
            full_name: user.full_name,
            role: user.role
          });
        }
      } catch (err) {
        console.error('Error creating test users:', err);
      }
    };
    
    createTestUsers();
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
        localStorage.setItem('userRole', profileData.role || UserRole.VIEWER);
        localStorage.setItem('userName', profileData.full_name || email.split('@')[0]);
        
        // If user is supervisor, fetch supervisor ID
        if (profileData.role === UserRole.SUPERVISOR) {
          const { data: supervisorData, error: supervisorError } = await supabase
            .from('supervisors')
            .select('id')
            .eq('user_id', data.user.id)
            .single();
          
          if (supervisorError && supervisorError.code !== 'PGRST116') {
            console.warn('Error fetching supervisor ID:', supervisorError);
          }
          
          if (supervisorData) {
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
      setError(err.message || 'Failed to sign in');
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
          disabled={loading}
          className={cn(
            "w-full py-2 rounded-md bg-primary text-primary-foreground font-medium transition-all",
            loading ? "opacity-70" : "hover:bg-primary/90"
          )}
        >
          {loading ? 'Signing in...' : 'Sign in'}
        </button>
        
        <div className="text-center text-sm text-muted-foreground mt-6">
          <p>Demo Credentials:</p>
          <p className="mt-1">Admin: finance.admin@example.com</p>
          <p>Password: Admin@12345</p>
          <p className="mt-1">Supervisor: site.supervisor@example.com</p>
          <p>Password: Super@12345</p>
        </div>
      </form>
    </div>
  );
};

export default LoginForm;
