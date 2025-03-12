
import React, { useState, useEffect } from 'react';
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useFieldArray } from "react-hook-form";
import * as z from "zod";
import { format } from "date-fns";
import { CalendarIcon, Plus, Trash2, Upload, Loader2 } from "lucide-react";
import { toast } from "sonner";

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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { Invoice, BankDetails, PaymentStatus, MaterialItem } from "@/lib/types";
import { InputWithLabel } from '../ui/InputWithLabel';
import { Switch } from '../ui/switch';
import { Label } from '../ui/label';
import { useToast } from '../ui/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface InvoiceFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (invoice: Omit<Invoice, 'id' | 'createdAt'>) => void;
  siteId?: string;
}

const bankDetailsSchema = z.object({
  accountNumber: z.string().min(5, {
    message: "Account number must be at least 5 characters",
  }),
  bankName: z.string().min(2, {
    message: "Bank name must be at least 2 characters",
  }),
  ifscCode: z.string().min(5, {
    message: "IFSC code must be at least 5 characters",
  }),
  email: z.string().email("Invalid email address").optional(),
  mobile: z.string().regex(/^[0-9]{10}$/, "Invalid mobile number").optional(),
});

const materialItemSchema = z.object({
  material: z.string().min(2, {
    message: "Material description must be at least 2 characters",
  }),
  quantity: z.number().nullable(),
  rate: z.number().nullable(),
  gstPercentage: z.number().nullable(),
  amount: z.number().nullable(),
});

const formSchema = z.object({
  date: z.date({
    required_error: "Date is required",
  }),
  partyId: z.string().min(2, {
    message: "Party ID must be at least 2 characters",
  }),
  partyName: z.string().min(2, {
    message: "Party name must be at least 2 characters",
  }),
  material: z.string().min(2, {
    message: "Material description must be at least 2 characters",
  }),
  quantity: z.number({
    required_error: "Quantity is required",
    invalid_type_error: "Quantity must be a number",
  }).nullable(),
  rate: z.number({
    required_error: "Rate is required",
    invalid_type_error: "Rate must be a number",
  }).nullable(),
  gstPercentage: z.number({
    required_error: "GST Percentage is required",
    invalid_type_error: "GST Percentage must be a number",
  }).nullable(),
  grossAmount: z.number({
    required_error: "Gross Amount is required",
    invalid_type_error: "Gross Amount must be a number",
  }).nullable(),
  netAmount: z.number({
    required_error: "Net Amount is required",
    invalid_type_error: "Net Amount must be a number",
  }).nullable(),
  bankDetails: bankDetailsSchema,
  billUrl: z.string().optional(),
  invoiceImageUrl: z.string().optional(),
  paymentStatus: z.nativeEnum(PaymentStatus, {
    required_error: "Payment Status is required",
  }),
  approverType: z.enum(["ho", "supervisor"]).optional(),
  useMaterialItems: z.boolean().default(false),
  materialItems: z.array(materialItemSchema).optional(),
});

type FormValues = z.infer<typeof formSchema>;

