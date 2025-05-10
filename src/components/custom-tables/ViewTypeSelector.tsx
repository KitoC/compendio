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
} from "@/hooks/DataViews";
import { DEFAULT_VIEW } from "./consts";
import { IDataView } from "@/services/DataViewsService";
import { useState } from "react";
import DataViewModal from "@/components/DataViewModal";
import { useNavigate } from "react-router-dom";
import { ROUTES } from "@/lib/constants";
import { kebabCase } from "lodash";

interface ViewTypeSelectorProps {
  tableId: string;
  currentDataViewId: string;
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
  currentDataViewId,
  setViewType,
  tableId,
}: ViewTypeSelectorProps) => {
  const { dataViews } = useDataViewsQuery(tableId);
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  const dataViewsWithDefault = [DEFAULT_VIEW, ...dataViews];
  const { mutateAsync: deleteDataView } = useDeleteDataViewMutation();

  return (
    <div className="flex gap-2 -mb-2">
      <Tabs
        value={currentDataViewId}
        onValueChange={(value) => {
          if (value !== "new") {
            const viewType = dataViewsWithDefault.find(
              (view) => view.id === value
            )!;

            setViewType(viewType);

            if (value !== DEFAULT_VIEW.id) {
              navigate(
                ROUTES.DATA_NAVIGATION_VIEW.replace(
                  ":dataViewId",
                  kebabCase(viewType.label)
                )
              );
            } else {
              navigate("");
            }
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
                            await deleteDataView(type);
                            setViewType(DEFAULT_VIEW);
                            navigate("");
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
        order={dataViewsWithDefault.length}
        onSuccess={(newView) => {
          setOpen(false);
          setViewType(newView);
        }}
      />
    </div>
  );
};

export default ViewTypeSelector;
