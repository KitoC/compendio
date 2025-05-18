import { BaseService } from "@/services/supabase/BaseService";
import { Database, Tables } from "@/integrations/supabase/types";
import { AddressType } from "@/services/supabase/AddressService";
import { Contact } from "./ContactService";

const tableName = "clients";

export type Client = Tables<"clients">;
export type ClientWithAddressAndContact = Client & {
  address: Partial<AddressType>;
  contact: Partial<Contact>;
};

export class ClientService extends BaseService<
  Database["public"]["Tables"]["clients"]
> {
  constructor() {
    super();
    this.tableName = tableName;
    this.searchColumns = ["first_name", "last_name", "email", "phone"];
  }
}
