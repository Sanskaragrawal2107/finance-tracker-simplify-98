
import React from 'react';
import { cn } from '@/lib/utils';
import { IndianRupee } from 'lucide-react';
import CustomCard from '../ui/CustomCard';
import { BalanceSummary } from '@/lib/types';

interface BalanceCardProps {
  balanceData: BalanceSummary;
  className?: string;
}

const BalanceCard: React.FC<BalanceCardProps> = ({ 
  balanceData,
  className 
}) => {
  // Ensure all properties have default values to prevent TypeScript errors
  const safeBalanceData = {
    fundsReceived: balanceData.fundsReceived || 0,
    totalExpenditure: balanceData.totalExpenditure || 0,
    totalAdvances: balanceData.totalAdvances || 0,
    debitsToWorker: balanceData.debitsToWorker || 0,
    invoicesPaid: balanceData.invoicesPaid || 0,
    totalBalance: balanceData.totalBalance || 0
  };

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
