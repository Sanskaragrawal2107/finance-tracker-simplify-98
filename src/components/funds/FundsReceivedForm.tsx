
import React, { useState } from 'react';
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { format } from "date-fns";
import { CalendarIcon, Plus, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from '@/integrations/supabase/client';

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
import { FundsReceived } from "@/lib/types";

interface FundsReceivedFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (funds: Partial<FundsReceived>) => void;
}

const formSchema = z.object({
  date: z.date({
    required_error: "Date is required",
  }),
  amount: z.coerce.number({
    required_error: "Amount is required",
    invalid_type_error: "Amount must be a number",
  }).positive({
    message: "Amount must be a positive number",
  }),
});

type FormValues = z.infer<typeof formSchema>;

const FundsReceivedForm: React.FC<FundsReceivedFormProps> = ({ isOpen, onClose, onSubmit }) => {
  const [loading, setLoading] = useState(false);
  
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      date: new Date(),
      amount: undefined,
    },
  });

  const saveFundsToDatabase = async (fundsData: Partial<FundsReceived>): Promise<string | null> => {
    try {
      const { data, error } = await supabase
        .from('funds_received')
        .insert({
          date: fundsData.date?.toISOString(),
          amount: fundsData.amount,
          site_id: fundsData.siteId
        })
        .select('id')
        .single();

      if (error) {
        console.error("Error saving funds:", error);
        throw error;
      }

      // Update the site funds amount
      if (fundsData.siteId) {
        const { error: siteError } = await supabase
          .from('sites')
          .update({ 
            funds: supabase.rpc('increment_funds', { 
              site_id: fundsData.siteId, 
              amount: fundsData.amount 
            }) 
          })
          .eq('id', fundsData.siteId);

        if (siteError) {
          console.error("Error updating site funds:", siteError);
        }
      }

      console.log("Funds saved to database:", data);
      return data.id;
    } catch (error: any) {
      console.error("Failed to save funds:", error.message);
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
      
      const newFunds: Partial<FundsReceived> = {
        date: values.date,
        amount: values.amount,
        siteId: selectedSiteId
      };

      const fundsId = await saveFundsToDatabase(newFunds);
      
      if (fundsId) {
        newFunds.id = fundsId;
        onSubmit(newFunds);
        form.reset();
        onClose();
        toast.success("Funds received recorded successfully");
      }
    } catch (error: any) {
      toast.error(`Failed to record funds: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>RECORD FUNDS FROM H.O.</DialogTitle>
          <DialogDescription>
            Enter the details of the funds received from the Head Office.
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="date"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>DATE RECEIVED</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant={"outline"}
                          className={cn(
                            "w-full pl-3 text-left font-normal uppercase",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          {field.value ? (
                            format(field.value, "PPP").toUpperCase()
                          ) : (
                            <span>SELECT A DATE</span>
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
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>AMOUNT (₹)</FormLabel>
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
              <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
                CANCEL
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    SUBMITTING...
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4 mr-2" />
                    SUBMIT
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

export default FundsReceivedForm;
