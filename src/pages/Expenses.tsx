
import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { format } from 'date-fns';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Plus, Search } from 'lucide-react';
import { ExpenseCategory, Expense, Advance, Invoice, FundsReceived, BalanceSummary } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import PageTitle from '@/components/common/PageTitle';
import SiteDetail from '@/components/sites/SiteDetail';
import ExpenseForm from '@/components/expenses/ExpenseForm';
import AdvanceForm from '@/components/advances/AdvanceForm';
import InvoiceForm from '@/components/invoices/InvoiceForm';
import FundsReceivedForm from '@/components/funds/FundsReceivedForm';
import { supabase } from '@/integrations/supabase/client';

const calculateSiteFinancials = async (siteId: string): Promise<BalanceSummary> => {
  try {
    // Fetch funds received
    const { data: fundsData, error: fundsError } = await supabase
      .from('funds_received')
      .select('amount')
      .eq('site_id', siteId);
    
    if (fundsError) throw fundsError;
    
    const fundsReceived = fundsData.reduce((sum, fund) => sum + parseFloat(String(fund.amount)), 0);
    
    // Fetch expenses
    const { data: expensesData, error: expensesError } = await supabase
      .from('expenses')
      .select('amount')
      .eq('site_id', siteId);
    
    if (expensesError) throw expensesError;
    
    const totalExpenditure = expensesData.reduce((sum, expense) => sum + parseFloat(String(expense.amount)), 0);
    
    // Fetch advances
    const { data: advancesData, error: advancesError } = await supabase
      .from('advances')
      .select('amount, purpose')
      .eq('site_id', siteId);
    
    if (advancesError) throw advancesError;
    
    // Calculate total advances and debits to worker
    let totalAdvances = 0;
    let debitsToWorker = 0;
    
    for (const advance of advancesData) {
      if (['safety_shoes', 'tools', 'other'].includes(advance.purpose)) {
        debitsToWorker += parseFloat(String(advance.amount));
      } else {
        totalAdvances += parseFloat(String(advance.amount));
      }
    }
    
    // Fetch invoices
    const { data: invoicesData, error: invoicesError } = await supabase
      .from('invoices')
      .select('net_amount, payment_status')
      .eq('site_id', siteId);
    
    if (invoicesError) throw invoicesError;
    
    // Calculate invoices paid and pending
    let invoicesPaid = 0;
    let pendingInvoices = 0;
    
    for (const invoice of invoicesData) {
      if (invoice.payment_status === 'paid') {
        invoicesPaid += parseFloat(String(invoice.net_amount));
      } else {
        pendingInvoices += parseFloat(String(invoice.net_amount));
      }
    }
    
    // Calculate total balance
    const totalBalance = fundsReceived - totalExpenditure - totalAdvances - invoicesPaid;
    
    return {
      fundsReceived,
      totalExpenditure,
      totalAdvances,
      debitsToWorker,
      invoicesPaid, 
      pendingInvoices,
      totalBalance
    };
  } catch (error) {
    console.error('Error calculating site financials:', error);
    // Return default values if calculation fails
    return {
      fundsReceived: 0,
      totalExpenditure: 0,
      totalAdvances: 0,
      debitsToWorker: 0,
      invoicesPaid: 0,
      pendingInvoices: 0,
      totalBalance: 0
    };
  }
};

