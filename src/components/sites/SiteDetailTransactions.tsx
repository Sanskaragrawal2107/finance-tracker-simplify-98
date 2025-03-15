import React, { useState, useEffect } from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Plus, Clock, FileText, ArrowUpDown, Truck, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { Expense, Advance, FundsReceived, Invoice, ApprovalStatus, AdvancePurpose, MaterialItem, BankDetails } from '@/lib/types';
import CustomCard from '@/components/ui/CustomCard';
import ExpenseForm from '@/components/expenses/ExpenseForm';
import AdvanceForm from '@/components/advances/AdvanceForm';
import FundsReceivedForm from '@/components/funds/FundsReceivedForm';
import InvoiceForm from '@/components/invoices/InvoiceForm';
import InvoiceDetails from '@/components/invoices/InvoiceDetails';
import { useIsMobile } from '@/hooks/use-mobile';
import { supabase } from '@/integrations/supabase/client';

interface SiteDetailTransactionsProps {
  siteId: string;
  expenses: Expense[];
  advances: Advance[];
  fundsReceived: FundsReceived[];
  invoices: Invoice[];
  supervisorInvoices?: Invoice[];
  onAddExpense: (expense: Partial<Expense>) => void;
  onAddAdvance: (advance: Partial<Advance>) => void;
  onAddFunds: (funds: Partial<FundsReceived>) => void;
  onAddInvoice: (invoice: Omit<Invoice, 'id' | 'createdAt'>) => void;
}

const DEBIT_ADVANCE_PURPOSES = [
  AdvancePurpose.SAFETY_SHOES,
  AdvancePurpose.TOOLS,
  AdvancePurpose.OTHER
];

