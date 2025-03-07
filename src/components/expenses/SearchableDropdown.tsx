
import React, { useState } from 'react';
import { Check, ChevronsUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

interface SearchableDropdownProps {
  options: string[];
  value: string;
  onValueChange: (value: string) => void;
  placeholder: string;
  emptyMessage?: string;
  className?: string;
}

const SearchableDropdown: React.FC<SearchableDropdownProps> = ({
  options,
  value,
  onValueChange,
  placeholder,
  emptyMessage = "No results found.",
  className,
}) => {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Ensure options is always a valid array
  const safeOptions = Array.isArray(options) ? options : [];
  
  console.log("SearchableDropdown render - Options:", safeOptions);
  console.log("SearchableDropdown render - Current Value:", value);
  
  // Filter options based on search query
  const filteredOptions = searchQuery === '' 
    ? safeOptions 
    : safeOptions.filter(option => 
        option.toLowerCase().includes(searchQuery.toLowerCase())
      );

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("w-full justify-between", className)}
        >
          {value || placeholder}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0 bg-popover" align="start" sideOffset={4}>
        <Command className="w-full">
          <CommandInput 
            placeholder={`Search ${placeholder.toLowerCase()}...`} 
            value={searchQuery}
            onValueChange={setSearchQuery}
            className="h-9"
          />
          <CommandEmpty className="py-3 text-center text-sm">
            {emptyMessage}
          </CommandEmpty>
          <CommandGroup className="max-h-60 overflow-y-auto">
            {filteredOptions.map((option) => (
              <CommandItem
                key={option}
                value={option}
                onSelect={() => {
                  console.log("Item selected:", option);
                  onValueChange(option);
                  setOpen(false);
                  setSearchQuery('');
                }}
                className="cursor-pointer"
              >
                <Check
                  className={cn(
                    "mr-2 h-4 w-4",
                    value === option ? "opacity-100" : "opacity-0"
                  )}
                />
                {option}
              </CommandItem>
            ))}
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  );
};

export default SearchableDropdown;
