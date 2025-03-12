
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { UserRole } from '@/lib/types';
import PageTitle from '@/components/common/PageTitle';
import SitesList from '@/components/sites/SitesList';
import SiteForm from '@/components/sites/SiteForm';
import { supervisors } from '@/data/supervisors';
import { supabase } from '@/integrations/supabase/client';
import { toast as sonnerToast } from 'sonner';
import LoadingState from '@/components/ui/LoadingState';
import ErrorState from '@/components/ui/ErrorState';
import EmptyState from '@/components/ui/EmptyState';
import UserInfoDisplay from '@/components/common/UserInfoDisplay';
import { useSupervisorAuth } from '@/hooks/use-supervisor-auth';
import { useSupervisorSites } from '@/hooks/use-supervisor-sites';
import { useSiteForm } from '@/hooks/use-site-form';

const SupervisorSites: React.FC = () => {
  const navigate = useNavigate();
  
  // Custom hooks for various functionalities
  const { 
    isLoading: authLoading, 
    userRole, 
    supervisorId, 
    supervisorEmail, 
    loadingError: authError 
  } = useSupervisorAuth();
  
  const { 
    sites, 
    isLoading: sitesLoading, 
    loadingError: sitesError, 
    fetchSites 
  } = useSupervisorSites();
  
  const { 
    isSiteFormOpen, 
    setIsSiteFormOpen, 
    handleAddSite 
  } = useSiteForm(() => {
    // Callback when a site is added successfully
    if (supervisorId) {
      fetchSites(supervisorId, userRole);
    }
  });
  
  // Effect to handle default supervisor ID assignment if needed
  useEffect(() => {
    const assignDefaultSupervisorId = async () => {
      if (!authLoading && !supervisorId) {
        try {
          console.log("No supervisorId found, assigning default...");
          // Find first supervisor or use "1" as default
          const defaultSupervisor = supervisors.length > 0 ? supervisors[0].id : "1";
          
          // Get current session to ensure user is logged in
          const { data: sessionData } = await supabase.auth.getSession();
          
          if (sessionData.session) {
            // Update the user record with this supervisor_id
            const { error: updateError } = await supabase
              .from('users')
              .update({ supervisor_id: defaultSupervisor })
              .eq('id', sessionData.session.user.id);
            
            if (updateError) {
              console.error('Error updating supervisor ID:', updateError);
            } else {
              // Update localStorage after successful DB update
              localStorage.setItem('supervisorId', defaultSupervisor);
              sonnerToast.success("Supervisor ID Assigned", {
                description: "A default supervisor ID has been assigned to your account"
              });
              console.log("Default supervisorId assigned and saved:", defaultSupervisor);
              
              // Now fetch sites with the default supervisorId
              fetchSites(defaultSupervisor, userRole);
            }
          }
        } catch (error: any) {
          console.error('Error assigning default supervisorId:', error);
        }
      }
    };
    
    assignDefaultSupervisorId();
  }, [authLoading, supervisorId, userRole]);
  
  // Fetch sites when supervisorId is available
  useEffect(() => {
    if (!authLoading && supervisorId) {
      fetchSites(supervisorId, userRole);
    }
  }, [supervisorId, userRole, authLoading]);
  
  const handleSiteClick = (siteId: string) => {
    console.log('Site clicked, navigating to:', `/expenses/${siteId}`);
    navigate(`/expenses/${siteId}`);
  };
  
  // Determine if we're in a loading state
  const isLoadingData = authLoading || sitesLoading;
  
  // Determine if we have an error to show
  const errorMessage = authError || sitesError;
  
  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <PageTitle title="Sites" />
        
        <UserInfoDisplay email={supervisorEmail} userId={supervisorId} />
        
        <Button onClick={() => setIsSiteFormOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Site
        </Button>
      </div>
      
      {isLoadingData ? (
        <LoadingState />
      ) : errorMessage ? (
        <ErrorState 
          message={errorMessage} 
          onRetry={() => window.location.reload()} 
        />
      ) : sites.length === 0 ? (
        <EmptyState 
          message="No sites found. Create your first site by clicking 'Add Site'." 
          buttonText="Add Site" 
          onAction={() => setIsSiteFormOpen(true)} 
        />
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
