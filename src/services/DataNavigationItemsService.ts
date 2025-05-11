import { supabase } from "@/integrations/supabase/client";
import { IconName } from "lucide-react/dynamic";

export type DataNavigationItem = {
  id?: string;
  name: string;
  path: string;
  icon: IconName;
  description: string;
  tenant_id: string;
};

export const DataNavigationItemsService = {
  getAll: async () => {
    const { data, error } = await supabase
      .from("data_navigation_items")
      .select("*");

    if (error) {
      throw new Error(error.message);
    }

    return data as DataNavigationItem[];
  },
  getByPath: async (path: string) => {
    const { data, error } = await supabase
      .from("data_navigation_items")
      .select("*")
      .eq("path", path)
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return data as DataNavigationItem;
  },
  createOrUpdate: async (payload: DataNavigationItem) => {
    const { data, error } = await supabase
      .from("data_navigation_items")
      .upsert(payload)
      .select()
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return data as DataNavigationItem;
  },
};
