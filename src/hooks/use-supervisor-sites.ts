
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { UserRole } from '@/lib/types';
import { toast as sonnerToast } from 'sonner';

export const useSupervisorSites = () => {
  const [sites, setSites] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingError, setLoadingError] = useState<string | null>(null);

  const fetchSites = async (supervisorId: string | null, userRole: UserRole) => {
    if (!supervisorId) {
      console.error('No supervisor ID available to fetch sites');
      setLoadingError("No supervisor ID available");
      setSites([]);
      return;
    }
    
    setIsLoading(true);
    setLoadingError(null);
    
    try {
      console.log('Fetching sites for supervisor ID:', supervisorId);
      
      let query = supabase
        .from('sites')
        .select('*')
        .order('created_at', { ascending: false });
      
      // If not admin, filter by supervisor ID
      if (userRole !== UserRole.ADMIN) {
        query = query.eq('supervisor_id', supervisorId);
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
        console.log('No sites found for supervisor ID:', supervisorId);
        setSites([]);
      }
    } catch (error: any) {
      console.error('Error in fetchSites:', error);
      setLoadingError("Failed to load sites: " + (error.message || "Unknown error"));
      setSites([]);
      sonnerToast.error("Error", {
        description: "Failed to load sites"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return {
    sites,
    isLoading,
    loadingError,
    setSites,
    fetchSites
  };
};
