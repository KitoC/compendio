import { SupabaseFunctionService } from "./supabaseFunctionServices";
import { supabase } from "@/integrations/supabase/client";
import type { CustomTableRecord } from "@/types/customTable";
import { isUUID } from "@/utils/idHelpers";

export const CustomTableService = {
  async syncSchema() {
    const response = await SupabaseFunctionService.post(
      "sync-table-schema",
      {}
    );

    if (!response.ok) {
      throw new Error("Failed to fetch schema");
    }

    return response.json();
  },

  async getSchema() {
    const response = await supabase
      .from("data_tables")
      .select("*, fields:data_fields(*)");

    return response.data.map((table) => ({
      ...table,
      primaryFieldId: table.primary_field_id,
      fields: table.fields.map((field) => field.schema),
    }));
  },

  async getTableSchema(tableId: string) {
    const response = await supabase
      .from("data_tables")
      .select("*, fields:data_fields(*)")
      .eq(isUUID(tableId) ? "id" : "external_id", tableId)
      .single();

    return response.data;
  },

  async listRecords(table: string, queryString = "") {
    const response = await SupabaseFunctionService.get(
      `table-records?table=${table}${queryString ? `&${queryString}` : ""}`
    );

    if (!response.ok) {
      throw new Error("Failed to fetch records");
    }

    return response.json();
  },

  async getRecord(table: string, recordId: string) {
    const response = await SupabaseFunctionService.get(
      `table-records?table=${table}&recordId=${recordId}`
    );

    if (!response.ok) {
      throw new Error("Failed to fetch record");
    }

    return response.json();
  },

  async createRecord(table: string, record: CustomTableRecord) {
    const response = await SupabaseFunctionService.post(
      `table-records?table=${table}`,
      record
    );

    if (!response.ok) {
      throw new Error("Failed to create record");
    }

    return response.json();
  },

  async updateRecord(
    table: string,
    recordId: string,
    record: CustomTableRecord
  ) {
    const response = await SupabaseFunctionService.patch(
      `table-records?table=${table}&recordId=${recordId}`,
      record
    );

    if (!response.ok) {
      throw new Error("Failed to update record");
    }

    return response.json();
  },

  async deleteRecord(table: string, recordId: string) {
    const response = await SupabaseFunctionService.delete(
      `table-records?table=${table}&recordId=${recordId}`
    );

    if (!response.ok) {
      throw new Error("Failed to delete record");
    }

    return response.json();
  },
};
