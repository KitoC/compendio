// NO_CHANGE

import type { AirtableField, AirtableRecord } from "@/types/airtable";
import {
  BaseRequiredContext,
  BaseSupabaseService,
} from "locals/services/_BaseSupabaseService";
import type { Database } from "@/integrations/supabase/types";
import { READONLY_FIELDS_AIRTABLE } from "locals/consts";

type DataField = Database["public"]["Tables"]["data_fields"]["Row"];

class DataTablesService extends BaseSupabaseService {
  constructor(public context: BaseRequiredContext) {
    super(context);
    this.tableName = "data_tables";
  }

  async getTableSchema({ base_id, table }: { base_id: string; table: string }) {
    const { data: tableSchema } = await this.supabase_AS_SUPER_ADMIN
      .from("data_tables")
      .select("*, data_fields(*)")
      .eq("schema_id", base_id)
      .eq("source", "airtable")
      .eq("external_id", table)
      .single();

    return tableSchema;
  }

  async upsertLabel({
    base_id,
    table,
    record,
    tenant_id,
  }: {
    record: AirtableRecord;
    base_id: string;
    table: string;
    tenant_id: string;
  }) {
    const tableSchema = await this.getTableSchema({ base_id, table });

    const primaryFieldName = tableSchema.data_fields.find(
      (field: DataField) => field.external_id === tableSchema.primary_field_id
    )?.schema?.name;
    const { labelFieldName } = tableSchema.config;

    const newLabel = {
      data_table_id: tableSchema.id,
      external_table_id: table,
      record_id: record.id,
      label: record.fields[labelFieldName || primaryFieldName],
      tenant_id: tenant_id,
    };

    const { error: labelError } = await this.supabase_AS_SUPER_ADMIN
      .from("data_table_record_labels")
      .upsert(newLabel, {
        onConflict: "data_table_id, external_table_id, record_id",
      });

    if (labelError) {
      console.error("labelError", labelError);
    }

    return labelError;
  }

  async deleteLabel({
    table,
    record_id,
  }: {
    table: string;
    record_id: string;
  }) {
    const labelError = await this.supabase_AS_SUPER_ADMIN
      .from("data_table_record_labels")
      .delete()
      .eq("external_table_id", table)
      .eq("record_id", record_id);

    if (labelError) {
      console.error("labelError", labelError);
    }
  }

  async prepareRecordForUpsert({
    body,
    base_id,
    table,
  }: {
    body: { fields: Record<string, unknown> };
    base_id: string;
    table: string;
  }) {
    const tableSchema = await this.getTableSchema({
      base_id: base_id,
      table,
    });

    const cleanedBody: Record<string, unknown> = {};

    const readOnlyFields: AirtableField[] = tableSchema.data_fields
      .filter((field: DataField) =>
        READONLY_FIELDS_AIRTABLE.includes(
          (field.schema as unknown as AirtableField)?.type
        )
      )
      .map((field: DataField) => field.schema);

    Object.entries(body.fields).forEach(([key, value]) => {
      if (!readOnlyFields.some((field) => field?.name === key)) {
        cleanedBody[key] = value;
      }
    });

    return cleanedBody;
  }
}

export { DataTablesService };
