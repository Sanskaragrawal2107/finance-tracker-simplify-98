
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { UserRole } from '@/lib/types';
import { toast as sonnerToast } from 'sonner';

interface SupervisorAuthData {
  isLoading: boolean;
  userRole: UserRole;
  supervisorId: string | null;
  supervisorEmail: string | null;
  loadingError: string | null;
}

export const useSupervisorAuth = (): SupervisorAuthData => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [userRole, setUserRole] = useState<UserRole>(UserRole.VIEWER);
  const [supervisorId, setSupervisorId] = useState<string | null>(null);
  const [supervisorEmail, setSupervisorEmail] = useState<string | null>(null);
  const [loadingError, setLoadingError] = useState<string | null>(null);

  useEffect(() => {
    const checkAuthAndGetSupervisorId = async () => {
      setIsLoading(true);
      setLoadingError(null);
      
      try {
        // Get current session to ensure user is logged in
        const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error('Session error:', sessionError);
          setLoadingError("Authentication error. Please login again.");
          sonnerToast.error("Authentication error", {
            description: "Please login again to continue"
          });
          navigate('/');
          return;
        }
        
        if (!sessionData.session) {
          console.warn('No active session found');
          sonnerToast.error("Authentication required", {
            description: "Please login to continue"
          });
          navigate('/');
          return;
        }
        
        const email = sessionData.session.user.email;
        setSupervisorEmail(email);
        console.log("User email:", email);
        
        // Get user role from local storage
        const storedUserRole = localStorage.getItem('userRole') as UserRole;
        if (storedUserRole) {
          setUserRole(storedUserRole);
          console.log("User role from localStorage:", storedUserRole);
        } else {
          console.warn("No user role found in localStorage");
        }
        
        // Check if supervisorId exists in localStorage
        let supId = localStorage.getItem('supervisorId');
        console.log("Initial supervisorId from localStorage:", supId);
        
        // If not in localStorage, try to get it from the database
        if (!supId) {
          console.log("No supervisorId in localStorage, fetching from database...");
          const { data: userData, error: userError } = await supabase
            .from('users')
            .select('supervisor_id, role')
            .eq('id', sessionData.session.user.id)
            .single();
          
          if (userError) {
            console.error('Error fetching user data:', userError);
            setLoadingError("Failed to fetch user profile");
          } else if (userData) {
            console.log("User data fetched from database:", userData);
            
            if (userData.role) {
              // Convert string role to UserRole enum
              if (userData.role === 'admin') {
                setUserRole(UserRole.ADMIN);
                localStorage.setItem('userRole', UserRole.ADMIN);
              } else if (userData.role === 'supervisor') {
                setUserRole(UserRole.SUPERVISOR);
                localStorage.setItem('userRole', UserRole.SUPERVISOR);
              } else {
                setUserRole(UserRole.VIEWER);
                localStorage.setItem('userRole', UserRole.VIEWER);
              }
              console.log("Setting userRole from database:", userData.role);
            }
            
            if (userData.supervisor_id) {
              supId = userData.supervisor_id;
              localStorage.setItem('supervisorId', supId);
              console.log("Setting supervisorId from database:", supId);
            } else {
              console.warn("No supervisor_id found in database");
            }
          } else {
            console.warn("No user data found in database");
          }
        }
        
        setSupervisorId(supId);
      } catch (error: any) {
        console.error('Initialization error:', error);
        setLoadingError(error.message || "Failed to initialize data");
        sonnerToast.error("Error", {
          description: "Failed to initialize data"
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    checkAuthAndGetSupervisorId();
  }, [navigate]);

  return {
    isLoading,
    userRole,
    supervisorId,
    supervisorEmail,
    loadingError
  };
};
