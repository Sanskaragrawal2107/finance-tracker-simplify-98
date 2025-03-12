
import React from 'react';
import { format } from 'date-fns';
import { FileText, X, Download, ExternalLink } from 'lucide-react';
import { Invoice } from '@/lib/types';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface InvoiceDetailsProps {
  invoice: Invoice;
  isOpen: boolean;
  onClose: () => void;
  onMakePayment?: (invoice: Invoice) => void;
}

const InvoiceDetails: React.FC<InvoiceDetailsProps> = ({ invoice, isOpen, onClose, onMakePayment }) => {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Invoice Details</DialogTitle>
          <DialogDescription>
            Details for invoice {invoice.partyId} from {invoice.partyName}
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <h3 className="text-sm font-medium text-muted-foreground">Date</h3>
              <p className="font-medium">{format(new Date(invoice.date), 'PPP')}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-muted-foreground">Invoice Number</h3>
              <p className="font-medium">{invoice.partyId}</p>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-medium text-muted-foreground">Vendor/Party</h3>
            <p className="font-medium">{invoice.partyName}</p>
          </div>

          <div className="pt-2 border-t">
            <h3 className="text-sm font-medium text-muted-foreground mb-2">Material/Service</h3>
            <div className="grid grid-cols-3 gap-3 text-sm">
              <div>
                <p className="font-medium">Material</p>
                <p>{invoice.material}</p>
              </div>
              <div>
                <p className="font-medium">Quantity</p>
                <p>{invoice.quantity}</p>
              </div>
              <div>
                <p className="font-medium">Rate</p>
                <p>₹{invoice.rate.toLocaleString()}</p>
              </div>
            </div>
          </div>

          <div className="pt-2 border-t">
            <h3 className="text-sm font-medium text-muted-foreground mb-2">Amount</h3>
            <div className="grid grid-cols-3 gap-3 text-sm">
              <div>
                <p className="font-medium">Gross Amount</p>
                <p>₹{invoice.grossAmount.toLocaleString()}</p>
              </div>
              <div>
                <p className="font-medium">GST ({invoice.gstPercentage}%)</p>
                <p>₹{(invoice.grossAmount * (invoice.gstPercentage / 100)).toLocaleString()}</p>
              </div>
              <div>
                <p className="font-medium">Net Amount</p>
                <p className="text-base font-semibold">₹{invoice.netAmount.toLocaleString()}</p>
              </div>
            </div>
          </div>

          <div className="pt-2 border-t">
            <h3 className="text-sm font-medium text-muted-foreground mb-2">Bank Details</h3>
            <div className="space-y-1 text-sm">
              <p><span className="font-medium">Bank:</span> {invoice.bankDetails.bankName}</p>
              <p><span className="font-medium">Account:</span> {invoice.bankDetails.accountNumber}</p>
              <p><span className="font-medium">IFSC:</span> {invoice.bankDetails.ifscCode}</p>
              {invoice.bankDetails.email && (
                <p><span className="font-medium">Email:</span> {invoice.bankDetails.email}</p>
              )}
              {invoice.bankDetails.mobile && (
                <p><span className="font-medium">Mobile:</span> {invoice.bankDetails.mobile}</p>
              )}
            </div>
          </div>

          {(invoice.invoiceImageUrl || invoice.billUrl) && (
            <div className="pt-2 border-t">
              <h3 className="text-sm font-medium text-muted-foreground mb-2">Documents</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {invoice.invoiceImageUrl && (
                  <div className="border rounded-md p-3 flex flex-col items-center">
                    <FileText className="h-8 w-8 mb-2 text-blue-500" />
                    <p className="text-sm font-medium mb-2">Invoice Image</p>
                    <div className="space-x-2">
                      <Button 
                        size="sm" 
                        variant="outline" 
                        asChild
                      >
                        <a href={invoice.invoiceImageUrl} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="h-4 w-4 mr-1" />
                          View
                        </a>
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        asChild
                      >
                        <a href={invoice.invoiceImageUrl} download>
                          <Download className="h-4 w-4 mr-1" />
                          Download
                        </a>
                      </Button>
                    </div>
                  </div>
                )}
                
                {invoice.billUrl && (
                  <div className="border rounded-md p-3 flex flex-col items-center">
                    <FileText className="h-8 w-8 mb-2 text-green-500" />
                    <p className="text-sm font-medium mb-2">Bill Image</p>
                    <div className="space-x-2">
                      <Button 
                        size="sm" 
                        variant="outline" 
                        asChild
                      >
                        <a href={invoice.billUrl} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="h-4 w-4 mr-1" />
                          View
                        </a>
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        asChild
                      >
                        <a href={invoice.billUrl} download>
                          <Download className="h-4 w-4 mr-1" />
                          Download
                        </a>
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="pt-2 border-t">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-muted-foreground">Status</span>
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${invoice.paymentStatus === 'paid' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                {invoice.paymentStatus === 'paid' ? 'PAID' : 'PENDING'}
              </span>
            </div>
          </div>
        </div>

        <DialogFooter>
          {onMakePayment && (
            <Button 
              onClick={() => onMakePayment(invoice)}
              variant="outline"
              className="mr-auto"
            >
              Mark as Paid
            </Button>
          )}
          <Button onClick={onClose}>
            <X className="h-4 w-4 mr-2" />
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default InvoiceDetails;
