import { BaseService } from "@/services/supabase/BaseService";
import { Database, Tables } from "@/integrations/supabase/types";

const tableName = "quotes";

export type Quote = Tables<"quotes">;

export class QuoteService extends BaseService<
  Database["public"]["Tables"]["quotes"]
> {
  constructor() {
    super();
    this.tableName = tableName;
  }
}
