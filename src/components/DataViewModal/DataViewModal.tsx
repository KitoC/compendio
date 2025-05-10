import ResponsiveModal from "@/components/ui/responsive-modal";
import FormBuilder from "@/components/form-builder/FormBuilder";
import { DATA_VIEW_TYPES } from "../custom-tables/consts";
import { FormConfig } from "@/components/form-builder/types";
import {
  useCustomRecordsQuery,
  useCustomTableSchemaQuery,
} from "@/hooks/useCustomTableQuery";
import { Loader2 } from "lucide-react";
import { useMemo, useState } from "react";
import DateFieldSelector from "./DateFieldSelector";
import CalendarViewsSelector from "./CalendarViewsSelector";
import { MultiselectOption } from "../ui/multiselect";
import {
  useCreateOrUpdateDataViewMutation,
  useDataViewQuery,
} from "@/hooks/DataViews";
import {
  DATA_VIEWS_TABLE_NAME,
  IDataView,
  ViewType,
} from "@/services/DataViewsService";
import { Json } from "@/integrations/supabase/types";
import { useTenant } from "@/contexts/TenantContext";
import { supabase } from "@/integrations/supabase/client";
import { useCustomTables } from "@/contexts/CustomTables";
import { kebabCase } from "lodash";

const DataViewModal = ({
  open,
  setOpen,
  tableId,
  dataViewId,
  onSuccess,
  dataNavigationItemId,
  isDefault,
}: {
  open: boolean;
  setOpen: (open: boolean) => void;
  tableId?: string;
  dataViewId?: string;
  onSuccess: (dataView: IDataView) => void;
  dataNavigationItemId?: string;
  isDefault?: boolean;
}) => {
  const [internalTableId, setInternalTableId] = useState<string | undefined>(
    tableId
  );
  const { tenantId } = useTenant();
  const { tables } = useCustomTables();
  const { data: tableSchema, isLoading: isLoadingSchema } =
    useCustomTableSchemaQuery(internalTableId as string);
  const { records: [exampleRecord] = [] } = useCustomRecordsQuery({
    tableId: internalTableId as string,
    queryString: "pageSize=1",
  });

  const { dataView, isFetching: isLoadingDataView } =
    useDataViewQuery(dataViewId);

  const { mutate: createOrUpdateDataView, isPending: isSubmitting } =
    useCreateOrUpdateDataViewMutation({ onSuccess });

  const formConfig: FormConfig = useMemo(() => {
    const config: FormConfig = {
      id: "data-view-form",

      sections: [
        {
          id: "switcher",
          title: "View options",
          divider: true,
          fields: [
            {
              id: "table_id",
              type: "select",
              label: "Table",
              name: "table_id",
              options: tables.map((table) => ({
                label: table.name,
                value: table.external_id,
              })),
              validation: {
                required: true,
              },
            },
            {
              id: "view_type",
              type: "select",
              label: "View type",
              name: "view_type",
              options: DATA_VIEW_TYPES,
              validation: {
                required: true,
              },
            },
            {
              id: "name",
              type: "text",
              label: "Name",
              name: "label",
              placeholder: "My custom view",
              validationAsyncOnBlur: async (value) => {
                const { data, error } = await supabase
                  .from(DATA_VIEWS_TABLE_NAME)
                  .select("*")
                  .eq("label", value)
                  .eq("tenant_id", tenantId);

                if (error) {
                  return {
                    isValid: false,
                    error: "Error checking if label is unique",
                  };
                }

                return {
                  isValid: data.length === 0,
                  error: "Name must be unique",
                };
              },
            },
          ],
        },
      ],
    };

    if (tableSchema) {
      const dateFields = tableSchema?.fields?.filter((field) =>
        ["date", "dateTime", "createdTime", "lastModifiedTime"].includes(
          field.type
        )
      );

      const groupableFields = tableSchema?.fields?.filter(
        (field) =>
          !["date", "dateTime", "createdTime", "lastModifiedTime"].includes(
            field.type
          )
      );

      const primaryField = tableSchema?.fields?.find(
        (field) => field.id === tableSchema?.primary_field_id
      );

      config.sections.push(
        ...([
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
                      <p>
                        {value.map((v) => exampleRecord?.[v?.label]).join(" ")}
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
                  <CalendarViewsSelector
                    {...fieldProps}
                    dateFields={dateFields}
                  />
                ),
              },
            ],
          },
        ] as FormConfig["sections"])
      );
    }

    return config;
  }, [tableSchema, exampleRecord, tenantId, tables]);
  const footerId = `data-view-modal-footer-${dataViewId}`;

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
      footerId={footerId}
      footer={<div></div>}
    >
      {isLoadingDataView ? (
        <div className="flex justify-center items-center h-full">
          <Loader2 className="w-4 h-4 animate-spin" />
        </div>
      ) : (
        <>
          <FormBuilder
            config={formConfig}
            className="border-none rounded-none shadow-none"
            contentClassName="px-6 pt-6"
            footerClassname="!pb-0 shadow-md-top z-10"
            onSubmit={({ label, view_type, ...config }) => {
              createOrUpdateDataView({
                id: dataView?.id,
                tenant_id: tenantId,
                data_table_id: tableSchema?.id,
                external_table_id: tableSchema?.external_id,
                label: label as string,
                config: config as Json,
                view_type: view_type as ViewType,
                data_navigation_item_id:
                  dataNavigationItemId || dataView?.data_navigation_item_id,
                is_default: isDefault,
                alias: kebabCase(label as string),
              } as IDataView);
            }}
            onFormChange={(values) => {
              setInternalTableId(values.table_id as string);
            }}
            isSubmitting={isSubmitting}
            onCancel={() => setOpen(false)}
            buttonPortalId={footerId}
            initialValues={{
              view_type: "grid",
              ...(dataView || {}),
              ...dataView?.config,
            }}
          />
        </>
      )}
    </ResponsiveModal>
  );
};

export default DataViewModal;
