
import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { Eye, EyeOff, Lock, Mail } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { UserRole } from '@/lib/types';

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
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    
    // Simulate login API call
    setTimeout(() => {
      setLoading(false);
      
      // Demo credentials for testing
      if (email === 'admin@example.com' && password === 'password') {
        // Store user info in localStorage or a state management solution
        localStorage.setItem('userRole', UserRole.ADMIN);
        localStorage.setItem('userName', 'Admin User');
        navigate('/dashboard');
      } else if (email === 'supervisor@example.com' && password === 'password') {
        localStorage.setItem('userRole', UserRole.SUPERVISOR);
        localStorage.setItem('userName', 'Supervisor User');
        navigate('/expenses'); // Direct supervisors to expenses page
      } else if (email === 'viewer@example.com' && password === 'password') {
        localStorage.setItem('userRole', UserRole.VIEWER);
        localStorage.setItem('userName', 'Viewer User');
        navigate('/dashboard');
      } else {
        setError('Invalid email or password');
      }
    }, 1000);
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
          <p className="mt-1">Admin: admin@example.com</p>
          <p>Supervisor: supervisor@example.com</p>
          <p>Viewer: viewer@example.com</p>
          <p className="mt-1">Password: password</p>
        </div>
      </form>
    </div>
  );
};

export default LoginForm;
