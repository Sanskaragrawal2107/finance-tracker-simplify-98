
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { PaymentStatus, Invoice } from '@/lib/types';
import { Calendar as CalendarIcon, Upload, Loader2, Camera } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
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
const gstRates = [5, 12, 18, 28];

const InvoiceForm: React.FC<InvoiceFormProps> = ({ 
  onSubmit,
  initialData
}) => {
  const { toast } = useToast();
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
  const [ifscValidationMessage, setIfscValidationMessage] = useState<string>('');
  const [isFetchingBankDetails, setIsFetchingBankDetails] = useState<boolean>(false);

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

  // Set party ID when party name changes
  useEffect(() => {
    if (partyName) {
      // Create a simple ID from the party name (in a real app this would be from a database)
      const generatedId = Math.floor(100 + Math.random() * 900).toString();
      setPartyId(generatedId);
    }
  }, [partyName]);

  // Handle account number input
  const handleAccountNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, ''); // Remove non-digits
    if (value.length <= 16) {
      setAccountNumber(value);
    }
  };

  // Validate IFSC code
  const validateIfsc = (code: string) => {
    // Basic IFSC validation: must be 11 characters
    if (code.length !== 11) {
      return false;
    }
    
    // Check if 5th digit is '0'
    return code[4] === '0';
  };

  // Handle IFSC code change
  const handleIfscChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.toUpperCase();
    setIfscCode(value);
    
    // Clear validation message when user is typing
    if (value.length < 11) {
      setIfscValidationMessage('');
    }
  };

  // Handle IFSC code validation and bank details fetching
  const handleIfscBlur = async () => {
    // If IFSC is not 11 characters yet, don't validate
    if (ifscCode.length !== 11) {
      setIfscValidationMessage('IFSC code must be 11 characters');
      return;
    }
    
    // Validate 5th digit must be '0'
    if (ifscCode[4] !== '0') {
      setIfscValidationMessage('5th digit of IFSC code must be 0');
      setBankName('');
      return;
    }
    
    // Clear validation message if valid
    setIfscValidationMessage('');
    
    // Fetch bank details from Razorpay API
    try {
      setIsFetchingBankDetails(true);
      const response = await fetch(`https://ifsc.razorpay.com/${ifscCode}`);
      
      if (response.ok) {
        const data = await response.json();
        setBankName(`${data.BANK}, ${data.BRANCH}, ${data.CITY}`);
        toast({
          title: "Bank details fetched",
          description: "Bank details have been automatically filled",
        });
      } else {
        // Handle invalid IFSC
        setIfscValidationMessage('Invalid IFSC code');
        setBankName('');
      }
    } catch (error) {
      setIfscValidationMessage('Failed to fetch bank details');
      console.error('Error fetching bank details:', error);
    } finally {
      setIsFetchingBankDetails(false);
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
    
    // Validate IFSC before submission
    if (!validateIfsc(ifscCode)) {
      toast({
        title: "Invalid IFSC code",
        description: "Please provide a valid IFSC code with 5th digit as '0'",
        variant: "destructive",
      });
      return;
    }
    
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
                onSelect={(newDate) => newDate && setDate(newDate)}
                initialFocus
                className={cn("p-3 pointer-events-auto")}
              />
            </PopoverContent>
          </Popover>
        </div>

        <div className="space-y-2">
          <Label htmlFor="party">Party Name</Label>
          <Input 
            id="party" 
            value={partyName} 
            onChange={(e) => setPartyName(e.target.value)} 
            placeholder="Enter party name"
            required
          />
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
            <Label htmlFor="accountNumber">Account Number (max 16 digits)</Label>
            <Input 
              id="accountNumber" 
              value={accountNumber} 
              onChange={handleAccountNumberChange}
              placeholder="Enter Account Number (max 16 digits)"
              required
              maxLength={16}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="ifscCode">IFSC Code</Label>
            <div className="relative">
              <Input 
                id="ifscCode" 
                value={ifscCode} 
                onChange={handleIfscChange}
                onBlur={handleIfscBlur}
                placeholder="Enter IFSC Code (11 characters)"
                maxLength={11}
                required
                className={ifscValidationMessage ? "border-red-500" : ""}
              />
              {isFetchingBankDetails && (
                <div className="absolute top-0 right-0 h-full flex items-center pr-3">
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                </div>
              )}
              {ifscValidationMessage && (
                <p className="text-red-500 text-sm mt-1">{ifscValidationMessage}</p>
              )}
              <p className="text-xs text-muted-foreground mt-1">
                Must be 11 characters and 5th digit must be '0'
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="bankName">Bank Name & Branch</Label>
            <Input 
              id="bankName" 
              value={bankName} 
              onChange={(e) => setBankName(e.target.value)} 
              placeholder="Bank Name (auto-filled from IFSC)"
              required
              readOnly={bankName !== ''}
              className={bankName ? "bg-muted" : ""}
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
            <Label htmlFor="mobile">Mobile Number (Optional)</Label>
            <Input 
              id="mobile" 
              value={mobile} 
              onChange={(e) => setMobile(e.target.value.replace(/\D/g, ''))} 
              placeholder="Mobile Number"
              maxLength={10}
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
              accept=".pdf,.jpg,.jpeg,.png,image/*"
              onChange={handleFileChange}
              capture="environment"
            />
            <label htmlFor="bill" className="cursor-pointer flex flex-col items-center">
              <div className="flex gap-2">
                <Upload className="h-6 w-6 text-muted-foreground" />
                <Camera className="h-6 w-6 text-muted-foreground" />
              </div>
              <span className="text-sm text-muted-foreground mt-2">
                {billFile ? billFile.name : "Click to upload or take a photo"}
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
