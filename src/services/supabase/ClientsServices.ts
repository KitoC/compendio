import { BaseService } from "@/services/supabase/BaseService";

const tableName = "clients";

export interface Client {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  notes: string;
  created_at: string;
  updated_at: string;
  deleted_at: string;
}

export class ClientsService extends BaseService<Client> {
  constructor() {
    super();
    this.tableName = tableName;
  }
}
