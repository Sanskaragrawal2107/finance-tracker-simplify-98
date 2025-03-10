
import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import PageTitle from '@/components/common/PageTitle';
import CustomCard from '@/components/ui/CustomCard';
import { Search, Filter, Plus, Building, User, Users, CheckSquare, CircleSlash } from 'lucide-react';
import { Expense, ExpenseCategory, ApprovalStatus, Site, Advance, FundsReceived, Invoice, UserRole, AdvancePurpose, RecipientType, PaymentStatus, PaymentMethod, BankDetails } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import SiteForm from '@/components/sites/SiteForm';
import SitesList from '@/components/sites/SitesList';
import SiteDetail from '@/components/sites/SiteDetail';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { supabase, formatDateForSupabase } from '@/integrations/supabase/client';
import { Json } from '@/integrations/supabase/types';

const DEBIT_ADVANCE_PURPOSES = [
  AdvancePurpose.SAFETY_SHOES,
  AdvancePurpose.TOOLS,
  AdvancePurpose.OTHER
];

const Expenses: React.FC = () => {
  const location = useLocation();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [sites, setSites] = useState<Site[]>([]);
  const [advances, setAdvances] = useState<Advance[]>([]);
  const [fundsReceived, setFundsReceived] = useState<FundsReceived[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [isSiteFormOpen, setIsSiteFormOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSiteId, setSelectedSiteId] = useState<string | null>(null);
  const [selectedSupervisorId, setSelectedSupervisorId] = useState<string | null>(null);
  const [supervisors, setSupervisors] = useState<any[]>([]);
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'completed'>('all');
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [supervisorId, setSupervisorId] = useState<string | null>(null);

  useEffect(() => {
    const checkAuth = async () => {
      const { data } = await supabase.auth.getSession();
      if (data.session) {
        setCurrentUserId(data.session.user.id);
        
        const { data: profileData } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', data.session.user.id)
          .single();
          
        if (profileData) {
          setUserRole(profileData.role as UserRole);
          localStorage.setItem('userRole', profileData.role);
          
          if (profileData.role === UserRole.SUPERVISOR) {
            const { data: supervisorData } = await supabase
              .from('supervisors')
              .select('id')
              .eq('user_id', data.session.user.id)
              .single();
              
            if (supervisorData) {
              setSupervisorId(supervisorData.id);
              setSelectedSupervisorId(supervisorData.id);
              localStorage.setItem('supervisorId', supervisorData.id);
            }
          }
        }
      }
    };
    
    checkAuth();
  }, []);
  
  useEffect(() => {
    const fetchSupervisors = async () => {
      const { data, error } = await supabase
        .from('supervisors')
        .select('*');
        
      if (error) {
        console.error('Error fetching supervisors:', error);
        toast.error('Failed to load supervisors');
      } else if (data) {
        setSupervisors(data);
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
        
        if (filterStatus === 'active') {
          query = query.eq('is_completed', false);
        } else if (filterStatus === 'completed') {
          query = query.eq('is_completed', true);
        }
        
        const { data, error } = await query;
        
        if (error) {
          throw error;
        }
        
        if (data) {
          const formattedSites = data.map(site => ({
            id: site.id,
            name: site.name,
            jobName: site.job_name,
            posNo: site.pos_no,
            startDate: new Date(site.start_date),
            completionDate: site.completion_date ? new Date(site.completion_date) : undefined,
            supervisorId: site.supervisor_id,
            createdAt: new Date(site.created_at),
            isCompleted: site.is_completed,
            funds: site.funds
          } as Site));
          
          setSites(formattedSites);
        }
      } catch (error: any) {
        console.error('Error fetching sites:', error.message);
        toast.error('Failed to load sites');
      } finally {
        setLoading(false);
      }
    };
    
    fetchSites();
  }, [selectedSupervisorId, filterStatus]);
  
  useEffect(() => {
    if (selectedSiteId) {
      const fetchSiteData = async () => {
        setLoading(true);
        
        try {
          const { data: expensesData, error: expensesError } = await supabase
            .from('expenses')
            .select('*')
            .eq('site_id', selectedSiteId);
            
          if (expensesError) throw expensesError;
          
          if (expensesData) {
            const formattedExpenses = expensesData.map(expense => ({
              id: expense.id,
              date: new Date(expense.date),
              description: expense.description,
              category: expense.category as ExpenseCategory,
              amount: expense.amount,
              status: expense.status as ApprovalStatus,
              createdBy: expense.created_by || "",
              createdAt: new Date(expense.created_at || new Date()),
              siteId: expense.site_id,
              supervisorId: expense.supervisor_id || ""
            } as Expense));
            
            setExpenses(formattedExpenses);
          }
          
          const { data: advancesData, error: advancesError } = await supabase
            .from('advances')
            .select('*')
            .eq('site_id', selectedSiteId);
            
          if (advancesError) throw advancesError;
          
          if (advancesData) {
            const formattedAdvances = advancesData.map(advance => ({
              id: advance.id,
              date: new Date(advance.date),
              recipientId: advance.recipient_id,
              recipientName: advance.recipient_name,
              recipientType: advance.recipient_type as RecipientType,
              purpose: advance.purpose as AdvancePurpose,
              amount: advance.amount,
              remarks: advance.remarks,
              status: advance.status as ApprovalStatus,
              createdBy: advance.created_by || "",
              createdAt: new Date(advance.created_at || new Date()),
              siteId: advance.site_id
            } as Advance));
            
            setAdvances(formattedAdvances);
          }
          
          const { data: fundsData, error: fundsError } = await supabase
            .from('funds_received')
            .select('*')
            .eq('site_id', selectedSiteId);
            
          if (fundsError) throw fundsError;
          
          if (fundsData) {
            const formattedFunds = fundsData.map(fund => ({
              id: fund.id,
              date: new Date(fund.date),
              amount: fund.amount,
              siteId: fund.site_id || "",
              createdAt: new Date(fund.created_at || new Date()),
              reference: fund.reference,
              method: fund.method as PaymentMethod
            } as FundsReceived));
            
            setFundsReceived(formattedFunds);
          }
          
          const { data: invoicesData, error: invoicesError } = await supabase
            .from('invoices')
            .select('*')
            .eq('site_id', selectedSiteId);
            
          if (invoicesError) throw invoicesError;
          
          if (invoicesData) {
            const formattedInvoices = invoicesData.map(invoice => {
              let bankDetails: BankDetails = {
                accountNumber: "",
                bankName: "",
                ifscCode: ""
              };
              
              if (invoice.bank_details) {
                const bd = invoice.bank_details as Record<string, any>;
                bankDetails = {
                  accountNumber: bd.accountNumber || bd.account_number || "",
                  bankName: bd.bankName || bd.bank_name || "",
                  ifscCode: bd.ifscCode || bd.ifsc_code || "",
                  email: bd.email,
                  mobile: bd.mobile
                };
              }
              
              return {
                id: invoice.id,
                date: new Date(invoice.date),
                partyId: invoice.party_id || "",
                partyName: invoice.party_name || "",
                material: invoice.material || "",
                quantity: invoice.quantity || 0,
                rate: invoice.rate || 0,
                gstPercentage: invoice.gst_percentage || 0,
                grossAmount: invoice.gross_amount || 0,
                netAmount: invoice.net_amount,
                bankDetails: bankDetails,
                billUrl: invoice.bill_url,
                invoiceImageUrl: invoice.invoice_image_url,
                paymentStatus: invoice.payment_status as PaymentStatus,
                createdBy: invoice.created_by || "",
                createdAt: new Date(invoice.created_at || new Date()),
                approverType: invoice.approver_type as "ho" | "supervisor" | undefined,
                siteId: invoice.site_id,
                vendorName: invoice.vendor_name,
                invoiceNumber: invoice.invoice_number,
                amount: invoice.amount
              } as Invoice;
            });
            
            setInvoices(formattedInvoices);
          }
        } catch (error: any) {
          console.error('Error fetching site data:', error.message);
          toast.error('Failed to load site data');
        } finally {
          setLoading(false);
        }
      };
      
      fetchSiteData();
    }
  }, [selectedSiteId]);
  
  useEffect(() => {
    const locationState = location.state as { supervisorId?: string, newSite?: boolean } | null;
    if (locationState?.supervisorId && userRole === UserRole.ADMIN) {
      setSelectedSupervisorId(locationState.supervisorId);
    }
    
    if (locationState?.newSite && userRole === UserRole.ADMIN) {
      setIsSiteFormOpen(true);
    }
  }, [location, userRole]);

  const ensureDateObjects = (site: Site): Site => {
    return site;
  };

  const handleAddSite = async (newSite: Partial<Site>) => {
    try {
      const currentSupervisorId = userRole === UserRole.ADMIN && selectedSupervisorId 
        ? selectedSupervisorId 
        : supervisorId;
      
      if (!currentSupervisorId) {
        toast.error("Supervisor ID is required");
        return;
      }
        
      const { data: userData } = await supabase.auth.getUser();
      
      if (!userData.user) {
        toast.error("You must be logged in to add a site");
        return;
      }
      
      const siteData = {
        name: newSite.name,
        job_name: newSite.jobName,
        pos_no: newSite.posNo,
        start_date: formatDateForSupabase(newSite.startDate!),
        supervisor_id: currentSupervisorId,
        is_completed: false,
        funds: 0
      };
      
      const { data, error } = await supabase
        .from('sites')
        .insert(siteData)
        .select('*')
        .single();
        
      if (error) {
        throw error;
      }
      
      if (data) {
        const formattedSite: Site = {
          id: data.id,
          name: data.name,
          jobName: data.job_name,
          posNo: data.pos_no,
          startDate: new Date(data.start_date),
          supervisorId: data.supervisor_id,
          createdAt: new Date(data.created_at),
          isCompleted: data.is_completed,
          funds: data.funds || 0
        };
        
        setSites(prevSites => [...prevSites, formattedSite]);
        toast.success(`Site "${formattedSite.name}" created successfully`);
      }
    } catch (error: any) {
      console.error("Error adding site:", error);
      toast.error(`Failed to add site: ${error.message}`);
    }
  };

  const handleAddExpense = async (newExpense: Partial<Expense>) => {
    try {
      if (!currentUserId) {
        toast.error("You must be logged in to add an expense");
        return;
      }
      
      const targetSupervisorId = userRole === UserRole.ADMIN && selectedSupervisorId 
        ? selectedSupervisorId 
        : supervisorId;
        
      if (!targetSupervisorId) {
        toast.error("Supervisor ID is required");
        return;
      }
        
      const expenseData = {
        date: formatDateForSupabase(newExpense.date!),
        description: newExpense.description,
        category: newExpense.category,
        amount: newExpense.amount,
        status: ApprovalStatus.APPROVED,
        created_by: currentUserId,
        site_id: newExpense.siteId,
        supervisor_id: targetSupervisorId
      };
      
      const { data, error } = await supabase
        .from('expenses')
        .insert(expenseData)
        .select('*')
        .single();
        
      if (error) {
        throw error;
      }
      
      if (data) {
        const formattedExpense: Expense = {
          id: data.id,
          date: new Date(data.date),
          description: data.description,
          category: data.category as ExpenseCategory,
          amount: data.amount,
          status: data.status as ApprovalStatus,
          createdBy: data.created_by || "",
          createdAt: new Date(data.created_at),
          siteId: data.site_id,
          supervisorId: data.supervisor_id || ""
        };
        
        setExpenses(prevExpenses => [formattedExpense, ...prevExpenses]);
        toast.success("Expense added successfully");
      }
    } catch (error: any) {
      console.error("Error adding expense:", error);
      toast.error(`Failed to add expense: ${error.message}`);
    }
  };

  const handleAddAdvance = async (newAdvance: Partial<Advance>) => {
    try {
      if (!currentUserId) {
        toast.error("You must be logged in to add an advance");
        return;
      }
      
      const advanceData = {
        date: formatDateForSupabase(newAdvance.date!),
        recipient_id: newAdvance.recipientId,
        recipient_name: newAdvance.recipientName,
        recipient_type: newAdvance.recipientType,
        purpose: newAdvance.purpose,
        amount: newAdvance.amount,
        remarks: newAdvance.remarks,
        status: ApprovalStatus.APPROVED,
        created_by: currentUserId,
        site_id: newAdvance.siteId
      };
      
      const { data, error } = await supabase
        .from('advances')
        .insert(advanceData)
        .select('*')
        .single();
        
      if (error) {
        throw error;
      }
      
      if (data) {
        const formattedAdvance: Advance = {
          id: data.id,
          date: new Date(data.date),
          recipientId: data.recipient_id,
          recipientName: data.recipient_name,
          recipientType: data.recipient_type as RecipientType,
          purpose: data.purpose as AdvancePurpose,
          amount: data.amount,
          remarks: data.remarks,
          status: data.status as ApprovalStatus,
          createdBy: data.created_by || "",
          createdAt: new Date(data.created_at),
          siteId: data.site_id
        };
        
        setAdvances(prevAdvances => [formattedAdvance, ...prevAdvances]);
        toast.success("Advance added successfully");
      }
    } catch (error: any) {
      console.error("Error adding advance:", error);
      toast.error(`Failed to add advance: ${error.message}`);
    }
  };

  const handleAddFunds = async (newFund: Partial<FundsReceived>) => {
    try {
      const fundsData = {
        date: formatDateForSupabase(newFund.date!),
        amount: newFund.amount,
        site_id: newFund.siteId,
        reference: newFund.reference,
        method: newFund.method
      };
      
      const { data, error } = await supabase
        .from('funds_received')
        .insert(fundsData)
        .select('*')
        .single();
        
      if (error) {
        throw error;
      }
      
      if (data) {
        const formattedFund: FundsReceived = {
          id: data.id,
          date: new Date(data.date),
          amount: data.amount,
          siteId: data.site_id || "",
          createdAt: new Date(data.created_at),
          reference: data.reference,
          method: data.method as PaymentMethod
        };
        
        setFundsReceived(prevFunds => [formattedFund, ...prevFunds]);
        
        if (data.site_id) {
          const { data: siteData, error: siteError } = await supabase
            .from('sites')
            .select('funds')
            .eq('id', data.site_id)
            .single();
            
          if (!siteError && siteData) {
            const updatedFunds = (siteData.funds || 0) + data.amount;
            
            await supabase
              .from('sites')
              .update({ funds: updatedFunds })
              .eq('id', data.site_id);
              
            setSites(prevSites =>
              prevSites.map(site =>
                site.id === data.site_id
                  ? { ...site, funds: updatedFunds }
                  : site
              )
            );
          }
        }
        
        toast.success("Funds received recorded successfully");
      }
    } catch (error: any) {
      console.error("Error adding funds:", error);
      toast.error(`Failed to add funds: ${error.message}`);
    }
  };

  const handleAddInvoice = async (newInvoice: Omit<Invoice, 'id' | 'createdAt'>) => {
    try {
      if (!currentUserId) {
        toast.error("You must be logged in to add an invoice");
        return;
      }
      
      const bankDetailsJson: Record<string, any> = {
        accountNumber: newInvoice.bankDetails.accountNumber,
        bankName: newInvoice.bankDetails.bankName,
        ifscCode: newInvoice.bankDetails.ifscCode,
        email: newInvoice.bankDetails.email,
        mobile: newInvoice.bankDetails.mobile
      };
      
      const invoiceData = {
        date: formatDateForSupabase(newInvoice.date),
        party_id: newInvoice.partyId,
        party_name: newInvoice.partyName,
        material: newInvoice.material,
        quantity: newInvoice.quantity,
        rate: newInvoice.rate,
        gst_percentage: newInvoice.gstPercentage,
        gross_amount: newInvoice.grossAmount,
        net_amount: newInvoice.netAmount,
        bank_details: bankDetailsJson,
        bill_url: newInvoice.billUrl,
        invoice_image_url: newInvoice.invoiceImageUrl,
        payment_status: newInvoice.paymentStatus,
        created_by: currentUserId,
        approver_type: newInvoice.approverType,
        site_id: newInvoice.siteId,
        vendor_name: newInvoice.vendorName || newInvoice.partyName,
        invoice_number: newInvoice.invoiceNumber || `INV-${Date.now().toString().slice(-6)}`,
        amount: newInvoice.amount || newInvoice.netAmount
      };
      
      const { data, error } = await supabase
        .from('invoices')
        .insert(invoiceData)
        .select('*')
        .single();
        
      if (error) {
        throw error;
      }
      
      if (data) {
        let bankDetails: BankDetails = {
          accountNumber: "",
          bankName: "",
          ifscCode: ""
        };
        
        if (data.bank_details) {
          const bd = data.bank_details as Record<string, any>;
          bankDetails = {
            accountNumber: bd.accountNumber || "",
            bankName: bd.bankName || "",
            ifscCode: bd.ifscCode || "",
            email: bd.email,
            mobile: bd.mobile
          };
        }
        
        const formattedInvoice: Invoice = {
          id: data.id,
          date: new Date(data.date),
          partyId: data.party_id || "",
          partyName: data.party_name || "",
          material: data.material || "",
          quantity: data.quantity || 0,
          rate: data.rate || 0,
          gstPercentage: data.gst_percentage || 0,
          grossAmount: data.gross_amount || 0,
          netAmount: data.net_amount,
          bankDetails: bankDetails,
          billUrl: data.bill_url,
          invoiceImageUrl: data.invoice_image_url,
          paymentStatus: data.payment_status as PaymentStatus,
          createdBy: data.created_by || "",
          createdAt: new Date(data.created_at),
          approverType: data.approver_type as "ho" | "supervisor" | undefined,
          siteId: data.site_id,
          vendorName: data.vendor_name,
          invoiceNumber: data.invoice_number,
          amount: data.amount
        };
        
        setInvoices(prevInvoices => [formattedInvoice, ...prevInvoices]);
        toast.success("Invoice added successfully");
      }
    } catch (error: any) {
      console.error("Error adding invoice:", error);
      toast.error(`Failed to add invoice: ${error.message}`);
    }
  };

  const handleCompleteSite = async (siteId: string, completionDate: Date) => {
    try {
      const { error } = await supabase
        .from('sites')
        .update({ 
          is_completed: true, 
          completion_date: formatDateForSupabase(completionDate)
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
    } catch (error: any) {
      console.error("Error completing site:", error);
      toast.error(`Failed to complete site: ${error.message}`);
    }
  };

  const filteredSites = sites.filter(site => {
    const matchesSearch = 
      site.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      site.jobName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      site.posNo.toLowerCase().includes(searchTerm.toLowerCase());
      
    return matchesSearch;
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

  return (
    <div className="space-y-6 animate-fade-in max-h-[calc(100vh-4rem)] overflow-hidden flex flex-col">
      {loading && (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <span className="ml-2">Loading...</span>
        </div>
      )}
      
      {!loading && selectedSite ? (
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
          : supervisorId || ''}
      />
    </div>
  );
};

export default Expenses;
