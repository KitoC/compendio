import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatFieldValue } from "../utils";
import { CustomTableViewProps } from "./types";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { GripVertical } from "lucide-react";
import {
  DragDropContext,
  Droppable,
  Draggable,
  DropResult,
} from "react-beautiful-dnd";
import { useDataViewContext } from "@/contexts/DataViewProvider";

const KanbanView = ({
  table,
  emptyMessage = "No records available",
}: CustomTableViewProps) => {
  const {
    data: records,
    isLoadingData,
    onEdit,
    onCreate,
    updateRecord,
  } = useDataViewContext();
  // Find fields that could be used for kanban categories (single select or status fields)
  const selectFields = useMemo(() => {
    return table.fields.filter(
      (field) => field.type === "singleSelect" || field.type === "status"
    );
  }, [table.fields]);

  const [selectedField, setSelectedField] = useState<string | null>(
    selectFields.length > 0 ? selectFields[0].name : null
  );

  // Get the primary field for the table
  const primaryField = useMemo(() => {
    if (table && table.primaryFieldId) {
      return table.fields.find((field) => field.id === table.primaryFieldId);
    }
    return table.fields[0];
  }, [table]);

  // Get options for the selected field
  const fieldOptions = useMemo(() => {
    if (!selectedField) return [];

    const field = table.fields.find((f) => f.name === selectedField);

    if (!field || !field.options) return [];

    return field.options;
  }, [selectedField, table.fields]);

  // Group records by the selected field
  const groupedRecords = useMemo(() => {
    if (!selectedField) {
      return { Uncategorized: records };
    }

    const groups: Record<string, typeof records> = {};

    // Initialize groups with all possible values from the field options
    fieldOptions?.forEach((option) => {
      groups[option.name || option.id] = [];
    });

    // Add an "Uncategorized" group
    groups["Uncategorized"] = [];

    // Categorize records
    records.forEach((record) => {
      const value = record[selectedField];

      if (value === undefined || value === null || value === "") {
        groups["Uncategorized"].push(record);
      } else if (typeof value === "object" && "name" in value) {
        const groupName = value.name || "Uncategorized";
        if (!groups[groupName]) groups[groupName] = [];
        groups[groupName].push(record);
      } else {
        const groupName = String(value);
        if (!groups[groupName]) groups[groupName] = [];
        groups[groupName].push(record);
      }
    });

    return groups;
  }, [records, selectedField, fieldOptions]);

  const handleDragEnd = async (result: DropResult) => {
    const { source, destination } = result;

    // If dropped outside a droppable area
    if (!destination) return;

    // If dropped in the same column and position
    if (
      source.droppableId === destination.droppableId &&
      source.index === destination.index
    ) {
      return;
    }

    // Get the record ID from the draggable ID
    const recordId = result.draggableId;
    const sourceGroup = source.droppableId;
    const destinationGroup = destination.droppableId;

    // If dropped in a different column, update the record with the new status/value
    if (sourceGroup !== destinationGroup && updateRecord) {
      // Find the record that was dragged
      const recordToUpdate = records.find((record) => record.id === recordId);
      if (!recordToUpdate) return;

      // Create a copy of the record with the updated field value
      const updatedRecord = {
        ...recordToUpdate,
        fields: {
          ...recordToUpdate,
          [selectedField as string]:
            destinationGroup === "Uncategorized" ? null : destinationGroup,
        },
      };

      // Update the record
      try {
        await updateRecord(updatedRecord);
      } catch (error) {
        console.error("Error updating record:", error);
      }
    }
  };

  if (selectFields.length === 0) {
    return (
      <div className="p-8 text-center">
        <p className="text-muted-foreground">
          Kanban view requires single select or status fields in your table.
        </p>
      </div>
    );
  }

  if (records.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 border rounded-md">
        <p className="text-muted-foreground">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="w-full max-w-xs">
        <Select value={selectedField || ""} onValueChange={setSelectedField}>
          <SelectTrigger>
            <SelectValue placeholder="Select a field for columns" />
          </SelectTrigger>
          <SelectContent>
            {selectFields.map((field) => (
              <SelectItem key={field.id} value={field.name}>
                {field.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="flex gap-4 overflow-x-auto pb-4">
          {Object.entries(groupedRecords).map(([group, groupRecords]) => {
            if (groupRecords.length === 0) return null;

            const fieldForColor = table.fields.find(
              (f) => f.name === selectedField
            );

            let groupColor = "bg-muted";

            // Try to find matching option color
            if (fieldForColor && fieldForColor.options) {
              const option = fieldForColor.options.choices.find(
                (opt) => (opt.name || opt.id) === group
              );
              if (option && option.color) {
                groupColor = `bg-${option.color.toLowerCase()}-100`;
              }
            }

            return (
              <div key={group} className="flex-shrink-0 w-80">
                <Card>
                  <CardHeader className={`${groupColor} py-3`}>
                    <div className="flex justify-between items-center">
                      <CardTitle className="text-md font-medium">
                        {group}
                      </CardTitle>
                      <Badge variant="secondary">{groupRecords.length}</Badge>
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
                          <Draggable
                            key={record.id}
                            draggableId={record.id}
                            index={index}
                          >
                            {(provided, snapshot) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                className={`p-3 mb-2 bg-background border rounded-md cursor-move hover:shadow-sm transition-shadow relative ${
                                  snapshot.isDragging ? "shadow-md" : ""
                                }`}
                                onClick={() => onEdit(record)}
                                style={provided.draggableProps.style}
                              >
                                <div
                                  className="absolute left-1 top-1/2 -translate-y-1/2 opacity-30 hover:opacity-70 text-muted-foreground"
                                  {...provided.dragHandleProps}
                                >
                                  <GripVertical size={16} />
                                </div>
                                <div className="font-medium truncate pl-5">
                                  {primaryField
                                    ? formatFieldValue(
                                        record[primaryField.name],
                                        primaryField,
                                        record
                                      )
                                    : record._id}
                                </div>
                                <div className="text-sm text-muted-foreground mt-1 pl-5">
                                  {/* Show 1-2 fields as details */}
                                  {table.fields
                                    .filter(
                                      (f) =>
                                        f.id !== primaryField?.id &&
                                        f.name !== selectedField
                                    )
                                    .slice(0, 2)
                                    .map((field) => {
                                      const value = record[field.name];
                                      if (value === undefined || value === null)
                                        return null;

                                      return (
                                        <div
                                          key={field.id}
                                          className="truncate"
                                        >
                                          {field.name}:{" "}
                                          {formatFieldValue(
                                            value,
                                            field,
                                            record
                                          )}
                                        </div>
                                      );
                                    })}
                                </div>
                              </div>
                            )}
                          </Draggable>
                        ))}
                        {provided.placeholder}
                        {groupRecords.length === 0 && (
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
          })}
        </div>
      </DragDropContext>
    </div>
  );
};

export default KanbanView;
