import { Database } from "@/integrations/supabase/types";
import { supabase } from "@/integrations/supabase/client";
import { isUUID } from "@/utils/idHelpers";
import { SelectOption } from "@/types/customTable";

export type IDataViewRow = Database["public"]["Tables"]["data_views"]["Row"];
export type DataViewCreate =
  Database["public"]["Tables"]["data_views"]["Insert"];
export type DataViewUpdate =
  Database["public"]["Tables"]["data_views"]["Update"];

export enum ViewType {
  Grid = "grid",
  Calendar = "calendar",
  Gallery = "gallery",
  Kanban = "kanban",
  Timeline = "timeline",
}

export type IDataView = IDataViewRow & {
  view_type: ViewType;
  config: {
    dateFields?: {
      startDate: string;
      endDate: string;
    };
    fields?: string[];
    groupByField?: string;
    sortByField?: string;
    sortDirection?: "asc" | "desc";
    eventLabelField?: SelectOption[];
    visibleAttributes?: SelectOption[];
    calendarViews?: {
      [key: string]: {
        label: string;
        value: string;
      };
    };
  };
};

export const DATA_VIEWS_TABLE_NAME = "data_views";

export const DataViewsService = {
  async getDataViewsByTableId(table_id: string) {
    const { data, error } = await supabase
      .from(DATA_VIEWS_TABLE_NAME)
      .select("*")
      .eq(isUUID(table_id) ? "data_table_id" : "external_table_id", table_id);

    if (error) {
      throw new Error("Failed to fetch workflows");
    }

    return data;
  },
  async getByDataNavigationItemId(data_navigation_item_id: string) {
    const { data, error } = await supabase
      .from(DATA_VIEWS_TABLE_NAME)
      .select("*")
      .eq("data_navigation_item_id", data_navigation_item_id);

    if (error) {
      throw new Error("Failed to fetch data view");
    }

    return data;
  },
  async getById(id: string) {
    const { data, error } = await supabase
      .from(DATA_VIEWS_TABLE_NAME)
      .select("*")
      .eq(isUUID(id) ? "id" : "alias", id)
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
  async delete(dataView: IDataView) {
    const { error } = await supabase
      .from(DATA_VIEWS_TABLE_NAME)
      .delete()
      .eq("id", dataView.id);

    if (error) {
      throw new Error("Failed to delete data view");
    }
  },
};
