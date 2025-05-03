import { BaseExternalService } from "@/services/_BaseExternalService";
import { getEnvKey } from "@/utils/env";

const BASE_URL = "https://api.baserow.io";

const ENDPOINTS = {
  AUTH: `${BASE_URL}/api/user/token-auth/`,
  DATABASE: (dbId: string) =>
    `${BASE_URL}/api/database/tables/database/${dbId}/`,
  TABLE_FIELDS: (tableId: string) =>
    `${BASE_URL}/api/database/fields/table/${tableId}/`,
};

export class BaserowService extends BaseExternalService {
  private accessToken: string | null;
  private headers: Record<string, string>;

  constructor(public base_id: string) {
    super();
    this.accessToken = getEnvKey("AIR_TABLE_ACCESS_TOKEN");
    this.headers = {
      Authorization: `Bearer ${this.accessToken}`,
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

  async getSchema() {
    const headers = await this.getAuthHeaders();

    const tablesResponse = await fetch(ENDPOINTS.DATABASE("219296"), {
      headers,
    });

    const tables = await tablesResponse.json();

    const fields = await Promise.all(
      tables.map(async (table: any) => {
        const fieldsResponse = await fetch(ENDPOINTS.TABLE_FIELDS(table.id), {
          headers,
        });

        const fields = await fieldsResponse.json();

        console.log("fieldsResponse -->", fields);

        return { fields, ...table };
      })
    );

    return fields;
  }
}
