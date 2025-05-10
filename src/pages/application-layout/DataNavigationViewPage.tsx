import DataViewV2 from "@/components/custom-tables/DataViewV2";
import { useParams, useOutletContext } from "react-router-dom";

interface DataNavigationPageParams extends Record<string, string> {
  id: string;
}

interface OutletContext {
  dataNavigationItemId: string;
  defaultDataViewId: string;
}

const DataNavigationViewPage = () => {
  const { dataNavigationItemId, defaultDataViewId } =
    useOutletContext<OutletContext>();

  const { dataViewAlias } = useParams<DataNavigationPageParams>();

  return (
    <DataViewV2
      dataNavigationItemId={dataNavigationItemId}
      dataViewId={dataViewAlias || defaultDataViewId}
    />
  );
};

export default DataNavigationViewPage;
