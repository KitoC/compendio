import { useParams, useLocation, Outlet } from "react-router-dom";
import { Skeleton } from "@/components/ui/skeleton";

import { useDataNavigationItemQuery } from "@/hooks/DataNavigationItems";
import ViewTypeSelectorV2 from "@/components/custom-tables/ViewTypeSelectorV2";
import { useDataNavigationItemViewsQuery } from "@/hooks/DataViews/useDataNavigationItemViewsQuery";
import { Button } from "@/components/ui/button";
import DataViewModal from "@/components/DataViewModal/DataViewModal";
import { useState } from "react";
import { Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useTenant } from "@/contexts/TenantContext";
import { paths } from "@/utils/pathHelpers";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";

interface DataNavigationPageParams extends Record<string, string> {
  id: string;
}

const DataNavigationPage = () => {
  const { dataNavigationPath } = useParams<DataNavigationPageParams>();
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const { urlTenantAlias } = useTenant();

  const {
    data: dataNavigationItem,
    isLoading,
    error,
  } = useDataNavigationItemQuery(dataNavigationPath);
  const location = useLocation();
  const { dataViews, isLoading: isLoadingDataViews } =
    useDataNavigationItemViewsQuery(dataNavigationItem?.id);

  const currentDataView = dataViews.find((dataView) => {
    const pathParts = location.pathname.split("/");
    const lastPart = pathParts[pathParts.length - 1];

    if (dataNavigationPath === lastPart) {
      return dataView.is_default;
    }

    return dataView.alias === lastPart;
  });

  if (
    error?.message === "JSON object requested, multiple (or no) rows returned"
  ) {
    return (
      <div className="flex flex-col justify-center items-center h-full p-8 gap-6">
        <Alert variant="destructive" className="w-1/2">
          <AlertTitle>Error: {error.message}</AlertTitle>
          <AlertDescription>
            This means that the data navigation item you are trying to access
            does not exist.
          </AlertDescription>
        </Alert>
        <p>Please contact support if you believe this is an error.</p>
      </div>
    );
  }
  if (isLoading || isLoadingDataViews) {
    return (
      <div className="flex flex-col h-full p-8 gap-6">
        <div className="flex items-center justify-between gap-2 border-b border-border pb-4">
          <Skeleton className="h-8 w-1/3 border border-border" />
          <Skeleton className="h-8 w-1/4 border border-border" />
        </div>
        <div className="flex-grow border border-border rounded-md">
          <Skeleton className="h-full w-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full p-8 gap-6 bg-card">
      <div className="flex flex-col mb-2 ">
        <div className="flex space-x-2 justify-between w-full border-b border-border pb-2">
          <div className="flex items-end gap-4">
            <h1>{dataNavigationItem.name}</h1>

            <ViewTypeSelectorV2
              dataViews={dataViews}
              currentDataViewId={currentDataView?.id}
              dataNavigationItem={dataNavigationItem}
            />
          </div>
          <div
            id="data-navigation-page-actions"
            className="flex space-x-2 items-end"
          />
        </div>
      </div>

      {!dataViews.length ? (
        <div className="flex flex-col justify-center items-center h-full p-8 gap-6">
          <h2 className="text-xl">No views found</h2>
          <Button
            size="xs"
            onClick={() => {
              setOpen(true);
            }}
          >
            <Plus className="h-3 w-3" />
            Create a view for this page
          </Button>

          <DataViewModal
            isDefault={!dataViews.length}
            dataNavigationItemId={dataNavigationItem?.id}
            open={open}
            setOpen={setOpen}
            order={dataViews.length}
            onSuccess={(newView) => {
              setOpen(false);

              navigate(
                paths.getDataNavigationViewPath(
                  newView.alias,
                  dataNavigationItem?.path,
                  urlTenantAlias
                )
              );
            }}
          />
        </div>
      ) : (
        <Outlet
          context={{
            dataNavigationItemId: dataNavigationItem?.id,
            defaultDataViewId: currentDataView?.id,
          }}
        />
      )}
    </div>
  );
};

export default DataNavigationPage;
