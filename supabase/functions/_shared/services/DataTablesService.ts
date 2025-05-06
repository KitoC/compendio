// NO_CHANGE

import {
  BaseRequiredContext,
  BaseSupabaseService,
} from "@/services/_BaseSupabaseService";
import type { Database } from "@/integrations/supabase/types";
import { READONLY_FIELDS_AIRTABLE } from "@/consts";
import type {
  CustomTableField,
  CustomTableRecord,
  CustomTableSchema,
} from "@/types/customTable";

type DataField = Database["public"]["Tables"]["data_fields"]["Row"];
type DataTable = Database["public"]["Tables"]["data_tables"]["Row"];

class DataTablesService extends BaseSupabaseService {
  constructor(public context: BaseRequiredContext) {
    super(context);
    this.tableName = "data_tables";
  }

  async getTableSchemas({
    base_id,
    source,
  }: {
    base_id: string;
    source: string;
  }): Promise<CustomTableSchema[]> {
    const { data: tableSchemas } = await this.supabase_AS_SUPER_ADMIN
      .from("data_tables")
      .select("*, fields:data_fields(*)")
      .eq("schema_id", base_id)
      .eq("source", source);

    return tableSchemas.map((table: DataTable & { fields: DataField[] }) => ({
      ...table,
      fields: table.fields.map((field) => field.schema),
    }));
  }

  async getTableSchema({
    external_id,
    source,
  }: {
    external_id: string;
    source: string;
  }) {
    const { data: tableSchema, error } = await this.supabase_AS_SUPER_ADMIN
      .from("data_tables")
      .select("*, fields:data_fields(*)")
      .eq("source", source)
      .eq("external_id", external_id)
      .single();

    if (error) {
      console.error("error", error);
    }

    return {
      ...tableSchema,
      fields: tableSchema.fields.map((field: DataField) => field.schema),
    };
  }

  async upsertLabel({
    base_id,
    table,
    record,
    tenant_id,
  }: {
    record: CustomTableRecord;
    base_id: string;
    table: CustomTableSchema;
    tenant_id: string;
  }) {
    const tableSchema = await this.getTableSchema({
      external_id: table.external_id,
      source: table.source,
    });

    const primaryFieldName = tableSchema.data_fields.find(
      (field: DataField) => field.external_id === tableSchema.primary_field_id
    )?.schema?.name;
    const { labelFieldName } = tableSchema.config;

    const newLabel = {
      data_table_id: tableSchema.id,
      external_table_id: table,
      record_id: record.id,
      label: record[labelFieldName || primaryFieldName],
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
    table: CustomTableSchema;
    record_id: string;
  }) {
    const labelError = await this.supabase_AS_SUPER_ADMIN
      .from("data_table_record_labels")
      .delete()
      .eq("external_table_id", table.external_id)
      .eq("record_id", record_id);

    if (labelError) {
      console.error("labelError", labelError);
    }
  }

  async prepareRecordForUpsert({
    body,
    source,
    external_table_id,
  }: {
    body: CustomTableRecord;
    source: string;
    external_table_id: string;
  }): Promise<CustomTableRecord> {
    const tableSchema = await this.getTableSchema({
      external_id: external_table_id,
      source,
    });

    const SOURCE_READONLY_FIELDS: Record<string, string[]> = {
      airtable: READONLY_FIELDS_AIRTABLE,
    };

    const cleanedBody: CustomTableRecord = {
      _id: body._id,
    };

    const readOnlyFields: CustomTableField[] = tableSchema.data_fields
      .filter((field: DataField) =>
        SOURCE_READONLY_FIELDS[source].includes(
          (field.schema as unknown as CustomTableField)?.type
        )
      )
      .map((field: DataField) => field.schema);

    Object.entries(body).forEach(([key, value]) => {
      if (!readOnlyFields.some((field) => field?.name === key)) {
        cleanedBody[key] = value;
      }
    });

    return cleanedBody;
  }
}

export { DataTablesService };
