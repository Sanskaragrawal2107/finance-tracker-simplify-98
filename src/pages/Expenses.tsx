
import React, { useEffect, useState } from 'react';
import { useParams, useLocation } from 'react-router-dom';
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
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('expenses');
  const [sites, setSites] = useState([]);
  const [selectedSite, setSelectedSite] = useState(null);
  const [expenses, setExpenses] = useState([]);
  const [advances, setAdvances] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [fundsReceived, setFundsReceived] = useState([]);
  const [showExpenseForm, setShowExpenseForm] = useState(false);
  const [showAdvanceForm, setShowAdvanceForm] = useState(false);
  const [showInvoiceForm, setShowInvoiceForm] = useState(false);
  const [showFundsForm, setShowFundsForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [balanceSummary, setBalanceSummary] = useState<BalanceSummary | null>(null);
  const [siteFinancialsLoading, setSiteFinancialsLoading] = useState(false);
  
  // Get supervisor ID from local storage
  const supervisorId = localStorage.getItem('supervisorId') || '';
  
  // Function to fetch sites associated with the supervisor
  const fetchSites = async () => {
    try {
      const { data, error } = await supabase
        .from('sites')
        .select('*')
        .eq('supervisor_id', supervisorId);
        
      if (error) throw error;
      
      setSites(data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching sites:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch sites. Please try again.',
        variant: 'destructive'
      });
      setLoading(false);
    }
  };
  
  // Function to fetch site financial summary
  const fetchSiteFinancialSummary = async (siteId) => {
    if (!siteId) return;
    
    setSiteFinancialsLoading(true);
    try {
      const summary = await calculateSiteFinancials(siteId);
      setBalanceSummary(summary);
    } catch (error) {
      console.error('Error calculating site financials:', error);
      toast({
        title: 'Error',
        description: 'Failed to calculate site financials.',
        variant: 'destructive'
      });
    } finally {
      setSiteFinancialsLoading(false);
    }
  };
  
  // Function to handle site selection
  const handleSiteSelect = async (site) => {
    setSelectedSite(site);
    
    // Fetch site details when a site is selected
    if (site) {
      await fetchSiteFinancialSummary(site.id);
      await fetchTransactions(site.id);
    }
  };
  
  // Function to fetch all transactions for a site
  const fetchTransactions = async (siteId) => {
    if (!siteId) return;
    
    setLoading(true);
    
    // Fetch expenses
    try {
      const { data: expensesData, error: expensesError } = await supabase
        .from('expenses')
        .select('*')
        .eq('site_id', siteId);
        
      if (expensesError) throw expensesError;
      
      setExpenses(expensesData);
    } catch (error) {
      console.error('Error fetching expenses:', error);
    }
    
    // Fetch advances
    try {
      const { data: advancesData, error: advancesError } = await supabase
        .from('advances')
        .select('*')
        .eq('site_id', siteId);
        
      if (advancesError) throw advancesError;
      
      setAdvances(advancesData);
    } catch (error) {
      console.error('Error fetching advances:', error);
    }
    
    // Fetch invoices
    try {
      const { data: invoicesData, error: invoicesError } = await supabase
        .from('invoices')
        .select('*')
        .eq('site_id', siteId);
        
      if (invoicesError) throw invoicesError;
      
      setInvoices(invoicesData);
    } catch (error) {
      console.error('Error fetching invoices:', error);
    }
    
    // Fetch funds received
    try {
      const { data: fundsData, error: fundsError } = await supabase
        .from('funds_received')
        .select('*')
        .eq('site_id', siteId);
        
      if (fundsError) throw fundsError;
      
      setFundsReceived(fundsData);
    } catch (error) {
      console.error('Error fetching funds received:', error);
    }
    
    setLoading(false);
  };
  
  // Function to handle expense form submission
  const handleExpenseSubmit = async (expenseData) => {
    // Handle expense form submission logic here
    setShowExpenseForm(false);
    // Refresh transactions after submission
    if (selectedSite) {
      await fetchTransactions(selectedSite.id);
      await fetchSiteFinancialSummary(selectedSite.id);
    }
  };
  
  // Function to handle advance form submission
  const handleAdvanceSubmit = async (advanceData) => {
    // Handle advance form submission logic here
    setShowAdvanceForm(false);
    // Refresh transactions after submission
    if (selectedSite) {
      await fetchTransactions(selectedSite.id);
      await fetchSiteFinancialSummary(selectedSite.id);
    }
  };
  
  // Function to handle invoice form submission
  const handleInvoiceSubmit = async (invoiceData) => {
    // Handle invoice form submission logic here
    setShowInvoiceForm(false);
    // Refresh transactions after submission
    if (selectedSite) {
      await fetchTransactions(selectedSite.id);
      await fetchSiteFinancialSummary(selectedSite.id);
    }
  };
  
  // Function to handle funds received form submission
  const handleFundsSubmit = async (fundsData) => {
    // Handle funds received form submission logic here
    setShowFundsForm(false);
    // Refresh transactions after submission
    if (selectedSite) {
      await fetchTransactions(selectedSite.id);
      await fetchSiteFinancialSummary(selectedSite.id);
    }
  };
  
  // Effect to fetch sites on component mount
  useEffect(() => {
    fetchSites();
  }, []);
  
  return (
    <div className="space-y-6">
      <PageTitle title="Site Expenses" />
      
      {/* Site selection */}
      {!selectedSite ? (
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Select a Site</h2>
          
          {loading ? (
            <p>Loading sites...</p>
          ) : sites.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {sites.map((site) => (
                <div 
                  key={site.id}
                  className="border rounded-lg p-4 cursor-pointer hover:bg-gray-50 transition"
                  onClick={() => handleSiteSelect(site)}
                >
                  <h3 className="font-semibold">{site.name}</h3>
                  <p className="text-sm text-gray-500">Job: {site.job_name}</p>
                  <p className="text-sm text-gray-500">POS No: {site.pos_no}</p>
                  <p className="text-sm text-gray-500">
                    Start Date: {format(new Date(site.start_date), 'dd/MM/yyyy')}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p>No sites found for this supervisor.</p>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          {/* Site details and balance summary */}
          <SiteDetail 
            site={selectedSite}
            balanceSummary={balanceSummary}
            isLoading={siteFinancialsLoading}
            onBack={() => {
              setSelectedSite(null);
              setBalanceSummary(null);
            }}
          />
          
          {/* Add transaction buttons */}
          <div className="flex flex-wrap gap-2">
            <Button onClick={() => setShowExpenseForm(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Expense
            </Button>
            <Button variant="outline" onClick={() => setShowAdvanceForm(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Advance
            </Button>
            <Button variant="outline" onClick={() => setShowInvoiceForm(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Invoice
            </Button>
            <Button variant="outline" onClick={() => setShowFundsForm(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Funds
            </Button>
          </div>
          
          {/* Transaction tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList>
              <TabsTrigger value="expenses">Expenses</TabsTrigger>
              <TabsTrigger value="advances">Advances</TabsTrigger>
              <TabsTrigger value="invoices">Invoices</TabsTrigger>
              <TabsTrigger value="funds">Funds Received</TabsTrigger>
            </TabsList>
            
            <TabsContent value="expenses">
              {loading ? (
                <p>Loading expenses...</p>
              ) : expenses.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="bg-gray-100">
                        <th className="p-2 text-left">Date</th>
                        <th className="p-2 text-left">Description</th>
                        <th className="p-2 text-left">Category</th>
                        <th className="p-2 text-left">Amount</th>
                        <th className="p-2 text-left">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {expenses.map((expense) => (
                        <tr key={expense.id} className="border-b hover:bg-gray-50">
                          <td className="p-2">{format(new Date(expense.date), 'dd/MM/yyyy')}</td>
                          <td className="p-2">{expense.description}</td>
                          <td className="p-2">{expense.category}</td>
                          <td className="p-2">₹{parseFloat(expense.amount).toLocaleString()}</td>
                          <td className="p-2">
                            <span className={`px-2 py-1 rounded-full text-xs ${
                              expense.status === 'approved' 
                                ? 'bg-green-100 text-green-800' 
                                : expense.status === 'rejected'
                                ? 'bg-red-100 text-red-800'
                                : 'bg-yellow-100 text-yellow-800'
                            }`}>
                              {expense.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p>No expenses found for this site.</p>
              )}
            </TabsContent>
            
            <TabsContent value="advances">
              {loading ? (
                <p>Loading advances...</p>
              ) : advances.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="bg-gray-100">
                        <th className="p-2 text-left">Date</th>
                        <th className="p-2 text-left">Recipient</th>
                        <th className="p-2 text-left">Purpose</th>
                        <th className="p-2 text-left">Amount</th>
                        <th className="p-2 text-left">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {advances.map((advance) => (
                        <tr key={advance.id} className="border-b hover:bg-gray-50">
                          <td className="p-2">{format(new Date(advance.date), 'dd/MM/yyyy')}</td>
                          <td className="p-2">{advance.recipient_name}</td>
                          <td className="p-2">{advance.purpose}</td>
                          <td className="p-2">₹{parseFloat(advance.amount).toLocaleString()}</td>
                          <td className="p-2">
                            <span className={`px-2 py-1 rounded-full text-xs ${
                              advance.status === 'approved' 
                                ? 'bg-green-100 text-green-800' 
                                : advance.status === 'rejected'
                                ? 'bg-red-100 text-red-800'
                                : 'bg-yellow-100 text-yellow-800'
                            }`}>
                              {advance.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p>No advances found for this site.</p>
              )}
            </TabsContent>
            
            <TabsContent value="invoices">
              {loading ? (
                <p>Loading invoices...</p>
              ) : invoices.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="bg-gray-100">
                        <th className="p-2 text-left">Date</th>
                        <th className="p-2 text-left">Party Name</th>
                        <th className="p-2 text-left">Material</th>
                        <th className="p-2 text-left">Amount</th>
                        <th className="p-2 text-left">Payment Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {invoices.map((invoice) => (
                        <tr key={invoice.id} className="border-b hover:bg-gray-50">
                          <td className="p-2">{format(new Date(invoice.date), 'dd/MM/yyyy')}</td>
                          <td className="p-2">{invoice.party_name}</td>
                          <td className="p-2">{invoice.material}</td>
                          <td className="p-2">₹{parseFloat(invoice.net_amount).toLocaleString()}</td>
                          <td className="p-2">
                            <span className={`px-2 py-1 rounded-full text-xs ${
                              invoice.payment_status === 'paid' 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-yellow-100 text-yellow-800'
                            }`}>
                              {invoice.payment_status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p>No invoices found for this site.</p>
              )}
            </TabsContent>
            
            <TabsContent value="funds">
              {loading ? (
                <p>Loading funds received...</p>
              ) : fundsReceived.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="bg-gray-100">
                        <th className="p-2 text-left">Date</th>
                        <th className="p-2 text-left">Amount</th>
                        <th className="p-2 text-left">Reference</th>
                        <th className="p-2 text-left">Method</th>
                      </tr>
                    </thead>
                    <tbody>
                      {fundsReceived.map((fund) => (
                        <tr key={fund.id} className="border-b hover:bg-gray-50">
                          <td className="p-2">{format(new Date(fund.date), 'dd/MM/yyyy')}</td>
                          <td className="p-2">₹{parseFloat(fund.amount).toLocaleString()}</td>
                          <td className="p-2">{fund.reference || 'N/A'}</td>
                          <td className="p-2">{fund.method || 'N/A'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p>No funds received for this site.</p>
              )}
            </TabsContent>
          </Tabs>
        </div>
      )}
      
      {/* Forms for adding transactions */}
      {showExpenseForm && (
        <ExpenseForm
          isOpen={showExpenseForm}
          onClose={() => setShowExpenseForm(false)}
          onSubmit={handleExpenseSubmit}
          siteId={selectedSite?.id}
        />
      )}
      
      {showAdvanceForm && (
        <AdvanceForm
          isOpen={showAdvanceForm}
          onClose={() => setShowAdvanceForm(false)}
          onSubmit={handleAdvanceSubmit}
          siteId={selectedSite?.id}
        />
      )}
      
      {showInvoiceForm && (
        <InvoiceForm
          isOpen={showInvoiceForm}
          onClose={() => setShowInvoiceForm(false)}
          onSubmit={handleInvoiceSubmit}
          siteId={selectedSite?.id}
        />
      )}
      
      {showFundsForm && (
        <FundsReceivedForm
          isOpen={showFundsForm}
          onClose={() => setShowFundsForm(false)}
          onSubmit={handleFundsSubmit}
          siteId={selectedSite?.id}
        />
      )}
    </div>
  );
};

export default Expenses;
