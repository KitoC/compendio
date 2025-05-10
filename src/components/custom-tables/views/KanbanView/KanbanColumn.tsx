import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Droppable } from "react-beautiful-dnd";
import {
  CustomTableField,
  CustomTableRecord,
  CustomTableSchema,
} from "@/types/customTable";
import KanbanCard from "./KanbanCard";
import { getCustomTableColor } from "@/utils/customTableHelpers";
import Loader from "@/components/ui/loader";
import { Loader2 } from "lucide-react";
import { range, random } from "lodash";
import { Skeleton } from "@/components/ui/skeleton";
interface KanbanColumnProps {
  group: string;
  groupRecords: CustomTableRecord[];
  table: CustomTableSchema;
  groupByField: CustomTableField;
  primaryField: CustomTableField;
  onEdit: (record: CustomTableRecord) => void;
  isLoading: boolean;
}

const SkeletonCard = () => {
  return (
    <div className="py-4 bg-muted/50 rounded-md flex flex-col gap-2 p-3 mb-2 bg-background border border-l-4 border-l-gray-200">
      <div className="flex justify-between items-center gap-2">
        <Skeleton className="w-1/4 h-4" />
        <Skeleton className="w-1/4 h-4" />
      </div>

      <Skeleton className="w-1/3 h-4" />
      <Skeleton className="w-1/4 h-4" />
      <Skeleton className="w-1/2 h-4" />
    </div>
  );
};

const KanbanColumn = ({
  group,
  groupRecords,
  table,
  groupByField,
  primaryField,
  onEdit,
  isLoading,
}: KanbanColumnProps) => {
  const fieldForColor = table.fields.find((f) => f.name === groupByField.name);
  const fieldOption = fieldForColor?.options?.find((o) => o.label === group);

  const groupColor = getCustomTableColor(fieldOption?.color || "dark-gray");

  return (
    <div key={group} className="flex-shrink-0 w-80">
      <Card>
        <CardHeader className={`py-3 rounded-t-md`}>
          <div className="flex justify-between items-center">
            <Badge variant="outline" className={groupColor.theme}>
              {group}
            </Badge>
            <Badge variant="outline">{groupRecords.length}</Badge>
          </div>
        </CardHeader>
        <Droppable droppableId={group}>
          {(provided, snapshot) => (
            <CardContent
              ref={provided.innerRef}
              {...provided.droppableProps}
              className={`p-2 max-h-[70vh] overflow-y-auto ${
                snapshot.isDraggingOver ? "bg-muted/30" : ""
              }`}
            >
              {groupRecords.map((record, index) => (
                <KanbanCard
                  key={record._id}
                  record={record}
                  index={index}
                  onEdit={onEdit}
                  primaryField={primaryField}
                  groupByField={groupByField}
                  table={table}
                  group={group}
                />
              ))}

              {provided.placeholder}

              {isLoading &&
                range(0, random(1, 3)).map((i) => <SkeletonCard key={i} />)}
              {!isLoading && groupRecords.length === 0 && (
                <div className="py-4 text-center text-muted-foreground text-sm">
                  Drop items here
                </div>
              )}
            </CardContent>
          )}
        </Droppable>
      </Card>
    </div>
  );
};

export default KanbanColumn;
