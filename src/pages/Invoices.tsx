
import React from 'react';
import PageTitle from '@/components/common/PageTitle';
import CustomCard from '@/components/ui/CustomCard';
import { Search, Filter, Plus, Eye, Download, ChevronLeft, ChevronRight } from 'lucide-react';
import { format } from 'date-fns';
import { Invoice, PaymentStatus } from '@/lib/types';

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
          />
        </div>
        
        <div className="flex flex-wrap gap-2">
          <button className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md bg-white text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 transition-colors">
            <Filter className="h-4 w-4 mr-2 text-muted-foreground" />
            Filter
          </button>
          <button className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md bg-white text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 transition-colors">
            <Download className="h-4 w-4 mr-2 text-muted-foreground" />
            Export
          </button>
          <button className="inline-flex items-center px-3 py-2 rounded-md bg-primary text-primary-foreground text-sm font-medium shadow-sm hover:bg-primary/90 transition-colors">
            <Plus className="h-4 w-4 mr-2" />
            New Invoice
          </button>
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
              {invoices.map((invoice) => (
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
                    <button className="p-1 rounded-md hover:bg-muted transition-colors mr-1">
                      <Eye className="h-4 w-4 text-muted-foreground" />
                    </button>
                    <button className="p-1 rounded-md hover:bg-muted transition-colors">
                      <Download className="h-4 w-4 text-muted-foreground" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        <div className="flex items-center justify-between mt-4 border-t pt-4">
          <p className="text-sm text-muted-foreground">Showing 1-4 of 4 entries</p>
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
    </div>
  );
};

export default Invoices;
