
import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { Expense, Advance, Invoice, FundsReceived, BalanceSummary, ApprovalStatus, ExpenseCategory, BankDetails } from '@/lib/types';
import { supabase } from '@/integrations/supabase/client';
import { toast as sonnerToast } from 'sonner';

const defaultBalanceSummary: BalanceSummary = {
  fundsReceived: 0,
  totalExpenditure: 0,
  totalAdvances: 0,
  debitsToWorker: 0,
  invoicesPaid: 0,
  pendingInvoices: 0,
  totalBalance: 0
};

/**
 * Calculate financial summary for a site
 */
const calculateSiteFinancials = async (siteId: string): Promise<BalanceSummary> => {
  if (!siteId || siteId === ":siteId") {
    console.error('Invalid siteId provided to calculateSiteFinancials:', siteId);
    return defaultBalanceSummary;
  }

  try {
    console.log("Calculating financials for site ID:", siteId);
    
    // Fetch funds received
    const { data: fundsData, error: fundsError } = await supabase
      .from('funds_received')
      .select('amount')
      .eq('site_id', siteId);
    
    if (fundsError) {
      console.error('Error fetching funds:', fundsError);
      throw fundsError;
    }
    
    const fundsReceived = fundsData.reduce((sum, fund) => sum + Number(fund.amount), 0);
    
    // Fetch expenses
    const { data: expensesData, error: expensesError } = await supabase
      .from('expenses')
      .select('amount')
      .eq('site_id', siteId);
    
    if (expensesError) {
      console.error('Error fetching expenses for financials:', expensesError);
      throw expensesError;
    }
    
    const totalExpenditure = expensesData.reduce((sum, expense) => sum + Number(expense.amount), 0);
    
    // Fetch advances
    const { data: advancesData, error: advancesError } = await supabase
      .from('advances')
      .select('amount, purpose')
      .eq('site_id', siteId);
    
    if (advancesError) {
      console.error('Error fetching advances for financials:', advancesError);
      throw advancesError;
    }
    
    // Calculate total advances and debits to worker
    let totalAdvances = 0;
    let debitsToWorker = 0;
    
    for (const advance of advancesData) {
      if (['safety_shoes', 'tools', 'other'].includes(advance.purpose)) {
        debitsToWorker += Number(advance.amount);
      } else {
        totalAdvances += Number(advance.amount);
      }
    }
    
    // Fetch invoices
    const { data: invoicesData, error: invoicesError } = await supabase
      .from('invoices')
      .select('net_amount, payment_status')
      .eq('site_id', siteId);
    
    if (invoicesError) {
      console.error('Error fetching invoices for financials:', invoicesError);
      throw invoicesError;
    }
    
    // Calculate invoices paid and pending
    let invoicesPaid = 0;
    let pendingInvoices = 0;
    
    for (const invoice of invoicesData) {
      if (invoice.payment_status === 'paid') {
        invoicesPaid += Number(invoice.net_amount);
      } else {
        pendingInvoices += Number(invoice.net_amount);
      }
    }
    
    // Calculate total balance
    const totalBalance = fundsReceived - totalExpenditure - totalAdvances - invoicesPaid;
    
    const summary = {
      fundsReceived,
      totalExpenditure,
      totalAdvances,
      debitsToWorker,
      invoicesPaid, 
      pendingInvoices,
      totalBalance
    };
    
    console.log("Calculated site financial summary:", summary);
    return summary;
  } catch (error) {
    console.error('Error calculating site financials:', error);
    // Return default values if calculation fails
    return defaultBalanceSummary;
  }
};

/**
 * Custom hook to manage site data and operations
 */
