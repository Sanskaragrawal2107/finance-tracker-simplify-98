import React, { useState, useEffect } from 'react';
import PageTitle from '@/components/common/PageTitle';
import { Invoice, PaymentStatus } from '@/lib/types';
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Search, Filter, Eye, Download, FileText } from 'lucide-react';
import { toast } from 'sonner';
import InvoiceForm from '@/components/invoices/InvoiceForm';
import InvoiceDetails from '@/components/invoices/InvoiceDetails';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';

const Invoices: React.FC = () => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [filteredInvoices, setFilteredInvoices] = useState<Invoice[]>([]);
  const [isInvoiceFormOpen, setIsInvoiceFormOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchInvoices();
  }, []);

  useEffect(() => {
    filterInvoices();
  }, [invoices, searchTerm, statusFilter]);

  const fetchInvoices = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('invoices')
        .select('*')
        .order('date', { ascending: false });

      if (error) throw error;

      if (data) {
        const formattedInvoices: Invoice[] = data.map(invoice => ({
          id: invoice.id,
          date: new Date(invoice.date),
          partyId: invoice.party_id,
          partyName: invoice.party_name,
          material: invoice.material,
          quantity: invoice.quantity,
          rate: invoice.rate,
          gstPercentage: invoice.gst_percentage,
          grossAmount: invoice.gross_amount,
          netAmount: invoice.net_amount,
          bankDetails: invoice.bank_details,
          billUrl: invoice.bill_url,
          invoiceImageUrl: invoice.invoice_image_url,
          paymentStatus: invoice.payment_status,
          createdBy: invoice.created_by,
          createdAt: new Date(invoice.created_at),
          approverType: invoice.approver_type,
          siteId: invoice.site_id
        }));
        
        setInvoices(formattedInvoices);
      }
    } catch (error: any) {
      console.error('Error fetching invoices:', error);
      toast.error('Failed to load invoices: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const filterInvoices = () => {
    let filtered = [...invoices];
    
    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(invoice => 
        invoice.partyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        invoice.material.toLowerCase().includes(searchTerm.toLowerCase()) ||
        invoice.partyId.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(invoice => invoice.paymentStatus === statusFilter);
    }
    
    setFilteredInvoices(filtered);
  };

  const handleAddInvoice = async (newInvoice: Omit<Invoice, 'id' | 'createdAt'>) => {
    try {
      const { data, error } = await supabase
        .from('invoices')
        .insert({
          date: newInvoice.date.toISOString(),
          party_id: newInvoice.partyId,
          party_name: newInvoice.partyName,
          material: newInvoice.material,
          quantity: newInvoice.quantity,
          rate: newInvoice.rate,
          gst_percentage: newInvoice.gstPercentage,
          gross_amount: newInvoice.grossAmount,
          net_amount: newInvoice.netAmount,
          bank_details: newInvoice.bankDetails,
          bill_url: newInvoice.billUrl,
          invoice_image_url: newInvoice.invoiceImageUrl,
          payment_status: newInvoice.paymentStatus,
          created_by: newInvoice.createdBy,
          approver_type: newInvoice.approverType,
          site_id: newInvoice.siteId
        })
        .select()
        .single();

      if (error) throw error;

      if (data) {
        const formattedInvoice: Invoice = {
          id: data.id,
          date: new Date(data.date),
          partyId: data.party_id,
          partyName: data.party_name,
          material: data.material,
          quantity: data.quantity,
          rate: data.rate,
          gstPercentage: data.gst_percentage,
          grossAmount: data.gross_amount,
          netAmount: data.net_amount,
          bankDetails: data.bank_details,
          billUrl: data.bill_url,
          invoiceImageUrl: data.invoice_image_url,
          paymentStatus: data.payment_status,
          createdBy: data.created_by,
          createdAt: new Date(data.created_at),
          approverType: data.approver_type,
          siteId: data.site_id
        };
        
        setInvoices(prev => [formattedInvoice, ...prev]);
        toast.success('Invoice added successfully');
      }
    } catch (error: any) {
      console.error('Error adding invoice:', error);
      toast.error('Failed to add invoice: ' + error.message);
    }
  };

  const handleUpdateInvoiceStatus = async (id: string, status: PaymentStatus) => {
    try {
      const { error } = await supabase
        .from('invoices')
        .update({ payment_status: status })
        .eq('id', id);

      if (error) throw error;

      setInvoices(prev => 
        prev.map(invoice => 
          invoice.id === id ? { ...invoice, paymentStatus: status } : invoice
        )
      );
      
      if (selectedInvoice && selectedInvoice.id === id) {
        setSelectedInvoice({ ...selectedInvoice, paymentStatus: status });
      }
      
      toast.success(`Invoice marked as ${status}`);
    } catch (error: any) {
      console.error('Error updating invoice status:', error);
      toast.error('Failed to update invoice status: ' + error.message);
    }
  };

  const handleViewInvoice = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setIsDetailsOpen(true);
  };

  const handleDownloadInvoice = (invoice: Invoice) => {
    // Implementation for downloading invoice
    if (invoice.invoiceImageUrl) {
      window.open(invoice.invoiceImageUrl, '_blank');
    } else if (invoice.billUrl) {
      window.open(invoice.billUrl, '_blank');
    } else {
      toast.error('No invoice document available for download');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case PaymentStatus.PAID:
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-200">Paid</Badge>;
      case PaymentStatus.PENDING:
        return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-200">Pending</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <PageTitle 
        title="Invoices" 
        subtitle="Manage and track all vendor invoices"
      />
      
      <div className="flex flex-col md:flex-row justify-between gap-4">
        <div className="flex flex-col md:flex-row gap-4 w-full md:w-auto">
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search invoices..."
              className="pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <Select
            value={statusFilter}
            onValueChange={setStatusFilter}
          >
            <SelectTrigger className="w-full md:w-40">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value={PaymentStatus.PENDING}>Pending</SelectItem>
              <SelectItem value={PaymentStatus.PAID}>Paid</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <Button onClick={() => setIsInvoiceFormOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Invoice
        </Button>
      </div>
      
      <Tabs defaultValue="all" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="all">All Invoices</TabsTrigger>
          <TabsTrigger value="pending">Pending</TabsTrigger>
          <TabsTrigger value="paid">Paid</TabsTrigger>
        </TabsList>
        
        <TabsContent value="all" className="space-y-4">
          {isLoading ? (
            <div className="text-center py-10">
              <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading invoices...</p>
            </div>
          ) : filteredInvoices.length > 0 ? (
            <div className="rounded-md border">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="py-3 px-4 text-left font-medium">Date</th>
                      <th className="py-3 px-4 text-left font-medium">Vendor</th>
                      <th className="py-3 px-4 text-left font-medium">Material</th>
                      <th className="py-3 px-4 text-left font-medium">Amount</th>
                      <th className="py-3 px-4 text-left font-medium">Status</th>
                      <th className="py-3 px-4 text-right font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredInvoices.map((invoice) => (
                      <tr key={invoice.id} className="border-b hover:bg-muted/50 transition-colors">
                        <td className="py-3 px-4">{format(invoice.date, 'dd MMM yyyy')}</td>
                        <td className="py-3 px-4">{invoice.partyName}</td>
                        <td className="py-3 px-4">{invoice.material.length > 30 ? `${invoice.material.substring(0, 30)}...` : invoice.material}</td>
                        <td className="py-3 px-4">₹{invoice.netAmount.toLocaleString()}</td>
                        <td className="py-3 px-4">{getStatusBadge(invoice.paymentStatus)}</td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex justify-end gap-2">
                            <Button variant="ghost" size="icon" onClick={() => handleViewInvoice(invoice)}>
                              <Eye className="h-4 w-4" />
                            </Button>
                            {(invoice.billUrl || invoice.invoiceImageUrl) && (
                              <Button variant="ghost" size="icon" onClick={() => handleDownloadInvoice(invoice)}>
                                <Download className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="text-center py-10 border rounded-md">
              <FileText className="h-12 w-12 mx-auto text-muted-foreground opacity-50 mb-4" />
              <h3 className="text-lg font-medium mb-2">No Invoices Found</h3>
              <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                {searchTerm || statusFilter !== 'all' 
                  ? "No invoices match your current filters. Try adjusting your search criteria."
                  : "You haven't added any invoices yet. Add your first invoice to get started."}
              </p>
              {!searchTerm && statusFilter === 'all' && (
                <Button onClick={() => setIsInvoiceFormOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add First Invoice
                </Button>
              )}
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="pending" className="space-y-4">
          {isLoading ? (
            <div className="text-center py-10">
              <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading invoices...</p>
            </div>
          ) : filteredInvoices.filter(i => i.paymentStatus === PaymentStatus.PENDING).length > 0 ? (
            <div className="rounded-md border">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="py-3 px-4 text-left font-medium">Date</th>
                      <th className="py-3 px-4 text-left font-medium">Vendor</th>
                      <th className="py-3 px-4 text-left font-medium">Material</th>
                      <th className="py-3 px-4 text-left font-medium">Amount</th>
                      <th className="py-3 px-4 text-right font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredInvoices
                      .filter(i => i.paymentStatus === PaymentStatus.PENDING)
                      .map((invoice) => (
                        <tr key={invoice.id} className="border-b hover:bg-muted/50 transition-colors">
                          <td className="py-3 px-4">{format(invoice.date, 'dd MMM yyyy')}</td>
                          <td className="py-3 px-4">{invoice.partyName}</td>
                          <td className="py-3 px-4">{invoice.material.length > 30 ? `${invoice.material.substring(0, 30)}...` : invoice.material}</td>
                          <td className="py-3 px-4">₹{invoice.netAmount.toLocaleString()}</td>
                          <td className="py-3 px-4 text-right">
                            <div className="flex justify-end gap-2">
                              <Button variant="ghost" size="icon" onClick={() => handleViewInvoice(invoice)}>
                                <Eye className="h-4 w-4" />
                              </Button>
                              {(invoice.billUrl || invoice.invoiceImageUrl) && (
                                <Button variant="ghost" size="icon" onClick={() => handleDownloadInvoice(invoice)}>
                                  <Download className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="text-center py-10 border rounded-md">
              <FileText className="h-12 w-12 mx-auto text-muted-foreground opacity-50 mb-4" />
              <h3 className="text-lg font-medium mb-2">No Pending Invoices</h3>
              <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                {searchTerm 
                  ? "No pending invoices match your search criteria."
                  : "You don't have any pending invoices at the moment."}
              </p>
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="paid" className="space-y-4">
          {isLoading ? (
            <div className="text-center py-10">
              <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading invoices...</p>
            </div>
          ) : filteredInvoices.filter(i => i.paymentStatus === PaymentStatus.PAID).length > 0 ? (
            <div className="rounded-md border">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="py-3 px-4 text-left font-medium">Date</th>
                      <th className="py-3 px-4 text-left font-medium">Vendor</th>
                      <th className="py-3 px-4 text-left font-medium">Material</th>
                      <th className="py-3 px-4 text-left font-medium">Amount</th>
                      <th className="py-3 px-4 text-right font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredInvoices
                      .filter(i => i.paymentStatus === PaymentStatus.PAID)
                      .map((invoice) => (
                        <tr key={invoice.id} className="border-b hover:bg-muted/50 transition-colors">
                          <td className="py-3 px-4">{format(invoice.date, 'dd MMM yyyy')}</td>
                          <td className="py-3 px-4">{invoice.partyName}</td>
                          <td className="py-3 px-4">{invoice.material.length > 30 ? `${invoice.material.substring(0, 30)}...` : invoice.material}</td>
                          <td className="py-3 px-4">₹{invoice.netAmount.toLocaleString()}</td>
                          <td className="py-3 px-4 text-right">
                            <div className="flex justify-end gap-2">
                              <Button variant="ghost" size="icon" onClick={() => handleViewInvoice(invoice)}>
                                <Eye className="h-4 w-4" />
                              </Button>
                              {(invoice.billUrl || invoice.invoiceImageUrl) && (
                                <Button variant="ghost" size="icon" onClick={() => handleDownloadInvoice(invoice)}>
                                  <Download className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="text-center py-10 border rounded-md">
              <FileText className="h-12 w-12 mx-auto text-muted-foreground opacity-50 mb-4" />
              <h3 className="text-lg font-medium mb-2">No Paid Invoices</h3>
              <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                {searchTerm 
                  ? "No paid invoices match your search criteria."
                  : "You don't have any paid invoices at the moment."}
              </p>
            </div>
          )}
        </TabsContent>
      </Tabs>
      
      <InvoiceForm
        isOpen={isInvoiceFormOpen}
        onClose={() => setIsInvoiceFormOpen(false)}
        onSubmit={handleAddInvoice}
      />
      
      {selectedInvoice && (
        <InvoiceDetails
          isOpen={isDetailsOpen}
          onClose={() => setIsDetailsOpen(false)}
          invoice={selectedInvoice}
          onUpdateStatus={handleUpdateInvoiceStatus}
        />
      )}
    </div>
  );
};

export default Invoices;
