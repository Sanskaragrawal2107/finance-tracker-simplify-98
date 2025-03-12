import React, { useState } from 'react';
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { format } from "date-fns";
import { CalendarIcon, Plus, Loader2, Upload, X } from "lucide-react";
import { toast } from "sonner";
import { supabase } from '@/integrations/supabase/client';
import { v4 as uuidv4 } from 'uuid';

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { Invoice, PaymentStatus, BankDetails } from "@/lib/types";

interface InvoiceFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (invoice: Omit<Invoice, 'id' | 'createdAt'>) => void;
}

// Define your form schema
const formSchema = z.object({
  date: z.date({
    required_error: "Date is required",
  }),
  partyId: z.string().min(2, {
    message: "Invoice number must be at least 2 characters",
  }),
  partyName: z.string().min(2, {
    message: "Party name must be at least 2 characters",
  }),
  material: z.string().min(2, {
    message: "Material must be at least 2 characters",
  }),
  quantity: z.coerce.number({
    required_error: "Quantity is required",
    invalid_type_error: "Quantity must be a number",
  }).positive(),
  rate: z.coerce.number({
    required_error: "Rate is required",
    invalid_type_error: "Rate must be a number",
  }).positive(),
  gstPercentage: z.coerce.number({
    required_error: "GST percentage is required",
    invalid_type_error: "GST percentage must be a number",
  }).min(0),
  bankName: z.string().min(2, {
    message: "Bank name must be at least 2 characters",
  }),
  accountNumber: z.string().min(4, {
    message: "Account number must be at least 4 characters",
  }),
  ifscCode: z.string().min(4, {
    message: "IFSC code must be at least 4 characters",
  }),
  email: z.string().email().optional().or(z.literal('')),
  mobile: z.string().optional().or(z.literal('')),
});

type FormValues = z.infer<typeof formSchema>;

