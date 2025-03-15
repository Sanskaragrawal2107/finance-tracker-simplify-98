
import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { toast } from 'sonner';
import { Calendar as CalendarIcon, Upload, Camera, Plus } from "lucide-react"
import { format } from "date-fns"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useAuth } from '@/hooks/use-auth';
import { supabase } from '@/integrations/supabase/client';
import { Invoice, MaterialItem, BankDetails, PaymentStatus } from '@/lib/types';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';

interface InvoiceFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (invoice: Omit<Invoice, 'id' | 'createdAt'>) => void;
  siteId: string;
}

const InvoiceForm: React.FC<InvoiceFormProps> = ({ isOpen, onClose, onSubmit, siteId }) => {
  const { user } = useAuth();
  const [date, setDate] = useState<Date>(new Date());
  const [partyName, setPartyName] = useState('');
  const [partyId, setPartyId] = useState('');
  const [material, setMaterial] = useState('');
  const [materialItems, setMaterialItems] = useState<MaterialItem[]>([
    { material: '', quantity: 0, rate: 0, gstPercentage: 18 }
  ]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [approverType, setApproverType] = useState<'ho' | 'supervisor'>('ho');
  const [bankDetails, setBankDetails] = useState<BankDetails>({
    bankName: '',
    accountNumber: '',
    ifscCode: '',
    email: '',
    mobile: ''
  });
  const [netTaxableAmount, setNetTaxableAmount] = useState(0);
  const [grandTotal, setGrandTotal] = useState(0);

  // Calculate totals when material items change
  useEffect(() => {
    let taxableAmount = 0;
    let total = 0;

    materialItems.forEach(item => {
      if (item.quantity && item.rate) {
        const itemAmount = item.quantity * item.rate;
        taxableAmount += itemAmount;
        
        // Calculate GST if percentage exists
        const gstAmount = item.gstPercentage ? (itemAmount * item.gstPercentage) / 100 : 0;
        total += itemAmount + (gstAmount || 0);
      }
    });

    setNetTaxableAmount(taxableAmount);
    setGrandTotal(total);
  }, [materialItems]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setIsSubmitting(true);
      
      let billUrl = '';
      
      // Upload image if selected
      if (selectedFile) {
        const fileExt = selectedFile.name.split('.').pop();
        const fileName = `${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
        
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('invoice-images')
          .upload(fileName, selectedFile);
          
        if (uploadError) {
          throw uploadError;
        }
        
        // Get the public URL for the uploaded image
        const { data: { publicUrl } } = supabase.storage
          .from('invoice-images')
          .getPublicUrl(fileName);
          
        billUrl = publicUrl;
      }
      
      // Convert material items and bank details to strings for storage
      const materialItemsString = JSON.stringify(materialItems);
      const bankDetailsString = JSON.stringify(bankDetails);
      
      // Insert invoice into Supabase
      const { data, error } = await supabase
        .from('site_invoices')
        .insert({
          site_id: siteId,
          date: date.toISOString(),
          party_id: partyId,
          party_name: partyName,
          material: material,
          quantity: materialItems.reduce((sum, item) => sum + (item.quantity || 0), 0),
          rate: materialItems.length > 0 ? materialItems[0].rate || 0 : 0,
          gst_percentage: materialItems.length > 0 ? materialItems[0].gstPercentage || 0 : 0,
          gross_amount: netTaxableAmount,
          net_amount: grandTotal,
          material_items: materialItemsString,
          bank_details: bankDetailsString,
          bill_url: billUrl,
          payment_status: 'pending' as PaymentStatus,
          created_by: user?.id || '',
          approver_type: approverType
        })
        .select();
      
      if (error) {
        throw error;
      }
      
      if (data) {
        // Prepare data for the onSubmit callback
        const invoice: Omit<Invoice, 'id' | 'createdAt'> = {
          siteId: siteId,
          date: date,
          partyId: partyId,
          partyName: partyName,
          material: material,
          quantity: materialItems.reduce((sum, item) => sum + (item.quantity || 0), 0),
          rate: materialItems.length > 0 ? materialItems[0].rate || 0 : 0,
          gstPercentage: materialItems.length > 0 ? materialItems[0].gstPercentage || 0 : 0,
          grossAmount: netTaxableAmount,
          netAmount: grandTotal,
          materialItems: materialItems,
          bankDetails: bankDetails,
          billUrl: billUrl,
          paymentStatus: 'pending',
          createdBy: user?.id || '',
          approverType: approverType
        };
        
        // Call the onSubmit callback from the parent component
        onSubmit(invoice);
        
        // Reset form
        resetForm();
        
        // Show success message
        toast.success('Invoice added successfully!');
        
        // Close the form
        onClose();
      }
    } catch (error: any) {
      console.error('Error creating invoice:', error);
      toast.error(`Failed to create invoice: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Function to handle file selection
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFile(e.target.files[0]);
    }
  };

  // Function to add a material item
  const addMaterialItem = () => {
    setMaterialItems([...materialItems, { material: '', quantity: 0, rate: 0, gstPercentage: 18 }]);
  };

  // Function to update a material item
  const updateMaterialItem = (index: number, field: keyof MaterialItem, value: any) => {
    const updatedItems = [...materialItems];
    updatedItems[index] = {
      ...updatedItems[index],
      [field]: value
    };
    setMaterialItems(updatedItems);
  };

  // Function to remove a material item
  const removeMaterialItem = (index: number) => {
    const updatedItems = [...materialItems];
    updatedItems.splice(index, 1);
    setMaterialItems(updatedItems);
  };

  // Reset the form to initial state
  const resetForm = () => {
    setDate(new Date());
    setPartyName('');
    setPartyId('');
    setMaterial('');
    setMaterialItems([{ material: '', quantity: 0, rate: 0, gstPercentage: 18 }]);
    setSelectedFile(null);
    setBankDetails({
      bankName: '',
      accountNumber: '',
      ifscCode: '',
      email: '',
      mobile: ''
    });
    setApproverType('ho');
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[625px]">
        <DialogHeader>
          <DialogTitle>Add Site Invoice</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Invoice Header */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="date">Invoice Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left font-normal"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {date ? format(date, "MMMM dd, yyyy") : <span>Select date</span>}
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
              <Label htmlFor="partyName">Party Name</Label>
              <Input 
                id="partyName"
                placeholder="Enter party name"
                value={partyName}
                onChange={(e) => setPartyName(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="partyId">Invoice Number</Label>
              <Input
                id="partyId"
                placeholder="Enter invoice number"
                value={partyId}
                onChange={(e) => setPartyId(e.target.value)}
                required
              />
            </div>
          </div>

          <Separator />

          {/* Materials Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Materials</h3>

            {materialItems.map((item, index) => (
              <div key={index} className="p-4 bg-gray-50 rounded-lg space-y-4">
                <h4 className="font-medium">Add New Material</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor={`materialName-${index}`}>Material Name</Label>
                    <Input
                      id={`materialName-${index}`}
                      placeholder="e.g., TMT Steel Bars"
                      value={item.material || ''}
                      onChange={(e) => updateMaterialItem(index, 'material', e.target.value)}
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
                      required
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor={`rate-${index}`}>Rate (₹)</Label>
                    <Input
                      id={`rate-${index}`}
                      type="number"
                      value={item.rate || ''}
                      onChange={(e) => updateMaterialItem(index, 'rate', Number(e.target.value))}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor={`gst-${index}`}>GST Percentage (%)</Label>
                    <Select
                      value={String(item.gstPercentage)}
                      onValueChange={(value) => updateMaterialItem(index, 'gstPercentage', Number(value))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select GST %" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="0">0%</SelectItem>
                        <SelectItem value="5">5%</SelectItem>
                        <SelectItem value="12">12%</SelectItem>
                        <SelectItem value="18">18%</SelectItem>
                        <SelectItem value="28">28%</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            ))}

            <Button 
              type="button" 
              variant="outline" 
              onClick={addMaterialItem}
              className="flex items-center"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Material
            </Button>

            <div className="grid grid-cols-2 gap-4 pt-4">
              <div className="space-y-2">
                <Label>Net Taxable Amount (₹)</Label>
                <Input 
                  readOnly 
                  value={netTaxableAmount.toFixed(2)}
                />
              </div>
              <div className="space-y-2">
                <Label>Grand Net Total (₹)</Label>
                <Input 
                  readOnly 
                  value={grandTotal.toFixed(2)}
                  className="font-bold text-blue-600"
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* Payment Information */}
          <div className="space-y-4">
            <h3 className="font-medium">Payment made by</h3>
            <RadioGroup 
              value={approverType} 
              onValueChange={(v) => setApproverType(v as 'ho' | 'supervisor')}
              className="flex space-x-8"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="ho" id="ho" />
                <Label htmlFor="ho">Head Office</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="supervisor" id="supervisor" />
                <Label htmlFor="supervisor">Supervisor</Label>
              </div>
            </RadioGroup>
          </div>
          
          <Separator />

          {/* Bank Details */}
          <div className="space-y-4">
            <h3 className="font-medium">Bank Details</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="accountNumber">Account Number (max 16 digits)</Label>
                <Input
                  id="accountNumber"
                  placeholder="Enter Account Number (max 16 digits)"
                  value={bankDetails.accountNumber}
                  onChange={(e) => setBankDetails({...bankDetails, accountNumber: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ifscCode">IFSC Code</Label>
                <Input
                  id="ifscCode"
                  placeholder="Enter IFSC Code (11 characters)"
                  value={bankDetails.ifscCode}
                  onChange={(e) => setBankDetails({...bankDetails, ifscCode: e.target.value})}
                />
                <p className="text-xs text-muted-foreground">Must be 11 characters and 5th digit must be '0'</p>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="bankName">Bank Name & Branch</Label>
                <Input
                  id="bankName"
                  placeholder="Bank Name (auto-filled from IFSC)"
                  value={bankDetails.bankName}
                  onChange={(e) => setBankDetails({...bankDetails, bankName: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email (Optional)</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Email Address"
                  value={bankDetails.email || ''}
                  onChange={(e) => setBankDetails({...bankDetails, email: e.target.value})}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="mobile">Mobile Number (Optional)</Label>
              <Input
                id="mobile"
                placeholder="Mobile Number"
                value={bankDetails.mobile || ''}
                onChange={(e) => setBankDetails({...bankDetails, mobile: e.target.value})}
              />
            </div>
          </div>

          <Separator />

          {/* Upload and Payment Status */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="uploadBill">Upload Bill</Label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer" 
                onClick={() => document.getElementById('fileInput')?.click()}>
                <div className="flex justify-center space-x-2">
                  <Upload className="h-5 w-5 text-gray-400" />
                  <Camera className="h-5 w-5 text-gray-400" />
                </div>
                <p className="mt-2 text-sm text-gray-500">Click to upload or take a photo</p>
                <input
                  id="fileInput"
                  type="file"
                  className="hidden"
                  accept="image/*,application/pdf"
                  onChange={handleFileSelect}
                />
                {selectedFile && (
                  <p className="mt-2 text-xs text-green-600">
                    Selected: {selectedFile.name}
                  </p>
                )}
              </div>
            </div>
            <div className="space-y-2">
              <Label>Payment Status</Label>
              <Input 
                value="Pending" 
                readOnly 
                className="bg-gray-50"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline" disabled={isSubmitting}>
                Cancel
              </Button>
            </DialogClose>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : "Save Invoice"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default InvoiceForm;
