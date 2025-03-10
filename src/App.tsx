
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
  
  console.log("RoleBasedRedirect - User role:", userRole);
  
  if (userRole === UserRole.ADMIN) {
    console.log("Redirecting admin to /admin");
    return <Navigate to="/admin" replace />;
  }
  
  if (userRole === UserRole.SUPERVISOR) {
    console.log("Redirecting supervisor to /expenses");
    return <Navigate to="/expenses" replace />;
  }
  
  console.log("Redirecting default user to /dashboard");
  return <Navigate to="/dashboard" replace />;
};

// Protected route component
const ProtectedRoute = ({ children, requiredRole }: { children: React.ReactNode, requiredRole?: UserRole }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const location = useLocation();
  
  useEffect(() => {
    const checkAuth = async () => {
      const { data } = await supabase.auth.getSession();
      setIsAuthenticated(!!data.session);
      
      if (data.session) {
        const storedRole = localStorage.getItem('userRole') as UserRole;
        setUserRole(storedRole);
      }
    };
    
    checkAuth();
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setIsAuthenticated(!!session);
      
      if (session) {
        const storedRole = localStorage.getItem('userRole') as UserRole;
        setUserRole(storedRole);
      }
    });
    
    return () => {
      subscription.unsubscribe();
    };
  }, []);
  
  if (isAuthenticated === null) {
    // Still checking authentication
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }
  
  if (!isAuthenticated) {
    console.log("Not authenticated, redirecting to /");
    return <Navigate to="/" replace />;
  }
  
  if (requiredRole && userRole !== requiredRole) {
    console.log(`Required role: ${requiredRole}, user role: ${userRole}, redirecting to /authenticated`);
    return <Navigate to="/authenticated" replace />;
  }
  
  return <>{children}</>;
};

// Layout component for authenticated pages
const AppLayout = ({ children }: { children: React.ReactNode }) => {
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
          {children}
        </div>
      </main>
    </div>
  );
};

const App = () => (
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
              <ProtectedRoute>
                <AppLayout>
                  <Dashboard />
                </AppLayout>
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/expenses" 
            element={
              <ProtectedRoute>
                <AppLayout>
                  <Expenses />
                </AppLayout>
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/admin" 
            element={
              <ProtectedRoute requiredRole={UserRole.ADMIN}>
                <AppLayout>
                  <AdminDashboard />
                </AppLayout>
              </ProtectedRoute>
            } 
          />
          <Route path="/authenticated" element={<RoleBasedRedirect />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
