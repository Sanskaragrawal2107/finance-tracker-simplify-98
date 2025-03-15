import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/use-auth';
import { UserRole } from '@/lib/types';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Pencil, Trash2, Plus, FileText, DollarSign, Calendar } from 'lucide-react';

// Define expense status types
type ExpenseStatus = 'pending' | 'approved' | 'rejected' | 'paid';

// Define expense interface
interface Expense {
  id: string;
  title: string;
  amount: number;
  category: string;
  description: string;
  status: ExpenseStatus;
  created_at: string;
  user_id: string;
  user_name?: string;
}

const Expenses: React.FC = () => {
  const { user } = useAuth();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  
  // Form state
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  
  // Filter state
  const [statusFilter, setStatusFilter] = useState<ExpenseStatus | 'all'>('all');
  
  useEffect(() => {
    fetchExpenses();
  }, [user, statusFilter]);
  
  const fetchExpenses = async () => {
    try {
      setLoading(true);
      
      let query = supabase
        .from('expenses')
        .select(`
          *,
          users (
            name
          )
        `)
        .order('created_at', { ascending: false });
      
      // Apply filters
      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }
      
      // If not admin, only show user's own expenses
      if (user?.role !== UserRole.ADMIN) {
        query = query.eq('user_id', user?.id);
      }
      
      const { data, error } = await query;
      
      if (error) {
        throw error;
      }
      
      if (data) {
        const formattedExpenses = data.map(expense => ({
          ...expense,
          user_name: expense.users?.name || 'Unknown User'
        }));
        setExpenses(formattedExpenses);
      }
    } catch (error) {
      console.error('Error fetching expenses:', error);
      toast.error('Failed to load expenses');
    } finally {
      setLoading(false);
    }
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (!title || !amount || !category) {
        toast.error('Please fill in all required fields');
        return;
      }
      
      const numericAmount = parseFloat(amount);
      if (isNaN(numericAmount) || numericAmount <= 0) {
        toast.error('Please enter a valid amount');
        return;
      }
      
      const expenseData = {
        title,
        amount: numericAmount,
        category,
        description,
        status: 'pending' as ExpenseStatus,
        user_id: user?.id
      };
      
      if (editingExpense) {
        // Update existing expense
        const { error } = await supabase
          .from('expenses')
          .update(expenseData)
          .eq('id', editingExpense.id);
          
        if (error) throw error;
        toast.success('Expense updated successfully');
      } else {
        // Create new expense
        const { error } = await supabase
          .from('expenses')
          .insert(expenseData);
          
        if (error) throw error;
        toast.success('Expense submitted successfully');
      }
      
      // Reset form and close dialog
      resetForm();
      setOpenDialog(false);
      fetchExpenses();
      
    } catch (error) {
      console.error('Error submitting expense:', error);
      toast.error('Failed to submit expense');
    }
  };
  
  const handleEdit = (expense: Expense) => {
    setEditingExpense(expense);
    setTitle(expense.title);
    setAmount(expense.amount.toString());
    setCategory(expense.category);
    setDescription(expense.description || '');
    setOpenDialog(true);
  };
  
  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this expense?')) {
      try {
        const { error } = await supabase
          .from('expenses')
          .delete()
          .eq('id', id);
          
        if (error) throw error;
        
        toast.success('Expense deleted successfully');
        fetchExpenses();
      } catch (error) {
        console.error('Error deleting expense:', error);
        toast.error('Failed to delete expense');
      }
    }
  };
  
  const handleStatusChange = async (id: string, status: ExpenseStatus) => {
    try {
      const { error } = await supabase
        .from('expenses')
        .update({ status })
        .eq('id', id);
        
      if (error) throw error;
      
      toast.success(`Expense marked as ${status}`);
      fetchExpenses();
    } catch (error) {
      console.error('Error updating expense status:', error);
      toast.error('Failed to update expense status');
    }
  };
  
  const resetForm = () => {
    setTitle('');
    setAmount('');
    setCategory('');
    setDescription('');
    setEditingExpense(null);
  };
  
  const getStatusBadge = (status: ExpenseStatus) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">Pending</Badge>;
      case 'approved':
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Approved</Badge>;
      case 'rejected':
        return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">Rejected</Badge>;
      case 'paid':
        return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">Paid</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };
  
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };
  
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Expense Management</h1>
        <Button onClick={() => { resetForm(); setOpenDialog(true); }}>
          <Plus className="mr-2 h-4 w-4" /> Add Expense
        </Button>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Expenses</CardTitle>
          <CardDescription>
            View and manage all expenses
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <Label htmlFor="status-filter">Filter by Status</Label>
            <Select 
              value={statusFilter} 
              onValueChange={(value) => setStatusFilter(value as ExpenseStatus | 'all')}
            >
              <SelectTrigger id="status-filter" className="w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
            </div>
          ) : expenses.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No expenses found. Create your first expense by clicking the "Add Expense" button.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Date</TableHead>
                    {user?.role === UserRole.ADMIN && (
                      <TableHead>Submitted By</TableHead>
                    )}
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {expenses.map((expense) => (
                    <TableRow key={expense.id}>
                      <TableCell className="font-medium">{expense.title}</TableCell>
                      <TableCell>{formatCurrency(expense.amount)}</TableCell>
                      <TableCell>{expense.category}</TableCell>
                      <TableCell>{formatDate(expense.created_at)}</TableCell>
                      {user?.role === UserRole.ADMIN && (
                        <TableCell>{expense.user_name}</TableCell>
                      )}
                      <TableCell>{getStatusBadge(expense.status)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          {/* Only allow editing of pending expenses */}
                          {expense.status === 'pending' && (
                            <Button variant="outline" size="sm" onClick={() => handleEdit(expense)}>
                              <Pencil className="h-4 w-4" />
                            </Button>
                          )}
                          
                          {/* Only allow deletion of pending expenses */}
                          {expense.status === 'pending' && (
                            <Button variant="outline" size="sm" onClick={() => handleDelete(expense.id)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                          
                          {/* Admin actions for expense approval */}
                          {user?.role === UserRole.ADMIN && expense.status === 'pending' && (
                            <>
                              <Button 
                                variant="outline" 
                                size="sm" 
                                className="bg-green-50 text-green-700 hover:bg-green-100"
                                onClick={() => handleStatusChange(expense.id, 'approved')}
                              >
                                Approve
                              </Button>
                              <Button 
                                variant="outline" 
                                size="sm" 
                                className="bg-red-50 text-red-700 hover:bg-red-100"
                                onClick={() => handleStatusChange(expense.id, 'rejected')}
                              >
                                Reject
                              </Button>
                            </>
                          )}
                          
                          {/* Admin action to mark as paid */}
                          {user?.role === UserRole.ADMIN && expense.status === 'approved' && (
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="bg-blue-50 text-blue-700 hover:bg-blue-100"
                              onClick={() => handleStatusChange(expense.id, 'paid')}
                            >
                              Mark Paid
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
      
      <Dialog open={openDialog} onOpenChange={setOpenDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{editingExpense ? 'Edit Expense' : 'Add New Expense'}</DialogTitle>
            <DialogDescription>
              {editingExpense 
                ? 'Update the expense details below' 
                : 'Fill in the expense details to submit for approval'}
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleSubmit}>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Expense title"
                  required
                />
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="amount">Amount</Label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="amount"
                    type="number"
                    step="0.01"
                    min="0.01"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0.00"
                    className="pl-9"
                    required
                  />
                </div>
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="category">Category</Label>
                <Select 
                  value={category} 
                  onValueChange={setCategory}
                  required
                >
                  <SelectTrigger id="category">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="travel">Travel</SelectItem>
                    <SelectItem value="meals">Meals</SelectItem>
                    <SelectItem value="supplies">Supplies</SelectItem>
                    <SelectItem value="equipment">Equipment</SelectItem>
                    <SelectItem value="services">Services</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Provide details about this expense"
                  rows={3}
                />
              </div>
            </div>
            
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpenDialog(false)}>
                Cancel
              </Button>
              <Button type="submit">
                {editingExpense ? 'Update Expense' : 'Submit Expense'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Expenses;
