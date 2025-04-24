ALTER TABLE connected_services DROP CONSTRAINT connected_services_workflow_instance_id_fkey;
ALTER TABLE oauth_states DROP CONSTRAINT oauth_states_workflow_instance_id_fkey;


DROP TABLE IF EXISTS workflow_responses;
DROP TABLE IF EXISTS workflow_instances;
DROP TABLE IF EXISTS workflow_steps;


ALTER TABLE workflows
ADD COLUMN IF NOT EXISTS external_workflow_id TEXT;

ALTER TABLE workflows
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;


CREATE TABLE IF NOT EXISTS workflow_triggers (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  workflow_id uuid not null references workflows(id) on delete cascade,
  event_type text not null, -- e.g. "user_signup", "message_created"
  metadata jsonb,           -- optional: conditions or filters
  is_active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);


CREATE POLICY "System & Tenant owners CRUD" ON "public"."workflow_triggers" USING (("public"."is_tenant_owner"("tenant_id") OR "public"."is_system_admin"())) WITH CHECK (("public"."is_tenant_owner"("tenant_id") OR "public"."is_system_admin"()));
ALTER TABLE "public"."workflow_triggers" ENABLE ROW LEVEL SECURITY;
