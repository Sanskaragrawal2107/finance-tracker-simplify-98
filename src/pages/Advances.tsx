import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import PageTitle from '@/components/common/PageTitle';
import CustomCard from '@/components/ui/CustomCard';
import { Search, Filter, Plus, User, Users, CheckSquare, CircleSlash, Loader2 } from 'lucide-react';
import { Advance, ApprovalStatus, Site, UserRole } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import AdvanceForm from '@/components/advances/AdvanceForm';

const Advances: React.FC = () => {
  const location = useLocation();
  const [advances, setAdvances] = useState<Advance[]>([]);
  const [sites, setSites] = useState<Site[]>([]);
  const [isAdvanceFormOpen, setIsAdvanceFormOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSiteId, setSelectedSiteId] = useState<string | null>(null);
  const [selectedSupervisorId, setSelectedSupervisorId] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'approved'>('all');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const storedUserRole = localStorage.getItem('userRole') as UserRole;
    const storedSupervisorId = localStorage.getItem('supervisorId');
    
    if (storedUserRole) {
      setUserRole(storedUserRole);
      
      if (storedUserRole === UserRole.SUPERVISOR && storedSupervisorId) {
        setSelectedSupervisorId(storedSupervisorId);
      }
    }
    
    const locationState = location.state as { supervisorId?: string, newSite?: boolean } | null;
    if (locationState?.supervisorId && storedUserRole === UserRole.ADMIN) {
      setSelectedSupervisorId(locationState.supervisorId);
    }
    
    fetchSites();
  }, [location]);

  useEffect(() => {
    if (selectedSiteId) {
      localStorage.setItem('selectedSiteId', selectedSiteId);
      fetchAdvances(selectedSiteId);
    }
  }, [selectedSiteId]);

  const fetchSites = async () => {
    try {
      setIsLoading(true);
      
      let query = supabase.from('sites').select('*');
      
      if (userRole === UserRole.SUPERVISOR && selectedSupervisorId) {
        query = query.eq('supervisor_id', selectedSupervisorId);
      } else if (userRole === UserRole.ADMIN && selectedSupervisorId) {
        query = query.eq('supervisor_id', selectedSupervisorId);
      }
      
      const { data, error } = await query;
      
      if (error) {
        throw error;
      }
      
      if (data) {
        const formattedSites: Site[] = data.map(site => ({
          id: site.id,
          name: site.name,
          jobName: site.job_name,
          posNo: site.pos_no,
          startDate: new Date(site.start_date),
          completionDate: site.completion_date ? new Date(site.completion_date) : undefined,
          supervisorId: site.supervisor_id,
          supervisorName: "Supervisor Name", // Default value
          isCompleted: site.is_completed,
          createdAt: new Date(site.created_at),
          funds: site.funds || 0,
          location: "Location", // Default value
          status: "active", // Default value
          clientName: "Client", // Default value
          contactPerson: "Contact Person", // Default value
          contactNumber: "Contact Number", // Default value
          budget: 0, // Default value
          endDate: undefined
        }));
        
        setSites(formattedSites);
      }
    } catch (err: any) {
      console.error('Error fetching sites:', err);
      toast.error('Failed to load sites: ' + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchAdvances = async (siteId: string) => {
    try {
      setIsLoading(true);
      
      let query = supabase.from('advances').select('*').eq('site_id', siteId);
      
      const { data, error } = await query;
      
      if (error) {
        throw error;
      }
      
      if (data) {
        const formattedAdvances: Advance[] = data.map(advance => ({
          id: advance.id,
          date: new Date(advance.date),
          recipientId: advance.recipient_id,
          recipientName: advance.recipient_name,
          recipientType: advance.recipient_type as any,
          purpose: advance.purpose as any,
          amount: advance.amount,
          remarks: advance.remarks,
          status: advance.status as ApprovalStatus,
          createdBy: advance.created_by,
          createdAt: new Date(advance.created_at),
          siteId: advance.site_id,
          siteName: "Site Name" // Default value
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
    if (newAdvance.id) {
      setAdvances(prevAdvances => [newAdvance as Advance, ...prevAdvances]);
      toast.success("Advance added successfully");
    } else {
      try {
        const advanceWithId: Advance = {
          ...newAdvance as Advance,
          id: Date.now().toString(),
          status: ApprovalStatus.PENDING,
          createdAt: new Date(),
          siteName: "Site Name"
        };
        
        setAdvances(prevAdvances => [advanceWithId, ...prevAdvances]);
        toast.success("Advance added successfully");
      } catch (error: any) {
        console.error('Error adding advance:', error);
        toast.error('Failed to add advance: ' + error.message);
      }
    }
  };

  const filterAdvances = (advances: Advance[], filterStatus: string) => {
    switch (filterStatus) {
      case 'all':
        return advances;
      case 'pending':
        return advances.filter(advance => advance.status === ApprovalStatus.PENDING);
      case 'approved':
        return advances.filter(advance => advance.status === ApprovalStatus.APPROVED);
      default:
        return advances;
    }
  };

  const filteredAdvances = filterAdvances(advances, filterStatus)
    .filter(advance => {
      const matchesSearch = 
        advance.recipientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        advance.purpose.toLowerCase().includes(searchTerm.toLowerCase());
        
      return matchesSearch;
    });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-16rem)]">
        <div className="animate-pulse text-xl text-primary">Loading advances...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in max-h-[calc(100vh-4rem)] overflow-hidden flex flex-col">
      <PageTitle 
        title="Advances" 
        subtitle="Manage worker advances and track their status"
        className="mb-4"
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
          
          <div className="w-full md:w-64">
            <Select 
              value={filterStatus} 
              onValueChange={(value: 'all' | 'pending' | 'approved') => setFilterStatus(value)}
            >
              <SelectTrigger className="w-full">
                <CheckSquare className="h-4 w-4 mr-2 text-muted-foreground" />
                <SelectValue placeholder="All Advances" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Advances</SelectItem>
                <SelectItem value="pending">Pending Advances</SelectItem>
                <SelectItem value="approved">Approved Advances</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <div className="flex flex-wrap gap-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="h-10">
                <Filter className="h-4 w-4 mr-2 text-muted-foreground" />
                Filter
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80">
              <div className="space-y-4">
                <h4 className="font-medium">Filter Advances</h4>
                <div className="space-y-2">
                  <h5 className="text-sm font-medium">Status</h5>
                  <div className="flex flex-col space-y-2">
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="filter-all" 
                        checked={filterStatus === 'all'}
                        onCheckedChange={() => setFilterStatus('all')}
                      />
                      <Label htmlFor="filter-all">All Advances</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="filter-pending" 
                        checked={filterStatus === 'pending'}
                        onCheckedChange={() => setFilterStatus('pending')}
                      />
                      <Label htmlFor="filter-pending">Pending Advances</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="filter-approved" 
                        checked={filterStatus === 'approved'}
                        onCheckedChange={() => setFilterStatus('approved')}
                      />
                      <Label htmlFor="filter-approved">Approved Advances</Label>
                    </div>
                  </div>
                </div>
              </div>
            </PopoverContent>
          </Popover>
          <Button 
            size="sm" 
            className="h-10"
            onClick={() => setIsAdvanceFormOpen(true)}
          >
            <Plus className="h-4 w-4 mr-2" />
            New Advance
          </Button>
        </div>
      </div>
      
      <div className="overflow-y-auto flex-1 pr-2">
        {advances.length > 0 ? (
          <div className="grid grid-cols-1 gap-4">
            {filteredAdvances.map(advance => (
              <CustomCard key={advance.id}>
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-lg font-medium">{advance.recipientName}</h3>
                    <p className="text-sm text-muted-foreground">Purpose: {advance.purpose}</p>
                    <p className="text-sm text-muted-foreground">Site: {advance.siteName}</p>
                    <p className="text-sm text-muted-foreground">Date: {advance.date.toLocaleDateString()}</p>
                  </div>
                  <div className="flex items-center">
                    <span className="mr-2 text-sm text-muted-foreground">Status:</span>
                    {advance.status === ApprovalStatus.PENDING && (
                      <Badge variant="secondary">Pending</Badge>
                    )}
                    {advance.status === ApprovalStatus.APPROVED && (
                      <Badge variant="success">Approved</Badge>
                    )}
                  </div>
                </div>
                <div className="mt-2">
                  <p className="text-base font-semibold">Amount: ₹{advance.amount.toLocaleString()}</p>
                </div>
              </CustomCard>
            ))}
          </div>
        ) : (
          <CustomCard>
            <div className="p-12 text-center">
              <CircleSlash className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
              <h3 className="text-lg font-medium mb-2">No Advances Added Yet</h3>
              <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                Record your first worker advance to keep track of payments.
              </p>
              <Button 
                onClick={() => setIsAdvanceFormOpen(true)}
                className="mx-auto"
              >
                <Plus className="h-4 w-4 mr-2" />
                Record First Advance
              </Button>
            </div>
          </CustomCard>
        )}
      </div>

      <AdvanceForm
        isOpen={isAdvanceFormOpen}
        onClose={() => setIsAdvanceFormOpen(false)}
        onSubmit={handleAddAdvance}
        sites={sites}
      />
    </div>
  );
};

export default Advances;
