
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { PaymentStatus, Invoice } from '@/lib/types';
import { Calendar as CalendarIcon, Upload } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type InvoiceFormProps = {
  onSubmit: (invoice: Omit<Invoice, 'id' | 'createdAt'>) => void;
  initialData?: Partial<Invoice>;
};

// Mock data - would come from API in real application
const parties = [
  { id: '101', name: 'Steel Suppliers Ltd' },
  { id: '102', name: 'Cement Corporation' },
  { id: '103', name: 'Brick Manufacturers' },
  { id: '104', name: 'Electrical Solutions' },
  { id: '105', name: 'Sanitary Fittings Co.' },
];

const gstRates = [5, 12, 18, 28];

const InvoiceForm: React.FC<InvoiceFormProps> = ({ 
  onSubmit,
  initialData
}) => {
  const [date, setDate] = useState<Date>(initialData?.date || new Date());
  const [partyId, setPartyId] = useState<string>(initialData?.partyId || '');
  const [partyName, setPartyName] = useState<string>(initialData?.partyName || '');
  const [material, setMaterial] = useState<string>(initialData?.material || '');
  const [quantity, setQuantity] = useState<number>(initialData?.quantity || 0);
  const [rate, setRate] = useState<number>(initialData?.rate || 0);
  const [gstPercentage, setGstPercentage] = useState<number>(initialData?.gstPercentage || 18);
  const [grossAmount, setGrossAmount] = useState<number>(initialData?.grossAmount || 0);
  const [netAmount, setNetAmount] = useState<number>(initialData?.netAmount || 0);
  const [billFile, setBillFile] = useState<File | null>(null);
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>(
    initialData?.paymentStatus || PaymentStatus.PENDING
  );
  
  // Bank details
  const [accountNumber, setAccountNumber] = useState<string>(initialData?.bankDetails?.accountNumber || '');
  const [bankName, setBankName] = useState<string>(initialData?.bankDetails?.bankName || '');
  const [ifscCode, setIfscCode] = useState<string>(initialData?.bankDetails?.ifscCode || '');
  const [email, setEmail] = useState<string>(initialData?.bankDetails?.email || '');
  const [mobile, setMobile] = useState<string>(initialData?.bankDetails?.mobile || '');

  // Calculate gross amount when quantity or rate changes
  useEffect(() => {
    const calculated = quantity * rate;
    setGrossAmount(calculated);
  }, [quantity, rate]);

  // Calculate net amount when gross amount or GST changes
  useEffect(() => {
    const gstAmount = grossAmount * (gstPercentage / 100);
    setNetAmount(grossAmount + gstAmount);
  }, [grossAmount, gstPercentage]);

  // Handle party selection
  const handlePartySelect = (selectedPartyId: string) => {
    setPartyId(selectedPartyId);
    const selectedParty = parties.find(party => party.id === selectedPartyId);
    if (selectedParty) {
      setPartyName(selectedParty.name);
    }
  };

  // Handle IFSC code validation and bank details fetching
  const handleIfscBlur = () => {
    // In a real app, this would make an API call to validate IFSC and fetch bank details
    // For demo purposes, we'll simulate a successful lookup if the code meets our validation
    if (ifscCode.length === 11 && ifscCode[4] === '0') {
      setBankName('Simulated Bank Name');
      // Additional bank details could be auto-filled here
    }
  };

  // Handle bill file upload
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setBillFile(e.target.files[0]);
    }
  };

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Create invoice object from form data
    const invoiceData: Omit<Invoice, 'id' | 'createdAt'> = {
      date,
      partyId,
      partyName,
      material,
      quantity,
      rate,
      gstPercentage,
      grossAmount,
      netAmount,
      bankDetails: {
        accountNumber,
        bankName,
        ifscCode,
        email,
        mobile,
      },
      billUrl: billFile ? URL.createObjectURL(billFile) : undefined,
      paymentStatus,
      createdBy: 'Current User', // In a real app, this would come from auth context
    };
    
    onSubmit(invoiceData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Basic Invoice Information */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="date">Invoice Date</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !date && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {date ? format(date, "PPP") : <span>Pick a date</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={date}
                onSelect={(date) => date && setDate(date)}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>

        <div className="space-y-2">
          <Label htmlFor="party">Party Name</Label>
          <Select value={partyId} onValueChange={handlePartySelect}>
            <SelectTrigger>
              <SelectValue placeholder="Select party" />
            </SelectTrigger>
            <SelectContent>
              {parties.map(party => (
                <SelectItem key={party.id} value={party.id}>
                  {party.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="material">Material</Label>
          <Input 
            id="material" 
            value={material} 
            onChange={(e) => setMaterial(e.target.value)} 
            placeholder="e.g., TMT Steel Bars"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="quantity">Quantity</Label>
          <Input 
            id="quantity" 
            type="number" 
            value={quantity || ''} 
            onChange={(e) => setQuantity(Number(e.target.value))} 
            min="0"
            step="0.01"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="rate">Rate (₹)</Label>
          <Input 
            id="rate" 
            type="number" 
            value={rate || ''} 
            onChange={(e) => setRate(Number(e.target.value))} 
            min="0"
            step="0.01"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="gst">GST Percentage (%)</Label>
          <Select 
            value={gstPercentage.toString()} 
            onValueChange={(value) => setGstPercentage(Number(value))}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select GST rate" />
            </SelectTrigger>
            <SelectContent>
              {gstRates.map(rate => (
                <SelectItem key={rate} value={rate.toString()}>
                  {rate}%
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="grossAmount">Gross Amount (₹)</Label>
          <Input 
            id="grossAmount" 
            value={grossAmount.toLocaleString()} 
            readOnly 
            className="bg-muted"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="netAmount">Net Amount (₹)</Label>
          <Input 
            id="netAmount" 
            value={netAmount.toLocaleString()} 
            readOnly 
            className="bg-muted font-medium"
          />
        </div>
      </div>

      <Separator />

      {/* Bank Details */}
      <div>
        <h3 className="text-lg font-medium mb-4">Bank Details</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="accountNumber">Account Number</Label>
            <Input 
              id="accountNumber" 
              value={accountNumber} 
              onChange={(e) => setAccountNumber(e.target.value)} 
              placeholder="Account Number"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="ifscCode">IFSC Code</Label>
            <Input 
              id="ifscCode" 
              value={ifscCode} 
              onChange={(e) => setIfscCode(e.target.value)} 
              onBlur={handleIfscBlur}
              placeholder="IFSC Code"
              maxLength={11}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="bankName">Bank Name</Label>
            <Input 
              id="bankName" 
              value={bankName} 
              onChange={(e) => setBankName(e.target.value)} 
              placeholder="Bank Name"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email (Optional)</Label>
            <Input 
              id="email" 
              type="email"
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              placeholder="Email Address"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="mobile">Mobile Number</Label>
            <Input 
              id="mobile" 
              value={mobile} 
              onChange={(e) => setMobile(e.target.value)} 
              placeholder="Mobile Number"
              maxLength={10}
              required
            />
          </div>
        </div>
      </div>

      <Separator />

      {/* Bill Upload & Status */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="bill">Upload Bill</Label>
          <div className="border border-dashed rounded-md p-4 text-center cursor-pointer hover:bg-muted/50 transition-colors">
            <input
              type="file"
              id="bill"
              className="hidden"
              accept=".pdf,.jpg,.jpeg,.png"
              onChange={handleFileChange}
            />
            <label htmlFor="bill" className="cursor-pointer flex flex-col items-center">
              <Upload className="h-6 w-6 text-muted-foreground mb-2" />
              <span className="text-sm text-muted-foreground">
                {billFile ? billFile.name : "Click to upload bill (PDF, JPG, PNG)"}
              </span>
            </label>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="status">Payment Status</Label>
          <Select 
            value={paymentStatus} 
            onValueChange={(value) => setPaymentStatus(value as PaymentStatus)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={PaymentStatus.PENDING}>Pending</SelectItem>
              <SelectItem value={PaymentStatus.PAID}>Paid</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="outline">Cancel</Button>
        <Button type="submit">Save Invoice</Button>
      </div>
    </form>
  );
};

export default InvoiceForm;
