
import React, { useState, useEffect } from 'react';
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import Index from "./pages/Index";
import Dashboard from "./pages/Dashboard";
import Expenses from "./pages/Expenses";
import Advances from "./pages/Advances";
import Invoices from "./pages/Invoices";
import HeadOffice from "./pages/HeadOffice";
import NotFound from "./pages/NotFound";
import Sidebar from "./components/layout/Sidebar";
import Navbar from "./components/layout/Navbar";
import { UserRole } from "./lib/types";

const queryClient = new QueryClient();

// Layout component for authenticated pages
const AppLayout = ({ children }: { children: React.ReactNode }) => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [userRole, setUserRole] = useState<UserRole>(UserRole.VIEWER);
  const [userName, setUserName] = useState<string>('User');
  const location = useLocation();
  
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
      case '/advances':
        return 'Advances';
      case '/invoices':
        return 'Invoices';
      case '/head-office':
        return 'Head Office Funds';
      default:
        return '';
    }
  };
  
  return (
    <div className="min-h-screen flex">
      <Sidebar 
        userRole={userRole}
        userName={userName}
        collapsed={sidebarCollapsed}
        setCollapsed={setSidebarCollapsed}
      />
      
      <div className="flex-1 flex flex-col min-h-screen overflow-hidden">
        <Navbar 
          onMenuClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          pageTitle={getPageTitle()}
        />
        
        <main className="flex-1 overflow-y-auto p-6 bg-background">
          <div className="container mx-auto">
            {children}
          </div>
        </main>
      </div>
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
          <Route path="/dashboard" element={<AppLayout><Dashboard /></AppLayout>} />
          <Route path="/expenses" element={<AppLayout><Expenses /></AppLayout>} />
          <Route path="/advances" element={<AppLayout><Advances /></AppLayout>} />
          <Route path="/invoices" element={<AppLayout><Invoices /></AppLayout>} />
          <Route path="/head-office" element={<AppLayout><HeadOffice /></AppLayout>} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
