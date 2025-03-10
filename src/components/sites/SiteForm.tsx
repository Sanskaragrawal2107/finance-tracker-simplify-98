
import React from 'react';
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
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
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { Site } from "@/lib/types";
import { createSite } from "@/integrations/supabase/client";

interface SiteFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (site: Partial<Site>) => void;
  supervisorId: string;
}

const formSchema = z.object({
  name: z.string().min(2, {
    message: "Site name must be at least 2 characters",
  }),
  jobName: z.string().min(2, {
    message: "Job name must be at least 2 characters",
  }),
  posNo: z.string().min(1, {
    message: "POS number is required",
  }),
  startDate: z.date({
    required_error: "Start date is required",
  }),
  completionDate: z.date().optional(),
});

type FormValues = z.infer<typeof formSchema>;

const SiteForm: React.FC<SiteFormProps> = ({ isOpen, onClose, onSubmit, supervisorId }) => {
  const [startDateOpen, setStartDateOpen] = React.useState(false);
  const [completionDateOpen, setCompletionDateOpen] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      jobName: "",
      posNo: "",
      startDate: new Date(),
      completionDate: undefined,
    },
  });

  const handleSubmit = async (values: FormValues) => {
    try {
      setIsSubmitting(true);
      
      // Transform values to uppercase
      const uppercaseValues = {
        ...values,
        name: values.name.toUpperCase(),
        jobName: values.jobName.toUpperCase(),
        posNo: values.posNo.toUpperCase(),
      };
      
      const newSite: Partial<Site> = {
        ...uppercaseValues,
        supervisorId,
        isCompleted: false,
        createdAt: new Date(),
      };
      
      // First create the site in the database
      const createdSite = await createSite(newSite);
      
      if (createdSite) {
        // Then call the onSubmit callback with the created site data
        onSubmit({
          ...newSite,
          id: createdSite.id,
        });
        
        form.reset();
        onClose();
        toast.success("Site created successfully");
      } else {
        toast.error("Failed to create site");
      }
    } catch (error) {
      console.error("Error creating site:", error);
      toast.error("An error occurred while creating the site");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md w-[95vw] max-w-[95vw] sm:w-auto overflow-y-auto max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Create New Site</DialogTitle>
          <DialogDescription>
            Enter the details for the new construction site.
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Site Name</FormLabel>
                  <FormControl>
                    <Input transformToUppercase placeholder="Enter site name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="jobName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Job Name</FormLabel>
                  <FormControl>
                    <Input transformToUppercase placeholder="Enter job name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="posNo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>P.O. Number</FormLabel>
                  <FormControl>
                    <Input transformToUppercase placeholder="Enter P.O. number" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="startDate"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Start Date</FormLabel>
                  <Popover open={startDateOpen} onOpenChange={setStartDateOpen}>
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
                        onSelect={(date) => {
                          field.onChange(date);
                          setStartDateOpen(false);
                        }}
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
              name="completionDate"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Estimated Completion Date (Optional)</FormLabel>
                  <Popover open={completionDateOpen} onOpenChange={setCompletionDateOpen}>
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
                        selected={field.value || undefined}
                        onSelect={(date) => {
                          field.onChange(date);
                          setCompletionDateOpen(false);
                        }}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter className="pt-4">
              <Button type="button" variant="outline" onClick={onClose} className="w-full sm:w-auto">
                Cancel
              </Button>
              <Button 
                type="submit" 
                className="w-full sm:w-auto"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Creating...' : 'Create Site'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default SiteForm;
