
import React, { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Eye, EyeOff, Mail, User, Key } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';

const Auth: React.FC = () => {
  const { user, signIn, signUp, loading } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  
  // Login form state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  
  // Register form state
  const [registerEmail, setRegisterEmail] = useState('');
  const [registerPassword, setRegisterPassword] = useState('');
  const [registerConfirmPassword, setRegisterConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  
  // If user is already authenticated, redirect to appropriate page
  if (user) {
    const userRole = localStorage.getItem('userRole');
    if (userRole === 'admin') return <Navigate to="/admin" replace />;
    if (userRole === 'supervisor') return <Navigate to="/expenses" replace />;
    return <Navigate to="/dashboard" replace />;
  }
  
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      console.log('Attempting login with:', loginEmail, loginPassword);
      await signIn(loginEmail, loginPassword);
    } catch (error: any) {
      // Error is already handled in the signIn function
      console.error('Login error in component:', error);
    }
  };
  
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (registerPassword !== registerConfirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    
    try {
      await signUp(registerEmail, registerPassword, fullName);
    } catch (error) {
      // Error is already handled in the signUp function
    }
  };

  const loginWithDemoCredentials = async (role: string) => {
    let email = '';
    const password = 'password';
    
    switch (role) {
      case 'admin':
        email = 'admin@example.com';
        break;
      case 'supervisor':
        email = 'supervisor@example.com';
        break;
      case 'viewer':
        email = 'viewer@example.com';
        break;
      default:
        return;
    }
    
    try {
      setLoginEmail(email);
      setLoginPassword(password);
      console.log(`Demo login with ${role}:`, email, password);
      await signIn(email, password);
    } catch (error) {
      console.error(`Error signing in as ${role}:`, error);
    }
  };
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-tr from-blue-50 to-indigo-50 p-4">
      <div className="absolute inset-0 z-0 overflow-hidden">
        <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full bg-blue-100 blur-3xl opacity-70 animate-pulse" style={{ animationDuration: '8s' }}></div>
        <div className="absolute top-1/4 -right-24 w-96 h-96 rounded-full bg-indigo-100 blur-3xl opacity-70 animate-pulse" style={{ animationDuration: '10s' }}></div>
        <div className="absolute -bottom-24 left-1/3 w-96 h-96 rounded-full bg-cyan-100 blur-3xl opacity-70 animate-pulse" style={{ animationDuration: '12s' }}></div>
      </div>
      
      <div className="z-10 w-full max-w-md">
        <div className="bg-card rounded-lg shadow-subtle border p-8">
          <div className="text-center mb-6">
            <div className="h-12 w-12 rounded-md bg-primary flex items-center justify-center mx-auto mb-4">
              <span className="text-primary-foreground font-semibold text-xl">F</span>
            </div>
            <h1 className="text-2xl font-semibold">FinTrack</h1>
            <p className="text-muted-foreground mt-2">Manage your finances with ease</p>
          </div>
          
          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">Login</TabsTrigger>
              <TabsTrigger value="register">Register</TabsTrigger>
            </TabsList>
            
            <TabsContent value="login">
              <form onSubmit={handleLogin} className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <div className="relative">
                    <Mail className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      placeholder="Enter your email"
                      className="pl-10"
                      required
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <div className="relative">
                    <Key className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      placeholder="Enter your password"
                      className="pl-10 pr-10"
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
                
                <Button
                  type="submit"
                  className="w-full"
                  disabled={loading}
                >
                  {loading ? 'Signing in...' : 'Sign in'}
                </Button>
                
                <div className="text-center text-sm text-muted-foreground mt-6">
                  <p>Demo Login:</p>
                  <div className="grid grid-cols-3 gap-2 mt-2">
                    <Button 
                      type="button" 
                      variant="outline" 
                      size="sm"
                      onClick={() => loginWithDemoCredentials('admin')}
                      disabled={loading}
                    >
                      Admin
                    </Button>
                    <Button 
                      type="button" 
                      variant="outline" 
                      size="sm"
                      onClick={() => loginWithDemoCredentials('supervisor')}
                      disabled={loading}
                    >
                      Supervisor
                    </Button>
                    <Button 
                      type="button" 
                      variant="outline" 
                      size="sm"
                      onClick={() => loginWithDemoCredentials('viewer')}
                      disabled={loading}
                    >
                      Viewer
                    </Button>
                  </div>
                  <p className="mt-2 text-xs text-muted-foreground/70">Password for all: "password"</p>
                </div>
              </form>
            </TabsContent>
            
            <TabsContent value="register">
              <form onSubmit={handleRegister} className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="full-name">Full Name</Label>
                  <div className="relative">
                    <User className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="full-name"
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Enter your full name"
                      className="pl-10"
                      required
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="register-email">Email</Label>
                  <div className="relative">
                    <Mail className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="register-email"
                      type="email"
                      value={registerEmail}
                      onChange={(e) => setRegisterEmail(e.target.value)}
                      placeholder="Enter your email"
                      className="pl-10"
                      required
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="register-password">Password</Label>
                  <div className="relative">
                    <Key className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="register-password"
                      type={showPassword ? 'text' : 'password'}
                      value={registerPassword}
                      onChange={(e) => setRegisterPassword(e.target.value)}
                      placeholder="Create a password"
                      className="pl-10 pr-10"
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
                
                <div className="space-y-2">
                  <Label htmlFor="confirm-password">Confirm Password</Label>
                  <div className="relative">
                    <Key className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="confirm-password"
                      type={showPassword ? 'text' : 'password'}
                      value={registerConfirmPassword}
                      onChange={(e) => setRegisterConfirmPassword(e.target.value)}
                      placeholder="Confirm your password"
                      className="pl-10 pr-10"
                      required
                    />
                  </div>
                </div>
                
                <Button
                  type="submit"
                  className="w-full"
                  disabled={loading}
                >
                  {loading ? 'Creating account...' : 'Create Account'}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default Auth;