export const useSiteData = (siteId: string | undefined) => {
  const { toast } = useToast();
  const [site, setSite] = useState<any>(null);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [advances, setAdvances] = useState<Advance[]>([]);
  const [fundsReceived, setFundsReceived] = useState<FundsReceived[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [balanceSummary, setBalanceSummary] = useState<BalanceSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSiteData = async () => {
    // Check if siteId is valid (not undefined and not the literal ":siteId")
    if (!siteId || siteId === ":siteId") {
      console.error("Invalid siteId provided:", siteId);
      setIsLoading(false);
      setError("No valid site ID provided");
      sonnerToast.error("Invalid site ID", {
        description: "Please select a valid site"
      });
      return;
    }
    
    try {
      console.log('Fetching data for site ID:', siteId);
      
      const { data: siteData, error: siteError } = await supabase
        .from('sites')
        .select('*')
        .eq('id', siteId)
        .maybeSingle();

      if (siteError) {
        console.error('Error fetching site:', siteError);
        setError("Failed to load site data");
        toast({
          title: "Error",
          description: "Failed to load site data: " + siteError.message,
          variant: "destructive"
        });
        setIsLoading(false);
        return;
      }

      if (!siteData) {
        console.error('Site not found with ID:', siteId);
        setError("Site not found");
        toast({
          title: "Not Found",
          description: "Site not found with ID: " + siteId,
          variant: "destructive"
        });
        setIsLoading(false);
        return;
      }

      console.log('Site data loaded:', siteData);
      setSite(siteData);

      // Fetch balance summary
      const summary = await calculateSiteFinancials(siteId);
      setBalanceSummary(summary);
      
      setIsLoading(false);
    } catch (error) {
      console.error('Error in fetchSiteData:', error);
      setError("An unexpected error occurred");
      toast({
        title: "Error",
        description: "An unexpected error occurred while fetching site data",
        variant: "destructive"
      });
      setIsLoading(false);
    }
  };

  const fetchTransactions = async () => {
    if (!siteId || siteId === ":siteId") {
      console.error("Invalid siteId for transactions:", siteId);
      return;
    }
    
    try {
      console.log('Fetching transactions for site ID:', siteId);
      
      // Fetch expenses
      const { data: expensesData, error: expensesError } = await supabase
        .from('expenses')
        .select('*')
        .eq('site_id', siteId)
        .order('date', { ascending: false });

      if (expensesError) {
        console.error('Error fetching expenses:', expensesError);
      } else if (expensesData) {
        console.log('Expenses data loaded:', expensesData.length, 'records');
        // Transform the data to match the Expense type
        const formattedExpenses: Expense[] = expensesData.map(expense => ({
          id: expense.id,
          date: new Date(expense.date),
          description: expense.description,
          category: expense.category as ExpenseCategory,
          amount: Number(expense.amount),
          status: expense.status as ApprovalStatus,
          createdBy: expense.created_by || '',
          createdAt: new Date(expense.created_at),
          siteId: expense.site_id || '',
          supervisorId: expense.supervisor_id
        }));
        setExpenses(formattedExpenses);
      }

      // Fetch advances
      const { data: advancesData, error: advancesError } = await supabase
        .from('advances')
        .select('*')
        .eq('site_id', siteId)
        .order('date', { ascending: false });

      if (advancesError) {
        console.error('Error fetching advances:', advancesError);
      } else if (advancesData) {
        console.log('Advances data loaded:', advancesData.length, 'records');
        // Transform the data to match the Advance type
        const formattedAdvances: Advance[] = advancesData.map(advance => ({
          id: advance.id,
          date: advance.date,
          recipientId: advance.recipient_id || undefined,
          recipientName: advance.recipient_name,
          recipientType: advance.recipient_type,
          purpose: advance.purpose,
          amount: Number(advance.amount),
          remarks: advance.remarks || undefined,
          status: advance.status as ApprovalStatus,
          createdBy: advance.created_by || '',
          createdAt: advance.created_at,
          siteId: advance.site_id || ''
        }));
        setAdvances(formattedAdvances);
      }

      // Fetch funds received
      const { data: fundsData, error: fundsError } = await supabase
        .from('funds_received')
        .select('*')
        .eq('site_id', siteId)
        .order('date', { ascending: false });

      if (fundsError) {
        console.error('Error fetching funds:', fundsError);
      } else if (fundsData) {
        console.log('Funds data loaded:', fundsData.length, 'records');
        // Transform the data to match the FundsReceived type
        const formattedFunds: FundsReceived[] = fundsData.map(fund => ({
          id: fund.id,
          date: new Date(fund.date),
          amount: Number(fund.amount),
          siteId: fund.site_id,
          createdAt: new Date(fund.created_at),
          reference: fund.reference || undefined,
          method: fund.method || undefined
        }));
        setFundsReceived(formattedFunds);
      }

      // Fetch invoices
      const { data: invoicesData, error: invoicesError } = await supabase
        .from('invoices')
        .select('*')
        .eq('site_id', siteId)
        .order('date', { ascending: false });

      if (invoicesError) {
        console.error('Error fetching invoices:', invoicesError);
      } else if (invoicesData) {
        console.log('Invoices data loaded:', invoicesData.length, 'records');
        // Transform the data to match the Invoice type
        const formattedInvoices: Invoice[] = invoicesData.map(invoice => ({
          id: invoice.id,
          date: new Date(invoice.date),
          partyId: invoice.party_id,
          partyName: invoice.party_name,
          material: invoice.material,
          quantity: Number(invoice.quantity),
          rate: Number(invoice.rate),
          gstPercentage: Number(invoice.gst_percentage),
          grossAmount: Number(invoice.gross_amount),
          netAmount: Number(invoice.net_amount),
          bankDetails: invoice.bank_details as BankDetails,
          billUrl: invoice.bill_url || undefined,
          invoiceImageUrl: invoice.invoice_image_url || undefined,
          paymentStatus: invoice.payment_status,
          createdBy: invoice.created_by || '',
          createdAt: new Date(invoice.created_at),
          approverType: invoice.approver_type as "ho" | "supervisor" || undefined,
          siteId: invoice.site_id || undefined,
          vendorName: invoice.vendor_name || undefined,
          invoiceNumber: invoice.invoice_number || undefined,
          amount: Number(invoice.amount) || undefined
        }));
        setInvoices(formattedInvoices);
      }
    } catch (error) {
      console.error('Error in fetchTransactions:', error);
      toast({
        title: "Error",
        description: "Failed to load transaction data",
        variant: "destructive"
      });
    }
  };

  const handleAddExpense = async (expenseData: Partial<Expense>) => {
    if (!siteId) return;

    try {
      // Convert the frontend Expense type to the Supabase table format
      const supabaseExpense = {
        site_id: siteId,
        date: expenseData.date ? format(new Date(expenseData.date), 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd'),
        description: expenseData.description,
        category: expenseData.category,
        amount: expenseData.amount,
        status: expenseData.status || 'pending',
        created_by: expenseData.createdBy || 'Current User',
        supervisor_id: expenseData.supervisorId || 'default-supervisor'
      };

      const { data, error } = await supabase
        .from('expenses')
        .insert(supabaseExpense)
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
    } catch (error) {
      console.error('Error in handleAddExpense:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive"
      });
    }
  };

  const handleAddAdvance = async (advanceData: Partial<Advance>) => {
    if (!siteId) return;

    try {
      // Convert the frontend Advance type to the Supabase table format
      const supabaseAdvance = {
        site_id: siteId,
        date: advanceData.date ? format(new Date(advanceData.date as Date), 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd'),
        recipient_id: advanceData.recipientId,
        recipient_name: advanceData.recipientName,
        recipient_type: advanceData.recipientType,
        purpose: advanceData.purpose,
        amount: advanceData.amount,
        remarks: advanceData.remarks,
        status: advanceData.status || 'pending',
        created_by: advanceData.createdBy || 'Current User'
      };

      const { data, error } = await supabase
        .from('advances')
        .insert(supabaseAdvance)
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
    } catch (error) {
      console.error('Error in handleAddAdvance:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive"
      });
    }
  };

  const handleAddFunds = async (fundsData: Partial<FundsReceived>) => {
    if (!siteId) return;

    try {
      // Convert the frontend FundsReceived type to the Supabase table format
      const supabaseFunds = {
        site_id: siteId,
        date: fundsData.date ? format(new Date(fundsData.date), 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd'),
        amount: fundsData.amount,
        reference: fundsData.reference,
        method: fundsData.method
      };

      const { data, error } = await supabase
        .from('funds_received')
        .insert(supabaseFunds)
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
    } catch (error) {
      console.error('Error in handleAddFunds:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive"
      });
    }
  };

  const handleAddInvoice = async (invoiceData: Omit<Invoice, 'id' | 'createdAt'>) => {
    if (!siteId) return;

    try {
      // Convert the frontend Invoice type to the Supabase table format
      const supabaseInvoice = {
        site_id: siteId,
        date: format(new Date(invoiceData.date), 'yyyy-MM-dd'),
        party_id: invoiceData.partyId,
        party_name: invoiceData.partyName,
        material: invoiceData.material,
        quantity: invoiceData.quantity,
        rate: invoiceData.rate,
        gst_percentage: invoiceData.gstPercentage,
        gross_amount: invoiceData.grossAmount,
        net_amount: invoiceData.netAmount,
        bank_details: invoiceData.bankDetails,
        bill_url: invoiceData.billUrl,
        invoice_image_url: invoiceData.invoiceImageUrl,
        payment_status: invoiceData.paymentStatus,
        created_by: invoiceData.createdBy || 'Current User',
        approver_type: invoiceData.approverType,
        vendor_name: invoiceData.vendorName,
        invoice_number: invoiceData.invoiceNumber,
        amount: invoiceData.amount
      };

      const { data, error } = await supabase
        .from('invoices')
        .insert(supabaseInvoice)
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
    } catch (error) {
      console.error('Error in handleAddInvoice:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive"
      });
    }
  };

  const handleCompleteSite = async (siteId: string, completionDate: Date) => {
    try {
      const { error } = await supabase
        .from('sites')
        .update({ is_completed: true, completion_date: format(completionDate, 'yyyy-MM-dd') })
        .eq('id', siteId);

      if (error) {
        console.error('Error completing site:', error);
        toast({
          title: "Error",
          description: "Failed to mark site as complete.",
          variant: "destructive"
        });
      } else {
        toast({
          title: "Success",
          description: "Site marked as complete"
        });
        fetchSiteData();
      }
    } catch (error) {
      console.error('Error in handleCompleteSite:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive"
      });
    }
  };

  // Refresh all data
  const refreshData = () => {
    fetchSiteData();
    fetchTransactions();
  };

  // Initial data fetch
  useEffect(() => {
    if (siteId) {
      console.log('useSiteData hook initialized with siteId:', siteId);
      fetchSiteData();
      fetchTransactions();
    } else {
      console.error('useSiteData hook initialized without siteId');
      setIsLoading(false);
      setError("No site ID provided");
    }
  }, [siteId]);

  return {
    site,
    expenses,
    advances,
    fundsReceived,
    invoices,
    balanceSummary: balanceSummary || defaultBalanceSummary,
    isLoading,
    error,
    handleAddExpense,
    handleAddAdvance,
    handleAddFunds,
    handleAddInvoice,
    handleCompleteSite,
    refreshData
  };
};
