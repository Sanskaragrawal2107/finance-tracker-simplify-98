
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Button } from '../ui/button';
import { motion } from 'framer-motion';
import { Edit, Trash, ArrowUpRight, Plus } from 'lucide-react';
import { formatCurrency } from '../../lib/utils';
import { toast } from 'sonner';
import ExpenseForm from '../expenses/ExpenseForm';
import FundsReceivedForm from '../funds/FundsReceivedForm';

const SiteDetailTransactions = ({ site }) => {
  const [activeTab, setActiveTab] = useState('expenses');
  const [isExpenseFormOpen, setIsExpenseFormOpen] = useState(false);
  const [isFundsFormOpen, setIsFundsFormOpen] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState(null);
  const [selectedFund, setSelectedFund] = useState(null);

  const { data: expenses, isLoading: expensesLoading, refetch: refetchExpenses } = useQuery({
    queryKey: ['site-expenses', site?.id],
    queryFn: async () => {
      if (!site?.id) return [];
      
      const { data, error } = await supabase
        .from('expenses')
        .select('*')
        .eq('site_id', site.id)
        .order('date', { ascending: false });
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!site?.id,
  });

  const { data: funds, isLoading: fundsLoading, refetch: refetchFunds } = useQuery({
    queryKey: ['site-funds', site?.id],
    queryFn: async () => {
      if (!site?.id) return [];
      
      const { data, error } = await supabase
        .from('funds_received')
        .select('*')
        .eq('site_id', site.id)
        .order('date', { ascending: false });
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!site?.id,
  });

  const handleExpenseEdit = (expense) => {
    setSelectedExpense(expense);
    setIsExpenseFormOpen(true);
  };

  const handleFundEdit = (fund) => {
    setSelectedFund(fund);
    setIsFundsFormOpen(true);
  };

  const handleExpenseDelete = async (expenseId) => {
    try {
      const { error } = await supabase
        .from('expenses')
        .delete()
        .eq('id', expenseId);
      
      if (error) throw error;
      
      toast.success('Expense deleted successfully');
      refetchExpenses();
    } catch (error) {
      toast.error(`Error deleting expense: ${error.message}`);
    }
  };

  const handleFundDelete = async (fundId) => {
    try {
      const { error } = await supabase
        .from('funds_received')
        .delete()
        .eq('id', fundId);
      
      if (error) throw error;
      
      toast.success('Fund record deleted successfully');
      refetchFunds();
    } catch (error) {
      toast.error(`Error deleting fund record: ${error.message}`);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const handleExpenseSuccess = () => {
    setIsExpenseFormOpen(false);
    setSelectedExpense(null);
    refetchExpenses();
  };

  const handleFundSuccess = () => {
    setIsFundsFormOpen(false);
    setSelectedFund(null);
    refetchFunds();
  };

  const fadeIn = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.3 } }
  };

  return (
    <div className="mt-4">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="flex justify-between items-center mb-4">
          <TabsList className="bg-gray-100/50 backdrop-blur-sm">
            <TabsTrigger value="expenses" className="data-[state=active]:bg-white">
              Expenses
            </TabsTrigger>
            <TabsTrigger value="funds" className="data-[state=active]:bg-white">
              Funds Received
            </TabsTrigger>
          </TabsList>
          
          {activeTab === 'expenses' ? (
            <Button 
              onClick={() => {
                setSelectedExpense(null);
                setIsExpenseFormOpen(true);
              }}
              className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white"
            >
              <Plus size={16} className="mr-1" /> Add Expense
            </Button>
          ) : (
            <Button 
              onClick={() => {
                setSelectedFund(null);
                setIsFundsFormOpen(true);
              }}
              className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white"
            >
              <Plus size={16} className="mr-1" /> Add Funds
            </Button>
          )}
        </div>

        {isExpenseFormOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="mb-8"
          >
            <ExpenseForm
              expense={selectedExpense}
              initialSiteId={site.id}
              onSubmitSuccess={handleExpenseSuccess}
              onCancel={() => {
                setIsExpenseFormOpen(false);
                setSelectedExpense(null);
              }}
            />
          </motion.div>
        )}

        {isFundsFormOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="mb-8"
          >
            <FundsReceivedForm
              fundReceived={selectedFund}
              initialSiteId={site.id}
              onSubmitSuccess={handleFundSuccess}
              onCancel={() => {
                setIsFundsFormOpen(false);
                setSelectedFund(null);
              }}
            />
          </motion.div>
        )}

        <TabsContent value="expenses">
          <motion.div 
            initial="hidden" 
            animate="visible" 
            variants={fadeIn}
            className="mt-4"
          >
            <Card className="bg-white/80 backdrop-blur-md shadow-xl border border-gray-100">
              <CardHeader>
                <CardTitle className="text-xl font-bold">Site Expenses</CardTitle>
              </CardHeader>
              <CardContent>
                {expensesLoading ? (
                  <div className="text-center py-10">Loading expenses...</div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full bg-transparent">
                      <thead>
                        <tr className="border-b border-gray-200">
                          <th className="px-6 py-4 text-left text-sm font-medium text-gray-700">Date</th>
                          <th className="px-6 py-4 text-left text-sm font-medium text-gray-700">Category</th>
                          <th className="px-6 py-4 text-left text-sm font-medium text-gray-700">Description</th>
                          <th className="px-6 py-4 text-left text-sm font-medium text-gray-700">Amount</th>
                          <th className="px-6 py-4 text-left text-sm font-medium text-gray-700">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {expenses && expenses.length > 0 ? (
                          expenses.map((expense) => (
                            <tr key={expense.id} className="hover:bg-gray-50 transition-colors">
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                                {formatDate(expense.date)}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                                {expense.category}
                              </td>
                              <td className="px-6 py-4 text-sm text-gray-700 max-w-xs truncate">
                                {expense.description || 'No description'}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                {formatCurrency(expense.amount)}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => handleExpenseEdit(expense)}
                                  className="text-indigo-600 hover:bg-indigo-50 border-indigo-200 mr-2"
                                >
                                  <Edit size={16} />
                                </Button>
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => handleExpenseDelete(expense.id)}
                                  className="text-red-600 hover:bg-red-50 border-red-200"
                                >
                                  <Trash size={16} />
                                </Button>
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={5} className="px-6 py-4 text-center text-gray-500">
                              No expenses found for this site
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>

        <TabsContent value="funds">
          <motion.div 
            initial="hidden" 
            animate="visible" 
            variants={fadeIn}
            className="mt-4"
          >
            <Card className="bg-white/80 backdrop-blur-md shadow-xl border border-gray-100">
              <CardHeader>
                <CardTitle className="text-xl font-bold">Funds Received</CardTitle>
              </CardHeader>
              <CardContent>
                {fundsLoading ? (
                  <div className="text-center py-10">Loading funds...</div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full bg-transparent">
                      <thead>
                        <tr className="border-b border-gray-200">
                          <th className="px-6 py-4 text-left text-sm font-medium text-gray-700">Date</th>
                          <th className="px-6 py-4 text-left text-sm font-medium text-gray-700">Amount</th>
                          <th className="px-6 py-4 text-left text-sm font-medium text-gray-700">Method</th>
                          <th className="px-6 py-4 text-left text-sm font-medium text-gray-700">Reference</th>
                          <th className="px-6 py-4 text-left text-sm font-medium text-gray-700">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {funds && funds.length > 0 ? (
                          funds.map((fund) => (
                            <tr key={fund.id} className="hover:bg-gray-50 transition-colors">
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                                {formatDate(fund.date)}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                {formatCurrency(fund.amount)}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                                {fund.method || 'N/A'}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                                {fund.reference || 'N/A'}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => handleFundEdit(fund)}
                                  className="text-indigo-600 hover:bg-indigo-50 border-indigo-200 mr-2"
                                >
                                  <Edit size={16} />
                                </Button>
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => handleFundDelete(fund.id)}
                                  className="text-red-600 hover:bg-red-50 border-red-200"
                                >
                                  <Trash size={16} />
                                </Button>
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={5} className="px-6 py-4 text-center text-gray-500">
                              No funds received for this site
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SiteDetailTransactions;
