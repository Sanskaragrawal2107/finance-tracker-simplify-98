
import React, { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { IndianRupee, RefreshCw } from 'lucide-react';
import CustomCard from '../ui/CustomCard';
import { BalanceSummary } from '@/lib/types';
import { Button } from '../ui/button';
import { calculateSiteFinancialSummary } from '@/integrations/supabase/client';

interface BalanceCardProps {
  balanceData: BalanceSummary;
  className?: string;
  siteId?: string;
  refreshData?: () => void;
}

const BalanceCard: React.FC<BalanceCardProps> = ({ 
  balanceData,
  className,
  siteId,
  refreshData
}) => {
  const [localBalanceData, setLocalBalanceData] = useState<BalanceSummary>(balanceData);
  const [isLoading, setIsLoading] = useState(false);

  // Initialize with props data
  useEffect(() => {
    setLocalBalanceData(balanceData);
  }, [balanceData]);

  // If siteId is provided, we can refresh the data directly from the database
  const handleRefresh = async () => {
    if (!siteId) {
      if (refreshData) refreshData();
      return;
    }

    setIsLoading(true);
    try {
      const summary = await calculateSiteFinancialSummary(siteId);
      if (summary) {
        setLocalBalanceData(summary);
      }
    } catch (error) {
      console.error("Error refreshing balance data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Ensure all properties have default values to prevent TypeScript errors
  const safeBalanceData = {
    fundsReceived: localBalanceData?.fundsReceived || 0,
    totalExpenditure: localBalanceData?.totalExpenditure || 0,
    totalAdvances: localBalanceData?.totalAdvances || 0,
    debitsToWorker: localBalanceData?.debitsToWorker || 0,
    invoicesPaid: localBalanceData?.invoicesPaid || 0,
    pendingInvoices: localBalanceData?.pendingInvoices || 0,
    totalBalance: localBalanceData?.totalBalance || 0
  };

  return (
    <CustomCard 
      className={cn("bg-primary text-primary-foreground", className)}
      hoverEffect
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-semibold uppercase">Site Financial Summary</h3>
        <div className="flex items-center space-x-2">
          <Button 
            size="icon" 
            variant="ghost" 
            onClick={handleRefresh} 
            disabled={isLoading} 
            className="bg-white/20 rounded-full hover:bg-white/30"
          >
            <RefreshCw className={cn("h-5 w-5", isLoading && "animate-spin")} />
          </Button>
          <div className="p-2 bg-white/20 rounded-full">
            <IndianRupee className="h-5 w-5" />
          </div>
        </div>
      </div>
      
      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <p className="text-sm opacity-80 uppercase">Funds Received from HO:</p>
          <p className="text-lg font-semibold">₹{safeBalanceData.fundsReceived.toLocaleString()}</p>
        </div>
        
        <div className="flex justify-between items-center">
          <p className="text-sm opacity-80 uppercase">Total Expenses paid by supervisor:</p>
          <p className="text-lg font-semibold">₹{safeBalanceData.totalExpenditure.toLocaleString()}</p>
        </div>
        
        <div className="flex justify-between items-center">
          <p className="text-sm opacity-80 uppercase">Total Advances paid by supervisor:</p>
          <p className="text-lg font-semibold">₹{safeBalanceData.totalAdvances.toLocaleString()}</p>
        </div>
        
        <div className="flex justify-between items-center">
          <p className="text-sm opacity-80 uppercase">Debits TO worker:</p>
          <p className="text-lg font-semibold">₹{safeBalanceData.debitsToWorker.toLocaleString()}</p>
        </div>
        
        <div className="flex justify-between items-center">
          <p className="text-sm opacity-80 uppercase">Invoices paid by supervisor:</p>
          <p className="text-lg font-semibold">₹{safeBalanceData.invoicesPaid.toLocaleString()}</p>
        </div>
        
        <div className="pt-3 border-t border-white/20">
          <div className="flex justify-between items-center">
            <p className="text-sm opacity-80 uppercase">Current Balance:</p>
            <p className="text-xl font-bold">₹{safeBalanceData.totalBalance.toLocaleString()}</p>
          </div>
        </div>
      </div>
    </CustomCard>
  );
};

export default BalanceCard;
