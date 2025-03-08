
import React, { useState } from 'react';
import PageTitle from '@/components/common/PageTitle';
import CustomCard from '@/components/ui/CustomCard';
import { Search, Filter, Plus, Building } from 'lucide-react';
import { Expense, ExpenseCategory, ApprovalStatus, Site } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import SiteForm from '@/components/sites/SiteForm';
import SitesList from '@/components/sites/SitesList';
import SiteDetail from '@/components/sites/SiteDetail';

// Empty initial state - no mock data
const initialExpenses: Expense[] = [];
const initialSites: Site[] = [];

// Temporary supervisor ID - in a real app, this would come from authentication
const SUPERVISOR_ID = "sup123";

const Expenses: React.FC = () => {
  const [expenses, setExpenses] = useState<Expense[]>(initialExpenses);
  const [sites, setSites] = useState<Site[]>(initialSites);
  const [isSiteFormOpen, setIsSiteFormOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSiteId, setSelectedSiteId] = useState<string | null>(null);

  const handleAddSite = (newSite: Partial<Site>) => {
    const siteWithId: Site = {
      ...newSite as Site,
      id: Date.now().toString(),
      supervisorId: SUPERVISOR_ID,
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

  const handleCompleteSite = (siteId: string, completionDate: Date) => {
    setSites(prevSites => 
      prevSites.map(site => 
        site.id === siteId 
          ? { ...site, isCompleted: true, completionDate } 
          : site
      )
    );
  };

  const filteredSites = sites.filter(site => 
    site.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    site.jobName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    site.posNo.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const selectedSite = sites.find(site => site.id === selectedSiteId);
  const siteExpenses = expenses.filter(expense => expense.siteId === selectedSiteId);

  return (
    <div className="space-y-8 animate-fade-in">
      <PageTitle 
        title="Sites & Expenses" 
        subtitle="Manage construction sites and track expenses"
      />
      
      {selectedSite ? (
        // Show selected site details
        <SiteDetail 
          site={selectedSite}
          expenses={siteExpenses}
          onBack={() => setSelectedSiteId(null)}
          onAddExpense={handleAddExpense}
          onCompleteSite={handleCompleteSite}
        />
      ) : (
        // Show sites list
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

      {/* Site Form Dialog */}
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
