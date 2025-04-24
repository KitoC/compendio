import { Button } from "../ui/button";
import {
  CalendarIcon,
  LayoutGrid,
  Kanban,
  GanttChart,
  Table,
} from "lucide-react";
import { ViewType } from "./views/types";

interface ViewTypeSelectorProps {
  viewType: ViewType;
  setViewType: (viewType: ViewType) => void;
}

const viewTypes: { value: ViewType; Icon: React.ElementType }[] = [
  { value: "grid", Icon: Table },
  // { value: "calendar", Icon: CalendarIcon },
  // { value: "gallery", Icon: LayoutGrid },
  // { value: "kanban", Icon: Kanban },
  // { value: "timeline", Icon: GanttChart },
];

const ViewTypeSelector = ({ viewType, setViewType }: ViewTypeSelectorProps) => {
  if (viewTypes.length <= 1) return null;

  return (
    <div className="flex gap-2">
      {viewTypes.map((type) => (
        <Button
          key={type.value}
          variant={type.value === viewType ? "default" : "outline"}
          size="icon"
          onClick={() => setViewType(type.value)}
          className="h-8 w-8"
          title={type.value}
        >
          <type.Icon className="h-3 w-3" />
        </Button>
      ))}
    </div>
  );
};

export default ViewTypeSelector;
