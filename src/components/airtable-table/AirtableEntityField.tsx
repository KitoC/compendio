import { AirtableField } from "@/types/airtable";
import { CustomFieldComponentProps } from "../form-builder/types";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Database } from "@/integrations/supabase/types";
import Multiselect from "../ui/multiselect";
import RecordTag from "./RecordTag";
import { components } from "react-select";
import { useState } from "react";

type DataTableRecordLabel =
  Database["public"]["Tables"]["data_table_record_labels"]["Row"];

interface AirtableEntityFieldProps extends CustomFieldComponentProps {
  field: AirtableField;
  value: string[];
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

const AirtableEntityField = ({
  field,
  value = [],
  onChange,
  name,
}: AirtableEntityFieldProps) => {
  const [dialogOpen, setDialogOpen] = useState(false);

  const { data: labels } = useQuery({
    queryKey: ["labels", field.options?.linkedTableId],
    queryFn: async () => {
      const { data } = await supabase
        .from("data_table_record_labels")
        .select("*")
        .eq("external_table_id", field.options?.linkedTableId);

      return data;
    },
  });

  const _value = value
    ? value.map((v) => {
        const label = labels?.find((l) => l.record_id === v);
        return {
          value: v,
          label: label?.label,
          data: label,
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
          value: label.record_id,
          label: label.label,
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
                record={data.data as DataTableRecordLabel}
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

export default AirtableEntityField;
