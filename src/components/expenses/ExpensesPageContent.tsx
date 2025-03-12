
import React from 'react';
import SiteDetail from '@/components/sites/SiteDetail';
import { Expense, Advance, Invoice, FundsReceived, BalanceSummary } from '@/lib/types';

interface ExpensesPageContentProps {
  site: any;
  expenses: Expense[];
  advances: Advance[];
  fundsReceived: FundsReceived[];
  invoices: Invoice[];
  balanceSummary: BalanceSummary;
  onAddExpense: () => void;
  onAddAdvance: () => void;
  onAddFunds: () => void;
  onAddInvoice: () => void;
  onBack: () => void;
  onCompleteSite: (siteId: string, completionDate: Date) => void;
}

const ExpensesPageContent: React.FC<ExpensesPageContentProps> = ({
  site,
  expenses,
  advances,
  fundsReceived,
  invoices,
  balanceSummary,
  onAddExpense,
  onAddAdvance,
  onAddFunds,
  onAddInvoice,
  onBack,
  onCompleteSite
}) => {
  return (
    <SiteDetail 
      site={site}
      expenses={expenses}
      advances={advances}
      fundsReceived={fundsReceived}
      invoices={invoices}
      onAddExpense={onAddExpense}
      onAddAdvance={onAddAdvance}
      onAddFunds={onAddFunds}
      onAddInvoice={onAddInvoice}
      balanceSummary={balanceSummary}
      onBack={onBack}
      onCompleteSite={onCompleteSite}
    />
  );
};

export default ExpensesPageContent;
