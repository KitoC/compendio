import { BaseExternalService } from "@/services/_BaseExternalService";
import { getEnvKey } from "@/utils/env";
import type { ICustomTableSource } from "@/interfaces/ICustomTableSource";
import type {
  CustomBaseSchema,
  CustomTableRecord,
  CustomTableSchema,
} from "@/types/customTable";
import type { BaserowTable, BaserowSelectOption } from "@/types/baserow";
import type { SelectOption } from "@/types/customTable";
const BASE_URL = "https://api.baserow.io";

const ENDPOINTS = {
  AUTH: `${BASE_URL}/api/user/token-auth/`,
  APPLICATION: (baseId: string) => `${BASE_URL}/api/applications/${baseId}/`,
  DATABASE: (dbId: string) =>
    `${BASE_URL}/api/database/tables/database/${dbId}/`,
  TABLE_FIELDS: (tableId: string) =>
    `${BASE_URL}/api/database/fields/table/${tableId}/`,
  TABLE_ROWS: (tableId: string, queryParams?: string) =>
    `${BASE_URL}/api/database/rows/table/${tableId}/?user_field_names=true${
      queryParams ? `&${queryParams}` : ""
    }`,
  TABLE_ROW: (tableId: string, rowId: string, queryParams?: string) =>
    `${BASE_URL}/api/database/rows/table/${tableId}/${rowId}/?user_field_names=true`,
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
    const normalizedRecord: CustomTableRecord = {
      _id: (record.id as number).toString(),
      _created_at: record.created_at as string | undefined,
      _updated_at: record.updated_at as string | undefined,
      ...record,
    };

    const caseToInternalOptions = (value: BaserowSelectOption) => {
      return {
        value: value.id.toString(),
        label: value.value,
        data: value,
      };
    };

    table.fields.forEach((field) => {
      const fieldValue = normalizedRecord[field.name];

      switch (field.type) {
        case "single_select":
          normalizedRecord[field.name] = (
            fieldValue as BaserowSelectOption
          )?.id?.toString();
          break;

        case "multiple_select":
        case "link_row":
          normalizedRecord[field.name] = (
            fieldValue as BaserowSelectOption[]
          )?.map(caseToInternalOptions);
          break;

        default:
          normalizedRecord[field.name] = record[field.name];
      }
    });

    return normalizedRecord;
  }

  denormalizeRecord(
    record: CustomTableRecord,
    table: CustomTableSchema
  ): Record<string, unknown | unknown[]> {
    const denormalizedRecord = { ...record };

    table.fields.forEach((field) => {
      const fieldValue = record[field.name];

      if (field.is_readonly) {
        delete denormalizedRecord[field.name];
      }

      switch (field.type) {
        case "single_select":
          denormalizedRecord[field.name] = Number(fieldValue);
          break;

        case "link_row":
        case "multiple_select":
          denormalizedRecord[field.name] = (fieldValue as SelectOption[])?.map(
            (option) => Number(option.value)
          );
          break;

        default:
          break;
      }
    });

    return denormalizedRecord;
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
        id: field.id.toString(),
        name: field.name,
        description: field.description,
        type: field?.type,
        sub_type: field?.formula_type,
        is_computed: field?.type === "formula",
        is_primary: field?.primary,
        is_readonly: field?.read_only,
        is_multiple: field?.link_row_multiple_relationships,
        attr_key: field?.name,
        inverse_linked_table_id: field?.link_row_table_id?.toString(),
        inverse_linked_field_id: field?.link_row_related_field_id?.toString(),
        original_provider_field: field,
        precision: field?.number_decimal_places,
        max_value: field?.number_max,
        color: field?.color,
        icon: field?.style,
        date_format: field?.date_format,
        time_format: field?.date_time_format,
        date_include_time: field?.date_include_time,
        options:
          field?.select_options?.map((option) => ({
            value: option.id?.toString(),
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
        const maxRetries = 5;
        const retryDelay = 5000; // 5 second

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

  normalizeQueryString(queryString: string) {
    return queryString.replace(/pageSize/, "size");
  }

  async listRecords(table: CustomTableSchema, queryString = "") {
    const endpoint = ENDPOINTS.TABLE_ROWS(
      table.external_id,
      this.normalizeQueryString(queryString)
    );

    this.logger.debug(`Fetching records from ${endpoint}`);

    const rows = await fetch(endpoint, {
      headers: this.headers,
    });

    if (!rows.ok) {
      const errorData = await rows.json();

      this.throwError(errorData.detail, errorData);
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
    const { headers } = this;
    const row = await fetch(ENDPOINTS.TABLE_ROW(table.external_id, recordId), {
      headers,
    });

    if (!row.ok) {
      const errorData = await row.json();

      this.throwError(errorData.detail, errorData);
    }

    const rowData = await row.json();

    return this.normalizeRecord(rowData, table);
  }

  async createRecord(table: CustomTableSchema, record: CustomTableRecord) {
    const { headers } = this;

    const response = await fetch(ENDPOINTS.TABLE_ROWS(table.external_id), {
      headers,
      method: "POST",
      body: JSON.stringify(this.denormalizeRecord(record, table)),
    });

    if (!response.ok) {
      const errorData = await response.json();

      this.throwError(errorData.detail, errorData);
    }

    const rowData = await response.json();

    return this.normalizeRecord(rowData, table);
  }

  async updateRecord(
    table: CustomTableSchema,
    recordId: string,
    record: CustomTableRecord
  ) {
    const { headers } = this;

    const response = await fetch(
      ENDPOINTS.TABLE_ROW(table.external_id, recordId),
      {
        headers,
        method: "PATCH",
        body: JSON.stringify(this.denormalizeRecord(record, table)),
      }
    );

    if (!response.ok) {
      const errorData = await response.json();

      this.throwError(errorData.detail, errorData);
    }

    const rowData = await response.json();

    return this.normalizeRecord(rowData, table);
  }

  async deleteRecord(table: CustomTableSchema, recordId: string) {
    const { headers } = this;

    const response = await fetch(
      ENDPOINTS.TABLE_ROW(table.external_id, recordId),
      { headers, method: "DELETE" }
    );

    if (!response.ok) {
      const errorData = await response.json();

      this.throwError(errorData.detail, errorData);
    }
  }
}
