import { useMemo } from "react";
import { ColumnDef, createColumnHelper } from "@tanstack/react-table";
import { formatFieldValue } from "@/components/custom-tables/utils";
import ActionsCell from "../ActionCell";
import type { CustomTableRecord } from "@/types/customTable";

const columnHelper = createColumnHelper<CustomTableRecord>();

const useColumnHelper = (
  columnsConfig: ColumnDef<Record<string, unknown>, unknown>[]
) => {
  console.log({ columnsConfig });
  const columns = useMemo(() => {
    if (!columnsConfig.length) return [];

    return [
      columnHelper.accessor(columnsConfig[0].accessorKey, {
        id: columnsConfig[0].id?.toString(),
        header: () => columnsConfig[0].header,
        cell: (info) => (
          <div className="h-full flex items-center">
            {formatFieldValue(
              info.getValue(),
              columnsConfig[0],
              info.row.original
            )}
          </div>
        ),
      }),
      ...columnsConfig.slice(1).map((field) =>
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
  }, [columnsConfig, permissions]);

  return columns;
};

export default useColumnHelper;
