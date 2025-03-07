
import React from 'react';
import PageTitle from '@/components/common/PageTitle';
import CustomCard from '@/components/ui/CustomCard';
import { Search, Filter, Plus, Download, ChevronLeft, ChevronRight } from 'lucide-react';
import { format } from 'date-fns';
import { HeadOfficeTransaction } from '@/lib/types';

// Mock data for demonstration
const transactions: HeadOfficeTransaction[] = [
  {
    id: '1',
    date: new Date('2023-07-15'),
    supervisorId: '101',
    supervisorName: 'Rajesh Kumar',
    amount: 500000,
    description: 'Monthly allocation for Site A',
    createdAt: new Date('2023-07-15'),
  },
  {
    id: '2',
    date: new Date('2023-06-15'),
    supervisorId: '101',
    supervisorName: 'Rajesh Kumar',
    amount: 450000,
    description: 'Monthly allocation for Site A',
    createdAt: new Date('2023-06-15'),
  },
  {
    id: '3',
    date: new Date('2023-05-15'),
    supervisorId: '101',
    supervisorName: 'Rajesh Kumar',
    amount: 500000,
    description: 'Monthly allocation for Site A',
    createdAt: new Date('2023-05-15'),
  },
  {
    id: '4',
    date: new Date('2023-07-12'),
    supervisorId: '102',
    supervisorName: 'Sunil Verma',
    amount: 350000,
    description: 'Monthly allocation for Site B',
    createdAt: new Date('2023-07-12'),
  },
  {
    id: '5',
    date: new Date('2023-06-12'),
    supervisorId: '102',
    supervisorName: 'Sunil Verma',
    amount: 350000,
    description: 'Monthly allocation for Site B',
    createdAt: new Date('2023-06-12'),
  },
  {
    id: '6',
    date: new Date('2023-07-10'),
    supervisorId: '103',
    supervisorName: 'Amit Singh',
    amount: 350000,
    description: 'Monthly allocation for Site C',
    createdAt: new Date('2023-07-10'),
  },
];

const HeadOffice: React.FC = () => {
  return (
    <div className="space-y-8 animate-fade-in">
      <PageTitle 
        title="Head Office Funds" 
        subtitle="Track funds received from the head office"
      />
      
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="relative max-w-md">
          <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
          <input 
            type="text" 
            placeholder="Search transactions..." 
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
            Add Transaction
          </button>
        </div>
      </div>
      
      <CustomCard>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b text-left">
                <th className="pb-3 pl-4 font-medium text-muted-foreground">Date</th>
                <th className="pb-3 font-medium text-muted-foreground">Supervisor</th>
                <th className="pb-3 font-medium text-muted-foreground">Amount</th>
                <th className="pb-3 font-medium text-muted-foreground">Description</th>
                <th className="pb-3 pr-4 font-medium text-muted-foreground text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((transaction) => (
                <tr key={transaction.id} className="border-b last:border-0 hover:bg-muted/20 transition-colors">
                  <td className="py-4 pl-4 text-sm">{format(transaction.date, 'MMM dd, yyyy')}</td>
                  <td className="py-4 text-sm">{transaction.supervisorName}</td>
                  <td className="py-4 text-sm font-medium">₹{transaction.amount.toLocaleString()}</td>
                  <td className="py-4 text-sm">{transaction.description}</td>
                  <td className="py-4 pr-4 text-right">
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
          <p className="text-sm text-muted-foreground">Showing 1-6 of 6 entries</p>
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

export default HeadOffice;
