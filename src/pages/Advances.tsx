
import React, { useState, useEffect } from 'react';
import { Advance, RecipientType, AdvancePurpose, ApprovalStatus, UserRole } from '@/lib/types';
import PageTitle from '@/components/common/PageTitle';
import AdvanceFilter from '@/components/advances/AdvanceFilter';
import AdvancesList from '@/components/advances/AdvancesList';
import AdvanceForm from '@/components/advances/AdvanceForm';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// Sample advances data for initial development
const initialAdvances: Advance[] = [
  {
    id: "1",
    date: new Date('2023-01-05'),
    recipientId: "sub1",
    recipientName: "Devnath Contractors",
    recipientType: RecipientType.SUBCONTRACTOR,
    purpose: AdvancePurpose.MATERIAL,
    amount: 25000,
    status: ApprovalStatus.APPROVED,
    createdBy: "Supervisor A",
    createdAt: new Date('2023-01-05'),
    siteId: "site1"
  },
  {
    id: "2",
    date: new Date('2023-01-10'),
    recipientId: "sub2",
    recipientName: "Kailash & Company",
    recipientType: RecipientType.SUBCONTRACTOR,
    purpose: AdvancePurpose.MATERIAL,
    amount: 15000,
    status: ApprovalStatus.APPROVED,
    createdBy: "Supervisor B",
    createdAt: new Date('2023-01-10'),
    siteId: "site2"
  },
  {
    id: "3",
    date: new Date('2023-01-15'),
    recipientId: "w1",
    recipientName: "Mahendra Singh",
    recipientType: RecipientType.WORKER,
    purpose: AdvancePurpose.WAGES,
    amount: 5000,
    status: ApprovalStatus.APPROVED,
    createdBy: "Supervisor C",
    createdAt: new Date('2023-01-15'),
    siteId: "site3"
  },
  {
    id: "4",
    date: new Date('2023-01-20'),
    recipientId: "sub3",
    recipientName: "Transport Services",
    recipientType: RecipientType.SUBCONTRACTOR,
    purpose: AdvancePurpose.TRANSPORT,
    amount: 8000,
    status: ApprovalStatus.PENDING,
    createdBy: "Supervisor A",
    createdAt: new Date('2023-01-20'),
    siteId: "site1"
  },
  {
    id: "5",
    date: new Date('2023-01-25'),
    recipientId: "w2",
    recipientName: "Rajesh Kumar",
    recipientType: RecipientType.WORKER,
    purpose: AdvancePurpose.WAGES,
    amount: 3000,
    status: ApprovalStatus.PENDING,
    createdBy: "Supervisor B",
    createdAt: new Date('2023-01-25'),
    siteId: "site2"
  }
];

const purposeOptions = [
  { label: "Material", value: AdvancePurpose.MATERIAL },
  { label: "Wages", value: AdvancePurpose.WAGES },
  { label: "Transport", value: AdvancePurpose.TRANSPORT },
  { label: "Miscellaneous", value: AdvancePurpose.MISC },
  { label: "Advance", value: AdvancePurpose.ADVANCE },
  { label: "Safety Shoes", value: AdvancePurpose.SAFETY_SHOES },
  { label: "Tools", value: AdvancePurpose.TOOLS },
  { label: "Other", value: AdvancePurpose.OTHER }
];

const recipientTypeOptions = [
  { label: "Worker", value: RecipientType.WORKER },
  { label: "Subcontractor", value: RecipientType.SUBCONTRACTOR },
  { label: "Supervisor", value: RecipientType.SUPERVISOR }
];

const Advances = () => {
  const [advances, setAdvances] = useState<Advance[]>([]);
  const [filteredAdvances, setFilteredAdvances] = useState<Advance[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [supervisorId, setSupervisorId] = useState<string | null>(null);

  useEffect(() => {
    const storedUserRole = localStorage.getItem('userRole') as UserRole;
    const storedSupervisorId = localStorage.getItem('supervisorId');
    
    if (storedUserRole) {
      setUserRole(storedUserRole);
      
      if (storedUserRole === UserRole.SUPERVISOR && storedSupervisorId) {
        setSupervisorId(storedSupervisorId);
      }
    }
    
    fetchAdvances();
  }, []);

  const fetchAdvances = async () => {
    try {
      setIsLoading(true);
      let query = supabase.from('advances').select('*');
      
      const { data, error } = await query;
      
      if (error) throw error;
      
      if (data) {
        const formattedAdvances: Advance[] = data.map(adv => ({
          id: adv.id,
          date: new Date(adv.date),
          recipientId: adv.recipient_id || '',
          recipientName: adv.recipient_name,
          recipientType: adv.recipient_type as RecipientType,
          purpose: adv.purpose as AdvancePurpose,
          amount: adv.amount,
          remarks: adv.remarks || '',
          status: adv.status as ApprovalStatus,
          createdBy: adv.created_by || '',
          createdAt: new Date(adv.created_at),
          siteId: adv.site_id
        }));
        
        setAdvances(formattedAdvances);
        setFilteredAdvances(formattedAdvances);
      } else {
        // If no data from Supabase, use the initial data
        setAdvances(initialAdvances);
        setFilteredAdvances(initialAdvances);
      }
    } catch (err: any) {
      console.error('Error fetching advances:', err);
      toast.error('Failed to load advances: ' + err.message);
      // Fallback to initial data if API fails
      setAdvances(initialAdvances);
      setFilteredAdvances(initialAdvances);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddAdvance = async (newAdvance: Partial<Advance>) => {
    try {
      // Create a complete advance object
      const advanceWithId: Advance = {
        ...newAdvance as Advance,
        id: Date.now().toString(),
        createdAt: new Date(),
        siteId: newAdvance.siteId || "default-site", // Ensure siteId is present
      };
      
      // Save to Supabase
      const { data, error } = await supabase
        .from('advances')
        .insert({
          date: advanceWithId.date instanceof Date ? advanceWithId.date.toISOString() : advanceWithId.date,
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
      
      // Add to state
      setAdvances(prevAdvances => [advanceWithId, ...prevAdvances]);
      setFilteredAdvances(prevFiltered => [advanceWithId, ...prevFiltered]);
      
      setIsFormOpen(false);
      toast.success('Advance added successfully');
    } catch (err: any) {
      console.error('Error adding advance:', err);
      toast.error('Failed to add advance: ' + err.message);
    }
  };

  const handleFilter = (filtered: Advance[]) => {
    setFilteredAdvances(filtered);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-16rem)]">
        <div className="animate-pulse text-xl text-primary">Loading advances...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <PageTitle 
        title="Advances Management" 
        subtitle="Manage and track all advances to workers and subcontractors"
      />
      
      <div className="flex justify-between items-center">
        <AdvanceFilter 
          advances={advances} 
          onFilter={handleFilter}
          purposeOptions={purposeOptions}
          recipientTypeOptions={recipientTypeOptions}
        />
        
        <Button onClick={() => setIsFormOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          New Advance
        </Button>
      </div>
      
      <AdvancesList 
        advances={filteredAdvances} 
        purposeOptions={purposeOptions}
      />
      
      <AdvanceForm 
        isOpen={isFormOpen} 
        onClose={() => setIsFormOpen(false)} 
        onSubmit={handleAddAdvance}
        purposeOptions={purposeOptions}
        recipientTypeOptions={recipientTypeOptions}
      />
    </div>
  );
};

export default Advances;
