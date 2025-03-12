import React, { useState, useEffect } from 'react';
import PageTitle from '@/components/common/PageTitle';
import CustomCard from '@/components/ui/CustomCard';
import { Search, Plus, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Invoice, InvoiceFormProps, BankDetails, PaymentStatus } from '@/lib/types';
import InvoiceForm from '@/components/invoices/InvoiceForm';
import InvoiceDetails from '@/components/invoices/InvoiceDetails';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
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

const Invoices: React.FC = () => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchInvoices();
  }, []);

  const fetchInvoices = async () => {
    try {
      setIsLoading(true);
      
      const { data, error } = await supabase
        .from('invoices')
        .select('*')
        .order('date', { ascending: false });
      
    if (error) {
      throw error;
    }
    
    if (data) {
      const formattedInvoices: Invoice[] = data.map(invoice => {
        // Parse bank_details if it's a string, or use as is if it's already an object
        let parsedBankDetails: BankDetails;
        
        if (typeof invoice.bank_details === 'string') {
          try {
            parsedBankDetails = JSON.parse(invoice.bank_details);
          } catch (e) {
            // If parsing fails, create a default BankDetails object
            parsedBankDetails = {
              accountNumber: '',
              bankName: '',
              ifscCode: ''
            };
          }
        } else if (invoice.bank_details && typeof invoice.bank_details === 'object') {
          // If it's already an object, cast it
          parsedBankDetails = invoice.bank_details as unknown as BankDetails;
        } else {
          // Default empty object
          parsedBankDetails = {
            accountNumber: '',
            bankName: '',
            ifscCode: ''
          };
        }
        
        return {
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
          bankDetails: parsedBankDetails,
          billUrl: invoice.bill_url,
          invoiceImageUrl: invoice.invoice_image_url,
          paymentStatus: invoice.payment_status as PaymentStatus,
          createdBy: invoice.created_by,
          createdAt: new Date(invoice.created_at),
          approverType: invoice.approver_type,
          siteId: invoice.site_id,
          vendorName: invoice.vendor_name,
          invoiceNumber: invoice.invoice_number,
          amount: invoice.amount,
          status: "pending", // Default value
          siteName: "Site Name", // Default value
          remarks: "" // Default value
        };
      });
      
      setInvoices(formattedInvoices);
    }
  } catch (error: any) {
    console.error('Error fetching invoices:', error);
    toast.error('Failed to load invoices: ' + error.message);
  } finally {
    setIsLoading(false);
  }
};

  const handleAddInvoice = async (newInvoice: Omit<Invoice, 'id' | 'createdAt'>) => {
    setInvoices(prevInvoices => [
      {
        id: Date.now().toString(),
        createdAt: new Date(),
        ...newInvoice,
      },
      ...prevInvoices,
    ]);
    toast.success("Invoice added successfully");
  };

  const handleMakePayment = async (invoice: Invoice) => {
    setSelectedInvoice(invoice);
  };

  const filteredInvoices = invoices.filter(invoice => {
    const matchesSearch =
      invoice.partyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      invoice.material.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  return (
    <div className="space-y-6 animate-fade-in">
      <PageTitle title="Invoices" subtitle="Manage and track all your invoices" />

      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="relative max-w-md w-full">
          <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search invoices..."
            className="py-2 pl-10 pr-4 border rounded-md w-full focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Button onClick={() => setIsFormOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          <FileText className="h-4 w-4 mr-2" />
          New Invoice
        </Button>
      </div>

      {isLoading ? (
        <CustomCard>
          <div className="p-6">
            <p>Loading invoices...</p>
          </div>
        </CustomCard>
      ) : filteredInvoices.length > 0 ? (
        <div className="overflow-x-auto">
          <Table>
            <TableCaption>A list of your recent invoices.</TableCaption>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[100px]">Invoice Date</TableHead>
                <TableHead>Vendor</TableHead>
                <TableHead>Material</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredInvoices.map((invoice) => (
                <TableRow key={invoice.id} onClick={() => setSelectedInvoice(invoice)} className="cursor-pointer hover:bg-accent">
                  <TableCell className="font-medium">{invoice.date.toLocaleDateString()}</TableCell>
                  <TableCell>{invoice.partyName}</TableCell>
                  <TableCell>{invoice.material}</TableCell>
                  <TableCell>₹{invoice.netAmount.toLocaleString()}</TableCell>
                  <TableCell>{invoice.paymentStatus}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : (
        <CustomCard>
          <div className="p-6">
            <p>No invoices found.</p>
          </div>
        </CustomCard>
      )}

      <InvoiceForm
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSubmit={handleAddInvoice}
      />

      <InvoiceDetails
        invoice={selectedInvoice as Invoice}
        isOpen={!!selectedInvoice}
        onClose={() => setSelectedInvoice(null)}
        onMakePayment={handleMakePayment}
      />
    </div>
  );
};

export default Invoices;
