
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

const SupervisorSites: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [sites, setSites] = useState<any[]>([]);
  const [isSiteFormOpen, setIsSiteFormOpen] = useState(false);
  const [userRole, setUserRole] = useState<UserRole>(UserRole.VIEWER);
  const [supervisorId, setSupervisorId] = useState<string | null>(null);
  
  useEffect(() => {
    const storedUserRole = localStorage.getItem('userRole') as UserRole;
    const storedSupervisorId = localStorage.getItem('supervisorId');
    
    if (storedUserRole) {
      setUserRole(storedUserRole);
    }
    
    if (storedSupervisorId) {
      setSupervisorId(storedSupervisorId);
    }
    
    fetchSites();
  }, []);
  
  const fetchSites = async () => {
    try {
      setIsLoading(true);
      const supervisorId = localStorage.getItem('supervisorId');
      
      if (!supervisorId) {
        toast({
          title: "Error",
          description: "Supervisor ID not found",
          variant: "destructive"
        });
        setIsLoading(false);
        return;
      }
      
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
        throw error;
      }
      
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
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleSiteClick = (siteId: string) => {
    navigate(`/expenses/${siteId}`);
  };
  
  const handleAddSite = async (siteData: any) => {
    try {
      // Add supervisor_id to site data
      const siteWithSupervisorId = {
        ...siteData,
        supervisor_id: supervisorId,
      };
      
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
      
      fetchSites();
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
        
        {userRole === UserRole.ADMIN && (
          <Button onClick={() => setIsSiteFormOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Site
          </Button>
        )}
      </div>
      
      <SitesList 
        sites={sites} 
        onSiteClick={handleSiteClick}
      />
      
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
