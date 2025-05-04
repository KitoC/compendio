import { CustomTableField } from "@/types/customTable";
import { CustomFieldComponentProps } from "../form-builder/types";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import Multiselect from "../ui/multiselect";
import RecordTag from "./RecordTag";
import { components } from "react-select";
import { useState } from "react";

interface CustomTableEntityFieldProps extends CustomFieldComponentProps {
  field: CustomTableField;
  value: { id: string; value: string }[];
  onChange: (name: string, value: string[]) => void;
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

  // TODO: Derive this from actual data.
  const { data: labels } = useQuery({
    queryKey: ["labels", field.inverse_linked_table_id],
    queryFn: async () => {
      const { data } = await supabase
        .from("data_table_record_labels")
        .select("*")
        .eq("external_table_id", field.inverse_linked_table_id);

      return data;
    },
  });

  const _value = value
    ? value.map((v) => {
        return {
          value: v.id,
          label: v.value,
          data: v,
        };
      })
    : [];

  return (
    <>
      <Multiselect
        disabled={dialogOpen}
        name={name}
        value={_value}
        onChange={(value) => {
          onChange(
            name,
            value?.map((v) => v.value as string)
          );
        }}
        options={labels?.map((label) => ({
          value: label.id,
          label: label.value,
          data: label,
        }))}
        components={{
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
        }}
      />
      <div id={`${name}-modal`} />
    </>
  );
};

export default CustomTableEntityField;
