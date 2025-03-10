
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

const Index: React.FC = () => {
  const navigate = useNavigate();
  const { user, role, loading } = useAuth();
  
  useEffect(() => {
    // If loading is complete
    if (!loading) {
      // If user is authenticated, redirect based on role
      if (user && role) {
        if (role === 'admin') {
          navigate('/admin');
        } else if (role === 'supervisor') {
          navigate('/expenses');
        } else {
          navigate('/dashboard');
        }
      } else {
        // If not authenticated, redirect to auth page
        navigate('/auth');
      }
    }
  }, [user, role, loading, navigate]);
  
  // Show loading while checking auth status
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-tr from-blue-50 to-indigo-50">
      <div className="text-center">
        <div className="h-12 w-12 rounded-md bg-primary flex items-center justify-center mx-auto mb-4 animate-pulse">
          <span className="text-primary-foreground font-semibold text-xl">F</span>
        </div>
        <h1 className="text-2xl font-semibold">FinTrack</h1>
        <p className="text-muted-foreground mt-2">Loading...</p>
      </div>
    </div>
  );
};

export default Index;
