
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { toast as sonnerToast } from 'sonner';

export const useSiteForm = (onSiteAdded: () => void) => {
  const [isSiteFormOpen, setIsSiteFormOpen] = useState(false);
  const { toast } = useToast();
  
  const getSupervisorId = () => {
    const storedSupervisorId = localStorage.getItem('supervisorId');
    if (storedSupervisorId && storedSupervisorId.trim() !== '') {
      return storedSupervisorId;
    }
    console.error("No supervisor ID available");
    return null;
  };
  
  const handleAddSite = async (siteData: any) => {
    try {
      const supervisorId = getSupervisorId();
      
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
      
      // Close form and notify parent component
      setIsSiteFormOpen(false);
      onSiteAdded();
    } catch (error: any) {
      console.error('Error adding site:', error);
      sonnerToast.error("Error", {
        description: error.message || "Failed to add site"
      });
    }
  };
  
  return {
    isSiteFormOpen,
    setIsSiteFormOpen,
    handleAddSite
  };
};
