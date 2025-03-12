import React, { useState, useEffect } from 'react';
import { Plus, FileText, Search, Calendar, User, Package, CreditCard, Download } from 'lucide-react';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Invoice, PaymentStatus } from '@/lib/types';
import PageTitle from '@/components/common/PageTitle';
import InvoiceForm from '@/components/invoices/InvoiceForm';
import InvoiceDetails from '@/components/invoices/InvoiceDetails';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface DataTableSearchProps {
  value: string;
  onChange: (value: string) => void;
}

const DataTableSearch: React.FC<DataTableSearchProps> = ({ value, onChange }) => {
  return (
    <div className="relative w-full max-w-md">
      <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500 dark:text-gray-400" />
      <Input
        type="text"
        placeholder="Search invoices..."
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="pl-8"
      />
    </div>
  );
};

interface DataTableViewOptionsProps {
  paymentStatus: PaymentStatus | null;
  setPaymentStatus: (paymentStatus: PaymentStatus | null) => void;
}

const DataTableViewOptions: React.FC<DataTableViewOptionsProps> = ({ paymentStatus, setPaymentStatus }) => {
  const statuses = [
    {
      label: "All",
      value: undefined,
    },
    {
      label: "Pending",
      value: "pending",
    },
    {
      label: "Paid",
      value: "paid",
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
      <div className="col-span-1">
        <select
          className="flex h-10 w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          value={paymentStatus || ''}
          onChange={(e) => setPaymentStatus(e.target.value as PaymentStatus || null)}
        >
          {statuses.map((status) => (
            <option key={status.value} value={status.value || ''}>
              {status.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
};

const Invoices = () => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus | null>(null);
  const [isInvoiceFormOpen, setIsInvoiceFormOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchInvoices();
  }, [paymentStatus]);

  const fetchInvoices = async () => {
    try {
      let query = supabase.from('invoices').select('*');
      
      if (paymentStatus) {
        query = query.eq('payment_status', paymentStatus);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching invoices:', error);
        toast({
          title: "Error",
          description: "Failed to fetch invoices. Please try again.",
          variant: "destructive",
        });
        return;
      }

      setInvoices(data);
    } catch (error) {
      console.error('Error fetching invoices:', error);
      toast({
        title: "Error",
        description: "Failed to fetch invoices. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleAddInvoice = async (newInvoice: Omit<Invoice, 'id' | 'createdAt'>) => {
    try {
      const { data, error } = await supabase
        .from('invoices')
        .insert([newInvoice])
        .select('*')
        .single();

      if (error) {
        console.error('Error adding invoice:', error);
        toast({
          title: "Error",
          description: "Failed to add invoice. Please try again.",
          variant: "destructive",
        });
        return;
      }

      setInvoices([...invoices, data]);
      setIsInvoiceFormOpen(false);
      toast({
        title: "Success",
        description: "Invoice added successfully.",
      });
    } catch (error) {
      console.error('Error adding invoice:', error);
      toast({
        title: "Error",
        description: "Failed to add invoice. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleUpdateStatus = async (id: string, status: PaymentStatus) => {
    try {
      const { error } = await supabase
        .from('invoices')
        .update({ payment_status: status })
        .eq('id', id);

      if (error) {
        console.error('Error updating invoice status:', error);
        toast({
          title: "Error",
          description: "Failed to update invoice status. Please try again.",
          variant: "destructive",
        });
        return;
      }

      setInvoices(
        invoices.map((invoice) =>
          invoice.id === id ? { ...invoice, paymentStatus: status } : invoice
        )
      );
      setSelectedInvoice(null);
      toast({
        title: "Success",
        description: "Invoice status updated successfully.",
      });
    } catch (error) {
      console.error('Error updating invoice status:', error);
      toast({
        title: "Error",
        description: "Failed to update invoice status. Please try again.",
        variant: "destructive",
      });
    }
  };

  const filteredInvoices = invoices.filter((invoice) => {
    const searchRegex = new RegExp(searchQuery, 'i');
    return (
      searchRegex.test(invoice.partyName) ||
      searchRegex.test(invoice.partyId)
    );
  });

  return (
    <div className="container mx-auto py-8 px-4">
      <PageTitle title="Invoices" />

      <div className="mb-4 flex justify-between items-center">
        <DataTableSearch value={searchQuery} onChange={setSearchQuery} />
        <Button onClick={() => setIsInvoiceFormOpen(true)} className="flex items-center">
          <Plus className="mr-2 h-4 w-4" />
          Add Invoice
        </Button>
      </div>

      <div className="mb-4">
        <DataTableViewOptions paymentStatus={paymentStatus} setPaymentStatus={setPaymentStatus} />
      </div>

      <div className="rounded-md border">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Date
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Party Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Party ID
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Net Amount
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Payment Status
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredInvoices.map((invoice) => (
              <tr key={invoice.id}>
                <td className="px-6 py-4 whitespace-nowrap">
                  {format(new Date(invoice.date), 'PPP')}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">{invoice.partyName}</td>
                <td className="px-6 py-4 whitespace-nowrap">{invoice.partyId}</td>
                <td className="px-6 py-4 whitespace-nowrap">₹{invoice.netAmount.toLocaleString()}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {invoice.paymentStatus === PaymentStatus.PAID ? 'Paid' : 'Pending'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right">
                  <Button variant="outline" size="sm" onClick={() => setSelectedInvoice(invoice)}>
                    View Details
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <InvoiceForm isOpen={isInvoiceFormOpen} onClose={() => setIsInvoiceFormOpen(false)} onSubmit={handleAddInvoice} />
      
      {/* View Invoice Details Modal */}
      {selectedInvoice && (
        <InvoiceDetails
          invoice={selectedInvoice}
          isOpen={!!selectedInvoice}
          onClose={() => setSelectedInvoice(null)}
          onUpdateStatus={handleUpdateStatus}
        />
      )}
    </div>
  );
};

export default Invoices;
