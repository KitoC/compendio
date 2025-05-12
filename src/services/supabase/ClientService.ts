import { BaseService } from "@/services/supabase/BaseService";
import { Database, Tables } from "@/integrations/supabase/types";

const tableName = "clients";

export type Client = Tables<"clients">;

export class ClientService extends BaseService<
  Database["public"]["Tables"]["clients"]
> {
  constructor() {
    super();
    this.tableName = tableName;
    this.searchColumns = ["first_name", "last_name", "email", "phone"];
  }
}
