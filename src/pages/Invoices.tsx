import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import {
  PageTitle,
  CustomCard,
  Button,
  Search,
  Plus,
  Filter,
  Building,
  Download,
  CheckCircle2,
  Clock,
  IndianRupee,
  Users,
  User,
  Package,
  Tag,
  Percent,
  CreditCard,
  Receipt,
  Landmark,
  Calendar
} from '@/components/ui';
import {
  Invoice,
  PaymentStatus,
  BankDetails,
  UserRole,
  Site
} from '@/lib/types';
import InvoiceForm from '@/components/invoices/InvoiceForm';
import InvoiceDetails from '@/components/invoices/InvoiceDetails';
import { toast } from 'sonner';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { supervisors } from '@/data/supervisors';

const initialInvoices: Invoice[] = [];

const Invoices: React.FC = () => {
  const [invoices, setInvoices] = useState<Invoice[]>(initialInvoices);
  const [isInvoiceFormOpen, setIsInvoiceFormOpen] = useState(false);
  const [isInvoiceDetailsOpen, setIsInvoiceDetailsOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'paid'>('all');
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [selectedSupervisorId, setSelectedSupervisorId] = useState<string | null>(null);
  const [sites, setSites] = useState<Site[]>([]);
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

    fetchInvoices();
    fetchSites();
  }, []);

  const fetchInvoices = async () => {
    try {
      setIsLoading(true);

      let query = supabase.from('invoices').select('*');

      if (userRole === UserRole.SUPERVISOR && selectedSupervisorId) {
        // Fetch site IDs for the supervisor
        const { data: sitesData, error: sitesError } = await supabase
          .from('sites')
          .select('id')
          .eq('supervisor_id', selectedSupervisorId);

        if (sitesError) throw sitesError;

        if (sitesData && sitesData.length > 0) {
          const siteIds = sitesData.map(site => site.id);
          query = query.in('site_id', siteIds);
        } else {
          // If no sites are found for the supervisor, return an empty array
          setInvoices([]);
          return;
        }
      } else if (userRole === UserRole.ADMIN && selectedSupervisorId) {
        // Fetch site IDs for the supervisor
        const { data: sitesData, error: sitesError } = await supabase
          .from('sites')
          .select('id')
          .eq('supervisor_id', selectedSupervisorId);

        if (sitesError) throw sitesError;

        if (sitesData && sitesData.length > 0) {
          const siteIds = sitesData.map(site => site.id);
          query = query.in('site_id', siteIds);
        } else {
          // If no sites are found for the supervisor, return an empty array
          setInvoices([]);
          return;
        }
      }

      const { data, error } = await query;

      if (error) {
        throw error;
      }

      if (data) {
        const formattedInvoices: Invoice[] = data.map(invoice => ({
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
          bankDetails: invoice.bank_details as BankDetails,
          billUrl: invoice.bill_url,
          invoiceImageUrl: invoice.invoice_image_url,
          paymentStatus: invoice.payment_status,
          createdBy: invoice.created_by || '',
          createdAt: new Date(invoice.created_at),
          approverType: invoice.approver_type,
          siteId: invoice.site_id,
          amount: invoice.net_amount
        }));

        setInvoices(formattedInvoices);
      }
    } catch (err: any) {
      console.error('Error fetching invoices:', err);
      toast.error('Failed to load invoices: ' + err.message);
    } finally {
      setIsLoading(false);
    }
  };

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

  const handleAddInvoice = async (newInvoice: Omit<Invoice, 'id' | 'createdAt'>) => {
    try {
      const invoiceWithId: Invoice = {
        ...newInvoice,
        id: Date.now().toString(),
        createdAt: new Date(),
      };

      // Save to Supabase
      const { data, error } = await supabase
        .from('invoices')
        .insert({
          date: invoiceWithId.date.toISOString(),
          party_id: invoiceWithId.partyId,
          party_name: invoiceWithId.partyName,
          material: invoiceWithId.material,
          quantity: invoiceWithId.quantity,
          rate: invoiceWithId.rate,
          gst_percentage: invoiceWithId.gstPercentage,
          gross_amount: invoiceWithId.grossAmount,
          net_amount: invoiceWithId.netAmount,
          bank_details: invoiceWithId.bankDetails,
          bill_url: invoiceWithId.billUrl,
          invoice_image_url: invoiceWithId.invoiceImageUrl,
          payment_status: invoiceWithId.paymentStatus,
          created_by: invoiceWithId.createdBy,
          approver_type: invoiceWithId.approverType,
          site_id: invoiceWithId.siteId
        });

      if (error) throw error;

      setInvoices(prevInvoices => [invoiceWithId, ...prevInvoices]);
      toast.success("Invoice added successfully");
    } catch (err: any) {
      console.error('Error adding invoice:', err);
      toast.error('Failed to add invoice: ' + err.message);
    }
  };

  const handleMakePayment = async (invoiceId: string) => {
    try {
      // Optimistically update the local state
      setInvoices(prevInvoices =>
        prevInvoices.map(invoice =>
          invoice.id === invoiceId ? { ...invoice, paymentStatus: PaymentStatus.PAID } : invoice
        )
      );

      // Update the payment status in Supabase
      const { error } = await supabase
        .from('invoices')
        .update({ payment_status: PaymentStatus.PAID })
        .eq('id', invoiceId);

      if (error) {
        throw error;
      }

      toast.success("Payment status updated successfully");
    } catch (err: any) {
      console.error('Error updating payment status:', err);
      toast.error('Failed to update payment status: ' + err.message);

      // Revert the local state in case of an error
      setInvoices(prevInvoices =>
        prevInvoices.map(invoice =>
          invoice.id === invoiceId ? { ...invoice, paymentStatus: PaymentStatus.PENDING } : invoice
        )
      );
    }
  };

  const getSelectedSupervisorName = () => {
    if (!selectedSupervisorId) return null;
    const supervisor = supervisors.find(s => s.id === selectedSupervisorId);
    return supervisor ? supervisor.name : "Unknown Supervisor";
  };

  const filteredInvoices = invoices.filter(invoice => {
    const matchesSearch =
      invoice.partyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      invoice.material.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      filterStatus === 'all' ? true : invoice.paymentStatus === filterStatus;

    return matchesSearch && matchesStatus;
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-16rem)]">
        <div className="animate-pulse text-xl text-primary">Loading invoices...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in max-h-[calc(100vh-4rem)] overflow-hidden flex flex-col">
      <PageTitle
        title="Invoices"
        subtitle="Manage and track invoices from vendors and suppliers"
        className="mb-4"
      />

      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
        <div className="flex flex-col md:flex-row md:items-center gap-4 w-full md:w-auto">
          <div className="relative max-w-md w-full">
            <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search invoices..."
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
                onValueChange={(value: 'all' | 'pending' | 'paid') => setFilterStatus(value)}
              >
                <SelectTrigger className="w-full">
                  <CheckCircle2 className="h-4 w-4 mr-2 text-muted-foreground" />
                  <SelectValue placeholder="All Payment Statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Payment Statuses</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
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
                <h4 className="font-medium">Filter Invoices</h4>
                <div className="space-y-2">
                  <h5 className="text-sm font-medium">Payment Status</h5>
                  <div className="flex flex-col space-y-2">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="filter-all"
                        checked={filterStatus === 'all'}
                        onCheckedChange={() => setFilterStatus('all')}
                      />
                      <Label htmlFor="filter-all">All Statuses</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="filter-pending"
                        checked={filterStatus === 'pending'}
                        onCheckedChange={() => setFilterStatus('pending')}
                      />
                      <Label htmlFor="filter-pending">Pending</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="filter-paid"
                        checked={filterStatus === 'paid'}
                        onCheckedChange={() => setFilterStatus('paid')}
                      />
                      <Label htmlFor="filter-paid">Paid</Label>
                    </div>
                  </div>
                </div>
              </div>
            </PopoverContent>
          </Popover>
          <Button
            size="sm"
            className="h-10"
            onClick={() => setIsInvoiceFormOpen(true)}
          >
            <Plus className="h-4 w-4 mr-2" />
            New Invoice
          </Button>
        </div>
      </div>

      {userRole === UserRole.ADMIN && selectedSupervisorId && (
        <div className="mb-4 p-3 bg-blue-50 border border-blue-100 rounded-md flex items-center">
          <Users className="h-5 w-5 mr-2 text-blue-500" />
          <span className="font-medium">
            Viewing invoices for: {getSelectedSupervisorName()}
          </span>
        </div>
      )}

      <div className="overflow-y-auto flex-1 pr-2">
        {invoices.length > 0 ? (
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredInvoices.map((invoice) => (
              <CustomCard
                key={invoice.id}
                className="p-0 overflow-hidden"
              >
                <div className="p-4 sm:p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-medium">{invoice.partyName}</h3>
                    <span className="text-sm text-muted-foreground">
                      {format(invoice.date, 'MMM dd, yyyy')}
                    </span>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Package className="h-4 w-4 mr-2 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">
                        {invoice.material}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <IndianRupee className="h-4 w-4 mr-2 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">
                        {invoice.netAmount.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      {invoice.paymentStatus === PaymentStatus.PAID ? (
                        <>
                          <CheckCircle2 className="h-4 w-4 mr-2 text-green-500" />
                          <span className="text-sm text-green-500">Paid</span>
                        </>
                      ) : (
                        <>
                          <Clock className="h-4 w-4 mr-2 text-yellow-500" />
                          <span className="text-sm text-yellow-500">Pending</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex justify-end p-4 border-t">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setSelectedInvoice(invoice);
                      setIsInvoiceDetailsOpen(true);
                    }}
                  >
                    View Details
                  </Button>
                </div>
              </CustomCard>
            ))}
          </div>
        ) : (
          <CustomCard>
            <div className="p-12 text-center">
              <Receipt className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
              <h3 className="text-lg font-medium mb-2">No Invoices Added Yet</h3>
              <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                Add your first invoice to start tracking payments.
              </p>
              <Button
                onClick={() => setIsInvoiceFormOpen(true)}
                className="mx-auto"
              >
                <Plus className="h-4 w-4 mr-2" />
                Create First Invoice
              </Button>
            </div>
          </CustomCard>
        )}
      </div>

      <InvoiceForm
        isOpen={isInvoiceFormOpen}
        onClose={() => setIsInvoiceFormOpen(false)}
        onSubmit={(invoice) => handleAddInvoice(invoice)}
      />

      {selectedInvoice && (
        <InvoiceDetails
          invoice={selectedInvoice}
          isOpen={isInvoiceDetailsOpen}
          onClose={() => setIsInvoiceDetailsOpen(false)}
        />
      )}
    </div>
  );
};

export default Invoices;