const Expenses = () => {
  const { siteId } = useParams();
  const { toast } = useToast();
  
  // State variables
  const [sites, setSites] = useState([]);
  const [selectedSite, setSelectedSite] = useState(null);
  const [expenses, setExpenses] = useState([]);
  const [advances, setAdvances] = useState([]);
  const [fundsReceived, setFundsReceived] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [supervisorInvoices, setSupervisorInvoices] = useState([]);
  const [supervisor, setSupervisor] = useState(null);
  const [balanceSummary, setBalanceSummary] = useState<BalanceSummary>({
    fundsReceived: 0,
    totalExpenditure: 0,
    totalAdvances: 0,
    debitsToWorker: 0,
    invoicesPaid: 0,
    pendingInvoices: 0,
    totalBalance: 0
  });
  
  // UI state
  const [isLoading, setIsLoading] = useState(true);
  const [isAddExpenseOpen, setIsAddExpenseOpen] = useState(false);
  const [isAddAdvanceOpen, setIsAddAdvanceOpen] = useState(false);
  const [isAddInvoiceOpen, setIsAddInvoiceOpen] = useState(false);
  const [isAddFundsOpen, setIsAddFundsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  
  // Fetch sites data
  useEffect(() => {
    const fetchSites = async () => {
      try {
        const { data, error } = await supabase
          .from('sites')
          .select('*')
          .order('created_at', { ascending: false });
        
        if (error) throw error;
        
        const formattedSites = data.map(site => ({
          ...site,
          startDate: new Date(site.start_date),
          completionDate: site.completion_date ? new Date(site.completion_date) : undefined,
          createdAt: new Date(site.created_at)
        }));
        
        setSites(formattedSites);
      } catch (error) {
        console.error('Error fetching sites:', error);
        toast({
          title: 'Error',
          description: 'Failed to fetch sites',
          variant: 'destructive'
        });
      } finally {
        if (!siteId) {
          setIsLoading(false);
        }
      }
    };
    
    fetchSites();
  }, [toast, siteId]);
  
  // Filter sites based on search term and active tab
  const filteredSites = sites.filter(site => {
    const matchesSearch = site.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          site.job_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          site.pos_no.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (activeTab === 'all') return matchesSearch;
    if (activeTab === 'active') return matchesSearch && !site.is_completed;
    if (activeTab === 'completed') return matchesSearch && site.is_completed;
    
    return matchesSearch;
  });
  
  // Fetch site details when siteId changes
  useEffect(() => {
    const fetchSiteDetails = async () => {
      if (!siteId) return;
      
      setIsLoading(true);
      
      try {
        // Fetch site data
        const { data: siteData, error: siteError } = await supabase
          .from('sites')
          .select('*')
          .eq('id', siteId)
          .single();
        
        if (siteError) throw siteError;
        
        const formattedSite = {
          ...siteData,
          startDate: new Date(siteData.start_date),
          completionDate: siteData.completion_date ? new Date(siteData.completion_date) : undefined,
          createdAt: new Date(siteData.created_at)
        };
        
        setSelectedSite(formattedSite);
        
        // Fetch supervisor data if available
        if (formattedSite.supervisor_id) {
          const { data: supervisorData, error: supervisorError } = await supabase
            .from('users')
            .select('id, email')
            .eq('id', formattedSite.supervisor_id)
            .single();
          
          if (!supervisorError && supervisorData) {
            setSupervisor({
              id: supervisorData.id,
              name: supervisorData.email // Using email as name for now
            });
          }
        }
        
        // Fetch expenses
        const { data: expensesData, error: expensesError } = await supabase
          .from('expenses')
          .select('*')
          .eq('site_id', siteId)
          .order('date', { ascending: false });
        
        if (expensesError) throw expensesError;
        
        const formattedExpenses = expensesData.map(expense => ({
          ...expense,
          date: new Date(expense.date),
          createdAt: new Date(expense.created_at),
          amount: Number(expense.amount)
        }));
        
        setExpenses(formattedExpenses);
        
        // Fetch advances
        const { data: advancesData, error: advancesError } = await supabase
          .from('advances')
          .select('*')
          .eq('site_id', siteId)
          .order('date', { ascending: false });
        
        if (advancesError) throw advancesError;
        
        const formattedAdvances = advancesData.map(advance => ({
          ...advance,
          date: new Date(advance.date),
          createdAt: new Date(advance.created_at),
          amount: Number(advance.amount)
        }));
        
        setAdvances(formattedAdvances);
        
        // Fetch funds received
        const { data: fundsData, error: fundsError } = await supabase
          .from('funds_received')
          .select('*')
          .eq('site_id', siteId)
          .order('date', { ascending: false });
        
        if (fundsError) throw fundsError;
        
        const formattedFunds = fundsData.map(fund => ({
          ...fund,
          date: new Date(fund.date),
          createdAt: new Date(fund.created_at),
          amount: Number(fund.amount)
        }));
        
        setFundsReceived(formattedFunds);
        
        // Fetch invoices
        const { data: invoicesData, error: invoicesError } = await supabase
          .from('invoices')
          .select('*')
          .eq('site_id', siteId)
          .order('date', { ascending: false });
        
        if (invoicesError) throw invoicesError;
        
        const formattedInvoices = invoicesData.map(invoice => ({
          ...invoice,
          date: new Date(invoice.date),
          createdAt: new Date(invoice.created_at),
          grossAmount: Number(invoice.gross_amount),
          netAmount: Number(invoice.net_amount),
          gstPercentage: Number(invoice.gst_percentage),
          rate: Number(invoice.rate),
          quantity: Number(invoice.quantity),
          partyId: invoice.party_id,
          partyName: invoice.party_name
        }));
        
        setInvoices(formattedInvoices);
        
        // Calculate financial summary
        const summary = await calculateSiteFinancials(siteId);
        setBalanceSummary(summary);
        
      } catch (error) {
        console.error('Error fetching site details:', error);
        toast({
          title: 'Error',
          description: 'Failed to fetch site details',
          variant: 'destructive'
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchSiteDetails();
  }, [siteId, toast]);
  
  const handleSiteClick = (site) => {
    setSelectedSite(site);
  };
  
  const handleBack = () => {
    setSelectedSite(null);
  };
  
  const handleAddExpense = async (expenseData) => {
    try {
      // Add site_id to the expense data
      const expenseWithSiteId = {
        ...expenseData,
        site_id: selectedSite.id
      };
      
      const { data, error } = await supabase
        .from('expenses')
        .insert([expenseWithSiteId])
        .select();
      
      if (error) throw error;
      
      // Format the new expense
      const newExpense = {
        ...data[0],
        date: new Date(data[0].date),
        createdAt: new Date(data[0].created_at),
        amount: Number(data[0].amount)
      };
      
      // Update expenses state
      setExpenses(prevExpenses => [newExpense, ...prevExpenses]);
      
      // Recalculate financial summary
      const summary = await calculateSiteFinancials(selectedSite.id);
      setBalanceSummary(summary);
      
      toast({
        title: 'Success',
        description: 'Expense added successfully'
      });
      
      setIsAddExpenseOpen(false);
    } catch (error) {
      console.error('Error adding expense:', error);
      toast({
        title: 'Error',
        description: 'Failed to add expense',
        variant: 'destructive'
      });
    }
  };
  
  const handleAddAdvance = async (advanceData) => {
    try {
      // Add site_id to the advance data
      const advanceWithSiteId = {
        ...advanceData,
        site_id: selectedSite.id
      };
      
      const { data, error } = await supabase
        .from('advances')
        .insert([advanceWithSiteId])
        .select();
      
      if (error) throw error;
      
      // Format the new advance
      const newAdvance = {
        ...data[0],
        date: new Date(data[0].date),
        createdAt: new Date(data[0].created_at),
        amount: Number(data[0].amount)
      };
      
      // Update advances state
      setAdvances(prevAdvances => [newAdvance, ...prevAdvances]);
      
      // Recalculate financial summary
      const summary = await calculateSiteFinancials(selectedSite.id);
      setBalanceSummary(summary);
      
      toast({
        title: 'Success',
        description: 'Advance added successfully'
      });
      
      setIsAddAdvanceOpen(false);
    } catch (error) {
      console.error('Error adding advance:', error);
      toast({
        title: 'Error',
        description: 'Failed to add advance',
        variant: 'destructive'
      });
    }
  };
  
  const handleAddFunds = async (fundsData) => {
    try {
      // Add site_id to the funds data
      const fundsWithSiteId = {
        ...fundsData,
        site_id: selectedSite.id
      };
      
      const { data, error } = await supabase
        .from('funds_received')
        .insert([fundsWithSiteId])
        .select();
      
      if (error) throw error;
      
      // Format the new funds
      const newFunds = {
        ...data[0],
        date: new Date(data[0].date),
        createdAt: new Date(data[0].created_at),
        amount: Number(data[0].amount)
      };
      
      // Update funds state
      setFundsReceived(prevFunds => [newFunds, ...prevFunds]);
      
      // Recalculate financial summary
      const summary = await calculateSiteFinancials(selectedSite.id);
      setBalanceSummary(summary);
      
      toast({
        title: 'Success',
        description: 'Funds added successfully'
      });
      
      setIsAddFundsOpen(false);
    } catch (error) {
      console.error('Error adding funds:', error);
      toast({
        title: 'Error',
        description: 'Failed to add funds',
        variant: 'destructive'
      });
    }
  };
  
  const handleAddInvoice = async (invoiceData) => {
    try {
      // Prepare data for supabase
      const supabaseInvoiceData = {
        party_id: invoiceData.partyId,
        party_name: invoiceData.partyName,
        material: invoiceData.material,
        quantity: invoiceData.quantity,
        rate: invoiceData.rate,
        gst_percentage: invoiceData.gstPercentage,
        gross_amount: invoiceData.grossAmount,
        net_amount: invoiceData.netAmount,
        bank_details: invoiceData.bankDetails,
        payment_status: invoiceData.paymentStatus,
        created_by: 'current_user', // Replace with actual user ID
        site_id: selectedSite.id,
        date: invoiceData.date
      };
      
      const { data, error } = await supabase
        .from('invoices')
        .insert([supabaseInvoiceData])
        .select();
      
      if (error) throw error;
      
      // Format the new invoice for state
      const newInvoice = {
        ...data[0],
        date: new Date(data[0].date),
        createdAt: new Date(data[0].created_at),
        partyId: data[0].party_id,
        partyName: data[0].party_name,
        grossAmount: Number(data[0].gross_amount),
        netAmount: Number(data[0].net_amount),
        gstPercentage: Number(data[0].gst_percentage),
        rate: Number(data[0].rate),
        quantity: Number(data[0].quantity),
        paymentStatus: data[0].payment_status,
        bankDetails: data[0].bank_details
      };
      
      // Update invoices state
      setInvoices(prevInvoices => [newInvoice, ...prevInvoices]);
      
      // Recalculate financial summary
      const summary = await calculateSiteFinancials(selectedSite.id);
      setBalanceSummary(summary);
      
      toast({
        title: 'Success',
        description: 'Invoice added successfully'
      });
      
      setIsAddInvoiceOpen(false);
    } catch (error) {
      console.error('Error adding invoice:', error);
      toast({
        title: 'Error',
        description: 'Failed to add invoice',
        variant: 'destructive'
      });
    }
  };
  
  const handleCompleteSite = async (siteId, completionDate) => {
    try {
      const { error } = await supabase
        .from('sites')
        .update({ 
          is_completed: true,
          completion_date: completionDate.toISOString()
        })
        .eq('id', siteId);
      
      if (error) throw error;
      
      // Update the site in state
      setSelectedSite(prev => ({
        ...prev,
        isCompleted: true,
        completionDate
      }));
      
      // Update the site in sites list
      setSites(prevSites => 
        prevSites.map(site => 
          site.id === siteId 
            ? { ...site, is_completed: true, completionDate } 
            : site
        )
      );
      
      toast({
        title: 'Success',
        description: 'Site marked as complete'
      });
    } catch (error) {
      console.error('Error completing site:', error);
      toast({
        title: 'Error',
        description: 'Failed to mark site as complete',
        variant: 'destructive'
      });
    }
  };
  
  // Render site details if a site is selected
  if (selectedSite) {
    return (
      <div>
        <SiteDetail 
          site={selectedSite}
          expenses={expenses}
          advances={advances}
          fundsReceived={fundsReceived}
          invoices={invoices}
          supervisorInvoices={supervisorInvoices}
          balanceSummary={balanceSummary}
          siteSupervisor={supervisor}
          onBack={handleBack}
          onAddExpense={handleAddExpense}
          onAddAdvance={handleAddAdvance}
          onAddFunds={handleAddFunds}
          onAddInvoice={handleAddInvoice}
          onCompleteSite={handleCompleteSite}
        />
        
        {isAddExpenseOpen && (
          <ExpenseForm 
            isOpen={isAddExpenseOpen}
            onClose={() => setIsAddExpenseOpen(false)}
            onSubmit={handleAddExpense}
          />
        )}
        
        {isAddAdvanceOpen && (
          <AdvanceForm 
            isOpen={isAddAdvanceOpen}
            onClose={() => setIsAddAdvanceOpen(false)}
            onSubmit={handleAddAdvance}
          />
        )}
        
        {isAddFundsOpen && (
          <FundsReceivedForm 
            isOpen={isAddFundsOpen}
            onClose={() => setIsAddFundsOpen(false)}
            onSubmit={handleAddFunds}
          />
        )}
        
        {isAddInvoiceOpen && (
          <InvoiceForm 
            isOpen={isAddInvoiceOpen}
            onClose={() => setIsAddInvoiceOpen(false)}
            onSubmit={handleAddInvoice}
          />
        )}
      </div>
    );
  }
  
  // Render the sites list
  return (
    <div className="space-y-6">
      <PageTitle title="Sites" />
      
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="relative w-full sm:w-auto">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search sites..."
            className="w-full sm:w-[300px] pl-8 h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>
      
      <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="all">All Sites</TabsTrigger>
          <TabsTrigger value="active">Active</TabsTrigger>
          <TabsTrigger value="completed">Completed</TabsTrigger>
        </TabsList>
        
        <TabsContent value="all" className="space-y-4">
          {isLoading ? (
            <div className="flex justify-center my-8">
              <p>Loading sites...</p>
            </div>
          ) : filteredSites.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredSites.map((site) => (
                <div 
                  key={site.id} 
                  className="border rounded-lg p-4 cursor-pointer hover:border-primary transition-colors"
                  onClick={() => handleSiteClick(site)}
                >
                  <h3 className="font-semibold text-lg mb-2">{site.name}</h3>
                  <div className="space-y-2 text-sm text-muted-foreground">
                    <p>Job: {site.job_name}</p>
                    <p>POS: {site.pos_no}</p>
                    <p>Start Date: {format(site.startDate, 'dd/MM/yyyy')}</p>
                    <div className="flex justify-between items-center mt-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        site.is_completed ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'
                      }`}>
                        {site.is_completed ? 'Completed' : 'Active'}
                      </span>
                      <Button variant="link" size="sm" className="text-primary">
                        View Details →
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No sites found</p>
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="active" className="space-y-4">
          {/* Active sites content - same structure as "all" but filtered */}
          {isLoading ? (
            <div className="flex justify-center my-8">
              <p>Loading sites...</p>
            </div>
          ) : filteredSites.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredSites.map((site) => (
                <div 
                  key={site.id} 
                  className="border rounded-lg p-4 cursor-pointer hover:border-primary transition-colors"
                  onClick={() => handleSiteClick(site)}
                >
                  <h3 className="font-semibold text-lg mb-2">{site.name}</h3>
                  <div className="space-y-2 text-sm text-muted-foreground">
                    <p>Job: {site.job_name}</p>
                    <p>POS: {site.pos_no}</p>
                    <p>Start Date: {format(site.startDate, 'dd/MM/yyyy')}</p>
                    <div className="flex justify-between items-center mt-3">
                      <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        Active
                      </span>
                      <Button variant="link" size="sm" className="text-primary">
                        View Details →
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No active sites found</p>
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="completed" className="space-y-4">
          {/* Completed sites content - same structure as "all" but filtered */}
          {isLoading ? (
            <div className="flex justify-center my-8">
              <p>Loading sites...</p>
            </div>
          ) : filteredSites.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredSites.map((site) => (
                <div 
                  key={site.id} 
                  className="border rounded-lg p-4 cursor-pointer hover:border-primary transition-colors"
                  onClick={() => handleSiteClick(site)}
                >
                  <h3 className="font-semibold text-lg mb-2">{site.name}</h3>
                  <div className="space-y-2 text-sm text-muted-foreground">
                    <p>Job: {site.job_name}</p>
                    <p>POS: {site.pos_no}</p>
                    <p>Start Date: {format(site.startDate, 'dd/MM/yyyy')}</p>
                    <p>Completion: {site.completionDate ? format(site.completionDate, 'dd/MM/yyyy') : 'N/A'}</p>
                    <div className="flex justify-between items-center mt-3">
                      <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        Completed
                      </span>
                      <Button variant="link" size="sm" className="text-primary">
                        View Details →
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No completed sites found</p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Expenses;