const InvoiceForm: React.FC<InvoiceFormProps> = ({ isOpen, onClose, onSubmit, siteId }) => {
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [billFile, setBillFile] = useState<File | null>(null);
  const [invoiceImageFile, setInvoiceImageFile] = useState<File | null>(null);
  const [isUploadingBill, setIsUploadingBill] = useState(false);
  const [isUploadingInvoiceImage, setIsUploadingInvoiceImage] = useState(false);
  const [showBankDetails, setShowBankDetails] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  const { toast } = useToast();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      date: new Date(),
      partyId: "",
      partyName: "",
      material: "",
      quantity: null,
      rate: null,
      gstPercentage: null,
      grossAmount: null,
      netAmount: null,
      bankDetails: {
        accountNumber: "",
        bankName: "",
        ifscCode: "",
      },
      paymentStatus: PaymentStatus.PENDING,
      approverType: "supervisor",
      useMaterialItems: false,
      materialItems: [],
    },
  });

  const { control, watch, setValue } = form;
  const useMaterialItems = watch("useMaterialItems");

  const { fields, append, remove } = useFieldArray({
    control,
    name: "materialItems",
  });

  useEffect(() => {
    setValue("date", selectedDate);
  }, [selectedDate, setValue]);

  const handleCalendarSelect = (date: Date | undefined) => {
    if (date) {
      setSelectedDate(date);
      setValue("date", date);
      setDatePickerOpen(false);
    }
  };

  const handleBankDetailsToggle = () => {
    setShowBankDetails(!showBankDetails);
  };

  const uploadFile = async (file: File, path: string): Promise<string | null> => {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `${path}/${fileName}`;

      const { data, error } = await supabase.storage
        .from('construction-app')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) {
        console.error("Error uploading file:", error);
        toast({
          title: "Upload failed",
          description: "Failed to upload the file. Please try again.",
          variant: "destructive",
        });
        return null;
      }

      const publicUrl = `https://judyphcrcqmggkndcxlj.supabase.co/storage/v1/object/public/construction-app/${filePath}`;
      return publicUrl;
    } catch (error) {
      console.error("Upload error:", error);
      toast({
        title: "Upload error",
        description: "An unexpected error occurred during upload.",
        variant: "destructive",
      });
      return null;
    }
  };

  const handleBillUpload = async (file: File | null) => {
    if (!file) return;

    setIsUploadingBill(true);
    try {
      const url = await uploadFile(file, 'bills');
      if (url) {
        form.setValue("billUrl", url);
        toast({
          title: "Bill uploaded",
          description: "Bill uploaded successfully.",
        });
      }
    } finally {
      setIsUploadingBill(false);
    }
  };

  const handleInvoiceImageUpload = async (file: File | null) => {
    if (!file) return;

    setIsUploadingInvoiceImage(true);
    try {
      const url = await uploadFile(file, 'invoice-images');
      if (url) {
        form.setValue("invoiceImageUrl", url);
        toast({
          title: "Invoice image uploaded",
          description: "Invoice image uploaded successfully.",
        });
      }
    } finally {
      setIsUploadingInvoiceImage(false);
    }
  };

  const handleSubmit = async (values: FormValues) => {
    console.log("Submitting invoice with values:", values);

    const newInvoice: Omit<Invoice, 'id' | 'createdAt'> = {
      date: values.date,
      partyId: values.partyId,
      partyName: values.partyName,
      material: values.material,
      quantity: values.quantity || 0,
      rate: values.rate || 0,
      gstPercentage: values.gstPercentage || 0,
      grossAmount: values.grossAmount || 0,
      netAmount: values.netAmount || 0,
      bankDetails: {
        accountNumber: values.bankDetails.accountNumber,
        bankName: values.bankDetails.bankName,
        ifscCode: values.bankDetails.ifscCode,
        email: values.bankDetails.email,
        mobile: values.bankDetails.mobile,
      },
      billUrl: values.billUrl,
      invoiceImageUrl: values.invoiceImageUrl,
      paymentStatus: values.paymentStatus,
      createdBy: "Current User",
      approverType: values.approverType,
      siteId: siteId,
    };

    onSubmit(newInvoice);
    form.reset();
    onClose();
    toast({
      title: "Invoice added",
      description: "Invoice added successfully.",
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>New Invoice</DialogTitle>
          <DialogDescription>
            Enter the details for the new invoice.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="date"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Date</FormLabel>
                    <Popover open={datePickerOpen} onOpenChange={setDatePickerOpen}>
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
                          onSelect={handleCalendarSelect}
                          initialFocus
                          className="pointer-events-auto"
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="paymentStatus"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Payment Status</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                      defaultValue={PaymentStatus.PENDING}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select payment status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value={PaymentStatus.PENDING}>Pending</SelectItem>
                        <SelectItem value={PaymentStatus.PAID}>Paid</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="partyId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Party ID</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter party ID" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="partyName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Party Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter party name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="approverType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Approver Type</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value}
                    defaultValue="supervisor"
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select approver type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="supervisor">Supervisor</SelectItem>
                      <SelectItem value="ho">Head Office</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={control}
              name="useMaterialItems"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel>Use Material Items</FormLabel>
                    <FormDescription>
                      Enable this to add individual material items instead of a single
                      description.
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            {useMaterialItems ? (
              <div className="space-y-2">
                <FormLabel>Material Items</FormLabel>
                {fields.map((field, index) => (
                  <div key={field.id} className="flex items-center space-x-2">
                    <FormField
                      control={control}
                      name={`materialItems.${index}.material` as const}
                      render={({ field }) => (
                        <FormItem className="w-1/4">
                          <FormLabel>Material</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Material"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={control}
                      name={`materialItems.${index}.quantity` as const}
                      render={({ field }) => (
                        <FormItem className="w-1/6">
                          <FormLabel>Quantity</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              placeholder="0"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={control}
                      name={`materialItems.${index}.rate` as const}
                      render={({ field }) => (
                        <FormItem className="w-1/6">
                          <FormLabel>Rate</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              placeholder="0.00"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={control}
                      name={`materialItems.${index}.gstPercentage` as const}
                      render={({ field }) => (
                        <FormItem className="w-1/6">
                          <FormLabel>GST (%)</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              placeholder="0"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={control}
                      name={`materialItems.${index}.amount` as const}
                      render={({ field }) => (
                        <FormItem className="w-1/6">
                          <FormLabel>Amount</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              placeholder="0.00"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button
                      variant="ghost"
                      onClick={() => remove(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => append({ material: "", quantity: null, rate: null, gstPercentage: null, amount: null })}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Item
                </Button>
              </div>
            ) : (
              <FormField
                control={form.control}
                name="material"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Material Description</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Enter material description" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {!useMaterialItems && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                          {...field}
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
                      <FormLabel>Rate</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="Enter rate"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}

            {!useMaterialItems && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="gstPercentage"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>GST Percentage</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="Enter GST percentage"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="grossAmount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Gross Amount</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="Enter gross amount"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}

            {!useMaterialItems && (
              <FormField
                control={form.control}
                name="netAmount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Net Amount</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="Enter net amount"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <div>
              <Label
                htmlFor="showBankDetails"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed"
              >
                Show Bank Details
              </Label>
              <Switch
                id="showBankDetails"
                checked={showBankDetails}
                onCheckedChange={handleBankDetailsToggle}
              />
            </div>

            {showBankDetails && (
              <div className="space-y-4">
                <h4 className="text-sm font-medium">Bank Details</h4>
                <FormField
                  control={form.control}
                  name="bankDetails.accountNumber"
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

                <FormField
                  control={form.control}
                  name="bankDetails.bankName"
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
                  name="bankDetails.ifscCode"
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

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="bankDetails.email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email (Optional)</FormLabel>
                        <FormControl>
                          <Input type="email" placeholder="Enter email" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="bankDetails.mobile"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Mobile (Optional)</FormLabel>
                        <FormControl>
                          <Input type="tel" placeholder="Enter mobile number" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <FormLabel>Bill Upload (Optional)</FormLabel>
                <Input
                  type="file"
                  id="billUpload"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files && e.target.files.length > 0) {
                      setBillFile(e.target.files[0]);
                      handleBillUpload(e.target.files[0]);
                    }
                  }}
                />
                <div className="relative">
                  <Button asChild variant="outline">
                    <Label htmlFor="billUpload" className="cursor-pointer">
                      {isUploadingBill ? (
                        <>
                          Uploading <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                        </>
                      ) : (
                        <>
                          <Upload className="mr-2 h-4 w-4" />
                          Upload Bill
                        </>
                      )}
                    </Label>
                  </Button>
                  {billFile && (
                    <span className="ml-2 text-sm text-muted-foreground">
                      {billFile.name}
                    </span>
                  )}
                </div>
              </div>

              <div>
                <FormLabel>Invoice Image Upload (Optional)</FormLabel>
                <Input
                  type="file"
                  id="invoiceImageUpload"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files && e.target.files.length > 0) {
                      setInvoiceImageFile(e.target.files[0]);
                      handleInvoiceImageUpload(e.target.files[0]);
                    }
                  }}
                />
                <div className="relative">
                  <Button asChild variant="outline">
                    <Label htmlFor="invoiceImageUpload" className="cursor-pointer">
                      {isUploadingInvoiceImage ? (
                        <>
                          Uploading <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                        </>
                      ) : (
                        <>
                          <Upload className="mr-2 h-4 w-4" />
                          Upload Invoice Image
                        </>
                      )}
                    </Label>
                  </Button>
                  {invoiceImageFile && (
                    <span className="ml-2 text-sm text-muted-foreground">
                      {invoiceImageFile.name}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit">
                <Plus className="h-4 w-4 mr-2" />
                Add Invoice
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default InvoiceForm;

interface FormDescriptionProps {
  children?: React.ReactNode;
}

function FormDescription({ children }: FormDescriptionProps) {
  return (
    <p className="text-sm text-muted-foreground">
      {children}
    </p>
  )
}
