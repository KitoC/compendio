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
    <Badge
      variant="outline"
      className="mr-1 bg-sidebar dark:bg-sidebar [&>*]:!text-white"
    >
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
      classNamePrefix="select"
      menuPlacement="auto"
      classNames={{
        control: (state) =>
          "bg-background dark:bg-background !border-none !rounded-md overflow-hidden",
        multiValue: (state) => "!bg-sidebar !dark:bg-sidebar text-white",
        menu: (state) => "!bg-sidebar !dark:bg-sidebar text-white",
        option: (state) =>
          "!bg-sidebar !dark:bg-sidebar hover:!bg-muted text-white",
      }}
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
