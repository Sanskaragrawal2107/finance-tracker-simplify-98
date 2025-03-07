import React, { useState } from 'react';
import PageTitle from '@/components/common/PageTitle';
import CustomCard from '@/components/ui/CustomCard';
import { Search, Filter, Plus, Eye, Download, ChevronLeft, ChevronRight, FileEdit, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { Invoice, PaymentStatus } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import InvoiceForm from '@/components/invoices/InvoiceForm';
import InvoiceDetails from '@/components/invoices/InvoiceDetails';
import { useToast } from '@/hooks/use-toast';

// Mock data for demonstration
const invoices: Invoice[] = [
  {
    id: '1',
    date: new Date('2023-07-05'),
    partyId: '101',
    partyName: 'Steel Suppliers Ltd',
    material: 'TMT Steel Bars',
    quantity: 5,
    rate: 50000,
    gstPercentage: 18,
    grossAmount: 250000,
    netAmount: 295000,
    bankDetails: {
      accountNumber: '12345678901',
      bankName: 'State Bank of India',
      ifscCode: 'SBIN0001234',
      email: 'accounts@steelsuppliers.com',
      mobile: '9876543210',
    },
    billUrl: '#',
    paymentStatus: PaymentStatus.PAID,
    createdBy: 'Admin',
    createdAt: new Date('2023-07-05'),
  },
  {
    id: '2',
    date: new Date('2023-07-04'),
    partyId: '102',
    partyName: 'Cement Corporation',
    material: 'Portland Cement',
    quantity: 100,
    rate: 350,
    gstPercentage: 18,
    grossAmount: 35000,
    netAmount: 41300,
    bankDetails: {
      accountNumber: '98765432101',
      bankName: 'HDFC Bank',
      ifscCode: 'HDFC0001234',
      email: 'accounts@cementcorp.com',
      mobile: '8765432109',
    },
    billUrl: '#',
    paymentStatus: PaymentStatus.PAID,
    createdBy: 'Supervisor',
    createdAt: new Date('2023-07-04'),
  },
  {
    id: '3',
    date: new Date('2023-07-03'),
    partyId: '103',
    partyName: 'Brick Manufacturers',
    material: 'Red Bricks',
    quantity: 10000,
    rate: 8,
    gstPercentage: 12,
    grossAmount: 80000,
    netAmount: 89600,
    bankDetails: {
      accountNumber: '45678901234',
      bankName: 'ICICI Bank',
      ifscCode: 'ICIC0001234',
      email: 'accounts@brickmanufacturers.com',
      mobile: '7654321098',
    },
    billUrl: '#',
    paymentStatus: PaymentStatus.PENDING,
    createdBy: 'Supervisor',
    createdAt: new Date('2023-07-03'),
  },
  {
    id: '4',
    date: new Date('2023-07-02'),
    partyId: '104',
    partyName: 'Electrical Solutions',
    material: 'Wiring & Fixtures',
    quantity: 1,
    rate: 125000,
    gstPercentage: 18,
    grossAmount: 125000,
    netAmount: 147500,
    bankDetails: {
      accountNumber: '56789012345',
      bankName: 'Axis Bank',
      ifscCode: 'UTIB0001234',
      email: 'accounts@electricalsolutions.com',
      mobile: '6543210987',
    },
    billUrl: '#',
    paymentStatus: PaymentStatus.PENDING,
    createdBy: 'Admin',
    createdAt: new Date('2023-07-02'),
  },
];

const getStatusColor = (status: PaymentStatus) => {
  switch (status) {
    case PaymentStatus.PAID:
      return 'bg-green-100 text-green-800';
    case PaymentStatus.PENDING:
      return 'bg-yellow-100 text-yellow-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

const Invoices: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const { toast } = useToast();

  const filteredInvoices = invoices.filter(invoice => 
    invoice.partyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    invoice.material.toLowerCase().includes(searchTerm.toLowerCase()) ||
    invoice.id.includes(searchTerm)
  );

  const handleCreateInvoice = (invoice: Omit<Invoice, 'id' | 'createdAt'>) => {
    // In a real app, this would make an API call to create the invoice
    toast({
      title: "Invoice Created",
      description: `Invoice for ${invoice.partyName} has been created successfully.`,
    });
    setIsCreateDialogOpen(false);
  };

  const handleViewInvoice = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setIsViewDialogOpen(true);
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <PageTitle 
        title="Invoices" 
        subtitle="Manage invoices from vendors and suppliers"
      />
      
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="relative max-w-md">
          <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
          <input 
            type="text" 
            placeholder="Search invoices..." 
            className="py-2 pl-10 pr-4 border rounded-md w-full md:w-80 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" className="gap-1.5">
            <Filter className="h-4 w-4" />
            Filter
          </Button>
          <Button variant="outline" size="sm" className="gap-1.5">
            <Download className="h-4 w-4" />
            Export
          </Button>
          <Button size="sm" className="gap-1.5" onClick={() => setIsCreateDialogOpen(true)}>
            <Plus className="h-4 w-4" />
            New Invoice
          </Button>
        </div>
      </div>
      
      <CustomCard>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b text-left">
                <th className="pb-3 pl-4 font-medium text-muted-foreground">Date</th>
                <th className="pb-3 font-medium text-muted-foreground">Party Name</th>
                <th className="pb-3 font-medium text-muted-foreground">Material</th>
                <th className="pb-3 font-medium text-muted-foreground">Gross Amount</th>
                <th className="pb-3 font-medium text-muted-foreground">GST</th>
                <th className="pb-3 font-medium text-muted-foreground">Net Amount</th>
                <th className="pb-3 font-medium text-muted-foreground">Status</th>
                <th className="pb-3 pr-4 font-medium text-muted-foreground text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredInvoices.map((invoice) => (
                <tr key={invoice.id} className="border-b last:border-0 hover:bg-muted/20 transition-colors">
                  <td className="py-4 pl-4 text-sm">{format(invoice.date, 'MMM dd, yyyy')}</td>
                  <td className="py-4 text-sm">{invoice.partyName}</td>
                  <td className="py-4 text-sm">{invoice.material}</td>
                  <td className="py-4 text-sm">₹{invoice.grossAmount.toLocaleString()}</td>
                  <td className="py-4 text-sm">{invoice.gstPercentage}%</td>
                  <td className="py-4 text-sm font-medium">₹{invoice.netAmount.toLocaleString()}</td>
                  <td className="py-4 text-sm">
                    <span className={`${getStatusColor(invoice.paymentStatus)} px-2 py-1 rounded-full text-xs font-medium`}>
                      {invoice.paymentStatus}
                    </span>
                  </td>
                  <td className="py-4 pr-4 text-right">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleViewInvoice(invoice)}>
                      <Eye className="h-4 w-4 text-muted-foreground" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <FileEdit className="h-4 w-4 text-muted-foreground" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <Download className="h-4 w-4 text-muted-foreground" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        <div className="flex items-center justify-between mt-4 border-t pt-4">
          <p className="text-sm text-muted-foreground">Showing 1-{filteredInvoices.length} of {filteredInvoices.length} entries</p>
          <div className="flex items-center space-x-2">
            <button className="p-1 rounded-md hover:bg-muted transition-colors" disabled>
              <ChevronLeft className="h-5 w-5 text-muted-foreground" />
            </button>
            <button className="px-3 py-1 rounded-md bg-primary text-primary-foreground text-sm">1</button>
            <button className="p-1 rounded-md hover:bg-muted transition-colors" disabled>
              <ChevronRight className="h-5 w-5 text-muted-foreground" />
            </button>
          </div>
        </div>
      </CustomCard>

      {/* Create Invoice Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogTitle>Create New Invoice</DialogTitle>
          <InvoiceForm onSubmit={handleCreateInvoice} />
        </DialogContent>
      </Dialog>

      {/* View Invoice Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogTitle>Invoice Details</DialogTitle>
          {selectedInvoice && <InvoiceDetails invoice={selectedInvoice} />}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Invoices;
