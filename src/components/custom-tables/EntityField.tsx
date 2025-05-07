import { CustomTableField, SelectOption } from "@/types/customTable";
import { CustomFieldComponentProps } from "../form-builder/types";
import Multiselect, { MultiselectOption } from "../ui/multiselect";
import RecordTag from "./RecordTag";
import { components } from "react-select";
import { useCallback, useMemo, useState } from "react";
import { useCustomRecordsQuery } from "@/hooks/useCustomTableQuery";
import { useCustomTables } from "@/contexts/CustomTables";

interface CustomTableEntityFieldProps extends CustomFieldComponentProps {
  field: CustomTableField;
  value: SelectOption[];
  onChange: (name: string, value: SelectOption[]) => void;
}

const MultiValue = (props) => {
  // this prevents the menu from being opened/closed when the user clicks
  // on a value.
  const stopPropagation = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const innerProps = {
    ...props.innerProps,
    onMouseDown: stopPropagation,
    onClick: stopPropagation,
  };

  return <components.MultiValue {...props} innerProps={innerProps} />;
};

const CustomTableEntityField = ({
  field,
  value = [],
  onChange,
  name,
}: CustomTableEntityFieldProps) => {
  const [dialogOpen, setDialogOpen] = useState(false);
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
    (value: SelectOption[]) => onChange(name, value),
    [name, onChange]
  );

  const handleInputChange = useCallback(
    (value: string) => setInputValue(value),
    []
  );

  const components = useMemo(() => {
    return {
      MultiValue,
      MultiValueLabel: ({ children }) => children,
      MultiValueContainer: ({ children, data, ...props }) => {
        return (
          <RecordTag
            modalId={`${name}-modal`}
            className="mr-1"
            record={data.data}
            field={field}
          >
            {children}
          </RecordTag>
        );
      },
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
      />
      <div id={`${name}-modal`} />
    </>
  );
};

export default CustomTableEntityField;
