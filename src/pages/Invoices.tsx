import React, { useState } from 'react';
import PageTitle from '@/components/common/PageTitle';
import CustomCard from '@/components/ui/CustomCard';
import { Search, Filter, Plus, Eye, Download, ChevronLeft, ChevronRight, CreditCard, Building, AlertTriangle } from 'lucide-react';
import { format } from 'date-fns';
import { Invoice, PaymentStatus, MaterialItem } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import InvoiceForm from '@/components/invoices/InvoiceForm';
import InvoiceDetails from '@/components/invoices/InvoiceDetails';
import { useToast } from '@/hooks/use-toast';
import { 
  Form, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormControl, 
  FormDescription, 
  FormMessage 
} from "@/components/ui/form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

const getStatusColor = (status: PaymentStatus) => {
  switch (status) {
    case PaymentStatus.PAID:
      return 'bg-green-100 text-green-800';
    case PaymentStatus.PENDING:
      return 'bg-yellow-100 text-yellow-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

const paymentFormSchema = z.object({
  bankOption: z.enum(["sbi", "hdfc", "icici", "axis"]),
  rememberChoice: z.boolean().optional()
});

const initialInvoices: Invoice[] = [
  {
    id: '1',
    date: new Date('2023-07-05'),
    partyId: '101',
    partyName: 'Steel Suppliers Ltd',
    material: 'TMT Steel Bars',
    quantity: 5,
    rate: 50000,
    gstPercentage: 18,
    grossAmount: 250000,
    netAmount: 295000,
    materialItems: [
      {
        material: 'TMT Steel Bars',
        quantity: 5,
        rate: 50000,
        gstPercentage: 18,
        amount: 250000
      }
    ],
    bankDetails: {
      accountNumber: '12345678901',
      bankName: 'State Bank of India',
      ifscCode: 'SBIN0001234',
      email: 'accounts@steelsuppliers.com',
      mobile: '9876543210',
    },
    billUrl: 'https://sample-files.com/pdf/sample.pdf',
    paymentStatus: PaymentStatus.PAID,
    createdBy: 'Admin',
    createdAt: new Date('2023-07-05'),
    approverType: 'ho',
  },
  {
    id: '2',
    date: new Date('2023-07-04'),
    partyId: '102',
    partyName: 'Cement Corporation',
    material: 'Portland Cement, White Cement',
    quantity: 100,
    rate: 350,
    gstPercentage: 18,
    grossAmount: 45000,
    netAmount: 53100,
    materialItems: [
      {
        material: 'Portland Cement',
        quantity: 100,
        rate: 350,
        gstPercentage: 18,
        amount: 35000
      },
      {
        material: 'White Cement',
        quantity: 20,
        rate: 500,
        gstPercentage: 18,
        amount: 10000
      }
    ],
    bankDetails: {
      accountNumber: '98765432101',
      bankName: 'HDFC Bank',
      ifscCode: 'HDFC0001234',
      email: 'accounts@cementcorp.com',
      mobile: '8765432109',
    },
    billUrl: 'https://sample-files.com/pdf/sample.pdf',
    paymentStatus: PaymentStatus.PAID,
    createdBy: 'Supervisor',
    createdAt: new Date('2023-07-04'),
    approverType: 'supervisor',
  },
  {
    id: '3',
    date: new Date('2023-07-03'),
    partyId: '103',
    partyName: 'Brick Manufacturers',
    material: 'Red Bricks',
    quantity: 10000,
    rate: 8,
    gstPercentage: 12,
    grossAmount: 80000,
    netAmount: 89600,
    materialItems: [
      {
        material: 'Red Bricks',
        quantity: 10000,
        rate: 8,
        gstPercentage: 12,
        amount: 80000
      }
    ],
    bankDetails: {
      accountNumber: '45678901234',
      bankName: 'ICICI Bank',
      ifscCode: 'ICIC0001234',
      email: 'accounts@brickmanufacturers.com',
      mobile: '7654321098',
    },
    billUrl: 'https://sample-files.com/pdf/sample.pdf',
    paymentStatus: PaymentStatus.PENDING,
    createdBy: 'Supervisor',
    createdAt: new Date('2023-07-03'),
    approverType: 'supervisor',
  },
  {
    id: '4',
    date: new Date('2023-07-02'),
    partyId: '104',
    partyName: 'Electrical Solutions',
    material: 'Wiring & Fixtures',
    quantity: 1,
    rate: 125000,
    gstPercentage: 18,
    grossAmount: 125000,
    netAmount: 147500,
    bankDetails: {
      accountNumber: '56789012345',
      bankName: 'Axis Bank',
      ifscCode: 'UTIB0001234',
      email: 'accounts@electricalsolutions.com',
      mobile: '6543210987',
    },
    billUrl: '#',
    paymentStatus: PaymentStatus.PENDING,
    createdBy: 'Admin',
    createdAt: new Date('2023-07-02'),
    approverType: 'ho',
  },
];

const Invoices: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
  const [invoices, setInvoices] = useState<Invoice[]>(initialInvoices);
  const { toast } = useToast();
  const [paymentProcessing, setPaymentProcessing] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  
  const paymentForm = useForm<z.infer<typeof paymentFormSchema>>({
    resolver: zodResolver(paymentFormSchema),
    defaultValues: {
      bankOption: "sbi",
      rememberChoice: false
    },
  });

  const filteredInvoices = invoices.filter(invoice => 
    invoice.partyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    invoice.material.toLowerCase().includes(searchTerm.toLowerCase()) ||
    invoice.id.includes(searchTerm)
  );

  const handleCreateInvoice = (invoice: Omit<Invoice, 'id' | 'createdAt'>) => {
    const newInvoice: Invoice = {
      ...invoice,
      id: (invoices.length + 1).toString(),
      createdAt: new Date(),
    };
    
    setInvoices([newInvoice, ...invoices]);
    
    toast({
      title: "Invoice Created",
      description: `Invoice for ${invoice.partyName} has been created successfully.`,
    });
    
    setIsCreateDialogOpen(false);
  };

  const handleViewInvoice = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setIsViewDialogOpen(true);
  };

  const handleDownloadInvoice = (invoice: Invoice) => {
    if (invoice.billUrl) {
      window.open(invoice.billUrl, '_blank');
      toast({
        title: "Download Initiated",
        description: "The invoice download has been initiated.",
      });
    } else {
      toast({
        title: "No Bill Available",
        description: "There is no bill attachment available for this invoice.",
        variant: "destructive"
      });
    }
  };
  
  const handleMakePayment = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setIsViewDialogOpen(false);
    setPaymentSuccess(false);
    setTimeout(() => setIsPaymentDialogOpen(true), 100);
  };
  
  const onSubmitPayment = (values: z.infer<typeof paymentFormSchema>) => {
    if (!selectedInvoice) return;
    
    setPaymentProcessing(true);
    
    setTimeout(() => {
      const updatedInvoices = invoices.map(invoice => {
        if (invoice.id === selectedInvoice.id) {
          return {
            ...invoice,
            paymentStatus: PaymentStatus.PAID
          };
        }
        return invoice;
      });
      
      setInvoices(updatedInvoices);
      setPaymentProcessing(false);
      setPaymentSuccess(true);
      
      toast({
        title: "Payment Successful",
        description: `Payment of ₹${selectedInvoice.netAmount.toLocaleString()} has been processed successfully.`,
      });
      
      setTimeout(() => {
        setIsPaymentDialogOpen(false);
        setPaymentSuccess(false);
      }, 2000);
    }, 2000);
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <PageTitle 
        title="Invoices" 
        subtitle="Manage invoices from vendors and suppliers"
      />
      
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="relative max-w-md">
          <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
          <input 
            type="text" 
            placeholder="Search invoices..." 
            className="py-2 pl-10 pr-4 border rounded-md w-full md:w-80 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" className="gap-1.5">
            <Filter className="h-4 w-4" />
            Filter
          </Button>
          <Button variant="outline" size="sm" className="gap-1.5">
            <Download className="h-4 w-4" />
            Export
          </Button>
          <Button size="sm" className="gap-1.5" onClick={() => setIsCreateDialogOpen(true)}>
            <Plus className="h-4 w-4" />
            New Invoice
          </Button>
        </div>
      </div>
      
      <CustomCard>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b text-left">
                <th className="pb-3 pl-4 font-medium text-muted-foreground">Date</th>
                <th className="pb-3 font-medium text-muted-foreground">Party Name</th>
                <th className="pb-3 font-medium text-muted-foreground">Material</th>
                <th className="pb-3 font-medium text-muted-foreground">Net Taxable Amount</th>
                <th className="pb-3 font-medium text-muted-foreground">GST</th>
                <th className="pb-3 font-medium text-muted-foreground">Grand Net Total</th>
                <th className="pb-3 font-medium text-muted-foreground">Status</th>
                <th className="pb-3 pr-4 font-medium text-muted-foreground text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredInvoices.map((invoice) => (
                <tr key={invoice.id} className="border-b last:border-0 hover:bg-muted/20 transition-colors">
                  <td className="py-4 pl-4 text-sm">{format(invoice.date, 'MMM dd, yyyy')}</td>
                  <td className="py-4 text-sm">{invoice.partyName}</td>
                  <td className="py-4 text-sm">{invoice.material}</td>
                  <td className="py-4 text-sm">₹{invoice.grossAmount.toLocaleString()}</td>
                  <td className="py-4 text-sm">{invoice.gstPercentage}%</td>
                  <td className="py-4 text-sm font-medium">₹{invoice.netAmount.toLocaleString()}</td>
                  <td className="py-4 text-sm">
                    <span className={`${getStatusColor(invoice.paymentStatus)} px-2 py-1 rounded-full text-xs font-medium`}>
                      {invoice.paymentStatus}
                    </span>
                  </td>
                  <td className="py-4 pr-4 text-right">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleViewInvoice(invoice)}>
                      <Eye className="h-4 w-4 text-muted-foreground" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleDownloadInvoice(invoice)}>
                      <Download className="h-4 w-4 text-muted-foreground" />
                    </Button>
                    {invoice.paymentStatus === PaymentStatus.PENDING && (
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8" 
                        onClick={() => handleMakePayment(invoice)}
                      >
                        <CreditCard className="h-4 w-4 text-muted-foreground" />
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        <div className="flex items-center justify-between mt-4 border-t pt-4">
          <p className="text-sm text-muted-foreground">Showing 1-{filteredInvoices.length} of {filteredInvoices.length} entries</p>
          <div className="flex items-center space-x-2">
            <button className="p-1 rounded-md hover:bg-muted transition-colors" disabled>
              <ChevronLeft className="h-5 w-5 text-muted-foreground" />
            </button>
            <button className="px-3 py-1 rounded-md bg-primary text-primary-foreground text-sm">1</button>
            <button className="p-1 rounded-md hover:bg-muted transition-colors" disabled>
              <ChevronRight className="h-5 w-5 text-muted-foreground" />
            </button>
          </div>
        </div>
      </CustomCard>

      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogTitle>Create New Invoice</DialogTitle>
          <DialogDescription>
            Fill out the form below to create a new invoice
          </DialogDescription>
          <InvoiceForm onSubmit={handleCreateInvoice} />
        </DialogContent>
      </Dialog>

      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogTitle>Invoice Details</DialogTitle>
          {selectedInvoice && <InvoiceDetails invoice={selectedInvoice} onMakePayment={handleMakePayment} />}
        </DialogContent>
      </Dialog>
      
      <Dialog open={isPaymentDialogOpen} onOpenChange={setIsPaymentDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogTitle>Make Payment</DialogTitle>
          <DialogDescription>
            Select your bank to complete the payment for invoice #{selectedInvoice?.partyId}
          </DialogDescription>
          
          {selectedInvoice && (
            <div className="mb-4 p-3 bg-muted rounded-md">
              <div className="flex justify-between mb-2">
                <span className="text-sm">Payee:</span>
                <span className="font-medium">{selectedInvoice.partyName}</span>
              </div>
              
              {selectedInvoice.approverType === "ho" && (
                <>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm">Account:</span>
                    <span className="font-medium">{selectedInvoice.bankDetails.accountNumber}</span>
                  </div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm">Bank:</span>
                    <span className="font-medium">{selectedInvoice.bankDetails.bankName}</span>
                  </div>
                </>
              )}
              
              <div className="flex justify-between font-medium text-primary">
                <span>Amount:</span>
                <span>₹{selectedInvoice.netAmount.toLocaleString()}</span>
              </div>
            </div>
          )}
          
          {paymentSuccess ? (
            <div className="py-8 flex flex-col items-center justify-center text-center space-y-4">
              <div className="h-16 w-16 rounded-full bg-green-100 flex items-center justify-center">
                <div className="h-10 w-10 rounded-full bg-green-500 text-white flex items-center justify-center">
                  ✓
                </div>
              </div>
              <h3 className="text-xl font-medium">Payment Successful!</h3>
              <p className="text-muted-foreground">Your payment has been processed successfully.</p>
            </div>
          ) : (
            <>
              <Separator className="my-4" />
              
              <Form {...paymentForm}>
                <form onSubmit={paymentForm.handleSubmit(onSubmitPayment)} className="space-y-4">
                  {selectedInvoice?.approverType === "supervisor" && (
                    <div className="mb-2 flex items-center p-2 rounded-md bg-amber-50 text-amber-700 border border-amber-200">
                      <AlertTriangle className="h-4 w-4 mr-2" />
                      <p className="text-sm">This payment will be made directly without bank transfer as it was approved by a supervisor.</p>
                    </div>
                  )}
                  
                  <FormField
                    control={paymentForm.control}
                    name="bankOption"
                    render={({ field }) => (
                      <FormItem className="space-y-1">
                        <FormLabel>Select Your Bank</FormLabel>
                        <FormDescription>
                          Choose the bank you want to use for this payment
                        </FormDescription>
                        <FormControl>
                          <RadioGroup
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                            className="grid grid-cols-2 gap-4 pt-2"
                          >
                            <div className="flex flex-col items-center space-y-2">
                              <Label
                                htmlFor="sbi"
                                className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
                              >
                                <Building className="mb-2 h-8 w-8" />
                                <span className="text-center font-medium">SBI</span>
                              </Label>
                              <RadioGroupItem value="sbi" id="sbi" className="sr-only" />
                            </div>
                            
                            <div className="flex flex-col items-center space-y-2">
                              <Label
                                htmlFor="hdfc"
                                className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
                              >
                                <Building className="mb-2 h-8 w-8" />
                                <span className="text-center font-medium">HDFC</span>
                              </Label>
                              <RadioGroupItem value="hdfc" id="hdfc" className="sr-only" />
                            </div>
                            
                            <div className="flex flex-col items-center space-y-2">
                              <Label
                                htmlFor="icici"
                                className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
                              >
                                <Building className="mb-2 h-8 w-8" />
                                <span className="text-center font-medium">ICICI</span>
                              </Label>
                              <RadioGroupItem value="icici" id="icici" className="sr-only" />
                            </div>
                            
                            <div className="flex flex-col items-center space-y-2">
                              <Label
                                htmlFor="axis"
                                className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
                              >
                                <Building className="mb-2 h-8 w-8" />
                                <span className="text-center font-medium">AXIS</span>
                              </Label>
                              <RadioGroupItem value="axis" id="axis" className="sr-only" />
                            </div>
                          </RadioGroup>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="flex justify-end gap-2 pt-2">
                    <Button 
                      type="button" 
                      variant="outline"
                      onClick={() => setIsPaymentDialogOpen(false)}
                      disabled={paymentProcessing}
                    >
                      Cancel
                    </Button>
                    <Button 
                      type="submit" 
                      disabled={paymentProcessing}
                      className="min-w-24"
                    >
                      {paymentProcessing ? (
                        <>
                          <span className="loading loading-spinner loading-xs mr-2"></span>
                          Processing...
                        </>
                      ) : "Proceed to Pay"}
                    </Button>
                  </div>
                </form>
              </Form>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Invoices;
