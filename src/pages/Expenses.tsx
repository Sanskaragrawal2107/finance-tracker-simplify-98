import React, { useState } from 'react';
import PageTitle from '@/components/common/PageTitle';
import CustomCard from '@/components/ui/CustomCard';
import { Search, Filter, Plus, Building } from 'lucide-react';
import { Expense, ExpenseCategory, ApprovalStatus, Site, Advance, FundsReceived, Invoice } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import SiteForm from '@/components/sites/SiteForm';
import SitesList from '@/components/sites/SitesList';
import SiteDetail from '@/components/sites/SiteDetail';

const initialExpenses: Expense[] = [];
const initialSites: Site[] = [];
const initialAdvances: Advance[] = [];
const initialFunds: FundsReceived[] = [];
const initialInvoices: Invoice[] = [];

const SUPERVISOR_ID = "sup123";

const Expenses: React.FC = () => {
  const [expenses, setExpenses] = useState<Expense[]>(initialExpenses);
  const [sites, setSites] = useState<Site[]>(initialSites);
  const [advances, setAdvances] = useState<Advance[]>(initialAdvances);
  const [fundsReceived, setFundsReceived] = useState<FundsReceived[]>(initialFunds);
  const [invoices, setInvoices] = useState<Invoice[]>(initialInvoices);
  const [isSiteFormOpen, setIsSiteFormOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSiteId, setSelectedSiteId] = useState<string | null>(null);

  const ensureDateObjects = (site: Site): Site => {
    return {
      ...site,
      startDate: site.startDate instanceof Date ? site.startDate : new Date(site.startDate),
      completionDate: site.completionDate ? 
        (site.completionDate instanceof Date ? site.completionDate : new Date(site.completionDate)) 
        : undefined
    };
  };

  const handleAddSite = (newSite: Partial<Site>) => {
    const siteWithId: Site = {
      ...newSite as Site,
      id: Date.now().toString(),
      supervisorId: SUPERVISOR_ID,
      createdAt: new Date(),
      isCompleted: false,
      funds: 0
    };
    
    setSites(prevSites => [...prevSites, siteWithId]);
    toast.success(`Site "${siteWithId.name}" created successfully`);
  };

  const handleAddExpense = (newExpense: Partial<Expense>) => {
    const expenseWithId: Expense = {
      ...newExpense as Expense,
      id: Date.now().toString(),
      status: ApprovalStatus.PENDING,
      createdAt: new Date(),
      supervisorId: SUPERVISOR_ID,
    };
    
    setExpenses(prevExpenses => [expenseWithId, ...prevExpenses]);
    toast.success("Expense added successfully");
  };

  const handleAddAdvance = (newAdvance: Partial<Advance>) => {
    const advanceWithId: Advance = {
      ...newAdvance as Advance,
      id: Date.now().toString(),
      status: ApprovalStatus.PENDING,
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

  const handleCompleteSite = (siteId: string, completionDate: Date) => {
    setSites(prevSites => 
      prevSites.map(site => 
        site.id === siteId 
          ? { ...site, isCompleted: true, completionDate } 
          : site
      )
    );
    
    toast.success("Site marked as completed");
  };

  const filteredSites = sites.filter(site => 
    site.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    site.jobName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    site.posNo.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const selectedSite = selectedSiteId 
    ? ensureDateObjects(sites.find(site => site.id === selectedSiteId) as Site)
    : null;
    
  const siteExpenses = expenses.filter(expense => expense.siteId === selectedSiteId);
  const siteAdvances = advances.filter(advance => advance.siteId === selectedSiteId);
  const siteFunds = fundsReceived.filter(fund => fund.siteId === selectedSiteId);
  const siteInvoices = invoices.filter(invoice => invoice.siteId === selectedSiteId);

  return (
    <div className="space-y-8 animate-fade-in">
      <PageTitle 
        title="Sites & Expenses" 
        subtitle="Manage construction sites and track expenses"
      />
      
      {selectedSite ? (
        <SiteDetail 
          site={selectedSite}
          expenses={siteExpenses}
          advances={siteAdvances}
          fundsReceived={siteFunds}
          invoices={siteInvoices}
          onBack={() => setSelectedSiteId(null)}
          onAddExpense={handleAddExpense}
          onAddAdvance={handleAddAdvance}
          onAddFunds={handleAddFunds}
          onAddInvoice={handleAddInvoice}
          onCompleteSite={handleCompleteSite}
        />
      ) : (
        <>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="relative max-w-md">
              <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
              <input 
                type="text" 
                placeholder="Search sites..." 
                className="py-2 pl-10 pr-4 border rounded-md w-full md:w-80 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" size="sm" className="h-10">
                <Filter className="h-4 w-4 mr-2 text-muted-foreground" />
                Filter
              </Button>
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
        </>
      )}

      <SiteForm
        isOpen={isSiteFormOpen}
        onClose={() => setIsSiteFormOpen(false)}
        onSubmit={handleAddSite}
        supervisorId={SUPERVISOR_ID}
      />
    </div>
  );
};

export default Expenses;
