import { ChevronDown } from "lucide-react";
import { Badge } from "./badge";

import { useRef } from "react";
import Select, { Props } from "react-select";

export interface MultiselectOption {
  value: string;
  label: string;
  data?: unknown;
}

interface MultiselectProps extends Props<MultiselectOption> {
  value: MultiselectOption[];
  onChange: (value: MultiselectOption[]) => void;
  options: MultiselectOption[];
  disabled?: boolean;
  name: string;
  isClearable?: boolean;
}

const defaultComponents = {
  MultiValueContainer: ({ children }) => (
    <Badge variant="outline" className="mr-1">
      {children}
    </Badge>
  ),
  DropdownIndicator: () => (
    <div className="flex items-center justify-center p-2">
      <ChevronDown className="w-4 h-4" />
    </div>
  ),
};

const defaultStyles = {
  multiValueRemove: (base) => ({
    ...base,
    borderRadius: "50%",
    padding: "2px",
    height: "100%",
    marginLeft: "4px",
  }),
  control: (base) => ({
    ...base,
    borderRadius: "0.5rem",
  }),
};

const Multiselect = ({
  value,
  onChange,
  options,
  disabled,
  name,
  isClearable,
  components,
  styles,
}: MultiselectProps) => {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <Select
      value={value}
      isMulti
      name={name}
      isDisabled={disabled}
      options={options}
      onChange={onChange}
      isClearable={isClearable}
      className="border-none"
      classNamePrefix="select"
      menuPlacement="auto"
      styles={{
        ...defaultStyles,
        ...styles,
      }}
      components={{
        ...defaultComponents,
        ...components,
      }}
    />
  );
};

export default Multiselect;
