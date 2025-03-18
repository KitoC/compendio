
import * as React from "react";
import { useState, useEffect } from "react";
import { Check, ChevronsUpDown, Search } from "lucide-react";
import { icons } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

export type IconPickerProps = {
  value?: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
};

export function IconPicker({
  value,
  onChange,
  placeholder = "Select an icon",
  className,
  disabled = false,
}: IconPickerProps) {
  const [open, setOpen] = useState(false);
  const [iconNames, setIconNames] = useState<string[]>([]);
  
  useEffect(() => {
    // Get all icon names from the lucide-react icons object
    const names = Object.keys(icons);
    setIconNames(names);
  }, []);

  // Get the current icon component if a value is selected
  const selectedIcon = value ? icons[value as keyof typeof icons] : undefined;
  const IconComponent = selectedIcon;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("w-full justify-between", className)}
          disabled={disabled}
        >
          <div className="flex items-center gap-2">
            {value && IconComponent && (
              <IconComponent className="h-4 w-4" aria-hidden="true" />
            )}
            <span className="truncate">
              {value ? value : placeholder}
            </span>
          </div>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="p-0 w-[300px]">
        <Command>
          <CommandInput placeholder="Search icons..." icon={<Search className="h-4 w-4" />} />
          <CommandList className="max-h-[300px]">
            <CommandEmpty>No icons found.</CommandEmpty>
            <CommandGroup>
              {iconNames.map((iconName) => {
                const Icon = icons[iconName as keyof typeof icons];
                return (
                  <CommandItem
                    key={iconName}
                    value={iconName}
                    onSelect={() => {
                      onChange(iconName);
                      setOpen(false);
                    }}
                  >
                    <div className="flex items-center gap-2">
                      <Icon className="h-4 w-4" />
                      <span>{iconName}</span>
                    </div>
                    {value === iconName && (
                      <Check className="ml-auto h-4 w-4" />
                    )}
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
