import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
  SelectSeparator,
} from "@/components/ui/select";
import { Plus } from "lucide-react";
import React, { useState } from "react";
import { ACTION_OPTIONS } from "../consts/actions";

const ActionSelect = ({ onChange, value, disabled = false }) => {
  const [open, setOpen] = useState(false);

  return (
    <Select onValueChange={onChange} value={value}>
      <SelectTrigger
        className="!border !border-2 !border-border"
        onClick={() => setOpen(!open)}
        disabled={disabled}
      >
        <SelectValue
          placeholder={
            <span className="flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Add action
            </span>
          }
        />
      </SelectTrigger>
      <SelectContent>
        {ACTION_OPTIONS.map(({ options, group }) => (
          <React.Fragment key={group}>
            <SelectGroup>
              <SelectLabel>{group}</SelectLabel>
              {options.map((option) => (
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
            <SelectSeparator />
          </React.Fragment>
        ))}
      </SelectContent>
    </Select>
  );
};

export default ActionSelect;
