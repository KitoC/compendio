import ResponsiveModal from "@/components/ui/responsive-modal";
import FormBuilder from "@/components/form-builder/FormBuilder";
import { DATA_VIEW_TYPES } from "../airtable-table/consts";
import { FormConfig } from "@/components/form-builder/types";
import {
  useAirtableRecordsQuery,
  useAirtableTableSchemaQuery,
} from "@/hooks/useAirtableQuery";
import { Loader2 } from "lucide-react";
import { useMemo } from "react";
import DateFieldSelector from "./DateFieldSelector";
import CalendarViewsSelector from "./CalendarViewsSelector";
import { MultiselectOption } from "../ui/multiselect";
import {
  useCreateOrUpdateDataViewMutation,
  useDataViewQuery,
} from "@/hooks/useDataViewsQuery";
import { IDataView } from "@/services/DataViewsService";
import { Json } from "@/integrations/supabase/types";
import { useTenant } from "@/contexts/TenantContext";

const DataViewModal = ({
  open,
  setOpen,
  tableId,
  dataViewId,
  onSuccess,
}: {
  open: boolean;
  setOpen: (open: boolean) => void;
  tableId: string;
  dataViewId?: string;
  onSuccess: (dataView: IDataView) => void;
}) => {
  const { tenantId } = useTenant();
  const { data: tableSchema, isLoading: isLoadingSchema } =
    useAirtableTableSchemaQuery(tableId as string);
  const { records: [exampleRecord] = [] } = useAirtableRecordsQuery({
    tableId: tableId as string,
    queryString: "pageSize=1",
  });

  const { dataView, isFetching: isLoadingDataView } = useDataViewQuery(
    dataViewId as string
  );

  const { mutate: createOrUpdateDataView, isPending: isSubmitting } =
    useCreateOrUpdateDataViewMutation(tableId as string, onSuccess);

  const formConfig: FormConfig = useMemo(() => {
    if (!tableSchema) return null;

    const dateFields = tableSchema.fields.filter((field) =>
      ["date", "dateTime", "createdTime", "lastModifiedTime"].includes(
        field.type
      )
    );
    const groupableFields = tableSchema.fields.filter(
      (field) =>
        !["date", "dateTime", "createdTime", "lastModifiedTime"].includes(
          field.type
        )
    );

    const primaryField = tableSchema.fields.find(
      (field) => field.id === tableSchema.primaryFieldId
    );

    return {
      id: "data-view-form",

      sections: [
        {
          id: "switcher",
          title: "View options",
          divider: true,
          fields: [
            {
              id: "view_type",
              type: "select",
              label: "View type",
              name: "view_type",
              options: DATA_VIEW_TYPES,
            },
            {
              id: "name",
              type: "text",
              label: "Name",
              name: "label",
              placeholder: "My custom view",
              validation: {
                required: true,
              },
            },
          ],
        },
        {
          id: "grid-config",
          title: "Configure grid view",
          hidden: (values) => values["view_type"] !== "grid",
          fields: [
            //    TODO: add config for grid view
          ],
        },
        // {
        //   id: "kanban-config",
        //   title: "Configure kanban view",
        //   hidden: (values) => values["view_type"] !== "kanban",
        //   fields: [
        //     //    TODO: add config for kanban view
        //   ],
        // },
        {
          id: "calendar-config",
          hidden: (values) => values["view_type"] !== "calendar",
          title: "Configure calendar view",
          divider: true,
          fields: [
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
                  value: tableSchema.primaryFieldId,
                  label: primaryField?.name,
                },
              ],
              props: {
                sortable: true,
              },
              options: [
                ...groupableFields.map((field) => ({
                  label: field.name,
                  value: field.id,
                })),
              ],
              renderBelowInput: (value: MultiselectOption[]) => {
                return (
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">
                      Example label:
                    </span>
                    <p>
                      {value
                        .map((v) => exampleRecord?.fields[v.label])
                        .join(" ")}
                    </p>
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
                ...groupableFields.map((field) => ({
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
                <CalendarViewsSelector
                  {...fieldProps}
                  dateFields={dateFields}
                />
              ),
            },
          ],
        },
      ],
    };
  }, [tableSchema, exampleRecord]);

  return (
    <ResponsiveModal
      isOpen={open}
      setIsOpen={setOpen}
      title={
        dataView?.id ? `Editing ${dataView.label} view` : "Create custom view"
      }
      isSlider
      bodyClassName="!p-0"
      headerClassName="shadow-md z-10"
    >
      {isLoadingSchema || isLoadingDataView ? (
        <div className="flex justify-center items-center h-full">
          <Loader2 className="w-4 h-4 animate-spin" />
        </div>
      ) : (
        <FormBuilder
          config={formConfig}
          className="border-none rounded-none shadow-none h-full relative"
          contentClassName="px-6 pt-6 "
          footerClassname="absolute bottom-0 left-0 right-0 shadow-md-top z-10"
          onSubmit={({ label, view_type, ...config }) => {
            createOrUpdateDataView({
              id: dataView?.id,
              tenant_id: tenantId,
              data_table_id: tableSchema.id,
              external_table_id: tableSchema.external_id,
              label: label as string,
              config: config as Json,
              view_type: view_type as string,
            });
          }}
          isSubmitting={isSubmitting}
          onCancel={() => setOpen(false)}
          initialValues={{
            view_type: "grid",
            ...(dataView || {}),
            ...dataView?.config,
          }}
        />
      )}
    </ResponsiveModal>
  );
};

export default DataViewModal;
