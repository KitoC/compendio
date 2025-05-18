import { BaseService } from "./BaseService";
import { Database, Tables } from "@/integrations/supabase/types";

export type AddressType = Tables<"addresses">;

export class AddressService extends BaseService<
  Database["public"]["Tables"]["addresses"]
> {
  constructor() {
    super();
    this.tableName = "addresses";
    this.primaryKey = "id";
  }
}
