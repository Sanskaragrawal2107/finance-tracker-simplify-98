import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import PageTitle from '@/components/common/PageTitle';
import CustomCard from '@/components/ui/CustomCard';
import { Search, Filter, Plus, Building, User, Users, CheckSquare, CircleSlash } from 'lucide-react';
import { Expense, ExpenseCategory, ApprovalStatus, Site, Advance, FundsReceived, Invoice, UserRole, AdvancePurpose } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import SiteForm from '@/components/sites/SiteForm';
import SitesList from '@/components/sites/SitesList';
import SiteDetail from '@/components/sites/SiteDetail';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';

import { supervisors } from '@/data/supervisors';

const initialExpenses: Expense[] = [];
const initialAdvances: Advance[] = [];
const initialFunds: FundsReceived[] = [];
const initialInvoices: Invoice[] = [];

const DEBIT_ADVANCE_PURPOSES = [
  AdvancePurpose.SAFETY_SHOES,
  AdvancePurpose.TOOLS,
  AdvancePurpose.OTHER
];

const Expenses: React.FC = () => {
  const location = useLocation();
  const [expenses, setExpenses] = useState<Expense[]>(initialExpenses);
  const [sites, setSites] = useState<Site[]>([]);
  const [advances, setAdvances] = useState<Advance[]>(initialAdvances);
  const [fundsReceived, setFundsReceived] = useState<FundsReceived[]>(initialFunds);
  const [invoices, setInvoices] = useState<Invoice[]>(initialInvoices);
  const [isSiteFormOpen, setIsSiteFormOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSiteId, setSelectedSiteId] = useState<string | null>(null);
  const [selectedSupervisorId, setSelectedSupervisorId] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'completed'>('all');
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
    
    if (locationState?.newSite && storedUserRole === UserRole.ADMIN) {
      setIsSiteFormOpen(true);
    }
    
    fetchSites();
  }, [location]);

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
          isCompleted: site.is_completed,
          createdAt: new Date(site.created_at),
          funds: site.funds || 0
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

  const ensureDateObjects = (site: Site): Site => {
    return {
      ...site,
      startDate: site.startDate instanceof Date ? site.startDate : new Date(site.startDate),
      completionDate: site.completionDate ? 
        (site.completionDate instanceof Date ? site.completionDate : new Date(site.completionDate)) 
        : undefined
    };
  };

  const handleAddSite = async (newSite: Partial<Site>) => {
    if (newSite.id) {
      setSites(prevSites => [...prevSites, newSite as Site]);
    }
    
    fetchSites();
  };

  const handleAddExpense = (newExpense: Partial<Expense>) => {
    const expenseWithId: Expense = {
      ...newExpense as Expense,
      id: Date.now().toString(),
      status: ApprovalStatus.APPROVED,
      createdAt: new Date(),
      supervisorId: selectedSupervisorId || '',
    };
    
    setExpenses(prevExpenses => [expenseWithId, ...prevExpenses]);
    toast.success("Expense added successfully");
  };

  const handleAddAdvance = (newAdvance: Partial<Advance>) => {
    const advanceWithId: Advance = {
      ...newAdvance as Advance,
      id: Date.now().toString(),
      status: ApprovalStatus.APPROVED,
      createdAt: new Date(),
    };
    
    setAdvances(prevAdvances => [advanceWithId, ...prevAdvances]);
    toast.success("Advance added successfully");
  };

  const handleAddFunds = (newFund: Partial<FundsReceived>) => {
    const fundWithId: FundsReceived = {
      ...newFund as FundsReceived,
      id: Date.now().toString(),
      createdAt: new Date(),
    };
    
    setFundsReceived(prevFunds => [fundWithId, ...prevFunds]);
    
    if (fundWithId.siteId) {
      setSites(prevSites =>
        prevSites.map(site =>
          site.id === fundWithId.siteId
            ? { ...site, funds: (site.funds || 0) + fundWithId.amount }
            : site
        )
      );
    }
    
    toast.success("Funds received recorded successfully");
  };

  const handleAddInvoice = (newInvoice: Omit<Invoice, 'id' | 'createdAt'>) => {
    console.log("Adding new invoice with data:", newInvoice);
    
    const invoiceWithId: Invoice = {
      ...newInvoice,
      id: Date.now().toString(),
      createdAt: new Date(),
    };
    
    console.log("Created invoice with ID:", invoiceWithId.id);
    console.log("Invoice image URL:", invoiceWithId.invoiceImageUrl);
    
    setInvoices(prevInvoices => [invoiceWithId, ...prevInvoices]);
    toast.success("Invoice added successfully");
  };

  const handleCompleteSite = async (siteId: string, completionDate: Date) => {
    try {
      const { error } = await supabase
        .from('sites')
        .update({ 
          is_completed: true, 
          completion_date: completionDate.toISOString() 
        })
        .eq('id', siteId);
        
      if (error) {
        throw error;
      }
      
      setSites(prevSites => 
        prevSites.map(site => 
          site.id === siteId 
            ? { ...site, isCompleted: true, completionDate } 
            : site
        )
      );
      
      toast.success("Site marked as completed");
    } catch (err: any) {
      console.error('Error completing site:', err);
      toast.error('Failed to complete site: ' + err.message);
    }
  };

  const filteredSites = sites.filter(site => {
    const matchesSearch = 
      site.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      site.jobName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      site.posNo.toLowerCase().includes(searchTerm.toLowerCase());
      
    const matchesSupervisor = selectedSupervisorId 
      ? site.supervisorId === selectedSupervisorId 
      : true;
    
    const matchesStatus = 
      filterStatus === 'all' ? true :
      filterStatus === 'active' ? !site.isCompleted :
      filterStatus === 'completed' ? site.isCompleted : true;
      
    return matchesSearch && matchesSupervisor && matchesStatus;
  });

  const selectedSite = selectedSiteId 
    ? ensureDateObjects(sites.find(site => site.id === selectedSiteId) as Site)
    : null;
    
  const siteExpenses = expenses.filter(expense => expense.siteId === selectedSiteId);
  const siteAdvances = advances.filter(advance => advance.siteId === selectedSiteId);
  const siteFunds = fundsReceived.filter(fund => fund.siteId === selectedSiteId);
  const siteInvoices = invoices.filter(invoice => invoice.siteId === selectedSiteId);
  
  const allSiteInvoices = siteInvoices;
  
  const supervisorInvoices = siteInvoices.filter(invoice => 
    invoice.approverType === "supervisor" || !invoice.approverType
  );

  const calculateSiteFinancials = (siteId: string) => {
    const siteFunds = fundsReceived.filter(fund => fund.siteId === siteId);
    
    const siteExpenses = expenses.filter(expense => 
      expense.siteId === siteId && expense.status === ApprovalStatus.APPROVED
    );
    
    const siteAdvances = advances.filter(advance => 
      advance.siteId === siteId && advance.status === ApprovalStatus.APPROVED
    );
    
    const siteInvoices = invoices.filter(invoice => 
      invoice.siteId === siteId && invoice.paymentStatus === 'paid'
    );

    const regularAdvances = siteAdvances.filter(advance => 
      !DEBIT_ADVANCE_PURPOSES.includes(advance.purpose as AdvancePurpose)
    );

    const debitAdvances = siteAdvances.filter(advance => 
      DEBIT_ADVANCE_PURPOSES.includes(advance.purpose as AdvancePurpose)
    );

    const supervisorInvoices = siteInvoices.filter(invoice => 
      invoice.approverType === "supervisor" || !invoice.approverType
    );

    const totalFunds = siteFunds.reduce((sum, fund) => sum + fund.amount, 0);
    const totalExpenses = siteExpenses.reduce((sum, expense) => sum + expense.amount, 0);
    const totalRegularAdvances = regularAdvances.reduce((sum, advance) => sum + advance.amount, 0);
    const totalDebitToWorker = debitAdvances.reduce((sum, advance) => sum + advance.amount, 0);
    const supervisorInvoiceTotal = supervisorInvoices.reduce((sum, invoice) => sum + invoice.netAmount, 0);
    const pendingInvoicesTotal = siteInvoices
      .filter(invoice => invoice.paymentStatus === 'pending')
      .reduce((sum, invoice) => sum + invoice.netAmount, 0);

    const totalBalance = totalFunds - totalExpenses - totalRegularAdvances - supervisorInvoiceTotal;

    return {
      fundsReceived: totalFunds,
      totalExpenditure: totalExpenses,
      totalAdvances: totalRegularAdvances,
      debitsToWorker: totalDebitToWorker,
      invoicesPaid: supervisorInvoiceTotal,
      pendingInvoices: pendingInvoicesTotal,
      totalBalance: totalBalance
    };
  };

  const getSelectedSupervisorName = () => {
    if (!selectedSupervisorId) return null;
    const supervisor = supervisors.find(s => s.id === selectedSupervisorId);
    return supervisor ? supervisor.name : "Unknown Supervisor";
  };

  const siteSupervisor = selectedSite && selectedSite.supervisorId ? 
    supervisors.find(s => s.id === selectedSite.supervisorId) : null;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-16rem)]">
        <div className="animate-pulse text-xl text-primary">Loading sites...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in max-h-[calc(100vh-4rem)] overflow-hidden flex flex-col">
      {selectedSite ? (
        <div className="overflow-y-auto flex-1 pr-2">
          <SiteDetail 
            site={selectedSite}
            expenses={siteExpenses}
            advances={siteAdvances}
            fundsReceived={siteFunds}
            invoices={allSiteInvoices}
            supervisorInvoices={supervisorInvoices}
            onBack={() => setSelectedSiteId(null)}
            onAddExpense={handleAddExpense}
            onAddAdvance={handleAddAdvance}
            onAddFunds={handleAddFunds}
            onAddInvoice={handleAddInvoice}
            onCompleteSite={handleCompleteSite}
            balanceSummary={calculateSiteFinancials(selectedSite.id)}
            siteSupervisor={siteSupervisor}
          />
        </div>
      ) : (
        <>
          <PageTitle 
            title="Sites & Expenses" 
            subtitle={userRole === UserRole.ADMIN 
              ? "Manage construction sites and track expenses across supervisors"
              : "Manage construction sites and track expenses"}
            className="mb-4"
          />
          
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
            <div className="flex flex-col md:flex-row md:items-center gap-4 w-full md:w-auto">
              <div className="relative max-w-md w-full">
                <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
                <input 
                  type="text" 
                  placeholder="Search sites..." 
                  className="py-2 pl-10 pr-4 border rounded-md w-full focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              
              {userRole === UserRole.ADMIN && (
                <div className="w-full md:w-64">
                  <Select 
                    value={selectedSupervisorId || ''} 
                    onValueChange={(value) => setSelectedSupervisorId(value || null)}
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
              )}
              
              {userRole === UserRole.ADMIN && (
                <div className="w-full md:w-64">
                  <Select 
                    value={filterStatus} 
                    onValueChange={(value: 'all' | 'active' | 'completed') => setFilterStatus(value)}
                  >
                    <SelectTrigger className="w-full">
                      <CheckSquare className="h-4 w-4 mr-2 text-muted-foreground" />
                      <SelectValue placeholder="All Sites" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Sites</SelectItem>
                      <SelectItem value="active">Active Sites</SelectItem>
                      <SelectItem value="completed">Completed Sites</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
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
                    <h4 className="font-medium">Filter Sites</h4>
                    <div className="space-y-2">
                      <h5 className="text-sm font-medium">Status</h5>
                      <div className="flex flex-col space-y-2">
                        <div className="flex items-center space-x-2">
                          <Checkbox 
                            id="filter-all" 
                            checked={filterStatus === 'all'}
                            onCheckedChange={() => setFilterStatus('all')}
                          />
                          <Label htmlFor="filter-all">All Sites</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox 
                            id="filter-active" 
                            checked={filterStatus === 'active'}
                            onCheckedChange={() => setFilterStatus('active')}
                          />
                          <Label htmlFor="filter-active">Active Sites</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox 
                            id="filter-completed" 
                            checked={filterStatus === 'completed'}
                            onCheckedChange={() => setFilterStatus('completed')}
                          />
                          <Label htmlFor="filter-completed">Completed Sites</Label>
                        </div>
                      </div>
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
              <Button 
                size="sm" 
                className="h-10"
                onClick={() => setIsSiteFormOpen(true)}
              >
                <Plus className="h-4 w-4 mr-2" />
                <Building className="h-4 w-4 mr-2" />
                New Site
              </Button>
            </div>
          </div>
          
          {userRole === UserRole.ADMIN && selectedSupervisorId && (
            <div className="mb-4 p-3 bg-blue-50 border border-blue-100 rounded-md flex items-center">
              <Users className="h-5 w-5 mr-2 text-blue-500" />
              <span className="font-medium">
                Viewing sites for: {getSelectedSupervisorName()}
              </span>
            </div>
          )}
          
          <div className="overflow-y-auto flex-1 pr-2">
            {sites.length > 0 ? (
              <SitesList 
                sites={filteredSites}
                onSelectSite={(siteId) => setSelectedSiteId(siteId)}
              />
            ) : (
              <CustomCard>
                <div className="p-12 text-center">
                  <Building className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                  <h3 className="text-lg font-medium mb-2">No Sites Added Yet</h3>
                  <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                    Create your first construction site to start tracking expenses. Each site will have its own dedicated expense tracking.
                  </p>
                  <Button 
                    onClick={() => setIsSiteFormOpen(true)}
                    className="mx-auto"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Create First Site
                  </Button>
                </div>
              </CustomCard>
            )}
          </div>
        </>
      )}

      <SiteForm
        isOpen={isSiteFormOpen}
        onClose={() => setIsSiteFormOpen(false)}
        onSubmit={handleAddSite}
        supervisorId={userRole === UserRole.ADMIN && selectedSupervisorId 
          ? selectedSupervisorId 
          : selectedSupervisorId || ''}
      />
    </div>
  );
};

export default Expenses;
