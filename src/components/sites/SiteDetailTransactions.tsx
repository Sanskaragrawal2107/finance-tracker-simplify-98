import React, { useState } from 'react';
import { format } from 'date-fns';
import { Plus, ArrowDownToLine, FileText, Wallet, Tag, IndianRupee } from 'lucide-react';
import { Expense, Advance, FundsReceived, Invoice, PaymentStatus } from '@/lib/types';
import { Button } from '@/components/ui/button';
import CustomCard from '@/components/ui/CustomCard';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import ExpenseForm from '@/components/expenses/ExpenseForm';
import AdvanceForm from '@/components/advances/AdvanceForm';
import FundsReceivedForm from '@/components/funds/FundsReceivedForm';
import InvoiceForm from '@/components/invoices/InvoiceForm';
import Tabs from '@/components/ui/Tabs';

interface SiteDetailTransactionsProps {
  siteId: string;
  expenses: Expense[];
  advances: Advance[];
  fundsReceived: FundsReceived[];
  invoices: Invoice[];
  onAddExpense: (expense: Partial<Expense>) => void;
  onAddAdvance: (advance: Partial<Advance>) => void;
  onAddFunds: (fund: Partial<FundsReceived>) => void;
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
  onAddInvoice,
}) => {
  const [isExpenseFormOpen, setIsExpenseFormOpen] = useState(false);
  const [isAdvanceFormOpen, setIsAdvanceFormOpen] = useState(false);
  const [isFundsFormOpen, setIsFundsFormOpen] = useState(false);
  const [isInvoiceFormOpen, setIsInvoiceFormOpen] = useState(false);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <CustomCard>
          <h3 className="text-lg font-medium mb-4">History</h3>
          <Tabs defaultValue="expenses" className="w-full">
            {/* Expenses History */}
            {expenses.length > 0 && (
              <TabsContent value="expenses">
                <div>
                  <h3 className="text-sm font-medium mb-2">Expense History</h3>
                  <div className="border rounded-md overflow-x-auto">
                    <table className="min-w-full divide-y divide-border">
                      <thead className="bg-muted">
                        <tr>
                          <th className="py-2 px-3 text-left text-xs font-medium">Date</th>
                          <th className="py-2 px-3 text-left text-xs font-medium">Description</th>
                          <th className="py-2 px-3 text-left text-xs font-medium">Category</th>
                          <th className="py-2 px-3 text-right text-xs font-medium">Amount</th>
                          <th className="py-2 px-3 text-right text-xs font-medium">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {expenses.map((expense) => (
                          <tr key={expense.id} className="hover:bg-muted/50">
                            <td className="py-2 px-3 text-sm whitespace-nowrap">
                              {expense.date instanceof Date 
                                ? format(expense.date, 'dd/MM/yyyy')
                                : format(new Date(expense.date), 'dd/MM/yyyy')}
                            </td>
                            <td className="py-2 px-3 text-sm">{expense.description}</td>
                            <td className="py-2 px-3 text-sm">{expense.category.toString()}</td>
                            <td className="py-2 px-3 text-sm text-right">₹{expense.amount.toLocaleString()}</td>
                            <td className="py-2 px-3 text-sm text-right">
                              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs ${
                                expense.status === 'approved' ? 'bg-green-100 text-green-800' : 
                                expense.status === 'rejected' ? 'bg-red-100 text-red-800' : 
                                'bg-yellow-100 text-yellow-800'
                              }`}>
                                {expense.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </TabsContent>
            )}

            {/* Advances History */}
            {advances.length > 0 && (
              <TabsContent value="advances">
                <div>
                  <h3 className="text-sm font-medium mb-2">Advance History</h3>
                  <div className="border rounded-md overflow-x-auto">
                    <table className="min-w-full divide-y divide-border">
                      <thead className="bg-muted">
                        <tr>
                          <th className="py-2 px-3 text-left text-xs font-medium">Date</th>
                          <th className="py-2 px-3 text-left text-xs font-medium">Recipient</th>
                          <th className="py-2 px-3 text-left text-xs font-medium">Purpose</th>
                          <th className="py-2 px-3 text-right text-xs font-medium">Amount</th>
                          <th className="py-2 px-3 text-right text-xs font-medium">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {advances.map((advance) => (
                          <tr key={advance.id} className="hover:bg-muted/50">
                            <td className="py-2 px-3 text-sm whitespace-nowrap">
                              {advance.date instanceof Date 
                                ? format(advance.date, 'dd/MM/yyyy')
                                : format(new Date(advance.date), 'dd/MM/yyyy')}
                            </td>
                            <td className="py-2 px-3 text-sm">{advance.recipientName}</td>
                            <td className="py-2 px-3 text-sm">{advance.purpose}</td>
                            <td className="py-2 px-3 text-sm text-right">₹{advance.amount.toLocaleString()}</td>
                            <td className="py-2 px-3 text-sm text-right">
                              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs ${
                                advance.status === 'approved' ? 'bg-green-100 text-green-800' : 
                                advance.status === 'rejected' ? 'bg-red-100 text-red-800' : 
                                'bg-yellow-100 text-yellow-800'
                              }`}>
                                {advance.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </TabsContent>
            )}

            {/* Funds Received History */}
            {fundsReceived.length > 0 && (
              <TabsContent value="fundsReceived">
                <div>
                  <h3 className="text-sm font-medium mb-2">Funds Received History</h3>
                  <div className="border rounded-md overflow-x-auto">
                    <table className="min-w-full divide-y divide-border">
                      <thead className="bg-muted">
                        <tr>
                          <th className="py-2 px-3 text-left text-xs font-medium">Date</th>
                          <th className="py-2 px-3 text-right text-xs font-medium">Amount</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {fundsReceived.map((fund) => (
                          <tr key={fund.id} className="hover:bg-muted/50">
                            <td className="py-2 px-3 text-sm whitespace-nowrap">
                              {fund.date instanceof Date 
                                ? format(fund.date, 'dd/MM/yyyy')
                                : format(new Date(fund.date), 'dd/MM/yyyy')}
                            </td>
                            <td className="py-2 px-3 text-sm text-right">₹{fund.amount.toLocaleString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </TabsContent>
            )}

            {/* Invoices History */}
            {invoices.length > 0 && (
              <TabsContent value="invoices">
                <div>
                  <h3 className="text-sm font-medium mb-2">Invoice History</h3>
                  <div className="border rounded-md overflow-x-auto">
                    <table className="min-w-full divide-y divide-border">
                      <thead className="bg-muted">
                        <tr>
                          <th className="py-2 px-3 text-left text-xs font-medium">Date</th>
                          <th className="py-2 px-3 text-left text-xs font-medium">Party</th>
                          <th className="py-2 px-3 text-left text-xs font-medium">Material</th>
                          <th className="py-2 px-3 text-right text-xs font-medium">Amount</th>
                          <th className="py-2 px-3 text-right text-xs font-medium">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {invoices.map((invoice) => (
                          <tr key={invoice.id} className="hover:bg-muted/50">
                            <td className="py-2 px-3 text-sm whitespace-nowrap">
                              {invoice.date instanceof Date 
                                ? format(invoice.date, 'dd/MM/yyyy')
                                : format(new Date(invoice.date), 'dd/MM/yyyy')}
                            </td>
                            <td className="py-2 px-3 text-sm">{invoice.partyName}</td>
                            <td className="py-2 px-3 text-sm">{invoice.material}</td>
                            <td className="py-2 px-3 text-sm text-right">₹{invoice.netAmount.toLocaleString()}</td>
                            <td className="py-2 px-3 text-sm text-right">
                              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs ${
                                invoice.paymentStatus === 'paid' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                              }`}>
                                {invoice.paymentStatus}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </TabsContent>
            )}

            {expenses.length === 0 && advances.length === 0 && fundsReceived.length === 0 && invoices.length === 0 && (
              <TabsContent value="noTransactions">
                <div className="text-center py-6 text-muted-foreground">
                  No transaction history available for this site.
                </div>
              </TabsContent>
            )}
          </Tabs>
        </CustomCard>
        
        <CustomCard>
          <h3 className="text-lg font-medium mb-4">Add Transaction</h3>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              onClick={() => setIsExpenseFormOpen(true)}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Expense
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              onClick={() => setIsAdvanceFormOpen(true)}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Advance
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              onClick={() => setIsInvoiceFormOpen(true)}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Invoice
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              className="flex-1 bg-yellow-50 text-yellow-600 border-yellow-200 hover:bg-yellow-100 hover:text-yellow-700"
              onClick={() => setIsFundsFormOpen(true)}
            >
              <Plus className="h-4 w-4 mr-2" />
              Funds Received from H.O
            </Button>
          </div>
        </CustomCard>
      </div>

      <ExpenseForm
        isOpen={isExpenseFormOpen}
        onClose={() => setIsExpenseFormOpen(false)}
        onSubmit={onAddExpense}
        siteId={siteId}
      />
      
      <AdvanceForm
        isOpen={isAdvanceFormOpen}
        onClose={() => setIsAdvanceFormOpen(false)}
        onSubmit={onAddAdvance}
        siteId={siteId}
      />
      
      <FundsReceivedForm
        isOpen={isFundsFormOpen}
        onClose={() => setIsFundsFormOpen(false)}
        onSubmit={onAddFunds}
        siteId={siteId}
      />
      
      <InvoiceForm
        isOpen={isInvoiceFormOpen}
        onClose={() => setIsInvoiceFormOpen(false)}
        onSubmit={onAddInvoice}
        siteId={siteId}
      />
    </div>
  );
};

export default SiteDetailTransactions;
