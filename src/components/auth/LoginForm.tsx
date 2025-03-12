
import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { Eye, EyeOff, Lock, Mail } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { UserRole } from '@/lib/types';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface LoginFormProps {
  className?: string;
}

const LoginForm: React.FC<LoginFormProps> = ({ className }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const navigate = useNavigate();
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    
    try {
      // Sign in with Supabase
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      
      if (authError) throw authError;

      // Get user profile to check role
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('role, supervisor_id')
        .eq('id', data.user?.id)
        .single();

      if (userError) throw userError;
      
      console.log("Login successful, user data:", userData);
      
      // Store user info in localStorage
      const userRole = userData.role as UserRole;
      localStorage.setItem('userRole', userRole);
      localStorage.setItem('userName', email.split('@')[0] || 'User');
      
      if (userData.supervisor_id) {
        console.log("Setting supervisorId in localStorage:", userData.supervisor_id);
        localStorage.setItem('supervisorId', userData.supervisor_id);
      } else {
        console.warn("No supervisor_id found for user");
      }
      
      // Redirect based on role
      if (userRole === UserRole.ADMIN) {
        navigate('/admin');
      } else if (userRole === UserRole.SUPERVISOR) {
        navigate('/expenses');
      } else {
        navigate('/dashboard');
      }
      
      toast.success('Login successful');
    } catch (err: any) {
      console.error('Login error:', err);
      setError(err.message || 'Failed to login. Please check your credentials.');
      toast.error('Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  // Demo login functions for quick testing
  const loginAsAdmin = async () => {
    setEmail('admin@example.com');
    setPassword('password');
  };

  const loginAsSupervisor = async () => {
    setEmail('supervisor@example.com');
    setPassword('password');
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
          <p>Demo Logins:</p>
          <div className="flex justify-center gap-2 mt-2">
            <button
              type="button"
              onClick={loginAsAdmin}
              className="text-primary hover:underline"
            >
              Admin Login
            </button>
            <span>|</span>
            <button
              type="button"
              onClick={loginAsSupervisor}
              className="text-primary hover:underline"
            >
              Supervisor Login
            </button>
          </div>
          <p className="mt-2 text-xs">Click to prefill, then submit.</p>
        </div>
      </form>
    </div>
  );
};

export default LoginForm;
