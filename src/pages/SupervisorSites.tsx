
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

const SupervisorSites: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [sites, setSites] = useState<any[]>([]);
  const [isSiteFormOpen, setIsSiteFormOpen] = useState(false);
  const [userRole, setUserRole] = useState<UserRole>(UserRole.VIEWER);
  const [supervisorId, setSupervisorId] = useState<string | null>(null);
  const [supervisorEmail, setSupervisorEmail] = useState<string | null>(null);
  
  useEffect(() => {
    const initializeData = async () => {
      setIsLoading(true);
      try {
        // Get current session to ensure user is logged in
        const { data: sessionData } = await supabase.auth.getSession();
        if (!sessionData.session) {
          toast({
            title: "Authentication Error",
            description: "Please login to continue",
            variant: "destructive"
          });
          navigate('/');
          return;
        }
        
        const email = sessionData.session.user.email;
        setSupervisorEmail(email);
        
        // Get user role from local storage
        const storedUserRole = localStorage.getItem('userRole') as UserRole;
        if (storedUserRole) {
          setUserRole(storedUserRole);
        }
        
        // Check if supervisorId exists in localStorage
        let supId = localStorage.getItem('supervisorId');
        
        // If not in localStorage, try to get it from the database
        if (!supId) {
          const { data: userData, error: userError } = await supabase
            .from('users')
            .select('supervisor_id')
            .eq('id', sessionData.session.user.id)
            .single();
          
          if (userError) {
            console.error('Error fetching user data:', userError);
          } else if (userData && userData.supervisor_id) {
            supId = userData.supervisor_id;
            localStorage.setItem('supervisorId', supId);
          }
        }
        
        // If still no supervisorId, assign a default one (from supervisors list if available)
        if (!supId) {
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
          } else {
            // Update localStorage after successful DB update
            localStorage.setItem('supervisorId', supId);
            toast({
              title: "Supervisor ID Assigned",
              description: "A default supervisor ID has been assigned to your account"
            });
          }
        }
        
        setSupervisorId(supId);
        
        // Now fetch sites with the supervisorId
        await fetchSites(supId);
      } catch (error) {
        console.error('Initialization error:', error);
        toast({
          title: "Error",
          description: "Failed to initialize data",
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    initializeData();
  }, [navigate, toast]);
  
  const fetchSites = async (supId: string | null) => {
    if (!supId) {
      console.error('No supervisor ID available to fetch sites');
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
        throw error;
      }
      
      console.log('Sites fetched:', data);
      if (data) {
        setSites(data);
      }
    } catch (error) {
      console.error('Error fetching sites:', error);
      toast({
        title: "Error",
        description: "Failed to load sites",
        variant: "destructive"
      });
    }
  };
  
  const handleSiteClick = (siteId: string) => {
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
        throw error;
      }
      
      toast({
        title: "Success",
        description: "Site added successfully"
      });
      
      // Refresh sites after adding new one
      fetchSites(supervisorId);
      setIsSiteFormOpen(false);
    } catch (error) {
      console.error('Error adding site:', error);
      toast({
        title: "Error",
        description: "Failed to add site",
        variant: "destructive"
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
      ) : (
        sites.length === 0 ? (
          <div className="text-center p-8 border rounded-lg bg-muted/30">
            <p className="text-muted-foreground">No sites found. Create your first site by clicking "Add Site".</p>
          </div>
        ) : (
          <SitesList 
            sites={sites}
            onSiteClick={handleSiteClick}
          />
        )
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
