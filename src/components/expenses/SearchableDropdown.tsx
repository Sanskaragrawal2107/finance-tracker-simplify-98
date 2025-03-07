
import React, { useState, useEffect } from 'react';
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
  options = [], // Provide default empty array to prevent undefined issues
  value,
  onValueChange,
  placeholder,
  emptyMessage = "No results found.",
  className,
}) => {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredOptions, setFilteredOptions] = useState<string[]>([]);

  // Ensure options is always an array
  const safeOptions = Array.isArray(options) ? options : [];

  // Update filtered options when options prop or search query changes
  useEffect(() => {
    if (!safeOptions || safeOptions.length === 0) {
      setFilteredOptions([]);
      return;
    }
    
    if (!searchQuery) {
      setFilteredOptions(safeOptions);
      return;
    }
    
    const filtered = safeOptions.filter(option => 
      option.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setFilteredOptions(filtered);
  }, [safeOptions, searchQuery]);

  // Debug logs to help understand the component state
  console.log("SearchableDropdown - Options:", safeOptions);
  console.log("SearchableDropdown - Filtered Options:", filteredOptions);
  console.log("SearchableDropdown - Current Value:", value);

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
      <PopoverContent className="w-full p-0" align="start">
        <Command className="w-full">
          <CommandInput 
            placeholder={`Search ${placeholder.toLowerCase()}...`} 
            className="flex-1"
            value={searchQuery}
            onValueChange={setSearchQuery}
          />
          {filteredOptions.length === 0 ? (
            <CommandEmpty>{emptyMessage}</CommandEmpty>
          ) : (
            <CommandGroup className="max-h-60 overflow-y-auto">
              {filteredOptions.map((option) => (
                <CommandItem
                  key={option}
                  value={option}
                  onSelect={() => {
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
          )}
        </Command>
      </PopoverContent>
    </Popover>
  );
};

export default SearchableDropdown;
