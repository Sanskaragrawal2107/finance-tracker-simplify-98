
import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import PageTitle from '@/components/common/PageTitle';
import { Expense, Advance, Invoice, FundsReceived } from '@/lib/types';
import ExpenseForm from '@/components/expenses/ExpenseForm';
import AdvanceForm from '@/components/advances/AdvanceForm';
import InvoiceForm from '@/components/invoices/InvoiceForm';
import FundsReceivedForm from '@/components/funds/FundsReceivedForm';
import ExpensesPageContent from '@/components/expenses/ExpensesPageContent';
import { useSiteData } from '@/hooks/use-site-data';

const ExpensesPage = () => {
  const { siteId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isExpenseFormOpen, setIsExpenseFormOpen] = useState(false);
  const [isAdvanceFormOpen, setIsAdvanceFormOpen] = useState(false);
  const [isFundsFormOpen, setIsFundsFormOpen] = useState(false);
  const [isInvoiceFormOpen, setIsInvoiceFormOpen] = useState(false);
  
  const { 
    site,
    expenses, 
    advances, 
    fundsReceived, 
    invoices, 
    balanceSummary,
    isLoading, 
    error,
    handleAddExpense,
    handleAddAdvance,
    handleAddFunds,
    handleAddInvoice,
    handleCompleteSite,
    refreshData
  } = useSiteData(siteId);

  const handleBack = () => {
    navigate(-1);
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-6 flex items-center justify-center min-h-[80vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading site data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto py-6 text-center">
        <h2 className="text-xl font-semibold">Error</h2>
        <p className="mt-2 text-muted-foreground">{error}</p>
        <button className="mt-4 px-4 py-2 bg-primary text-white rounded-md" onClick={handleBack}>Go Back</button>
      </div>
    );
  }

  if (!site) {
    return (
      <div className="container mx-auto py-6 text-center">
        <h2 className="text-xl font-semibold">Site not found</h2>
        <p className="mt-2 text-muted-foreground">The requested site could not be found.</p>
        <button className="mt-4 px-4 py-2 bg-primary text-white rounded-md" onClick={handleBack}>Go Back</button>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <PageTitle title={site.name} />
      
      <ExpensesPageContent 
        site={site}
        expenses={expenses}
        advances={advances}
        fundsReceived={fundsReceived}
        invoices={invoices}
        balanceSummary={balanceSummary}
        onAddExpense={() => setIsExpenseFormOpen(true)}
        onAddAdvance={() => setIsAdvanceFormOpen(true)}
        onAddFunds={() => setIsFundsFormOpen(true)}
        onAddInvoice={() => setIsInvoiceFormOpen(true)}
        onBack={handleBack}
        onCompleteSite={handleCompleteSite}
      />

      <ExpenseForm 
        isOpen={isExpenseFormOpen} 
        onClose={() => setIsExpenseFormOpen(false)} 
        onSubmit={handleAddExpense}
        siteId={siteId || ''}
      />
      
      <AdvanceForm 
        isOpen={isAdvanceFormOpen} 
        onClose={() => setIsAdvanceFormOpen(false)} 
        onSubmit={handleAddAdvance}
        siteId={siteId || ''}
      />
      
      <FundsReceivedForm 
        isOpen={isFundsFormOpen} 
        onClose={() => setIsFundsFormOpen(false)} 
        onSubmit={handleAddFunds}
      />
      
      <InvoiceForm 
        isOpen={isInvoiceFormOpen} 
        onClose={() => setIsInvoiceFormOpen(false)} 
        onSubmit={handleAddInvoice}
      />
    </div>
  );
};

export default ExpensesPage;
