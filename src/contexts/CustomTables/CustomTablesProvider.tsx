import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState, useCallback, useMemo } from "react";
import { useParams } from "react-router-dom";
import { CustomTablesContext, ICustomTable } from "./CustomTablesContext";

export const CustomTablesProvider: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {
  const [customTables, setCustomTables] = useState<ICustomTable[]>([]);
  const params = useParams();

  const fetchCustomTables = useCallback(async () => {
    const { data, error } = await supabase
      .from("custom_table_definitions")
      .select("*");

    setCustomTables(data);
  }, []);

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
