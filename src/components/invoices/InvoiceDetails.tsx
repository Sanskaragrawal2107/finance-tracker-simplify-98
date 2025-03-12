
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { format } from 'date-fns';
import { PaymentStatus, Invoice, BankDetails } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { CalendarDays, Truck, File, FileText, Users, IndianRupee, CheckCircle, Clock, Bank, Phone, Mail } from 'lucide-react';

interface InvoiceDetailsProps {
  invoice: Invoice;
  isOpen: boolean;
  onClose: () => void;
  onUpdateStatus?: (invoiceId: string, newStatus: PaymentStatus) => void;
}

const InvoiceDetails: React.FC<InvoiceDetailsProps> = ({ 
  invoice, 
  isOpen, 
  onClose,
  onUpdateStatus
}) => {
  const handleMarkAsPaid = () => {
    if (onUpdateStatus) {
      onUpdateStatus(invoice.id, PaymentStatus.PAID);
    }
    onClose();
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">Invoice Details</DialogTitle>
        </DialogHeader>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
          <div className="space-y-6">
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex items-center mb-3">
                <FileText className="h-5 w-5 text-primary mr-2" />
                <h3 className="font-semibold text-lg">Invoice Information</h3>
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-sm text-muted-foreground">Invoice ID</p>
                  <p className="font-medium">{invoice.partyId}</p>
                </div>
                
                <div>
                  <p className="text-sm text-muted-foreground">Date</p>
                  <div className="flex items-center">
                    <CalendarDays className="h-4 w-4 mr-1 text-muted-foreground" />
                    <p>{format(new Date(invoice.date), 'PPP')}</p>
                  </div>
                </div>
                
                <div className="col-span-2">
                  <p className="text-sm text-muted-foreground">Status</p>
                  <div className="flex items-center">
                    {invoice.paymentStatus === 'paid' ? (
                      <CheckCircle className="h-4 w-4 mr-1 text-green-600" />
                    ) : (
                      <Clock className="h-4 w-4 mr-1 text-amber-600" />
                    )}
                    <p className={`font-medium ${invoice.paymentStatus === 'paid' ? 'text-green-600' : 'text-amber-600'}`}>
                      {invoice.paymentStatus === 'paid' ? 'Paid' : 'Pending Payment'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex items-center mb-3">
                <Truck className="h-5 w-5 text-primary mr-2" />
                <h3 className="font-semibold text-lg">Vendor Information</h3>
              </div>
              
              <div className="space-y-2">
                <div>
                  <p className="text-sm text-muted-foreground">Vendor Name</p>
                  <p className="font-medium">{invoice.partyName}</p>
                </div>
                
                <div>
                  <p className="text-sm text-muted-foreground">Material</p>
                  <p className="font-medium">{invoice.material}</p>
                </div>
              </div>
            </div>
          </div>
          
          <div className="space-y-6">
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex items-center mb-3">
                <IndianRupee className="h-5 w-5 text-primary mr-2" />
                <h3 className="font-semibold text-lg">Payment Details</h3>
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-sm text-muted-foreground">Quantity</p>
                  <p className="font-medium">{invoice.quantity}</p>
                </div>
                
                <div>
                  <p className="text-sm text-muted-foreground">Rate</p>
                  <p className="font-medium">₹{invoice.rate.toLocaleString()}</p>
                </div>
                
                <div>
                  <p className="text-sm text-muted-foreground">GST (%)</p>
                  <p className="font-medium">{invoice.gstPercentage}%</p>
                </div>
                
                <div>
                  <p className="text-sm text-muted-foreground">Gross Amount</p>
                  <p className="font-medium">₹{invoice.grossAmount.toLocaleString()}</p>
                </div>
                
                <div className="col-span-2">
                  <p className="text-sm text-muted-foreground">Net Amount (with GST)</p>
                  <p className="font-semibold text-lg text-primary">₹{invoice.netAmount.toLocaleString()}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex items-center mb-3">
                <Bank className="h-5 w-5 text-primary mr-2" />
                <h3 className="font-semibold text-lg">Bank Details</h3>
              </div>
              
              {invoice.bankDetails && (
                <div className="space-y-2">
                  <div>
                    <p className="text-sm text-muted-foreground">Bank Name</p>
                    <p className="font-medium">{invoice.bankDetails.bankName}</p>
                  </div>
                  
                  <div>
                    <p className="text-sm text-muted-foreground">Account Number</p>
                    <p className="font-medium">{invoice.bankDetails.accountNumber}</p>
                  </div>
                  
                  <div>
                    <p className="text-sm text-muted-foreground">IFSC Code</p>
                    <p className="font-medium">{invoice.bankDetails.ifscCode}</p>
                  </div>
                  
                  {invoice.bankDetails.email && (
                    <div className="flex items-center">
                      <Mail className="h-4 w-4 mr-1 text-muted-foreground" />
                      <p className="font-medium">{invoice.bankDetails.email}</p>
                    </div>
                  )}
                  
                  {invoice.bankDetails.mobile && (
                    <div className="flex items-center">
                      <Phone className="h-4 w-4 mr-1 text-muted-foreground" />
                      <p className="font-medium">{invoice.bankDetails.mobile}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
        
        {invoice.paymentStatus !== 'paid' && onUpdateStatus && (
          <div className="flex justify-end mt-6">
            <Button onClick={handleMarkAsPaid} className="bg-green-600 hover:bg-green-700">
              <CheckCircle className="h-4 w-4 mr-2" />
              Mark as Paid
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default InvoiceDetails;
