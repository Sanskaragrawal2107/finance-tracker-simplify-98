
import React, { useState } from 'react';
import { format } from 'date-fns';
import { Calendar, ArrowLeft, Plus, Check, X, FileText } from 'lucide-react';
import { Site, Expense, ExpenseCategory, ApprovalStatus } from '@/lib/types';
import CustomCard from '@/components/ui/CustomCard';
import { Button } from '@/components/ui/button';
import ExpenseForm from '@/components/expenses/ExpenseForm';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';

interface SiteDetailProps {
  site: Site;
  expenses: Expense[];
  onBack: () => void;
  onAddExpense: (expense: Partial<Expense>) => void;
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
  onBack, 
  onAddExpense,
  onCompleteSite
}) => {
  const [isExpenseFormOpen, setIsExpenseFormOpen] = useState(false);
  const [isCompletionDialogOpen, setIsCompletionDialogOpen] = useState(false);
  const [completionDate, setCompletionDate] = useState<Date | undefined>(site.completionDate);
  
  const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0);
  
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
                <span className="font-medium">{format(site.startDate, 'PPP')}</span>
              </div>
              {site.completionDate && (
                <div className="flex">
                  <span className="text-muted-foreground w-32">Completion Date:</span>
                  <span className="font-medium">{format(site.completionDate, 'PPP')}</span>
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
            <h3 className="font-semibold mb-2">Expense Summary</h3>
            <div className="flex justify-between mb-2">
              <span className="text-muted-foreground">Total Expenses:</span>
              <span className="font-medium">₹{totalExpenses.toLocaleString()}</span>
            </div>
            <div className="flex justify-between mb-2">
              <span className="text-muted-foreground">Total Entries:</span>
              <span className="font-medium">{expenses.length}</span>
            </div>
          </div>
        </div>
      </CustomCard>
      
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Site Expenses</h3>
        <Button onClick={() => setIsExpenseFormOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          New Expense
        </Button>
      </div>
      
      <CustomCard>
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
                    <td className="py-4 pl-4 text-sm">{format(expense.date, 'MMM dd, yyyy')}</td>
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
      </CustomCard>
      
      {/* Expense Form Dialog */}
      <ExpenseForm
        isOpen={isExpenseFormOpen}
        onClose={() => setIsExpenseFormOpen(false)}
        onSubmit={handleAddExpense}
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
