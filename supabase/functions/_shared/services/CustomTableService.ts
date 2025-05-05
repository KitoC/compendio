import { BaseExternalService } from "@/services/_BaseExternalService";
import type { ICustomTableSource } from "@/interfaces/ICustomTableSource";
import type {
  CustomBaseSchema,
  CustomTableRecord,
  CustomTableSchema,
} from "@/types/customTable";
import type { Database } from "@/integrations/supabase/types";
import { AirtableService } from "@/services/providers/AirtableService";
import { BaserowService } from "@/services/providers/BaserowService";

type TenantWorkspace = Database["public"]["Tables"]["tenants"]["Row"];

const providers = {
  airtable: AirtableService,
  baserow: BaserowService,
};

export class CustomTableService
  extends BaseExternalService
  implements ICustomTableSource
{
  private provider: AirtableService | BaserowService | null;
  public base_id: string;
  public source: string;

  constructor(public tenantWorkspace: TenantWorkspace) {
    super();

    const { base_id, source } = tenantWorkspace;

    this.provider = null;
    this.base_id = base_id || "";
    this.source = source || "";

    if (base_id) {
      this.provider = new providers[source as keyof typeof providers](base_id);
    }
  }

  async getBase(tenant_id: string): Promise<CustomBaseSchema> {
    if (!this.provider) {
      throw new Error("Provider not found");
    }

    return this.provider.getBase(tenant_id);
  }

  async listRecords(table: CustomTableSchema, queryString = "") {
    if (!this.provider) {
      throw new Error("Provider not found");
    }

    return this.provider.listRecords(table, queryString);
  }

  async retrieveRecord(table: CustomTableSchema, recordId: string) {
    if (!this.provider) {
      throw new Error("Provider not found");
    }

    return this.provider.retrieveRecord(table, recordId);
  }

  async createRecord(table: CustomTableSchema, record: CustomTableRecord) {
    if (!this.provider) {
      throw new Error("Provider not found");
    }

    return this.provider.createRecord(table, record);
  }

  async updateRecord(
    table: CustomTableSchema,
    recordId: string,
    record: CustomTableRecord
  ) {
    if (!this.provider) {
      throw new Error("Provider not found");
    }

    return this.provider.updateRecord(table, recordId, record);
  }

  async deleteRecord(table: CustomTableSchema, recordId: string) {
    if (!this.provider) {
      throw new Error("Provider not found");
    }

    return this.provider.deleteRecord(table, recordId);
  }
}
