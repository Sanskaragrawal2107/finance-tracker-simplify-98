
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';
import PageTitle from '@/components/common/PageTitle';
import { toast } from 'sonner';

interface Site {
  id: string;
  name: string;
  pos_no: string;
  job_name: string;
  start_date: string;
  is_completed: boolean;
  completion_date: string | null;
}

const SupervisorSites = () => {
  const [sites, setSites] = useState<Site[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  
  useEffect(() => {
    fetchSites();
  }, []);
  
  const fetchSites = async () => {
    try {
      setIsLoading(true);
      const supervisorId = localStorage.getItem('supervisorId');
      
      if (!supervisorId) {
        console.error('No supervisor ID found in localStorage');
        setError('Unable to fetch sites: No supervisor ID found');
        setIsLoading(false);
        return;
      }
      
      console.log('Fetching sites for supervisor ID:', supervisorId);
      
      const { data, error } = await supabase
        .from('sites')
        .select('*')
        .eq('supervisor_id', supervisorId)
        .order('start_date', { ascending: false });
      
      if (error) {
        console.error('Error fetching sites:', error);
        setError('Failed to load sites');
        toast.error('Failed to load sites');
      } else {
        console.log('Sites fetched:', data);
        setSites(data || []);
      }
    } catch (err) {
      console.error('Unexpected error:', err);
      setError('An unexpected error occurred');
      toast.error('An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleSiteClick = (siteId: string) => {
    navigate(`/expenses/${siteId}`);
  };
  
  if (isLoading) {
    return (
      <div className="container mx-auto py-6 flex items-center justify-center min-h-[80vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading sites...</p>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="container mx-auto py-6 text-center">
        <h2 className="text-xl font-semibold">Error</h2>
        <p className="mt-2 text-muted-foreground">{error}</p>
        <Button className="mt-4" onClick={fetchSites}>Retry</Button>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <PageTitle title="Your Sites" />
        <Button className="flex items-center gap-2">
          <PlusCircle className="h-4 w-4" />
          Add Site
        </Button>
      </div>
      
      {sites.length === 0 ? (
        <div className="text-center p-12 border border-dashed rounded-lg bg-muted/20">
          <h3 className="text-lg font-medium">No sites found</h3>
          <p className="text-muted-foreground mt-1">You don't have any sites assigned yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sites.map((site) => (
            <div 
              key={site.id} 
              className="border rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow cursor-pointer bg-white"
              onClick={() => handleSiteClick(site.id)}
            >
              <div className="p-5">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-semibold text-lg truncate">{site.name}</h3>
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    site.is_completed ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'
                  }`}>
                    {site.is_completed ? 'Completed' : 'Active'}
                  </span>
                </div>
                
                <div className="space-y-1 text-sm text-muted-foreground">
                  <p><span className="font-medium">POS:</span> {site.pos_no}</p>
                  <p><span className="font-medium">Job:</span> {site.job_name}</p>
                  <p><span className="font-medium">Started:</span> {new Date(site.start_date).toLocaleDateString()}</p>
                  {site.is_completed && site.completion_date && (
                    <p><span className="font-medium">Completed:</span> {new Date(site.completion_date).toLocaleDateString()}</p>
                  )}
                </div>
                
                <div className="mt-4 flex justify-end">
                  <Button variant="primary" size="sm">View Details</Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SupervisorSites;
