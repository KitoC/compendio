import { createContext } from "react";
import { Database } from "@/integrations/supabase/types";

export type ICustomTable = Database["public"]["Tables"]["data_tables"]["Row"];

export interface CustomTablesContextType {
  tables: ICustomTable[];
}

export const CustomTablesContext = createContext<
  CustomTablesContextType | undefined
>(undefined);
