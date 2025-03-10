
import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Eye, EyeOff, Lock, Mail } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { UserRole } from '@/lib/types';
import { supabase, ensureUserExists } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';

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
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const navigate = useNavigate();
  
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
    
    if (!selectedRole) {
      setError('Please select a role to continue');
      setLoading(false);
      return;
    }
    
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      
      if (error) {
        throw error;
      }
      
      if (data.user) {
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('role, full_name')
          .eq('id', data.user.id)
          .maybeSingle();
        
        if (profileError) {
          throw profileError;
        }
        
        // If profile doesn't exist, create a basic one with the selected role
        if (!profileData) {
          const defaultName = email.split('@')[0];
          
          // Insert a profile for this user with the selected role
          const { error: insertError } = await supabase
            .from('profiles')
            .insert({
              id: data.user.id,
              full_name: defaultName,
              role: selectedRole
            });
            
          if (insertError) {
            console.error('Failed to create profile:', insertError);
          }
          
          localStorage.setItem('userRole', selectedRole);
          localStorage.setItem('userName', defaultName);
          
          // Direct redirection based on selected role
          if (selectedRole === UserRole.SUPERVISOR) {
            navigate('/expenses');
          } else if (selectedRole === UserRole.ADMIN) {
            navigate('/admin');
          } else {
            navigate('/dashboard');
          }
          
          toast.success('Signed in successfully');
          return;
        }
        
        // Use the selected role rather than the profile role
        localStorage.setItem('userRole', selectedRole);
        localStorage.setItem('userName', profileData.full_name || email.split('@')[0]);
        
        console.log('Selected role:', selectedRole);
        
        if (selectedRole === UserRole.SUPERVISOR) {
          const { data: supervisorData, error: supervisorError } = await supabase
            .from('supervisors')
            .select('id')
            .eq('user_id', data.user.id)
            .maybeSingle();
          
          if (supervisorError && supervisorError.code !== 'PGRST116') {
            console.warn('Error fetching supervisor ID:', supervisorError);
          }
          
          if (supervisorData) {
            localStorage.setItem('supervisorId', supervisorData.id);
          } else {
            console.warn('No supervisor record found for this user. Creating one...');
            
            // Create a supervisor record if it doesn't exist
            const { data: newSupervisor, error: createError } = await supabase
              .from('supervisors')
              .insert({
                user_id: data.user.id,
                name: profileData.full_name || email.split('@')[0]
              })
              .select('id')
              .single();
              
            if (createError) {
              console.error('Failed to create supervisor record:', createError);
            } else if (newSupervisor) {
              localStorage.setItem('supervisorId', newSupervisor.id);
              console.log('Created new supervisor record:', newSupervisor);
            }
          }
          
          console.log('Redirecting supervisor to /expenses');
          navigate('/expenses');
        } else if (selectedRole === UserRole.ADMIN) {
          console.log('Redirecting admin to /admin');
          navigate('/admin');
        } else {
          console.log('Redirecting user to /dashboard');
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

  const setUserCredentials = (role: UserRole) => {
    const user = TEST_USERS.find(user => user.role === role);
    if (user) {
      setEmail(user.email);
      setPassword(user.password);
      setSelectedRole(role);
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
      
      <div className="mb-6">
        <div className="text-sm font-medium mb-2">Select your role</div>
        <div className="grid grid-cols-2 gap-3">
          <Button 
            type="button" 
            variant={selectedRole === UserRole.ADMIN ? "primary" : "outline"}
            className="justify-center py-2 h-auto"
            onClick={() => setSelectedRole(UserRole.ADMIN)}
          >
            Admin
          </Button>
          <Button 
            type="button" 
            variant={selectedRole === UserRole.SUPERVISOR ? "primary" : "outline"}
            className="justify-center py-2 h-auto"
            onClick={() => setSelectedRole(UserRole.SUPERVISOR)}
          >
            Supervisor
          </Button>
        </div>
      </div>
      
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
          disabled={loading || !selectedRole}
          className={cn(
            "w-full py-2 rounded-md bg-primary text-primary-foreground font-medium transition-all",
            (loading || !selectedRole) ? "opacity-70" : "hover:bg-primary/90"
          )}
        >
          {loading ? 'Signing in...' : 'Sign in'}
        </button>
        
        <div className="text-center text-sm text-muted-foreground mt-6">
          <p>Demo Credentials:</p>
          <div className="flex gap-2 mt-2">
            <Button 
              type="button" 
              variant="outline" 
              size="sm" 
              className="text-xs py-1 px-2 h-auto"
              onClick={() => setUserCredentials(UserRole.ADMIN)}
            >
              Use Admin
            </Button>
            <Button 
              type="button" 
              variant="outline" 
              size="sm" 
              className="text-xs py-1 px-2 h-auto"
              onClick={() => setUserCredentials(UserRole.SUPERVISOR)}
            >
              Use Supervisor
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default LoginForm;
