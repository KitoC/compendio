import {
  CalendarIcon,
  GanttChart,
  Kanban,
  LayoutGrid,
  Pencil,
  Plus,
  Trash,
  Table,
} from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  useDataViewsQuery,
  useDeleteDataViewMutation,
} from "@/hooks/useDataViewsQuery";
import { DEFAULT_VIEW } from "./consts";
import { IDataView } from "@/services/DataViewsService";
import { useState } from "react";
import DataViewModal from "@/components/DataViewModal";
import { Button } from "../ui/button";

interface ViewTypeSelectorProps {
  tableId: string;
  currentDataView: IDataView;
  setViewType: (dataView: IDataView) => void;
}

const VIEW_TYPE_ICONS = {
  grid: Table,
  calendar: CalendarIcon,
  gallery: LayoutGrid,
  kanban: Kanban,
  timeline: GanttChart,
};

const TRIGGER_CLASS =
  "hover:bg-muted data-[state=active]:bg-sidebar data-[state=active]:text-foreground";
const ICON_CLASS = "h-4 w-4";

const ViewTypeSelector = ({
  currentDataView,
  setViewType,
  tableId,
}: ViewTypeSelectorProps) => {
  const { dataViews } = useDataViewsQuery(tableId);
  const [open, setOpen] = useState(false);

  const [dataViewId, setDataViewId] = useState<string | null>(null);

  const dataViewsWithDefault = [DEFAULT_VIEW, ...dataViews];
  const { mutateAsync: deleteDataView } = useDeleteDataViewMutation(tableId);

  return (
    <div className="flex gap-2 -mb-2">
      <Tabs
        value={currentDataView.id}
        onValueChange={(value) => {
          if (value !== "new") {
            setViewType(
              dataViewsWithDefault.find((view) => view.id === value)!
            );
          }
        }}
      >
        <TabsList className="bg-transparent gap-1">
          {dataViewsWithDefault.map((type) => {
            const Icon = VIEW_TYPE_ICONS[type.view_type];

            return (
              <TabsTrigger
                className={TRIGGER_CLASS}
                key={type.id}
                value={type.id}
                actions={
                  type.id !== DEFAULT_VIEW.id
                    ? [
                        {
                          Icon: Trash,
                          label: "Delete view",
                          onClick: async () => {
                            await deleteDataView(type.id);
                            setViewType(DEFAULT_VIEW);
                          },
                          className: "text-red-500",
                        },
                      ]
                    : undefined
                }
              >
                {Icon && <Icon className={ICON_CLASS + " mr-1"} />}
                {type.label}
              </TabsTrigger>
            );
          })}
          <TabsTrigger
            className={TRIGGER_CLASS + " px-2"}
            value={"new"}
            onClick={(e) => {
              e.preventDefault();
              setOpen(true);
            }}
          >
            <Plus className={ICON_CLASS} />
          </TabsTrigger>
        </TabsList>
      </Tabs>

      <DataViewModal
        open={open}
        setOpen={setOpen}
        tableId={tableId}
        dataViewId={dataViewId}
        key={dataViewId}
        onSuccess={(newView) => {
          setOpen(false);
          setViewType(newView);
        }}
      />
    </div>
  );
};

export default ViewTypeSelector;
