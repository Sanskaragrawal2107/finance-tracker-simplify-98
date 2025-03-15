
import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Plus, Download, Filter, Search, ChevronLeft, ChevronRight, Eye, CreditCard, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { supabase, fetchSiteInvoices } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Site, Invoice, PaymentStatus, MaterialItem, BankDetails, Expense, Advance, FundsReceived } from '@/lib/types';
import InvoiceForm from '@/components/invoices/InvoiceForm';
import InvoiceDetails from '@/components/invoices/InvoiceDetails';
import ExpenseForm from '@/components/expenses/ExpenseForm';
import AdvanceForm from '@/components/advances/AdvanceForm';
import FundsReceivedForm from '@/components/funds/FundsReceivedForm';

interface SiteDetailTransactionsProps {
  site: Site;
  expenses?: Expense[];
  advances?: Advance[];
  fundsReceived?: FundsReceived[];
  invoices?: Invoice[];
  supervisorInvoices?: Invoice[];
  onAddExpense?: (expense: Partial<Expense>) => void;
  onAddAdvance?: (advance: Partial<Advance>) => void;
  onAddFunds?: (fund: Partial<FundsReceived>) => void;
  onAddInvoice?: (invoice: Omit<Invoice, 'id' | 'createdAt'>) => void;
}

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

