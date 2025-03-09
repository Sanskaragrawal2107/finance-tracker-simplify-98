
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
  return (
    <CustomCard 
      className={cn("bg-primary text-primary-foreground", className)}
      hoverEffect
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-semibold">Site Financial Summary</h3>
        <div className="p-2 bg-white/20 rounded-full">
          <IndianRupee className="h-5 w-5" />
        </div>
      </div>
      
      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <p className="text-sm opacity-80">Funds Received from HO:</p>
          <p className="text-lg font-semibold">₹{balanceData.fundsReceived.toLocaleString()}</p>
        </div>
        
        <div className="flex justify-between items-center">
          <p className="text-sm opacity-80">Total Expenses paid by supervisor:</p>
          <p className="text-lg font-semibold">₹{balanceData.totalExpenditure.toLocaleString()}</p>
        </div>
        
        <div className="flex justify-between items-center">
          <p className="text-sm opacity-80">Total Advances paid by supervisor:</p>
          <p className="text-lg font-semibold">₹{(balanceData.totalAdvances || 0).toLocaleString()}</p>
        </div>
        
        <div className="flex justify-between items-center">
          <p className="text-sm opacity-80">Debits TO worker:</p>
          <p className="text-lg font-semibold">₹{(balanceData.debitsToWorker || 0).toLocaleString()}</p>
        </div>
        
        <div className="flex justify-between items-center">
          <p className="text-sm opacity-80">Invoices paid by supervisor:</p>
          <p className="text-lg font-semibold">₹{(balanceData.invoicesPaid || 0).toLocaleString()}</p>
        </div>
        
        <div className="pt-3 border-t border-white/20">
          <div className="flex justify-between items-center">
            <p className="text-sm opacity-80">Current Balance:</p>
            <p className="text-xl font-bold">₹{balanceData.totalBalance.toLocaleString()}</p>
          </div>
        </div>
      </div>
    </CustomCard>
  );
};

export default BalanceCard;
