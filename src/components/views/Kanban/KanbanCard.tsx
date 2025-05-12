import { Draggable } from "react-beautiful-dnd";
import { GripVertical } from "lucide-react";
import { KanbanCardProps, KanbanCard as KanbanCardType } from "./types";

export function KanbanCard<T extends KanbanCardType>({
  card,
  index,
  onCardClick,
  titleField,
  descriptionField,
}: KanbanCardProps<T>) {
  return (
    <Draggable draggableId={card.id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          className={`p-3 mb-2 bg-background border border-l-4 border-l-gray-200 rounded-md cursor-move hover:shadow-sm transition-shadow relative ${
            snapshot.isDragging ? "shadow-md" : ""
          }`}
          onClick={() => onCardClick?.(card)}
          style={provided.draggableProps.style}
        >
          <div className="absolute left-1 top-1/2 -translate-y-1/2 opacity-30 hover:opacity-70 text-muted-foreground">
            <GripVertical size={16} />
          </div>
          <div className="font-medium truncate pl-5">
            {String(card[titleField])}
          </div>
          {descriptionField && card[descriptionField] && (
            <div className="text-sm text-muted-foreground mt-2 pl-5">
              {String(card[descriptionField])}
            </div>
          )}
        </div>
      )}
    </Draggable>
  );
}

export default KanbanCard;
