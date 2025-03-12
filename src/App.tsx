import React, { useState, useEffect } from 'react';
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation, Navigate, useNavigate } from "react-router-dom";
import Index from "./pages/Index";
import Dashboard from "./pages/Dashboard";
import Expenses from "./pages/Expenses";
import SupervisorSites from "./pages/SupervisorSites";
import AdminDashboard from "./pages/AdminDashboard";
import NotFound from "./pages/NotFound";
import Navbar from "./components/layout/Navbar";
import { UserRole } from "./lib/types";
import { useIsMobile } from "./hooks/use-mobile";
import { supabase } from "./integrations/supabase/client";

const queryClient = new QueryClient();

const RoleBasedRedirect = () => {
  const userRole = localStorage.getItem('userRole') as UserRole;
  
  if (userRole === UserRole.ADMIN) {
    return <Navigate to="/admin" replace />;
  }
  
  if (userRole === UserRole.SUPERVISOR) {
    return <Navigate to="/supervisor/sites" replace />;
  }
  
  return <Navigate to="/dashboard" replace />;
};

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
    if (userRole === UserRole.ADMIN) {
      return <Navigate to="/admin" replace />;
    } else if (userRole === UserRole.SUPERVISOR) {
      return <Navigate to="/supervisor/sites" replace />;
    } else {
      return <Navigate to="/dashboard" replace />;
    }
  }

  return <>{children}</>;
};

const AppLayout = ({ children, allowedRoles = [] }: { children: React.ReactNode, allowedRoles?: UserRole[] }) => {
  const [userRole, setUserRole] = useState<UserRole>(UserRole.VIEWER);
  const [userName, setUserName] = useState<string>('User');
  const location = useLocation();
  const isMobile = useIsMobile();
  
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
  
  const getPageTitle = () => {
    const path = location.pathname;
    
    if (path.includes('/expenses/')) {
      return 'Site Expenses';
    }
    
    switch (path) {
      case '/dashboard':
        return 'Dashboard';
      case '/supervisor/sites':
        return 'Sites';
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
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (event === 'SIGNED_OUT') {
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
              path="/supervisor/sites" 
              element={
                <AppLayout allowedRoles={[UserRole.ADMIN, UserRole.SUPERVISOR]}>
                  <SupervisorSites />
                </AppLayout>
              } 
            />
            <Route 
              path="/expenses/:siteId" 
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
