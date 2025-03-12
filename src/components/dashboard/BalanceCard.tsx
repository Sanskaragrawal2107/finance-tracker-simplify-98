import React, { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { IndianRupee } from 'lucide-react';
import CustomCard from '../ui/CustomCard';
import { BalanceSummary } from '@/lib/types';

interface BalanceCardProps {
  balanceData: BalanceSummary | Promise<BalanceSummary>;
  className?: string;
}

const BalanceCard: React.FC<BalanceCardProps> = ({ 
  balanceData,
  className 
}) => {
  const [summary, setSummary] = useState<BalanceSummary>({
    fundsReceived: 0,
    totalExpenditure: 0,
    totalAdvances: 0,
    debitsToWorker: 0,
    invoicesPaid: 0,
    pendingInvoices: 0,
    totalBalance: 0
  });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        if (balanceData instanceof Promise) {
          const resolvedData = await balanceData;
          setSummary(resolvedData);
        } else {
          setSummary(balanceData);
        }
      } catch (error) {
        console.error("Error resolving balance data:", error);
        // Keep default values in case of error
      } finally {
        setIsLoading(false);
      }
    };
    
    loadData();
  }, [balanceData]);

  return (
    <CustomCard 
      className={cn("bg-primary text-primary-foreground", className)}
      hoverEffect
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-semibold uppercase">Site Financial Summary</h3>
        <div className="p-2 bg-white/20 rounded-full">
          <IndianRupee className="h-5 w-5" />
        </div>
      </div>
      
      {isLoading ? (
        <div className="space-y-3 animate-pulse">
          <div className="h-6 bg-white/20 rounded"></div>
          <div className="h-6 bg-white/20 rounded"></div>
          <div className="h-6 bg-white/20 rounded"></div>
          <div className="h-6 bg-white/20 rounded"></div>
          <div className="h-6 bg-white/20 rounded"></div>
          <div className="h-8 bg-white/20 rounded mt-4"></div>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <p className="text-sm opacity-80 uppercase">Funds Received from HO:</p>
            <p className="text-lg font-semibold">₹{summary.fundsReceived.toLocaleString()}</p>
          </div>
          
          <div className="flex justify-between items-center">
            <p className="text-sm opacity-80 uppercase">Total Expenses paid by supervisor:</p>
            <p className="text-lg font-semibold">₹{summary.totalExpenditure.toLocaleString()}</p>
          </div>
          
          <div className="flex justify-between items-center">
            <p className="text-sm opacity-80 uppercase">Total Advances paid by supervisor:</p>
            <p className="text-lg font-semibold">₹{summary.totalAdvances.toLocaleString()}</p>
          </div>
          
          <div className="flex justify-between items-center">
            <p className="text-sm opacity-80 uppercase">Debits TO worker:</p>
            <p className="text-lg font-semibold">₹{summary.debitsToWorker.toLocaleString()}</p>
          </div>
          
          <div className="flex justify-between items-center">
            <p className="text-sm opacity-80 uppercase">Invoices paid by supervisor:</p>
            <p className="text-lg font-semibold">₹{summary.invoicesPaid.toLocaleString()}</p>
          </div>
          
          <div className="pt-3 border-t border-white/20">
            <div className="flex justify-between items-center">
              <p className="text-sm opacity-80 uppercase">Current Balance:</p>
              <p className="text-xl font-bold">₹{summary.totalBalance.toLocaleString()}</p>
            </div>
          </div>
        </div>
      )}
    </CustomCard>
  );
};

export default BalanceCard;
