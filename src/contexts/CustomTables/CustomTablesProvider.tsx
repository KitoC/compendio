import { useEffect, useState, useCallback, useMemo, useRef } from "react";
import { useParams } from "react-router-dom";
import { CustomTablesContext, ICustomTable } from "./CustomTablesContext";
import { useTenant } from "@/contexts/TenantContext";
import { CustomTableService } from "@/services/CustomTableService";

export const CustomTablesProvider: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {
  const [customTables, setCustomTables] = useState<ICustomTable[]>([]);

  const { tenantId } = useTenant();
  const [syncing, setSyncing] = useState(false);
  const [syncingFailed, setSyncingFailed] = useState(false);

  // Tracks which tenantIds have already been synced
  const didSyncRef = useRef<Set<string>>(new Set());

  const fetchCustomTables = useCallback(async () => {
    if (!tenantId || syncing || didSyncRef.current.has(tenantId)) return;
    if (syncingFailed) return;

    setSyncing(true);

    try {
      await CustomTableService.syncSchema();
    } catch (err) {
      console.error("Failed to sync schema:", err);
      setSyncingFailed(true);
    } finally {
      setSyncing(false);

      didSyncRef.current.add(tenantId);
    }
  }, [tenantId, syncing, syncingFailed]);

  useEffect(() => {
    fetchCustomTables();
  }, [fetchCustomTables]);

  useEffect(() => {
    const fetchSchema = async () => {
      const schema = await CustomTableService.getSchema();

      setCustomTables(schema);
    };

    fetchSchema();
  }, []);

  const value = useMemo(
    () => ({
      tables: customTables,
    }),
    [customTables]
  );

  return (
    <CustomTablesContext.Provider value={value}>
      {children}
    </CustomTablesContext.Provider>
  );
};