const InvoiceForm: React.FC<InvoiceFormProps> = ({ isOpen, onClose, onSubmit }) => {
  const [invoiceImage, setInvoiceImage] = useState<File | null>(null);
  const [billImage, setBillImage] = useState<File | null>(null);
  const [uploadingInvoice, setUploadingInvoice] = useState(false);
  const [uploadingBill, setUploadingBill] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      date: new Date(),
      partyId: "",
      partyName: "",
      material: "",
      quantity: undefined,
      rate: undefined,
      gstPercentage: 18, // Default GST percentage in India
      bankName: "",
      accountNumber: "",
      ifscCode: "",
      email: "",
      mobile: "",
    },
  });

  const calculateGrossAmount = (quantity: number, rate: number) => {
    return quantity * rate;
  };

  const calculateNetAmount = (grossAmount: number, gstPercentage: number) => {
    return grossAmount + (grossAmount * (gstPercentage / 100));
  };

  const handleInvoiceImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setInvoiceImage(file);
    }
  };

  const handleBillImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setBillImage(file);
    }
  };

  const uploadFile = async (file: File, bucket: string, prefix: string): Promise<string | null> => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${prefix}/${uuidv4()}.${fileExt}`;
    
    const { data, error } = await supabase
      .storage
      .from(bucket)
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false
      });
    
    if (error) {
      console.error('Error uploading file:', error);
      throw error;
    }
    
    const { data: publicUrlData } = supabase
      .storage
      .from(bucket)
      .getPublicUrl(fileName);
    
    return publicUrlData.publicUrl;
  };

  const saveInvoiceToDatabase = async (invoiceData: Partial<Invoice>): Promise<string | null> => {
    try {
      const { data, error } = await supabase
        .from('invoices')
        .insert({
          date: invoiceData.date?.toISOString(),
          party_id: invoiceData.partyId,
          party_name: invoiceData.partyName,
          material: invoiceData.material,
          quantity: invoiceData.quantity,
          rate: invoiceData.rate,
          gst_percentage: invoiceData.gstPercentage,
          gross_amount: invoiceData.grossAmount,
          net_amount: invoiceData.netAmount,
          bank_details: invoiceData.bankDetails as any,
          bill_url: invoiceData.billUrl,
          invoice_image_url: invoiceData.invoiceImageUrl,
          payment_status: invoiceData.paymentStatus,
          created_by: 'Current User',
          site_id: invoiceData.siteId,
          approver_type: 'supervisor'
        })
        .select('id')
        .single();

      if (error) {
        console.error("Error saving invoice:", error);
        throw error;
      }

      console.log("Invoice saved to database:", data);
      return data.id;
    } catch (error: any) {
      console.error("Failed to save invoice:", error.message);
      return null;
    }
  };

  const handleSubmit = async (values: FormValues) => {
    setLoading(true);
    
    try {
      const selectedSiteId = localStorage.getItem('selectedSiteId');
      
      if (!selectedSiteId) {
        toast.error("No site selected");
        setLoading(false);
        return;
      }
      
      let invoiceImageUrl = null;
      let billUrl = null;
      
      if (invoiceImage) {
        setUploadingInvoice(true);
        try {
          invoiceImageUrl = await uploadFile(invoiceImage, 'invoice-images', 'invoices');
        } catch (error: any) {
          toast.error(`Failed to upload invoice image: ${error.message}`);
        } finally {
          setUploadingInvoice(false);
        }
      }
      
      if (billImage) {
        setUploadingBill(true);
        try {
          billUrl = await uploadFile(billImage, 'invoice-images', 'bills');
        } catch (error: any) {
          toast.error(`Failed to upload bill image: ${error.message}`);
        } finally {
          setUploadingBill(false);
        }
      }
      
      const grossAmount = calculateGrossAmount(values.quantity, values.rate);
      const netAmount = calculateNetAmount(grossAmount, values.gstPercentage);
      
      const bankDetails: BankDetails = {
        accountNumber: values.accountNumber,
        bankName: values.bankName,
        ifscCode: values.ifscCode,
        email: values.email || undefined,
        mobile: values.mobile || undefined,
      };
      
      const newInvoice: Omit<Invoice, 'id' | 'createdAt'> = {
        date: values.date,
        partyId: values.partyId,
        partyName: values.partyName,
        material: values.material,
        quantity: values.quantity,
        rate: values.rate,
        gstPercentage: values.gstPercentage,
        grossAmount: grossAmount,
        netAmount: netAmount,
        bankDetails: bankDetails,
        billUrl: billUrl || undefined,
        invoiceImageUrl: invoiceImageUrl || undefined,
        paymentStatus: PaymentStatus.PENDING,
        createdBy: "Current User",
        siteId: selectedSiteId,
        approverType: "supervisor"
      };

      const invoiceId = await saveInvoiceToDatabase(newInvoice);
      
      if (invoiceId) {
        onSubmit(newInvoice);
        form.reset();
        setInvoiceImage(null);
        setBillImage(null);
        onClose();
        toast.success("Invoice added successfully");
      }
    } catch (error: any) {
      toast.error(`Failed to save invoice: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>New Invoice</DialogTitle>
          <DialogDescription>
            Enter the details for the new invoice or bill payment.
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="date"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Date</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={"outline"}
                            className={cn(
                              "w-full pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value ? (
                              format(field.value, "PPP")
                            ) : (
                              <span>Select a date</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="partyId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Invoice Number</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter invoice number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="partyName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Vendor/Party Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter vendor name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="material"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Material/Service Description</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter material or service description" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="quantity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Quantity</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        placeholder="Enter quantity" 
                        value={field.value || ''}
                        onChange={(e) => {
                          const value = e.target.value;
                          field.onChange(value ? parseFloat(value) : undefined);
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="rate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Rate (₹)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        placeholder="Enter rate per unit" 
                        value={field.value || ''}
                        onChange={(e) => {
                          const value = e.target.value;
                          field.onChange(value ? parseFloat(value) : undefined);
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="gstPercentage"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>GST (%)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        placeholder="Enter GST percentage" 
                        value={field.value || ''}
                        onChange={(e) => {
                          const value = e.target.value;
                          field.onChange(value ? parseFloat(value) : undefined);
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {form.watch('quantity') && form.watch('rate') && (
              <div className="grid grid-cols-2 gap-4 p-3 rounded-md bg-gray-50 border">
                <div>
                  <p className="text-sm font-medium">Gross Amount:</p>
                  <p className="text-lg">₹{calculateGrossAmount(form.watch('quantity'), form.watch('rate')).toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">Net Amount (with GST):</p>
                  <p className="text-lg font-semibold">₹{calculateNetAmount(
                    calculateGrossAmount(form.watch('quantity'), form.watch('rate')),
                    form.watch('gstPercentage') || 0
                  ).toLocaleString()}</p>
                </div>
              </div>
            )}

            <div className="space-y-4 pt-2 border-t">
              <h3 className="font-medium">Bank Details</h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="bankName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Bank Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter bank name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="accountNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Account Number</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter account number" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="ifscCode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>IFSC Code</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter IFSC code" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email (Optional)</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter email" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="mobile"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Mobile (Optional)</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter mobile number" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <div className="space-y-4 pt-2 border-t">
              <h3 className="font-medium">Upload Documents</h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <FormLabel>Invoice Image</FormLabel>
                  <div className="mt-1">
                    {invoiceImage ? (
                      <div className="flex items-center p-2 border rounded-md">
                        <div className="flex-grow truncate">
                          {invoiceImage.name} ({Math.round(invoiceImage.size / 1024)} KB)
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => setInvoiceImage(null)}
                          className="ml-2"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : (
                      <label className="flex items-center justify-center w-full h-24 border-2 border-dashed rounded-md cursor-pointer hover:bg-gray-50">
                        <div className="space-y-1 text-center">
                          <Upload className="h-6 w-6 mx-auto text-muted-foreground" />
                          <div className="text-sm text-muted-foreground">Click to upload invoice image</div>
                        </div>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={handleInvoiceImageChange}
                        />
                      </label>
                    )}
                  </div>
                </div>
                
                <div>
                  <FormLabel>Bill Image (Optional)</FormLabel>
                  <div className="mt-1">
                    {billImage ? (
                      <div className="flex items-center p-2 border rounded-md">
                        <div className="flex-grow truncate">
                          {billImage.name} ({Math.round(billImage.size / 1024)} KB)
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => setBillImage(null)}
                          className="ml-2"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : (
                      <label className="flex items-center justify-center w-full h-24 border-2 border-dashed rounded-md cursor-pointer hover:bg-gray-50">
                        <div className="space-y-1 text-center">
                          <Upload className="h-6 w-6 mx-auto text-muted-foreground" />
                          <div className="text-sm text-muted-foreground">Click to upload bill image</div>
                        </div>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={handleBillImageChange}
                        />
                      </label>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <DialogFooter className="pt-4">
              <Button type="button" variant="outline" onClick={onClose} disabled={loading || uploadingInvoice || uploadingBill}>
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={loading || uploadingInvoice || uploadingBill}
                className="relative"
              >
                {(loading || uploadingInvoice || uploadingBill) ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    {uploadingInvoice ? "Uploading Invoice..." : 
                     uploadingBill ? "Uploading Bill..." : "Saving..."}
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Invoice
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default InvoiceForm;
