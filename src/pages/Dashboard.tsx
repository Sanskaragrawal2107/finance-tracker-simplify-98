
import React, { useState, useEffect } from 'react';
import PageTitle from '@/components/common/PageTitle';
import BalanceCard from '@/components/dashboard/BalanceCard';
import StatCard from '@/components/dashboard/StatCard';
import HODebitsCard from '@/components/dashboard/HODebitsCard';
import ExpenseChart from '@/components/dashboard/ExpenseChart';
import RecentActivity from '@/components/dashboard/RecentActivity';
import { BarChart3, IndianRupee, FileText, Wallet, Building2, ArrowRight } from 'lucide-react';
import { Activity, ActivityType, BalanceSummary, ChartDataPoint } from '@/lib/types';
import { useIsMobile } from '@/hooks/use-mobile';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const Dashboard: React.FC = () => {
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [balanceData, setBalanceData] = useState<BalanceSummary>({
    totalBalance: 0,
    fundsReceived: 0,
    totalExpenditure: 0,
    totalAdvances: 0,
    debitsToWorker: 0,
    invoicesPaid: 0,
    pendingInvoices: 0,
  });
  const [hoDebitsTotal, setHoDebitsTotal] = useState(0);
  const [expenseChartData, setExpenseChartData] = useState<ChartDataPoint[]>([]);
  const [categoryChartData, setCategoryChartData] = useState<ChartDataPoint[]>([]);
  const [recentActivities, setRecentActivities] = useState<Activity[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch totals across all sites
        const [
          fundsResult, 
          expensesResult, 
          advancesResult, 
          invoicesResult
        ] = await Promise.all([
          supabase.from('funds_received').select('amount').order('date', { ascending: false }),
          supabase.from('expenses').select('amount, category, date').order('date', { ascending: false }),
          supabase.from('advances').select('amount, purpose').order('date', { ascending: false }),
          supabase.from('invoices').select('net_amount, payment_status, date').order('date', { ascending: false })
        ]);
        
        if (fundsResult.error) throw fundsResult.error;
        if (expensesResult.error) throw expensesResult.error;
        if (advancesResult.error) throw advancesResult.error;
        if (invoicesResult.error) throw invoicesResult.error;
        
        // Calculate totals
        const totalFunds = fundsResult.data?.reduce((sum, fund) => sum + fund.amount, 0) || 0;
        const totalExpenses = expensesResult.data?.reduce((sum, expense) => sum + expense.amount, 0) || 0;
        const totalAdvances = advancesResult.data?.reduce((sum, advance) => sum + advance.amount, 0) || 0;
        
        const paidInvoices = invoicesResult.data?.filter(invoice => invoice.payment_status === 'paid') || [];
        const pendingInvoices = invoicesResult.data?.filter(invoice => invoice.payment_status === 'pending') || [];
        
        const paidInvoicesTotal = paidInvoices.reduce((sum, invoice) => sum + invoice.net_amount, 0);
        const pendingInvoicesTotal = pendingInvoices.reduce((sum, invoice) => sum + invoice.net_amount, 0);
        
        setBalanceData({
          totalBalance: totalFunds - totalExpenses - totalAdvances - paidInvoicesTotal,
          fundsReceived: totalFunds,
          totalExpenditure: totalExpenses,
          totalAdvances: totalAdvances,
          debitsToWorker: 0, // Calculate if needed
          invoicesPaid: paidInvoicesTotal,
          pendingInvoices: pendingInvoicesTotal,
        });
        
        // Prepare expense chart data
        if (expensesResult.data) {
          // Group expenses by month
          const expensesByMonth: Record<string, number> = {};
          const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
          
          expensesResult.data.forEach(expense => {
            const date = new Date(expense.date);
            const monthKey = months[date.getMonth()];
            
            if (!expensesByMonth[monthKey]) {
              expensesByMonth[monthKey] = 0;
            }
            
            expensesByMonth[monthKey] += expense.amount;
          });
          
          const chartData: ChartDataPoint[] = Object.entries(expensesByMonth)
            .map(([name, value]) => ({ name, value }))
            .slice(0, 7); // Only take the last 7 months
            
          setExpenseChartData(chartData);
          
          // Group expenses by category
          const expensesByCategory: Record<string, number> = {};
          let totalCategorizedExpenses = 0;
          
          expensesResult.data.forEach(expense => {
            const category = expense.category;
            
            if (!expensesByCategory[category]) {
              expensesByCategory[category] = 0;
            }
            
            expensesByCategory[category] += expense.amount;
            totalCategorizedExpenses += expense.amount;
          });
          
          // Convert to percentages
          const categoryData: ChartDataPoint[] = Object.entries(expensesByCategory)
            .map(([name, amount]) => ({ 
              name, 
              value: Math.round((amount / totalCategorizedExpenses) * 100) 
            }))
            .sort((a, b) => b.value - a.value)
            .slice(0, 5); // Show top 5 categories
            
          setCategoryChartData(categoryData);
        }
        
        // Prepare recent activities
        const recentActivitiesArray: Activity[] = [];
        
        // Add funds activities
        if (fundsResult.data && fundsResult.data.length > 0) {
          const recentFund = fundsResult.data[0];
          
          recentActivitiesArray.push({
            id: 'fund-1',
            type: ActivityType.FUNDS,
            description: 'Funds received',
            amount: recentFund.amount,
            date: new Date(),
            user: 'Admin'
          });
        }
        
        // Add expense activities
        if (expensesResult.data && expensesResult.data.length > 0) {
          expensesResult.data.slice(0, 2).forEach((expense, index) => {
            recentActivitiesArray.push({
              id: `expense-${index}`,
              type: ActivityType.EXPENSE,
              description: `Expense for ${expense.category}`,
              amount: expense.amount,
              date: new Date(expense.date),
              user: 'Supervisor'
            });
          });
        }
        
        // Add invoice activities
        if (invoicesResult.data && invoicesResult.data.length > 0) {
          invoicesResult.data.slice(0, 2).forEach((invoice, index) => {
            recentActivitiesArray.push({
              id: `invoice-${index}`,
              type: ActivityType.INVOICE,
              description: `Invoice ${invoice.payment_status === 'paid' ? 'paid' : 'received'}`,
              amount: invoice.net_amount,
              date: new Date(invoice.date),
              user: 'Supervisor'
            });
          });
        }
        
        setRecentActivities(recentActivitiesArray);
        
      } catch (error: any) {
        console.error('Error fetching dashboard data:', error.message);
        toast.error('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);

  return (
    <div className="space-y-6 animate-fade-in pb-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
        <PageTitle 
          title="Dashboard" 
          subtitle="Overview of your financial data and recent activities"
          className="mb-0"
        />
        
        <Button 
          onClick={() => navigate('/expenses')}
          className="self-start sm:self-center"
        >
          Go to Sites & Expenses
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
      
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <span className="ml-2">Loading data...</span>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
            <BalanceCard 
              balanceData={balanceData} 
              className="md:col-span-1"
            />
            
            <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6">
              <StatCard 
                title="Total Expenditure" 
                value={balanceData.totalExpenditure} 
                icon={BarChart3}
                valuePrefix="₹"
              />
              <StatCard 
                title="Total Advances" 
                value={balanceData.totalAdvances || 0} 
                icon={Wallet}
                valuePrefix="₹"
              />
              <StatCard 
                title="Pending Invoices" 
                value={balanceData.pendingInvoices || 0} 
                icon={FileText}
                valuePrefix="₹"
              />
              <HODebitsCard 
                totalDebits={hoDebitsTotal}
                valuePrefix="₹"
              />
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
            <ExpenseChart 
              data={expenseChartData} 
              title="Monthly Expenses"
              className="md:col-span-2"
            />
            <RecentActivity 
              activities={recentActivities} 
              className="md:col-span-1"
            />
          </div>
          
          {categoryChartData.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
              <ExpenseChart 
                data={categoryChartData} 
                title="Expense Categories (%)"
              />
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Dashboard;
