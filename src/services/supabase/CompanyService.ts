import { BaseService } from "./BaseService";
import { Database, Tables } from "@/integrations/supabase/types";
import { AddressType } from "./AddressService";
import { Contact } from "./ContactService";

export type Company = Tables<"companies">;
export type CompanyWithAddressAndContact = Company & {
  address: Partial<AddressType>;
  contact: Partial<Contact>;
};

export class CompanyService extends BaseService<
  Database["public"]["Tables"]["companies"]
> {
  constructor() {
    super();
    this.tableName = "companies";
    this.primaryKey = "id";
  }
}
