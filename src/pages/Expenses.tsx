
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
    
    const fundsReceived = fundsData.reduce((sum, fund) => sum + parseFloat(fund.amount), 0);
    
    // Fetch expenses
    const { data: expensesData, error: expensesError } = await supabase
      .from('expenses')
      .select('amount')
      .eq('site_id', siteId);
    
    if (expensesError) throw expensesError;
    
    const totalExpenditure = expensesData.reduce((sum, expense) => sum + parseFloat(expense.amount), 0);
    
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
        debitsToWorker += parseFloat(advance.amount);
      } else {
        totalAdvances += parseFloat(advance.amount);
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
        invoicesPaid += parseFloat(invoice.net_amount);
      } else {
        pendingInvoices += parseFloat(invoice.net_amount);
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

const ExpensesPage = () => {
  const { siteId } = useParams();
  const { toast } = useToast();
  const [isExpenseFormOpen, setIsExpenseFormOpen] = useState(false);
  const [isAdvanceFormOpen, setIsAdvanceFormOpen] = useState(false);
  const [isFundsFormOpen, setIsFundsFormOpen] = useState(false);
  const [isInvoiceFormOpen, setIsInvoiceFormOpen] = useState(false);
  const [site, setSite] = useState<any>(null);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [advances, setAdvances] = useState<Advance[]>([]);
  const [fundsReceived, setFundsReceived] = useState<FundsReceived[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [balanceSummary, setBalanceSummary] = useState<BalanceSummary | null>(null);

  useEffect(() => {
    if (siteId) {
      fetchSiteData();
      fetchTransactions();
    }
  }, [siteId]);

  const fetchSiteData = async () => {
    if (!siteId) return;

    const { data: siteData, error: siteError } = await supabase
      .from('sites')
      .select('*')
      .eq('id', siteId)
      .single();

    if (siteError) {
      console.error('Error fetching site:', siteError);
      return;
    }

    setSite(siteData);

    // Fetch balance summary
    const summary = await calculateSiteFinancials(siteId);
    setBalanceSummary(summary);
  };

  const fetchTransactions = async () => {
    if (!siteId) return;

    // Fetch expenses
    const { data: expensesData, error: expensesError } = await supabase
      .from('expenses')
      .select('*')
      .eq('site_id', siteId)
      .order('date', { ascending: false });

    if (expensesError) {
      console.error('Error fetching expenses:', expensesError);
    } else {
      setExpenses(expensesData || []);
    }

    // Fetch advances
    const { data: advancesData, error: advancesError } = await supabase
      .from('advances')
      .select('*')
      .eq('site_id', siteId)
      .order('date', { ascending: false });

    if (advancesError) {
      console.error('Error fetching advances:', advancesError);
    } else {
      setAdvances(advancesData || []);
    }

    // Fetch funds received
    const { data: fundsData, error: fundsError } = await supabase
      .from('funds_received')
      .select('*')
      .eq('site_id', siteId)
      .order('date', { ascending: false });

    if (fundsError) {
      console.error('Error fetching funds:', fundsError);
    } else {
      setFundsReceived(fundsData || []);
    }

    // Fetch invoices
    const { data: invoicesData, error: invoicesError } = await supabase
      .from('invoices')
      .select('*')
      .eq('site_id', siteId)
      .order('date', { ascending: false });

    if (invoicesError) {
      console.error('Error fetching invoices:', invoicesError);
    } else {
      setInvoices(invoicesData || []);
    }
  };

  const handleAddExpense = async (expenseData: Partial<Expense>) => {
    if (!siteId) return;

    const { data, error } = await supabase
      .from('expenses')
      .insert([{ ...expenseData, site_id: siteId }])
      .select()
      .single();

    if (error) {
      console.error('Error adding expense:', error);
      toast({
        title: "Error",
        description: "Failed to add expense. Please try again.",
        variant: "destructive"
      });
    } else {
      toast({
        title: "Success",
        description: "Expense added successfully"
      });
      fetchTransactions(); // Refresh the transactions list
      fetchSiteData(); // Refresh the balance summary
    }
  };

  const handleAddAdvance = async (advanceData: Partial<Advance>) => {
    if (!siteId) return;

    const { data, error } = await supabase
      .from('advances')
      .insert([{ ...advanceData, site_id: siteId }])
      .select()
      .single();

    if (error) {
      console.error('Error adding advance:', error);
      toast({
        title: "Error",
        description: "Failed to add advance. Please try again.",
        variant: "destructive"
      });
    } else {
      toast({
        title: "Success",
        description: "Advance added successfully"
      });
      fetchTransactions();
      fetchSiteData();
    }
  };

  const handleAddFunds = async (fundsData: Partial<FundsReceived>) => {
    if (!siteId) return;

    const { data, error } = await supabase
      .from('funds_received')
      .insert([{ ...fundsData, site_id: siteId }])
      .select()
      .single();

    if (error) {
      console.error('Error adding funds:', error);
      toast({
        title: "Error",
        description: "Failed to add funds. Please try again.",
        variant: "destructive"
      });
    } else {
      toast({
        title: "Success",
        description: "Funds added successfully"
      });
      fetchTransactions();
      fetchSiteData();
    }
  };

  const handleAddInvoice = async (invoiceData: Omit<Invoice, 'id' | 'createdAt'>) => {
    if (!siteId) return;

    const { data, error } = await supabase
      .from('invoices')
      .insert([{ ...invoiceData, site_id: siteId }])
      .select()
      .single();

    if (error) {
      console.error('Error adding invoice:', error);
      toast({
        title: "Error",
        description: "Failed to add invoice. Please try again.",
        variant: "destructive"
      });
    } else {
      toast({
        title: "Success",
        description: "Invoice added successfully"
      });
      fetchTransactions();
      fetchSiteData();
    }
  };

  if (!site) {
    return <div>Loading...</div>;
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <PageTitle>{site.name}</PageTitle>
      
      <SiteDetail 
        site={site}
        expenses={expenses}
        advances={advances}
        fundsReceived={fundsReceived}
        invoices={invoices}
        onAddExpense={handleAddExpense}
        onAddAdvance={handleAddAdvance}
        onAddFunds={handleAddFunds}
        onAddInvoice={handleAddInvoice}
        balanceSummary={balanceSummary}
      />

      <ExpenseForm 
        isOpen={isExpenseFormOpen} 
        onClose={() => setIsExpenseFormOpen(false)} 
        onSubmit={handleAddExpense}
        siteId={siteId || ''}
      />
      
      <AdvanceForm 
        isOpen={isAdvanceFormOpen} 
        onClose={() => setIsAdvanceFormOpen(false)} 
        onSubmit={handleAddAdvance}
        siteId={siteId || ''}
      />
      
      <FundsReceivedForm 
        isOpen={isFundsFormOpen} 
        onClose={() => setIsFundsFormOpen(false)} 
        onSubmit={handleAddFunds}
      />
      
      <InvoiceForm 
        isOpen={isInvoiceFormOpen} 
        onClose={() => setIsInvoiceFormOpen(false)} 
        onSubmit={handleAddInvoice}
      />
    </div>
  );
};

export default ExpensesPage;
