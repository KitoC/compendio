
import { AirtableBaseSchemaResponse, AirtableTable, AirtableBase, AirtableBaseListResponse } from "@/types/airtable";
import { AirtableRecord } from "@/components/airtable-table/types";
import { supabase } from "@/integrations/supabase/client";

export class AirtableService {
  /**
   * Fetch list of available Airtable bases
   */
  static async listBases(): Promise<AirtableBase[]> {
    try {
      const response = await supabase.functions.invoke("airtable-bases", {
        method: "GET",
      });

      if (response.error) {
        throw new Error(`Failed to list bases: ${response.error.message}`);
      }

      const data = response.data as AirtableBaseListResponse;
      return data.bases;
    } catch (error) {
      console.error("Error listing bases:", error);
      throw error;
    }
  }

  /**
   * Fetch schema for an Airtable base
   */
  static async getBaseSchema(baseId: string): Promise<AirtableTable[]> {
    try {
      const response = await supabase.functions.invoke("airtable-schema", {
        method: "GET",
        query: { baseId },
      });

      if (response.error) {
        throw new Error(`Failed to get base schema: ${response.error.message}`);
      }

      const data = response.data as AirtableBaseSchemaResponse;
      return data.tables;
    } catch (error) {
      console.error("Error getting base schema:", error);
      throw error;
    }
  }

  /**
   * Fetch records from an Airtable table
   */
  static async listRecords(baseId: string, tableName: string): Promise<AirtableRecord[]> {
    try {
      const response = await supabase.functions.invoke("table-records", {
        method: "GET",
        query: { table: tableName },
      });

      if (response.error) {
        throw new Error(`Failed to list records: ${response.error.message}`);
      }

      return response.data;
    } catch (error) {
      console.error("Error listing records:", error);
      throw error;
    }
  }

  /**
   * Create a new record in an Airtable table
   */
  static async createRecord(baseId: string, tableName: string, fields: Record<string, any>): Promise<AirtableRecord> {
    try {
      const response = await supabase.functions.invoke("table-records", {
        method: "POST",
        body: { fields },
        query: { table: tableName },
      });

      if (response.error) {
        throw new Error(`Failed to create record: ${response.error.message}`);
      }

      return response.data;
    } catch (error) {
      console.error("Error creating record:", error);
      throw error;
    }
  }

  /**
   * Update an existing record in an Airtable table
   */
  static async updateRecord(baseId: string, tableName: string, recordId: string, fields: Record<string, any>): Promise<AirtableRecord> {
    try {
      const response = await supabase.functions.invoke("table-records", {
        method: "PATCH",
        body: { fields },
        query: { table: tableName, recordId },
      });

      if (response.error) {
        throw new Error(`Failed to update record: ${response.error.message}`);
      }

      return response.data;
    } catch (error) {
      console.error("Error updating record:", error);
      throw error;
    }
  }

  /**
   * Delete a record from an Airtable table
   */
  static async deleteRecord(baseId: string, tableName: string, recordId: string): Promise<void> {
    try {
      const response = await supabase.functions.invoke("table-records", {
        method: "DELETE",
        query: { table: tableName, recordId },
      });

      if (response.error) {
        throw new Error(`Failed to delete record: ${response.error.message}`);
      }
    } catch (error) {
      console.error("Error deleting record:", error);
      throw error;
    }
  }
}
