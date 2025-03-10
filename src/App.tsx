
import React from 'react';
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import Expenses from "./pages/Expenses";
import AdminDashboard from "./pages/AdminDashboard";
import NotFound from "./pages/NotFound";
import Navbar from "./components/layout/Navbar";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { UserRole } from "./lib/types";

const queryClient = new QueryClient();

// Protected route component
const ProtectedRoute = ({ 
  children, 
  allowedRoles = [] 
}: { 
  children: React.ReactNode, 
  allowedRoles?: UserRole[] 
}) => {
  const { user, role, loading } = useAuth();
  const location = useLocation();
  
  // Show loading state
  if (loading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }
  
  // Check if user is authenticated
  if (!user) {
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }
  
  // Check if user has required role (if roles are specified)
  if (allowedRoles.length > 0 && role && !allowedRoles.includes(role as UserRole)) {
    // Redirect based on user role
    if (role === UserRole.ADMIN) {
      return <Navigate to="/admin" replace />;
    } else if (role === UserRole.SUPERVISOR) {
      return <Navigate to="/expenses" replace />;
    } else {
      return <Navigate to="/dashboard" replace />;
    }
  }
  
  return <>{children}</>;
};

// Layout component for authenticated pages
const AppLayout = ({ children, allowedRoles = [] }: { children: React.ReactNode, allowedRoles?: UserRole[] }) => {
  const { role } = useAuth();
  const location = useLocation();
  
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
        userRole={role as UserRole}
      />
      
      <main className="flex-1 overflow-y-auto p-4 md:p-6 bg-background">
        <div className="container mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
};

// App Routes with Auth Provider
const AppRoutes = () => {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/auth" element={<Auth />} />
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
            <ProtectedRoute allowedRoles={[UserRole.ADMIN, UserRole.SUPERVISOR]}>
              <AppLayout allowedRoles={[UserRole.ADMIN, UserRole.SUPERVISOR]}>
                <Expenses />
              </AppLayout>
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/admin" 
          element={
            <ProtectedRoute allowedRoles={[UserRole.ADMIN]}>
              <AppLayout allowedRoles={[UserRole.ADMIN]}>
                <AdminDashboard />
              </AppLayout>
            </ProtectedRoute>
          } 
        />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </AuthProvider>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
