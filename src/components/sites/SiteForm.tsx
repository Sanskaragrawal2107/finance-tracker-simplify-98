import React from 'react';
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { format } from "date-fns";
import { CalendarIcon, Users } from "lucide-react";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Site } from "@/lib/types";
import { useEffect, useState } from "react";
import { useAuth } from '@/hooks/use-auth';
import { getSupervisors } from '@/data/supervisors';

interface Supervisor {
  id: string;
  name: string;
}

interface SiteFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (site: Partial<Site>) => void;
  supervisorId?: string;
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
  supervisorId: z.string({
    required_error: "Supervisor is required",
  }),
});

type FormValues = z.infer<typeof formSchema>;

const SiteForm: React.FC<SiteFormProps> = ({ isOpen, onClose, onSubmit, supervisorId }) => {
  const [startDateOpen, setStartDateOpen] = React.useState(false);
  const [completionDateOpen, setCompletionDateOpen] = React.useState(false);
  const [supervisors, setSupervisors] = useState<Supervisor[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();
  
  useEffect(() => {
    const fetchSupervisors = async () => {
      try {
        const supervisorsList = await getSupervisors();
        setSupervisors(supervisorsList);
      } catch (error) {
        console.error('Error fetching supervisors:', error);
        toast.error('Failed to load supervisors');
      }
    };
    
    fetchSupervisors();
  }, []);
  
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      jobName: "",
      posNo: "",
      startDate: new Date(),
      completionDate: undefined,
      supervisorId: supervisorId || "",
    },
  });

  useEffect(() => {
    if (supervisorId) {
      form.setValue('supervisorId', supervisorId);
    }
  }, [supervisorId, form]);

  const handleSubmit = async (values: FormValues) => {
    try {
      setIsLoading(true);
      
      const uppercaseValues = {
        ...values,
        name: values.name.toUpperCase(),
        jobName: values.jobName.toUpperCase(),
        posNo: values.posNo.toUpperCase(),
      };
      
      const { data, error } = await supabase
        .from('sites')
        .insert([
          {
            name: uppercaseValues.name,
            job_name: uppercaseValues.jobName,
            pos_no: uppercaseValues.posNo,
            start_date: uppercaseValues.startDate.toISOString(),
            completion_date: uppercaseValues.completionDate?.toISOString(),
            supervisor_id: uppercaseValues.supervisorId,
            is_completed: false
          }
        ])
        .select();
      
      if (error) {
        throw error;
      }
      
      if (data && data.length > 0) {
        const siteData = data[0];
        const newSite: Site = {
          id: siteData.id,
          name: siteData.name,
          jobName: siteData.job_name,
          posNo: siteData.pos_no,
          startDate: new Date(siteData.start_date),
          completionDate: siteData.completion_date ? new Date(siteData.completion_date) : undefined,
          supervisorId: siteData.supervisor_id,
          createdAt: new Date(siteData.created_at),
          isCompleted: siteData.is_completed,
          funds: siteData.funds || 0
        };
        
        onSubmit(newSite);
        form.reset();
        onClose();
        toast.success("Site created successfully");
      }
    } catch (error: any) {
      console.error('Error creating site:', error);
      toast.error(error.message || 'Failed to create site');
    } finally {
      setIsLoading(false);
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
                    <Input placeholder="Enter site name" {...field} />
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
                    <Input placeholder="Enter job name" {...field} />
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
                    <Input placeholder="Enter P.O. number" {...field} />
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
            
            {user?.role === 'admin' && (
              <FormField
                control={form.control}
                name="supervisorId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Assign Supervisor</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a supervisor" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {supervisors.map((supervisor) => (
                          <SelectItem key={supervisor.id} value={supervisor.id}>
                            {supervisor.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <DialogFooter className="pt-4">
              <Button type="button" variant="outline" onClick={onClose} className="w-full sm:w-auto">
                Cancel
              </Button>
              <Button type="submit" className="w-full sm:w-auto" disabled={isLoading}>
                {isLoading ? 'Creating...' : 'Create Site'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default SiteForm;
