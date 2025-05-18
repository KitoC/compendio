CREATE TABLE contacts (
    id uuid primary key default uuid_generate_v4(),
    name text not null,
    email text not null,
    phone text not null,
    tenant_id uuid not null references tenants(id),
    created_at timestamp with time zone default now(),
    updated_at timestamp with time zone default now(),
    user_id uuid not null
);

ALTER TABLE "public"."contacts" ADD CONSTRAINT "fk_tenant_id" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id");

ALTER TABLE "public"."contacts" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."addresses" ADD COLUMN user_id uuid REFERENCES contacts(id);
ALTER TABLE "public"."companies" ADD COLUMN user_id uuid REFERENCES contacts(id);

CREATE POLICY "System & Tenant owners CRUD" ON "public"."contacts" USING (("public"."is_tenant_owner"("tenant_id") OR "public"."is_system_admin"())) WITH CHECK (("public"."is_tenant_owner"("tenant_id") OR "public"."is_system_admin"()));

-- Create a generic function to check if a user owns a record
CREATE OR REPLACE FUNCTION public.is_record_owner(user_id uuid)
RETURNS boolean AS $$
DECLARE
    is_owner boolean;
    query text;
BEGIN
    -- Dynamic query to check if the record belongs to the current user via any related table
    query := format('
        SELECT EXISTS (
            SELECT 1 FROM customers c
            WHERE c.user_id = $1 AND c.id = auth.uid()
            UNION
            SELECT 1 FROM staff_members s
            WHERE s.user_id = $1 AND s.id = auth.uid()
        )');
    
    EXECUTE query USING user_id INTO is_owner;
    
    RETURN is_owner;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create policy for contact owners to manage their own contact
CREATE POLICY "Contact owners can manage their own contact" 
ON "public"."contacts" 
USING (public.is_record_owner(user_id))
WITH CHECK (public.is_record_owner(user_id));

CREATE POLICY "Address owners can manage their own address"
ON "public"."addresses" 
USING (public.is_record_owner(user_id))
WITH CHECK (public.is_record_owner(user_id));

CREATE POLICY "Company owners can manage their own company"
ON "public"."companies" 
USING (public.is_record_owner(user_id))
WITH CHECK (public.is_record_owner(user_id));





