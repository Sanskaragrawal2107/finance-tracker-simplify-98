
import React from 'react';
import { Invoice, PaymentStatus } from '@/lib/types';
import { Separator } from '@/components/ui/separator';
import { format } from 'date-fns';
import { Download, Calendar, IndianRupee, User, MapPin, Phone, Mail, Receipt } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface InvoiceDetailsProps {
  invoice: Invoice;
}

const getStatusColor = (status: PaymentStatus) => {
  switch (status) {
    case PaymentStatus.PAID:
      return 'bg-green-100 text-green-800 border-green-200';
    case PaymentStatus.PENDING:
      return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200';
  }
};

const InvoiceDetails: React.FC<InvoiceDetailsProps> = ({ invoice }) => {
  // Parse multiple materials if they exist
  const materials = invoice.material.split(', ');
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between">
        <div>
          <h3 className="text-xl font-semibold flex items-center">
            <Receipt className="mr-2 h-5 w-5 text-primary" />
            Invoice #{invoice.id}
          </h3>
          <p className="text-muted-foreground flex items-center mt-1">
            <Calendar className="mr-1 h-4 w-4" />
            {format(new Date(invoice.date), 'MMMM dd, yyyy')}
          </p>
        </div>
        <div className="mt-4 md:mt-0">
          <div 
            className={`px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(invoice.paymentStatus)}`}
          >
            {invoice.paymentStatus}
          </div>
        </div>
      </div>
      
      <Separator />
      
      {/* Party Details */}
      <div>
        <h4 className="font-medium mb-2">Party Details</h4>
        <div className="bg-muted rounded-md p-4">
          <p className="font-medium">{invoice.partyName}</p>
          <p className="text-sm mt-1">Party ID: {invoice.partyId}</p>
        </div>
      </div>
      
      {/* Materials and Amounts */}
      <div>
        <h4 className="font-medium mb-2">Materials & Amounts</h4>
        <div className="overflow-x-auto rounded-md border">
          <table className="w-full">
            <thead className="bg-muted text-left">
              <tr>
                <th className="py-2 px-4 font-medium">#</th>
                <th className="py-2 px-4 font-medium">Material</th>
                <th className="py-2 px-4 font-medium text-right">Quantity</th>
                <th className="py-2 px-4 font-medium text-right">Rate (₹)</th>
                <th className="py-2 px-4 font-medium text-right">GST %</th>
                <th className="py-2 px-4 font-medium text-right">Amount (₹)</th>
              </tr>
            </thead>
            <tbody>
              {materials.map((material, index) => (
                <tr key={index} className="border-t">
                  <td className="py-3 px-4">{index + 1}</td>
                  <td className="py-3 px-4">{material}</td>
                  {index === 0 ? (
                    <>
                      <td className="py-3 px-4 text-right">{invoice.quantity}</td>
                      <td className="py-3 px-4 text-right">{invoice.rate.toLocaleString()}</td>
                      <td className="py-3 px-4 text-right">{invoice.gstPercentage}%</td>
                      <td className="py-3 px-4 text-right font-medium">{(invoice.quantity * invoice.rate).toLocaleString()}</td>
                    </>
                  ) : (
                    <>
                      <td className="py-3 px-4 text-right">-</td>
                      <td className="py-3 px-4 text-right">-</td>
                      <td className="py-3 px-4 text-right">-</td>
                      <td className="py-3 px-4 text-right">-</td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-muted/50 font-medium">
              <tr className="border-t">
                <td colSpan={5} className="py-3 px-4 text-right">Gross Amount:</td>
                <td className="py-3 px-4 text-right">₹{invoice.grossAmount.toLocaleString()}</td>
              </tr>
              <tr className="border-t">
                <td colSpan={5} className="py-3 px-4 text-right">GST Amount:</td>
                <td className="py-3 px-4 text-right">₹{(invoice.netAmount - invoice.grossAmount).toLocaleString()}</td>
              </tr>
              <tr className="border-t">
                <td colSpan={5} className="py-3 px-4 text-right font-bold">Net Amount:</td>
                <td className="py-3 px-4 text-right font-bold text-primary">₹{invoice.netAmount.toLocaleString()}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
      
      {/* Bank Details */}
      <div>
        <h4 className="font-medium mb-2">Bank Details</h4>
        <div className="bg-muted rounded-md p-4 space-y-2">
          <p><span className="font-medium">Account Number:</span> {invoice.bankDetails.accountNumber}</p>
          <p><span className="font-medium">Bank & Branch:</span> {invoice.bankDetails.bankName}</p>
          <p><span className="font-medium">IFSC Code:</span> {invoice.bankDetails.ifscCode}</p>
          {invoice.bankDetails.email && (
            <p className="flex items-center">
              <Mail className="h-4 w-4 mr-1" />
              <span className="font-medium mr-1">Email:</span> {invoice.bankDetails.email}
            </p>
          )}
          {invoice.bankDetails.mobile && (
            <p className="flex items-center">
              <Phone className="h-4 w-4 mr-1" />
              <span className="font-medium mr-1">Mobile:</span> {invoice.bankDetails.mobile}
            </p>
          )}
        </div>
      </div>
      
      {/* Bill & Actions */}
      {invoice.billUrl && (
        <div>
          <h4 className="font-medium mb-2">Attached Bill</h4>
          <div className="bg-muted/50 border rounded-md p-4 flex items-center justify-between">
            <span>Bill attachment</span>
            <Button variant="outline" size="sm" className="gap-1.5">
              <Download className="h-4 w-4" />
              Download
            </Button>
          </div>
        </div>
      )}
      
      <div className="flex justify-end pt-2">
        <Button variant="outline" size="sm" className="gap-1.5">
          <Download className="h-4 w-4" />
          Export Invoice
        </Button>
      </div>
      
      <div className="text-xs text-muted-foreground mt-6 pt-4 border-t">
        <p className="mb-1">Created by: {invoice.createdBy}</p>
        <p>Created on: {format(new Date(invoice.createdAt), 'MMMM dd, yyyy, h:mm a')}</p>
      </div>
    </div>
  );
};

export default InvoiceDetails;
