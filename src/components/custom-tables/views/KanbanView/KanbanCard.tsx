import { Draggable } from "react-beautiful-dnd";
import { Badge, GripVertical } from "lucide-react";
import { formatFieldValue } from "../../utils";
import {
  CustomTableField,
  CustomTableRecord,
  CustomTableSchema,
} from "@/types/customTable";
import SingleSelectRenderer from "../../../field-renderers/SingleSelectRenderer";
import { getCustomTableColor } from "@/utils/customTableHelpers";
import { useDataViewContext } from "@/contexts/DataViewProvider";

interface KanbanCardProps {
  record: CustomTableRecord;
  index: number;
  onEdit: (record: CustomTableRecord) => void;
  primaryField: CustomTableField;
  groupByField: CustomTableField;
  table: CustomTableSchema;
  group: string;
}

const KanbanCard = ({
  record,
  index,
  onEdit,
  primaryField,
  groupByField,
  table,
  group,
}: KanbanCardProps) => {
  const { dataView } = useDataViewContext();
  const { visibleAttributes = [] } = dataView?.config || {};

  const fieldOption = groupByField?.options?.find((o) => o.label === group);

  const groupColor = getCustomTableColor(fieldOption?.color || "gray");

  return (
    <Draggable key={record.ID} draggableId={record.ID} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          className={`p-3 mb-2 bg-background border border-l-4 ${`border-l-${groupColor.bgColor}`} rounded-md cursor-move hover:shadow-sm transition-shadow relative ${
            snapshot.isDragging ? "shadow-md" : ""
          }`}
          onClick={() => onEdit(record)}
          style={provided.draggableProps.style}
          {...provided.dragHandleProps}
        >
          <div className="absolute left-1 top-1/2 -translate-y-1/2 opacity-30 hover:opacity-70 text-muted-foreground">
            <GripVertical size={16} />
          </div>
          <div className="font-medium truncate pl-5 flex items-center">
            <span>
              {primaryField
                ? formatFieldValue(
                    record[primaryField.name],
                    primaryField,
                    record
                  )
                : record._id}
            </span>

            <span className="ml-auto">
              <SingleSelectRenderer
                value={record[groupByField.name] as string | number}
                field={groupByField}
              />
            </span>
          </div>
          <div className="flex flex-col mt-2 pl-5 gap-2">
            {/* Show 1-2 fields as details */}
            {visibleAttributes.map((attribute) => {
              const value = record[attribute.label];
              const field = table.fields.find(
                (f) => f.name === attribute.label
              );

              if (value === undefined || value === null) return null;

              return (
                <div key={field.id} className="flex">
                  <div className="truncate text-sm text-muted-foreground">
                    {formatFieldValue(value, field, record)}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </Draggable>
  );
};

export default KanbanCard;
