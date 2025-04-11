
import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatFieldValue } from "../utils";
import { AirtableViewProps } from "./types";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { GripVertical, MoveVertical } from "lucide-react";

const KanbanView = ({
  records,
  table,
  isLoading,
  onRowClick,
  onUpdate,
  emptyMessage = "No records available",
}: AirtableViewProps) => {
  // Find fields that could be used for kanban categories (single select or status fields)
  const selectFields = useMemo(() => {
    return table.fields.filter(
      (field) => field.type === "singleSelect" || field.type === "status"
    );
  }, [table.fields]);

  const [selectedField, setSelectedField] = useState<string | null>(
    selectFields.length > 0 ? selectFields[0].name : null
  );

  // State for drag and drop
  const [draggedRecord, setDraggedRecord] = useState<string | null>(null);
  const [draggedOver, setDraggedOver] = useState<string | null>(null);

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
    fieldOptions?.choices?.forEach((option) => {
      groups[option.name || option.value] = [];
    });

    // Add an "Uncategorized" group
    groups["Uncategorized"] = [];

    // Categorize records
    records.forEach((record) => {
      const value = record.fields[selectedField];

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

  const handleDragStart = (recordId: string) => {
    setDraggedRecord(recordId);
  };

  const handleDragOver = (e: React.DragEvent, columnName: string) => {
    e.preventDefault();
    setDraggedOver(columnName);
  };

  const handleDragLeave = () => {
    setDraggedOver(null);
  };

  const handleDrop = async (e: React.DragEvent, targetColumnName: string) => {
    e.preventDefault();
    if (!draggedRecord || !selectedField || !onUpdate) {
      setDraggedOver(null);
      setDraggedRecord(null);
      return;
    }

    // Find the record that was dragged
    const recordToUpdate = records.find((record) => record.id === draggedRecord);
    if (!recordToUpdate) {
      setDraggedOver(null);
      setDraggedRecord(null);
      return;
    }

    // Create a copy of the record with the updated field value
    const updatedRecord = {
      ...recordToUpdate,
      fields: {
        ...recordToUpdate.fields,
        [selectedField]: targetColumnName === "Uncategorized" ? null : targetColumnName,
      },
    };

    // Update the record
    try {
      await onUpdate(updatedRecord);
    } catch (error) {
      console.error("Error updating record:", error);
    }

    // Reset drag state
    setDraggedOver(null);
    setDraggedRecord(null);
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
              (opt) => (opt.name || opt.value) === group
            );
            if (option && option.color) {
              groupColor = `bg-${option.color.toLowerCase()}-100`;
            }
          }

          const isColumnDraggedOver = draggedOver === group;

          return (
            <div 
              key={group} 
              className="flex-shrink-0 w-80"
              onDragOver={(e) => handleDragOver(e, group)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, group)}
            >
              <Card 
                className={`${isColumnDraggedOver ? 'ring-2 ring-primary' : ''} transition-all duration-200`}
              >
                <CardHeader className={`${groupColor} py-3`}>
                  <div className="flex justify-between items-center">
                    <CardTitle className="text-md font-medium">
                      {group}
                    </CardTitle>
                    <Badge variant="secondary">{groupRecords.length}</Badge>
                  </div>
                </CardHeader>
                <CardContent 
                  className={`p-2 max-h-[70vh] overflow-y-auto ${isColumnDraggedOver ? 'bg-muted/30' : ''}`}
                >
                  {groupRecords.map((record) => (
                    <div
                      key={record.id}
                      className={`p-3 mb-2 bg-background border rounded-md cursor-move hover:shadow-sm transition-shadow relative ${
                        draggedRecord === record.id ? "opacity-50" : ""
                      }`}
                      draggable
                      onDragStart={() => handleDragStart(record.id)}
                      onClick={(e) => {
                        // Only trigger row click if it's not a drag operation
                        if (e.target === e.currentTarget) {
                          onRowClick(record);
                        }
                      }}
                    >
                      <div className="absolute left-1 top-1/2 -translate-y-1/2 opacity-30 hover:opacity-70 text-muted-foreground">
                        <GripVertical size={16} />
                      </div>
                      <div className="font-medium truncate pl-5">
                        {primaryField
                          ? formatFieldValue(
                              record.fields[primaryField.name],
                              primaryField
                            )
                          : record.id}
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
                            const value = record.fields[field.name];
                            if (value === undefined || value === null)
                              return null;

                            return (
                              <div key={field.id} className="truncate">
                                {field.name}:{" "}
                                {formatFieldValue(value, field, true)}
                              </div>
                            );
                          })}
                      </div>
                    </div>
                  ))}
                  {groupRecords.length === 0 && (
                    <div className="py-4 text-center text-muted-foreground text-sm">
                      Drop items here
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default KanbanView;
