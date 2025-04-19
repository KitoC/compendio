import { useMemo } from "react";
import { CustomTablesContext } from "./CustomTablesContext";
import { useTenant } from "@/contexts/TenantContext";
import { CustomTableService } from "@/services/CustomTableService";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import Loader from "@/components/ui/loader";
import { CustomTable } from "./CustomTablesContext";

const QUERY_KEYS = {
  SYNC_SCHEMA: "sync-data-tables-schema",
  DATA_TABLE_SCHEMA: "data-tables-schema",
};

const useSyncSchemaQuery = () => {
  const { tenantId } = useTenant();
  const queryClient = useQueryClient();

  return useQuery({
    queryKey: [QUERY_KEYS.SYNC_SCHEMA, tenantId],
    queryFn: async () => {
      await CustomTableService.syncSchema();
      const schema = await CustomTableService.getSchema();

      queryClient.setQueryData([QUERY_KEYS.DATA_TABLE_SCHEMA, tenantId], () => {
        return schema;
      });

      return schema as CustomTable[];
    },
    enabled: !!tenantId,
  });
};

const useDataTableSchemaQuery = () => {
  const { tenantId } = useTenant();

  return useQuery({
    queryKey: [QUERY_KEYS.DATA_TABLE_SCHEMA, tenantId],
    queryFn: async () => {
      const schema = await CustomTableService.getSchema();

      return schema;
    },
    enabled: !!tenantId,
  });
};

export const CustomTablesProvider: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {
  useSyncSchemaQuery();
  const { data: tables, isLoading } = useDataTableSchemaQuery();

  const value = useMemo(
    () => ({
      tables: tables?.sort((a, b) => a.name.localeCompare(b.name)),
    }),
    [tables]
  );

  return (
    <CustomTablesContext.Provider value={value}>
      {isLoading ? (
        <div className="flex items-center justify-center h-screen">
          <Loader size="large" />
        </div>
      ) : (
        children
      )}
    </CustomTablesContext.Provider>
  );
};
