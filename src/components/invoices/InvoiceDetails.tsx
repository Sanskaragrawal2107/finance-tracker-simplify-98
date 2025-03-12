import React from 'react';
import { format } from 'date-fns';
import {
  Calendar,
  IndianRupee,
  User,
  Package,
  Tag,
  Percent,
  CreditCard,
  Receipt,
  Download,
  Building,
  Landmark,
  CheckCircle2,
  Clock
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Invoice, BankDetails, PaymentStatus } from '@/lib/types';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';

interface InvoiceDetailsProps {
  invoice: Invoice | null;
  isOpen: boolean;
  onClose: () => void;
}

const InvoiceDetails: React.FC<InvoiceDetailsProps> = ({ invoice, isOpen, onClose }) => {
  if (!invoice) {
    return null;
  }

  const getPaymentStatusBadge = (status: PaymentStatus | string) => {
    switch (status) {
      case PaymentStatus.PAID:
        return (
          <Badge variant="outline" className="space-x-2">
            <CheckCircle2 className="h-4 w-4" />
            <span>Paid</span>
          </Badge>
        );
      case PaymentStatus.PENDING:
      default:
        return (
          <Badge variant="secondary" className="space-x-2">
            <Clock className="h-4 w-4" />
            <span>Pending</span>
          </Badge>
        );
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Invoice Details</DialogTitle>
          <DialogDescription>
            View all the information about this invoice.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Basic Information */}
          <div>
            <h4 className="text-md font-semibold mb-2">Invoice Information</h4>
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                <span>Date: {format(invoice.date, 'PPP')}</span>
              </div>
              <div className="flex items-center gap-2">
                <User className="h-5 w-5" />
                <span>Party Name: {invoice.partyName}</span>
              </div>
              <div className="flex items-center gap-2">
                <Building className="h-5 w-5" />
                <span>Party ID: {invoice.partyId}</span>
              </div>
              <div className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                <span>Material: {invoice.material}</span>
              </div>
              <div className="flex items-center gap-2">
                <Tag className="h-5 w-5" />
                <span>Quantity: {invoice.quantity}</span>
              </div>
              <div className="flex items-center gap-2">
                <IndianRupee className="h-5 w-5" />
                <span>Rate: ₹{invoice.rate.toLocaleString()}</span>
              </div>
              <div className="flex items-center gap-2">
                <Percent className="h-5 w-5" />
                <span>GST Percentage: {invoice.gstPercentage}%</span>
              </div>
            </div>
          </div>

          {/* Financial Information */}
          <div>
            <h4 className="text-md font-semibold mb-2">Financial Details</h4>
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <IndianRupee className="h-5 w-5" />
                <span>Gross Amount: ₹{invoice.grossAmount.toLocaleString()}</span>
              </div>
              <div className="flex items-center gap-2">
                <IndianRupee className="h-5 w-5" />
                <span>Net Amount: ₹{invoice.netAmount.toLocaleString()}</span>
              </div>
              <div className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                <span>Payment Status: {getPaymentStatusBadge(invoice.paymentStatus)}</span>
              </div>
            </div>
          </div>

          {/* Bank Details */}
          <div>
            <h4 className="text-md font-semibold mb-2">Bank Details</h4>
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Landmark className="h-5 w-5" />
                <span>Bank Name: {invoice.bankDetails.bankName}</span>
              </div>
              <div className="flex items-center gap-2">
                <Receipt className="h-5 w-5" />
                <span>Account Number: {invoice.bankDetails.accountNumber}</span>
              </div>
              <div className="flex items-center gap-2">
                <span>IFSC Code: {invoice.bankDetails.ifscCode}</span>
              </div>
              {invoice.bankDetails.email && (
                <div className="flex items-center gap-2">
                  <span>Email: {invoice.bankDetails.email}</span>
                </div>
              )}
              {invoice.bankDetails.mobile && (
                <div className="flex items-center gap-2">
                  <span>Mobile: {invoice.bankDetails.mobile}</span>
                </div>
              )}
            </div>
          </div>

          {/* Attachments */}
          <div>
            <h4 className="text-md font-semibold mb-2">Attachments</h4>
            <div className="space-y-3">
              {invoice.billUrl && (
                <div className="flex items-center gap-2">
                  <Download className="h-5 w-5" />
                  <a href={invoice.billUrl} target="_blank" rel="noopener noreferrer" className="underline">
                    View Bill
                  </a>
                </div>
              )}
              {invoice.invoiceImageUrl && (
                <div className="flex items-center gap-2">
                  <Download className="h-5 w-5" />
                  <a href={invoice.invoiceImageUrl} target="_blank" rel="noopener noreferrer" className="underline">
                    View Invoice Image
                  </a>
                </div>
              )}
              {!invoice.billUrl && !invoice.invoiceImageUrl && (
                <div className="text-muted-foreground">No attachments available.</div>
              )}
            </div>
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default InvoiceDetails;
