import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Droppable } from "react-beautiful-dnd";
import { KanbanColumnProps, KanbanCard as KanbanCardType } from "./types";
import KanbanCard from "./KanbanCard";
import { range, random } from "lodash";
import { Skeleton } from "@/components/ui/skeleton";

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

export function KanbanColumn<T extends KanbanCardType>({
  group,
  cards,
  isLoading,
  onCardClick,
  titleField,
  descriptionField,
}: KanbanColumnProps<T>) {
  return (
    <div className="flex-shrink-0 w-80">
      <Card>
        <CardHeader className="py-3 rounded-t-md">
          <div className="flex justify-between items-center">
            <Badge variant="outline" className={`bg-${group.color}/10`}>
              {group.label}
            </Badge>
            <Badge variant="outline">{cards.length}</Badge>
          </div>
        </CardHeader>
        <Droppable droppableId={group.fieldKey}>
          {(provided, snapshot) => (
            <CardContent
              ref={provided.innerRef}
              {...provided.droppableProps}
              className={`p-2 max-h-[70vh] overflow-y-auto ${
                snapshot.isDraggingOver ? "bg-muted/30" : ""
              }`}
            >
              {cards.map((card, index) => (
                <KanbanCard
                  key={card.id}
                  card={card}
                  index={index}
                  onCardClick={onCardClick}
                  titleField={titleField}
                  descriptionField={descriptionField}
                />
              ))}

              {provided.placeholder}

              {isLoading &&
                range(0, random(1, 3)).map((i) => <SkeletonCard key={i} />)}
              {!isLoading && cards.length === 0 && (
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
}

export default KanbanColumn;
