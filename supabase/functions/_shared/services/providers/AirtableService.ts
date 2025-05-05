import type {
  AirtableBase,
  AirtableRecord,
  AirtableTable,
} from "@/types/airtable";
import type {
  CustomBaseSchema,
  CustomTableRecord,
  CustomTableSchema,
} from "@/types/customTable";
import { BaseExternalService } from "@/services/_BaseExternalService";
import { getEnvKey } from "@/utils/env";
import { ICustomTableSource } from "@/interfaces/ICustomTableSource";

const BASE_URL = "https://api.airtable.com/v0";

const ENDPOINTS = {
  BASES: `${BASE_URL}/meta/bases`,
  GET_BASE_SCHEMA: (baseId: string) =>
    `${BASE_URL}/meta/bases/${baseId}/tables`,
  LIST_RECORDS: (baseId: string, tableName: string, queryString = "") =>
    `${BASE_URL}/${baseId}/${tableName}${queryString ? `?${queryString}` : ""}`,
  RETRIEVE_RECORD: (baseId: string, tableName: string, recordId: string) =>
    `${BASE_URL}/${baseId}/${tableName}/${recordId}`,
  CREATE_RECORD: (baseId: string, tableName: string) =>
    `${BASE_URL}/${baseId}/${tableName}`,
  UPDATE_RECORD: (baseId: string, tableName: string, recordId: string) =>
    `${BASE_URL}/${baseId}/${tableName}/${recordId}`,
  DELETE_RECORD: (baseId: string, tableName: string, recordId: string) =>
    `${BASE_URL}/${baseId}/${tableName}/${recordId}`,
  CREATE_TABLE: (baseId: string) => `${BASE_URL}/meta/bases/${baseId}/tables`,
  UPDATE_TABLE: (baseId: string, tableId: string) =>
    `${BASE_URL}/meta/bases/${baseId}/tables/${tableId}`,
  DELETE_TABLE: (baseId: string, tableId: string) =>
    `${BASE_URL}/meta/bases/${baseId}/tables/${tableId}`,
};

