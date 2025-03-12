import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { CalendarIcon } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';
import { Invoice, BankDetails, UserRole, PaymentStatus } from '@/lib/types';

interface InvoiceFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (invoice: Omit<Invoice, 'id' | 'createdAt'>) => void;
  editInvoice?: Invoice;
}

const InvoiceForm: React.FC<InvoiceFormProps> = ({ 
  isOpen, 
  onClose, 
  onSubmit,
  editInvoice 
}) => {
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [date, setDate] = useState<Date>(new Date());
  const [partyId, setPartyId] = useState('');
  const [partyName, setPartyName] = useState('');
  const [material, setMaterial] = useState('');
  const [quantity, setQuantity] = useState<number>(0);
  const [rate, setRate] = useState<number>(0);
  const [gstPercentage, setGstPercentage] = useState<number>(0);
  const [grossAmount, setGrossAmount] = useState<number>(0);
  const [netAmount, setNetAmount] = useState<number>(0);
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>(PaymentStatus.PENDING);
  
  // Bank details
  const [bankName, setBankName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [ifscCode, setIfscCode] = useState('');
  const [email, setEmail] = useState('');
  const [mobile, setMobile] = useState('');
  
  // Handle calculation of amounts
  useEffect(() => {
    if (quantity && rate) {
      const gross = quantity * rate;
      setGrossAmount(gross);
      
      const gstAmount = gross * (gstPercentage / 100);
      setNetAmount(gross + gstAmount);
    }
  }, [quantity, rate, gstPercentage]);
  
  // Set form fields if editing an existing invoice
  useEffect(() => {
    if (editInvoice) {
      setDate(new Date(editInvoice.date));
      setPartyId(editInvoice.partyId);
      setPartyName(editInvoice.partyName);
      setMaterial(editInvoice.material);
      setQuantity(editInvoice.quantity);
      setRate(editInvoice.rate);
      setGstPercentage(editInvoice.gstPercentage);
      setGrossAmount(editInvoice.grossAmount);
      setNetAmount(editInvoice.netAmount);
      setPaymentStatus(editInvoice.paymentStatus as PaymentStatus);
      
      // Bank details
      if (editInvoice.bankDetails) {
        setBankName(editInvoice.bankDetails.bankName);
        setAccountNumber(editInvoice.bankDetails.accountNumber);
        setIfscCode(editInvoice.bankDetails.ifscCode);
        setEmail(editInvoice.bankDetails.email || '');
        setMobile(editInvoice.bankDetails.mobile || '');
      }
    }
  }, [editInvoice]);
  
  // Get user role
  useEffect(() => {
    const storedUserRole = localStorage.getItem('userRole') as UserRole;
    if (storedUserRole) {
      setUserRole(storedUserRole);
    }
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const bankDetails: BankDetails = {
      bankName,
      accountNumber,
      ifscCode,
      email: email || undefined,
      mobile: mobile || undefined
    };
    
    const newInvoice: Omit<Invoice, 'id' | 'createdAt'> = {
      date,
      partyId,
      partyName,
      material,
      quantity,
      rate,
      gstPercentage,
      grossAmount,
      netAmount,
      bankDetails,
      paymentStatus: paymentStatus,
      createdBy: 'Current User', // This would be replaced with actual user info
      approverType: userRole === UserRole.ADMIN ? 'ho' : 'supervisor',
      amount: netAmount,
      billUrl: '',
      invoiceImageUrl: '',
      siteId: ''
    };
    
    onSubmit(newInvoice);
    resetForm();
  };
  
  const resetForm = () => {
    setDate(new Date());
    setPartyId('');
    setPartyName('');
    setMaterial('');
    setQuantity(0);
    setRate(0);
    setGstPercentage(0);
    setGrossAmount(0);
    setNetAmount(0);
    setPaymentStatus(PaymentStatus.PENDING);
    setBankName('');
    setAccountNumber('');
    setIfscCode('');
    setEmail('');
    setMobile('');
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{editInvoice ? 'Edit Invoice' : 'New Invoice'}</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="date" className="text-right">
              Date
            </Label>
            <Popover className="col-span-3">
              <PopoverTrigger asChild>
                <Button
                  variant={'outline'}
                  className={
                    'w-full justify-start text-left font-normal' +
                    (date ? ' text-foreground' : ' text-muted-foreground')
                  }
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {date ? format(date, 'PPP') : <span>Pick a date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={setDate}
                  disabled={(date) =>
                    date > new Date() || date < new Date('2020-01-01')
                  }
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
          
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="partyId" className="text-right">
              Invoice No.
            </Label>
            <Input 
              id="partyId" 
              value={partyId} 
              onChange={(e) => setPartyId(e.target.value)} 
              className="col-span-3" 
              required
            />
          </div>
          
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="partyName" className="text-right">
              Vendor Name
            </Label>
            <Input 
              id="partyName" 
              value={partyName} 
              onChange={(e) => setPartyName(e.target.value)} 
              className="col-span-3" 
              required
            />
          </div>
          
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="material" className="text-right">
              Material
            </Label>
            <Textarea
              id="material"
              value={material}
              onChange={(e) => setMaterial(e.target.value)}
              className="col-span-3"
              required
            />
          </div>
          
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="quantity" className="text-right">
              Quantity
            </Label>
            <Input
              type="number"
              id="quantity"
              value={quantity}
              onChange={(e) => setQuantity(Number(e.target.value))}
              className="col-span-3"
              required
            />
          </div>
          
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="rate" className="text-right">
              Rate
            </Label>
            <Input
              type="number"
              id="rate"
              value={rate}
              onChange={(e) => setRate(Number(e.target.value))}
              className="col-span-3"
              required
            />
          </div>
          
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="gstPercentage" className="text-right">
              GST (%)
            </Label>
            <Input
              type="number"
              id="gstPercentage"
              value={gstPercentage}
              onChange={(e) => setGstPercentage(Number(e.target.value))}
              className="col-span-3"
              required
            />
          </div>
          
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="grossAmount" className="text-right">
              Gross Amount
            </Label>
            <Input
              type="number"
              id="grossAmount"
              value={grossAmount}
              className="col-span-3"
              readOnly
            />
          </div>
          
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="netAmount" className="text-right">
              Net Amount
            </Label>
            <Input
              type="number"
              id="netAmount"
              value={netAmount}
              className="col-span-3"
              readOnly
            />
          </div>
          
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="paymentStatus" className="text-right">
              Payment Status
            </Label>
            <Select value={paymentStatus} onValueChange={(value) => setPaymentStatus(value as PaymentStatus)}>
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={PaymentStatus.PENDING}>Pending</SelectItem>
                <SelectItem value={PaymentStatus.PAID}>Paid</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="border-t pt-4 mt-4">
            <h4 className="text-sm font-medium text-muted-foreground">Bank Details</h4>
            
            <div className="grid grid-cols-4 items-center gap-4 mt-2">
              <Label htmlFor="bankName" className="text-right">
                Bank Name
              </Label>
              <Input 
                id="bankName" 
                value={bankName} 
                onChange={(e) => setBankName(e.target.value)} 
                className="col-span-3" 
                required
              />
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="accountNumber" className="text-right">
                Account No.
              </Label>
              <Input 
                id="accountNumber" 
                value={accountNumber} 
                onChange={(e) => setAccountNumber(e.target.value)} 
                className="col-span-3" 
                required
              />
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="ifscCode" className="text-right">
                IFSC Code
              </Label>
              <Input 
                id="ifscCode" 
                value={ifscCode} 
                onChange={(e) => setIfscCode(e.target.value)} 
                className="col-span-3" 
                required
              />
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="email" className="text-right">
                Email
              </Label>
              <Input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="col-span-3"
              />
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="mobile" className="text-right">
                Mobile
              </Label>
              <Input
                type="tel"
                id="mobile"
                value={mobile}
                onChange={(e) => setMobile(e.target.value)}
                className="col-span-3"
              />
            </div>
          </div>

          <div className="flex justify-end">
            <Button type="submit">
              {editInvoice ? 'Update Invoice' : 'Create Invoice'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default InvoiceForm;
