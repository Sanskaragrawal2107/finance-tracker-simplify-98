
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
        <h3 className="text-xl font-semibold">Total Balance</h3>
        <div className="p-2 bg-white/20 rounded-full">
          <IndianRupee className="h-5 w-5" />
        </div>
      </div>
      
      <div className="mb-6">
        <p className="text-3xl font-bold">
          ₹{balanceData.totalBalance.toLocaleString()}
        </p>
        <p className="text-sm opacity-80 mt-1">Available Balance</p>
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <p className="text-sm opacity-80">Total Funds Received</p>
          <p className="text-lg font-semibold">₹{balanceData.fundsReceived.toLocaleString()}</p>
        </div>
        <div className="space-y-1">
          <p className="text-sm opacity-80">Total Expenditure</p>
          <p className="text-lg font-semibold">₹{balanceData.totalExpenditure.toLocaleString()}</p>
        </div>
      </div>
    </CustomCard>
  );
};

export default BalanceCard;
