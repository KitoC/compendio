import { BaseService } from "@/services/supabase/BaseService";
import { Database, Tables, TablesInsert } from "@/integrations/supabase/types";
import { QuoteItem } from "@/services/supabase/QuoteItemService";
const tableName = "quote_line_items";

export type QuoteLineItem = Tables<"quote_line_items">;
export type QuoteLineItemInsert = TablesInsert<"quote_line_items">;
export type QuoteLineItemWithRelations = QuoteLineItemInsert & {
  quote_item: Partial<QuoteItem>;
};

export class QuoteLineItemService extends BaseService<
  Database["public"]["Tables"]["quote_line_items"]
> {
  constructor() {
    super();
    this.tableName = tableName;
  }

  async getByQuoteId(quoteId: string) {
    return this.get({
      filter: { quote_id: quoteId },
      sort: { column: "created_at", ascending: true },
    });
  }
}
