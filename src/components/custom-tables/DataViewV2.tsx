import { useCallback, useMemo } from "react";

import { UserPermissions } from "./types";
import {
  GridView,
  CalendarView,
  GalleryView,
  KanbanView,
  TimelineView,
} from "./views";
import { ViewType } from "@/services/DataViewsService";
import {
  DataViewProvider,
  useDataViewContext,
} from "@/contexts/DataViewProvider";

const defaultPermissions: UserPermissions = {
  create: true,
  read: true,
  update: true,
  delete: true,
  export: true,
};

interface DataViewV2Props {
  dataNavigationItemId: string;
  permissions?: UserPermissions;
  emptyMessage?: string;
  dataViewId: string;
}

const RenderDataView = (props: DataViewV2Props) => {
  const { dataViewId, permissions } = props;

  const { dataView } = useDataViewContext();

  const renderView = useCallback(() => {
    const commonProps = {
      permissions,
      dataViewId,
    };

    switch (dataView?.view_type) {
      case ViewType.Calendar:
        return <CalendarView {...commonProps} />;
      case ViewType.Gallery:
        return <GalleryView {...commonProps} />;
      case ViewType.Kanban:
        return <KanbanView {...commonProps} />;
      case ViewType.Timeline:
        return <TimelineView {...commonProps} />;
      case ViewType.Grid:
      default:
        return <GridView {...commonProps} />;
    }
  }, [dataViewId, permissions, dataView]);

  return (
    <div className="flex-grow overflow-auto flex flex-col">
      <div className="flex-grow overflow-auto">{renderView()}</div>
    </div>
  );
};

const DataViewV2 = (props: DataViewV2Props) => {
  const { permissions: providedPermissions, dataViewId } = props;

  const permissions: UserPermissions = useMemo(() => {
    return {
      ...defaultPermissions,
      ...providedPermissions,
    };
  }, [providedPermissions]);

  return (
    <DataViewProvider dataViewId={dataViewId}>
      <RenderDataView {...props} permissions={permissions} />
    </DataViewProvider>
  );
};

export default DataViewV2;