const SiteDetailTransactions: React.FC<SiteDetailTransactionsProps> = ({
  siteId,
  expenses,
  advances,
  fundsReceived,
  invoices,
  supervisorInvoices = [],
  onAddExpense,
  onAddAdvance,
  onAddFunds,
  onAddInvoice
}) => {
  const isMobile = useIsMobile();
  const [isExpenseFormOpen, setIsExpenseFormOpen] = useState(false);
  const [isAdvanceFormOpen, setIsAdvanceFormOpen] = useState(false);
  const [isFundsFormOpen, setIsFundsFormOpen] = useState(false);
  const [isInvoiceFormOpen, setIsInvoiceFormOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [activeTab, setActiveTab] = useState("expenses");
  const [isLoadingSiteInvoices, setIsLoadingSiteInvoices] = useState(false);
  const [siteInvoices, setSiteInvoices] = useState<Invoice[]>([]);

  const displayExpenses = expenses;
  
  const displayAdvances = advances;
  
  const displayInvoices = siteInvoices.length > 0 
    ? siteInvoices 
    : supervisorInvoices.length > 0 
      ? supervisorInvoices 
      : invoices;

  const isDebitToWorker = (advance: Advance) => {
    return DEBIT_ADVANCE_PURPOSES.includes(advance.purpose as AdvancePurpose);
  };

  useEffect(() => {
    const fetchInvoices = async () => {
      if (!siteId) return;
      
      setIsLoadingSiteInvoices(true);
      try {
        const { data, error } = await supabase
          .from('site_invoices')
          .select('*')
          .eq('site_id', siteId);
          
        if (error) {
          console.error('Error fetching invoices:', error);
          return;
        }
        
        if (data && data.length > 0) {
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
          
          setSiteInvoices(mappedInvoices);
          console.log('Fetched site invoices:', mappedInvoices);
        }
      } catch (error) {
        console.error('Error:', error);
      } finally {
        setIsLoadingSiteInvoices(false);
      }
    };
    
    fetchInvoices();
  }, [siteId]);

  const renderMobileTable = (columns: string[], data: any[], renderRow: (item: any) => React.ReactNode) => {
    return (
      <div className="space-y-3">
        {data.map((item, index) => (
          <div key={item.id || index} className="border rounded-md overflow-hidden bg-white">
            {renderRow(item)}
          </div>
        ))}
      </div>
    );
  };

  const renderExpenseMobileRow = (expense: Expense) => (
    <div className="p-3 space-y-1.5">
      <div className="flex justify-between items-center">
        <span className="font-medium text-sm">Date:</span>
        <span className="text-sm">{format(new Date(expense.date), 'MMM dd, yyyy')}</span>
      </div>
      <div className="flex justify-between items-center">
        <span className="font-medium text-sm">Purpose:</span>
        <span className="text-sm text-right uppercase">{expense.description}</span>
      </div>
      <div className="flex justify-between items-center">
        <span className="font-medium text-sm">Category:</span>
        <span className="text-sm uppercase">{expense.category}</span>
      </div>
      <div className="flex justify-between items-center">
        <span className="font-medium text-sm">Amount:</span>
        <span className="font-medium text-sm">₹{expense.amount.toLocaleString()}</span>
      </div>
      <div className="flex justify-center mt-1.5">
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
          expense.status === ApprovalStatus.APPROVED 
            ? 'bg-green-100 text-green-800' 
            : expense.status === ApprovalStatus.REJECTED
            ? 'bg-red-100 text-red-800'
            : 'bg-yellow-100 text-yellow-800'
        }`}>
          {expense.status.toUpperCase()}
        </span>
      </div>
    </div>
  );

  const renderAdvanceMobileRow = (advance: Advance) => (
    <div className="p-3 space-y-1.5">
      <div className="flex justify-between items-center">
        <span className="font-medium text-sm">Date:</span>
        <span className="text-sm">{format(new Date(advance.date), 'MMM dd, yyyy')}</span>
      </div>
      <div className="flex justify-between items-center">
        <span className="font-medium text-sm">Recipient:</span>
        <span className="text-sm uppercase">{advance.recipientName}</span>
      </div>
      <div className="flex justify-between items-center">
        <span className="font-medium text-sm">Purpose:</span>
        <span className="text-sm text-right uppercase">{advance.purpose}</span>
      </div>
      <div className="flex justify-between items-center">
        <span className="font-medium text-sm">Type:</span>
        <span className="text-sm text-right uppercase">
          {isDebitToWorker(advance) ? "Debit To Worker" : "Regular Advance"}
        </span>
      </div>
      <div className="flex justify-between items-center">
        <span className="font-medium text-sm">Amount:</span>
        <span className="font-medium text-sm">₹{advance.amount.toLocaleString()}</span>
      </div>
      <div className="flex justify-center mt-1.5">
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
          advance.status === ApprovalStatus.APPROVED 
            ? 'bg-green-100 text-green-800' 
            : advance.status === ApprovalStatus.REJECTED
            ? 'bg-red-100 text-red-800'
            : 'bg-yellow-100 text-yellow-800'
        }`}>
          {advance.status.toUpperCase()}
        </span>
      </div>
    </div>
  );

  const renderFundMobileRow = (fund: FundsReceived) => (
    <div className="p-3 space-y-1.5">
      <div className="flex justify-between items-center">
        <span className="font-medium text-sm">Date:</span>
        <span className="text-sm">{format(new Date(fund.date), 'MMM dd, yyyy')}</span>
      </div>
      <div className="flex justify-between items-center">
        <span className="font-medium text-sm">Amount:</span>
        <span className="font-medium text-sm">₹{fund.amount.toLocaleString()}</span>
      </div>
      {fund.reference && (
        <div className="flex justify-between items-center">
          <span className="font-medium text-sm">Reference:</span>
          <span className="text-sm">{fund.reference}</span>
        </div>
      )}
      {fund.method && (
        <div className="flex justify-between items-center">
          <span className="font-medium text-sm">Method:</span>
          <span className="text-sm">{fund.method}</span>
        </div>
      )}
    </div>
  );

  const renderInvoiceMobileRow = (invoice: Invoice) => (
    <div className="p-3 space-y-1.5">
      <div className="flex justify-between items-center">
        <span className="font-medium text-sm">Date:</span>
        <span className="text-sm">{format(new Date(invoice.date), 'MMM dd, yyyy')}</span>
      </div>
      <div className="flex justify-between items-center">
        <span className="font-medium text-sm">Vendor:</span>
        <span className="text-sm uppercase">{invoice.partyName}</span>
      </div>
      <div className="flex justify-between items-center">
        <span className="font-medium text-sm">Invoice No:</span>
        <span className="text-sm uppercase">{invoice.partyId}</span>
      </div>
      <div className="flex justify-between items-center">
        <span className="font-medium text-sm">Amount:</span>
        <span className="font-medium text-sm">₹{invoice.netAmount.toLocaleString()}</span>
      </div>
      <div className="flex items-center justify-between mt-1.5">
        <span className="font-medium text-sm mr-2">Status:</span>
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
          invoice.paymentStatus === 'paid' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
        }`}>
          {invoice.paymentStatus === 'paid' ? 'PAID' : 'PENDING'}
        </span>
      </div>
      <div className="flex justify-center mt-2">
        <Button variant="primary" size="sm" onClick={() => setSelectedInvoice(invoice)}>
          VIEW DETAILS
        </Button>
      </div>
    </div>
  );

  const handleAddInvoice = async (invoice: Omit<Invoice, 'id' | 'createdAt'>) => {
    onAddInvoice(invoice);
    
    setIsLoadingSiteInvoices(true);
    try {
      const { data, error } = await supabase
        .from('site_invoices')
        .select('*')
        .eq('site_id', siteId);
        
      if (error) {
        console.error('Error fetching invoices:', error);
        return;
      }
      
      if (data && data.length > 0) {
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
        
        setSiteInvoices(mappedInvoices);
        console.log('Updated site invoices after adding:', mappedInvoices);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setIsLoadingSiteInvoices(false);
    }
  };

  return <div className="grid grid-cols-1 gap-6">
      <CustomCard className="bg-white">
        <h2 className="text-xl font-semibold mb-4 flex items-center">
          <Clock className="mr-2 h-5 w-5" />
          Transaction History
        </h2>
        
        <Tabs defaultValue="expenses" className="w-full" value={activeTab} onValueChange={setActiveTab}>
          <div className="overflow-x-auto pb-2">
            <TabsList className="w-full mb-4 bg-gray-100 border border-gray-200 flex-nowrap whitespace-nowrap">
              <TabsTrigger value="expenses" className="flex-1 data-[state=active]:bg-primary data-[state=active]:text-white text-xs sm:text-sm">
                <span className="hidden sm:inline">EXPENSES PAID</span>
                <span className="sm:hidden">EXP</span>
              </TabsTrigger>
              <TabsTrigger value="advances" className="flex-1 data-[state=active]:bg-primary data-[state=active]:text-white text-xs sm:text-sm">
                <span className="hidden sm:inline">ADVANCES PAID</span>
                <span className="sm:hidden">ADV</span>
              </TabsTrigger>
              <TabsTrigger value="invoices" className="flex-1 data-[state=active]:bg-primary data-[state=active]:text-white text-xs sm:text-sm">
                <span className="hidden sm:inline">PURCHASED INVOICE</span>
                <span className="sm:hidden">INV</span>
              </TabsTrigger>
              <TabsTrigger value="funds" className="flex-1 data-[state=active]:bg-primary data-[state=active]:text-white text-xs sm:text-sm">
                <span className="hidden sm:inline">FUNDS REC. FROM H.O.</span>
                <span className="sm:hidden">FUNDS</span>
              </TabsTrigger>
            </TabsList>
          </div>
          
          <TabsContent value="expenses" className="space-y-4 bg-white">
            {displayExpenses.length > 0 ? (
              <>
                <div className="hidden sm:block rounded-md overflow-hidden border border-gray-200">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-100">
                      <tr>
                        <th scope="col" className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">Date</th>
                        <th scope="col" className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">Purpose</th>
                        <th scope="col" className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">Category</th>
                        <th scope="col" className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider">Amount</th>
                        <th scope="col" className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 bg-white">
                      {displayExpenses.map(expense => (
                        <tr key={expense.id}>
                          <td className="px-4 py-3 whitespace-nowrap text-sm">{format(new Date(expense.date), 'MMM dd, yyyy')}</td>
                          <td className="px-4 py-3 text-sm uppercase">{expense.description}</td>
                          <td className="px-4 py-3 text-sm uppercase">{expense.category}</td>
                          <td className="px-4 py-3 text-sm text-right">₹{expense.amount.toLocaleString()}</td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-center">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              expense.status === ApprovalStatus.APPROVED 
                                ? 'bg-green-100 text-green-800' 
                                : expense.status === ApprovalStatus.REJECTED
                                ? 'bg-red-100 text-red-800'
                                : 'bg-yellow-100 text-yellow-800'
                            }`}>
                              {expense.status.toUpperCase()}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                
                <div className="sm:hidden">
                  {renderMobileTable(
                    ['Date', 'Purpose', 'Category', 'Amount', 'Status'],
                    displayExpenses,
                    renderExpenseMobileRow
                  )}
                </div>
              </>
            ) : (
              <div className="text-center p-6 bg-gray-50 rounded-lg border border-gray-200">
                <p className="opacity-80">No expenses paid yet.</p>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="advances" className="space-y-4 bg-white">
            {displayAdvances.length > 0 ? (
              <>
                <div className="hidden sm:block rounded-md overflow-hidden border border-gray-200">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-100">
                      <tr>
                        <th scope="col" className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">Date</th>
                        <th scope="col" className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">Recipient</th>
                        <th scope="col" className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">Type</th>
                        <th scope="col" className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">Purpose</th>
                        <th scope="col" className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider">Amount</th>
                        <th scope="col" className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 bg-white">
                      {displayAdvances.map(advance => (
                        <tr key={advance.id}>
                          <td className="px-4 py-3 whitespace-nowrap text-sm">{format(new Date(advance.date), 'MMM dd, yyyy')}</td>
                          <td className="px-4 py-3 text-sm uppercase">{advance.recipientName}</td>
                          <td className="px-4 py-3 text-sm uppercase">
                            {isDebitToWorker(advance) ? "Debit To Worker" : "Regular Advance"}
                          </td>
                          <td className="px-4 py-3 text-sm uppercase">{advance.purpose}</td>
                          <td className="px-4 py-3 text-sm text-right">₹{advance.amount.toLocaleString()}</td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-center">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              advance.status === ApprovalStatus.APPROVED 
                                ? 'bg-green-100 text-green-800' 
                                : advance.status === ApprovalStatus.REJECTED
                                ? 'bg-red-100 text-red-800'
                                : 'bg-yellow-100 text-yellow-800'
                            }`}>
                              {advance.status.toUpperCase()}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                
                <div className="sm:hidden">
                  {renderMobileTable(
                    ['Date', 'Recipient', 'Purpose', 'Amount', 'Status'],
                    displayAdvances,
                    renderAdvanceMobileRow
                  )}
                </div>
              </>
            ) : (
              <div className="text-center p-6 bg-gray-50 rounded-lg border border-gray-200">
                <p className="opacity-80">No advances paid yet.</p>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="funds" className="space-y-4 bg-white">
            {fundsReceived.length > 0 ? (
              <>
                <div className="hidden sm:block rounded-md overflow-hidden border border-gray-200">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-100">
                      <tr>
                        <th scope="col" className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">Date</th>
                        <th scope="col" className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">Reference</th>
                        <th scope="col" className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">Method</th>
                        <th scope="col" className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider">Amount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 bg-white">
                      {fundsReceived.map(fund => (
                        <tr key={fund.id}>
                          <td className="px-4 py-3 whitespace-nowrap text-sm">{format(new Date(fund.date), 'MMM dd, yyyy')}</td>
                          <td className="px-4 py-3 text-sm">{fund.reference || "-"}</td>
                          <td className="px-4 py-3 text-sm">{fund.method || "-"}</td>
                          <td className="px-4 py-3 text-sm text-right">₹{fund.amount.toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                
                <div className="sm:hidden">
                  {renderMobileTable(
                    ['Date', 'Amount', 'Reference', 'Method'],
                    fundsReceived,
                    renderFundMobileRow
                  )}
                </div>
              </>
            ) : (
              <div className="text-center p-6 bg-gray-50 rounded-lg border border-gray-200">
                <p className="opacity-80">No funds received yet.</p>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="invoices" className="space-y-4 bg-white">
            {isLoadingSiteInvoices ? (
              <div className="flex items-center justify-center p-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <span className="ml-2">Loading invoices...</span>
              </div>
            ) : displayInvoices.length > 0 ? (
              <>
                <div className="hidden sm:block rounded-md overflow-hidden border border-gray-200">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-100">
                      <tr>
                        <th scope="col" className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">Date</th>
                        <th scope="col" className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">Vendor</th>
                        <th scope="col" className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">Invoice No.</th>
                        <th scope="col" className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider">Approved By</th>
                        <th scope="col" className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider">Amount</th>
                        <th scope="col" className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider">Status</th>
                        <th scope="col" className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 bg-white">
                      {displayInvoices.map(invoice => (
                        <tr key={invoice.id}>
                          <td className="px-4 py-3 whitespace-nowrap text-sm">{format(new Date(invoice.date), 'MMM dd, yyyy')}</td>
                          <td className="px-4 py-3 text-sm uppercase">{invoice.partyName}</td>
                          <td className="px-4 py-3 text-sm uppercase">{invoice.partyId}</td>
                          <td className="px-4 py-3 text-sm text-center uppercase">{invoice.approverType || "supervisor"}</td>
                          <td className="px-4 py-3 text-sm text-right">₹{invoice.netAmount.toLocaleString()}</td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-center">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${invoice.paymentStatus === 'paid' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                              {invoice.paymentStatus === 'paid' ? 'PAID' : 'PENDING'}
                            </span>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-center">
                            <Button variant="primary" size="sm" onClick={() => setSelectedInvoice(invoice)}>
                              VIEW
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                
                <div className="sm:hidden">
                  {renderMobileTable(
                    ['Date', 'Vendor', 'Invoice No.', 'Amount', 'Status', 'Actions'],
                    displayInvoices,
                    renderInvoiceMobileRow
                  )}
                </div>
              </>
            ) : (
              <div className="text-center p-6 bg-gray-50 rounded-lg border border-gray-200">
                <p className="opacity-80">No invoices recorded yet.</p>
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
          <Button onClick={() => setIsExpenseFormOpen(true)} className="flex items-center justify-center" variant="outline">
            <Plus className="mr-2 h-4 w-4" />
            NEW EXPENSE
          </Button>
          
          <Button onClick={() => setIsAdvanceFormOpen(true)} className="flex items-center justify-center" variant="outline">
            <ArrowUpDown className="mr-2 h-4 w-4" />
            NEW ADVANCE
          </Button>
          
          <Button onClick={() => setIsInvoiceFormOpen(true)} className="flex items-center justify-center" variant="outline">
            <FileText className="mr-2 h-4 w-4" />
            NEW INVOICE
          </Button>
          
          <Button onClick={() => setIsFundsFormOpen(true)} className="flex items-center justify-center" variant="outline" style={{
          backgroundColor: "#ffd700",
          color: "#000"
        }}>
            <Truck className="mr-2 h-4 w-4" />
            FUNDS REC. FROM H.O
          </Button>
        </div>
      </CustomCard>

      <ExpenseForm isOpen={isExpenseFormOpen} onClose={() => setIsExpenseFormOpen(false)} onSubmit={expense => {
        onAddExpense({
          ...expense,
          siteId
        });
      }} siteId={siteId} />
      
      <AdvanceForm isOpen={isAdvanceFormOpen} onClose={() => setIsAdvanceFormOpen(false)} onSubmit={advance => onAddAdvance({
        ...advance,
        siteId
      })} siteId={siteId} />
      
      <FundsReceivedForm isOpen={isFundsFormOpen} onClose={() => setIsFundsFormOpen(false)} onSubmit={funds => onAddFunds({
        ...funds,
        siteId
      })} />
      
      <InvoiceForm 
        isOpen={isInvoiceFormOpen} 
        onClose={() => setIsInvoiceFormOpen(false)} 
        onSubmit={handleAddInvoice} 
        siteId={siteId}
      />
      
      {selectedInvoice && <InvoiceDetails invoice={selectedInvoice} isOpen={!!selectedInvoice} onClose={() => setSelectedInvoice(null)} />}
    </div>;
};

export default SiteDetailTransactions;
