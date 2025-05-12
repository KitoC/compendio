import { useMemo } from "react";
import { DragDropContext, DropResult } from "react-beautiful-dnd";
import { KanbanViewProps, KanbanCard as KanbanCardType } from "./types";
import KanbanColumn from "./KanbanColumn";

export function KanbanView<T extends KanbanCardType>({
  data,
  count,
  isLoading,
  isFetching,
  query,
  setQuery,
  groups,
  groupKey,
  titleField,
  descriptionField,
  onCardClick,
  onCardMove,
  emptyMessage = "No records available",
  permissions,
}: KanbanViewProps<T>) {
  // Group records by the selected field
  const groupedRecords = useMemo(() => {
    const groupsMap: Record<string, T[]> = {};

    // Initialize groups with all possible values from the groups
    groups.forEach((group) => {
      groupsMap[group.fieldKey] = [];
    });

    // Add an "Uncategorized" group
    groupsMap["uncategorized"] = [];

    // Categorize records
    data.forEach((record) => {
      const value = record[groupKey];

      if (value === undefined || value === null || value === "") {
        groupsMap["uncategorized"].push(record);
      } else {
        const group = groups.find((g) => g.fieldKey === value);
        const groupName = group?.fieldKey || "uncategorized";

        if (!groupsMap[groupName]) groupsMap[groupName] = [];

        groupsMap[groupName].push(record);
      }
    });

    return groupsMap;
  }, [data, groups, groupKey]);

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
    if (sourceGroup !== destinationGroup && onCardMove) {
      // Find the record that was dragged
      const recordToUpdate = data.find((record) => record.id === recordId);
      if (!recordToUpdate) return;

      try {
        await onCardMove(recordToUpdate, sourceGroup, destinationGroup);
      } catch (error) {
        console.error("Error updating record:", error);
      }
    }
  };

  const { uncategorized, ...rest } = groupedRecords;

  return (
    <div className="flex flex-col gap-4 p-1">
      <DragDropContext
        onDragStart={() => console.log("drag start")}
        onDragEnd={handleDragEnd}
      >
        <div className="flex gap-4 overflow-x-auto pb-4">
          <KanbanColumn
            group={{
              label: "Uncategorized",
              color: "gray",
              fieldKey: "uncategorized",
            }}
            cards={uncategorized}
            isLoading={isLoading}
            onCardClick={onCardClick}
            titleField={titleField}
            descriptionField={descriptionField}
          />
          {Object.entries(rest).map(([groupId, groupCards]) => {
            const group = groups.find((g) => g.fieldKey === groupId);
            if (!group) return null;

            return (
              <KanbanColumn
                key={groupId}
                group={group}
                cards={groupCards}
                isLoading={isLoading}
                onCardClick={onCardClick}
                titleField={titleField}
                descriptionField={descriptionField}
              />
            );
          })}
        </div>
      </DragDropContext>
    </div>
  );
}

export default KanbanView;
