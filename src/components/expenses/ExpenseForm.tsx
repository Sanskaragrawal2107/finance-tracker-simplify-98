import React, { useState, useEffect } from 'react';
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { format } from "date-fns";
import { CalendarIcon, Loader2, Plus, Trash2 } from "lucide-react";
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
import { Expense, ExpenseCategory } from "@/lib/types";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { EXPENSE_CATEGORIES } from '@/lib/constants';
import SearchableDropdown from './SearchableDropdown';
import { contractors } from '@/data/contractors';
import { supervisors } from '@/data/supervisors';

interface ExpenseFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (expense: Partial<Expense>) => void;
}

const formSchema = z.object({
  date: z.date({
    required_error: "Date is required",
  }),
  recipientType: z.enum(["contractor", "worker", "supervisor"], {
    required_error: "Please select recipient type",
  }),
  recipientName: z.string().min(2, {
    message: "Name must be at least 2 characters",
  }),
  purpose: z.string().min(3, {
    message: "Purpose description must be at least 3 characters",
  }),
  category: z.string({
    required_error: "Category is required",
  }),
  amount: z.number({
    required_error: "Amount is required",
    invalid_type_error: "Amount must be a number",
  }).positive({
    message: "Amount must be a positive number",
  }),
});

type FormValues = z.infer<typeof formSchema>;

interface ExpenseItem {
  id: string;
  date: Date;
  recipientType: "contractor" | "worker" | "supervisor";
  recipientName: string;
  purpose: string;
  category: string;
  amount: number;
}

