"use client";

import { useState } from "react";
import { Check, ChevronsUpDown } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

export interface SearchableOption {
  value: string;
  label: string;
  hint?: string;
}

/** A select with type-to-filter, for long lists like time zones and currencies. */
export function SearchableSelect({
  id,
  value,
  onChange,
  options,
  placeholder = "Select an option",
  searchPlaceholder = "Search...",
  emptyText = "No results.",
  invalid,
  className,
}: {
  id?: string;
  value: string | undefined;
  onChange: (value: string) => void;
  options: SearchableOption[];
  placeholder?: string;
  searchPlaceholder?: string;
  emptyText?: string;
  invalid?: boolean;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const selected = options.find((option) => option.value === value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          id={id}
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          aria-invalid={invalid || undefined}
          className={cn(
            "w-full justify-between px-3 font-normal",
            !selected && "text-muted-foreground",
            className,
          )}
        >
          <span className="truncate">
            {selected ? selected.label : placeholder}
            {selected?.hint ? (
              <span className="ml-2 text-muted-foreground">{selected.hint}</span>
            ) : null}
          </span>
          <ChevronsUpDown className="opacity-50" aria-hidden />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-(--radix-popover-trigger-width) p-0" align="start">
        <Command>
          <CommandInput placeholder={searchPlaceholder} />
          <CommandList>
            <CommandEmpty>{emptyText}</CommandEmpty>
            <CommandGroup>
              {options.map((option) => (
                <CommandItem
                  key={option.value}
                  value={`${option.label} ${option.value} ${option.hint ?? ""}`}
                  onSelect={() => {
                    onChange(option.value);
                    setOpen(false);
                  }}
                >
                  <Check
                    className={cn("size-4", option.value === value ? "opacity-100" : "opacity-0")}
                    aria-hidden
                  />
                  <span className="truncate">{option.label}</span>
                  {option.hint ? (
                    <span className="ml-auto text-xs text-muted-foreground">{option.hint}</span>
                  ) : null}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
