
import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Calendar as CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { FieldFilterProps } from "./types";
import { cn } from "@/lib/utils";

const FieldFilter = ({ field, value, onChange }: FieldFilterProps) => {
  const [filterValue, setFilterValue] = useState<any>(value);

  useEffect(() => {
    if (value !== filterValue) {
      setFilterValue(value);
    }
  }, [value]);

  const handleChange = (newValue: any) => {
    setFilterValue(newValue);
    onChange(newValue);
  };

  switch (field.type) {
    case "checkbox":
      return (
        <div className="flex items-center space-x-2">
          <Checkbox
            checked={!!filterValue}
            onCheckedChange={(checked) => handleChange(!!checked)}
          />
          <span className="text-sm text-muted-foreground">
            {filterValue ? "Yes" : "No"}
          </span>
        </div>
      );

    case "singleSelect":
      return (
        <Select
          value={filterValue || ""}
          onValueChange={handleChange}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All</SelectItem>
            {field.options?.choices?.map((choice) => (
              <SelectItem key={choice.id} value={choice.id}>
                {choice.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      );

    case "date":
    case "dateTime":
      return (
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant={"outline"}
              className={cn(
                "w-full justify-start text-left font-normal",
                !filterValue && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {filterValue ? format(new Date(filterValue), "PPP") : "Pick a date"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0">
            <Calendar
              mode="single"
              selected={filterValue ? new Date(filterValue) : undefined}
              onSelect={(date) => handleChange(date ? date.toISOString() : null)}
              initialFocus
            />
          </PopoverContent>
        </Popover>
      );

    default:
      return (
        <Input
          type={field.type === "number" ? "number" : "text"}
          placeholder={`Filter by ${field.name}`}
          value={filterValue || ""}
          onChange={(e) => handleChange(e.target.value)}
          className="w-full"
        />
      );
  }
};

export default FieldFilter;