const ExpenseForm: React.FC<ExpenseFormProps> = ({ isOpen, onClose, onSubmit }) => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [expenses, setExpenses] = useState<ExpenseItem[]>([]);
  const [recipientOptions, setRecipientOptions] = useState<any[]>([]);
  
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      date: new Date(),
      recipientType: undefined,
      recipientName: "",
      purpose: "",
      category: "",
      amount: undefined,
    },
  });

  useEffect(() => {
    const recipientType = form.watch("recipientType");
    
    if (recipientType === "supervisor") {
      setRecipientOptions(supervisors);
      console.log("Setting supervisor options:", supervisors);
    } else if (recipientType === "contractor") {
      setRecipientOptions(contractors);
      console.log("Setting contractor options:", contractors);
    } else {
      setRecipientOptions([]);
    }

    if (form.getValues("recipientName")) {
      form.setValue("recipientName", "");
    }
  }, [form.watch("recipientType")]);

  const analyzePurpose = async (purposeText: string) => {
    if (!purposeText || purposeText.length < 3) return;
    
    setIsAnalyzing(true);
    try {
      const apiKey = "AIzaSyDwqj1YcFKVzpLc_4ZyC_s9YAMCONx57RI";
      const url = "https://generativelanguage.googleapis.com/v1/models/gemini-pro:generateContent";
      
      const prompt = `
Given this expense description: "${purposeText}"
Classify it into exactly ONE of these categories:
- STAFF TRAVELLING CHARGES
- STATIONARY & PRINTING
- DIESEL & FUEL CHARGES
- LABOUR TRAVELLING EXP.
- LOADGING & BOARDING FOR STAFF
- FOOD CHARGES FOR LABOUR
- SITE EXPENSES
- ROOM RENT FOR LABOUR

Return ONLY the category name, with no additional text or explanation.
`;

      const response = await fetch(`${url}?key=${apiKey}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: prompt,
                },
              ],
            },
          ],
          generationConfig: {
            temperature: 0.2,
            topP: 0.8,
            topK: 40,
            maxOutputTokens: 50,
          },
        }),
      });

      if (!response.ok) {
        console.error("API response error:", response.status, response.statusText);
        throw new Error("API request failed");
      }

      const data = await response.json();
      console.log("Gemini API response:", data);
      
      if (data.candidates && data.candidates[0] && data.candidates[0].content) {
        const categoryText = data.candidates[0].content.parts[0].text.trim();
        console.log("Detected category text:", categoryText);
        
        const matchedCategory = EXPENSE_CATEGORIES.find(cat => 
          categoryText.includes(cat)
        );
        
        if (matchedCategory) {
          console.log("Setting category to:", matchedCategory);
          form.setValue("category", matchedCategory);
          toast.success(`Category detected: ${matchedCategory}`);
        } else {
          console.log("No matching category found in:", categoryText);
          toast.warning("Could not determine category");
        }
      }
    } catch (error) {
      console.error("Error analyzing purpose:", error);
      console.log("Continuing without category detection");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const addExpenseToList = (values: FormValues) => {
    const newExpense: ExpenseItem = {
      id: Date.now().toString(),
      date: values.date,
      recipientType: values.recipientType,
      recipientName: values.recipientName,
      purpose: values.purpose,
      category: values.category,
      amount: values.amount,
    };
    
    console.log("Adding expense to list:", newExpense);
    setExpenses([...expenses, newExpense]);
    form.reset({
      date: new Date(),
      recipientType: values.recipientType,
      recipientName: "",
      purpose: "",
      category: "",
      amount: undefined,
    });
    
    toast.success("Expense added to the list");
  };
  
  const removeExpense = (id: string) => {
    setExpenses(expenses.filter(expense => expense.id !== id));
    toast.info("Expense removed");
  };

  const submitAllExpenses = () => {
    console.log("Submitting all expenses:", expenses);
    expenses.forEach(expense => {
      const newExpense: Partial<Expense> = {
        date: expense.date,
        description: expense.purpose,
        category: expense.category as unknown as ExpenseCategory,
        amount: expense.amount,
        status: "pending" as any,
        createdBy: `${expense.recipientType}: ${expense.recipientName}`,
        createdAt: new Date(),
      };
      
      onSubmit(newExpense);
    });
    
    setExpenses([]);
    form.reset();
    onClose();
    
    if (expenses.length > 0) {
      toast.success(`${expenses.length} expenses submitted successfully`);
    }
  };

  const handleSingleSubmit = (values: FormValues) => {
    const newExpense: Partial<Expense> = {
      date: values.date,
      description: values.purpose,
      category: values.category as unknown as ExpenseCategory,
      amount: values.amount,
      status: "pending" as any,
      createdBy: `${values.recipientType}: ${values.recipientName}`,
      createdAt: new Date(),
    };

    onSubmit(newExpense);
    form.reset();
    setExpenses([]);
    onClose();
    toast.success("Expense submitted successfully");
  };

  const handlePurposeBlur = () => {
    const purposeValue = form.getValues("purpose");
    if (purposeValue && purposeValue.length >= 3) {
      analyzePurpose(purposeValue);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>New Expense</DialogTitle>
          <DialogDescription>
            Enter the details for the new expense. Add multiple expenses before submitting.
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(addExpenseToList)} className="space-y-4">
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
                          <RadioGroupItem value="contractor" />
                        </FormControl>
                        <FormLabel className="font-normal cursor-pointer">
                          Contractor
                        </FormLabel>
                      </FormItem>
                      <FormItem className="flex items-center space-x-2 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="worker" />
                        </FormControl>
                        <FormLabel className="font-normal cursor-pointer">
                          Worker
                        </FormLabel>
                      </FormItem>
                      <FormItem className="flex items-center space-x-2 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="supervisor" />
                        </FormControl>
                        <FormLabel className="font-normal cursor-pointer">
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
                    {form.watch("recipientType") === "worker" ? (
                      <Input 
                        placeholder="Enter recipient name" 
                        {...field} 
                      />
                    ) : form.watch("recipientType") === "contractor" ? (
                      <SearchableDropdown
                        options={recipientOptions}
                        selectedVal={field.value}
                        handleChange={(val) => field.onChange(val)}
                        placeholder="Select contractor"
                        emptyMessage="No contractors found"
                        className="w-full"
                      />
                    ) : form.watch("recipientType") === "supervisor" ? (
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
                  <FormControl>
                    <Textarea 
                      placeholder="Describe the purpose of this expense..." 
                      className="resize-none" 
                      {...field} 
                      onBlur={handlePurposeBlur}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center">
                    Category
                    {isAnalyzing && (
                      <Loader2 className="ml-2 h-4 w-4 animate-spin text-muted-foreground" />
                    )}
                  </FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value}
                    defaultValue=""
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a category" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {EXPENSE_CATEGORIES.map((category) => (
                        <SelectItem key={category} value={category}>
                          {category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

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

            <div className="flex justify-end pt-2">
              <Button type="submit" variant="secondary">
                <Plus className="h-4 w-4 mr-2" />
                Add to List
              </Button>
            </div>
          </form>
        </Form>

        {expenses.length > 0 && (
          <div className="mt-6 space-y-4">
            <h3 className="text-sm font-medium">Expenses List ({expenses.length})</h3>
            <div className="border rounded-md overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-muted">
                  <tr>
                    <th className="p-2 text-left">Date</th>
                    <th className="p-2 text-left">Recipient</th>
                    <th className="p-2 text-left">Purpose</th>
                    <th className="p-2 text-right">Amount</th>
                    <th className="p-2 text-center">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {expenses.map((expense) => (
                    <tr key={expense.id} className="border-t">
                      <td className="p-2">{format(expense.date, 'MMM dd')}</td>
                      <td className="p-2">{expense.recipientType}: {expense.recipientName}</td>
                      <td className="p-2">{expense.purpose}</td>
                      <td className="p-2 text-right">₹{expense.amount}</td>
                      <td className="p-2 text-center">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8" 
                          onClick={() => removeExpense(expense.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <DialogFooter className="pt-4 flex flex-col gap-2 sm:flex-row">
          <Button type="button" variant="outline" onClick={onClose} className="w-full sm:w-auto">
            Cancel
          </Button>
          {expenses.length > 0 ? (
            <Button 
              type="button" 
              onClick={submitAllExpenses} 
              className="w-full sm:w-auto"
            >
              Submit All Expenses
            </Button>
          ) : (
            <Button 
              type="button" 
              onClick={form.handleSubmit(handleSingleSubmit)} 
              className="w-full sm:w-auto"
            >
              Submit Expense
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ExpenseForm;
