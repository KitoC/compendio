import {
  CalendarIcon,
  GanttChart,
  Kanban,
  LayoutGrid,
  Plus,
  Trash,
  Table,
} from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  useCreateOrUpdateDataViewMutation,
  useDeleteDataViewMutation,
} from "@/hooks/DataViews";
import { IDataView } from "@/services/DataViewsService";
import { useCallback, useMemo, useState } from "react";
import DataViewModal from "@/components/DataViewModal";
import { useNavigate } from "react-router-dom";
import { DataNavigationItem } from "@/services/DataNavigationItemsService";
import { useTenant } from "@/contexts/TenantContext";
import { paths } from "@/utils/pathHelpers";
import { useQueryClient } from "@tanstack/react-query";
import { DATA_NAVIGATION_ITEM_VIEWS_QUERY_KEY } from "@/hooks/DataViews/useDataNavigationItemViewsQuery";
import { toast } from "sonner";
interface ViewTypeSelectorProps {
  currentDataViewId: string;
  dataViews: IDataView[];
  dataNavigationItem: DataNavigationItem;
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

const ViewTypeSelectorV2 = ({
  currentDataViewId,
  dataViews,
  dataNavigationItem,
}: ViewTypeSelectorProps) => {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const { urlTenantAlias } = useTenant();
  const queryClient = useQueryClient();

  const { mutateAsync: deleteDataView } = useDeleteDataViewMutation();
  const { mutateAsync: updateDataView } = useCreateOrUpdateDataViewMutation();

  const navigateToView = useCallback(
    (dataView: IDataView) => {
      navigate(
        paths.getDataNavigationViewPath(
          dataView.alias,
          dataNavigationItem?.path,
          urlTenantAlias
        )
      );
    },
    [dataNavigationItem, navigate, urlTenantAlias]
  );

  const onCreateView = useCallback(
    (newView: IDataView) => {
      setOpen(false);
      navigateToView(newView);
      queryClient.invalidateQueries({
        queryKey: [
          DATA_NAVIGATION_ITEM_VIEWS_QUERY_KEY,
          dataNavigationItem?.id,
        ],
      });
    },
    [navigateToView, dataNavigationItem?.id, queryClient]
  );

  const dataViewTabs = useMemo(() => {
    return dataViews
      .sort((a, b) => (b.is_default ? 1 : -1))
      .map((view) => {
        const Icon = VIEW_TYPE_ICONS[view.view_type];

        return {
          id: view.id,
          label: view.label,
          Icon,
          actions: [
            {
              Icon: Trash,
              label: "Delete view",
              onClick: async () => {
                if (view.is_default) {
                  const newDefaultView = dataViews.find((v) => !v.is_default);

                  if (newDefaultView) {
                    await updateDataView({
                      ...newDefaultView,
                      is_default: true,
                    });
                  }
                }

                await deleteDataView(view);

                navigate("");
              },
              className: "text-red-500",
            },
          ],
        };
      });
  }, [dataViews, deleteDataView, navigate, updateDataView]);

  const onTabClick = useCallback(
    (value: string) => {
      if (value !== "new") {
        const dataView = dataViews.find((view) => view.id === value)!;

        navigateToView(dataView);
      }
    },
    [navigateToView, dataViews]
  );

  const onNewViewClick = useCallback(() => {
    setOpen(true);
  }, [setOpen]);

  return (
    <div className="flex gap-2 -mb-2">
      <Tabs value={currentDataViewId} onValueChange={onTabClick}>
        <TabsList className="bg-transparent gap-1">
          {dataViewTabs.map((tab) => {
            return (
              <TabsTrigger
                className={TRIGGER_CLASS}
                key={tab.id}
                value={tab.id}
                actions={tab.actions}
              >
                {tab.Icon && <tab.Icon className={ICON_CLASS + " mr-1"} />}
                {tab.label}
              </TabsTrigger>
            );
          })}
          <TabsTrigger
            className={TRIGGER_CLASS + " px-2"}
            value={"new"}
            onClick={onNewViewClick}
          >
            <Plus className={ICON_CLASS} />
          </TabsTrigger>
        </TabsList>
      </Tabs>

      <DataViewModal
        dataNavigationItemId={dataNavigationItem?.id}
        open={open}
        setOpen={setOpen}
        onSuccess={onCreateView}
        isDefault={dataViews.length === 0}
      />
    </div>
  );
};

export default ViewTypeSelectorV2;
