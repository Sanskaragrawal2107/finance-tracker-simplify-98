import React, { useState } from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Plus, Clock, FileText, ArrowUpDown, Truck } from 'lucide-react';
import { format } from 'date-fns';
import { Expense, Advance, FundsReceived, Invoice, ApprovalStatus } from '@/lib/types';
import CustomCard from '@/components/ui/CustomCard';
import ExpenseForm from '@/components/expenses/ExpenseForm';
import AdvanceForm from '@/components/advances/AdvanceForm';
import FundsReceivedForm from '@/components/funds/FundsReceivedForm';
import InvoiceForm from '@/components/invoices/InvoiceForm';
import InvoiceDetails from '@/components/invoices/InvoiceDetails';

interface SiteDetailTransactionsProps {
  siteId: string;
  expenses: Expense[];
  advances: Advance[];
  fundsReceived: FundsReceived[];
  invoices: Invoice[];
  onAddExpense: (expense: Partial<Expense>) => void;
  onAddAdvance: (advance: Partial<Advance>) => void;
  onAddFunds: (funds: Partial<FundsReceived>) => void;
  onAddInvoice: (invoice: Omit<Invoice, 'id' | 'createdAt'>) => void;
}

const SiteDetailTransactions: React.FC<SiteDetailTransactionsProps> = ({
  siteId,
  expenses,
  advances,
  fundsReceived,
  invoices,
  onAddExpense,
  onAddAdvance,
  onAddFunds,
  onAddInvoice
}) => {
  const [isExpenseFormOpen, setIsExpenseFormOpen] = useState(false);
  const [isAdvanceFormOpen, setIsAdvanceFormOpen] = useState(false);
  const [isFundsFormOpen, setIsFundsFormOpen] = useState(false);
  const [isInvoiceFormOpen, setIsInvoiceFormOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [activeTab, setActiveTab] = useState("expenses");

  const paidExpenses = expenses.filter(expense => expense.status === ApprovalStatus.APPROVED);
  const paidAdvances = advances.filter(advance => advance.status === ApprovalStatus.APPROVED);

  return (
    <div className="grid grid-cols-1 gap-6">
      <CustomCard>
        <h2 className="text-xl font-semibold mb-4 flex items-center">
          <Clock className="mr-2 h-5 w-5 text-muted-foreground" />
          Transaction History
        </h2>
        
        <Tabs defaultValue="expenses" className="w-full">
          <TabsList className="w-full mb-4">
            <TabsTrigger value="expenses" className="flex-1">EXPENSES PAID</TabsTrigger>
            <TabsTrigger value="advances" className="flex-1">ADVANCES PAID</TabsTrigger>
            <TabsTrigger value="invoices" className="flex-1">INVOICES</TabsTrigger>
            <TabsTrigger value="funds" className="flex-1">FUNDS FROM H.O.</TabsTrigger>
          </TabsList>
          
          <TabsContent value="expenses" className="space-y-4">
            {paidExpenses.length > 0 ? (
              <div className="rounded-md border overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-muted">
                    <tr>
                      <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Date</th>
                      <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Purpose</th>
                      <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Category</th>
                      <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">Amount</th>
                      <th scope="col" className="px-4 py-3 text-center text-xs font-medium text-muted-foreground uppercase tracking-wider">Status</th>
                    </tr>
                  </thead>
                  <tbody className="bg-card divide-y divide-gray-200">
                    {paidExpenses.map((expense) => (
                      <tr key={expense.id}>
                        <td className="px-4 py-3 whitespace-nowrap text-sm">{format(new Date(expense.date), 'MMM dd, yyyy')}</td>
                        <td className="px-4 py-3 text-sm uppercase">{expense.description}</td>
                        <td className="px-4 py-3 text-sm uppercase">{expense.category}</td>
                        <td className="px-4 py-3 text-sm text-right">₹{expense.amount.toLocaleString()}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-center">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            PAID
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center p-6 bg-muted/20 rounded-lg">
                <p className="text-muted-foreground">No expenses paid yet.</p>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="advances" className="space-y-4">
            {paidAdvances.length > 0 ? (
              <div className="rounded-md border overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-muted">
                    <tr>
                      <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Date</th>
                      <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Recipient</th>
                      <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Type</th>
                      <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Purpose</th>
                      <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">Amount</th>
                      <th scope="col" className="px-4 py-3 text-center text-xs font-medium text-muted-foreground uppercase tracking-wider">Status</th>
                    </tr>
                  </thead>
                  <tbody className="bg-card divide-y divide-gray-200">
                    {paidAdvances.map((advance) => (
                      <tr key={advance.id}>
                        <td className="px-4 py-3 whitespace-nowrap text-sm">{format(new Date(advance.date), 'MMM dd, yyyy')}</td>
                        <td className="px-4 py-3 text-sm uppercase">{advance.recipientName}</td>
                        <td className="px-4 py-3 text-sm uppercase">{advance.recipientType}</td>
                        <td className="px-4 py-3 text-sm uppercase">{advance.purpose}</td>
                        <td className="px-4 py-3 text-sm text-right">₹{advance.amount.toLocaleString()}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-center">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            PAID
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center p-6 bg-muted/20 rounded-lg">
                <p className="text-muted-foreground">No advances paid yet.</p>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="funds" className="space-y-4">
            {fundsReceived.length > 0 ? (
              <div className="rounded-md border overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-muted">
                    <tr>
                      <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Date</th>
                      <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="bg-card divide-y divide-gray-200">
                    {fundsReceived.map((fund) => (
                      <tr key={fund.id}>
                        <td className="px-4 py-3 whitespace-nowrap text-sm">{format(new Date(fund.date), 'MMM dd, yyyy')}</td>
                        <td className="px-4 py-3 text-sm text-right">₹{fund.amount.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center p-6 bg-muted/20 rounded-lg">
                <p className="text-muted-foreground">No funds received yet.</p>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="invoices" className="space-y-4">
            {invoices.length > 0 ? (
              <div className="rounded-md border overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-muted">
                    <tr>
                      <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Date</th>
                      <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Vendor</th>
                      <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Invoice No.</th>
                      <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">Amount</th>
                      <th scope="col" className="px-4 py-3 text-center text-xs font-medium text-muted-foreground uppercase tracking-wider">Status</th>
                      <th scope="col" className="px-4 py-3 text-center text-xs font-medium text-muted-foreground uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-card divide-y divide-gray-200">
                    {invoices.map((invoice) => (
                      <tr key={invoice.id}>
                        <td className="px-4 py-3 whitespace-nowrap text-sm">{format(new Date(invoice.date), 'MMM dd, yyyy')}</td>
                        <td className="px-4 py-3 text-sm">{invoice.partyName}</td>
                        <td className="px-4 py-3 text-sm">{invoice.partyId}</td>
                        <td className="px-4 py-3 text-sm text-right">₹{invoice.netAmount.toLocaleString()}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-center">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            invoice.paymentStatus === 'paid' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {invoice.paymentStatus === 'paid' ? 'Paid' : 'Pending'}
                          </span>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-center">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => setSelectedInvoice(invoice)}
                          >
                            View
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center p-6 bg-muted/20 rounded-lg">
                <p className="text-muted-foreground">No invoices recorded yet.</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CustomCard>

      <CustomCard>
        <h2 className="text-xl font-semibold mb-4 flex items-center">
          <Plus className="mr-2 h-5 w-5 text-muted-foreground" />
          Add Transaction
        </h2>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
          <Button 
            onClick={() => setIsExpenseFormOpen(true)} 
            className="flex items-center justify-center"
            variant="outline"
          >
            <Plus className="mr-2 h-4 w-4" />
            NEW EXPENSE
          </Button>
          
          <Button 
            onClick={() => setIsAdvanceFormOpen(true)} 
            className="flex items-center justify-center"
            variant="outline"
          >
            <ArrowUpDown className="mr-2 h-4 w-4" />
            NEW ADVANCE
          </Button>
          
          <Button 
            onClick={() => setIsInvoiceFormOpen(true)} 
            className="flex items-center justify-center"
            variant="outline"
          >
            <FileText className="mr-2 h-4 w-4" />
            NEW INVOICE
          </Button>
          
          <Button 
            onClick={() => setIsFundsFormOpen(true)} 
            className="flex items-center justify-center"
            variant="outline"
            style={{ backgroundColor: "#ffd700", color: "#000" }}
          >
            <Truck className="mr-2 h-4 w-4" />
            FUNDS FROM H.O
          </Button>
        </div>
      </CustomCard>

      <ExpenseForm
        isOpen={isExpenseFormOpen}
        onClose={() => setIsExpenseFormOpen(false)}
        onSubmit={(expense) => {
          onAddExpense({
            ...expense,
            siteId
          });
        }}
        siteId={siteId}
      />
      
      <AdvanceForm
        isOpen={isAdvanceFormOpen}
        onClose={() => setIsAdvanceFormOpen(false)}
        onSubmit={(advance) => onAddAdvance({
          ...advance,
          siteId
        })}
        siteId={siteId}
      />
      
      <FundsReceivedForm
        isOpen={isFundsFormOpen}
        onClose={() => setIsFundsFormOpen(false)}
        onSubmit={(funds) => onAddFunds({
          ...funds,
          siteId
        })}
      />
      
      <InvoiceForm
        isOpen={isInvoiceFormOpen}
        onClose={() => setIsInvoiceFormOpen(false)}
        onSubmit={(invoice) => onAddInvoice({
          ...invoice,
          siteId
        })}
      />
      
      {selectedInvoice && (
        <InvoiceDetails
          invoice={selectedInvoice}
          isOpen={!!selectedInvoice}
          onClose={() => setSelectedInvoice(null)}
        />
      )}
    </div>
  );
};

export default SiteDetailTransactions;
