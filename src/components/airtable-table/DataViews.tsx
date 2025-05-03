import { useState, useCallback, useMemo } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

import { AirtableTableProps, UserPermissions } from "./types";
import {
  GridView,
  CalendarView,
  GalleryView,
  KanbanView,
  TimelineView,
} from "./views";
import { DEFAULT_VIEW } from "./consts";
import { IDataView } from "@/services/DataViewsService";
import { DataViewProvider } from "@/contexts/DataViewProvider";
import DataViewHeader from "./DataViewHeader";

const defaultPermissions: UserPermissions = {
  create: true,
  read: true,
  update: true,
  delete: true,
  export: true,
};

const AirtableViews = (props: AirtableTableProps) => {
  const {
    table,
    permissions: providedPermissions,
    emptyMessage = "No records available",
    className,
  } = props;

  const [dataView, setDataView] = useState<IDataView>(DEFAULT_VIEW);

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
      case "calendar":
        return <CalendarView {...commonProps} />;
      case "gallery":
        return <GalleryView {...commonProps} />;
      case "kanban":
        return <KanbanView {...commonProps} />;
      case "timeline":
        return <TimelineView {...commonProps} />;
      case "grid":
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

export default AirtableViews;