const SiteDetailTransactions: React.FC<SiteDetailTransactionsProps> = ({ 
  site,
  expenses = [],
  advances = [],
  fundsReceived = [],
  invoices = [],
  supervisorInvoices = [],
  onAddExpense,
  onAddAdvance,
  onAddFunds,
  onAddInvoice
}) => {
  const [activeTab, setActiveTab] = useState('invoices');
  const [searchTerm, setSearchTerm] = useState('');
  const [localInvoices, setLocalInvoices] = useState<Invoice[]>(invoices);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateInvoiceDialogOpen, setIsCreateInvoiceDialogOpen] = useState(false);
  const [isCreateExpenseDialogOpen, setIsCreateExpenseDialogOpen] = useState(false);
  const [isCreateAdvanceDialogOpen, setIsCreateAdvanceDialogOpen] = useState(false);
  const [isCreateFundsDialogOpen, setIsCreateFundsDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const loadInvoices = async () => {
      setIsLoading(true);
      try {
        const siteInvoices = await fetchSiteInvoices(site.id);
        setLocalInvoices(siteInvoices);
      } catch (error) {
        console.error('Error loading invoices:', error);
        toast({
          title: "Failed to load invoices",
          description: "There was an error loading the site invoices.",
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    loadInvoices();
  }, [site.id, toast]);

  useEffect(() => {
    // Update local state when props change
    setLocalInvoices(invoices);
  }, [invoices]);

  const filteredInvoices = localInvoices.filter(invoice => 
    invoice.partyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    invoice.material.toLowerCase().includes(searchTerm.toLowerCase()) ||
    invoice.id.includes(searchTerm)
  );

  const handleCreateInvoice = async (invoice: Omit<Invoice, 'id' | 'createdAt'>) => {
    try {
      if (onAddInvoice) {
        onAddInvoice(invoice);
      } else {
        const { data, error } = await supabase
          .from('site_invoices')
          .insert({
            date: invoice.date.toISOString(),
            party_id: invoice.partyId,
            party_name: invoice.partyName,
            material: invoice.material,
            quantity: invoice.quantity,
            rate: invoice.rate,
            gst_percentage: invoice.gstPercentage,
            gross_amount: invoice.grossAmount,
            net_amount: invoice.netAmount,
            material_items: JSON.stringify(invoice.materialItems || []),
            bank_details: JSON.stringify(invoice.bankDetails || {}),
            bill_url: invoice.billUrl,
            payment_status: invoice.paymentStatus,
            created_by: invoice.createdBy,
            approver_type: invoice.approverType,
            site_id: site.id
          })
          .select();
          
        if (error) {
          console.error('Error creating invoice:', error);
          toast({
            title: "Invoice Creation Failed",
            description: error.message,
            variant: "destructive"
          });
          return;
        }
        
        if (data && data.length > 0) {
          // Handle the new invoice data...
          toast({
            title: "Invoice Created",
            description: `Invoice for ${invoice.partyName} has been created successfully.`,
          });
          
          // Refresh the invoice list
          const updatedInvoices = await fetchSiteInvoices(site.id);
          setLocalInvoices(updatedInvoices);
        }
      }
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: "Error",
        description: "Failed to create invoice. Please try again.",
        variant: "destructive"
      });
    }
    
    setIsCreateInvoiceDialogOpen(false);
  };

  const handleCreateExpense = (expense: Partial<Expense>) => {
    if (onAddExpense) {
      const expenseWithSiteId = { ...expense, siteId: site.id };
      onAddExpense(expenseWithSiteId);
      setIsCreateExpenseDialogOpen(false);
      toast({
        title: "Expense Added",
        description: "Expense has been added successfully.",
      });
    }
  };

  const handleCreateAdvance = (advance: Partial<Advance>) => {
    if (onAddAdvance) {
      const advanceWithSiteId = { ...advance, siteId: site.id };
      onAddAdvance(advanceWithSiteId);
      setIsCreateAdvanceDialogOpen(false);
      toast({
        title: "Advance Added",
        description: "Advance has been added successfully.",
      });
    }
  };

  const handleCreateFunds = (funds: Partial<FundsReceived>) => {
    if (onAddFunds) {
      const fundsWithSiteId = { ...funds, siteId: site.id };
      onAddFunds(fundsWithSiteId);
      setIsCreateFundsDialogOpen(false);
      toast({
        title: "Funds Received",
        description: "Funds received have been recorded successfully.",
      });
    }
  };

  const handleViewInvoice = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setIsViewDialogOpen(true);
  };

  const handleMakePayment = async (invoice: Invoice) => {
    try {
      // Update payment status in Supabase
      const { error } = await supabase
        .from('site_invoices')
        .update({ 
          payment_status: PaymentStatus.PAID 
        })
        .eq('id', invoice.id);
        
      if (error) {
        console.error('Error updating payment status:', error);
        toast({
          title: "Payment Failed",
          description: error.message,
          variant: "destructive"
        });
        return;
      }
      
      // Update the invoice in state
      const updatedInvoices = localInvoices.map(inv => {
        if (inv.id === invoice.id) {
          return {
            ...inv,
            paymentStatus: PaymentStatus.PAID
          };
        }
        return inv;
      });
      
      setLocalInvoices(updatedInvoices);
      setIsViewDialogOpen(false);
      
      toast({
        title: "Payment Successful",
        description: `Payment of ₹${invoice.netAmount.toLocaleString()} has been processed successfully.`,
      });
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: "Error",
        description: "Failed to process payment. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleDownloadInvoice = (invoice: Invoice) => {
    // Implementation for downloading invoice
    toast({
      title: "Download Started",
      description: `Download for invoice ${invoice.partyId} has started.`,
    });
  };

  const renderExpensesContent = () => {
    return (
      <div className="space-y-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="relative max-w-md">
            <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
            <input 
              type="text" 
              placeholder="Search expenses..." 
              className="py-2 pl-10 pr-4 border rounded-md w-full md:w-80 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
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
            <Button size="sm" className="gap-1.5" onClick={() => setIsCreateExpenseDialogOpen(true)}>
              <Plus className="h-4 w-4" />
              New Expense
            </Button>
          </div>
        </div>
        
        <div className="bg-white rounded-md border shadow-sm">
          {expenses.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              No expenses found for this site. Click "New Expense" to add one.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b text-left">
                    <th className="pb-3 pl-4 font-medium text-muted-foreground">Date</th>
                    <th className="pb-3 font-medium text-muted-foreground">Category</th>
                    <th className="pb-3 font-medium text-muted-foreground">Description</th>
                    <th className="pb-3 font-medium text-muted-foreground">Amount</th>
                    <th className="pb-3 pr-4 font-medium text-muted-foreground text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {expenses.map((expense) => (
                    <tr key={expense.id} className="border-b last:border-0 hover:bg-muted/20 transition-colors">
                      <td className="py-4 pl-4 text-sm">
                        {expense.date instanceof Date 
                          ? format(expense.date, 'MMM dd, yyyy')
                          : format(new Date(expense.date), 'MMM dd, yyyy')}
                      </td>
                      <td className="py-4 text-sm">{expense.category}</td>
                      <td className="py-4 text-sm">{expense.description}</td>
                      <td className="py-4 text-sm font-medium">₹{expense.amount.toLocaleString()}</td>
                      <td className="py-4 pr-4 text-right">
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <Eye className="h-4 w-4 text-muted-foreground" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderAdvancesContent = () => {
    return (
      <div className="space-y-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="relative max-w-md">
            <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
            <input 
              type="text" 
              placeholder="Search advances..." 
              className="py-2 pl-10 pr-4 border rounded-md w-full md:w-80 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
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
            <Button size="sm" className="gap-1.5" onClick={() => setIsCreateAdvanceDialogOpen(true)}>
              <Plus className="h-4 w-4" />
              New Advance
            </Button>
          </div>
        </div>
        
        <div className="bg-white rounded-md border shadow-sm">
          {advances.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              No advances found for this site. Click "New Advance" to add one.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b text-left">
                    <th className="pb-3 pl-4 font-medium text-muted-foreground">Date</th>
                    <th className="pb-3 font-medium text-muted-foreground">Recipient</th>
                    <th className="pb-3 font-medium text-muted-foreground">Purpose</th>
                    <th className="pb-3 font-medium text-muted-foreground">Amount</th>
                    <th className="pb-3 pr-4 font-medium text-muted-foreground text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {advances.map((advance) => (
                    <tr key={advance.id} className="border-b last:border-0 hover:bg-muted/20 transition-colors">
                      <td className="py-4 pl-4 text-sm">
                        {advance.date instanceof Date 
                          ? format(advance.date, 'MMM dd, yyyy')
                          : format(new Date(advance.date), 'MMM dd, yyyy')}
                      </td>
                      <td className="py-4 text-sm">{advance.recipientName}</td>
                      <td className="py-4 text-sm">{advance.purpose}</td>
                      <td className="py-4 text-sm font-medium">₹{advance.amount.toLocaleString()}</td>
                      <td className="py-4 pr-4 text-right">
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <Eye className="h-4 w-4 text-muted-foreground" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderFundsContent = () => {
    return (
      <div className="space-y-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="relative max-w-md">
            <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
            <input 
              type="text" 
              placeholder="Search funds received..." 
              className="py-2 pl-10 pr-4 border rounded-md w-full md:w-80 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
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
            <Button size="sm" className="gap-1.5" onClick={() => setIsCreateFundsDialogOpen(true)}>
              <Plus className="h-4 w-4" />
              Record Funds
            </Button>
          </div>
        </div>
        
        <div className="bg-white rounded-md border shadow-sm">
          {fundsReceived.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              No funds received records found for this site. Click "Record Funds" to add one.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b text-left">
                    <th className="pb-3 pl-4 font-medium text-muted-foreground">Date</th>
                    <th className="pb-3 font-medium text-muted-foreground">Amount</th>
                    <th className="pb-3 font-medium text-muted-foreground">Reference</th>
                    <th className="pb-3 font-medium text-muted-foreground">Method</th>
                    <th className="pb-3 pr-4 font-medium text-muted-foreground text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {fundsReceived.map((fund) => (
                    <tr key={fund.id} className="border-b last:border-0 hover:bg-muted/20 transition-colors">
                      <td className="py-4 pl-4 text-sm">
                        {fund.date instanceof Date 
                          ? format(fund.date, 'MMM dd, yyyy')
                          : format(new Date(fund.date), 'MMM dd, yyyy')}
                      </td>
                      <td className="py-4 text-sm font-medium">₹{fund.amount.toLocaleString()}</td>
                      <td className="py-4 text-sm">{fund.reference || 'N/A'}</td>
                      <td className="py-4 text-sm">{fund.method || 'N/A'}</td>
                      <td className="py-4 pr-4 text-right">
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <Eye className="h-4 w-4 text-muted-foreground" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderInvoicesContent = () => {
    return (
      <div className="space-y-4">
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
            <Button size="sm" className="gap-1.5" onClick={() => setIsCreateInvoiceDialogOpen(true)}>
              <Plus className="h-4 w-4" />
              New Invoice
            </Button>
          </div>
        </div>
        
        <div className="bg-white rounded-md border shadow-sm">
          {isLoading ? (
            <div className="flex items-center justify-center p-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <span className="ml-2">Loading invoices...</span>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b text-left">
                      <th className="pb-3 pl-4 font-medium text-muted-foreground">Date</th>
                      <th className="pb-3 font-medium text-muted-foreground">Party Name</th>
                      <th className="pb-3 font-medium text-muted-foreground">Material</th>
                      <th className="pb-3 font-medium text-muted-foreground">Net Taxable Amount</th>
                      <th className="pb-3 font-medium text-muted-foreground">GST</th>
                      <th className="pb-3 font-medium text-muted-foreground">Grand Net Total</th>
                      <th className="pb-3 font-medium text-muted-foreground">Status</th>
                      <th className="pb-3 pr-4 font-medium text-muted-foreground text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredInvoices.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="py-8 text-center text-muted-foreground">
                          No invoices found for this site
                        </td>
                      </tr>
                    ) : (
                      filteredInvoices.map((invoice) => (
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
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleDownloadInvoice(invoice)}>
                              <Download className="h-4 w-4 text-muted-foreground" />
                            </Button>
                            {invoice.paymentStatus === PaymentStatus.PENDING && (
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-8 w-8" 
                                onClick={() => handleViewInvoice(invoice)}
                              >
                                <CreditCard className="h-4 w-4 text-muted-foreground" />
                              </Button>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
              
              {filteredInvoices.length > 0 && (
                <div className="flex items-center justify-between mt-4 border-t pt-4 px-4 pb-2">
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
              )}
            </>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <Tabs defaultValue="invoices" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="invoices">Invoices</TabsTrigger>
          <TabsTrigger value="expenses">Expenses</TabsTrigger>
          <TabsTrigger value="advances">Advances</TabsTrigger>
          <TabsTrigger value="funds">Funds Received</TabsTrigger>
        </TabsList>
        
        <TabsContent value="invoices" className="space-y-4">
          {renderInvoicesContent()}
        </TabsContent>
        
        <TabsContent value="expenses">
          {renderExpensesContent()}
        </TabsContent>
        
        <TabsContent value="advances">
          {renderAdvancesContent()}
        </TabsContent>
        
        <TabsContent value="funds">
          {renderFundsContent()}
        </TabsContent>
      </Tabs>
      
      <Dialog open={isCreateInvoiceDialogOpen} onOpenChange={setIsCreateInvoiceDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogTitle>Create New Invoice</DialogTitle>
          <InvoiceForm 
            onSubmit={handleCreateInvoice} 
            siteId={site.id}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={isCreateExpenseDialogOpen} onOpenChange={setIsCreateExpenseDialogOpen}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogTitle>Add New Expense</DialogTitle>
          <ExpenseForm 
            onSubmit={handleCreateExpense}
            siteId={site.id}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={isCreateAdvanceDialogOpen} onOpenChange={setIsCreateAdvanceDialogOpen}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogTitle>Add New Advance</DialogTitle>
          <AdvanceForm 
            onSubmit={handleCreateAdvance}
            isOpen={isCreateAdvanceDialogOpen}
            onClose={() => setIsCreateAdvanceDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={isCreateFundsDialogOpen} onOpenChange={setIsCreateFundsDialogOpen}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogTitle>Record Funds Received</DialogTitle>
          <FundsReceivedForm 
            onSubmit={handleCreateFunds}
            isOpen={isCreateFundsDialogOpen}
            onClose={() => setIsCreateFundsDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogTitle>Invoice Details</DialogTitle>
          {selectedInvoice && (
            <InvoiceDetails
              invoice={selectedInvoice}
              isOpen={!!selectedInvoice}
              onClose={() => setSelectedInvoice(null)}
              onMakePayment={handleMakePayment}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SiteDetailTransactions;
