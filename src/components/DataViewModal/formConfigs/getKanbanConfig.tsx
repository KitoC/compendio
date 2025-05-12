import { FormConfig } from "@/components/FormBuilder/types";
import {
  CustomTableField,
  CustomTableRecord,
  CustomTableSchema,
} from "@/types/customTable";
import { ViewType } from "@/services/DataViewsService";
import { MultiselectOption } from "@/components/ui/multiselect";

interface GetKanbanConfigProps {
  tableSchema: CustomTableSchema;
  tables: CustomTableSchema[];
  primaryField: CustomTableField;
  exampleRecord: CustomTableRecord;
}

export const getKanbanConfig = ({
  tableSchema,
  tables,
  primaryField,
  exampleRecord,
}: GetKanbanConfigProps): FormConfig["sections"] => {
  const groupableFields = tableSchema?.fields?.filter((field) =>
    ["link_row", "single_select", "multi_select"].includes(field.type)
  );

  const visibleAttributeOptions = tableSchema?.fields?.filter(
    (field) => !field.is_primary
  );

  return [
    {
      id: "kanban-config",
      hidden: (values) => values["view_type"] !== ViewType.Kanban,
      title: "Configure kanban view",
      divider: true,
      fields: [
        {
          id: "groupByField",
          label: "Group by",
          name: "groupByField",
          type: "select",
          options: groupableFields?.map((field) => ({
            label: field.name,
            value: field.id,
          })),
          validation: {
            required: true,
          },
        },
        {
          id: "visibleAttributes",
          label: "Configure what is visible on the Kanban cards",
          name: "visibleAttributes",
          type: "multiselect",
          hint: "Select the fields to show on card",
          defaultValue: [
            {
              value: tableSchema?.primary_field_id,
              label: primaryField?.name,
            },
          ],
          props: { sortable: true },
          options: [
            ...(visibleAttributeOptions || []).map((field) => ({
              label: field.name,
              value: field.id,
            })),
          ],
          // renderBelowInput: (value: MultiselectOption[]) => {
          //   if (!exampleRecord) {
          //     return null;
          //   }

          //   return (
          //     <div className="flex items-center gap-2">
          //       <span className="text-sm text-muted-foreground">
          //         Example label:
          //       </span>
          //       <p>{value.map((v) => exampleRecord?.[v?.label]).join(" ")}</p>
          //     </div>
          //   );
          // },
        },
      ],
    },
  ];
};
