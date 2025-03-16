
import React, { useState } from 'react';
import { Button } from '../components/ui/button';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../integrations/supabase/client';
import ExpenseForm from '../components/expenses/ExpenseForm';
import { cn } from '../lib/utils';
import PageTitle from '../components/common/PageTitle';
import { PlusCircle } from 'lucide-react';
import { Card } from '../components/ui/card';
import { motion } from 'framer-motion';

const Expenses = () => {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState(null);

  const { data: expenses, isLoading, refetch } = useQuery({
    queryKey: ['expenses'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('expenses')
        .select('*, sites(name)')
        .order('date', { ascending: false });
      
      if (error) {
        throw new Error(error.message);
      }
      
      return data;
    }
  });

  const onExpenseAdded = () => {
    setIsFormOpen(false);
    refetch();
  };

  const handleOpenForm = (expense = null) => {
    setSelectedExpense(expense);
    setIsFormOpen(true);
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setSelectedExpense(null);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const fadeIn = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
  };

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
        <PageTitle title="Expense Management" subtitle="Manage and track all site expenses" />
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
        >
          <Button 
            onClick={() => handleOpenForm()}
            className="mt-4 md:mt-0 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white shadow-lg transition-all duration-300 flex items-center gap-2"
          >
            <PlusCircle size={18} />
            Add Expense
          </Button>
        </motion.div>
      </div>

      {isFormOpen && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          className="mb-8"
        >
          <ExpenseForm
            expense={selectedExpense}
            onSubmitSuccess={onExpenseAdded}
            onCancel={handleCloseForm}
          />
        </motion.div>
      )}

      <div className="mt-8 grid grid-cols-1 gap-6">
        <motion.div initial="hidden" animate="visible" variants={fadeIn}>
          <Card className="bg-white/80 backdrop-blur-md shadow-xl border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full bg-transparent">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-700">Date</th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-700">Site</th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-700">Category</th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-700">Description</th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-700">Amount</th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-700">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {isLoading ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-4 text-center text-gray-500">Loading expenses...</td>
                    </tr>
                  ) : expenses && expenses.length > 0 ? (
                    expenses.map((expense) => (
                      <tr key={expense.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                          {formatDate(expense.date)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                          {expense.sites?.name || 'Unknown Site'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                          {expense.category}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-700 max-w-xs truncate">
                          {expense.description || 'No description'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          ${parseFloat(expense.amount).toFixed(2)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleOpenForm(expense)}
                            className="text-indigo-600 hover:bg-indigo-50 border-indigo-200"
                          >
                            Edit
                          </Button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="px-6 py-4 text-center text-gray-500">No expenses found</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};

export default Expenses;
