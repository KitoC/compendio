import { Database } from "@/integrations/supabase/types";
import { supabase } from "@/integrations/supabase/client";

export type IDataView = Database["public"]["Tables"]["data_views"]["Row"];
export type DataViewCreate =
  Database["public"]["Tables"]["data_views"]["Insert"];
export type DataViewUpdate =
  Database["public"]["Tables"]["data_views"]["Update"];

export const DATA_VIEWS_TABLE_NAME = "data_views";

export const DataViewsService = {
  async getDataViewsByTableId(table_id: string) {
    const { data, error } = await supabase
      .from(DATA_VIEWS_TABLE_NAME)
      .select("*")
      .eq(
        table_id.startsWith("tbl") ? "external_table_id" : "data_table_id",
        table_id
      );

    if (error) {
      throw new Error("Failed to fetch workflows");
    }

    return data;
  },
  async getById(id: string) {
    const { data, error } = await supabase
      .from(DATA_VIEWS_TABLE_NAME)
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      throw new Error("Failed to fetch data view");
    }

    return data;
  },

  async create(dataView: DataViewCreate) {
    const { data, error } = await supabase
      .from(DATA_VIEWS_TABLE_NAME)
      .insert(dataView)
      .select()
      .single();

    if (error) {
      throw new Error("Failed to create or update data view");
    }

    return data;
  },
  async update(dataView: DataViewUpdate) {
    const { data, error } = await supabase
      .from(DATA_VIEWS_TABLE_NAME)
      .update(dataView)
      .eq("id", dataView.id)
      .select()
      .single();

    if (error) {
      throw new Error("Failed to update data view");
    }

    return data;
  },
  async delete(id: string) {
    const { error } = await supabase
      .from(DATA_VIEWS_TABLE_NAME)
      .delete()
      .eq("id", id);
  },
};
