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

  useEffect(() => {
    const loadData = async () => {
      if (balanceData instanceof Promise) {
        try {
          const resolvedData = await balanceData;
          setSummary({
            fundsReceived: resolvedData.fundsReceived || 0,
            totalExpenditure: resolvedData.totalExpenditure || 0,
            totalAdvances: resolvedData.totalAdvances || 0,
            debitsToWorker: resolvedData.debitsToWorker || 0,
            invoicesPaid: resolvedData.invoicesPaid || 0,
            pendingInvoices: resolvedData.pendingInvoices || 0,
            totalBalance: resolvedData.totalBalance || 0
          });
        } catch (error) {
          console.error("Error resolving balance data:", error);
          // Keep default values in case of error
        }
      } else {
        setSummary({
          fundsReceived: balanceData.fundsReceived || 0,
          totalExpenditure: balanceData.totalExpenditure || 0,
          totalAdvances: balanceData.totalAdvances || 0,
          debitsToWorker: balanceData.debitsToWorker || 0,
          invoicesPaid: balanceData.invoicesPaid || 0,
          pendingInvoices: balanceData.pendingInvoices || 0,
          totalBalance: balanceData.totalBalance || 0
        });
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
    </CustomCard>
  );
};

export default BalanceCard;
