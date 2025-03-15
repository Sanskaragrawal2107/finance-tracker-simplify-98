
import React, { useState, useEffect } from 'react';
import { format, subDays } from 'date-fns';
import {
  Expense,
  Site,
  Advance,
  FundsReceived,
  Invoice,
  BalanceSummary,
  ExpenseCategory,
  AdvancePurpose,
  UserRole,
  ApprovalStatus,
  RecipientType,
  PaymentStatus
} from '@/lib/types';
import { supabase } from '@/integrations/supabase/client';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { useUser } from '@/hooks/use-user';
import { useNavigate } from 'react-router-dom';
import StatCard from '@/components/dashboard/StatCard';
import {
  Building2,
  Calendar,
  Coins,
  FileText,
  LayoutDashboard,
  ListChecks,
  LucideIcon,
  ScrollText,
  ShoppingBag,
  Truck,
  User,
  Wallet,
} from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer"
import SiteForm from '@/components/sites/SiteForm';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { formatCurrency } from '@/lib/utils';

interface DashboardCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
    label?: string;
  };
  className?: string;
  isLoading: boolean;
}

const DashboardCard: React.FC<DashboardCardProps> = ({
  title,
  value,
  icon: Icon,
  trend,
  className,
  isLoading,
}) => {
  return (
    <Card className={className}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {isLoading ? (
          <Skeleton className="h-4 w-10" />
        ) : (
          <Icon className="h-4 w-4 text-muted-foreground" />
        )}
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-8 w-32" />
        ) : (
          <div className="text-2xl font-bold">
            {typeof value === 'number' ? value.toLocaleString() : value}
          </div>
        )}
        {trend && (
          <p
            className={`text-sm font-medium ${trend.isPositive ? 'text-green-500' : 'text-red-500'
              }`}
          >
            {trend.isPositive ? '+' : '-'}
            {trend.value}% {trend.label}
          </p>
        )}
      </CardContent>
    </Card>
  );
};

