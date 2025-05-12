import { CustomFieldComponentProps } from "../FormBuilder/types";
import Multiselect from "../ui/multiselect";
import RecordTag from "./RecordTag";
import { components } from "react-select";
import { useCallback, useMemo, useState } from "react";
import { differenceBy } from "lodash";
import { SelectOption } from "@/types/fieldTypes";
import { ServiceQuery } from "@/services/supabase/BaseService";
import { useDebounce } from "use-debounce";
import { useQuery } from "@tanstack/react-query";

interface EntitySelectProps<RecordType> extends CustomFieldComponentProps {
  isMulti: boolean;
  value: SelectOption[];
  onChange: (name: string, value: SelectOption[]) => void;

  renderLabel: (record: RecordType) => string;
  tableName: string;
  uniqueKey: string;
  onFetch?: (query: ServiceQuery) => { data: RecordType[] };
  placeholder?: string;
}

const mutateInnerProps = (props) => {
  const stopPropagation = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const innerProps = {
    ...props.innerProps,
    onMouseDown: stopPropagation,
    onClick: stopPropagation,
  };
  return innerProps;
};

const MultiValue = (props) => {
  // this prevents the menu from being opened/closed when the user clicks
  // on a value.

  return (
    <components.MultiValue {...props} innerProps={mutateInnerProps(props)} />
  );
};

// const ValueContainer = ({ children }) => {
//   return <div className="flex items-center gap-2">{children}</div>;
// };

function EntitySelect<RecordType extends { id: string }>({
  value = [],
  onChange,
  name,
  renderLabel,
  onFetch,
  isMulti,
  tableName,
  uniqueKey,
  placeholder,
}: EntitySelectProps<RecordType>) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState("");

  const [debouncedInputValue] = useDebounce(inputValue, 500);

  const {
    data: { data = [] },
    isLoading,
    isFetching,
  } = useQuery<{ data: RecordType[] }, Error>({
    queryKey: [tableName, debouncedInputValue],
    queryFn: () => {
      setIsOpen(true);
      return onFetch?.({ search: debouncedInputValue });
    },
    enabled: !!onFetch && !!debouncedInputValue,
    placeholderData: (previousData, previousQuery) => {
      if (previousQuery?.queryKey?.[1] === debouncedInputValue) {
        return previousData;
      }

      return { data: [] };
    },
    // keepPreviousData: true,
  });

  const options: SelectOption[] = useMemo(() => {
    return data?.map((record) => ({
      value: record.id,
      label: renderLabel(record),
      data: record,
    }));
  }, [data, renderLabel]);

  const handleChange = useCallback(
    (newValue: SelectOption[]) => {
      if (isMulti) {
        onChange(name, newValue);
      } else {
        onChange(name, differenceBy(newValue, value, "value"));
      }
    },
    [name, onChange, isMulti, value]
  );

  const handleInputChange = useCallback((value: string) => {
    setInputValue(value);
  }, []);

  const components = useMemo(() => {
    const RecordValue = ({ children, data, ...props }) => {
      return (
        <RecordTag modalId={`${name}-modal`} className="mr-1" record={data}>
          {children}
        </RecordTag>
      );
    };

    return {
      MultiValue,
      SingleValue: RecordValue,
      MultiValueLabel: ({ children }) => children,
      MultiValueContainer: RecordValue,
    };
  }, [name]);

  return (
    <>
      <Multiselect
        isLoading={isLoading || isFetching}
        disabled={isLoading}
        name={name}
        value={value || []}
        onChange={handleChange}
        options={options}
        components={components}
        onInputChange={handleInputChange}
        inputValue={inputValue}
        menuIsOpen={isOpen}
        onMenuOpen={() => setIsOpen(true)}
        onMenuClose={() => {
          setIsOpen(false);
        }}
        isSearchable
        placeholder={placeholder}
      />
      <div id={`${name}-modal`} />
    </>
  );
}

export default EntitySelect;
