import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Invoice, PaymentStatus } from '@/lib/types';
import { mapDbInvoiceToInvoice, mapInvoiceToDbInvoice } from '@/lib/mappers';

const InvoicesPage = () => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchInvoices();
  }, []);

  const fetchInvoices = async () => {
    try {
      setIsLoading(true);
      
      const { data, error } = await supabase
        .from('invoices')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) {
        throw error;
      }
      
      // Map DB results to our frontend type
      const mappedInvoices = data.map(dbInvoice => mapDbInvoiceToInvoice(dbInvoice));
      setInvoices(mappedInvoices);
    } catch (error) {
      console.error('Error fetching invoices:', error);
      toast({
        title: "Error",
        description: "Failed to load invoices",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddInvoice = async (newInvoice: Omit<Invoice, 'id' | 'createdAt'>) => {
    try {
      // Convert our frontend type to the DB type
      const dbInvoice = mapInvoiceToDbInvoice(newInvoice);
      
      const { data, error } = await supabase
        .from('invoices')
        .insert(dbInvoice)
        .select()
        .single();
      
      if (error) {
        throw error;
      }
      
      // Map the returned DB type back to our frontend type
      const mappedInvoice = mapDbInvoiceToInvoice(data);
      
      setInvoices(prevInvoices => [mappedInvoice, ...prevInvoices]);
      
      toast({
        title: "Success",
        description: "Invoice added successfully",
      });
    } catch (error) {
      console.error('Error adding invoice:', error);
      toast({
        title: "Error",
        description: "Failed to add invoice",
        variant: "destructive"
      });
    }
  };

  const handleUpdateInvoiceStatus = async (id: string, status: PaymentStatus) => {
    try {
      const { error } = await supabase
        .from('invoices')
        .update({ payment_status: status })
        .eq('id', id);
      
      if (error) {
        throw error;
      }
      
      // Update local state
      setInvoices(prevInvoices => 
        prevInvoices.map(invoice => 
          invoice.id === id ? { ...invoice, paymentStatus: status } : invoice
        )
      );
      
      toast({
        title: "Success",
        description: `Invoice marked as ${status}`,
      });
    } catch (error) {
      console.error('Error updating invoice status:', error);
      toast({
        title: "Error",
        description: "Failed to update invoice status",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="container mx-auto py-6">
      <h1>Invoices Page</h1>
      {/* Display invoices here */}
    </div>
  );
};

export default InvoicesPage;
