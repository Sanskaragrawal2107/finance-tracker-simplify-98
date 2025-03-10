import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import PageTitle from '@/components/common/PageTitle';
import CustomCard from '@/components/ui/CustomCard';
import { User, Users, Building2, BarChart, CheckCircle, Clock } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { UserRole, Site, Expense, Advance, FundsReceived, Invoice, BalanceSummary, ApprovalStatus, RecipientType, PaymentMethod, BankDetails, PaymentStatus, AdvancePurpose } from '@/lib/types';
import { toast } from 'sonner';
import { useIsMobile } from '@/hooks/use-mobile';
import { supabase } from '@/integrations/supabase/client';
import SitesList from '@/components/sites/SitesList';
import SiteDetail from '@/components/sites/SiteDetail';

interface SupervisorType {
  id: string;
  name: string;
  userId: string | undefined;
  createdAt: Date | undefined;
  email: string | undefined;
}

interface SupervisorStats {
  totalSites: number;
  activeSites: number;
  completedSites: number;
}

const AdminDashboard: React.FC = () => {
  const [selectedSupervisorId, setSelectedSupervisorId] = useState<string | null>(null);
  const [supervisors, setSupervisors] = useState<SupervisorType[]>([]);
  const [supervisorStats, setSupervisorStats] = useState<Record<string, SupervisorStats>>({});
  const [loading, setLoading] = useState(true);
  const [sites, setSites] = useState<Site[]>([]);
  const [selectedSiteId, setSelectedSiteId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('all');
  
  const [selectedSite, setSelectedSite] = useState<Site | null>(null);
  const [siteExpenses, setSiteExpenses] = useState<Expense[]>([]);
  const [siteAdvances, setSiteAdvances] = useState<Advance[]>([]);
  const [siteFundsReceived, setSiteFundsReceived] = useState<FundsReceived[]>([]);
  const [siteInvoices, setSiteInvoices] = useState<Invoice[]>([]);
  const [siteSupervisorInvoices, setSiteSupervisorInvoices] = useState<Invoice[]>([]);
  const [siteBalanceSummary, setSiteBalanceSummary] = useState<BalanceSummary>({
    fundsReceived: 0,
    totalExpenditure: 0,
    totalAdvances: 0,
    debitsToWorker: 0,
    totalBalance: 0
  });
  const [siteSupervisor, setSiteSupervisor] = useState<{ id: string; name: string } | null>(null);
  
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  
  useEffect(() => {
    const fetchSupervisors = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('supervisors')
          .select('*');
          
        if (error) {
          throw error;
        }
        
        if (data) {
          const mappedSupervisors: SupervisorType[] = data.map(supervisor => ({
            id: supervisor.id,
            name: supervisor.name,
            userId: supervisor.user_id || undefined,
            createdAt: supervisor.created_at ? new Date(supervisor.created_at) : undefined,
            email: undefined
          }));
          
          setSupervisors(mappedSupervisors);
          
          const stats: Record<string, SupervisorStats> = {};
          
          await Promise.all(data.map(async (supervisor) => {
            const { data: sitesData, error: sitesError } = await supabase
              .from('sites')
              .select('*')
              .eq('supervisor_id', supervisor.id);
              
            if (sitesError) {
              throw sitesError;
            }
            
            const totalSites = sitesData ? sitesData.length : 0;
            const activeSites = sitesData ? sitesData.filter(site => !site.is_completed).length : 0;
            const completedSites = sitesData ? sitesData.filter(site => site.is_completed).length : 0;
            
            stats[supervisor.id] = {
              totalSites,
              activeSites,
              completedSites
            };
          }));
          
          setSupervisorStats(stats);
        }
      } catch (error: any) {
        console.error('Error fetching supervisors:', error.message);
        toast.error('Failed to load supervisors');
      } finally {
        setLoading(false);
      }
    };
    
    fetchSupervisors();
  }, []);
  
  useEffect(() => {
    const fetchSites = async () => {
      setLoading(true);
      try {
        let query = supabase.from('sites').select('*');
        
        if (selectedSupervisorId) {
          query = query.eq('supervisor_id', selectedSupervisorId);
        }
        
        if (activeTab === 'active') {
          query = query.eq('is_completed', false);
        } else if (activeTab === 'completed') {
          query = query.eq('is_completed', true);
        }
        
        const { data, error } = await query;
        
        if (error) {
          throw error;
        }
        
        if (data) {
          const mappedSites: Site[] = data.map(site => ({
            id: site.id,
            name: site.name,
            jobName: site.job_name,
            posNo: site.pos_no,
            startDate: new Date(site.start_date),
            completionDate: site.completion_date ? new Date(site.completion_date) : undefined,
            supervisorId: site.supervisor_id,
            createdAt: new Date(site.created_at),
            isCompleted: site.is_completed || false,
            funds: site.funds
          }));
          
          setSites(mappedSites);
          setSelectedSiteId(null);
        }
      } catch (error: any) {
        console.error('Error fetching sites:', error.message);
        toast.error('Failed to load sites');
      } finally {
        setLoading(false);
      }
    };
    
    fetchSites();
  }, [selectedSupervisorId, activeTab]);
  
  useEffect(() => {
    const checkAdminAccess = async () => {
      try {
        const { data: session } = await supabase.auth.getSession();
        if (!session.session) {
          toast.error("You must be logged in");
          navigate('/');
          return;
        }
        
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', session.session.user.id)
          .maybeSingle();
        
        if (error || !profile || profile?.role !== UserRole.ADMIN) {
          toast.error("You don't have permission to access this page");
          navigate('/');
        }
      } catch (error) {
        console.error("Error checking admin access:", error);
        toast.error("Error verifying your access");
        navigate('/');
      }
    };
    
    checkAdminAccess();
  }, [navigate]);
  
  useEffect(() => {
    const fetchSiteDetails = async () => {
      if (!selectedSiteId) return;
      
      setLoading(true);
      try {
        const { data: siteData, error: siteError } = await supabase
          .from('sites')
          .select('*')
          .eq('id', selectedSiteId)
          .single();
          
        if (siteError) throw siteError;
        
        if (siteData) {
          const mappedSite: Site = {
            id: siteData.id,
            name: siteData.name,
            jobName: siteData.job_name,
            posNo: siteData.pos_no,
            startDate: new Date(siteData.start_date),
            completionDate: siteData.completion_date ? new Date(siteData.completion_date) : undefined,
            supervisorId: siteData.supervisor_id,
            createdAt: new Date(siteData.created_at),
            isCompleted: siteData.is_completed || false,
            funds: siteData.funds
          };
          
          setSelectedSite(mappedSite);
          
          if (mappedSite.supervisorId) {
            const { data: supervisorData, error: supervisorError } = await supabase
              .from('supervisors')
              .select('id, name')
              .eq('id', mappedSite.supervisorId)
              .single();
              
            if (!supervisorError && supervisorData) {
              setSiteSupervisor({
                id: supervisorData.id,
                name: supervisorData.name
              });
            }
          }
          
          const { data: expensesData, error: expensesError } = await supabase
            .from('expenses')
            .select('*')
            .eq('site_id', selectedSiteId);
            
          if (expensesError) throw expensesError;
          
          if (expensesData) {
            const mappedExpenses: Expense[] = expensesData.map(expense => ({
              id: expense.id,
              date: new Date(expense.date),
              description: expense.description,
              category: expense.category,
              amount: expense.amount,
              status: expense.status as ApprovalStatus,
              createdBy: expense.created_by,
              createdAt: new Date(expense.created_at),
              siteId: expense.site_id,
              supervisorId: expense.supervisor_id
            }));
            
            setSiteExpenses(mappedExpenses);
          }
          
          const { data: advancesData, error: advancesError } = await supabase
            .from('advances')
            .select('*')
            .eq('site_id', selectedSiteId);
            
          if (advancesError) throw advancesError;
          
          if (advancesData) {
            const mappedAdvances: Advance[] = advancesData.map(advance => ({
              id: advance.id,
              date: new Date(advance.date),
              recipientId: advance.recipient_id,
              recipientName: advance.recipient_name,
              recipientType: advance.recipient_type as RecipientType,
              purpose: advance.purpose as AdvancePurpose,
              amount: advance.amount,
              remarks: advance.remarks,
              status: advance.status as ApprovalStatus,
              createdBy: advance.created_by,
              createdAt: new Date(advance.created_at),
              siteId: advance.site_id
            }));
            
            setSiteAdvances(mappedAdvances);
          }
          
          const { data: fundsData, error: fundsError } = await supabase
            .from('funds_received')
            .select('*')
            .eq('site_id', selectedSiteId);
            
          if (fundsError) throw fundsError;
          
          if (fundsData) {
            const mappedFunds: FundsReceived[] = fundsData.map(fund => ({
              id: fund.id,
              date: new Date(fund.date),
              amount: fund.amount,
              siteId: fund.site_id,
              createdAt: new Date(fund.created_at),
              reference: fund.reference,
              method: fund.method as PaymentMethod
            }));
            
            setSiteFundsReceived(mappedFunds);
          }
          
          const { data: invoicesData, error: invoicesError } = await supabase
            .from('invoices')
            .select('*')
            .eq('site_id', selectedSiteId);
            
          if (invoicesError) throw invoicesError;
          
          if (invoicesData) {
            const mappedInvoices: Invoice[] = invoicesData.map(invoice => ({
              id: invoice.id,
              date: new Date(invoice.date),
              partyId: invoice.party_id,
              partyName: invoice.party_name,
              material: invoice.material,
              quantity: invoice.quantity,
              rate: invoice.rate,
              gstPercentage: invoice.gst_percentage,
              grossAmount: invoice.gross_amount,
              netAmount: invoice.net_amount,
              bankDetails: invoice.bank_details as unknown as BankDetails,
              billUrl: invoice.bill_url,
              invoiceImageUrl: invoice.invoice_image_url,
              paymentStatus: invoice.payment_status as PaymentStatus,
              createdBy: invoice.created_by,
              createdAt: new Date(invoice.created_at),
              approverType: invoice.approver_type as "ho" | "supervisor",
              siteId: invoice.site_id,
              vendorName: invoice.vendor_name,
              invoiceNumber: invoice.invoice_number,
              amount: invoice.amount
            }));
            
            setSiteInvoices(mappedInvoices);
          }
          
          const totalExpenses = expensesData ? expensesData.reduce((sum, expense) => sum + expense.amount, 0) : 0;
          const totalAdvances = advancesData ? advancesData.reduce((sum, advance) => sum + advance.amount, 0) : 0;
          const totalFundsReceived = fundsData ? fundsData.reduce((sum, fund) => sum + fund.amount, 0) : 0;
          const totalInvoices = invoicesData ? invoicesData.reduce((sum, invoice) => sum + invoice.net_amount, 0) : 0;
          
          setSiteBalanceSummary({
            fundsReceived: totalFundsReceived,
            totalExpenditure: totalExpenses,
            totalAdvances: totalAdvances,
            debitsToWorker: 0,
            totalBalance: totalFundsReceived - totalExpenses - totalAdvances
          });
        }
      } catch (error: any) {
        console.error('Error fetching site details:', error.message);
        toast.error('Failed to load site details');
      } finally {
        setLoading(false);
      }
    };
    
    fetchSiteDetails();
  }, [selectedSiteId]);
  
  const handleSelectSite = (siteId: string) => {
    setSelectedSiteId(siteId);
  };
  
  const handleBackToSites = () => {
    setSelectedSiteId(null);
    setSelectedSite(null);
  };
  
  const getSelectedSupervisor = () => {
    return supervisors.find(s => s.id === selectedSupervisorId);
  };
  
  const handleAddExpense = (expense: Partial<Expense>) => {
    console.log('Adding expense:', expense);
    toast.info('This functionality is not yet implemented');
  };
  
  const handleAddAdvance = (advance: Partial<Advance>) => {
    console.log('Adding advance:', advance);
    toast.info('This functionality is not yet implemented');
  };
  
  const handleAddFunds = (fund: Partial<FundsReceived>) => {
    console.log('Adding funds:', fund);
    toast.info('This functionality is not yet implemented');
  };
  
  const handleAddInvoice = (invoice: Omit<Invoice, 'id' | 'createdAt'>) => {
    console.log('Adding invoice:', invoice);
    toast.info('This functionality is not yet implemented');
  };
  
  const handleCompleteSite = async (siteId: string, completionDate: Date) => {
    try {
      const { error } = await supabase
        .from('sites')
        .update({ is_completed: true, completion_date: completionDate.toISOString() })
        .eq('id', siteId);
        
      if (error) throw error;
      
      toast.success('Site marked as completed');
      
      if (selectedSite) {
        setSelectedSite({
          ...selectedSite,
          isCompleted: true,
          completionDate
        });
      }
      
      const updatedSites = sites.map(site => 
        site.id === siteId ? { ...site, isCompleted: true, completionDate } : site
      );
      setSites(updatedSites);
      
    } catch (error: any) {
      console.error('Error completing site:', error.message);
      toast.error('Failed to mark site as completed');
    }
  };
  
  return (
    <div className="space-y-6 animate-fade-in">
      <PageTitle 
        title="Admin Dashboard" 
        subtitle="Manage supervisors and view site statistics"
        className="mb-4"
      />
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <CustomCard className="bg-gradient-to-br from-blue-50 to-indigo-50">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-blue-100 mr-4">
              <Users className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h3 className="text-sm font-medium text-muted-foreground">Total Supervisors</h3>
              <p className="text-2xl font-bold">{supervisors.length}</p>
            </div>
          </div>
        </CustomCard>
        
        <CustomCard className="bg-gradient-to-br from-green-50 to-emerald-50">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-green-100 mr-4">
              <Building2 className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <h3 className="text-sm font-medium text-muted-foreground">Total Sites</h3>
              <p className="text-2xl font-bold">
                {Object.values(supervisorStats).reduce((sum, stat) => sum + stat.totalSites, 0)}
              </p>
            </div>
          </div>
        </CustomCard>
        
        <CustomCard className="bg-gradient-to-br from-purple-50 to-violet-50">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-purple-100 mr-4">
              <BarChart className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <h3 className="text-sm font-medium text-muted-foreground">Active Sites</h3>
              <p className="text-2xl font-bold">
                {Object.values(supervisorStats).reduce((sum, stat) => sum + stat.activeSites, 0)}
              </p>
            </div>
          </div>
        </CustomCard>
      </div>
      
      <CustomCard>
        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-4">Supervisor Management</h2>
          <label className="text-sm font-medium text-muted-foreground mb-2 block">
            Select a supervisor to view their sites
          </label>
          <div className="max-w-md">
            <Select 
              value={selectedSupervisorId || ''} 
              onValueChange={(value) => {
                setSelectedSupervisorId(value || null);
                setSelectedSiteId(null);
              }}
            >
              <SelectTrigger className="w-full">
                <User className="h-4 w-4 mr-2 text-muted-foreground" />
                <SelectValue placeholder="All Supervisors" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Supervisors</SelectItem>
                {supervisors.map((supervisor) => (
                  <SelectItem key={supervisor.id} value={supervisor.id}>
                    {supervisor.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        
        {selectedSupervisorId && (
          <div className="space-y-4 mb-6">
            <div className="p-4 border rounded-lg bg-background">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <User className="h-5 w-5 text-primary" />
                    <h3 className="text-lg font-medium">{getSelectedSupervisor()?.name}</h3>
                  </div>
                  
                  <div className="flex flex-wrap gap-2 mt-2">
                    <Badge variant="outline" className="bg-blue-50 text-blue-800 hover:bg-blue-50">
                      {supervisorStats[selectedSupervisorId]?.totalSites || 0} Total Sites
                    </Badge>
                    <Badge variant="outline" className="bg-green-50 text-green-800 hover:bg-green-50">
                      {supervisorStats[selectedSupervisorId]?.activeSites || 0} Active
                    </Badge>
                    <Badge variant="outline" className="bg-amber-50 text-amber-800 hover:bg-amber-50">
                      {supervisorStats[selectedSupervisorId]?.completedSites || 0} Completed
                    </Badge>
                  </div>
                </div>
                
                <Button onClick={() => navigate('/expenses', { state: { supervisorId: selectedSupervisorId } })}>
                  <Building2 className="h-4 w-4 mr-2" />
                  Manage Sites
                </Button>
              </div>
            </div>
          </div>
        )}
      </CustomCard>
      
      <CustomCard>
        <h2 className="text-xl font-semibold mb-4">Sites Management</h2>
        
        {selectedSiteId && selectedSite ? (
          <div>
            <Button variant="outline" onClick={handleBackToSites} className="mb-4">
              Back to Sites List
            </Button>
            <SiteDetail 
              site={selectedSite}
              expenses={siteExpenses}
              advances={siteAdvances}
              fundsReceived={siteFundsReceived}
              invoices={siteInvoices}
              supervisorInvoices={siteSupervisorInvoices}
              balanceSummary={siteBalanceSummary}
              siteSupervisor={siteSupervisor}
              onBack={handleBackToSites}
              onAddExpense={handleAddExpense}
              onAddAdvance={handleAddAdvance}
              onAddFunds={handleAddFunds}
              onAddInvoice={handleAddInvoice}
              onCompleteSite={handleCompleteSite}
            />
          </div>
        ) : (
          <>
            <Tabs defaultValue={activeTab} onValueChange={setActiveTab} className="mb-4">
              <TabsList>
                <TabsTrigger value="all">All Sites</TabsTrigger>
                <TabsTrigger value="active">
                  <Clock className="h-4 w-4 mr-2" />
                  Active Sites
                </TabsTrigger>
                <TabsTrigger value="completed">
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Completed Sites
                </TabsTrigger>
              </TabsList>
            </Tabs>
            
            {loading ? (
              <div className="text-center py-8">
                <p>Loading sites...</p>
              </div>
            ) : sites.length === 0 ? (
              <div className="text-center py-8 border rounded-lg">
                <Building2 className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-30" />
                <h3 className="text-lg font-medium mb-2">No Sites Found</h3>
                <p className="text-muted-foreground max-w-md mx-auto">
                  {selectedSupervisorId 
                    ? "This supervisor doesn't have any sites yet." 
                    : "There are no sites in the system yet."}
                </p>
                <Button 
                  className="mt-4"
                  onClick={() => navigate('/expenses', { state: { newSite: true } })}
                >
                  Create New Site
                </Button>
              </div>
            ) : (
              <SitesList 
                sites={sites} 
                onSelectSite={handleSelectSite} 
              />
            )}
          </>
        )}
      </CustomCard>
      
      <CustomCard>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Quick Actions</h2>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Button 
            variant="outline" 
            className="h-auto py-6 flex flex-col items-center justify-center text-center"
            onClick={() => navigate('/expenses')}
          >
            <Building2 className="h-8 w-8 mb-2" />
            <span className="text-base font-medium">View All Sites</span>
            <span className="text-xs text-muted-foreground mt-1">
              Access complete site listing
            </span>
          </Button>
          
          <Button 
            variant="outline" 
            className="h-auto py-6 flex flex-col items-center justify-center text-center"
            onClick={() => navigate('/expenses', { state: { newSite: true } })}
          >
            <Building2 className="h-8 w-8 mb-2" />
            <span className="text-base font-medium">Create New Site</span>
            <span className="text-xs text-muted-foreground mt-1">
              Add a new construction site
            </span>
          </Button>
        </div>
      </CustomCard>
    </div>
  );
};

export default AdminDashboard;
