import type { AirtableBase } from "@/types/airtable";
import { BaseExternalService } from "locals/services/_BaseExternalService";
import { getEnvKey } from "locals/utils/env";

const BASE_URL = "https://api.airtable.com/v0";

const ENDPOINTS = {
  BASES: `${BASE_URL}/meta/bases`,
  GET_BASE_SCHEMA: (baseId: string) =>
    `${BASE_URL}/meta/bases/${baseId}/tables`,
  LIST_RECORDS: (baseId: string, tableName: string, queryString = "") =>
    `${BASE_URL}/${baseId}/${tableName}${queryString}`,
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

export class AirtableService extends BaseExternalService {
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

  async getBase(): Promise<AirtableBase> {
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

    return { name: base.name, ...json };
  }

  async listRecords(tableName: string, queryString = "") {
    const response = await fetch(
      ENDPOINTS.LIST_RECORDS(this.base_id, tableName, queryString),
      {
        headers: this.headers,
        method: "GET",
      }
    );

    if (!response.ok) {
      const json = await response.json();
      this.throwError("Failed to list records", json, response.status);
    }

    return response.json();
  }

  async retrieveRecord(tableName: string, recordId: string) {
    const response = await fetch(
      ENDPOINTS.RETRIEVE_RECORD(this.base_id, tableName, recordId),
      {
        headers: this.headers,
        method: "GET",
      }
    );
    const json = await response.json();

    if (!response.ok) {
      this.throwError("Failed to retrieve record", json, response.status);
    }

    return json;
  }

  async createRecord(tableName: string, fields: object) {
    const response = await fetch(
      ENDPOINTS.CREATE_RECORD(this.base_id, tableName),
      {
        headers: this.headers,
        method: "POST",
        body: JSON.stringify({ fields }),
      }
    );

    if (!response.ok) {
      const json = await response.json();
      this.throwError("Failed to create record", json, response.status);
    }

    return response.json();
  }

  async updateRecord(tableName: string, recordId: string, fields: object) {
    const response = await fetch(
      ENDPOINTS.UPDATE_RECORD(this.base_id, tableName, recordId),
      {
        headers: this.headers,
        method: "PATCH",
        body: JSON.stringify({ fields }),
      }
    );

    if (!response.ok) {
      const json = await response.json();
      this.throwError("Failed to update record", json, response.status);
    }

    return response.json();
  }

  async deleteRecord(tableName: string, recordId: string) {
    const response = await fetch(
      ENDPOINTS.DELETE_RECORD(this.base_id, tableName, recordId),
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

  async createTable(schema: object) {
    const response = await fetch(ENDPOINTS.CREATE_TABLE(this.base_id), {
      headers: this.headers,
      method: "POST",
      body: JSON.stringify(schema),
    });

    if (!response.ok) {
      const json = await response.json();
      this.throwError("Failed to create table", json, response.status);
    }

    return response.json();
  }

  async updateTable(tableId: string, updates: object) {
    const response = await fetch(
      ENDPOINTS.UPDATE_TABLE(this.base_id, tableId),
      {
        headers: this.headers,
        method: "PATCH",
        body: JSON.stringify(updates),
      }
    );

    if (!response.ok) {
      const json = await response.json();
      this.throwError("Failed to update table", json, response.status);
    }

    return response.json();
  }

  async deleteTable(tableId: string) {
    const response = await fetch(
      ENDPOINTS.DELETE_TABLE(this.base_id, tableId),
      {
        headers: this.headers,
        method: "DELETE",
      }
    );

    if (!response.ok) {
      const json = await response.json();
      this.throwError("Failed to delete table", json, response.status);
    }

    return response.json();
  }
}
