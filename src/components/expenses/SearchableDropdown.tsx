
import React, { useState, useRef, useEffect } from 'react';
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

interface Option {
  id: number;
  name: string;
  [key: string]: any;
}

interface SearchableDropdownProps {
  options: Option[];
  label?: string;
  id?: string;
  selectedVal: string;
  handleChange: (value: string | null) => void;
  placeholder?: string;
  emptyMessage?: string;
  className?: string;
}

const SearchableDropdown: React.FC<SearchableDropdownProps> = ({
  options,
  label = "name",
  id = "id",
  selectedVal,
  handleChange,
  placeholder = "Select option...",
  emptyMessage = "No results found.",
  className,
}) => {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  
  // Ensure options is always a valid array
  const safeOptions = Array.isArray(options) ? options : [];
  
  console.log("SearchableDropdown render - Options:", safeOptions);
  console.log("SearchableDropdown render - Current Value:", selectedVal);
  
  // Filter options based on search query
  const filteredOptions = query === '' 
    ? safeOptions 
    : safeOptions.filter(option => 
        option[label].toLowerCase().includes(query.toLowerCase())
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
          {selectedVal || placeholder}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[250px] p-0 bg-popover" align="start" sideOffset={4}>
        <Command className="w-full">
          <CommandInput 
            placeholder={`Search ${placeholder.toLowerCase()}...`} 
            value={query}
            onValueChange={setQuery}
            className="h-9"
          />
          <CommandEmpty className="py-3 text-center text-sm">
            {emptyMessage}
          </CommandEmpty>
          <CommandGroup className="max-h-60 overflow-y-auto">
            {filteredOptions.map((option) => (
              <CommandItem
                key={option[id]}
                value={option[label]}
                onSelect={() => {
                  console.log("Item selected:", option[label]);
                  handleChange(option[label]);
                  setOpen(false);
                  setQuery('');
                }}
                className="cursor-pointer"
              >
                <Check
                  className={cn(
                    "mr-2 h-4 w-4",
                    selectedVal === option[label] ? "opacity-100" : "opacity-0"
                  )}
                />
                {option[label]}
              </CommandItem>
            ))}
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  );
};

export default SearchableDropdown;
