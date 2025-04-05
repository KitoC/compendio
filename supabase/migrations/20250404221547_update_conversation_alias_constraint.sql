-- Drop the existing index (if it was previously a partial index)
DROP INDEX IF EXISTS "conversations_alias_unique";

-- Drop the constraint in case it exists from a previous migration
ALTER TABLE "public"."conversations"
DROP CONSTRAINT IF EXISTS "conversations_tenant_alias_unique";

-- Add the table-level unique constraint
ALTER TABLE "public"."conversations"
ADD CONSTRAINT "conversations_tenant_alias_unique"
UNIQUE ("tenant_id", "alias");
