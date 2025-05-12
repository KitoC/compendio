import { BaseService } from "@/services/supabase/BaseService";

const tableName = "clients";

export class ClientsService extends BaseService {
  constructor() {
    super();
    this.tableName = tableName;
  }
}
