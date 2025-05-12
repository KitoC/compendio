import { BaseService } from "@/services/supabase/BaseService";
import { Database, Tables } from "@/integrations/supabase/types";

const tableName = "staff_members";

export type StaffMember = Tables<"staff_members">;

export class StaffService extends BaseService<
  Database["public"]["Tables"]["staff_members"]
> {
  constructor() {
    super();
    this.tableName = tableName;
    this.searchColumns = ["first_name", "last_name", "email", "phone"];
  }
}
