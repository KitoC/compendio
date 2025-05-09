import { useState, useCallback, useMemo, useEffect } from "react";
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
import { IDataView, ViewType } from "@/services/DataViewsService";
import { DataViewProvider } from "@/contexts/DataViewProvider";
import DataViewHeader from "./DataViewHeader";
import { useNavigate, useParams } from "react-router-dom";
import { useDataViewsQuery } from "@/hooks/useDataViewsQuery";
import { Skeleton } from "../ui/skeleton";
import { kebabCase } from "lodash";

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

  const [dataView, setDataView] = useState<IDataView>(DEFAULT_VIEW);
  const { dataViews, isLoading } = useDataViewsQuery(table.external_id);

  const { dataViewId = DEFAULT_VIEW.id } = useParams<{ dataViewId: string }>();
  const navigate = useNavigate();

  useEffect(() => {
    if (isLoading) return;

    const defaultView =
      dataViews.find((view) => view.is_default) || DEFAULT_VIEW;

    if (dataViewId) {
      const dataView = dataViews.find(
        (view) => kebabCase(view.label) === dataViewId
      );

      if (dataView) {
        setDataView(dataView);
      } else {
        navigate("");
        setDataView(defaultView);
      }
    } else {
      setDataView(defaultView);
    }
  }, [dataViewId, dataViews, isLoading, navigate]);

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
  }, [dataView, table, emptyMessage, permissions]);

  if (isLoading) {
    return (
      <div className="flex flex-col h-full p-8 gap-6">
        <div className="flex items-center justify-between gap-2 border-b border-border pb-4">
          <Skeleton className="h-8 w-1/3 border border-border" />
          <Skeleton className="h-8 w-1/4 border border-border" />
        </div>
      </div>
    );
  }

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
