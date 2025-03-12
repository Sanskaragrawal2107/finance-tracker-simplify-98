
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { UserRole } from '@/lib/types';
import PageTitle from '@/components/common/PageTitle';
import SitesList from '@/components/sites/SitesList';
import SiteForm from '@/components/sites/SiteForm';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { supervisors } from '@/data/supervisors';
import { toast as sonnerToast } from 'sonner';

const SupervisorSites: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [sites, setSites] = useState<any[]>([]);
  const [isSiteFormOpen, setIsSiteFormOpen] = useState(false);
  const [userRole, setUserRole] = useState<UserRole>(UserRole.VIEWER);
  const [supervisorId, setSupervisorId] = useState<string | null>(null);
  const [supervisorEmail, setSupervisorEmail] = useState<string | null>(null);
  const [loadingError, setLoadingError] = useState<string | null>(null);
  
  useEffect(() => {
    const initializeData = async () => {
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
        
        // If still no supervisorId, assign a default one
        if (!supId) {
          console.log("No supervisorId found, assigning default...");
          // Find first supervisor or use "1" as default
          const defaultSupervisor = supervisors.length > 0 ? supervisors[0].id : "1";
          supId = defaultSupervisor;
          
          // Update the user record with this supervisor_id
          const { error: updateError } = await supabase
            .from('users')
            .update({ supervisor_id: supId })
            .eq('id', sessionData.session.user.id);
          
          if (updateError) {
            console.error('Error updating supervisor ID:', updateError);
            setLoadingError("Failed to assign supervisor ID");
          } else {
            // Update localStorage after successful DB update
            localStorage.setItem('supervisorId', supId);
            sonnerToast.success("Supervisor ID Assigned", {
              description: "A default supervisor ID has been assigned to your account"
            });
            console.log("Default supervisorId assigned and saved:", supId);
          }
        }
        
        setSupervisorId(supId);
        
        // Now fetch sites with the supervisorId
        if (supId) {
          await fetchSites(supId);
        } else {
          console.error("Could not determine supervisorId for fetching sites");
          setLoadingError("Could not determine supervisor ID");
          setSites([]);
        }
      } catch (error: any) {
        console.error('Initialization error:', error);
        setLoadingError(error.message || "Failed to initialize data");
        sonnerToast.error("Error", {
          description: "Failed to initialize data"
        });
        setSites([]);
      } finally {
        setIsLoading(false);
      }
    };
    
    initializeData();
  }, [navigate, toast]);
  
  const fetchSites = async (supId: string | null) => {
    if (!supId) {
      console.error('No supervisor ID available to fetch sites');
      setLoadingError("No supervisor ID available");
      return;
    }
    
    try {
      console.log('Fetching sites for supervisor ID:', supId);
      
      let query = supabase
        .from('sites')
        .select('*')
        .order('created_at', { ascending: false });
      
      // If not admin, filter by supervisor ID
      if (userRole !== UserRole.ADMIN) {
        query = query.eq('supervisor_id', supId);
      }
      
      const { data, error } = await query;
      
      if (error) {
        console.error('Error fetching sites:', error);
        setLoadingError("Failed to load sites: " + error.message);
        setSites([]);
        sonnerToast.error("Error", {
          description: "Failed to load sites"
        });
        return;
      }
      
      console.log('Sites fetched:', data?.length || 0, 'sites');
      if (data && data.length > 0) {
        setSites(data);
      } else {
        console.log('No sites found for supervisor ID:', supId);
        setSites([]);
      }
    } catch (error: any) {
      console.error('Error in fetchSites:', error);
      setLoadingError("Failed to load sites: " + (error.message || "Unknown error"));
      setSites([]);
      sonnerToast.error("Error", {
        description: "Failed to load sites"
      });
    }
  };
  
  const handleSiteClick = (siteId: string) => {
    console.log('Site clicked, navigating to:', `/expenses/${siteId}`);
    navigate(`/expenses/${siteId}`);
  };
  
  const handleAddSite = async (siteData: any) => {
    try {
      if (!supervisorId) {
        toast({
          title: "Error",
          description: "Supervisor ID not found",
          variant: "destructive"
        });
        return;
      }
      
      // Add supervisor_id to site data
      const siteWithSupervisorId = {
        ...siteData,
        supervisor_id: supervisorId,
      };
      
      console.log('Adding site with data:', siteWithSupervisorId);
      
      const { data, error } = await supabase
        .from('sites')
        .insert(siteWithSupervisorId)
        .select()
        .single();
      
      if (error) {
        console.error('Error adding site:', error);
        throw error;
      }
      
      sonnerToast.success("Site added successfully");
      
      // Refresh sites after adding new one
      fetchSites(supervisorId);
      setIsSiteFormOpen(false);
    } catch (error: any) {
      console.error('Error adding site:', error);
      sonnerToast.error("Error", {
        description: error.message || "Failed to add site"
      });
    }
  };
  
  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <PageTitle title="Sites" />
        
        {supervisorEmail && (
          <div className="text-sm text-muted-foreground">
            Logged in as: {supervisorEmail}
            {supervisorId && <span className="ml-2">(ID: {supervisorId})</span>}
          </div>
        )}
        
        <Button onClick={() => setIsSiteFormOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Site
        </Button>
      </div>
      
      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : loadingError ? (
        <div className="text-center p-8 border rounded-lg bg-red-50 border-red-200">
          <p className="text-red-600 mb-4">{loadingError}</p>
          <Button variant="outline" onClick={() => window.location.reload()}>
            Retry
          </Button>
        </div>
      ) : sites.length === 0 ? (
        <div className="text-center p-8 border rounded-lg bg-muted/30">
          <p className="text-muted-foreground mb-4">No sites found. Create your first site by clicking "Add Site".</p>
          <Button onClick={() => setIsSiteFormOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Site
          </Button>
        </div>
      ) : (
        <SitesList 
          sites={sites}
          onSiteClick={handleSiteClick}
        />
      )}
      
      <SiteForm 
        isOpen={isSiteFormOpen}
        onClose={() => setIsSiteFormOpen(false)}
        onSubmit={handleAddSite}
        supervisorId={supervisorId || ''}
      />
    </div>
  );
};

export default SupervisorSites;
