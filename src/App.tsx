
import React, { useState, useEffect } from 'react';
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation, Navigate } from "react-router-dom";
import Index from "./pages/Index";
import Dashboard from "./pages/Dashboard";
import Expenses from "./pages/Expenses";
import AdminDashboard from "./pages/AdminDashboard";
import NotFound from "./pages/NotFound";
import Navbar from "./components/layout/Navbar";
import { UserRole } from "./lib/types";
import { useIsMobile } from "./hooks/use-mobile";
import { supabase } from "./integrations/supabase/client";

const queryClient = new QueryClient();

// Redirect component based on user role
const RoleBasedRedirect = () => {
  const userRole = localStorage.getItem('userRole') as UserRole;
  
  if (userRole === UserRole.ADMIN) {
    return <Navigate to="/admin" replace />;
  }
  
  if (userRole === UserRole.SUPERVISOR) {
    return <Navigate to="/expenses" replace />;
  }
  
  return <Navigate to="/dashboard" replace />;
};

// Auth wrapper to protect routes
const ProtectedRoute = ({ 
  children, 
  allowedRoles = [] 
}: { 
  children: React.ReactNode, 
  allowedRoles?: UserRole[] 
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data } = await supabase.auth.getSession();
        
        if (data.session) {
          const storedUserRole = localStorage.getItem('userRole') as UserRole;
          setIsAuthenticated(true);
          setUserRole(storedUserRole);
        } else {
          navigate('/');
        }
      } catch (error) {
        console.error('Auth check error:', error);
        navigate('/');
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, [navigate]);

  if (isLoading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  if (allowedRoles.length > 0 && userRole && !allowedRoles.includes(userRole)) {
    // Redirect based on role
    if (userRole === UserRole.ADMIN) {
      return <Navigate to="/admin" replace />;
    } else {
      return <Navigate to="/expenses" replace />;
    }
  }

  return <>{children}</>;
};

// Layout component for authenticated pages
const AppLayout = ({ children, allowedRoles = [] }: { children: React.ReactNode, allowedRoles?: UserRole[] }) => {
  const [userRole, setUserRole] = useState<UserRole>(UserRole.VIEWER);
  const [userName, setUserName] = useState<string>('User');
  const location = useLocation();
  const isMobile = useIsMobile();
  
  // Check if user is authenticated
  useEffect(() => {
    const storedUserRole = localStorage.getItem('userRole') as UserRole;
    const storedUserName = localStorage.getItem('userName');
    
    if (storedUserRole) {
      setUserRole(storedUserRole);
    }
    
    if (storedUserName) {
      setUserName(storedUserName);
    }
  }, []);
  
  // Get page title based on current route
  const getPageTitle = () => {
    const path = location.pathname;
    
    switch (path) {
      case '/dashboard':
        return 'Dashboard';
      case '/expenses':
        return 'Expenses';
      case '/admin':
        return 'Admin Dashboard';
      default:
        return '';
    }
  };
  
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar 
        onMenuClick={() => {}} // Empty function since we don't have a sidebar
        pageTitle={getPageTitle()}
        userRole={userRole}
      />
      
      <main className="flex-1 overflow-y-auto p-4 md:p-6 bg-background">
        <div className="container mx-auto">
          <ProtectedRoute allowedRoles={allowedRoles}>
            {children}
          </ProtectedRoute>
        </div>
      </main>
    </div>
  );
};

const App = () => {
  const [session, setSession] = useState(null);

  useEffect(() => {
    // Setup auth listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (event === 'SIGNED_OUT') {
          // Clear local storage on sign out
          localStorage.removeItem('userRole');
          localStorage.removeItem('userName');
          localStorage.removeItem('supervisorId');
        }
      }
    );

    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route 
              path="/dashboard" 
              element={
                <AppLayout allowedRoles={[UserRole.ADMIN, UserRole.VIEWER]}>
                  <Dashboard />
                </AppLayout>
              } 
            />
            <Route 
              path="/expenses" 
              element={
                <AppLayout allowedRoles={[UserRole.ADMIN, UserRole.SUPERVISOR]}>
                  <Expenses />
                </AppLayout>
              } 
            />
            <Route 
              path="/admin" 
              element={
                <AppLayout allowedRoles={[UserRole.ADMIN]}>
                  <AdminDashboard />
                </AppLayout>
              } 
            />
            <Route path="/authenticated" element={<RoleBasedRedirect />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
