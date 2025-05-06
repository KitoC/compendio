import { UserPermissions } from "@/components/custom-tables/types";
import { useMemo } from "react";
import { createColumnHelper } from "@tanstack/react-table";
import { formatFieldValue } from "@/components/custom-tables/utils";
import ActionsCell from "../ActionCell";
import { useIsMobile } from "@/hooks/use-mobile";
import type { CustomTableRecord, CustomTableSchema } from "@/types/customTable";
const columnHelper = createColumnHelper<CustomTableRecord>();

const useColumns = (table: CustomTableSchema, permissions: UserPermissions) => {
  const isMobile = useIsMobile();

  const displayFields = useMemo(() => {
    if (!table || !table.fields) return [];
    let fields = table.fields.filter(
      (f) => !["createdBy", "lastModifiedBy"].includes(f.type)
    );

    const primary = table.fields.find(
      (f) => f.id?.toString() === table.primary_field_id
    );

    if (primary) {
      fields = [primary, ...fields.filter((f) => f.id !== primary.id)];
    }
    return isMobile ? fields.slice(0, 2) : fields;
  }, [table, isMobile]);

  const columns = useMemo(() => {
    if (!displayFields.length) return [];

    return [
      columnHelper.accessor((row) => row[displayFields[0].name], {
        id: displayFields[0].id?.toString(),
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
        columnHelper.accessor((row) => row[field.name], {
          id: field.id?.toString(),
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
                  record={row.original as CustomTableRecord}
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
