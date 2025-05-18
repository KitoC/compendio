import { BaseService } from "./BaseService";
import { Database, Tables } from "@/integrations/supabase/types";

export type Contact = Tables<"contacts">;

export class ContactService extends BaseService<
  Database["public"]["Tables"]["contacts"]
> {
  constructor() {
    super();
    this.tableName = "addresses";
    this.primaryKey = "id";
  }
}
