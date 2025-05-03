import { UserPermissions } from "@/components/airtable-table/types";
import { AirtableRecord } from "@/types/airtable";
import { useMemo } from "react";
import { createColumnHelper } from "@tanstack/react-table";
import { formatFieldValue } from "@/components/airtable-table/utils";
import ActionsCell from "../ActionCell";
import { AirtableTable } from "@/types/airtable";
import { useIsMobile } from "@/hooks/use-mobile";

const columnHelper = createColumnHelper<AirtableRecord>();

const useColumns = (table: AirtableTable, permissions: UserPermissions) => {
  const isMobile = useIsMobile();

  const displayFields = useMemo(() => {
    if (!table || !table.fields) return [];
    let fields = table.fields.filter(
      (f) => !["createdBy", "lastModifiedBy"].includes(f.type)
    );
    const primary = table.fields.find((f) => f.id === table.primaryFieldId);
    if (primary) {
      fields = [primary, ...fields.filter((f) => f.id !== primary.id)];
    }
    return isMobile ? fields.slice(0, 2) : fields;
  }, [table, isMobile]);

  const columns = useMemo(() => {
    if (!displayFields.length) return [];

    return [
      columnHelper.accessor((row) => row.fields[displayFields[0].name], {
        id: displayFields[0].id,
        header: () => displayFields[0].name,
        cell: (info) => (
          <div className="h-full flex items-center">
            {formatFieldValue(
              info.getValue(),
              displayFields[0],
              info.row.original
            )}
          </div>
        ),
      }),
      ...displayFields.slice(1).map((field) =>
        columnHelper.accessor((row) => row.fields[field.name], {
          id: field.id,
          header: () => field.name,
          cell: (info) => (
            <div className="h-full flex items-center">
              {formatFieldValue(info.getValue(), field, info.row.original)}
            </div>
          ),
        })
      ),
      ...(permissions.update || permissions.delete
        ? [
            columnHelper.display({
              id: "actions",
              header: () => null,
              cell: ({ row }) => (
                <ActionsCell
                  record={row.original as AirtableRecord}
                  permissions={permissions}
                />
              ),
            }),
          ]
        : []),
    ];
  }, [displayFields, permissions]);

  return { columns, displayFields };
};

export default useColumns;
