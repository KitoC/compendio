import { BaseService } from "@/services/supabase/BaseService";
import { Database, Tables } from "@/integrations/supabase/types";

const tableName = "quote_items";

export type QuoteItem = Tables<"quote_items">;

export class QuoteItemService extends BaseService<
  Database["public"]["Tables"]["quote_items"]
> {
  constructor() {
    super();
    this.tableName = tableName;
    this.searchColumns = ["name", "description"];
  }
}
