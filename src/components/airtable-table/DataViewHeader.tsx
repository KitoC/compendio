import { CardDescription } from "../ui/card";

import { useDataViewContext } from "@/contexts/DataViewProvider";
import { CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import ViewTypeSelector from "./ViewTypeSelector";
import { Plus } from "lucide-react";
import { RefreshCw } from "lucide-react";
import { UserPermissions } from "./types";
import { cn } from "@/lib/utils";
import { IDataView } from "@/services/DataViewsService";
import pluralize from "pluralize";

interface DataViewHeaderProps {
  setDataView: (dataView: IDataView) => void;
  permissions: UserPermissions;
}

const DataViewHeader = ({ setDataView, permissions }: DataViewHeaderProps) => {
  const { table, dataView, onRefetch, isRefetching, onCreate } =
    useDataViewContext();

  return (
    <div className="flex flex-col mb-2">
      <div className="flex space-x-2 justify-between w-full border-b border-border pb-2">
        <div className="flex items-end gap-4">
          <CardTitle>{table.name}</CardTitle>

          <ViewTypeSelector
            currentDataView={dataView}
            setViewType={setDataView}
            tableId={table.external_id}
          />
        </div>
        <div className="flex space-x-2 items-end">
          {onRefetch && (
            <Button
              size="xs"
              variant="outline"
              onClick={onRefetch}
              disabled={isRefetching}
            >
              <RefreshCw
                className={cn("h-3 w-3", {
                  "animate-spin": isRefetching,
                })}
              />
              Refresh
            </Button>
          )}

          {permissions.create && (
            <Button size="xs" onClick={() => onCreate()}>
              <Plus className="h-3 w-3" />
              New {pluralize.singular(table.name)}
            </Button>
          )}
        </div>
      </div>
      {table.description && (
        <CardDescription>{table.description}</CardDescription>
      )}
    </div>
  );
};

export default DataViewHeader;
