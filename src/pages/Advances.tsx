
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import PageTitle from '@/components/common/PageTitle';
import { Plus, Filter, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Advance, ApprovalStatus, RecipientType, AdvancePurpose, UserRole } from '@/lib/types';
import AdvanceFilter from '@/components/advances/AdvanceFilter';
import AdvancesList from '@/components/advances/AdvancesList';
import AdvanceForm from '@/components/advances/AdvanceForm';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

const Advances: React.FC = () => {
  const navigate = useNavigate();
  const [advances, setAdvances] = useState<Advance[]>([]);
  const [isAdvanceFormOpen, setIsAdvanceFormOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterRecipientType, setFilterRecipientType] = useState('all');
  const [filterPurpose, setFilterPurpose] = useState('all');
  const [isLoading, setIsLoading] = useState(true);
  const [selectedAdvance, setSelectedAdvance] = useState<Advance | null>(null);
  const [userRole, setUserRole] = useState<UserRole | null>(null);
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
    
    fetchAdvances();
  }, []);
  
  const fetchAdvances = async () => {
    try {
      setIsLoading(true);
      
      // Choose query based on user role
      let query = supabase.from('advances').select('*');
      
      // If supervisor, only fetch their advances
      const storedSupervisorId = localStorage.getItem('supervisorId');
      if (storedSupervisorId) {
        // For supervisors, get advances from their sites
        const { data: sitesData } = await supabase
          .from('sites')
          .select('id')
          .eq('supervisor_id', storedSupervisorId);
        
        if (sitesData && sitesData.length > 0) {
          const siteIds = sitesData.map(site => site.id);
          query = query.in('site_id', siteIds);
        }
      }
      
      const { data, error } = await query;
      
      if (error) {
        throw error;
      }
      
      if (data) {
        const formattedAdvances: Advance[] = data.map(advance => ({
          id: advance.id,
          date: new Date(advance.date),
          recipientId: advance.recipient_id || '',
          recipientName: advance.recipient_name,
          recipientType: advance.recipient_type,
          purpose: advance.purpose,
          amount: advance.amount,
          remarks: advance.remarks || '',
          status: advance.status,
          createdBy: advance.created_by || '',
          createdAt: new Date(advance.created_at),
          siteId: advance.site_id
        }));
        
        setAdvances(formattedAdvances);
      }
    } catch (err: any) {
      console.error('Error fetching advances:', err);
      toast.error('Failed to load advances: ' + err.message);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleAddAdvance = async (newAdvance: Partial<Advance>) => {
    try {
      if (!newAdvance.siteId) {
        // Navigate to expenses page to select a site if no siteId is provided
        navigate('/expenses', { state: { newAdvance: true } });
        return;
      }
      
      const advanceWithId: Advance = {
        ...newAdvance as Advance,
        id: Date.now().toString(),
        status: ApprovalStatus.PENDING,
        createdBy: 'Current User', // In a real app, this would be the current user's name or ID
        createdAt: new Date(),
      };
      
      // Save to Supabase
      const { data, error } = await supabase
        .from('advances')
        .insert({
          date: typeof advanceWithId.date === 'string' ? advanceWithId.date : advanceWithId.date.toISOString(),
          recipient_id: advanceWithId.recipientId,
          recipient_name: advanceWithId.recipientName,
          recipient_type: advanceWithId.recipientType,
          purpose: advanceWithId.purpose,
          amount: advanceWithId.amount,
          remarks: advanceWithId.remarks,
          status: advanceWithId.status,
          created_by: advanceWithId.createdBy,
          site_id: advanceWithId.siteId
        });
      
      if (error) throw error;
      
      setAdvances(prevAdvances => [advanceWithId, ...prevAdvances]);
      toast.success("Advance added successfully");
    } catch (err: any) {
      console.error('Error adding advance:', err);
      toast.error('Failed to add advance: ' + err.message);
    }
  };
  
  const handleApproveAdvance = async (id: string) => {
    try {
      // Update in Supabase
      const { error } = await supabase
        .from('advances')
        .update({ status: ApprovalStatus.APPROVED })
        .eq('id', id);
      
      if (error) throw error;
      
      // Update locally
      setAdvances(prevAdvances => 
        prevAdvances.map(advance => 
          advance.id === id 
            ? { ...advance, status: ApprovalStatus.APPROVED } 
            : advance
        )
      );
      toast.success("Advance approved");
    } catch (err: any) {
      console.error('Error approving advance:', err);
      toast.error('Failed to approve advance: ' + err.message);
    }
  };
  
  const handleRejectAdvance = async (id: string) => {
    try {
      // Update in Supabase
      const { error } = await supabase
        .from('advances')
        .update({ status: ApprovalStatus.REJECTED })
        .eq('id', id);
      
      if (error) throw error;
      
      // Update locally
      setAdvances(prevAdvances => 
        prevAdvances.map(advance => 
          advance.id === id 
            ? { ...advance, status: ApprovalStatus.REJECTED } 
            : advance
        )
      );
      toast.success("Advance rejected");
    } catch (err: any) {
      console.error('Error rejecting advance:', err);
      toast.error('Failed to reject advance: ' + err.message);
    }
  };
  
  const filteredAdvances = advances.filter(advance => {
    const matchesSearch = 
      advance.recipientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (advance.remarks && advance.remarks.toLowerCase().includes(searchTerm.toLowerCase()));
      
    const matchesStatus = 
      filterStatus === 'all' ? true : advance.status === filterStatus;
      
    const matchesRecipientType = 
      filterRecipientType === 'all' ? true : advance.recipientType === filterRecipientType;
      
    const matchesPurpose = 
      filterPurpose === 'all' ? true : advance.purpose === filterPurpose;
      
    return matchesSearch && matchesStatus && matchesRecipientType && matchesPurpose;
  });
  
  return (
    <div className="space-y-6 animate-fade-in">
      <PageTitle 
        title="Advances" 
        subtitle="Manage advance payments to workers, subcontractors and supervisors"
      />
      
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
        <div className="flex flex-col md:flex-row md:items-center gap-4 w-full md:w-auto">
          <div className="relative max-w-md w-full">
            <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
            <input 
              type="text" 
              placeholder="Search advances..." 
              className="py-2 pl-10 pr-4 border rounded-md w-full focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        
        <div className="flex flex-wrap gap-2">
          <AdvanceFilter 
            filterStatus={filterStatus}
            setFilterStatus={setFilterStatus}
            filterRecipientType={filterRecipientType}
            setFilterRecipientType={setFilterRecipientType}
            filterPurpose={filterPurpose}
            setFilterPurpose={setFilterPurpose}
          />
          <Button 
            onClick={() => setIsAdvanceFormOpen(true)}
          >
            <Plus className="h-4 w-4 mr-2" />
            New Advance
          </Button>
        </div>
      </div>
      
      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-pulse text-xl text-primary">Loading advances...</div>
        </div>
      ) : (
        <AdvancesList 
          advances={filteredAdvances}
          onViewDetails={(advance) => setSelectedAdvance(advance)}
          onApprove={userRole === UserRole.ADMIN ? handleApproveAdvance : undefined}
          onReject={userRole === UserRole.ADMIN ? handleRejectAdvance : undefined}
        />
      )}
      
      <AdvanceForm
        isOpen={isAdvanceFormOpen}
        onClose={() => setIsAdvanceFormOpen(false)}
        onSubmit={handleAddAdvance}
        siteId=""
      />
    </div>
  );
};

export default Advances;
