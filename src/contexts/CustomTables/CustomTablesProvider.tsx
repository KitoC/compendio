import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState, useCallback, useMemo } from "react";
import { useParams } from "react-router-dom";
import { CustomTablesContext, ICustomTable } from "./CustomTablesContext";
import { useTenant } from "@/contexts/TenantContext";

export const CustomTablesProvider: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {
  const [customTables, setCustomTables] = useState<ICustomTable[]>([]);
  const params = useParams();
  const { tenantId } = useTenant();

  const fetchCustomTables = useCallback(async () => {
    if (!tenantId) {
      return;
    }

    const { data, error } = await supabase
      .from("custom_table_definitions")
      .select("*")
      .eq("tenant_id", tenantId);

    console.log("data", data);
    console.log("error", error);

    setCustomTables(data);
  }, [tenantId]);

  useEffect(() => {
    fetchCustomTables();
  }, [fetchCustomTables]);

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
