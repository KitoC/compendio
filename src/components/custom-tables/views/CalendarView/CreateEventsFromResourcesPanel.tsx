import { useMemo, useCallback, useState } from "react";
import { useDataViewContext } from "@/contexts/DataViewProvider";
import CreateEventsFromResource from "./CreateEventsFromResource";
const CreateEventsFromResourcesPanel = () => {
  const { dataView } = useDataViewContext();
  console.log("dataView.config.createEventsFromTable", dataView.config);

  return (
    <div className="flex flex-col gap-2 min-w-[350px] rounded-md border-r rounded-r-none">
      {[dataView.config.createEventsFromTable]?.map((tableId) => (
        <CreateEventsFromResource key={tableId} tableId={tableId} />
      ))}
    </div>
  );
};

export default CreateEventsFromResourcesPanel;
