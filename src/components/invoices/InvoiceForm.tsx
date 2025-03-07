import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { PaymentStatus, Invoice } from '@/lib/types';
import { Calendar as CalendarIcon, Upload, Loader2, Camera, Plus, Trash2 } from 'lucide-react';
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

interface MaterialItem {
  id: string;
  material: string;
  quantity: number;
  rate: number;
  gstPercentage: number;
  grossAmount: number;
  netAmount: number;
}

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
  const [partyNameFixed, setPartyNameFixed] = useState<boolean>(false);
  
  // Material items list
  const [materialItems, setMaterialItems] = useState<MaterialItem[]>([
    {
      id: '1',
      material: '',
      quantity: 0,
      rate: 0,
      gstPercentage: 18,
      grossAmount: 0,
      netAmount: 0
    }
  ]);
  
  // Grand totals
  const [grandGrossAmount, setGrandGrossAmount] = useState<number>(0);
  const [grandNetAmount, setGrandNetAmount] = useState<number>(0);
  
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

  // Fix party name when entered
  const handlePartyNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!partyNameFixed) {
      setPartyName(e.target.value);
    }
  };

  const handlePartyNameBlur = () => {
    if (partyName.trim() !== '') {
      setPartyNameFixed(true);
      // Create a simple ID from the party name (in a real app this would be from a database)
      const generatedId = Math.floor(100 + Math.random() * 900).toString();
      setPartyId(generatedId);
    }
  };

  // Calculate total amounts whenever material items change
  useEffect(() => {
    let totalGross = 0;
    let totalNet = 0;
    
    materialItems.forEach(item => {
      totalGross += item.grossAmount;
      totalNet += item.netAmount;
    });
    
    setGrandGrossAmount(totalGross);
    setGrandNetAmount(totalNet);
  }, [materialItems]);

  // Handle material item changes
  const updateMaterialItem = (index: number, field: keyof MaterialItem, value: any) => {
    const updatedItems = [...materialItems];
    const item = { ...updatedItems[index], [field]: value };
    
    // Recalculate amounts if quantity, rate or GST changes
    if (field === 'quantity' || field === 'rate' || field === 'gstPercentage') {
      const quantity = field === 'quantity' ? value : item.quantity;
      const rate = field === 'rate' ? value : item.rate;
      const grossAmount = quantity * rate;
      const gstPercentage = field === 'gstPercentage' ? value : item.gstPercentage;
      const netAmount = grossAmount + (grossAmount * (gstPercentage / 100));
      
      item.grossAmount = grossAmount;
      item.netAmount = netAmount;
    }
    
    updatedItems[index] = item;
    setMaterialItems(updatedItems);
  };

  // Add new material item
  const addMaterialItem = () => {
    setMaterialItems([
      ...materialItems,
      {
        id: Date.now().toString(),
        material: '',
        quantity: 0,
        rate: 0,
        gstPercentage: 18,
        grossAmount: 0,
        netAmount: 0
      }
    ]);
  };

  // Remove material item
  const removeMaterialItem = (index: number) => {
    if (materialItems.length > 1) {
      const updatedItems = [...materialItems];
      updatedItems.splice(index, 1);
      setMaterialItems(updatedItems);
    } else {
      toast({
        title: "Cannot remove item",
        description: "At least one material item is required",
        variant: "destructive",
      });
    }
  };

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

  // Reset party name
  const resetPartyName = () => {
    setPartyNameFixed(false);
    setPartyName('');
    setPartyId('');
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
    
    // Validate at least one material item has data
    const validMaterials = materialItems.filter(item => 
      item.material && item.quantity > 0 && item.rate > 0
    );
    
    if (validMaterials.length === 0) {
      toast({
        title: "Invalid materials",
        description: "Please add at least one material with quantity and rate",
        variant: "destructive",
      });
      return;
    }
    
    // Use the first material for backward compatibility with the Invoice type
    // In a real application, you would modify the Invoice type to support multiple materials
    const primaryMaterial = materialItems[0];
    
    // Create invoice object from form data
    const invoiceData: Omit<Invoice, 'id' | 'createdAt'> = {
      date,
      partyId,
      partyName,
      material: materialItems.map(item => item.material).join(', '),
      quantity: primaryMaterial.quantity,
      rate: primaryMaterial.rate,
      gstPercentage: primaryMaterial.gstPercentage,
      grossAmount: grandGrossAmount,
      netAmount: grandNetAmount,
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

        <div className="space-y-2 relative">
          <Label htmlFor="party">Party Name</Label>
          <div className="flex gap-2">
            <Input 
              id="party" 
              value={partyName} 
              onChange={handlePartyNameChange} 
              onBlur={handlePartyNameBlur}
              placeholder="Enter party name"
              required
              disabled={partyNameFixed}
              className={partyNameFixed ? "bg-muted" : ""}
            />
            {partyNameFixed && (
              <Button 
                type="button" 
                variant="outline" 
                size="icon" 
                onClick={resetPartyName}
                className="flex-shrink-0"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </div>

      <Separator />

      {/* Materials Section */}
      <div>
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium">Materials</h3>
          <Button 
            type="button" 
            size="sm"
            onClick={addMaterialItem}
            className="gap-1"
          >
            <Plus className="h-4 w-4" />
            Add Material
          </Button>
        </div>
        
        {materialItems.map((item, index) => (
          <div key={item.id} className="p-4 border rounded-md mb-4 bg-muted/30">
            <div className="flex justify-between items-center mb-2">
              <h4 className="font-medium">Material #{index + 1}</h4>
              {materialItems.length > 1 && (
                <Button 
                  type="button" 
                  variant="outline" 
                  size="icon"
                  onClick={() => removeMaterialItem(index)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-2">
              <div className="space-y-2">
                <Label htmlFor={`material-${index}`}>Material Name</Label>
                <Input 
                  id={`material-${index}`} 
                  value={item.material} 
                  onChange={(e) => updateMaterialItem(index, 'material', e.target.value)} 
                  placeholder="e.g., TMT Steel Bars"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor={`quantity-${index}`}>Quantity</Label>
                <Input 
                  id={`quantity-${index}`} 
                  type="number" 
                  value={item.quantity || ''} 
                  onChange={(e) => updateMaterialItem(index, 'quantity', Number(e.target.value))} 
                  min="0"
                  step="0.01"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor={`rate-${index}`}>Rate (₹)</Label>
                <Input 
                  id={`rate-${index}`} 
                  type="number" 
                  value={item.rate || ''} 
                  onChange={(e) => updateMaterialItem(index, 'rate', Number(e.target.value))} 
                  min="0"
                  step="0.01"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor={`gst-${index}`}>GST Percentage (%)</Label>
                <Select 
                  value={item.gstPercentage.toString()} 
                  onValueChange={(value) => updateMaterialItem(index, 'gstPercentage', Number(value))}
                >
                  <SelectTrigger id={`gst-${index}`}>
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
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor={`gross-${index}`}>Gross Amount (₹)</Label>
                <Input 
                  id={`gross-${index}`} 
                  value={item.grossAmount.toLocaleString()} 
                  readOnly 
                  className="bg-muted"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor={`net-${index}`}>Net Amount (₹)</Label>
                <Input 
                  id={`net-${index}`} 
                  value={item.netAmount.toLocaleString()} 
                  readOnly 
                  className="bg-muted"
                />
              </div>
            </div>
          </div>
        ))}
        
        {/* Grand Total */}
        <div className="bg-muted p-4 rounded-md mt-4">
          <div className="flex flex-col md:flex-row md:justify-end md:items-center gap-4">
            <div className="space-y-2 md:w-1/4">
              <Label htmlFor="grandGross">Grand Gross Total (₹)</Label>
              <Input 
                id="grandGross" 
                value={grandGrossAmount.toLocaleString()} 
                readOnly 
                className="bg-muted font-medium"
              />
            </div>
            
            <div className="space-y-2 md:w-1/4">
              <Label htmlFor="grandNet" className="font-medium">Grand Net Total (₹)</Label>
              <Input 
                id="grandNet" 
                value={grandNetAmount.toLocaleString()} 
                readOnly 
                className="bg-muted font-bold text-primary"
              />
            </div>
          </div>
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
