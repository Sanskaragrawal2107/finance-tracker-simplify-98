
import React, { useState, useEffect } from 'react';
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation, Navigate } from "react-router-dom";
import Index from "./pages/Index";
import Dashboard from "./pages/Dashboard";
import Expenses from "./pages/Expenses";
import NotFound from "./pages/NotFound";
import Navbar from "./components/layout/Navbar";
import { UserRole } from "./lib/types";
import { useIsMobile } from "./hooks/use-mobile";

const queryClient = new QueryClient();

// Redirect component based on user role
const RoleBasedRedirect = () => {
  const userRole = localStorage.getItem('userRole') as UserRole;
  
  if (userRole === UserRole.SUPERVISOR) {
    return <Navigate to="/expenses" replace />;
  }
  
  return <Navigate to="/dashboard" replace />;
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
      default:
        return '';
    }
  };

  // Check if user is supervisor and redirect from dashboard to expenses
  useEffect(() => {
    if (userRole === UserRole.SUPERVISOR && location.pathname === "/dashboard") {
      window.location.href = "/expenses";
    }
  }, [userRole, location.pathname]);
  
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
              <AppLayout>
                <Dashboard />
              </AppLayout>
            } 
          />
          <Route path="/expenses" element={<AppLayout><Expenses /></AppLayout>} />
          <Route path="/authenticated" element={<RoleBasedRedirect />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
