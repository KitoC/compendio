import { CustomTableField, SelectOption } from "@/types/customTable";
import { CustomFieldComponentProps } from "../FormBuilder/types";
import Multiselect from "../ui/multiselect";
import RecordTag from "./RecordTag";
import { components } from "react-select";
import { useCallback, useMemo, useState } from "react";
import { useCustomRecordsQuery } from "@/hooks/useCustomTableQuery";
import { useCustomTables } from "@/contexts/CustomTables";
import { differenceBy } from "lodash";

interface CustomTableEntityFieldProps extends CustomFieldComponentProps {
  field: CustomTableField;
  value: SelectOption[];
  onChange: (name: string, value: SelectOption[]) => void;
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

const CustomTableEntityField = ({
  field,
  value = [],
  onChange,
  name,
}: CustomTableEntityFieldProps) => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const [inputValue, setInputValue] = useState("");
  const { tables } = useCustomTables();
  const inverseTable = tables.find(
    (table) => table.external_id == field.inverse_linked_table_id
  );
  const inversePrimaryField = inverseTable?.fields.find(
    (field) => field.is_primary
  );

  // TODO: Derive this from actual data.
  const { records, isLoading, isFetching } = useCustomRecordsQuery({
    tableId: field.inverse_linked_table_id as string,
    queryString: `${inputValue ? `search=${inputValue}` : ""}`,
  });

  const options: SelectOption[] = useMemo(() => {
    return records?.map((record) => ({
      value: record._id,
      label: record[inversePrimaryField?.name || "_id"] as string,
      data: record,
    }));
  }, [records, inversePrimaryField]);

  const handleChange = useCallback(
    (newValue: SelectOption[]) => {
      if (field.is_multiple) {
        onChange(name, newValue);
      } else {
        onChange(name, differenceBy(newValue, value, "value"));
      }
    },
    [name, onChange, field.is_multiple, value]
  );

  const handleInputChange = useCallback(
    (value: string) => setInputValue(value),
    []
  );

  const components = useMemo(() => {
    const RecordValue = ({ children, data, ...props }) => {
      return (
        <RecordTag
          modalId={`${name}-modal`}
          className="mr-1"
          record={data}
          field={field}
        >
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
  }, [name, field]);

  return (
    <>
      <Multiselect
        isLoading={isLoading || isFetching}
        disabled={dialogOpen || isLoading}
        name={name}
        value={value || []}
        onChange={handleChange}
        options={options}
        components={components}
        onInputChange={handleInputChange}
        inputValue={inputValue}
        menuIsOpen={isOpen}
        onMenuOpen={() => setIsOpen(true)}
        onMenuClose={() => setIsOpen(false)}
      />
      <div id={`${name}-modal`} />
    </>
  );
};

export default CustomTableEntityField;
