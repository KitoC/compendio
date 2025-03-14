import makeSupabaseEntity from "../../utils/makeSupabaseEntity";

export interface User {
  id?: string;
  user_id: string;
  email: string;
  name: string;
  phone_number: string;
  address: string;
}

export type CustomerRecord = {
  id: string;
  domain: string;
  user_id: string;
  contact_details: User;
  created_at?: string;
  updated_at?: string;
};

export default makeSupabaseEntity<CustomerRecord, Partial<CustomerRecord>>({
  entityName: "customers",
  primaryKey: "user_id",
});
