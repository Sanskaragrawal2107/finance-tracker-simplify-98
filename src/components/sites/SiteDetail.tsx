
import React, { useState } from 'react';
import { format } from 'date-fns';
import { Calendar, ArrowLeft, Plus, Check, X, FileText, Building, Wallet, DownloadCloud, Receipt } from 'lucide-react';
import { Site, Expense, ExpenseCategory, ApprovalStatus, Advance, FundsReceived } from '@/lib/types';
import CustomCard from '@/components/ui/CustomCard';
import { Button } from '@/components/ui/button';
import ExpenseForm from '@/components/expenses/ExpenseForm';
import AdvanceForm from '@/components/advances/AdvanceForm';
import FundsReceivedForm from '@/components/funds/FundsReceivedForm';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';

interface SiteDetailProps {
  site: Site;
  expenses: Expense[];
  advances?: Advance[];
  fundsReceived?: FundsReceived[];
  onBack: () => void;
  onAddExpense: (expense: Partial<Expense>) => void;
  onAddAdvance?: (advance: Partial<Advance>) => void;
  onAddFunds?: (funds: Partial<FundsReceived>) => void;
  onCompleteSite: (siteId: string, completionDate: Date) => void;
}

const getCategoryColor = (category: ExpenseCategory | string) => {
  switch (category) {
    case ExpenseCategory.MATERIAL:
      return 'bg-blue-100 text-blue-800';
    case ExpenseCategory.LABOR:
      return 'bg-green-100 text-green-800';
    case ExpenseCategory.TRAVEL:
      return 'bg-yellow-100 text-yellow-800';
    case ExpenseCategory.OFFICE:
      return 'bg-purple-100 text-purple-800';
    case ExpenseCategory.MISC:
      return 'bg-gray-100 text-gray-800';
    case ExpenseCategory.TRANSPORT:
      return 'bg-orange-100 text-orange-800';
    case ExpenseCategory.FOOD:
      return 'bg-red-100 text-red-800';
    case ExpenseCategory.ACCOMMODATION:
      return 'bg-pink-100 text-pink-800';
    case ExpenseCategory.EQUIPMENT:
      return 'bg-indigo-100 text-indigo-800';
    case ExpenseCategory.MAINTENANCE:
      return 'bg-teal-100 text-teal-800';
    // Custom categories
    case "STAFF TRAVELLING CHARGES":
      return 'bg-yellow-100 text-yellow-800';
    case "STATIONARY & PRINTING":
      return 'bg-purple-100 text-purple-800';
    case "DIESEL & FUEL CHARGES":
      return 'bg-orange-100 text-orange-800';
    case "LABOUR TRAVELLING EXP.":
      return 'bg-yellow-100 text-yellow-800';
    case "LOADGING & BOARDING FOR STAFF":
      return 'bg-pink-100 text-pink-800';
    case "FOOD CHARGES FOR LABOUR":
      return 'bg-red-100 text-red-800';
    case "SITE EXPENSES":
      return 'bg-gray-100 text-gray-800';
    case "ROOM RENT FOR LABOUR":
      return 'bg-pink-100 text-pink-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

const getStatusColor = (status: ApprovalStatus) => {
  switch (status) {
    case ApprovalStatus.APPROVED:
      return 'bg-green-100 text-green-800';
    case ApprovalStatus.PENDING:
      return 'bg-yellow-100 text-yellow-800';
    case ApprovalStatus.REJECTED:
      return 'bg-red-100 text-red-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

const SiteDetail: React.FC<SiteDetailProps> = ({ 
  site, 
  expenses, 
  advances = [],
  fundsReceived = [],
  onBack, 
  onAddExpense,
  onAddAdvance,
  onAddFunds,
  onCompleteSite
}) => {
  const [isExpenseFormOpen, setIsExpenseFormOpen] = useState(false);
  const [isAdvanceFormOpen, setIsAdvanceFormOpen] = useState(false);
  const [isFundsFormOpen, setIsFundsFormOpen] = useState(false);
  const [isCompletionDialogOpen, setIsCompletionDialogOpen] = useState(false);
  const [completionDate, setCompletionDate] = useState<Date | undefined>(site.completionDate);
  const [activeTab, setActiveTab] = useState('expenses');
  
  const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0);
  const totalAdvances = advances.reduce((sum, advance) => sum + advance.amount, 0);
  const totalFundsReceived = fundsReceived.reduce((sum, fund) => sum + fund.amount, 0);
  const totalBalance = totalFundsReceived - totalExpenses - totalAdvances;
  
  // Make sure dates are Date objects
  const ensureDate = (date: Date | string): Date => {
    return date instanceof Date ? date : new Date(date);
  };
  
  const handleAddExpense = (newExpense: Partial<Expense>) => {
    // Add the site ID to the expense
    const expenseWithSiteId = {
      ...newExpense,
      siteId: site.id,
      supervisorId: site.supervisorId
    };
    
    onAddExpense(expenseWithSiteId);
    setIsExpenseFormOpen(false);
  };
  
  const handleAddAdvance = (newAdvance: Partial<Advance>) => {
    if (onAddAdvance) {
      // Add site ID to the advance
      const advanceWithSiteId = {
        ...newAdvance,
        siteId: site.id
      };
      onAddAdvance(advanceWithSiteId);
    }
    setIsAdvanceFormOpen(false);
  };

  const handleAddFunds = (newFunds: Partial<FundsReceived>) => {
    if (onAddFunds) {
      // Add site ID to the funds
      const fundsWithSiteId = {
        ...newFunds,
        siteId: site.id
      };
      onAddFunds(fundsWithSiteId);
    }
    setIsFundsFormOpen(false);
  };
  
  const handleCompleteSite = () => {
    if (completionDate) {
      onCompleteSite(site.id, completionDate);
      setIsCompletionDialogOpen(false);
      toast.success("Site marked as completed");
    } else {
      toast.error("Please select a completion date");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="sm" onClick={onBack}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Sites
        </Button>
        
        {!site.isCompleted ? (
          <Button 
            size="sm" 
            variant="outline" 
            className="ml-auto"
            onClick={() => setIsCompletionDialogOpen(true)}
          >
            <Check className="h-4 w-4 mr-2" />
            Mark as Completed
          </Button>
        ) : (
          <div className="ml-auto px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm flex items-center">
            <Check className="h-4 w-4 mr-1" />
            Completed
          </div>
        )}
      </div>
      
      <CustomCard className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h2 className="text-2xl font-bold">{site.name}</h2>
            <p className="text-muted-foreground">{site.jobName}</p>
            
            <div className="mt-4 space-y-2">
              <div className="flex">
                <span className="text-muted-foreground w-32">POS Number:</span>
                <span className="font-medium">{site.posNo}</span>
              </div>
              <div className="flex">
                <span className="text-muted-foreground w-32">Start Date:</span>
                <span className="font-medium">{format(ensureDate(site.startDate), 'PPP')}</span>
              </div>
              {site.completionDate && (
                <div className="flex">
                  <span className="text-muted-foreground w-32">Completion Date:</span>
                  <span className="font-medium">{format(ensureDate(site.completionDate), 'PPP')}</span>
                </div>
              )}
              <div className="flex">
                <span className="text-muted-foreground w-32">Status:</span>
                <span className={`font-medium ${site.isCompleted ? 'text-green-600' : 'text-yellow-600'}`}>
                  {site.isCompleted ? 'Completed' : 'In Progress'}
                </span>
              </div>
            </div>
          </div>
          
          <div className="bg-muted p-4 rounded-lg">
            <h3 className="font-semibold mb-3">Site Financial Summary</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Funds from HO:</span>
                <span className="font-medium text-green-600">₹{totalFundsReceived.toLocaleString()}</span>
              </div>
              <Separator className="my-1" />
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total Expenses:</span>
                <span className="font-medium text-red-600">₹{totalExpenses.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total Advances:</span>
                <span className="font-medium text-amber-600">₹{totalAdvances.toLocaleString()}</span>
              </div>
              <Separator className="my-1" />
              <div className="flex justify-between">
                <span className="font-medium">Current Balance:</span>
                <span className={`font-bold ${totalBalance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  ₹{totalBalance.toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        </div>
      </CustomCard>
      
      <div className="flex flex-wrap items-center gap-4 mt-6">
        <div className="flex-grow">
          <Tabs defaultValue="expenses" value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList>
              <TabsTrigger value="expenses">
                <Receipt className="h-4 w-4 mr-2" />
                Expenses
              </TabsTrigger>
              <TabsTrigger value="advances">
                <Wallet className="h-4 w-4 mr-2" />
                Advances
              </TabsTrigger>
              <TabsTrigger value="funds">
                <Building className="h-4 w-4 mr-2" />
                Funds from HO
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
        
        <div className="flex gap-2">
          <Button onClick={() => setIsExpenseFormOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            New Expense
          </Button>
          <Button onClick={() => setIsAdvanceFormOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            <Wallet className="h-4 w-4 mr-2" />
            New Advance
          </Button>
          <Button variant="outline" onClick={() => setIsFundsFormOpen(true)}>
            <DownloadCloud className="h-4 w-4 mr-2" />
            Funds Received
          </Button>
        </div>
      </div>
      
      <CustomCard>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsContent value="expenses" className="mt-0">
            {expenses.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b text-left">
                      <th className="pb-3 pl-4 font-medium text-muted-foreground">Date</th>
                      <th className="pb-3 font-medium text-muted-foreground">Description</th>
                      <th className="pb-3 font-medium text-muted-foreground">Category</th>
                      <th className="pb-3 font-medium text-muted-foreground">Amount</th>
                      <th className="pb-3 font-medium text-muted-foreground">Status</th>
                      <th className="pb-3 pr-4 font-medium text-muted-foreground text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {expenses.map((expense) => (
                      <tr key={expense.id} className="border-b last:border-0 hover:bg-muted/20 transition-colors">
                        <td className="py-4 pl-4 text-sm">{format(ensureDate(expense.date), 'MMM dd, yyyy')}</td>
                        <td className="py-4 text-sm">{expense.description}</td>
                        <td className="py-4 text-sm">
                          <span className={`${getCategoryColor(expense.category)} px-2 py-1 rounded-full text-xs font-medium`}>
                            {expense.category}
                          </span>
                        </td>
                        <td className="py-4 text-sm font-medium">₹{expense.amount.toLocaleString()}</td>
                        <td className="py-4 text-sm">
                          <span className={`${getStatusColor(expense.status)} px-2 py-1 rounded-full text-xs font-medium`}>
                            {expense.status}
                          </span>
                        </td>
                        <td className="py-4 pr-4 text-right">
                          <button className="p-1 rounded-md hover:bg-muted transition-colors">
                            <FileText className="h-4 w-4 text-muted-foreground" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-8 text-center">
                <p className="text-muted-foreground">No expenses have been recorded for this site yet.</p>
                <Button 
                  variant="outline" 
                  className="mt-4"
                  onClick={() => setIsExpenseFormOpen(true)}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add First Expense
                </Button>
              </div>
            )}
          </TabsContent>

          <TabsContent value="advances" className="mt-0">
            {advances.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b text-left">
                      <th className="pb-3 pl-4 font-medium text-muted-foreground">Date</th>
                      <th className="pb-3 font-medium text-muted-foreground">Recipient</th>
                      <th className="pb-3 font-medium text-muted-foreground">Purpose</th>
                      <th className="pb-3 font-medium text-muted-foreground">Amount</th>
                      <th className="pb-3 font-medium text-muted-foreground">Status</th>
                      <th className="pb-3 pr-4 font-medium text-muted-foreground text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {advances.map((advance) => (
                      <tr key={advance.id} className="border-b last:border-0 hover:bg-muted/20 transition-colors">
                        <td className="py-4 pl-4 text-sm">{format(ensureDate(advance.date), 'MMM dd, yyyy')}</td>
                        <td className="py-4 text-sm">{advance.recipientType}: {advance.recipientName}</td>
                        <td className="py-4 text-sm">
                          <div>
                            <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                              {advance.purpose}
                            </span>
                            {advance.remarks && (
                              <p className="text-xs text-muted-foreground mt-1">{advance.remarks}</p>
                            )}
                          </div>
                        </td>
                        <td className="py-4 text-sm font-medium">₹{advance.amount.toLocaleString()}</td>
                        <td className="py-4 text-sm">
                          <span className={`${getStatusColor(advance.status)} px-2 py-1 rounded-full text-xs font-medium`}>
                            {advance.status}
                          </span>
                        </td>
                        <td className="py-4 pr-4 text-right">
                          <button className="p-1 rounded-md hover:bg-muted transition-colors">
                            <FileText className="h-4 w-4 text-muted-foreground" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-8 text-center">
                <p className="text-muted-foreground">No advances have been recorded for this site yet.</p>
                <Button 
                  variant="outline" 
                  className="mt-4"
                  onClick={() => setIsAdvanceFormOpen(true)}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  <Wallet className="h-4 w-4 mr-2" />
                  Add First Advance
                </Button>
              </div>
            )}
          </TabsContent>

          <TabsContent value="funds" className="mt-0">
            {fundsReceived.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b text-left">
                      <th className="pb-3 pl-4 font-medium text-muted-foreground">Date</th>
                      <th className="pb-3 font-medium text-muted-foreground">Amount</th>
                      <th className="pb-3 pr-4 font-medium text-muted-foreground text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {fundsReceived.map((fund) => (
                      <tr key={fund.id} className="border-b last:border-0 hover:bg-muted/20 transition-colors">
                        <td className="py-4 pl-4 text-sm">{format(ensureDate(fund.date), 'MMM dd, yyyy')}</td>
                        <td className="py-4 text-sm font-medium text-green-600">₹{fund.amount.toLocaleString()}</td>
                        <td className="py-4 pr-4 text-right">
                          <button className="p-1 rounded-md hover:bg-muted transition-colors">
                            <FileText className="h-4 w-4 text-muted-foreground" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-8 text-center">
                <p className="text-muted-foreground">No funds have been recorded for this site yet.</p>
                <Button 
                  variant="outline" 
                  className="mt-4"
                  onClick={() => setIsFundsFormOpen(true)}
                >
                  <DownloadCloud className="h-4 w-4 mr-2" />
                  Record First Funds
                </Button>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CustomCard>
      
      {/* Expense Form Dialog */}
      <ExpenseForm
        isOpen={isExpenseFormOpen}
        onClose={() => setIsExpenseFormOpen(false)}
        onSubmit={handleAddExpense}
      />
      
      {/* Advance Form Dialog */}
      <AdvanceForm
        isOpen={isAdvanceFormOpen}
        onClose={() => setIsAdvanceFormOpen(false)}
        onSubmit={handleAddAdvance}
        siteId={site.id}
      />

      {/* Funds Received Form Dialog */}
      <FundsReceivedForm
        isOpen={isFundsFormOpen}
        onClose={() => setIsFundsFormOpen(false)}
        onSubmit={handleAddFunds}
        siteId={site.id}
      />
      
      {/* Site Completion Dialog */}
      <Dialog open={isCompletionDialogOpen} onOpenChange={setIsCompletionDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Mark Site as Completed</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="mb-4 text-muted-foreground">
              Please select the completion date for this site:
            </p>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant={"outline"}
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !completionDate && "text-muted-foreground"
                  )}
                >
                  {completionDate ? (
                    format(completionDate, "PPP")
                  ) : (
                    <span>Pick a date</span>
                  )}
                  <Calendar className="ml-auto h-4 w-4 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <CalendarComponent
                  mode="single"
                  selected={completionDate}
                  onSelect={setCompletionDate}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setIsCompletionDialogOpen(false)}>
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
            <Button 
              type="button" 
              onClick={handleCompleteSite}
              disabled={!completionDate}
            >
              <Check className="h-4 w-4 mr-2" />
              Confirm Completion
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SiteDetail;