const Expenses = () => {
  const [sites, setSites] = useState<Site[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [advances, setAdvances] = useState<Advance[]>([]);
  const [fundsReceived, setFundsReceived] = useState<FundsReceived[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [supervisorInvoices, setSupervisorInvoices] = useState<Invoice[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedSiteId, setSelectedSiteId] = useState<string | null>(null);
  const [isSiteFormOpen, setIsSiteFormOpen] = useState(false);
  const [isMobile] = useIsMobile();
  const { toast } = useToast();
  const { user } = useUser();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) {
      navigate('/login');
    }
  }, [user, navigate]);

  useEffect(() => {
    const fetchAllData = async () => {
      setIsLoading(true);
      try {
        const { data: sitesData, error: sitesError } = await supabase
          .from('sites')
          .select('*')
          .order('created_at', { ascending: false });

        if (sitesError) {
          console.error('Error fetching sites:', sitesError);
          toast({
            title: "Error",
            description: "Failed to load sites. Please try again.",
            variant: "destructive",
          })
          return;
        }

        const { data: expensesData, error: expensesError } = await supabase
          .from('expenses')
          .select('*')
          .order('date', { ascending: false });

        if (expensesError) {
          console.error('Error fetching expenses:', expensesError);
          toast({
            title: "Error",
            description: "Failed to load expenses. Please try again.",
            variant: "destructive",
          })
          return;
        }

        const { data: advancesData, error: advancesError } = await supabase
          .from('advances')
          .select('*')
          .order('date', { ascending: false });

        if (advancesError) {
          console.error('Error fetching advances:', advancesError);
          toast({
            title: "Error",
            description: "Failed to load advances. Please try again.",
            variant: "destructive",
          })
          return;
        }

        const { data: fundsData, error: fundsError } = await supabase
          .from('funds_received')
          .select('*')
          .order('date', { ascending: false });

        if (fundsError) {
          console.error('Error fetching funds:', fundsError);
          toast({
            title: "Error",
            description: "Failed to load funds received. Please try again.",
            variant: "destructive",
          })
          return;
        }

        // Fetch invoices from Supabase
        const { data: invoicesData, error: invoicesError } = await supabase
          .from('site_invoices')
          .select('*')
          .order('date', { ascending: false });

        if (invoicesError) {
          console.error('Error fetching invoices:', invoicesError);
          toast({
            title: "Error",
            description: "Failed to load invoices. Please try again.",
            variant: "destructive",
          })
          return;
        }

        // Map invoices data
        const mappedInvoices: Invoice[] = invoicesData
          ? invoicesData.map((invoice) => {
            // Parse material_items and bank_details from JSON strings
            let parsedMaterialItems: any[] = [];
            try {
              parsedMaterialItems = JSON.parse(invoice.material_items as string) as any[];
            } catch (e) {
              console.error('Error parsing material items:', e);
              parsedMaterialItems = [];
            }

            let parsedBankDetails: any = {
              accountNumber: '',
              bankName: '',
              ifscCode: '',
            };
            try {
              parsedBankDetails = JSON.parse(invoice.bank_details as string) as any;
            } catch (e) {
              console.error('Error parsing bank details:', e);
            }

            return {
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
              materialItems: parsedMaterialItems,
              bankDetails: parsedBankDetails,
              billUrl: invoice.bill_url,
              paymentStatus: invoice.payment_status as PaymentStatus,
              createdBy: invoice.created_by || '',
              createdAt: new Date(invoice.created_at),
              approverType: invoice.approver_type as "ho" | "supervisor" || "ho",
              siteId: invoice.site_id || '',
              // Add required fields to match the Invoice type
              vendorName: invoice.party_name,
              invoiceNumber: invoice.id,
              amount: Number(invoice.net_amount)
            };
          })
          : [];

        // Separate invoices based on approver_type
        const siteInvoices = mappedInvoices.filter(
          (invoice) => invoice.approverType !== 'supervisor'
        );
        const supervisorInvoices = mappedInvoices.filter(
          (invoice) => invoice.approverType === 'supervisor'
        );

        // Convert date strings to Date objects and map to correct Type interfaces
        setSites(
          sitesData
            ? sitesData.map((site) => ({
              id: site.id,
              name: site.name,
              jobName: site.job_name || '',
              posNo: site.pos_no || '',
              location: site.location,
              startDate: new Date(site.start_date || Date.now()),
              completionDate: site.completion_date
                ? new Date(site.completion_date)
                : undefined,
              supervisorId: site.supervisor_id || '',
              createdAt: new Date(site.created_at || Date.now()),
              isCompleted: site.is_completed || false,
              funds: site.funds || 0,
              totalFunds: site.total_funds || 0
            }))
            : []
        );

        setExpenses(
          expensesData
            ? expensesData.map((expense) => ({
              id: expense.id,
              date: new Date(expense.date),
              description: expense.description || '',
              category: expense.category as ExpenseCategory,
              amount: Number(expense.amount),
              status: ApprovalStatus.APPROVED, // Default value since it's required
              createdBy: expense.created_by || '',
              createdAt: new Date(expense.created_at || Date.now()),
              siteId: expense.site_id || '',
              supervisorId: '' // Default value since it's required
            }))
            : []
        );

        setAdvances(
          advancesData
            ? advancesData.map((advance) => ({
              id: advance.id,
              date: new Date(advance.date),
              recipientId: '',
              recipientName: advance.recipient_name,
              recipientType: advance.recipient_type as RecipientType,
              purpose: advance.purpose as AdvancePurpose,
              amount: Number(advance.amount),
              remarks: advance.remarks || '',
              status: advance.status as ApprovalStatus,
              createdBy: advance.created_by || '',
              createdAt: new Date(advance.created_at),
              siteId: advance.site_id || ''
            }))
            : []
        );

        setFundsReceived(
          fundsData
            ? fundsData.map((fund) => ({
              id: fund.id,
              date: new Date(fund.date),
              amount: Number(fund.amount),
              siteId: fund.site_id,
              createdAt: new Date(fund.created_at),
              reference: fund.reference || '',
              method: fund.method || ''
            }))
            : []
        );

        setInvoices(siteInvoices);
        setSupervisorInvoices(supervisorInvoices);
      } catch (error) {
        console.error('Unexpected error:', error);
        toast({
          title: "Error",
          description: "An unexpected error occurred. Please try again.",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false);
      }
    };

    fetchAllData();
  }, [toast]);

  const handleAddSite = async (newSite: Omit<Site, 'id' | 'createdAt'>) => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('sites')
        .insert([
          {
            name: newSite.name,
            job_name: newSite.jobName,
            pos_no: newSite.posNo,
            location: newSite.location,
            start_date: newSite.startDate.toISOString(),
            completion_date: newSite.completionDate?.toISOString() || null,
            supervisor_id: newSite.supervisorId,
            is_completed: newSite.isCompleted || false,
            funds: newSite.funds || 0,
            total_funds: newSite.totalFunds || 0,
            created_by: user?.id,
          },
        ])
        .select()
        .single();

      if (error) {
        console.error('Error adding site:', error);
        toast({
          title: "Error",
          description: "Failed to add site. Please try again.",
          variant: "destructive",
        })
        return;
      }

      const addedSite: Site = {
        id: data.id,
        name: data.name,
        jobName: data.job_name || '',
        posNo: data.pos_no || '',
        location: data.location,
        startDate: new Date(data.start_date || Date.now()),
        completionDate: data.completion_date ? new Date(data.completion_date) : undefined,
        supervisorId: data.supervisor_id || '',
        createdAt: new Date(data.created_at || Date.now()),
        isCompleted: data.is_completed || false,
        funds: data.funds || 0,
        totalFunds: data.total_funds || 0
      };

      setSites([...sites, addedSite]);
      setIsSiteFormOpen(false);
      toast({
        title: "Success",
        description: "Site added successfully.",
      })
    } catch (error) {
      console.error('Unexpected error:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false);
    }
  };

  const handleSiteUpdate = async (siteId: string, key: string, value: any) => {
    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('sites')
        .update({ [key]: value })
        .eq('id', siteId);

      if (error) {
        console.error(`Error updating site ${key}:`, error);
        toast({
          title: "Error",
          description: `Failed to update site ${key}. Please try again.`,
          variant: "destructive",
        })
        return;
      }

      setSites(
        sites.map((site) =>
          site.id === siteId ? { ...site, [key]: value } : site
        )
      );
      toast({
        title: "Success",
        description: `Site ${key} updated successfully.`,
      })
    } catch (error) {
      console.error('Unexpected error:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false);
    }
  };

  const handleCompleteSite = async (siteId: string, completionDate: Date) => {
    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('sites')
        .update({ is_completed: true, completion_date: completionDate.toISOString() })
        .eq('id', siteId);

      if (error) {
        console.error('Error completing site:', error);
        toast({
          title: "Error",
          description: "Failed to complete site. Please try again.",
          variant: "destructive",
        })
        return;
      }

      setSites(
        sites.map((site) =>
          site.id === siteId ? { ...site, isCompleted: true, completionDate } : site
        )
      );
      toast({
        title: "Success",
        description: "Site completed successfully.",
      })
    } catch (error) {
      console.error('Unexpected error:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddExpense = async (expense: Partial<Expense>) => {
    setIsLoading(true);
    try {
      // Ensure all required fields are provided
      if (!expense.amount || !expense.category) {
        toast({
          title: "Error",
          description: "Amount and category are required fields.",
          variant: "destructive",
        });
        return;
      }

      const { data, error } = await supabase
        .from('expenses')
        .insert([
          {
            date: expense.date?.toISOString() || new Date().toISOString(),
            description: expense.description || '',
            category: expense.category,
            amount: expense.amount,
            site_id: expense.siteId,
            created_by: user?.id,
          },
        ])
        .select()
        .single();

      if (error) {
        console.error('Error adding expense:', error);
        toast({
          title: "Error",
          description: "Failed to add expense. Please try again.",
          variant: "destructive",
        })
        return;
      }

      const addedExpense: Expense = {
        id: data.id,
        date: new Date(data.date),
        description: data.description || '',
        category: data.category as ExpenseCategory,
        amount: Number(data.amount),
        status: ApprovalStatus.APPROVED,
        createdBy: data.created_by || '',
        createdAt: new Date(data.created_at || Date.now()),
        siteId: data.site_id || '',
        supervisorId: ''
      };

      setExpenses([...expenses, addedExpense]);
      toast({
        title: "Success",
        description: "Expense added successfully.",
      })
    } catch (error) {
      console.error('Unexpected error:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddAdvance = async (advance: Partial<Advance>) => {
    setIsLoading(true);
    try {
      // Ensure all required fields are provided
      if (!advance.amount || !advance.recipientName || !advance.recipientType || !advance.purpose) {
        toast({
          title: "Error",
          description: "All required fields must be provided.",
          variant: "destructive",
        });
        return;
      }

      const { data, error } = await supabase
        .from('advances')
        .insert([
          {
            date: advance.date?.toISOString() || new Date().toISOString(),
            recipient_name: advance.recipientName,
            recipient_type: advance.recipientType,
            purpose: advance.purpose,
            amount: advance.amount,
            remarks: advance.remarks || '',
            status: advance.status || ApprovalStatus.PENDING,
            site_id: advance.siteId,
            created_by: user?.id,
          },
        ])
        .select()
        .single();

      if (error) {
        console.error('Error adding advance:', error);
        toast({
          title: "Error",
          description: "Failed to add advance. Please try again.",
          variant: "destructive",
        })
        return;
      }

      const addedAdvance: Advance = {
        id: data.id,
        date: new Date(data.date),
        recipientId: '',
        recipientName: data.recipient_name,
        recipientType: data.recipient_type as RecipientType,
        purpose: data.purpose as AdvancePurpose,
        amount: Number(data.amount),
        remarks: data.remarks || '',
        status: data.status as ApprovalStatus,
        createdBy: data.created_by || '',
        createdAt: new Date(data.created_at),
        siteId: data.site_id || ''
      };

      setAdvances([...advances, addedAdvance]);
      toast({
        title: "Success",
        description: "Advance added successfully.",
      })
    } catch (error) {
      console.error('Unexpected error:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddFunds = async (funds: Partial<FundsReceived>) => {
    setIsLoading(true);
    try {
      // Ensure all required fields are provided
      if (!funds.amount || !funds.siteId) {
        toast({
          title: "Error",
          description: "Amount and site ID are required fields.",
          variant: "destructive",
        });
        return;
      }

      const { data, error } = await supabase
        .from('funds_received')
        .insert([
          {
            date: funds.date?.toISOString() || new Date().toISOString(),
            amount: funds.amount,
            site_id: funds.siteId,
            reference: funds.reference || null,
            method: funds.method || null,
          },
        ])
        .select()
        .single();

      if (error) {
        console.error('Error adding funds:', error);
        toast({
          title: "Error",
          description: "Failed to add funds. Please try again.",
          variant: "destructive",
        })
        return;
      }

      const addedFunds: FundsReceived = {
        id: data.id,
        date: new Date(data.date),
        amount: Number(data.amount),
        siteId: data.site_id,
        createdAt: new Date(data.created_at),
        reference: data.reference || '',
        method: data.method || ''
      };

      setFundsReceived([...fundsReceived, addedFunds]);
      toast({
        title: "Success",
        description: "Funds added successfully.",
      })
    } catch (error) {
      console.error('Unexpected error:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddInvoice = async (invoice: Omit<Invoice, 'id' | 'createdAt'>) => {
    setIsLoading(true);
    try {
      // Stringify material_items and bank_details
      const materialItemsString = JSON.stringify(invoice.materialItems || []);
      const bankDetailsString = JSON.stringify(invoice.bankDetails || {});

      // Ensure required fields
      if (!invoice.netAmount || !invoice.material || !invoice.partyName) {
        toast({
          title: "Error",
          description: "All required fields must be provided.",
          variant: "destructive",
        });
        return;
      }

      const { data, error } = await supabase
        .from('site_invoices')
        .insert([
          {
            date: invoice.date.toISOString(),
            party_id: invoice.partyId,
            party_name: invoice.partyName,
            material: invoice.material,
            quantity: invoice.quantity,
            rate: invoice.rate,
            gst_percentage: invoice.gstPercentage,
            gross_amount: invoice.grossAmount,
            net_amount: invoice.netAmount,
            material_items: materialItemsString,
            bank_details: bankDetailsString,
            bill_url: invoice.billUrl || null,
            payment_status: invoice.paymentStatus || PaymentStatus.PENDING,
            approver_type: invoice.approverType || 'ho',
            site_id: invoice.siteId || null,
            created_by: user?.id,
          },
        ])
        .select()
        .single();

      if (error) {
        console.error('Error adding invoice:', error);
        toast({
          title: "Error",
          description: "Failed to add invoice. Please try again.",
          variant: "destructive",
        })
        return;
      }

      // Parse the material_items and bank_details back to objects
      let parsedMaterialItems: any[] = [];
      try {
        parsedMaterialItems = JSON.parse(data.material_items as string) as any[];
      } catch (e) {
        console.error('Error parsing material items:', e);
      }

      let parsedBankDetails: any = {};
      try {
        parsedBankDetails = JSON.parse(data.bank_details as string) as any;
      } catch (e) {
        console.error('Error parsing bank details:', e);
      }

      const addedInvoice: Invoice = {
        id: data.id,
        date: new Date(data.date),
        partyId: data.party_id,
        partyName: data.party_name,
        material: data.material,
        quantity: Number(data.quantity),
        rate: Number(data.rate),
        gstPercentage: Number(data.gst_percentage),
        grossAmount: Number(data.gross_amount),
        netAmount: Number(data.net_amount),
        materialItems: parsedMaterialItems,
        bankDetails: parsedBankDetails,
        billUrl: data.bill_url,
        paymentStatus: data.payment_status as PaymentStatus,
        createdBy: data.created_by || '',
        createdAt: new Date(data.created_at),
        approverType: data.approver_type as "ho" | "supervisor" || "ho",
        siteId: data.site_id || '',
        // Additional fields required by Invoice type
        vendorName: data.party_name,
        invoiceNumber: data.id,
        amount: Number(data.net_amount)
      };

      if (addedInvoice.approverType === 'supervisor') {
        setSupervisorInvoices([...supervisorInvoices, addedInvoice]);
      } else {
        setInvoices([...invoices, addedInvoice]);
      }
      toast({
        title: "Success",
        description: "Invoice added successfully.",
      })
    } catch (error) {
      console.error('Unexpected error:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false);
    }
  };

  const getSiteById = (siteId: string) => {
    return sites.find((site) => site.id === siteId);
  };

  const calculateSiteBalanceSummary = (
    siteId: string,
    siteExpenses: Expense[],
    siteAdvances: Advance[],
    siteFunds: FundsReceived[],
    supervisorInvoices: Invoice[]
  ): BalanceSummary => {
    // Filter advances to separate regular advances from debits to worker
    const DEBIT_ADVANCE_PURPOSES = [
      AdvancePurpose.SAFETY_SHOES,
      AdvancePurpose.TOOLS,
      AdvancePurpose.OTHER
    ];
    
    const regularAdvances = siteAdvances.filter(advance => 
      !DEBIT_ADVANCE_PURPOSES.includes(advance.purpose as AdvancePurpose)
    );
    
    const debitAdvances = siteAdvances.filter(advance => 
      DEBIT_ADVANCE_PURPOSES.includes(advance.purpose as AdvancePurpose)
    );

    const totalFunds = siteFunds.reduce((sum, fund) => sum + fund.amount, 0);
    const totalExpenses = siteExpenses.reduce((sum, expense) => sum + expense.amount, 0);
    const totalRegularAdvances = regularAdvances.reduce((sum, advance) => sum + advance.amount, 0);
    const totalDebitToWorker = debitAdvances.reduce((sum, advance) => sum + advance.amount, 0);
    const supervisorInvoiceTotal = supervisorInvoices.reduce((sum, invoice) => sum + (invoice.netAmount || 0), 0);
    
    // Calculate pending invoices (those with pending status)
    const pendingInvoicesTotal = supervisorInvoices
      .filter(invoice => invoice.paymentStatus === 'pending')
      .reduce((sum, invoice) => sum + (invoice.netAmount || 0), 0);

    // Updated balance calculation according to the requirement:
    // current balance = Funds Received from HO - Total Expenses - Total Regular Advances - Invoices paid by supervisor
    // (note: debits to worker are tracked separately but not subtracted from balance)
    const totalBalance = totalFunds - totalExpenses - totalRegularAdvances - supervisorInvoiceTotal;

    console.log('Balance calculation data:', {
      totalFunds,
      totalExpenses,
      totalRegularAdvances,
      totalDebitToWorker,
      supervisorInvoiceTotal,
      pendingInvoicesTotal,
      totalBalance
    });

    return {
      fundsReceived: totalFunds,
      totalExpenditure: totalExpenses,
      totalAdvances: totalRegularAdvances,
      debitsToWorker: totalDebitToWorker,
      invoicesPaid: supervisorInvoiceTotal,
      pendingInvoices: pendingInvoicesTotal,
      totalBalance
    };
  };

  const selectedSite = selectedSiteId ? getSiteById(selectedSiteId) : null;

  const siteExpenses = selectedSiteId
    ? expenses.filter((expense) => expense.siteId === selectedSiteId)
    : [];
  const siteAdvances = selectedSiteId
    ? advances.filter((advance) => advance.siteId === selectedSiteId)
    : [];
  const siteFunds = selectedSiteId
    ? fundsReceived.filter((fund) => fund.siteId === selectedSiteId)
    : [];
  const siteInvoices = selectedSiteId
    ? invoices.filter((invoice) => invoice.siteId === selectedSiteId)
    : [];
  const siteSupervisorInvoices = selectedSiteId
    ? supervisorInvoices.filter((invoice) => invoice.siteId === selectedSiteId)
    : [];

  const balanceSummary = selectedSiteId
    ? calculateSiteBalanceSummary(
      selectedSiteId,
      siteExpenses,
      siteAdvances,
      siteFunds,
      siteSupervisorInvoices
    )
    : {
      fundsReceived: 0,
      totalExpenditure: 0,
      totalAdvances: 0,
      debitsToWorker: 0,
      invoicesPaid: 0,
      pendingInvoices: 0,
      totalBalance: 0,
    };

  return (
    <div className="container mx-auto py-10">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-3xl font-bold">Sites & Expenses</h1>
        {user?.role === UserRole.ADMIN && (
          <Button onClick={() => setIsSiteFormOpen(true)} className="flex items-center">
            <Plus className="mr-2 h-4 w-4" />
            Add New Site
          </Button>
        )}
      </div>

      <Drawer open={isSiteFormOpen} onOpenChange={setIsSiteFormOpen}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>Create New Site</DrawerTitle>
            <DrawerDescription>
              Fill in the details to create a new construction site.
            </DrawerDescription>
          </DrawerHeader>
          <SiteForm 
            onSubmit={handleAddSite} 
            onClose={() => setIsSiteFormOpen(false)} 
            isOpen={isSiteFormOpen}
          />
          <DrawerFooter>
            <Button variant="outline" onClick={() => setIsSiteFormOpen(false)}>Cancel</Button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>

      <div className="grid grid-cols-1 gap-6 mb-8 md:grid-cols-2 lg:grid-cols-3">
        <StatCard
          title="Total Sites"
          value={sites.length}
          icon={Building2}
          isLoading={isLoading}
        />
        <StatCard
          title="Total Funds Allocated"
          value={
            sites.reduce((sum, site) => sum + (site.totalFunds || 0), 0)
          }
          icon={Coins}
          isLoading={isLoading}
          valuePrefix="₹"
        />
        <StatCard
          title="Total Expenses"
          value={expenses.reduce((sum, expense) => sum + expense.amount, 0)}
          icon={Wallet}
          isLoading={isLoading}
          valuePrefix="₹"
        />
      </div>

      <div className="mb-6">
        <Label htmlFor="site">Select Site</Label>
        <Select onValueChange={setSelectedSiteId}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select a site" />
          </SelectTrigger>
          <SelectContent>
            {sites.map((site) => (
              <SelectItem key={site.id} value={site.id}>
                {site.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {selectedSite ? (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-semibold">Site Details: {selectedSite.name}</h2>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive">Delete</Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete your site
                    and remove your data from our servers.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction>Continue</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle>Site Information</CardTitle>
                <CardDescription>Details about the selected site.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div>
                    <Label>Name</Label>
                    <Input
                      type="text"
                      value={selectedSite.name}
                      disabled={isLoading}
                      onChange={(e) => handleSiteUpdate(selectedSite.id, 'name', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label>Job Name</Label>
                    <Input
                      type="text"
                      value={selectedSite.jobName || ''}
                      disabled={isLoading}
                      onChange={(e) => handleSiteUpdate(selectedSite.id, 'job_name', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label>Location</Label>
                    <Input
                      type="text"
                      value={selectedSite.location}
                      disabled={isLoading}
                      onChange={(e) => handleSiteUpdate(selectedSite.id, 'location', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label>Start Date</Label>
                    <Input
                      type="date"
                      value={format(selectedSite.startDate, 'yyyy-MM-dd')}
                      disabled={isLoading}
                      onChange={(e) =>
                        handleSiteUpdate(
                          selectedSite.id,
                          'start_date',
                          e.target.value
                        )
                      }
                    />
                  </div>
                  <div>
                    <Label>Completion Date</Label>
                    <Input
                      type="date"
                      value={
                        selectedSite.completionDate
                          ? format(selectedSite.completionDate, 'yyyy-MM-dd')
                          : ''
                      }
                      disabled={isLoading}
                      onChange={(e) =>
                        handleSiteUpdate(
                          selectedSite.id,
                          'completion_date',
                          e.target.value
                        )
                      }
                    />
                  </div>
                  <div>
                    <Label>Total Funds</Label>
                    <Input
                      type="number"
                      value={selectedSite.totalFunds || 0}
                      disabled={isLoading}
                      onChange={(e) =>
                        handleSiteUpdate(
                          selectedSite.id,
                          'total_funds',
                          Number(e.target.value)
                        )
                      }
                    />
                  </div>
                  <div>
                    <Label>Is Completed</Label>
                    <Input
                      type="checkbox"
                      checked={selectedSite.isCompleted}
                      disabled={isLoading}
                      onChange={(e) =>
                        handleSiteUpdate(
                          selectedSite.id,
                          'is_completed',
                          e.target.checked
                        )
                      }
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Balance Summary</CardTitle>
                <CardDescription>Financial overview of the selected site.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div>
                    <Label>Funds Received</Label>
                    <Input
                      type="text"
                      value={formatCurrency(balanceSummary.fundsReceived)}
                      disabled
                    />
                  </div>
                  <div>
                    <Label>Total Expenditure</Label>
                    <Input
                      type="text"
                      value={formatCurrency(balanceSummary.totalExpenditure)}
                      disabled
                    />
                  </div>
                  <div>
                    <Label>Total Advances</Label>
                    <Input
                      type="text"
                      value={formatCurrency(balanceSummary.totalAdvances || 0)}
                      disabled
                    />
                  </div>
                  <div>
                    <Label>Debits to Worker</Label>
                    <Input
                      type="text"
                      value={formatCurrency(balanceSummary.debitsToWorker || 0)}
                      disabled
                    />
                  </div>
                  <div>
                    <Label>Invoices Paid</Label>
                    <Input
                      type="text"
                      value={formatCurrency(balanceSummary.invoicesPaid || 0)}
                      disabled
                    />
                  </div>
                  <div>
                    <Label>Pending Invoices</Label>
                    <Input
                      type="text"
                      value={formatCurrency(balanceSummary.pendingInvoices || 0)}
                      disabled
                    />
                  </div>
                  <div>
                    <Label>Total Balance</Label>
                    <Input
                      type="text"
                      value={formatCurrency(balanceSummary.totalBalance)}
                      disabled
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Expenses</CardTitle>
                <CardDescription>List of expenses for the selected site.</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Amount</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {siteExpenses.map((expense) => (
                      <TableRow key={expense.id}>
                        <TableCell>{format(expense.date, 'yyyy-MM-dd')}</TableCell>
                        <TableCell>{expense.category}</TableCell>
                        <TableCell>{formatCurrency(expense.amount)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        </div>
      ) : (
        <p>Please select a site to view details.</p>
      )}
    </div>
  );
};

export default Expenses;
