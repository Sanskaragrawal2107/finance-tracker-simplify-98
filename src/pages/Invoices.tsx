import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import {
  Eye,
  Download,
  FileText,
  Plus,
} from 'lucide-react';
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
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

import { Invoice } from '@/lib/types';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/use-auth';
import InvoiceDetails from '@/components/invoices/InvoiceDetails';
import { MaterialItem, BankDetails } from '@/lib/types';

const InvoicesPage: React.FC = () => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const { user } = useAuth();

  // Add these functions for handling viewing and downloading invoices
  const handleViewInvoiceDetail = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
  };

  const handleDownloadInvoiceDoc = (invoice: Invoice) => {
    if (invoice.billUrl) {
      window.open(invoice.billUrl, '_blank');
    } else {
      toast.error('No invoice document available for download');
    }
  };

  // Update the renderTableRow function to use these handlers
  const renderTableRow = (invoice: Invoice) => (
    <tr key={invoice.id} className={invoice.paymentStatus === 'paid' ? 'bg-green-50' : ''}>
      <td className="border-b px-4 py-3 text-sm">{format(new Date(invoice.date), 'MMM dd, yyyy')}</td>
      <td className="border-b px-4 py-3 text-sm">{invoice.partyName}</td>
      <td className="border-b px-4 py-3 text-sm">{invoice.partyId}</td>
      <td className="border-b px-4 py-3 text-sm text-right">₹{invoice.netAmount.toLocaleString()}</td>
      <td className="border-b px-4 py-3 text-sm text-center">
        <Badge variant="outline" className={invoice.paymentStatus === 'paid' ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'}>
          {invoice.paymentStatus === 'paid' ? 'Paid' : 'Pending'}
        </Badge>
      </td>
      <td className="border-b px-4 py-3 text-sm">
        <div className="flex justify-center space-x-2">
          <Button size="sm" variant="outline" onClick={() => handleViewInvoiceDetail(invoice)}>
            <Eye className="h-4 w-4 mr-1" />
            View
          </Button>
          {invoice.billUrl && (
            <Button size="sm" variant="outline" onClick={() => handleDownloadInvoiceDoc(invoice)}>
              <Download className="h-4 w-4 mr-1" />
              Download
            </Button>
          )}
        </div>
      </td>
    </tr>
  );

  const renderMobileRows = (invoices: Invoice[]) => (
    <div className="space-y-4">
      {invoices.map(invoice => renderMobileRow(invoice))}
    </div>
  );

  // Also ensure the mobile row handlers are fixed
  const renderMobileRow = (invoice: Invoice) => (
    <div className="p-3 space-y-1.5">
      <div className="flex justify-between items-center">
        <span className="font-medium text-sm">Date:</span>
        <span className="text-sm">{format(new Date(invoice.date), 'MMM dd, yyyy')}</span>
      </div>
      <div className="flex justify-between items-center">
        <span className="font-medium text-sm">Vendor:</span>
        <span className="text-sm">{invoice.partyName}</span>
      </div>
      <div className="flex justify-between items-center">
        <span className="font-medium text-sm">Invoice No:</span>
        <span className="text-sm">{invoice.partyId}</span>
      </div>
      <div className="flex justify-between items-center">
        <span className="font-medium text-sm">Amount:</span>
        <span className="text-sm">₹{invoice.netAmount.toLocaleString()}</span>
      </div>
      <div className="flex justify-between items-center">
        <span className="font-medium text-sm">Status:</span>
        <Badge variant="outline" className={invoice.paymentStatus === 'paid' ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'}>
          {invoice.paymentStatus === 'paid' ? 'Paid' : 'Pending'}
        </Badge>
      </div>
      <div className="flex items-center justify-between mt-2">
        <Button size="sm" variant="outline" onClick={() => handleViewInvoiceDetail(invoice)}>
          <Eye className="h-3 w-3 mr-1" />
          View
        </Button>
        {invoice.billUrl && (
          <Button size="sm" variant="outline" onClick={() => handleDownloadInvoiceDoc(invoice)}>
            <Download className="h-3 w-3 mr-1" />
            Download
          </Button>
        )}
      </div>
    </div>
  );

  // Update the fetchInvoices function to properly parse JSON fields
  const fetchInvoices = async () => {
    try {
      setIsLoading(true);

      const { data, error } = await supabase
        .from('site_invoices')
        .select('*')
        .order('date', { ascending: false });

      if (error) throw error;

      if (data) {
        const mappedInvoices: Invoice[] = data.map(invoice => {
          let parsedMaterialItems: MaterialItem[] = [];
          try {
            parsedMaterialItems = JSON.parse(invoice.material_items as string) as MaterialItem[];
          } catch (e) {
            console.error('Error parsing material items:', e);
            parsedMaterialItems = [];
          }

          let parsedBankDetails: BankDetails = {
            accountNumber: '',
            bankName: '',
            ifscCode: ''
          };
          try {
            parsedBankDetails = JSON.parse(invoice.bank_details as string) as BankDetails;
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
            paymentStatus: invoice.payment_status as any,
            createdBy: invoice.created_by || '',
            createdAt: new Date(invoice.created_at),
            approverType: invoice.approver_type as "ho" | "supervisor" || "ho",
            siteId: invoice.site_id || ''
          };
        });

        setInvoices(mappedInvoices);
      }
    } catch (error) {
      console.error('Error fetching invoices:', error);
      toast.error('Failed to load invoices');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, []);

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-4">Invoices</h1>

      {isLoading ? (
        <p>Loading invoices...</p>
      ) : (
        <>
          {invoices.length > 0 ? (
            <div className="hidden md:block">
              <Table>
                <TableCaption>A list of your recent invoices.</TableCaption>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[100px]">Date</TableHead>
                    <TableHead>Vendor</TableHead>
                    <TableHead>Invoice No.</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead className="text-center">Status</TableHead>
                    <TableHead className="text-center">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invoices.map(invoice => renderTableRow(invoice))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <p>No invoices found.</p>
          )}

          <div className="md:hidden">
            {renderMobileRows(invoices)}
          </div>
        </>
      )}

      {selectedInvoice && <InvoiceDetails invoice={selectedInvoice} isOpen={!!selectedInvoice} onClose={() => setSelectedInvoice(null)} />}
    </div>
  );
};

export default InvoicesPage;