export class AirtableService
  extends BaseExternalService
  implements ICustomTableSource
{
  private accessToken: string | null;

  constructor(public base_id: string) {
    super();
    this.accessToken = getEnvKey("AIR_TABLE_ACCESS_TOKEN");
  }

  get headers() {
    return {
      Authorization: `Bearer ${this.accessToken}`,
      "Content-Type": "application/json",
    };
  }

  setAccessToken(accessToken: string) {
    this.accessToken = accessToken;
  }

  async getBases() {
    const response = await fetch(ENDPOINTS.BASES, { headers: this.headers });
    return response.json();
  }

  normalizeRecord(record: AirtableRecord): CustomTableRecord {
    return {
      _id: record.id,
      _createdTime: record.createdTime,
      ...Object.fromEntries(
        Object.entries(record.fields).map(([key, value]) => {
          if (
            Array.isArray(value) &&
            value?.length &&
            typeof value[0] === "string" &&
            value[0].startsWith("rec")
          ) {
            return [
              key.replace(/^_/, ""),
              value.map((id) => {
                return { id, value: id };
              }),
            ];
          }

          return [key.replace(/^_/, ""), value];
        })
      ),
    };
  }

  denormalizeRecord(record: CustomTableRecord): Omit<AirtableRecord, "id"> {
    const { _id, _createdTime, ...rest } = record;

    return {
      // id: record._id,
      // createdTime: record._createdTime,

      fields: Object.fromEntries(
        Object.entries(rest).map(([key, value]) => {
          if (
            Array.isArray(value) &&
            value.length &&
            typeof value[0] === "object" &&
            "id" in value[0]
          ) {
            return [key, value.map((item) => item.id)];
          }
          return [key, value];
        })
      ),
    };
  }

  normalizeTableSchema(
    table: AirtableTable,
    base: AirtableBase,
    tenant_id: string
  ): CustomTableSchema {
    return {
      name: table.name,
      display_name: table.name,
      external_id: table.id,
      source: "airtable",
      schema_id: this.base_id,
      tenant_id,
      permissions: {},
      schema_name: base.name,
      primary_field_id: table.primaryFieldId,
      fields: table.fields.map((field) => ({
        id: field.id,
        name: field.name,
        description: field.description,
        type: field?.type,
        sub_type: field?.options?.result?.type,
        is_computed: field?.isComputed,
        is_primary: field?.isPrimary,
        is_readonly: field?.isLocked,
        is_multiple: !field?.options?.prefersSingleRecordLink,
        attr_key: field?.name,
        inverse_linked_table_id: field?.options?.linkedTableId,
        inverse_linked_field_id: field?.options?.inverseLinkedTableId,
        original_provider_field: field,
        precision:
          field?.options?.precision ||
          field?.options?.result?.options?.precision,
        max_value: field?.options?.max,
        color: field?.options?.color,
        icon: field?.options?.icon,
        date_format: field?.options?.dateFormat?.name,
        time_format: field?.options?.timeFormat?.name?.replace("hour", ""),
        options:
          field?.options?.choices?.map((choice) => ({
            value: choice.id,
            label: choice.name,
            color: choice.color,
          })) || [],
        symbol: field?.options?.symbol,
        primary_key: table.primaryFieldId === field.id,
      })),
    };
  }

  async getBase(tenant_id: string): Promise<CustomBaseSchema> {
    this.logger.debug(
      "Getting base schema for workspace",
      ENDPOINTS.GET_BASE_SCHEMA(this.base_id)
    );

    const { bases } = await this.getBases();
    const base = bases.find((base: AirtableBase) => base.id === this.base_id);

    if (!base) {
      this.throwError("Base not found", 404);
    }

    const response = await fetch(ENDPOINTS.GET_BASE_SCHEMA(this.base_id), {
      headers: this.headers,
      method: "GET",
    });

    if (!response.ok) {
      const json = await response.json();
      this.throwError("Failed to get base schema", json, response.status);
    }

    const json = await response.json();

    return {
      name: base.name,
      ...json,
      tables: json.tables.map((table: AirtableTable) =>
        this.normalizeTableSchema(table, base, tenant_id)
      ),
    };
  }

  async listRecords(table: CustomTableSchema, queryString = "") {
    const response = await fetch(
      ENDPOINTS.LIST_RECORDS(this.base_id, table.external_id, queryString),
      { headers: this.headers, method: "GET" }
    );

    if (!response.ok) {
      const json = await response.json();
      this.throwError("Failed to list records", json, response.status);
    }

    const json = await response.json();

    return { ...json, records: json.records.map(this.normalizeRecord) };
  }

  async retrieveRecord(table: CustomTableSchema, recordId: string) {
    const response = await fetch(
      ENDPOINTS.RETRIEVE_RECORD(this.base_id, table.external_id, recordId),
      { headers: this.headers, method: "GET" }
    );
    const json = await response.json();

    if (!response.ok) {
      this.throwError("Failed to retrieve record", json, response.status);
    }

    return this.normalizeRecord(json);
  }

  async createRecord(table: CustomTableSchema, record: CustomTableRecord) {
    const response = await fetch(
      ENDPOINTS.CREATE_RECORD(this.base_id, table.external_id),
      {
        headers: this.headers,
        method: "POST",
        body: JSON.stringify(this.denormalizeRecord(record)),
      }
    );

    if (!response.ok) {
      const json = await response.json();
      this.throwError("Failed to create record", json, response.status);
    }
    const json = await response.json();

    return this.normalizeRecord(json);
  }

  async updateRecord(
    table: CustomTableSchema,
    recordId: string,
    record: CustomTableRecord
  ) {
    const payload = this.denormalizeRecord(record);

    const path = ENDPOINTS.UPDATE_RECORD(
      this.base_id,
      table.external_id,
      recordId
    );

    const response = await fetch(path, {
      headers: this.headers,
      method: "PATCH",
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const json = await response.json();
      this.throwError("Failed to update record", json, response.status);
    }
    const json = await response.json();

    return this.normalizeRecord(json);
  }

  async deleteRecord(table: CustomTableSchema, recordId: string) {
    const response = await fetch(
      ENDPOINTS.DELETE_RECORD(this.base_id, table.external_id, recordId),
      {
        headers: this.headers,
        method: "DELETE",
      }
    );

    if (!response.ok) {
      const json = await response.json();
      this.throwError("Failed to delete record", json, response.status);
    }

    return response.json();
  }
}
