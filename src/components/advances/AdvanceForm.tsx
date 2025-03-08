
import React, { useState, useEffect } from 'react';
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { format } from "date-fns";
import { CalendarIcon, Plus, User, Briefcase, UserCog } from "lucide-react";
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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { cn } from "@/lib/utils";
import { Advance, AdvancePurpose, RecipientType, ApprovalStatus } from "@/lib/types";
import SearchableDropdown from '../expenses/SearchableDropdown';
import { contractors } from '@/data/contractors';
import { supervisors } from '@/data/supervisors';

interface AdvanceFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (advance: Partial<Advance>) => void;
  siteId: string;
}

const formSchema = z.object({
  date: z.date({
    required_error: "Date is required",
  }),
  recipientType: z.nativeEnum(RecipientType, {
    required_error: "Please select recipient type",
  }),
  recipientName: z.string().min(2, {
    message: "Name must be at least 2 characters",
  }),
  purpose: z.nativeEnum(AdvancePurpose, {
    required_error: "Purpose is required",
  }),
  amount: z.number({
    required_error: "Amount is required",
    invalid_type_error: "Amount must be a number",
  }).positive({
    message: "Amount must be a positive number",
  }),
  remarks: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

const AdvanceForm: React.FC<AdvanceFormProps> = ({ isOpen, onClose, onSubmit, siteId }) => {
  const [recipientOptions, setRecipientOptions] = useState<any[]>([]);
  const [showRemarks, setShowRemarks] = useState(false);
  
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      date: new Date(),
      recipientType: undefined,
      recipientName: "",
      purpose: undefined,
      amount: undefined,
      remarks: "",
    },
  });

  useEffect(() => {
    const recipientType = form.watch("recipientType");
    
    if (recipientType === RecipientType.SUPERVISOR) {
      setRecipientOptions(supervisors);
    } else if (recipientType === RecipientType.SUBCONTRACTOR) {
      setRecipientOptions(contractors);
    } else {
      setRecipientOptions([]);
    }

    if (form.getValues("recipientName")) {
      form.setValue("recipientName", "");
    }
  }, [form.watch("recipientType")]);

  useEffect(() => {
    const purpose = form.watch("purpose");
    setShowRemarks(purpose === AdvancePurpose.OTHER);
  }, [form.watch("purpose")]);

  const handleSubmit = (values: FormValues) => {
    const newAdvance: Partial<Advance> = {
      date: values.date,
      recipientName: values.recipientName,
      recipientType: values.recipientType,
      purpose: values.purpose,
      amount: values.amount,
      remarks: values.remarks,
      status: ApprovalStatus.PENDING,
      createdBy: "Current User", // In a real app, this would be the current user's name
      createdAt: new Date(),
      siteId: siteId,
    };

    onSubmit(newAdvance);
    form.reset();
    onClose();
    toast.success("Advance added successfully");
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>New Advance</DialogTitle>
          <DialogDescription>
            Enter the details for the new advance payment.
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
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
              name="recipientType"
              render={({ field }) => (
                <FormItem className="space-y-3">
                  <FormLabel>Recipient Type</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      value={field.value}
                      className="flex space-x-4"
                    >
                      <FormItem className="flex items-center space-x-2 space-y-0">
                        <FormControl>
                          <RadioGroupItem value={RecipientType.WORKER} />
                        </FormControl>
                        <FormLabel className="font-normal cursor-pointer flex items-center">
                          <User className="h-4 w-4 mr-1" />
                          Worker
                        </FormLabel>
                      </FormItem>
                      <FormItem className="flex items-center space-x-2 space-y-0">
                        <FormControl>
                          <RadioGroupItem value={RecipientType.SUBCONTRACTOR} />
                        </FormControl>
                        <FormLabel className="font-normal cursor-pointer flex items-center">
                          <Briefcase className="h-4 w-4 mr-1" />
                          Subcontractor
                        </FormLabel>
                      </FormItem>
                      <FormItem className="flex items-center space-x-2 space-y-0">
                        <FormControl>
                          <RadioGroupItem value={RecipientType.SUPERVISOR} />
                        </FormControl>
                        <FormLabel className="font-normal cursor-pointer flex items-center">
                          <UserCog className="h-4 w-4 mr-1" />
                          Supervisor
                        </FormLabel>
                      </FormItem>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="recipientName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Recipient Name</FormLabel>
                  <FormControl>
                    {form.watch("recipientType") === RecipientType.WORKER ? (
                      <Input 
                        placeholder="Enter worker name" 
                        {...field} 
                      />
                    ) : form.watch("recipientType") === RecipientType.SUBCONTRACTOR ? (
                      <SearchableDropdown
                        options={recipientOptions}
                        selectedVal={field.value}
                        handleChange={(val) => field.onChange(val)}
                        placeholder="Select subcontractor"
                        emptyMessage="No subcontractors found"
                        className="w-full"
                      />
                    ) : form.watch("recipientType") === RecipientType.SUPERVISOR ? (
                      <SearchableDropdown
                        options={recipientOptions}
                        selectedVal={field.value}
                        handleChange={(val) => field.onChange(val)}
                        placeholder="Select supervisor"
                        emptyMessage="No supervisors found"
                        className="w-full"
                      />
                    ) : (
                      <Input 
                        placeholder="First select a recipient type" 
                        disabled={true} 
                        {...field}
                      />
                    )}
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="purpose"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Purpose</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value}
                    defaultValue=""
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select purpose" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value={AdvancePurpose.ADVANCE}>Advance</SelectItem>
                      <SelectItem value={AdvancePurpose.SAFETY_SHOES}>Safety Shoes</SelectItem>
                      <SelectItem value={AdvancePurpose.TOOLS}>Tools</SelectItem>
                      <SelectItem value={AdvancePurpose.OTHER}>Other</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {showRemarks && (
              <FormField
                control={form.control}
                name="remarks"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Remarks</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Enter remarks for this advance..." 
                        className="resize-none" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Amount (₹)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="0.00"
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

            <DialogFooter className="pt-4">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit">
                <Plus className="h-4 w-4 mr-2" />
                Add Advance
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default AdvanceForm;
