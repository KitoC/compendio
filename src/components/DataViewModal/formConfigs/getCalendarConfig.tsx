import { FormConfig } from "@/components/form-builder/types";
import { TableSchema } from "@/hooks/useTableBuilderService";
import {
  CustomTableField,
  CustomTableRecord,
  CustomTableSchema,
} from "@/types/customTable";
import { Field } from "react-hook-form";
import DateFieldSelector from "../DateFieldSelector";
import { MultiselectOption } from "@/components/ui/multiselect";
import CalendarViewsSelector from "../CalendarViewsSelector";
import { ViewType } from "@/services/DataViewsService";

interface GetCalendarConfigProps {
  tableSchema: CustomTableSchema;
  tables: CustomTableSchema[];
  primaryField: CustomTableField;
  exampleRecord: CustomTableRecord;
}

export const getCalendarConfig = ({
  tableSchema,
  tables,
  primaryField,
  exampleRecord,
}: GetCalendarConfigProps): FormConfig["sections"] => {
  const dateFields = tableSchema?.fields?.filter((field) =>
    ["date", "dateTime", "createdTime", "lastModifiedTime"].includes(field.type)
  );

  const groupableFields = tableSchema?.fields?.filter(
    (field) =>
      !["date", "dateTime", "createdTime", "lastModifiedTime"].includes(
        field.type
      )
  );
  return [
    {
      id: "calendar-config",
      hidden: (values) => values["view_type"] !== ViewType.Calendar,
      title: "Configure calendar view",
      divider: true,
      fields: [
        {
          id: "preloadTable",
          label: "Preload table",
          name: "preloadTable",
          type: "select",
          hint: "Table that",
          validation: {
            required: true,
          },
          options: tables.map((table) => ({
            label: table.name,
            value: table.external_id,
          })),
          CustomComponent: (fieldProps) => (
            <DateFieldSelector {...fieldProps} dateFields={dateFields} />
          ),
        },
        {
          id: "dateFields",
          label: "Date field",
          name: "dateFields",
          type: "custom",
          hint: "Setting End date the same as Start date will make the events full day",
          validation: {
            required: true,
          },
          CustomComponent: (fieldProps) => (
            <DateFieldSelector {...fieldProps} dateFields={dateFields} />
          ),
        },
        {
          id: "eventLabelField",
          label: "Label events by",
          name: "eventLabelField",
          type: "multiselect",
          hint: "Select the field that will be used to label the events",
          defaultValue: [
            {
              value: tableSchema?.primary_field_id,
              label: primaryField?.name,
            },
          ],
          props: { sortable: true },
          options: [
            ...(groupableFields || []).map((field) => ({
              label: field.name,
              value: field.id,
            })),
          ],
          renderBelowInput: (value: MultiselectOption[]) => {
            if (!exampleRecord) {
              return null;
            }

            return (
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">
                  Example label:
                </span>
                <p>{value.map((v) => exampleRecord?.[v?.label]).join(" ")}</p>
              </div>
            );
          },
        },
        {
          id: "groupByField",
          label: "Group events by",
          name: "groupByField",
          type: "select",
          hint: "Group the events by a field (only works for week, day and agenda views)",
          defaultValue: "none",
          options: [
            { label: "None", value: "none" },
            ...(groupableFields || []).map((field) => ({
              label: field.name,
              value: field.id,
            })),
          ],
        },
        {
          id: "calendarViews",
          label: "Calendar views",
          name: "calendarViews",
          type: "custom",
          CustomComponent: (fieldProps) => (
            <CalendarViewsSelector {...fieldProps} dateFields={dateFields} />
          ),
        },
      ],
    },
  ];
};
