import { useMemo } from "react";

import { CustomTableViewProps } from "../types";

import { DragDropContext, DropResult } from "react-beautiful-dnd";
import { useDataViewContext } from "@/contexts/DataViewProvider";
import KanbanColumn from "./KanbanColumn";

const KanbanView = ({
  emptyMessage = "No records available",
}: CustomTableViewProps) => {
  const {
    data: records,
    onEdit,
    updateRecord,
    table,
    dataView,
    onEditDataView,
    isLoadingData,
  } = useDataViewContext();

  const groupByField = table.fields.find(
    (f) => f.id === dataView.config.groupByField
  );

  // Get the primary field for the table
  const primaryField = useMemo(() => {
    if (table && table.primary_field_id) {
      return table.fields.find((field) => field.id === table.primary_field_id);
    }
    return table.fields[0];
  }, [table]);

  // Get options for the selected field
  const fieldOptions = groupByField?.options;

  // Group records by the selected field
  const groupedRecords = useMemo(() => {
    if (!groupByField) {
      return { Uncategorized: records };
    }

    const groups: Record<string, typeof records> = {};

    // Initialize groups with all possible values from the field options
    fieldOptions?.forEach((option) => {
      groups[option.label || option.value] = [];
    });

    // Add an "Uncategorized" group
    groups["Uncategorized"] = [];

    // Categorize records
    records.forEach((record) => {
      const value = record[groupByField.name];

      if (value === undefined || value === null || value === "") {
        groups["Uncategorized"].push(record);
      } else if (typeof value === "object" && "label" in value) {
        const groupName = (value.label as string) || "Uncategorized";

        if (!groups[groupName]) groups[groupName] = [];

        groups[groupName].push(record);
      } else {
        const fieldOption = fieldOptions?.find(
          (f) => f.label === value || f.value === value
        );
        const groupName = (fieldOption?.label as string) || "Uncategorized";

        if (!groups[groupName]) groups[groupName] = [];

        groups[groupName].push(record);
      }
    });

    return groups;
  }, [records, groupByField, fieldOptions]);

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
      const recordToUpdate = records.find((record) => record._id === recordId);
      if (!recordToUpdate) return;

      const fieldOption = fieldOptions?.find(
        (f) => f.label === destinationGroup || f.value === destinationGroup
      );

      // Create a copy of the record with the updated field value
      const updatedRecord = {
        ...recordToUpdate,
        [groupByField.name]:
          destinationGroup === "Uncategorized" ? null : fieldOption?.value,
      };

      // Update the record
      try {
        await updateRecord({
          record: updatedRecord,
          options: { optimistic: true },
        });
      } catch (error) {
        console.error("Error updating record:", error);
      }
    }
  };

  const { Uncategorized, ...rest } = groupedRecords;

  return (
    <div className="flex flex-col gap-4 p-1">
      <DragDropContext
        onDragStart={() => console.log("drag start")}
        onDragEnd={handleDragEnd}
      >
        <div className="flex gap-4 overflow-x-auto pb-4">
          <KanbanColumn
            group={"Uncategorized"}
            groupRecords={Uncategorized}
            table={table}
            groupByField={groupByField}
            primaryField={primaryField}
            onEdit={onEdit}
            isLoading={isLoadingData}
          />
          {Object.entries(rest).map(([group, groupRecords]) => {
            return (
              <KanbanColumn
                key={group}
                group={group}
                groupRecords={groupRecords}
                table={table}
                groupByField={groupByField}
                primaryField={primaryField}
                onEdit={onEdit}
                isLoading={isLoadingData}
              />
            );
          })}
        </div>
      </DragDropContext>
    </div>
  );
};

export default KanbanView;
