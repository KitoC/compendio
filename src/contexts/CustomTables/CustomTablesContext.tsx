import { createContext } from "react";
import { Database } from "@/integrations/supabase/types";
import { CustomTableSchema } from "@/types/customTable";

export type CustomTableField =
  Database["public"]["Tables"]["data_fields"]["Row"];

export type CustomTable = Database["public"]["Tables"]["data_tables"]["Row"] & {
  fields: CustomTableField[];
};
export interface CustomTablesContextType {
  tables: CustomTableSchema[];
}

export const CustomTablesContext = createContext<
  CustomTablesContextType | undefined
>(undefined);
