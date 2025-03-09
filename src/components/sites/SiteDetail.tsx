
import React, { useState } from 'react';
import { format } from 'date-fns';
import { ArrowLeft, Building2, Calendar, Check, Edit, ExternalLink } from 'lucide-react';
import { Expense, Site, Advance, FundsReceived, Invoice } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import CustomCard from '@/components/ui/CustomCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import SiteDetailTransactions from './SiteDetailTransactions';
import { useIsMobile } from '@/hooks/use-mobile';

interface SiteDetailProps {
  site: Site;
  expenses: Expense[];
  advances: Advance[];
  fundsReceived: FundsReceived[];
  invoices: Invoice[];
  onBack: () => void;
  onAddExpense: (expense: Partial<Expense>) => void;
  onAddAdvance: (advance: Partial<Advance>) => void;
  onAddFunds: (fund: Partial<FundsReceived>) => void;
  onAddInvoice: (invoice: Omit<Invoice, 'id' | 'createdAt'>) => void;
  onCompleteSite: (siteId: string, completionDate: Date) => void;
}

const SiteDetail: React.FC<SiteDetailProps> = ({
  site,
  expenses,
  advances,
  fundsReceived,
  invoices,
  onBack,
  onAddExpense,
  onAddAdvance,
  onAddFunds,
  onAddInvoice,
  onCompleteSite
}) => {
  const [activeTab, setActiveTab] = useState('summary');
  const [isMarkingComplete, setIsMarkingComplete] = useState(false);
  const isMobile = useIsMobile();

  // Calculate site financial summary
  const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0);
  const totalAdvances = advances.reduce((sum, advance) => sum + advance.amount, 0);
  const totalFundsReceived = fundsReceived.reduce((sum, fund) => sum + fund.amount, 0);
  const totalInvoices = invoices.reduce((sum, invoice) => sum + invoice.netAmount, 0);
  const siteBalance = totalFundsReceived - totalExpenses - totalAdvances - totalInvoices;
  
  const handleMarkComplete = () => {
    onCompleteSite(site.id, new Date());
    setIsMarkingComplete(false);
  };
  
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={onBack} className="h-8 w-8">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <span className="text-sm font-medium text-muted-foreground">Site Name</span>
            <h1 className="text-xl md:text-2xl font-bold">{site.name}</h1>
          </div>
          {site.isCompleted ? (
            <Badge variant="outline" className="bg-green-100 text-green-800 hover:bg-green-100">
              Completed
            </Badge>
          ) : (
            <Badge variant="outline" className="bg-blue-100 text-blue-800 hover:bg-blue-100">
              Active
            </Badge>
          )}
        </div>
        
        {!site.isCompleted && (
          <Button 
            variant="outline" 
            size="sm" 
            className="text-green-600 border-green-200 hover:bg-green-50 w-full sm:w-auto mt-2 sm:mt-0" 
            onClick={() => setIsMarkingComplete(true)}
          >
            <Check className="mr-2 h-4 w-4" />
            Mark as Complete
          </Button>
        )}

        {isMarkingComplete && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <Card className="w-full max-w-md">
              <CardHeader>
                <CardTitle>Mark Site as Complete?</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p>Are you sure you want to mark this site as complete? This action cannot be undone.</p>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setIsMarkingComplete(false)}>Cancel</Button>
                  <Button onClick={handleMarkComplete}>Confirm</Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <CustomCard className="md:col-span-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <h3 className="text-sm font-medium text-muted-foreground">Job Name</h3>
              <p className="text-lg font-semibold mt-1">{site.jobName}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-muted-foreground">PO Number</h3>
              <p className="text-lg font-semibold mt-1">{site.posNo}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-muted-foreground">Start Date</h3>
              <p className="text-lg font-semibold mt-1">{format(site.startDate, 'dd/MM/yyyy')}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-muted-foreground">
                {site.isCompleted ? 'Completion Date' : 'Est. Completion'}
              </h3>
              <p className="text-lg font-semibold mt-1">
                {site.completionDate ? format(site.completionDate, 'dd/MM/yyyy') : 'Not specified'}
              </p>
            </div>
          </div>
        </CustomCard>

        <CustomCard className="bg-primary text-primary-foreground">
          <h3 className="text-lg font-semibold mb-4">Site Financial Summary</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <p className="text-sm opacity-80">Funds Received from HO:</p>
              <p className="text-lg font-semibold">₹{totalFundsReceived.toLocaleString()}</p>
            </div>
            
            <div className="flex justify-between items-center">
              <p className="text-sm opacity-80">Total Expenses paid by supervisor:</p>
              <p className="text-lg font-semibold">₹{totalExpenses.toLocaleString()}</p>
            </div>
            
            <div className="flex justify-between items-center">
              <p className="text-sm opacity-80">Total Advances paid by supervisor:</p>
              <p className="text-lg font-semibold">₹{totalAdvances.toLocaleString()}</p>
            </div>
            
            <div className="flex justify-between items-center">
              <p className="text-sm opacity-80">Debits to worker:</p>
              <p className="text-lg font-semibold">₹0</p>
            </div>
            
            <div className="flex justify-between items-center">
              <p className="text-sm opacity-80">Invoices paid by supervisor:</p>
              <p className="text-lg font-semibold">₹{totalInvoices.toLocaleString()}</p>
            </div>
            
            <div className="pt-3 border-t border-white/20">
              <div className="flex justify-between items-center">
                <p className="text-sm opacity-80">Current Balance:</p>
                <p className={`text-xl font-bold ${siteBalance >= 0 ? '' : 'text-red-300'}`}>
                  ₹{siteBalance.toLocaleString()}
                </p>
              </div>
            </div>
          </div>
        </CustomCard>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className={`grid grid-cols-2 ${isMobile ? 'w-full' : 'max-w-md'} mb-4`}>
          <TabsTrigger value="summary">Summary</TabsTrigger>
          <TabsTrigger value="transactions">Transactions</TabsTrigger>
        </TabsList>
        
        <TabsContent value="summary" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <CustomCard>
              <h3 className="text-lg font-medium mb-4">Quick Overview</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Total Expenses</span>
                  <span className="font-medium">₹{totalExpenses.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Total Advances</span>
                  <span className="font-medium">₹{totalAdvances.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Total Invoices</span>
                  <span className="font-medium">₹{totalInvoices.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Total Funds Received</span>
                  <span className="font-medium">₹{totalFundsReceived.toLocaleString()}</span>
                </div>
                <div className="pt-2 border-t">
                  <div className="flex justify-between items-center font-medium">
                    <span>Current Balance</span>
                    <span className={siteBalance >= 0 ? 'text-green-600' : 'text-red-600'}>
                      ₹{siteBalance.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            </CustomCard>
            
            <CustomCard>
              <h3 className="text-lg font-medium mb-4">Activity Summary</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Expense Entries</span>
                  <span className="font-medium">{expenses.length}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Advance Entries</span>
                  <span className="font-medium">{advances.length}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Invoice Entries</span>
                  <span className="font-medium">{invoices.length}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Funds Received Entries</span>
                  <span className="font-medium">{fundsReceived.length}</span>
                </div>
                <div className="pt-2 border-t">
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Site Status</span>
                    <Badge variant="outline" className={site.isCompleted ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'}>
                      {site.isCompleted ? 'Completed' : 'Active'}
                    </Badge>
                  </div>
                </div>
              </div>
            </CustomCard>
          </div>
        </TabsContent>
        
        <TabsContent value="transactions">
          <SiteDetailTransactions 
            siteId={site.id} 
            expenses={expenses} 
            advances={advances} 
            fundsReceived={fundsReceived} 
            invoices={invoices} 
            onAddExpense={onAddExpense} 
            onAddAdvance={onAddAdvance} 
            onAddFunds={onAddFunds} 
            onAddInvoice={onAddInvoice} 
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SiteDetail;
