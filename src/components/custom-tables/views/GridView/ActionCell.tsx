import { Button } from "@/components/ui/button";
import {
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenu,
} from "@/components/ui/dropdown-menu";
import { UserPermissions } from "../../types";
import { useDataViewContext } from "@/contexts/DataViewProvider";
import type { CustomTableRecord } from "@/types/customTable";

interface ActionsCellProps {
  record: CustomTableRecord;
  permissions: UserPermissions;
}

function ActionsCell({ record, permissions }: ActionsCellProps) {
  const { onEdit, setRecordToDelete } = useDataViewContext();

  return (
    <div className="flex justify-end">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
            <span className="sr-only">Open menu</span>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-4 w-4"
            >
              <circle cx="12" cy="12" r="1" />
              <circle cx="19" cy="12" r="1" />
              <circle cx="5" cy="12" r="1" />
            </svg>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {permissions.update && (
            <DropdownMenuItem
              onClick={(e) => {
                e.stopPropagation();
                onEdit(record);
              }}
            >
              Edit
            </DropdownMenuItem>
          )}
          {permissions.delete && (
            <DropdownMenuItem
              className="text-destructive"
              onClick={(e) => {
                e.stopPropagation();
                setRecordToDelete(record);
              }}
            >
              Delete
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

export default ActionsCell;
