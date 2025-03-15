import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { toast } from 'sonner';
import { useAuth } from '@/hooks/use-auth';
import { supabase } from '@/integrations/supabase/client';
import { Invoice, MaterialItem, BankDetails } from '@/lib/types';
import { Plus, Trash } from 'lucide-react';

interface InvoiceFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (invoice: Omit<Invoice, 'id' | 'createdAt'>) => void;
  siteId: string;
}

const InvoiceForm: React.FC<InvoiceFormProps> = ({ isOpen, onClose, onSubmit, siteId }) => {
  const { user } = useAuth();
  const [partyId, setPartyId] = useState('');
  const [partyName, setPartyName] = useState('');
  const [material, setMaterial] = useState('');
  const [quantity, setQuantity] = useState(0);
  const [rate, setRate] = useState(0);
  const [gstPercentage, setGstPercentage] = useState(0);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [materialItems, setMaterialItems] = useState<MaterialItem[]>([{ itemName: '', quantity: 0, rate: 0 }]);
  const [bankDetails, setBankDetails] = useState<BankDetails>({
    bankName: '',
    accountNumber: '',
    ifscCode: ''
  });

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
      
      // Calculate gross amount and net amount
      const grossAmount = quantity * rate;
      const gstAmount = (grossAmount * gstPercentage) / 100;
      const netAmount = grossAmount + gstAmount;
      
      // Convert material items and bank details to strings for storage
      const materialItemsString = JSON.stringify(materialItems);
      const bankDetailsString = JSON.stringify(bankDetails);
      
      // Insert invoice into Supabase
      const { data, error } = await supabase
        .from('site_invoices')
        .insert({
          site_id: siteId,
          date: new Date().toISOString(),
          party_id: partyId,
          party_name: partyName,
          material: material,
          quantity: quantity,
          rate: rate,
          gst_percentage: gstPercentage,
          gross_amount: grossAmount,
          net_amount: netAmount,
          material_items: materialItemsString,
          bank_details: bankDetailsString,
          bill_url: billUrl,
          payment_status: 'pending',
          created_by: user?.id || '',
          approver_type: 'supervisor'
        })
        .select();
      
      if (error) {
        throw error;
      }
      
      if (data) {
        // Prepare data for the onSubmit callback
        const invoice: Omit<Invoice, 'id' | 'createdAt'> = {
          siteId: siteId,
          date: new Date(),
          partyId: partyId,
          partyName: partyName,
          material: material,
          quantity: quantity,
          rate: rate,
          gstPercentage: gstPercentage,
          grossAmount: grossAmount,
          netAmount: netAmount,
          materialItems: materialItems,
          bankDetails: bankDetails,
          billUrl: billUrl,
          paymentStatus: 'pending',
          createdBy: user?.id || '',
          approverType: 'supervisor'
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
    setMaterialItems([...materialItems, { itemName: '', quantity: 0, rate: 0 }]);
  };

  // Function to update a material item
  const updateMaterialItem = (index: number, field: string, value: any) => {
    const updatedItems = [...materialItems];
    updatedItems[index][field] = value;
    setMaterialItems(updatedItems);
  };

  // Function to remove a material item
  const removeMaterialItem = (index: number) => {
    const updatedItems = [...materialItems];
    updatedItems.splice(index, 1);
    setMaterialItems(updatedItems);
  };

  // Function to update bank details
  const updateBankDetails = (field: string, value: string) => {
    setBankDetails({ ...bankDetails, [field]: value });
  };

  // Reset the form to initial state
  const resetForm = () => {
    setPartyId('');
    setPartyName('');
    setMaterial('');
    setQuantity(0);
    setRate(0);
    setGstPercentage(0);
    setSelectedFile(null);
    setMaterialItems([{ itemName: '', quantity: 0, rate: 0 }]);
    setBankDetails({
      bankName: '',
      accountNumber: '',
      ifscCode: ''
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[625px]">
        <DialogHeader>
          <DialogTitle>Add New Invoice</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-4 py-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="partyId">Party ID</Label>
              <Input
                id="partyId"
                value={partyId}
                onChange={(e) => setPartyId(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="partyName">Party Name</Label>
              <Input
                id="partyName"
                value={partyName}
                onChange={(e) => setPartyName(e.target.value)}
                required
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="material">Material</Label>
            <Input
              id="material"
              value={material}
              onChange={(e) => setMaterial(e.target.value)}
              required
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="quantity">Quantity</Label>
              <Input
                type="number"
                id="quantity"
                value={quantity}
                onChange={(e) => setQuantity(Number(e.target.value))}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="rate">Rate</Label>
              <Input
                type="number"
                id="rate"
                value={rate}
                onChange={(e) => setRate(Number(e.target.value))}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="gstPercentage">GST Percentage</Label>
              <Input
                type="number"
                id="gstPercentage"
                value={gstPercentage}
                onChange={(e) => setGstPercentage(Number(e.target.value))}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Material Items</Label>
            {materialItems.map((item, index) => (
              <div key={index} className="flex items-center space-x-2 mb-2">
                <Input
                  type="text"
                  placeholder="Item Name"
                  value={item.itemName}
                  onChange={(e) => updateMaterialItem(index, 'itemName', e.target.value)}
                  className="flex-1"
                />
                <Input
                  type="number"
                  placeholder="Quantity"
                  value={item.quantity}
                  onChange={(e) => updateMaterialItem(index, 'quantity', Number(e.target.value))}
                  className="w-24"
                />
                <Input
                  type="number"
                  placeholder="Rate"
                  value={item.rate}
                  onChange={(e) => updateMaterialItem(index, 'rate', Number(e.target.value))}
                  className="w-24"
                />
                <Button type="button" variant="destructive" size="icon" onClick={() => removeMaterialItem(index)}>
                  <Trash className="h-4 w-4" />
                </Button>
              </div>
            ))}
            <Button type="button" variant="secondary" size="sm" onClick={addMaterialItem}>
              <Plus className="h-4 w-4 mr-2" />
              Add Item
            </Button>
          </div>

          <div className="space-y-2">
            <Label>Bank Details</Label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="bankName">Bank Name</Label>
                <Input
                  type="text"
                  id="bankName"
                  value={bankDetails.bankName}
                  onChange={(e) => updateBankDetails('bankName', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="accountNumber">Account Number</Label>
                <Input
                  type="text"
                  id="accountNumber"
                  value={bankDetails.accountNumber}
                  onChange={(e) => updateBankDetails('accountNumber', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="ifscCode">IFSC Code</Label>
                <Input
                  type="text"
                  id="ifscCode"
                  value={bankDetails.ifscCode}
                  onChange={(e) => updateBankDetails('ifscCode', e.target.value)}
                />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="bill">Upload Bill</Label>
            <Input
              type="file"
              id="bill"
              accept="image/*,application/pdf"
              onChange={handleFileSelect}
            />
            {selectedFile && (
              <p className="text-sm text-muted-foreground">
                Selected File: {selectedFile.name}
              </p>
            )}
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="secondary" disabled={isSubmitting}>
                Cancel
              </Button>
            </DialogClose>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Submitting..." : "Submit"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default InvoiceForm;
