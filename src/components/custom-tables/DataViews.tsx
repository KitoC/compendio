import { useState, useCallback, useMemo } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

import { CustomTableProps, UserPermissions } from "./types";
import {
  GridView,
  CalendarView,
  GalleryView,
  KanbanView,
  TimelineView,
} from "./views";
import { DEFAULT_VIEW } from "./consts";
import { DataView, ViewType } from "@/services/DataViewsService";
import { DataViewProvider } from "@/contexts/DataViewProvider";
import DataViewHeader from "./DataViewHeader";

const defaultPermissions: UserPermissions = {
  create: true,
  read: true,
  update: true,
  delete: true,
  export: true,
};

const CustomTableViews = (props: CustomTableProps) => {
  const {
    table,
    permissions: providedPermissions,
    emptyMessage = "No records available",
    className,
  } = props;

  const [dataView, setDataView] = useState<DataView>(DEFAULT_VIEW);

  const permissions: UserPermissions = useMemo(() => {
    return {
      ...defaultPermissions,
      ...providedPermissions,
    };
  }, [providedPermissions]);

  const renderView = useCallback(() => {
    const commonProps = {
      table,
      emptyMessage,
      permissions,
      dataViewId: dataView.id,
    };

    switch (dataView.view_type) {
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
  }, [dataView, table, emptyMessage, permissions]);

  return (
    <DataViewProvider dataViewId={dataView.id} tableId={table.external_id}>
      <Card className={`${className} flex flex-col`}>
        <CardHeader>
          <DataViewHeader setDataView={setDataView} permissions={permissions} />
        </CardHeader>
        <CardContent className="flex-grow overflow-auto flex flex-col">
          <div className="flex-grow overflow-auto">{renderView()}</div>
        </CardContent>
      </Card>
    </DataViewProvider>
  );
};

export default CustomTableViews;
