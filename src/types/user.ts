
import { User as SupabaseUser } from '@supabase/supabase-js';

// Extend the Supabase User type to include tenant_id
export interface User extends SupabaseUser {
  tenant_id?: string;
}
