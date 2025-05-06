import { BaseExternalService } from "@/services/_BaseExternalService";
import { getEnvKey } from "@/utils/env";
import type { ICustomTableSource } from "@/interfaces/ICustomTableSource";
import type {
  CustomBaseSchema,
  CustomTableRecord,
  CustomTableSchema,
} from "@/types/customTable";
import type { BaserowBase, BaserowTable, BaserowRow } from "@/types/baserow";

const BASE_URL = "https://api.baserow.io";

const ENDPOINTS = {
  AUTH: `${BASE_URL}/api/user/token-auth/`,
  APPLICATION: (baseId: string) => `${BASE_URL}/api/applications/${baseId}/`,
  DATABASE: (dbId: string) =>
    `${BASE_URL}/api/database/tables/database/${dbId}/`,
  TABLE_FIELDS: (tableId: string) =>
    `${BASE_URL}/api/database/fields/table/${tableId}/`,
  TABLE_ROWS: (tableId: string) =>
    `${BASE_URL}/api/database/rows/table/${tableId}/`,
};

export class BaserowService
  extends BaseExternalService
  implements ICustomTableSource
{
  private accessToken: string | null;
  private headers: Record<string, string>;

  constructor(public base_id: string) {
    super();
    this.accessToken = getEnvKey("BASEROW_TOKEN");
    this.headers = {
      Authorization: `Token ${this.accessToken}`,
      "Content-Type": "application/json",
    };
  }

  setAccessToken(accessToken: string) {
    this.accessToken = accessToken;
  }

  async getAuthHeaders() {
    const response = await fetch(ENDPOINTS.AUTH, {
      method: "POST",
      headers: this.headers,
      body: JSON.stringify({
        username: "skybrookai@gmail.com",
        password: "xwf7hun9JDA!vuk@yhj",
      }),
    });

    const json = await response.json();

    return {
      Authorization: `JWT ${json.token}`,
      "Content-Type": "application/json",
    };
  }

  normalizeRecord(
    record: Record<string, unknown | unknown[]>,
    table: CustomTableSchema
  ): CustomTableRecord {
    const fields = table.fields.reduce((_fields, field) => {
      return { ..._fields, [field.name]: record[`field_${field.id}`] };
    }, {});
    return {
      _id: record.id as string,
      _created_at: record.created_at as string | undefined,
      _updated_at: record.updated_at as string | undefined,
      ...fields,
    };
  }

  normalizeTableSchema(
    table: BaserowTable,
    tenant_id: string
  ): CustomTableSchema {
    return {
      name: table.name,
      display_name: table.name,
      external_id: table.id,
      source: "baserow",
      schema_id: this.base_id,
      tenant_id: tenant_id,
      permissions: {},
      schema_name: table.name,
      primary_field_id: table.fields
        .find((field) => field.primary)
        ?.id?.toString() as string,
      fields: table.fields.map((field) => ({
        id: field.id,
        name: field.name,
        description: field.description,
        type: field?.type,
        sub_type: field?.formula_type,
        is_computed: field?.type === "formula",
        is_primary: field?.primary,
        is_readonly: field?.read_only,
        is_multiple: field?.link_row_multiple_relationships,
        attr_key: field?.name,
        inverse_linked_table_id: field?.link_row_table_id,
        inverse_linked_field_id: field?.link_row_related_field_id,
        original_provider_field: field,
        precision: field?.number_decimal_places,
        max_value: field?.number_max,
        color: field?.color,
        icon: field?.style,
        date_format: field?.date_format,
        time_format: field?.date_time_format,
        options:
          field?.select_options?.map((option) => ({
            value: option.id,
            label: option.value,
            color: option.color,
          })) || [],
        prefix: field?.number_prefix,
        suffix: field?.number_suffix,
      })),
    };
  }

  async getBase(tenant_id: string): Promise<CustomBaseSchema> {
    const headers = await this.getAuthHeaders();
    const endpoint = ENDPOINTS.APPLICATION(this.base_id);

    const baseResponse = await fetch(endpoint, { headers });

    const { name, tables, ...rest } = await baseResponse.json();

    const tablesWithFields = await Promise.all(
      tables.map(async (table: BaserowTable) => {
        let fields = [];
        let retries = 0;
        const maxRetries = 3;
        const retryDelay = 1000; // 1 second

        while (retries < maxRetries) {
          try {
            const fieldsResponse = await fetch(
              ENDPOINTS.TABLE_FIELDS(table.id),
              {
                headers,
              }
            );

            if (!fieldsResponse.ok) {
              throw new Error(
                `Failed to fetch fields: ${fieldsResponse.status}`
              );
            }

            fields = await fieldsResponse.json();
            break; // Success, exit the retry loop
          } catch (error) {
            retries++;
            console.error(
              `Error fetching fields for table ${table.id}, attempt ${retries}/${maxRetries}:`,
              error
            );

            if (retries >= maxRetries) {
              console.error(`Max retries reached for table ${table.id}`);
            } else {
              // Wait before retrying
              await new Promise((resolve) =>
                setTimeout(resolve, retryDelay * retries)
              );
            }
          }
        }

        return { ...table, fields };
      })
    );

    const normalizedTables = tablesWithFields.map((table) =>
      this.normalizeTableSchema(table, tenant_id)
    );

    return { id: this.base_id, name, tables: normalizedTables };
  }

  async listRecords(table: CustomTableSchema) {
    const rows = await fetch(ENDPOINTS.TABLE_ROWS(table.external_id), {
      headers: this.headers,
    });

    if (!rows.ok) {
      throw new Error(`Failed to fetch rows: ${rows.status}`);
    }

    const rowsData = await rows.json();

    return {
      data: rowsData.results.map((record: Record<string, unknown>) =>
        this.normalizeRecord(record, table)
      ),
      total: rowsData.count,
      next: rowsData.next,
      previous: rowsData.previous,
    };
  }

  async retrieveRecord(table: CustomTableSchema, recordId: string) {
    return null;
  }

  async createRecord(table: CustomTableSchema, record: CustomTableRecord) {
    return null;
  }

  async updateRecord(
    table: CustomTableSchema,
    recordId: string,
    record: CustomTableRecord
  ) {
    return null;
  }

  async deleteRecord(table: CustomTableSchema, recordId: string) {
    return null;
  }
}
