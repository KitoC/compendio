import { BaseService } from "@/services/supabase/BaseService";
import { Database, Tables } from "@/integrations/supabase/types";
import { ClientWithAddressAndContact } from "@/services/supabase/ClientService";
import { QuoteLineItemWithRelations } from "./QuoteLineItemService";
import { StaffMember } from "./StaffService";
import { CompanyWithAddressAndContact } from "./CompanyService";

const tableName = "quotes";

export type Quote = Tables<"quotes">;
export type QuoteWithRelations = Quote & {
  staff_member: StaffMember;
  client: ClientWithAddressAndContact;
  quote_line_items: QuoteLineItemWithRelations[];
};

export type QuotePreviewType = Partial<Quote> & {
  company: Partial<CompanyWithAddressAndContact>;
  staff_member: Partial<StaffMember>;
  client: Partial<ClientWithAddressAndContact>;
  quote_line_items: Partial<QuoteLineItemWithRelations>[];
};

export class QuoteService extends BaseService<
  Database["public"]["Tables"]["quotes"]
> {
  constructor() {
    super();
    this.tableName = tableName;
  }
}
