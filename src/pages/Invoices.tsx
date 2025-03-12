import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { toast } from 'sonner';
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { MoreHorizontal, Copy, Edit, Trash, FileText, CheckCircle, Circle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { CalendarIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { Expense, ExpenseCategory, ApprovalStatus, Site, Advance, FundsReceived, Invoice, UserRole, AdvancePurpose, PaymentStatus } from '@/lib/types';
import PageTitle from '@/components/common/PageTitle';
import CustomCard from '@/components/ui/CustomCard';
import { Search, Filter, Plus, Building, User, Users, CheckSquare, CircleSlash } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { supabase } from '@/integrations/supabase/client';
import InvoiceForm from '@/components/invoices/InvoiceForm';
import InvoiceDetails from '@/components/invoices/InvoiceDetails';

const Invoices: React.FC = () => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [isInvoiceFormOpen, setIsInvoiceFormOpen] = useState(false);
  const [isInvoiceDetailsOpen, setIsInvoiceDetailsOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchInvoices();
  }, []);

  const fetchInvoices = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('invoices')
        .select('*');

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
          bankDetails: invoice.bank_details,
          billUrl: invoice.bill_url,
          invoiceImageUrl: invoice.invoice_image_url,
          paymentStatus: invoice.payment_status as PaymentStatus,
          createdBy: invoice.created_by,
          createdAt: new Date(invoice.created_at),
          approverType: invoice.approver_type as any,
          siteId: invoice.site_id,
          vendorName: invoice.vendor_name,
          invoiceNumber: invoice.invoice_number,
          amount: invoice.amount
        }));
        setInvoices(formattedInvoices);
      }
    } catch (error: any) {
      console.error('Error fetching invoices:', error);
      toast.error('Failed to load invoices: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAddInvoice = async (newInvoice: Omit<Invoice, 'id' | 'createdAt'>) => {
    console.log("Adding new invoice with data:", newInvoice);

    try {
      await fetchInvoices();
      toast.success("Invoice added successfully");
    } catch (error: any) {
      console.error('Error adding invoice:', error);
      toast.error('Failed to add invoice: ' + error.message);
    }
  };

  const handleMakePayment = async (invoice: Invoice) => {
    try {
      const { error } = await supabase
        .from('invoices')
        .update({ payment_status: PaymentStatus.PAID })
        .eq('id', invoice.id);

      if (error) {
        throw error;
      }

      setInvoices(prevInvoices =>
        prevInvoices.map(inv =>
          inv.id === invoice.id ? { ...inv, paymentStatus: PaymentStatus.PAID } : inv
        )
      );
      setSelectedInvoice(null);
      setIsInvoiceDetailsOpen(false);
      toast.success("Invoice marked as paid");
    } catch (error: any) {
      console.error('Error marking invoice as paid:', error);
      toast.error('Failed to mark invoice as paid: ' + error.message);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <PageTitle
        title="Invoices"
        subtitle="Manage invoices and track payments"
        className="mb-4"
      />

      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
        <div className="flex flex-col md:flex-row md:items-center gap-4 w-full md:w-auto">
          <div className="relative max-w-md w-full">
            <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search invoices..."
              className="py-2 pl-10 pr-4 border rounded-md w-full focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
            />
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
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

      <InvoiceForm
        isOpen={isInvoiceFormOpen}
        onClose={() => setIsInvoiceFormOpen(false)}
        onSubmit={handleAddInvoice}
      />

      <div className="overflow-x-auto">
        {invoices.length > 0 ? (
          <Table>
            <TableCaption>A list of your recent invoices.</TableCaption>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[100px]">Invoice No.</TableHead>
                <TableHead>Vendor</TableHead>
                <TableHead>Material</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invoices.map((invoice) => (
                <TableRow key={invoice.id}>
                  <TableCell className="font-medium">{invoice.partyId}</TableCell>
                  <TableCell>{invoice.partyName}</TableCell>
                  <TableCell>{invoice.material}</TableCell>
                  <TableCell>₹{invoice.netAmount.toLocaleString()}</TableCell>
                  <TableCell>
                    <div className="flex items-center">
                      {invoice.paymentStatus === PaymentStatus.PAID ? (
                        <CheckCircle className="h-4 w-4 mr-2 text-green-500" />
                      ) : (
                        <Circle className="h-4 w-4 mr-2 text-yellow-500" />
                      )}
                      {invoice.paymentStatus}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <span className="sr-only">Open menu</span>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuItem
                          onClick={() => {
                            setSelectedInvoice(invoice);
                            setIsInvoiceDetailsOpen(true);
                          }}
                        >
                          <FileText className="h-4 w-4 mr-2" />
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem>
                          <Copy className="h-4 w-4 mr-2" />
                          Copy Invoice
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Edit className="h-4 w-4 mr-2" />
                          Edit Invoice
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-red-600">
                          <Trash className="h-4 w-4 mr-2" />
                          Delete Invoice
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <CustomCard>
            <div className="p-12 text-center">
              <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
              <h3 className="text-lg font-medium mb-2">No Invoices Added Yet</h3>
              <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                Create your first invoice to start tracking payments.
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

      {selectedInvoice && (
        <InvoiceDetails
          invoice={selectedInvoice}
          isOpen={isInvoiceDetailsOpen}
          onClose={() => setIsInvoiceDetailsOpen(false)}
          onMakePayment={handleMakePayment}
        />
      )}
    </div>
  );
};

export default Invoices;
