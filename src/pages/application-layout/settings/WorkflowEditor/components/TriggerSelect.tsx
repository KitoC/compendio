import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus } from "lucide-react";
import { useState } from "react";
import { TRIGGER_OPTIONS } from "../consts/triggers";

const TriggerSelect = ({ onChange, value }) => {
  const [open, setOpen] = useState(false);

  return (
    <Select onValueChange={onChange} value={value}>
      <SelectTrigger
        className="!border !border-2 !border-border"
        onClick={() => setOpen(!open)}
      >
        <SelectValue
          placeholder={
            <span className="flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Add Trigger
            </span>
          }
        />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          {TRIGGER_OPTIONS.map((option) => (
            <SelectItem
              key={option.value}
              value={option.value}
              className="flex items-center !pl-1.5 hover:bg-muted pointer-events-auto"
              Icon={option.Icon}
            >
              {option.label}
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  );
};

export default TriggerSelect;
