

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


CREATE EXTENSION IF NOT EXISTS "pgsodium";






COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";






CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgjwt" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "vector" WITH SCHEMA "public";






CREATE TYPE "public"."field_type_enum" AS ENUM (
    'text',
    'integer',
    'boolean',
    'reference',
    'timestamp',
    'uuid',
    'number',
    'date',
    'select',
    'email',
    'url',
    'relation',
    'textarea'
);


ALTER TYPE "public"."field_type_enum" OWNER TO "postgres";


COMMENT ON TYPE "public"."field_type_enum" IS 'text, textarea, number, boolean, date, email, url, select, or relation';



CREATE TYPE "public"."function_task_status" AS ENUM (
    'pending',
    'failed',
    'finished'
);


ALTER TYPE "public"."function_task_status" OWNER TO "postgres";


CREATE TYPE "public"."message_with_profile" AS (
	"id" "uuid",
	"conversation_id" "uuid",
	"connected_service_id" "uuid",
	"tenant_id" "uuid",
	"user_id" "uuid",
	"reply_to" "uuid",
	"content" "jsonb",
	"role" character varying,
	"metadata" "jsonb",
	"created_at" timestamp without time zone,
	"updated_at" timestamp without time zone,
	"deleted_at" timestamp without time zone,
	"display_name" "text",
	"username" "text",
	"avatar_url" "text"
);


ALTER TYPE "public"."message_with_profile" OWNER TO "postgres";


CREATE TYPE "public"."paginated_messages" AS (
	"messages" "public"."message_with_profile"[],
	"total_count" integer,
	"has_more" boolean
);


ALTER TYPE "public"."paginated_messages" OWNER TO "postgres";


CREATE TYPE "public"."user_role_type" AS ENUM (
    'admin',
    'member',
    'guest',
    'super-admin',
    'tenant-owner',
    'system-admin'
);


ALTER TYPE "public"."user_role_type" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."add_custom_table_field"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
    v_table_exists BOOLEAN;
    v_column_exists BOOLEAN;
    v_table_name TEXT;
    v_column_type TEXT;
    v_add_column_query TEXT;
BEGIN
    -- Get the table name from the table_id
    SELECT name INTO v_table_name 
    FROM custom_table_definitions 
    WHERE id = NEW.table_id;
    
    IF v_table_name IS NULL THEN
        RAISE EXCEPTION 'Table not found for ID: %', NEW.table_id;
    END IF;
    
    -- Check if the table exists
    SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'ct_' || v_table_name
    ) INTO v_table_exists;
    
    IF NOT v_table_exists THEN
        RAISE EXCEPTION 'Physical table does not exist: ct_%', v_table_name;
    END IF;
    
    -- Check if the column already exists
    SELECT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'ct_' || v_table_name
        AND column_name = NEW.name
    ) INTO v_column_exists;
    
    IF v_column_exists THEN
        -- Column already exists, no need to add it again
        RETURN NEW;
    END IF;
    
    -- Map the field type to a PostgreSQL data type
    CASE NEW.field_type
        WHEN 'text' THEN v_column_type := 'TEXT';
        WHEN 'textarea' THEN v_column_type := 'TEXT';
        WHEN 'number' THEN v_column_type := 'NUMERIC';
        WHEN 'boolean' THEN v_column_type := 'BOOLEAN';
        WHEN 'date' THEN v_column_type := 'DATE';
        WHEN 'email' THEN v_column_type := 'TEXT';
        WHEN 'url' THEN v_column_type := 'TEXT';
        WHEN 'select' THEN v_column_type := 'TEXT';
        WHEN 'relation' THEN v_column_type := 'UUID';
        ELSE v_column_type := 'TEXT';
    END CASE;
    
    -- Add the column to the physical table
    v_add_column_query := format(
        'ALTER TABLE public.ct_%I ADD COLUMN %I %s',
        v_table_name, NEW.name, v_column_type
    );
    
    -- Add NOT NULL constraint if the field is required
    IF NEW.is_required THEN
        v_add_column_query := v_add_column_query || ' NOT NULL';
    END IF;
    
    -- Add UNIQUE constraint if the field should be unique
    IF NEW.is_unique THEN
        v_add_column_query := v_add_column_query || format(
            ' CONSTRAINT unique_%s_%s UNIQUE',
            v_table_name, NEW.name
        );
    END IF;
    
    BEGIN
        EXECUTE v_add_column_query;
    EXCEPTION WHEN OTHERS THEN
        RAISE EXCEPTION 'Error adding column to table: %', SQLERRM;
    END;
    
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."add_custom_table_field"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."add_default_columns"("table_name" "text", "add_tenant_id" boolean DEFAULT false, "tenant_id" "uuid" DEFAULT '35eb8c76-7ed5-4109-a520-99c7402d1f03'::"uuid") RETURNS "void"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
    query TEXT;
    trigger_exists INT;
BEGIN
    -- Add id column
    query := format('ALTER TABLE %I ADD COLUMN IF NOT EXISTS id UUID DEFAULT gen_random_uuid() PRIMARY KEY;', table_name);
    EXECUTE query;

    -- Add created_at column
    query := format('ALTER TABLE %I ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT NOW();', table_name);
    EXECUTE query;

    -- Add updated_at column
    query := format('ALTER TABLE %I ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW();', table_name);
    EXECUTE query;

    -- Add deleted_at column
    query := format('ALTER TABLE %I ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP NULL;', table_name);
    EXECUTE query;
    
    -- Add tenant_id column if add_tenant_id is true
    IF add_tenant_id THEN
        query := format('ALTER TABLE %I ADD COLUMN IF NOT EXISTS tenant_id UUID;', table_name);
        EXECUTE query;

        -- Ensure all existing rows have a tenant_id set if NULL
        query := format('UPDATE %I SET tenant_id = %L WHERE tenant_id IS NULL;', table_name, tenant_id);
        EXECUTE query;

        -- Add NOT NULL constraint (if all tenant_id values are now set)
        query := format('ALTER TABLE %I ALTER COLUMN tenant_id SET NOT NULL;', table_name);
        EXECUTE query;

        -- Add foreign key constraint to tenants table
        query := format(
            'ALTER TABLE %I ADD CONSTRAINT fk_%I_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;',
            table_name, table_name
        );
        EXECUTE query;

        -- Enable Row Level Security (RLS) on the table
        query := format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY;', table_name);
        EXECUTE query;

        -- Create a single policy for ALL actions
        query := format('CREATE POLICY "Only tenanted user can CRUD"
                        ON %I
                        FOR ALL
                        USING ((is_tenant_user(tenant_id) OR is_tenant_owner(tenant_id) OR is_system_admin()))
                        WITH CHECK ((is_tenant_user(tenant_id) OR is_tenant_owner(tenant_id) OR is_system_admin()));',
        table_name);
        EXECUTE query; 
    END IF;

    -- Check if the trigger already exists
    SELECT COUNT(*) INTO trigger_exists
    FROM pg_trigger 
    WHERE tgname = format('trigger_update_timestamp_%s', table_name);

    -- Add trigger for auto-updating updated_at if it doesn't exist
    IF trigger_exists = 0 THEN
        query := format('
            CREATE TRIGGER trigger_update_timestamp_%I
            BEFORE UPDATE ON %I
            FOR EACH ROW
            EXECUTE FUNCTION update_timestamp();',
            table_name, table_name);
        EXECUTE query;
    END IF;

END;
$$;


ALTER FUNCTION "public"."add_default_columns"("table_name" "text", "add_tenant_id" boolean, "tenant_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."apply_custom_migration"("migration_name" "text") RETURNS "void"
    LANGUAGE "plpgsql"
    AS $$
declare
  mig record;
begin
  select * into mig from custom_migrations
  where name = migration_name and success = false
  for update;

  if not found then
    raise exception 'Migration not found or already applied';
  end if;

  execute mig.sql;

  update custom_migrations
  set applied_at = now(), success = true
  where id = mig.id;
exception
  when others then
    update custom_migrations
    set error = sqlerrm, applied_at = now()
    where id = mig.id;
    raise;
end;
$$;


ALTER FUNCTION "public"."apply_custom_migration"("migration_name" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."apply_system_admin_rls_policy"("_table_name" "text") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
begin
  -- Enable RLS on the table
  execute format('alter table %I enable row level security', _table_name);

  -- Drop any existing policies with the same name to avoid conflicts
  execute format('drop policy if exists system_admin_access on %I', _table_name);

  -- Create a new restrictive policy using is_system_admin()
  execute format(
    'create policy system_admin_access on %I for all using (is_system_admin()) with check (is_system_admin())',
    _table_name
  );
end;
$$;


ALTER FUNCTION "public"."apply_system_admin_rls_policy"("_table_name" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."batch_decrypt_jsonb_fields"("_table_name" "text", "_id_column" "text", "_ids" "uuid"[], "_encrypted_fields" "text"[], "_encryption_key" "text") RETURNS SETOF "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $_$
DECLARE
  sql TEXT;
  decrypted_fields TEXT := '';
  i INT;
BEGIN
  IF _encryption_key IS NULL THEN
    RAISE EXCEPTION 'Encryption key must be provided';
  END IF;

  -- Dynamically construct SELECT field list
  FOR i IN 1 .. array_length(_encrypted_fields, 1) LOOP
    decrypted_fields := decrypted_fields || format(
      'pgp_sym_decrypt(%I, %L)::jsonb AS %I',
      _encrypted_fields[i], _encryption_key, _encrypted_fields[i]
    );

    IF i < array_length(_encrypted_fields, 1) THEN
      decrypted_fields := decrypted_fields || ', ';
    END IF;
  END LOOP;

  -- Compose the dynamic SQL
  sql := format(
    'SELECT row_to_json(t)::jsonb FROM (
       SELECT %I AS id, %s
       FROM %I
       WHERE %I = ANY ($1)
     ) t',
    _id_column,
    decrypted_fields,
    _table_name,
    _id_column
  );

  -- Execute and return
  RETURN QUERY EXECUTE sql USING _ids;
END;
$_$;


ALTER FUNCTION "public"."batch_decrypt_jsonb_fields"("_table_name" "text", "_id_column" "text", "_ids" "uuid"[], "_encrypted_fields" "text"[], "_encryption_key" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."build_default_permissions"() RETURNS "jsonb"
    LANGUAGE "sql" STABLE
    AS $$
  SELECT jsonb_build_object(
    'system_roles', jsonb_build_object(
      'create', to_jsonb(array['super-admin', 'tenant-owner']),
      'read', to_jsonb(array['super-admin', 'tenant-owner']),
      'update', to_jsonb(array['super-admin', 'tenant-owner']),
      'delete', to_jsonb(array['super-admin', 'tenant-owner'])
    ),
    'custom_roles', jsonb_build_object(
      'create', '[]'::jsonb,
      'read', '[]'::jsonb,
      'update', '[]'::jsonb,
      'delete', '[]'::jsonb
    )
  );
$$;


ALTER FUNCTION "public"."build_default_permissions"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."can_access_tenant_data"("target_tenant_id" "uuid", "allowed_roles" "public"."user_role_type"[]) RETURNS boolean
    LANGUAGE "sql" STABLE
    AS $$
  select
    is_tenant_user(target_tenant_id) and
    exists (
      select 1
      from unnest(allowed_roles) as role
      where has_role(auth.uid(), target_tenant_id, role)
    )
$$;


ALTER FUNCTION "public"."can_access_tenant_data"("target_tenant_id" "uuid", "allowed_roles" "public"."user_role_type"[]) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."cleanup_oauth_states"() RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  DELETE FROM oauth_states WHERE expires_at < now();
END;
$$;


ALTER FUNCTION "public"."cleanup_oauth_states"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."create_custom_table"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$DECLARE
    v_table_exists BOOLEAN;
    v_create_table_query TEXT;
BEGIN
    -- Check if the custom table already exists
    SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'ct_' || NEW.name
    ) INTO v_table_exists;
    
    IF NOT v_table_exists THEN
        -- Create the physical table for the custom table definition
        v_create_table_query := format(
            'CREATE TABLE public.ct_%I (
                id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
                tenant_id UUID NOT NULL REFERENCES tenants(id),
                created_at TIMESTAMP DEFAULT NOW(),
                updated_at TIMESTAMP DEFAULT NOW(),
                deleted_at TIMESTAMP NULL
            )',
            NEW.name
        );
        
        EXECUTE v_create_table_query;
        
        -- Enable Row Level Security
        EXECUTE format(
            'ALTER TABLE public.ct_%I ENABLE ROW LEVEL SECURITY',
            NEW.name
        );
        
        -- Create a policy for tenant access
        EXECUTE format(
            'CREATE POLICY tenant_isolation_policy ON public.ct_%I
             FOR ALL
             USING (is_tenant_user())',
            NEW.name
        );
        
        -- Create update timestamp trigger
        EXECUTE format(
            'CREATE TRIGGER trigger_update_timestamp
             BEFORE UPDATE ON public.ct_%I
             FOR EACH ROW
             EXECUTE FUNCTION update_timestamp()',
            NEW.name
        );
    END IF;
    
    RETURN NEW;
END;$$;


ALTER FUNCTION "public"."create_custom_table"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."create_message_for_conversations"("conversation_ids" "uuid"[], "message_data" "jsonb", "encryption_key" "text" DEFAULT NULL::"text") RETURNS "jsonb"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  new_message_record RECORD;
  encrypted BYTEA := NULL;
BEGIN
  -- Encrypt if encryption_key is provided
  IF encryption_key IS NOT NULL THEN
    encrypted := pgp_sym_encrypt(message_data->>'content', encryption_key);
  END IF;

  -- Insert message with both content & encrypted_content support
  INSERT INTO messages (
    connected_service_id,
    tenant_id,
    user_id,
    content,
    encrypted_content,
    role,
    metadata,
    reply_to,
    id
  )
  VALUES (
    (message_data->>'connected_service_id')::UUID,
    (message_data->>'tenant_id')::UUID,
    (message_data->>'user_id')::UUID,
    CASE
      WHEN encryption_key IS NULL THEN message_data->'content'
      ELSE jsonb_build_object('note', 'encrypted')
    END,
    encrypted,
    message_data->>'role',
    message_data->'metadata',
    COALESCE((message_data->>'reply_to')::UUID, NULL),
    COALESCE((message_data->>'id')::UUID, gen_random_uuid())
  )
  RETURNING * INTO new_message_record;

  -- Link to conversations
  INSERT INTO conversation_messages (conversation_id, message_id)
  SELECT cid, new_message_record.id FROM unnest(conversation_ids) AS cid;

  -- Return full message as JSONB
  RETURN to_jsonb(new_message_record);
EXCEPTION WHEN OTHERS THEN
  RAISE EXCEPTION 'Failed to create message or assign to conversations: %', SQLERRM;
END;
$$;


ALTER FUNCTION "public"."create_message_for_conversations"("conversation_ids" "uuid"[], "message_data" "jsonb", "encryption_key" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."create_rls_policy"("target_table" "regclass", "policy_suffix" "text" DEFAULT 'tenant'::"text", "with_user_check" boolean DEFAULT false, "with_tenant_check" boolean DEFAULT true, "apply_select" boolean DEFAULT true, "apply_insert" boolean DEFAULT false, "apply_update" boolean DEFAULT false, "apply_delete" boolean DEFAULT false, "override_roles" "text"[] DEFAULT ARRAY[]::"text"[], "drop_existing" boolean DEFAULT false) RETURNS "void"
    LANGUAGE "plpgsql"
    AS $$
declare
  base_clause text := '';
  user_clause text := '((auth.uid())::uuid = user_id)';
  admin_clause text := '';
  rls_using text;
  rls_check text;
  cmds text[] := '{}';
  cmd text;
  policy_name text;
  r record;
begin
  -- Optional: drop ALL existing policies
  if drop_existing then
    for r in
      select policyname
      from pg_policies
      where schemaname || '.' || tablename = target_table::text
    loop
      execute format('drop policy if exists "%I" on %s;', r.policyname, target_table);
    end loop;
  end if;

  -- Base tenant check if enabled
  if with_tenant_check then
    base_clause := '(is_tenant_user(tenant_id))';
  else
    base_clause := 'true'; -- always pass if tenant check is off
  end if;

  -- Build override clause if any override roles are given
  if array_length(override_roles, 1) > 0 then
    admin_clause := '(' || array_to_string(override_roles, ' OR ') || ')';
  end if;

  -- Build USING and WITH CHECK expressions
  rls_using := base_clause;
  if with_user_check then
    rls_using := rls_using || ' AND ' || user_clause;
  end if;
  if admin_clause <> '' then
    rls_using := '(' || rls_using || ') OR ' || admin_clause;
  end if;

  rls_check := rls_using;

  -- Enable RLS
  execute format('alter table %s enable row level security;', target_table);

  -- Commands to apply
  if apply_select then cmds := array_append(cmds, 'select'); end if;
  if apply_insert then cmds := array_append(cmds, 'insert'); end if;
  if apply_update then cmds := array_append(cmds, 'update'); end if;
  if apply_delete then cmds := array_append(cmds, 'delete'); end if;

  -- Create one policy per command
  foreach cmd in array cmds loop
    policy_name := format('%s_%s_policy', policy_suffix, cmd);
    execute format('drop policy if exists "%I" on %s;', policy_name, target_table);

    if cmd in ('insert', 'update') then
      execute format(
        'create policy "%I" on %s for %s using (%s) with check (%s);',
        policy_name, target_table, cmd, rls_using, rls_check
      );
    else
      execute format(
        'create policy "%I" on %s for %s using (%s);',
        policy_name, target_table, cmd, rls_using
      );
    end if;
  end loop;
end;
$$;


ALTER FUNCTION "public"."create_rls_policy"("target_table" "regclass", "policy_suffix" "text", "with_user_check" boolean, "with_tenant_check" boolean, "apply_select" boolean, "apply_insert" boolean, "apply_update" boolean, "apply_delete" boolean, "override_roles" "text"[], "drop_existing" boolean) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."create_tenant_request"("workspace_name" "text", "user_email" "text") RETURNS "uuid"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  request_id uuid;
BEGIN
  -- Insert the tenant request and return the ID
  INSERT INTO public.tenant_requests (
    workspace,
    user_id,
    user_email,
    status
  ) VALUES (
    workspace_name,
    auth.uid(),
    user_email,
    'pending'
  )
  RETURNING id INTO request_id;
  
  RETURN request_id;
END;
$$;


ALTER FUNCTION "public"."create_tenant_request"("workspace_name" "text", "user_email" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."decrypt_function_task"("_id" "uuid", "_encryption_key" "text") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  raw BYTEA;
  decrypted TEXT;
  result JSONB;
BEGIN
  SELECT payload_encrypted INTO raw
  FROM function_queue
  WHERE id = _id;

  IF raw IS NULL THEN
    RAISE EXCEPTION 'No encrypted payload found for ID %', _id;
  END IF;

  decrypted := pgp_sym_decrypt(raw, _encryption_key);

  SELECT jsonb_build_object(
    'id', id,
    'action', action,
    'status', status,
    'created_at', created_at,
    'payload', decrypted::jsonb
  )
  INTO result
  FROM function_queue
  WHERE id = _id;

  RETURN result;
END;
$$;


ALTER FUNCTION "public"."decrypt_function_task"("_id" "uuid", "_encryption_key" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."decrypt_jsonb_payload"("_encrypted" "bytea", "_encryption_key" "text") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  decrypted TEXT;
BEGIN
  IF _encryption_key IS NULL THEN
    RAISE EXCEPTION 'Encryption key must be provided';
  END IF;

  decrypted := pgp_sym_decrypt(_encrypted, _encryption_key);
  RETURN decrypted::JSONB;
END;
$$;


ALTER FUNCTION "public"."decrypt_jsonb_payload"("_encrypted" "bytea", "_encryption_key" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."decrypt_message"("_message_id" "uuid", "_decryption_key" "text") RETURNS "text"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  result TEXT;
BEGIN
  SELECT 
    CASE 
      WHEN encrypted_content IS NOT NULL THEN pgp_sym_decrypt(encrypted_content, _decryption_key)
      ELSE content::TEXT
    END
  INTO result
  FROM messages
  WHERE id = _message_id;

  RETURN result;
END;
$$;


ALTER FUNCTION "public"."decrypt_message"("_message_id" "uuid", "_decryption_key" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."decrypt_refresh_token"("_credential_id" "uuid", "_encryption_key" "text") RETURNS "text"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  decrypted TEXT;
BEGIN
  SELECT pgp_sym_decrypt(refresh_token, _encryption_key)
  INTO decrypted
  FROM credentials
  WHERE id = _credential_id;

  RETURN decrypted;
END;
$$;


ALTER FUNCTION "public"."decrypt_refresh_token"("_credential_id" "uuid", "_encryption_key" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."delete_custom_table_record"("p_table_name" "text", "p_record_id" "uuid", "p_tenant_id" "uuid") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    v_table_exists BOOLEAN;
    v_record_exists BOOLEAN;
    v_query TEXT;
BEGIN
    -- Check if the table exists
    SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'ct_' || p_table_name
    ) INTO v_table_exists;
    
    IF NOT v_table_exists THEN
        RAISE EXCEPTION 'Table does not exist: ct_%', p_table_name;
    END IF;
    
    -- Check if the record exists and belongs to the tenant
    EXECUTE format(
        'SELECT EXISTS (SELECT 1 FROM public.ct_%I WHERE id = %L AND tenant_id = %L AND deleted_at IS NULL)',
        p_table_name, p_record_id, p_tenant_id
    ) INTO v_record_exists;
    
    IF NOT v_record_exists THEN
        RAISE EXCEPTION 'Record not found or does not belong to the tenant';
    END IF;
    
    -- Build and execute the soft delete query
    v_query := format(
        'UPDATE public.ct_%I SET deleted_at = NOW() WHERE id = %L AND tenant_id = %L',
        p_table_name, p_record_id, p_tenant_id
    );
    
    BEGIN
        EXECUTE v_query;
    EXCEPTION WHEN OTHERS THEN
        RAISE EXCEPTION 'Error deleting record: %', SQLERRM;
    END;
END;
$$;


ALTER FUNCTION "public"."delete_custom_table_record"("p_table_name" "text", "p_record_id" "uuid", "p_tenant_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."delete_expired_oauth_states"() RETURNS "void"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  DELETE FROM oauth_states WHERE expires_at < now();
END;
$$;


ALTER FUNCTION "public"."delete_expired_oauth_states"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."encrypt_credentials_trigger"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  key TEXT := current_setting('app.encryption_key', true);
BEGIN
  -- Fail early if the encryption key is missing
  IF key IS NULL THEN
    RAISE EXCEPTION 'Encryption key is not set in session. Set app.encryption_key using x-postgres-settings.';
  END IF;

  IF NEW.access_token IS NOT NULL THEN
    NEW.access_token := pgp_sym_encrypt(NEW.access_token::TEXT, key);
  END IF;

  IF NEW.refresh_token IS NOT NULL THEN
    NEW.refresh_token := pgp_sym_encrypt(NEW.refresh_token::TEXT, key);
  END IF;

  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."encrypt_credentials_trigger"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."encrypt_json_payload"("json_data" "jsonb", "key" "text") RETURNS "bytea"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  RETURN pgp_sym_encrypt(json_data::TEXT, key);
END;
$$;


ALTER FUNCTION "public"."encrypt_json_payload"("json_data" "jsonb", "key" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."encrypt_jsonb_payload"("_payload" "jsonb", "_encryption_key" "text") RETURNS "bytea"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  IF _encryption_key IS NULL THEN
    RAISE EXCEPTION 'Encryption key must be provided';
  END IF;

  RETURN pgp_sym_encrypt(_payload::TEXT, _encryption_key);
END;
$$;


ALTER FUNCTION "public"."encrypt_jsonb_payload"("_payload" "jsonb", "_encryption_key" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."enqueue_function_task"("_action" "text", "_payload" "jsonb", "_encryption_key" "text", "_priority" "text" DEFAULT 'medium'::"text") RETURNS "uuid"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
declare
  encrypted BYTEA;
  inserted_id UUID;
begin
  if _encryption_key is null then
    raise exception 'Encryption key must be provided';
  end if;

  encrypted := pgp_sym_encrypt(_payload::text, _encryption_key);

  insert into function_queue (action, payload_encrypted, priority)
  values (_action, encrypted, _priority)
  returning id into inserted_id;

  return inserted_id;
end;
$$;


ALTER FUNCTION "public"."enqueue_function_task"("_action" "text", "_payload" "jsonb", "_encryption_key" "text", "_priority" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_conversation_messages"("_conversation_id" "uuid", "_decryption_key" "text" DEFAULT NULL::"text", "_search" "text" DEFAULT NULL::"text", "_metadata_search" "text" DEFAULT NULL::"text", "_role" "text" DEFAULT NULL::"text", "_limit" integer DEFAULT 50, "_offset" integer DEFAULT 0, "_order" "text" DEFAULT 'created_at'::"text", "_sort_direction" "text" DEFAULT 'asc'::"text", "_include_deleted" boolean DEFAULT false) RETURNS "public"."paginated_messages"
    LANGUAGE "plpgsql"
    AS $_$
DECLARE
  sql TEXT;
  count_sql TEXT;
  result paginated_messages;
BEGIN
  -- Compose SQL for fetching paginated results
  sql := format($f$
    SELECT %s
    FROM conversation_messages cm
    JOIN messages m ON cm.message_id = m.id
    LEFT JOIN profiles u ON m.user_id = u.id
    WHERE cm.conversation_id = $1
      AND ($2::BOOLEAN OR m.deleted_at IS NULL)
      AND ($3 IS NULL OR m.role = $3)
      AND (
        $4 IS NULL OR
        u.username ILIKE '%%' || $4 || '%%' OR
        u.display_name ILIKE '%%' || $4 || '%%' OR
        (
          m.encrypted_content IS NOT NULL AND 
          pgp_sym_decrypt(m.encrypted_content, $8)::TEXT ILIKE '%%' || $4 || '%%'
        ) OR
        (
          m.encrypted_content IS NULL AND 
          m.content::TEXT ILIKE '%%' || $4 || '%%'
        )
      )
      AND ($5 IS NULL OR m.metadata::TEXT ILIKE '%%' || $5 || '%%')
    ORDER BY %I %s
    LIMIT $6 OFFSET $7
  $f$, shared_message_columns(_decryption_key), _order, _sort_direction);

  -- Compose SQL for counting total results
  count_sql := $f$
    SELECT count(*)
    FROM conversation_messages cm
    JOIN messages m ON cm.message_id = m.id
    LEFT JOIN profiles u ON m.user_id = u.id
    WHERE cm.conversation_id = $1
      AND ($2::BOOLEAN OR m.deleted_at IS NULL)
      AND ($3 IS NULL OR m.role = $3)
      AND (
        $4 IS NULL OR
        u.username ILIKE '%%' || $4 || '%%' OR
        u.display_name ILIKE '%%' || $4 || '%%' OR
        (
          m.encrypted_content IS NOT NULL AND 
          pgp_sym_decrypt(m.encrypted_content, $6)::TEXT ILIKE '%%' || $4 || '%%'
        ) OR
        (
          m.encrypted_content IS NULL AND 
          m.content::TEXT ILIKE '%%' || $4 || '%%'
        )
      )
      AND ($5 IS NULL OR m.metadata::TEXT ILIKE '%%' || $5 || '%%')
  $f$;

  -- Log inputs for debug
  RAISE NOTICE 'Running get_conversation_messages with convo_id %, offset %, limit %', _conversation_id, _offset, _limit;

  -- Run both queries
  EXECUTE format('SELECT ARRAY(SELECT row FROM (%s) AS row)', sql)
    USING _conversation_id, _include_deleted, _role, _search, _metadata_search, _limit, _offset, _decryption_key
    INTO result.messages;

  EXECUTE count_sql
    USING _conversation_id, _include_deleted, _role, _search, _metadata_search, _decryption_key
    INTO result.total_count;

  result.has_more := result.total_count > (_offset + _limit);

  RETURN result;
END;
$_$;


ALTER FUNCTION "public"."get_conversation_messages"("_conversation_id" "uuid", "_decryption_key" "text", "_search" "text", "_metadata_search" "text", "_role" "text", "_limit" integer, "_offset" integer, "_order" "text", "_sort_direction" "text", "_include_deleted" boolean) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_custom_table_data"("p_table_name" "text", "p_tenant_id" "uuid") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    v_table_exists BOOLEAN;
    v_result JSONB;
    v_query TEXT;
BEGIN
    -- Check if the table exists
    SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'ct_' || p_table_name
    ) INTO v_table_exists;
    
    IF NOT v_table_exists THEN
        RETURN '[]'::JSONB;
    END IF;
    
    -- Build the query to get data from the custom table
    v_query := format(
        'SELECT jsonb_agg(data) FROM (SELECT * FROM public.ct_%I WHERE tenant_id = %L AND deleted_at IS NULL) data',
        p_table_name, p_tenant_id
    );
    
    -- Execute the query
    EXECUTE v_query INTO v_result;
    
    -- Return empty array if null
    RETURN COALESCE(v_result, '[]'::JSONB);
END;
$$;


ALTER FUNCTION "public"."get_custom_table_data"("p_table_name" "text", "p_tenant_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_field_types"() RETURNS SETOF "public"."field_type_enum"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  RETURN QUERY SELECT unnest(enum_range(NULL::field_type_enum));
END;
$$;


ALTER FUNCTION "public"."get_field_types"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_message"("_message_id" "uuid", "_decryption_key" "text" DEFAULT NULL::"text") RETURNS TABLE("conversation_id" "uuid", "id" "uuid", "tenant_id" "uuid", "user_id" "uuid", "reply_to" "uuid", "content" "jsonb", "role" character varying, "metadata" "jsonb", "created_at" timestamp without time zone, "updated_at" timestamp without time zone, "deleted_at" timestamp without time zone, "display_name" "text", "username" "text", "avatar_url" "text")
    LANGUAGE "plpgsql"
    AS $_$
DECLARE
  sql TEXT;
BEGIN
  sql := format($f$
    SELECT
      cm.conversation_id,
      m.id,
      m.tenant_id,
      m.user_id,
      m.reply_to,
      CASE 
        WHEN m.encrypted_content IS NOT NULL THEN pgp_sym_decrypt(m.encrypted_content, %L)::JSONB
        ELSE m.content
      END AS content,
      m.role,
      m.metadata,
      m.created_at,
      m.updated_at,
      m.deleted_at,
      u.display_name,
      u.username,
      u.avatar_url
    FROM
      conversation_messages cm
    JOIN
      messages m ON cm.message_id = m.id
    LEFT JOIN
      profiles u ON m.user_id = u.id
    WHERE
      cm.id = %L
  $f$,
    _decryption_key,
    _message_id
  );

  RETURN QUERY EXECUTE sql;
END;
$_$;


ALTER FUNCTION "public"."get_message"("_message_id" "uuid", "_decryption_key" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_message_by_id"("_message_id" "uuid", "_decryption_key" "text" DEFAULT NULL::"text") RETURNS SETOF "public"."message_with_profile"
    LANGUAGE "plpgsql"
    AS $_$
DECLARE
  sql TEXT;
BEGIN
  -- Inject column list with decryption into the SELECT statement
  sql := format('SELECT %s FROM conversation_messages cm
                 JOIN messages m ON cm.message_id = m.id
                 LEFT JOIN profiles u ON m.user_id = u.id
                 WHERE cm.message_id = $1', shared_message_columns(_decryption_key));

  RAISE NOTICE 'Running get_message_by_id with message_id = %', _message_id;
  RETURN QUERY EXECUTE sql USING _message_id;
END;
$_$;


ALTER FUNCTION "public"."get_message_by_id"("_message_id" "uuid", "_decryption_key" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_next_decrypted_function_tasks"("_batch_size" integer, "_encryption_key" "text", "_task_id" "uuid" DEFAULT NULL::"uuid", "_priority" "text" DEFAULT NULL::"text") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
declare
  tasks jsonb := '[]'::jsonb;
  task_record record;
  decrypted text;
begin
  -- If a specific task ID is provided
  if _task_id is not null then
    update function_queue
    set status = 'processing',
        processing_started_at = now()
    where id = _task_id
      and status = 'pending'
    returning * into task_record;

    if task_record is null then
      return '[]'::jsonb; -- No match found
    end if;

    decrypted := pgp_sym_decrypt(task_record.payload_encrypted, _encryption_key);

    tasks := tasks || jsonb_build_object(
      'id', task_record.id,
      'action', task_record.action,
      'status', task_record.status,
      'priority', task_record.priority,
      'created_at', task_record.created_at,
      'payload', decrypted::jsonb
    );
  else
    -- Batch mode: get next N pending tasks, optionally filtered by priority
    for task_record in
      with locked_tasks as (
        select *
        from function_queue
        where status = 'pending'
          and (_priority is null or priority = _priority)
        order by created_at
        limit _batch_size
        for update skip locked
      )
      update function_queue
      set status = 'processing',
          processing_started_at = now()
      from locked_tasks
      where function_queue.id = locked_tasks.id
      returning function_queue.*
    loop
      decrypted := pgp_sym_decrypt(task_record.payload_encrypted, _encryption_key);

      tasks := tasks || jsonb_build_object(
        'id', task_record.id,
        'action', task_record.action,
        'status', task_record.status,
        'priority', task_record.priority,
        'created_at', task_record.created_at,
        'payload', decrypted::jsonb
      );
    end loop;
  end if;

  return tasks;
end;
$$;


ALTER FUNCTION "public"."get_next_decrypted_function_tasks"("_batch_size" integer, "_encryption_key" "text", "_task_id" "uuid", "_priority" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_table_schema"("t_name" "text") RETURNS TABLE("column_name" "text", "data_type" "text", "character_maximum_length" integer, "is_nullable" "text", "column_default" "text")
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    RETURN QUERY
    SELECT 
        c.column_name::text,  -- Explicitly cast to text
        c.data_type::text,     -- Explicitly cast to text
        c.character_maximum_length::integer,
        CASE 
            WHEN c.is_nullable = 'YES' THEN 'YES'
            ELSE 'NO'
        END AS is_nullable,
        c.column_default::text  -- Explicitly cast to text
    FROM 
        information_schema.columns AS c
    WHERE 
        c.table_name = t_name
    ORDER BY 
        c.ordinal_position;
END;
$$;


ALTER FUNCTION "public"."get_table_schema"("t_name" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_user_tenants"("user_id" "uuid") RETURNS TABLE("id" "uuid", "name" "text", "workspace" "text", "tenant_owner_id" "uuid", "is_primary_tenant" boolean)
    LANGUAGE "sql"
    AS $$
  select
    t.id,
    t.name,
    t.workspace,
    t.tenant_owner_id,
    case
      when t.tenant_owner_id = user_id then true
      when tu.user_id is not null then tu.is_primary_tenant
      else false
    end as is_primary_tenant
  from tenants t
  left join tenant_users tu
    on tu.tenant_id = t.id and tu.user_id = user_id
  where t.tenant_owner_id = user_id
     or tu.user_id is not null
$$;


ALTER FUNCTION "public"."get_user_tenants"("user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_new_user"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  INSERT INTO public.profiles (id, username)
  VALUES (new.id, new.email);
  RETURN new;
END;
$$;


ALTER FUNCTION "public"."handle_new_user"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."has_role"("_user_id" "uuid", "_tenant_id" "uuid", "_role" "public"."user_role_type") RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND tenant_id = _tenant_id
      AND role_type = _role
  );
$$;


ALTER FUNCTION "public"."has_role"("_user_id" "uuid", "_tenant_id" "uuid", "_role" "public"."user_role_type") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."has_row_permission"("target_tenant_id" "uuid", "perms" "jsonb", "action" "text") RETURNS boolean
    LANGUAGE "sql" STABLE
    AS $$
  select exists (
    select 1 from jsonb_array_elements_text(perms -> 'system_roles' -> action)
    where value = auth.role()
  )
  or exists (
    select 1 from jsonb_array_elements_text(perms -> 'custom_roles' -> action)
    where has_role(auth.uid(), target_tenant_id, value::user_role_type)
  )
  AND is_tenant_user(target_tenant_id)
$$;


ALTER FUNCTION "public"."has_row_permission"("target_tenant_id" "uuid", "perms" "jsonb", "action" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."import_custom_table_data"("import_data" "jsonb", "input_tenant_id" "uuid") RETURNS "void"
    LANGUAGE "plpgsql"
    AS $$
declare
  record_obj jsonb;
  progress integer := 0;
  total integer := jsonb_array_length(import_data -> 'records');
  table_id uuid;
  table_name text;
begin
  -- Init progress
  insert into custom_table_data_progress (tenant_id, status, current_step, total_steps)
  values (input_tenant_id, 'initializing', 0, total)
  on conflict (tenant_id)
  do update set status = 'initializing', current_step = 0, total_steps = total, updated_at = now();

  -- Loop through and insert records
  for record_obj in select * from jsonb_array_elements(import_data -> 'records')
  loop
    table_id := (record_obj ->> 'table_id')::uuid;
    table_name := record_obj ->> 'table_name';

    insert into custom_table_data (
      table_id,
      table_name,
      data,
      metadata,
      tenant_id
    ) values (
      table_id,
      table_name,
      record_obj -> 'data',
      coalesce(record_obj -> 'metadata', '{}'),
      input_tenant_id
    );

    progress := progress + 1;

    update custom_table_data_progress
    set current_step = progress,
        status = 'processing',
        last_table = table_name,
        last_table_id = table_id,
        updated_at = now()
    where tenant_id = input_tenant_id;
  end loop;

  update custom_table_data_progress
  set status = 'complete',
      current_step = total,
      updated_at = now()
  where tenant_id = input_tenant_id;

exception
  when others then
    update custom_table_data_progress
    set status = 'error: ' || sqlerrm, updated_at = now()
    where tenant_id = input_tenant_id;
    raise;
end;
$$;


ALTER FUNCTION "public"."import_custom_table_data"("import_data" "jsonb", "input_tenant_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."insert_and_trigger_function_task"("_action" "text", "_payload" "jsonb", "_encryption_key" "text", "_function_url" "text", "_service_role_key" "text") RETURNS "uuid"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  encrypted BYTEA;
  new_id UUID;
  response JSON;
BEGIN
  IF _encryption_key IS NULL THEN
    RAISE EXCEPTION 'Encryption key must be provided';
  END IF;

  IF _function_url IS NULL OR _service_role_key IS NULL THEN
    RAISE EXCEPTION 'Function URL and service role key must be provided';
  END IF;

  -- Encrypt the payload
  encrypted := pgp_sym_encrypt(_payload::TEXT, _encryption_key);

  -- Insert into function_queue
  INSERT INTO function_queue (
    action,
    payload_encrypted
  )
  VALUES (
    _action,
    encrypted
  )
  RETURNING id INTO new_id;

  -- Trigger the edge function via HTTP POST
  SELECT http_post(
    _function_url,
    json_build_object('task_id', new_id)::TEXT,
    'Content-Type: application/json'::TEXT,
    'Authorization: Bearer ' || _service_role_key
  ) INTO response;

  RETURN new_id;
END;
$$;


ALTER FUNCTION "public"."insert_and_trigger_function_task"("_action" "text", "_payload" "jsonb", "_encryption_key" "text", "_function_url" "text", "_service_role_key" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."insert_credential"("_encryption_key" "text", "_access_token" "text", "_refresh_token" "text", "_scopes" "text"[], "_type" "text", "_user_id" "uuid", "_tenant_id" "uuid", "_expires_at" timestamp without time zone, "_provider" "text", "_encryption_key_id" "uuid", "_name" "text" DEFAULT NULL::"text", "_domain" "text" DEFAULT NULL::"text", "_password" "text" DEFAULT NULL::"text", "_username" "text" DEFAULT NULL::"text", "_tid" "text" DEFAULT NULL::"text", "_associated_email" "text" DEFAULT NULL::"text") RETURNS "uuid"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  encrypted_access BYTEA;
  encrypted_refresh BYTEA;
  new_id UUID;
BEGIN
  IF _encryption_key IS NULL THEN
    RAISE EXCEPTION 'Encryption key must be provided.';
  END IF;

  IF _access_token IS NOT NULL THEN
    encrypted_access := pgp_sym_encrypt(_access_token, _encryption_key);
  END IF;

  IF _refresh_token IS NOT NULL THEN
    encrypted_refresh := pgp_sym_encrypt(_refresh_token, _encryption_key);
  END IF;



  INSERT INTO credentials (
    username,
    password,
    access_token,
    refresh_token,
    scopes,
    type,
    domain,
    user_id,
    tenant_id,
    expires_at,
    name,
    encryption_key_id,
    provider,
    tid,
    associated_email
  ) VALUES (
    _username,
    _password,
    encrypted_access,
    encrypted_refresh,
    _scopes,
    _type,
    _domain,
    _user_id,
    _tenant_id,
    _expires_at,
    _name,
    _encryption_key_id,
    _provider,
    _tid,
    _associated_email
  ) RETURNING id INTO new_id;

  RETURN new_id;
END;
$$;


ALTER FUNCTION "public"."insert_credential"("_encryption_key" "text", "_access_token" "text", "_refresh_token" "text", "_scopes" "text"[], "_type" "text", "_user_id" "uuid", "_tenant_id" "uuid", "_expires_at" timestamp without time zone, "_provider" "text", "_encryption_key_id" "uuid", "_name" "text", "_domain" "text", "_password" "text", "_username" "text", "_tid" "text", "_associated_email" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."insert_custom_table_record"("p_table_name" "text", "p_tenant_id" "uuid", "p_data" "jsonb") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    v_table_exists BOOLEAN;
    v_columns TEXT;
    v_values TEXT;
    v_query TEXT;
    v_record_id UUID := gen_random_uuid();
    v_result JSONB;
BEGIN
    -- Check if the table exists
    SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'ct_' || p_table_name
    ) INTO v_table_exists;
    
    IF NOT v_table_exists THEN
        RAISE EXCEPTION 'Table does not exist: ct_%', p_table_name;
    END IF;
    
    -- Start with the default columns
    v_columns := 'id, tenant_id, created_at';
    v_values := quote_literal(v_record_id) || ', ' || quote_literal(p_tenant_id) || ', NOW()';
    
    -- Add columns and values from the provided data
    FOR i IN 0..jsonb_array_length(jsonb_object_keys(p_data)::jsonb) - 1 LOOP
        v_columns := v_columns || ', ' || quote_ident(jsonb_object_keys(p_data)::jsonb->i#>>'{}');
        
        -- Handle different data types appropriately
        IF jsonb_typeof(p_data->(jsonb_object_keys(p_data)::jsonb->i#>>'{}')) = 'null' THEN
            v_values := v_values || ', NULL';
        ELSIF jsonb_typeof(p_data->(jsonb_object_keys(p_data)::jsonb->i#>>'{}')) = 'boolean' THEN
            v_values := v_values || ', ' || (p_data->(jsonb_object_keys(p_data)::jsonb->i#>>'{}'))::TEXT;
        ELSE
            v_values := v_values || ', ' || quote_literal(p_data->(jsonb_object_keys(p_data)::jsonb->i#>>'{}'));
        END IF;
    END LOOP;
    
    -- Build and execute the INSERT query
    v_query := format(
        'INSERT INTO public.ct_%I (%s) VALUES (%s) RETURNING id',
        p_table_name, v_columns, v_values
    );
    
    BEGIN
        EXECUTE v_query INTO v_record_id;
    EXCEPTION WHEN OTHERS THEN
        RAISE EXCEPTION 'Error inserting record: %', SQLERRM;
    END;
    
    -- Return the inserted record ID
    RETURN jsonb_build_object('id', v_record_id);
END;
$$;


ALTER FUNCTION "public"."insert_custom_table_record"("p_table_name" "text", "p_tenant_id" "uuid", "p_data" "jsonb") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."insert_custom_tables"("schema_data" "jsonb", "input_tenant_id" "uuid") RETURNS "jsonb"
    LANGUAGE "plpgsql"
    AS $$
declare
  t jsonb;
  f jsonb;
  rel jsonb;
  table_id uuid;
  progress integer := 0;
  total integer;
  created_tables jsonb := '[]';
begin
  total := jsonb_array_length(schema_data -> 'tables');

  insert into custom_table_progress (tenant_id, status, current_step, total_steps)
  values (input_tenant_id, 'initializing', 0, total)
  on conflict (tenant_id)
  do update set status = 'initializing', current_step = 0, total_steps = total, updated_at = now();

  for t in select * from jsonb_array_elements(schema_data -> 'tables')
  loop
    if exists (
      select 1 from custom_table_definitions
      where name = t ->> 'name'
      and tenant_id = input_tenant_id
    ) then
      raise exception 'Table % already exists for this tenant', t ->> 'name';
    end if;

    insert into custom_table_definitions (
      id, name, display_name, description, tenant_id, icon, permissions
    ) values (
      gen_random_uuid(),
      t ->> 'name',
      t ->> 'display_name',
      t ->> 'description',
      input_tenant_id,
      '',
      build_default_permissions()
    )
    returning id into table_id;

    for f in select * from jsonb_array_elements(t -> 'fields')
    loop
      insert into custom_table_fields (
        table_id, name, display_name, description, field_type,
        is_required, is_unique, default_value, options, tenant_id,
        relation, validation,
        permissions
      ) values (
        table_id,
        f ->> 'name',
        f ->> 'display_name',
        f ->> 'description',
        (f ->> 'field_type')::field_type_enum,
        (f ->> 'is_required')::boolean,
        (f ->> 'is_unique')::boolean,
        nullif(f ->> 'default_value', '')::text,
        f -> 'options',
        input_tenant_id,
        f -> 'relation',
        f -> 'validation',
        build_default_permissions()
      );
    end loop;

    progress := progress + 1;

    update custom_table_progress
    set current_step = progress,
        status = 'processing',
        last_table = t ->> 'name',
        last_table_id = table_id,
        updated_at = now()
    where tenant_id = input_tenant_id;

    created_tables := created_tables || jsonb_build_object(t ->> 'name', table_id);
  end loop;

  for rel in select * from jsonb_array_elements(schema_data -> 'relationships')
  loop
    insert into custom_table_relationships (
      from_table, from_field, to_table, to_field, relationship_type, tenant_id
    ) values (
      rel ->> 'from_table',
      rel ->> 'from_field',
      rel ->> 'to_table',
      rel ->> 'to_field',
      rel ->> 'relationship_type',
      input_tenant_id
    ) on conflict do nothing;
  end loop;

  update custom_table_progress
  set status = 'complete',
      current_step = total,
      updated_at = now()
  where tenant_id = input_tenant_id;

  return created_tables;

exception
  when others then
    update custom_table_progress
    set status = 'error: ' || sqlerrm, updated_at = now()
    where tenant_id = input_tenant_id;
    raise;
end;
$$;


ALTER FUNCTION "public"."insert_custom_tables"("schema_data" "jsonb", "input_tenant_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."insert_user_role"("p_email" "text", "p_tenant_workspace" "text", "p_role" "public"."user_role_type") RETURNS "void"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
    v_user_id uuid;
    v_tenant_id uuid;
BEGIN
    -- Find the user ID based on the provided email
    SELECT id INTO v_user_id
    FROM auth.users
    WHERE email = p_email;

    -- Find the tenant ID based on the provided workspace
    SELECT id INTO v_tenant_id
    FROM public.tenants
    WHERE workspace = p_tenant_workspace;

    -- Check if the user exists
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'User with email % not found', p_email;
    END IF;

    -- Check if the tenant exists
    IF v_tenant_id IS NULL THEN
        RAISE EXCEPTION 'Tenant with workspace % not found', p_tenant_workspace;  -- Corrected here
    END IF;

    -- Insert the role into the roles table
    INSERT INTO public.user_roles ("user_id", "tenant_id", "role_type")  -- Corrected here
    VALUES (v_user_id, v_tenant_id, p_role);

    -- Insert the role into the roles table
    INSERT INTO public.tenant_users ("user_id", "tenant_id")  -- Corrected here
    VALUES (v_user_id, v_tenant_id);
END;
$$;


ALTER FUNCTION "public"."insert_user_role"("p_email" "text", "p_tenant_workspace" "text", "p_role" "public"."user_role_type") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."is_super_admin"("_user_id" "uuid") RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role_type = 'super-admin'
  );
$$;


ALTER FUNCTION "public"."is_super_admin"("_user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."is_system_admin"() RETURNS boolean
    LANGUAGE "sql"
    AS $$
    SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = auth.uid()
      AND role_type = 'system-admin'
  );
$$;


ALTER FUNCTION "public"."is_system_admin"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."is_tenant_owner"("_tenant_id" "uuid") RETURNS boolean
    LANGUAGE "sql"
    AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.tenants
        WHERE tenant_owner_id = auth.uid()
          AND id = _tenant_id
    );
$$;


ALTER FUNCTION "public"."is_tenant_owner"("_tenant_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."is_tenant_user"("_tenant_id" "uuid") RETURNS boolean
    LANGUAGE "sql"
    AS $$
  select
  exists (
    select
      1
    from
      tenant_users
    where
      user_id = auth.uid() AND tenant_id  = _tenant_id
  );
$$;


ALTER FUNCTION "public"."is_tenant_user"("_tenant_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."log_credential_update"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.updated_by := auth.uid();
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."log_credential_update"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."log_oauth_state_insert"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.inserted_by := auth.uid();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."log_oauth_state_insert"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."log_webhook_event"("_tenant_id" "uuid", "_payload" "jsonb", "_encryption_key" "text", "_headers" "jsonb" DEFAULT NULL::"jsonb", "_connected_service_id" "uuid" DEFAULT NULL::"uuid", "_status" "text" DEFAULT 'received'::"text", "_error_message" "text" DEFAULT NULL::"text") RETURNS "uuid"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  inserted_id UUID;
  encrypted BYTEA;
BEGIN
  IF _encryption_key IS NULL THEN
    RAISE EXCEPTION 'Encryption key must be provided';
  END IF;

  encrypted := encrypt_json_payload(_payload, _encryption_key);

  INSERT INTO webhook_events (
    tenant_id,
    encrypted_payload,
    headers,
    connected_service_id,
    status,
    error_message
  ) VALUES (
    _tenant_id,
    encrypted,
    _headers,
    _connected_service_id,
    _status,
    _error_message
  ) RETURNING id INTO inserted_id;

  RETURN inserted_id;
END;
$$;


ALTER FUNCTION "public"."log_webhook_event"("_tenant_id" "uuid", "_payload" "jsonb", "_encryption_key" "text", "_headers" "jsonb", "_connected_service_id" "uuid", "_status" "text", "_error_message" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."make_column_unique_to_tenant"("table_name" "text", "col1" "text", "constraint_name" "text" DEFAULT NULL::"text") RETURNS "void"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
    unique_constraint_name TEXT;
BEGIN
    -- Generate constraint name if not provided
    unique_constraint_name := COALESCE(constraint_name, 'unique_' || table_name || '_' || col1 || '_' || 'tenant_id');

    -- Execute the ALTER TABLE command
    EXECUTE format(
        'ALTER TABLE %I ADD CONSTRAINT %I UNIQUE (%I, %I);',
        table_name, unique_constraint_name, col1, 'tenant_id'
    );
END;
$$;


ALTER FUNCTION "public"."make_column_unique_to_tenant"("table_name" "text", "col1" "text", "constraint_name" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."mark_function_task_failed"("_id" "uuid", "_error" "text", "_max_retries" integer DEFAULT 3) RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
declare
  retries int;
begin
  select coalesce(retry_count, 0) into retries
  from function_queue
  where id = _id;

  if retries + 1 >= _max_retries then
    update function_queue
    set status = 'failed',
        error_message = _error,
        retry_count = retries + 1,
        completed_at = now()
    where id = _id;
  else
    update function_queue
    set status = 'pending',
        error_message = _error,
        retry_count = retries + 1,
        last_failed_at = now()
    where id = _id;
  end if;
end;
$$;


ALTER FUNCTION "public"."mark_function_task_failed"("_id" "uuid", "_error" "text", "_max_retries" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."mark_function_task_passed"("_id" "uuid") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
begin
  update function_queue
  set status = 'passed',
      completed_at = now()
  where id = _id;
end;
$$;


ALTER FUNCTION "public"."mark_function_task_passed"("_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."match_documents"("query_embedding" "public"."vector", "match_count" integer DEFAULT NULL::integer, "filter" "jsonb" DEFAULT '{}'::"jsonb") RETURNS TABLE("id" bigint, "content" "text", "metadata" "jsonb", "similarity" double precision)
    LANGUAGE "plpgsql"
    AS $$
#variable_conflict use_column
begin
  return query
  select
    id,
    content,
    metadata,
    1 - (documents.embedding <=> query_embedding) as similarity
  from documents
  where metadata @> filter
  order by documents.embedding <=> query_embedding
  limit match_count;
end;
$$;


ALTER FUNCTION "public"."match_documents"("query_embedding" "public"."vector", "match_count" integer, "filter" "jsonb") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."notify_progress"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
begin
  update custom_table_progress
  set updated_at = now(), step = step + 1
  where tenant_id = NEW.tenant_id;
  return new;
end;
$$;


ALTER FUNCTION "public"."notify_progress"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."set_current_setting"("name" "text", "value" "text") RETURNS "text"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    EXECUTE format('SET %I = %L', name, value);
    RETURN current_setting('app.encryption_key', true);
END;
$$;


ALTER FUNCTION "public"."set_current_setting"("name" "text", "value" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."shared_message_columns"("_decryption_key" "text") RETURNS "text"
    LANGUAGE "plpgsql" IMMUTABLE
    AS $_$
BEGIN
  RETURN format($f$
    m.id,
    cm.conversation_id,
    m.connected_service_id,
    m.tenant_id,
    m.user_id,
    m.reply_to,
    CASE 
      WHEN m.encrypted_content IS NOT NULL THEN pgp_sym_decrypt(m.encrypted_content, %L)::JSONB
      ELSE m.content
    END AS content,
    m.role,
    m.metadata,
    m.created_at,
    m.updated_at,
    m.deleted_at,
    u.display_name,
    u.username,
    u.avatar_url
  $f$, _decryption_key);
END;
$_$;


ALTER FUNCTION "public"."shared_message_columns"("_decryption_key" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."test_encryption_setting"() RETURNS "text"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  RETURN current_setting('app.encryption_key', true);
END;
$$;


ALTER FUNCTION "public"."test_encryption_setting"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_credential"("_credential_id" "uuid", "_access_token" "text", "_refresh_token" "text", "_expires_at" timestamp without time zone, "_scopes" "text"[], "_encryption_key" "text", "_encryption_key_id" "uuid") RETURNS "uuid"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  encrypted_access BYTEA;
  encrypted_refresh BYTEA;
BEGIN
  IF _encryption_key IS NULL THEN
    RAISE EXCEPTION 'Encryption key must be provided.';
  END IF;

  IF _access_token IS NOT NULL THEN
    encrypted_access := pgp_sym_encrypt(_access_token, _encryption_key);
  END IF;

  IF _refresh_token IS NOT NULL THEN
    encrypted_refresh := pgp_sym_encrypt(_refresh_token, _encryption_key);
  END IF;

  UPDATE credentials
  SET
    access_token = encrypted_access,
    refresh_token = encrypted_refresh,
    expires_at = _expires_at,
    scopes = _scopes,
    encryption_key_id = _encryption_key_id,
    updated_at = now()
  WHERE id = _credential_id;

  RETURN _credential_id;
END;
$$;


ALTER FUNCTION "public"."update_credential"("_credential_id" "uuid", "_access_token" "text", "_refresh_token" "text", "_expires_at" timestamp without time zone, "_scopes" "text"[], "_encryption_key" "text", "_encryption_key_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_credential"("_credential_id" "uuid", "_access_token" "text", "_refresh_token" "text", "_expires_at" timestamp without time zone, "_scopes" "text"[], "_encryption_key" "text", "_encryption_key_id" "uuid", "_refresh_failed" boolean DEFAULT false) RETURNS "uuid"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  encrypted_access BYTEA;
  encrypted_refresh BYTEA;
BEGIN
  IF _encryption_key IS NULL THEN
    RAISE EXCEPTION 'Encryption key must be provided.';
  END IF;

  IF _access_token IS NOT NULL THEN
    encrypted_access := pgp_sym_encrypt(_access_token, _encryption_key);
  END IF;

  IF _refresh_token IS NOT NULL THEN
    encrypted_refresh := pgp_sym_encrypt(_refresh_token, _encryption_key);
  END IF;

  UPDATE credentials
  SET
    access_token = encrypted_access,
    refresh_token = encrypted_refresh,
    expires_at = _expires_at,
    scopes = _scopes,
    encryption_key_id = _encryption_key_id,
    updated_at = now(),
    refresh_failed = _refresh_failed
  WHERE id = _credential_id;

  RETURN _credential_id;
END;
$$;


ALTER FUNCTION "public"."update_credential"("_credential_id" "uuid", "_access_token" "text", "_refresh_token" "text", "_expires_at" timestamp without time zone, "_scopes" "text"[], "_encryption_key" "text", "_encryption_key_id" "uuid", "_refresh_failed" boolean) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_custom_table_record"("p_table_name" "text", "p_record_id" "uuid", "p_tenant_id" "uuid", "p_data" "jsonb") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    v_table_exists BOOLEAN;
    v_record_exists BOOLEAN;
    v_set_clause TEXT := '';
    v_query TEXT;
BEGIN
    -- Check if the table exists
    SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'ct_' || p_table_name
    ) INTO v_table_exists;
    
    IF NOT v_table_exists THEN
        RAISE EXCEPTION 'Table does not exist: ct_%', p_table_name;
    END IF;
    
    -- Check if the record exists and belongs to the tenant
    EXECUTE format(
        'SELECT EXISTS (SELECT 1 FROM public.ct_%I WHERE id = %L AND tenant_id = %L AND deleted_at IS NULL)',
        p_table_name, p_record_id, p_tenant_id
    ) INTO v_record_exists;
    
    IF NOT v_record_exists THEN
        RAISE EXCEPTION 'Record not found or does not belong to the tenant';
    END IF;
    
    -- Build the SET clause for the UPDATE query
    FOR i IN 0..jsonb_array_length(jsonb_object_keys(p_data)::jsonb) - 1 LOOP
        IF i > 0 THEN
            v_set_clause := v_set_clause || ', ';
        END IF;
        
        -- Handle different data types appropriately
        IF jsonb_typeof(p_data->(jsonb_object_keys(p_data)::jsonb->i#>>'{}')) = 'null' THEN
            v_set_clause := v_set_clause || quote_ident(jsonb_object_keys(p_data)::jsonb->i#>>'{}') || ' = NULL';
        ELSIF jsonb_typeof(p_data->(jsonb_object_keys(p_data)::jsonb->i#>>'{}')) = 'boolean' THEN
            v_set_clause := v_set_clause || quote_ident(jsonb_object_keys(p_data)::jsonb->i#>>'{}') || ' = ' || 
                (p_data->(jsonb_object_keys(p_data)::jsonb->i#>>'{}'))::TEXT;
        ELSE
            v_set_clause := v_set_clause || quote_ident(jsonb_object_keys(p_data)::jsonb->i#>>'{}') || ' = ' || 
                quote_literal(p_data->(jsonb_object_keys(p_data)::jsonb->i#>>'{}'));
        END IF;
    END LOOP;
    
    -- Add updated_at to the SET clause
    IF v_set_clause <> '' THEN
        v_set_clause := v_set_clause || ', ';
    END IF;
    v_set_clause := v_set_clause || 'updated_at = NOW()';
    
    -- Build and execute the UPDATE query
    v_query := format(
        'UPDATE public.ct_%I SET %s WHERE id = %L AND tenant_id = %L',
        p_table_name, v_set_clause, p_record_id, p_tenant_id
    );
    
    BEGIN
        EXECUTE v_query;
    EXCEPTION WHEN OTHERS THEN
        RAISE EXCEPTION 'Error updating record: %', SQLERRM;
    END;
END;
$$;


ALTER FUNCTION "public"."update_custom_table_record"("p_table_name" "text", "p_record_id" "uuid", "p_tenant_id" "uuid", "p_data" "jsonb") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_message"("_message_id" "uuid", "_content" "jsonb", "_role" "text", "_metadata" "jsonb", "_encryption_key" "text" DEFAULT NULL::"text") RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  encrypted BYTEA;
BEGIN
  IF _encryption_key IS NOT NULL THEN
    encrypted := pgp_sym_encrypt(_content::TEXT, _encryption_key);
  END IF;

  UPDATE messages
  SET
    content = CASE 
                WHEN _encryption_key IS NULL THEN _content 
                ELSE jsonb_build_object('note', 'encrypted') 
              END,
    encrypted_content = encrypted,
    role = _role,
    metadata = COALESCE(metadata, '{}'::jsonb) || _metadata,
    updated_at = NOW()
  WHERE id = _message_id;

  RETURN TRUE;
END;
$$;


ALTER FUNCTION "public"."update_message"("_message_id" "uuid", "_content" "jsonb", "_role" "text", "_metadata" "jsonb", "_encryption_key" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_timestamp"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_timestamp"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_webhook_event"("_id" "uuid", "_tenant_id" "uuid", "_status" "text" DEFAULT NULL::"text", "_error_message" "text" DEFAULT NULL::"text", "_processed" boolean DEFAULT NULL::boolean) RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  UPDATE webhook_events
  SET
    status = COALESCE(_status, status),
    error_message = COALESCE(_error_message, error_message),
    updated_at = NOW(),
    processed = COALESCE(_processed, processed)
  WHERE id = _id
    AND tenant_id = _tenant_id;
END;
$$;


ALTER FUNCTION "public"."update_webhook_event"("_id" "uuid", "_tenant_id" "uuid", "_status" "text", "_error_message" "text", "_processed" boolean) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."user_has_custom_role"("_user_id" "uuid", "_tenant_id" "uuid", "_custom_role_id" "uuid") RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM public.user_custom_roles 
    WHERE user_id = _user_id 
    AND tenant_id = _tenant_id
    AND custom_role_id = _custom_role_id
  );
END;
$$;


ALTER FUNCTION "public"."user_has_custom_role"("_user_id" "uuid", "_tenant_id" "uuid", "_custom_role_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."user_has_field_permission"("_user_id" "uuid", "_tenant_id" "uuid", "_field_id" "uuid", "_permission" "text") RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  _user_system_role user_role_type;
  _permissions JSONB;
  _allowed_system_roles TEXT[];
  _allowed_custom_roles UUID[];
  _has_custom_role BOOLEAN;
BEGIN
  -- Get the user's system role
  SELECT role_type INTO _user_system_role
  FROM public.user_roles
  WHERE user_id = _user_id AND tenant_id = _tenant_id
  LIMIT 1;

  -- Get the field permissions
  SELECT permissions INTO _permissions
  FROM public.custom_table_fields
  WHERE id = _field_id AND tenant_id = _tenant_id;

  -- Extract the allowed system roles for this permission
  SELECT ARRAY(
    SELECT jsonb_array_elements_text(_permissions->'system_roles'->_permission)
  ) INTO _allowed_system_roles;

  -- Extract the allowed custom roles for this permission
  SELECT ARRAY(
    SELECT jsonb_array_elements_text(_permissions->'custom_roles'->_permission)::uuid
  ) INTO _allowed_custom_roles;

  -- Check if the user has any of the allowed custom roles
  SELECT EXISTS (
    SELECT 1 
    FROM public.user_custom_roles 
    WHERE user_id = _user_id 
    AND tenant_id = _tenant_id
    AND custom_role_id = ANY(_allowed_custom_roles)
  ) INTO _has_custom_role;

  -- Return true if user's system role is allowed or if they have an allowed custom role
  RETURN _user_system_role::TEXT = ANY(_allowed_system_roles) OR _has_custom_role;
END;
$$;


ALTER FUNCTION "public"."user_has_field_permission"("_user_id" "uuid", "_tenant_id" "uuid", "_field_id" "uuid", "_permission" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."user_has_table_permission"("_user_id" "uuid", "_tenant_id" "uuid", "_table_id" "uuid", "_permission" "text") RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  _user_system_role user_role_type;
  _permissions JSONB;
  _allowed_system_roles TEXT[];
  _allowed_custom_roles UUID[];
  _has_custom_role BOOLEAN;
BEGIN
  -- Get the user's system role
  SELECT role_type INTO _user_system_role
  FROM public.user_roles
  WHERE user_id = _user_id AND tenant_id = _tenant_id
  LIMIT 1;

  -- Get the table permissions
  SELECT permissions INTO _permissions
  FROM public.custom_table_definitions
  WHERE id = _table_id AND tenant_id = _tenant_id;

  -- Extract the allowed system roles for this permission
  SELECT ARRAY(
    SELECT jsonb_array_elements_text(_permissions->'system_roles'->_permission)
  ) INTO _allowed_system_roles;

  -- Extract the allowed custom roles for this permission
  SELECT ARRAY(
    SELECT jsonb_array_elements_text(_permissions->'custom_roles'->_permission)::uuid
  ) INTO _allowed_custom_roles;

  -- Check if the user has any of the allowed custom roles
  SELECT EXISTS (
    SELECT 1 
    FROM public.user_custom_roles 
    WHERE user_id = _user_id 
    AND tenant_id = _tenant_id
    AND custom_role_id = ANY(_allowed_custom_roles)
  ) INTO _has_custom_role;

  -- Return true if user's system role is allowed or if they have an allowed custom role
  RETURN _user_system_role::TEXT = ANY(_allowed_system_roles) OR _has_custom_role;
END;
$$;


ALTER FUNCTION "public"."user_has_table_permission"("_user_id" "uuid", "_tenant_id" "uuid", "_table_id" "uuid", "_permission" "text") OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."agent_functions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "agent_id" "uuid" NOT NULL,
    "function_id" "uuid" NOT NULL,
    "created_at" timestamp without time zone DEFAULT "now"(),
    "updated_at" timestamp without time zone DEFAULT "now"(),
    "deleted_at" timestamp without time zone,
    "tenant_id" "uuid" NOT NULL
);


ALTER TABLE "public"."agent_functions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."ai_agent_workflows" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "agent_id" "uuid",
    "workflow_id" "uuid",
    "created_at" timestamp without time zone DEFAULT "now"(),
    "updated_at" timestamp without time zone DEFAULT "now"(),
    "deleted_at" timestamp without time zone,
    "tenant_id" "uuid" NOT NULL
);


ALTER TABLE "public"."ai_agent_workflows" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."ai_agents" (
    "name" character varying(100) NOT NULL,
    "human_name" character varying(100),
    "responsibility" "text" NOT NULL,
    "enabled" boolean NOT NULL,
    "prompt" "text" NOT NULL,
    "domain" character varying(100),
    "model" character varying(100) NOT NULL,
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "created_at" timestamp without time zone DEFAULT "now"(),
    "updated_at" timestamp without time zone DEFAULT "now"(),
    "deleted_at" timestamp without time zone,
    "tenant_id" "uuid" NOT NULL,
    "avatar_url" "text",
    "provider" "text" DEFAULT 'openai'::"text" NOT NULL
);


ALTER TABLE "public"."ai_agents" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."ai_functions" (
    "name" character varying(255) NOT NULL,
    "type" character varying(255) NOT NULL,
    "description" "text",
    "config" "jsonb" NOT NULL,
    "schema" "jsonb" NOT NULL,
    "parameters" "jsonb" NOT NULL,
    "enabled_for" "jsonb" NOT NULL,
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "created_at" timestamp without time zone DEFAULT "now"(),
    "updated_at" timestamp without time zone DEFAULT "now"(),
    "deleted_at" timestamp without time zone,
    "tenant_id" "uuid" NOT NULL,
    "markup" "jsonb" DEFAULT '{}'::"jsonb"
);


ALTER TABLE "public"."ai_functions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."configs" (
    "domain" character varying,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "config" "jsonb",
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "deleted_at" timestamp without time zone,
    "tenant_id" "uuid" NOT NULL,
    "name" "text",
    "user_id" "uuid"
);


ALTER TABLE "public"."configs" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."connected_services" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "agent_id" "uuid",
    "service_type" "text" NOT NULL,
    "status" "text" DEFAULT 'connected'::"text",
    "workflow_instance_id" "uuid",
    "created_at" timestamp without time zone DEFAULT "now"(),
    "updated_at" timestamp without time zone DEFAULT "now"(),
    "deleted_at" timestamp without time zone,
    "tenant_id" "uuid" NOT NULL,
    "config" "jsonb",
    "credential_id" "uuid" DEFAULT "gen_random_uuid"(),
    "name" "text",
    "client_state" "text" DEFAULT "gen_random_uuid"(),
    "subscription_id" "text",
    "subscription_expires_at" timestamp with time zone,
    "webhook_change_type" "text",
    "webhook_resource" "text"
);


ALTER TABLE "public"."connected_services" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."conversation_messages" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "conversation_id" "uuid" NOT NULL,
    "message_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."conversation_messages" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."messages" (
    "role" character varying(255) NOT NULL,
    "content" "jsonb" NOT NULL,
    "user_id" "uuid",
    "metadata" "jsonb" NOT NULL,
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "created_at" timestamp without time zone DEFAULT "now"(),
    "updated_at" timestamp without time zone DEFAULT "now"(),
    "deleted_at" timestamp without time zone,
    "tenant_id" "uuid" NOT NULL,
    "reply_to" "uuid",
    "encrypted_content" "bytea",
    "connected_service_id" "uuid"
);


ALTER TABLE "public"."messages" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."profiles" (
    "id" "uuid" NOT NULL,
    "username" "text",
    "avatar_url" "text",
    "created_at" timestamp without time zone DEFAULT "now"(),
    "updated_at" timestamp without time zone DEFAULT "now"(),
    "deleted_at" timestamp without time zone,
    "display_name" "text",
    "is_onboarded" boolean DEFAULT false
);


ALTER TABLE "public"."profiles" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."conversation_messages_view" WITH ("security_invoker"='on') AS
 SELECT "cm"."conversation_id",
    "m"."role",
    "m"."content",
    "m"."user_id",
    "m"."metadata",
    "m"."id",
    "m"."created_at",
    "m"."updated_at",
    "m"."deleted_at",
    "m"."tenant_id",
    "m"."reply_to",
    "u"."display_name",
    "u"."username",
    "u"."avatar_url"
   FROM (("public"."conversation_messages" "cm"
     JOIN "public"."messages" "m" ON (("cm"."message_id" = "m"."id")))
     LEFT JOIN "public"."profiles" "u" ON (("m"."user_id" = "u"."id")));


ALTER TABLE "public"."conversation_messages_view" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."conversation_participants" (
    "conversation_id" "uuid",
    "user_id" "uuid",
    "joined_at" timestamp with time zone DEFAULT "now"(),
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "created_at" timestamp without time zone DEFAULT "now"(),
    "updated_at" timestamp without time zone DEFAULT "now"(),
    "deleted_at" timestamp without time zone,
    "tenant_id" "uuid" NOT NULL,
    "agent_id" "uuid"
);


ALTER TABLE "public"."conversation_participants" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."conversations" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "session_id" "text",
    "user_id" "text" NOT NULL,
    "domain" "text" NOT NULL,
    "deleted_at" timestamp without time zone,
    "tenant_id" "uuid" NOT NULL,
    "title" "text",
    "icon" "text",
    "alias" "text",
    CONSTRAINT "conversations_alias_check" CHECK (("alias" ~ '^[a-z0-9-]+$'::"text"))
);

ALTER TABLE ONLY "public"."conversations" REPLICA IDENTITY FULL;


ALTER TABLE "public"."conversations" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."credentials" (
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "username" "text",
    "password" "text",
    "domain" "text",
    "user_id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "updated_at" timestamp without time zone DEFAULT "now"(),
    "deleted_at" timestamp without time zone,
    "tenant_id" "uuid" NOT NULL,
    "type" "text",
    "scopes" "text"[],
    "access_token" "bytea",
    "refresh_token" "bytea",
    "expires_at" timestamp without time zone,
    "provider" "text",
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "encryption_key_id" "uuid",
    "name" "text",
    "updated_by" "uuid",
    "refresh_failed" boolean DEFAULT false,
    "tid" "text",
    "associated_email" "text"
);


ALTER TABLE "public"."credentials" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."custom_migrations" (
    "name" "text" NOT NULL,
    "migration" "jsonb" NOT NULL,
    "rollback" "jsonb",
    "success" boolean DEFAULT false,
    "applied_at" timestamp with time zone,
    "error" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "updated_at" timestamp without time zone DEFAULT "now"(),
    "deleted_at" timestamp without time zone,
    "tenant_id" "uuid" NOT NULL
);


ALTER TABLE "public"."custom_migrations" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."custom_roles" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "tenant_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "created_at" timestamp without time zone DEFAULT "now"(),
    "updated_at" timestamp without time zone DEFAULT "now"(),
    "deleted_at" timestamp without time zone
);


ALTER TABLE "public"."custom_roles" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."custom_table_data" (
    "table_name" character varying(255) NOT NULL,
    "data" "jsonb" NOT NULL,
    "metadata" "jsonb" NOT NULL,
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "created_at" timestamp without time zone DEFAULT "now"(),
    "updated_at" timestamp without time zone DEFAULT "now"(),
    "deleted_at" timestamp without time zone,
    "tenant_id" "uuid" NOT NULL,
    "table_id" "uuid" NOT NULL
);


ALTER TABLE "public"."custom_table_data" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."custom_table_data_progress" (
    "tenant_id" "uuid" NOT NULL,
    "status" "text" DEFAULT 'pending'::"text",
    "current_step" integer DEFAULT 0,
    "total_steps" integer DEFAULT 0,
    "last_table" "text",
    "last_table_id" "uuid",
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."custom_table_data_progress" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."custom_table_definitions" (
    "name" "text" NOT NULL,
    "display_name" "text",
    "description" "text",
    "tenant_id" "uuid" NOT NULL,
    "icon" "text",
    "permissions" "jsonb" NOT NULL,
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "created_at" timestamp without time zone DEFAULT "now"(),
    "updated_at" timestamp without time zone DEFAULT "now"(),
    "deleted_at" timestamp without time zone
);


ALTER TABLE "public"."custom_table_definitions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."custom_table_fields" (
    "table_id" "uuid",
    "name" "text" NOT NULL,
    "display_name" "text",
    "description" "text",
    "field_type" "public"."field_type_enum" NOT NULL,
    "is_required" boolean DEFAULT false,
    "is_unique" boolean DEFAULT false,
    "default_value" "text",
    "options" "jsonb",
    "relation" "jsonb",
    "validation" "jsonb",
    "tenant_id" "uuid" NOT NULL,
    "permissions" "jsonb" NOT NULL,
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "created_at" timestamp without time zone DEFAULT "now"(),
    "updated_at" timestamp without time zone DEFAULT "now"(),
    "deleted_at" timestamp without time zone
);


ALTER TABLE "public"."custom_table_fields" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."custom_table_progress" (
    "tenant_id" "uuid" NOT NULL,
    "status" "text" DEFAULT 'pending'::"text",
    "current_step" integer DEFAULT 0,
    "total_steps" integer DEFAULT 0,
    "last_table" "text",
    "last_table_id" "uuid",
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."custom_table_progress" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."custom_table_relationships" (
    "table_id" "uuid",
    "from_table" "text" NOT NULL,
    "from_field" "text" NOT NULL,
    "to_table" "text" NOT NULL,
    "to_field" "text" NOT NULL,
    "relationship_type" "text" NOT NULL,
    "tenant_id" "uuid" NOT NULL,
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "created_at" timestamp without time zone DEFAULT "now"(),
    "updated_at" timestamp without time zone DEFAULT "now"(),
    "deleted_at" timestamp without time zone
);


ALTER TABLE "public"."custom_table_relationships" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."customers" (
    "user_id" "uuid" NOT NULL,
    "contact_details" "jsonb" NOT NULL,
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "created_at" timestamp without time zone DEFAULT "now"(),
    "updated_at" timestamp without time zone DEFAULT "now"(),
    "deleted_at" timestamp without time zone,
    "tenant_id" "uuid" NOT NULL
);


ALTER TABLE "public"."customers" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."documents" (
    "id" bigint NOT NULL,
    "content" "text",
    "metadata" "jsonb",
    "embedding" "public"."vector"(1536)
);


ALTER TABLE "public"."documents" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."documents_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE "public"."documents_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."documents_id_seq" OWNED BY "public"."documents"."id";



CREATE TABLE IF NOT EXISTS "public"."encryption_keys" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "version" integer,
    "description" "text",
    "tenant_id" "uuid",
    "created_at" timestamp without time zone DEFAULT "now"()
);


ALTER TABLE "public"."encryption_keys" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."function_queue" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "action" "text",
    "payload_encrypted" "bytea" NOT NULL,
    "status" "text" DEFAULT 'pending'::"text",
    "priority" "text" DEFAULT 'medium'::"text",
    "retry_count" integer DEFAULT 0,
    "error_message" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "processing_started_at" timestamp with time zone,
    "last_failed_at" timestamp with time zone,
    "completed_at" timestamp with time zone,
    CONSTRAINT "function_queue_priority_check" CHECK (("priority" = ANY (ARRAY['low'::"text", 'medium'::"text", 'high'::"text"]))),
    CONSTRAINT "function_queue_status_check" CHECK (("status" = ANY (ARRAY['pending'::"text", 'processing'::"text", 'passed'::"text", 'failed'::"text"])))
);


ALTER TABLE "public"."function_queue" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."memories" (
    "id" bigint NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "domain" "text",
    "memory" "text",
    "userId" "uuid" DEFAULT "gen_random_uuid"() NOT NULL
);


ALTER TABLE "public"."memories" OWNER TO "postgres";


ALTER TABLE "public"."memories" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."memories_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."oauth_states" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "agent_id" "uuid",
    "state" "text",
    "code_verifier" "text",
    "redirect_uri" "text",
    "workflow_instance_id" "uuid",
    "created_at" timestamp without time zone DEFAULT "now"(),
    "updated_at" timestamp without time zone DEFAULT "now"(),
    "deleted_at" timestamp without time zone,
    "tenant_id" "uuid",
    "config" "jsonb",
    "provider" "text",
    "service_type" "text",
    "status" "text",
    "expires_at" timestamp without time zone DEFAULT ("now"() + '00:15:00'::interval),
    "inserted_by" "uuid",
    "inserted_at" timestamp without time zone DEFAULT "now"(),
    "tid" "text"
);


ALTER TABLE "public"."oauth_states" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."onboarding_sessions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "current_step_id" "text",
    "state" "jsonb" DEFAULT '{}'::"jsonb",
    "metadata" "jsonb" DEFAULT '{}'::"jsonb",
    "completed" boolean DEFAULT false,
    "created_at" timestamp without time zone DEFAULT "now"(),
    "updated_at" timestamp without time zone DEFAULT "now"(),
    "deleted_at" timestamp without time zone,
    "tenant_id" "uuid" NOT NULL
);


ALTER TABLE "public"."onboarding_sessions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."price_items" (
    "item_id" "text" NOT NULL,
    "item_code" "text",
    "item_title" "text" NOT NULL,
    "long_description" "text",
    "cost_price" numeric(10,2),
    "unit_price" numeric(10,2) NOT NULL,
    "quantity" numeric(10,2),
    "discount" numeric(5,2) DEFAULT 0.00,
    "item_total" numeric(10,2) GENERATED ALWAYS AS ((("unit_price" - (("unit_price" * "discount") / (100)::numeric)) * "quantity")) STORED,
    "sales_category" "text" NOT NULL,
    "tax_rate" "text",
    "subscription" "text",
    "editable_quantity" boolean DEFAULT false,
    "optional" boolean DEFAULT false,
    "last_changed" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "created_at" timestamp without time zone DEFAULT "now"(),
    "updated_at" timestamp without time zone DEFAULT "now"(),
    "deleted_at" timestamp without time zone,
    "tenant_id" "uuid" NOT NULL
);


ALTER TABLE "public"."price_items" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."tempEmails" (
    "id" bigint NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "recipient" "text",
    "subject" "text",
    "body" character varying,
    "ref" "uuid" DEFAULT "gen_random_uuid"() NOT NULL
);


ALTER TABLE "public"."tempEmails" OWNER TO "postgres";


ALTER TABLE "public"."tempEmails" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."tempEmails_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."tenant_domains" (
    "name" character varying(255) NOT NULL,
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "created_at" timestamp without time zone DEFAULT "now"(),
    "updated_at" timestamp without time zone DEFAULT "now"(),
    "deleted_at" timestamp without time zone,
    "tenant_id" "uuid" NOT NULL
);


ALTER TABLE "public"."tenant_domains" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."tenant_requests" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "user_email" "text",
    "workspace" "text" NOT NULL,
    "status" "text" DEFAULT 'pending'::"text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."tenant_requests" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."tenant_users" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "tenant_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "is_primary_tenant" boolean DEFAULT false
);


ALTER TABLE "public"."tenant_users" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."tenants" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" character varying(255),
    "workspace" "text",
    "tenant_owner_id" "uuid" NOT NULL
);


ALTER TABLE "public"."tenants" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_custom_roles" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "custom_role_id" "uuid" NOT NULL,
    "tenant_id" "uuid" NOT NULL,
    "created_at" timestamp without time zone DEFAULT "now"(),
    "updated_at" timestamp without time zone DEFAULT "now"(),
    "deleted_at" timestamp without time zone
);


ALTER TABLE "public"."user_custom_roles" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_roles" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "tenant_id" "uuid",
    "role_type" "public"."user_role_type" DEFAULT 'member'::"public"."user_role_type" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."user_roles" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."webhook_events" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "connected_service_id" "uuid",
    "received_at" timestamp without time zone DEFAULT "now"(),
    "headers" "jsonb",
    "status" "text" DEFAULT 'received'::"text",
    "error_message" "text",
    "created_at" timestamp without time zone DEFAULT "now"(),
    "updated_at" timestamp without time zone DEFAULT "now"(),
    "deleted_at" timestamp without time zone,
    "tenant_id" "uuid" NOT NULL,
    "encrypted_payload" "bytea"
);


ALTER TABLE "public"."webhook_events" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."workflow_instances" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "workflow_id" "uuid",
    "agent_id" "uuid",
    "status" "text" DEFAULT 'in_progress'::"text",
    "current_step" integer DEFAULT 0,
    "created_at" timestamp without time zone DEFAULT "now"(),
    "completed_at" timestamp without time zone,
    "updated_at" timestamp without time zone DEFAULT "now"(),
    "deleted_at" timestamp without time zone,
    "tenant_id" "uuid" NOT NULL
);


ALTER TABLE "public"."workflow_instances" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."workflow_responses" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "workflow_instance_id" "uuid",
    "step_index" integer,
    "response" "jsonb",
    "status" "text" DEFAULT 'success'::"text",
    "error_message" "text",
    "created_at" timestamp without time zone DEFAULT "now"(),
    "updated_at" timestamp without time zone DEFAULT "now"(),
    "deleted_at" timestamp without time zone,
    "tenant_id" "uuid" NOT NULL
);


ALTER TABLE "public"."workflow_responses" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."workflow_steps" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "workflow_id" "uuid",
    "step_index" integer NOT NULL,
    "type" "text" NOT NULL,
    "config" "jsonb",
    "description" "text",
    "created_at" timestamp without time zone DEFAULT "now"(),
    "connected_service_id" "uuid",
    "updated_at" timestamp without time zone DEFAULT "now"(),
    "deleted_at" timestamp without time zone,
    "tenant_id" "uuid" NOT NULL
);


ALTER TABLE "public"."workflow_steps" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."workflows" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "created_by" "uuid",
    "created_at" timestamp without time zone DEFAULT "now"(),
    "updated_at" timestamp without time zone DEFAULT "now"(),
    "deleted_at" timestamp without time zone,
    "tenant_id" "uuid" NOT NULL
);


ALTER TABLE "public"."workflows" OWNER TO "postgres";


ALTER TABLE ONLY "public"."documents" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."documents_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."agent_functions"
    ADD CONSTRAINT "agent_functions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."ai_agent_workflows"
    ADD CONSTRAINT "ai_agent_workflows_agent_id_workflow_id_key" UNIQUE ("agent_id", "workflow_id");



ALTER TABLE ONLY "public"."ai_agent_workflows"
    ADD CONSTRAINT "ai_agent_workflows_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."ai_agents"
    ADD CONSTRAINT "ai_agents_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."ai_functions"
    ADD CONSTRAINT "ai_functions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."configs"
    ADD CONSTRAINT "configs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."connected_services"
    ADD CONSTRAINT "connected_services_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."conversation_messages"
    ADD CONSTRAINT "conversation_messages_conversation_id_message_id_key" UNIQUE ("conversation_id", "message_id");



ALTER TABLE ONLY "public"."conversation_messages"
    ADD CONSTRAINT "conversation_messages_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."conversation_participants"
    ADD CONSTRAINT "conversation_participants_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."conversation_participants"
    ADD CONSTRAINT "conversation_participants_unique" UNIQUE ("conversation_id", "user_id", "tenant_id");



ALTER TABLE ONLY "public"."conversations"
    ADD CONSTRAINT "conversations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."credentials"
    ADD CONSTRAINT "credentials_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."custom_migrations"
    ADD CONSTRAINT "custom_migrations_name_key" UNIQUE ("name");



ALTER TABLE ONLY "public"."custom_migrations"
    ADD CONSTRAINT "custom_migrations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."custom_roles"
    ADD CONSTRAINT "custom_roles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."custom_table_data"
    ADD CONSTRAINT "custom_table_data_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."custom_table_data_progress"
    ADD CONSTRAINT "custom_table_data_progress_pkey" PRIMARY KEY ("tenant_id");



ALTER TABLE ONLY "public"."custom_table_definitions"
    ADD CONSTRAINT "custom_table_definitions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."custom_table_definitions"
    ADD CONSTRAINT "custom_table_definitions_tenant_id_name_key" UNIQUE ("tenant_id", "name");



ALTER TABLE ONLY "public"."custom_table_fields"
    ADD CONSTRAINT "custom_table_fields_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."custom_table_progress"
    ADD CONSTRAINT "custom_table_progress_pkey" PRIMARY KEY ("tenant_id");



ALTER TABLE ONLY "public"."custom_table_relationships"
    ADD CONSTRAINT "custom_table_relationships_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."customers"
    ADD CONSTRAINT "customers_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."documents"
    ADD CONSTRAINT "documents_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."encryption_keys"
    ADD CONSTRAINT "encryption_keys_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."encryption_keys"
    ADD CONSTRAINT "encryption_keys_version_key" UNIQUE ("version");



ALTER TABLE ONLY "public"."function_queue"
    ADD CONSTRAINT "function_queue_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."memories"
    ADD CONSTRAINT "memories_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."messages"
    ADD CONSTRAINT "messages_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."oauth_states"
    ADD CONSTRAINT "oauth_states_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."onboarding_sessions"
    ADD CONSTRAINT "onboarding_sessions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."price_items"
    ADD CONSTRAINT "price_items_item_code_key" UNIQUE ("item_code");



ALTER TABLE ONLY "public"."price_items"
    ADD CONSTRAINT "price_items_item_id_key" UNIQUE ("item_id");



ALTER TABLE ONLY "public"."price_items"
    ADD CONSTRAINT "price_items_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."tempEmails"
    ADD CONSTRAINT "tempEmails_pkey" PRIMARY KEY ("id", "ref");



ALTER TABLE ONLY "public"."tenant_domains"
    ADD CONSTRAINT "tenant_domains_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."tenant_requests"
    ADD CONSTRAINT "tenant_requests_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."tenant_users"
    ADD CONSTRAINT "tenant_users_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."tenant_users"
    ADD CONSTRAINT "tenant_users_user_id_tenant_id_key" UNIQUE ("user_id", "tenant_id");



ALTER TABLE ONLY "public"."tenants"
    ADD CONSTRAINT "tenants_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."tenants"
    ADD CONSTRAINT "tenants_workspace_key" UNIQUE ("workspace");



ALTER TABLE ONLY "public"."agent_functions"
    ADD CONSTRAINT "unique_agent_function_pair" UNIQUE ("agent_id", "function_id", "tenant_id");



ALTER TABLE ONLY "public"."ai_agents"
    ADD CONSTRAINT "unique_ai_agents_name_tenant_id" UNIQUE ("name", "tenant_id");



ALTER TABLE ONLY "public"."ai_functions"
    ADD CONSTRAINT "unique_ai_functions_name_tenant_id" UNIQUE ("name", "tenant_id");



ALTER TABLE ONLY "public"."configs"
    ADD CONSTRAINT "unique_configs_id" UNIQUE ("user_id", "tenant_id", "name");



ALTER TABLE ONLY "public"."configs"
    ADD CONSTRAINT "unique_configs_name_tenant_id" UNIQUE ("name", "tenant_id");



ALTER TABLE ONLY "public"."custom_roles"
    ADD CONSTRAINT "unique_role_name_per_tenant" UNIQUE ("tenant_id", "name");



ALTER TABLE ONLY "public"."user_custom_roles"
    ADD CONSTRAINT "unique_user_custom_role" UNIQUE ("user_id", "custom_role_id");



ALTER TABLE ONLY "public"."user_custom_roles"
    ADD CONSTRAINT "user_custom_roles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_roles"
    ADD CONSTRAINT "user_roles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_roles"
    ADD CONSTRAINT "user_roles_user_id_tenant_id_role_type_key" UNIQUE ("user_id", "tenant_id", "role_type");



ALTER TABLE ONLY "public"."webhook_events"
    ADD CONSTRAINT "webhook_events_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."workflow_instances"
    ADD CONSTRAINT "workflow_instances_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."workflow_responses"
    ADD CONSTRAINT "workflow_responses_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."workflow_steps"
    ADD CONSTRAINT "workflow_steps_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."workflows"
    ADD CONSTRAINT "workflows_pkey" PRIMARY KEY ("id");



CREATE UNIQUE INDEX "conversations_alias_unique" ON "public"."conversations" USING "btree" ("alias") WHERE ("alias" IS NOT NULL);



CREATE INDEX "idx_configs_user_id" ON "public"."configs" USING "btree" ("user_id");



CREATE INDEX "idx_custom_migrations_name" ON "public"."custom_migrations" USING "btree" ("name");



CREATE INDEX "idx_custom_migrations_success" ON "public"."custom_migrations" USING "btree" ("success");



CREATE OR REPLACE TRIGGER "set_credential_updated_by" BEFORE UPDATE ON "public"."credentials" FOR EACH ROW EXECUTE FUNCTION "public"."log_credential_update"();



CREATE OR REPLACE TRIGGER "set_inserted_by" BEFORE INSERT ON "public"."oauth_states" FOR EACH ROW EXECUTE FUNCTION "public"."log_oauth_state_insert"();



CREATE OR REPLACE TRIGGER "trigger_update_timestamp_ai_agent_workflows" BEFORE UPDATE ON "public"."ai_agent_workflows" FOR EACH ROW EXECUTE FUNCTION "public"."update_timestamp"();



CREATE OR REPLACE TRIGGER "trigger_update_timestamp_ai_agents" BEFORE UPDATE ON "public"."ai_agents" FOR EACH ROW EXECUTE FUNCTION "public"."update_timestamp"();



CREATE OR REPLACE TRIGGER "trigger_update_timestamp_ai_functions" BEFORE UPDATE ON "public"."ai_functions" FOR EACH ROW EXECUTE FUNCTION "public"."update_timestamp"();



CREATE OR REPLACE TRIGGER "trigger_update_timestamp_configs" BEFORE UPDATE ON "public"."configs" FOR EACH ROW EXECUTE FUNCTION "public"."update_timestamp"();



CREATE OR REPLACE TRIGGER "trigger_update_timestamp_connected_services" BEFORE UPDATE ON "public"."connected_services" FOR EACH ROW EXECUTE FUNCTION "public"."update_timestamp"();



CREATE OR REPLACE TRIGGER "trigger_update_timestamp_conversation_participants" BEFORE UPDATE ON "public"."conversation_participants" FOR EACH ROW EXECUTE FUNCTION "public"."update_timestamp"();



CREATE OR REPLACE TRIGGER "trigger_update_timestamp_conversations" BEFORE UPDATE ON "public"."conversations" FOR EACH ROW EXECUTE FUNCTION "public"."update_timestamp"();



CREATE OR REPLACE TRIGGER "trigger_update_timestamp_credentials" BEFORE UPDATE ON "public"."credentials" FOR EACH ROW EXECUTE FUNCTION "public"."update_timestamp"();



CREATE OR REPLACE TRIGGER "trigger_update_timestamp_custom_migrations" BEFORE UPDATE ON "public"."custom_migrations" FOR EACH ROW EXECUTE FUNCTION "public"."update_timestamp"();



CREATE OR REPLACE TRIGGER "trigger_update_timestamp_custom_roles" BEFORE UPDATE ON "public"."custom_roles" FOR EACH ROW EXECUTE FUNCTION "public"."update_timestamp"();



CREATE OR REPLACE TRIGGER "trigger_update_timestamp_custom_table_data" BEFORE UPDATE ON "public"."custom_table_data" FOR EACH ROW EXECUTE FUNCTION "public"."update_timestamp"();



CREATE OR REPLACE TRIGGER "trigger_update_timestamp_custom_table_definitions" BEFORE UPDATE ON "public"."custom_table_definitions" FOR EACH ROW EXECUTE FUNCTION "public"."update_timestamp"();



CREATE OR REPLACE TRIGGER "trigger_update_timestamp_custom_table_fields" BEFORE UPDATE ON "public"."custom_table_fields" FOR EACH ROW EXECUTE FUNCTION "public"."update_timestamp"();



CREATE OR REPLACE TRIGGER "trigger_update_timestamp_custom_table_relationships" BEFORE UPDATE ON "public"."custom_table_relationships" FOR EACH ROW EXECUTE FUNCTION "public"."update_timestamp"();



CREATE OR REPLACE TRIGGER "trigger_update_timestamp_messages" BEFORE UPDATE ON "public"."messages" FOR EACH ROW EXECUTE FUNCTION "public"."update_timestamp"();



CREATE OR REPLACE TRIGGER "trigger_update_timestamp_oauth_states" BEFORE UPDATE ON "public"."oauth_states" FOR EACH ROW EXECUTE FUNCTION "public"."update_timestamp"();



CREATE OR REPLACE TRIGGER "trigger_update_timestamp_onboarding_sessions" BEFORE UPDATE ON "public"."onboarding_sessions" FOR EACH ROW EXECUTE FUNCTION "public"."update_timestamp"();



CREATE OR REPLACE TRIGGER "trigger_update_timestamp_price_items" BEFORE UPDATE ON "public"."price_items" FOR EACH ROW EXECUTE FUNCTION "public"."update_timestamp"();



CREATE OR REPLACE TRIGGER "trigger_update_timestamp_profiles" BEFORE UPDATE ON "public"."profiles" FOR EACH ROW EXECUTE FUNCTION "public"."update_timestamp"();



CREATE OR REPLACE TRIGGER "trigger_update_timestamp_tenant_domains" BEFORE UPDATE ON "public"."tenant_domains" FOR EACH ROW EXECUTE FUNCTION "public"."update_timestamp"();



CREATE OR REPLACE TRIGGER "trigger_update_timestamp_tenant_requests" BEFORE UPDATE ON "public"."tenant_requests" FOR EACH ROW EXECUTE FUNCTION "public"."update_timestamp"();



CREATE OR REPLACE TRIGGER "trigger_update_timestamp_tenant_users" BEFORE UPDATE ON "public"."tenant_users" FOR EACH ROW EXECUTE FUNCTION "public"."update_timestamp"();



CREATE OR REPLACE TRIGGER "trigger_update_timestamp_user_roles" BEFORE UPDATE ON "public"."user_roles" FOR EACH ROW EXECUTE FUNCTION "public"."update_timestamp"();



CREATE OR REPLACE TRIGGER "trigger_update_timestamp_webhook_events" BEFORE UPDATE ON "public"."webhook_events" FOR EACH ROW EXECUTE FUNCTION "public"."update_timestamp"();



CREATE OR REPLACE TRIGGER "trigger_update_timestamp_workflow_instances" BEFORE UPDATE ON "public"."workflow_instances" FOR EACH ROW EXECUTE FUNCTION "public"."update_timestamp"();



CREATE OR REPLACE TRIGGER "trigger_update_timestamp_workflow_responses" BEFORE UPDATE ON "public"."workflow_responses" FOR EACH ROW EXECUTE FUNCTION "public"."update_timestamp"();



CREATE OR REPLACE TRIGGER "trigger_update_timestamp_workflow_steps" BEFORE UPDATE ON "public"."workflow_steps" FOR EACH ROW EXECUTE FUNCTION "public"."update_timestamp"();



CREATE OR REPLACE TRIGGER "trigger_update_timestamp_workflows" BEFORE UPDATE ON "public"."workflows" FOR EACH ROW EXECUTE FUNCTION "public"."update_timestamp"();



ALTER TABLE ONLY "public"."agent_functions"
    ADD CONSTRAINT "agent_functions_agent_id_fkey" FOREIGN KEY ("agent_id") REFERENCES "public"."ai_agents"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."agent_functions"
    ADD CONSTRAINT "agent_functions_function_id_fkey" FOREIGN KEY ("function_id") REFERENCES "public"."ai_functions"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."agent_functions"
    ADD CONSTRAINT "agent_functions_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."ai_agent_workflows"
    ADD CONSTRAINT "ai_agent_workflows_agent_id_fkey" FOREIGN KEY ("agent_id") REFERENCES "public"."ai_agents"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."ai_agent_workflows"
    ADD CONSTRAINT "ai_agent_workflows_workflow_id_fkey" FOREIGN KEY ("workflow_id") REFERENCES "public"."workflows"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."configs"
    ADD CONSTRAINT "configs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."connected_services"
    ADD CONSTRAINT "connected_services_agent_id_fkey" FOREIGN KEY ("agent_id") REFERENCES "public"."ai_agents"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."connected_services"
    ADD CONSTRAINT "connected_services_credential_id_fkey" FOREIGN KEY ("credential_id") REFERENCES "public"."credentials"("id");



ALTER TABLE ONLY "public"."connected_services"
    ADD CONSTRAINT "connected_services_workflow_instance_id_fkey" FOREIGN KEY ("workflow_instance_id") REFERENCES "public"."workflow_instances"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."conversation_messages"
    ADD CONSTRAINT "conversation_messages_conversation_id_fkey" FOREIGN KEY ("conversation_id") REFERENCES "public"."conversations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."conversation_messages"
    ADD CONSTRAINT "conversation_messages_message_id_fkey" FOREIGN KEY ("message_id") REFERENCES "public"."messages"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."conversation_participants"
    ADD CONSTRAINT "conversation_participants_agent_id_fkey" FOREIGN KEY ("agent_id") REFERENCES "public"."ai_agents"("id");



ALTER TABLE ONLY "public"."conversation_participants"
    ADD CONSTRAINT "conversation_participants_conversation_id_fkey" FOREIGN KEY ("conversation_id") REFERENCES "public"."conversations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."conversation_participants"
    ADD CONSTRAINT "conversation_participants_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."credentials"
    ADD CONSTRAINT "credentials_encryption_key_id_fkey" FOREIGN KEY ("encryption_key_id") REFERENCES "public"."encryption_keys"("id");



ALTER TABLE ONLY "public"."credentials"
    ADD CONSTRAINT "credentials_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id");



ALTER TABLE ONLY "public"."custom_roles"
    ADD CONSTRAINT "custom_roles_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."custom_table_fields"
    ADD CONSTRAINT "custom_table_fields_table_id_fkey" FOREIGN KEY ("table_id") REFERENCES "public"."custom_table_definitions"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."custom_table_relationships"
    ADD CONSTRAINT "custom_table_relationships_table_id_fkey" FOREIGN KEY ("table_id") REFERENCES "public"."custom_table_definitions"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."ai_agent_workflows"
    ADD CONSTRAINT "fk_ai_agent_workflows_tenant" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."ai_agents"
    ADD CONSTRAINT "fk_ai_agents_tenant" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."ai_functions"
    ADD CONSTRAINT "fk_ai_functions_tenant" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."configs"
    ADD CONSTRAINT "fk_configs_tenant" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."connected_services"
    ADD CONSTRAINT "fk_connected_services_tenant" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."conversation_participants"
    ADD CONSTRAINT "fk_conversation_participants_tenant" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."conversations"
    ADD CONSTRAINT "fk_conversations_tenant" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."custom_migrations"
    ADD CONSTRAINT "fk_custom_migrations_tenant" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."custom_roles"
    ADD CONSTRAINT "fk_custom_roles_tenant" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."custom_table_data"
    ADD CONSTRAINT "fk_custom_table_data_tenant" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."custom_table_definitions"
    ADD CONSTRAINT "fk_custom_table_definitions_tenant" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."custom_table_fields"
    ADD CONSTRAINT "fk_custom_table_fields_tenant" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."custom_table_relationships"
    ADD CONSTRAINT "fk_custom_table_relationships_tenant" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."customers"
    ADD CONSTRAINT "fk_customers_tenant" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."messages"
    ADD CONSTRAINT "fk_messages_tenant" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."oauth_states"
    ADD CONSTRAINT "fk_oauth_states_tenant" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."onboarding_sessions"
    ADD CONSTRAINT "fk_onboarding_sessions_tenant" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."price_items"
    ADD CONSTRAINT "fk_price_items_tenant" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."tenant_domains"
    ADD CONSTRAINT "fk_tenant_domains_tenant" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_custom_roles"
    ADD CONSTRAINT "fk_user_custom_roles_tenant" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."webhook_events"
    ADD CONSTRAINT "fk_webhook_events_tenant" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."workflow_instances"
    ADD CONSTRAINT "fk_workflow_instances_tenant" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."workflow_responses"
    ADD CONSTRAINT "fk_workflow_responses_tenant" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."workflow_steps"
    ADD CONSTRAINT "fk_workflow_steps_tenant" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."workflows"
    ADD CONSTRAINT "fk_workflows_tenant" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."messages"
    ADD CONSTRAINT "messages_connected_service_id_fkey" FOREIGN KEY ("connected_service_id") REFERENCES "public"."connected_services"("id");



ALTER TABLE ONLY "public"."oauth_states"
    ADD CONSTRAINT "oauth_states_workflow_instance_id_fkey" FOREIGN KEY ("workflow_instance_id") REFERENCES "public"."workflow_instances"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."onboarding_sessions"
    ADD CONSTRAINT "onboarding_sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_id_fkey" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."tenant_requests"
    ADD CONSTRAINT "tenant_requests_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."tenant_users"
    ADD CONSTRAINT "tenant_users_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."tenant_users"
    ADD CONSTRAINT "tenant_users_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_custom_roles"
    ADD CONSTRAINT "user_custom_roles_custom_role_id_fkey" FOREIGN KEY ("custom_role_id") REFERENCES "public"."custom_roles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_custom_roles"
    ADD CONSTRAINT "user_custom_roles_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_custom_roles"
    ADD CONSTRAINT "user_custom_roles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_roles"
    ADD CONSTRAINT "user_roles_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_roles"
    ADD CONSTRAINT "user_roles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."webhook_events"
    ADD CONSTRAINT "webhook_events_connected_service_id_fkey" FOREIGN KEY ("connected_service_id") REFERENCES "public"."connected_services"("id");



ALTER TABLE ONLY "public"."workflow_instances"
    ADD CONSTRAINT "workflow_instances_agent_id_fkey" FOREIGN KEY ("agent_id") REFERENCES "public"."ai_agents"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."workflow_instances"
    ADD CONSTRAINT "workflow_instances_workflow_id_fkey" FOREIGN KEY ("workflow_id") REFERENCES "public"."workflows"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."workflow_responses"
    ADD CONSTRAINT "workflow_responses_workflow_instance_id_fkey" FOREIGN KEY ("workflow_instance_id") REFERENCES "public"."workflow_instances"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."workflow_steps"
    ADD CONSTRAINT "workflow_steps_connected_service_id_fkey" FOREIGN KEY ("connected_service_id") REFERENCES "public"."connected_services"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."workflow_steps"
    ADD CONSTRAINT "workflow_steps_workflow_id_fkey" FOREIGN KEY ("workflow_id") REFERENCES "public"."workflows"("id") ON DELETE CASCADE;



CREATE POLICY "Admin users can manage tenant users" ON "public"."tenant_users" USING ((EXISTS ( SELECT 1
   FROM "public"."user_roles"
  WHERE (("user_roles"."user_id" = "auth"."uid"()) AND ("user_roles"."tenant_id" = "tenant_users"."tenant_id") AND ("user_roles"."role_type" = 'admin'::"public"."user_role_type"))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."user_roles"
  WHERE (("user_roles"."user_id" = "auth"."uid"()) AND ("user_roles"."tenant_id" = "tenant_users"."tenant_id") AND ("user_roles"."role_type" = 'admin'::"public"."user_role_type")))));



CREATE POLICY "Admin users can see and approve tenant requests" ON "public"."tenant_requests" USING ((EXISTS ( SELECT 1
   FROM "public"."user_roles"
  WHERE (("user_roles"."user_id" = "auth"."uid"()) AND ("user_roles"."role_type" = 'admin'::"public"."user_role_type"))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."user_roles"
  WHERE (("user_roles"."user_id" = "auth"."uid"()) AND ("user_roles"."role_type" = 'admin'::"public"."user_role_type")))));



CREATE POLICY "All authenticated users can view custom roles" ON "public"."custom_roles" FOR SELECT USING ("public"."is_tenant_user"("tenant_id"));



CREATE POLICY "Allow insert for authenticated tenant users" ON "public"."oauth_states" FOR INSERT TO "authenticated" WITH CHECK (("public"."is_tenant_user"("tenant_id") OR "public"."is_tenant_owner"("tenant_id") OR "public"."is_system_admin"()));



CREATE POLICY "Allow insert for unauthenticated users" ON "public"."oauth_states" FOR INSERT WITH CHECK (true);



CREATE POLICY "Allow update of name by credential owner or tenant owner" ON "public"."credentials" FOR UPDATE USING ((("auth"."uid"() = "user_id") OR "public"."has_role"("auth"."uid"(), "tenant_id", 'tenant-owner'::"public"."user_role_type"))) WITH CHECK ((("auth"."uid"() = "user_id") OR "public"."has_role"("auth"."uid"(), "tenant_id", 'tenant-owner'::"public"."user_role_type")));



CREATE POLICY "Disallow delete for unauthenticated users" ON "public"."oauth_states" FOR DELETE USING (false);



CREATE POLICY "Disallow read for unauthenticated users" ON "public"."oauth_states" FOR SELECT USING (false);



CREATE POLICY "Disallow update for unauthenticated users" ON "public"."oauth_states" FOR UPDATE USING (false);



CREATE POLICY "Enable insert for authenticated users only" ON "public"."conversation_messages" FOR INSERT TO "authenticated" WITH CHECK (true);



CREATE POLICY "Enable insert for authenticated users only" ON "public"."tenant_users" FOR INSERT TO "authenticated" WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."tenants"
  WHERE ("tenants"."tenant_owner_id" = "auth"."uid"()))));



CREATE POLICY "Enable insert for authenticated users only" ON "public"."tenants" FOR INSERT TO "authenticated" WITH CHECK (true);



CREATE POLICY "Enable read access for all users" ON "public"."conversation_messages" FOR SELECT USING (true);



CREATE POLICY "Enable retrieval of own tenants" ON "public"."tenants" FOR SELECT USING ((( SELECT "auth"."uid"() AS "uid") = "tenant_owner_id"));



CREATE POLICY "Enable users to view their own data only" ON "public"."credentials" FOR SELECT TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "Only system and tenant owners can CRUD" ON "public"."ai_agent_workflows" USING (("public"."is_tenant_owner"("tenant_id") OR "public"."is_system_admin"())) WITH CHECK (("public"."is_tenant_owner"("tenant_id") OR "public"."is_system_admin"()));



CREATE POLICY "Only tenanted user can CRUD" ON "public"."conversation_participants" USING (("public"."is_tenant_user"("tenant_id") OR "public"."is_tenant_owner"("tenant_id") OR "public"."is_system_admin"())) WITH CHECK (("public"."is_tenant_user"("tenant_id") OR "public"."is_tenant_owner"("tenant_id") OR "public"."is_system_admin"()));



CREATE POLICY "Only tenanted user can CRUD" ON "public"."customers" USING (("public"."is_tenant_user"("tenant_id") OR "public"."is_tenant_owner"("tenant_id") OR "public"."is_system_admin"())) WITH CHECK (("public"."is_tenant_user"("tenant_id") OR "public"."is_tenant_owner"("tenant_id") OR "public"."is_system_admin"()));



CREATE POLICY "Only tenanted user can CRUD" ON "public"."messages" USING (("public"."is_tenant_user"("tenant_id") OR "public"."is_tenant_owner"("tenant_id") OR "public"."is_system_admin"())) WITH CHECK (("public"."is_tenant_user"("tenant_id") OR "public"."is_tenant_owner"("tenant_id") OR "public"."is_system_admin"()));



CREATE POLICY "Only tenanted user can CRUD" ON "public"."onboarding_sessions" USING (("public"."is_tenant_user"("tenant_id") OR "public"."is_tenant_owner"("tenant_id") OR "public"."is_system_admin"())) WITH CHECK (("public"."is_tenant_user"("tenant_id") OR "public"."is_tenant_owner"("tenant_id") OR "public"."is_system_admin"()));



CREATE POLICY "Only tenanted user can CRUD" ON "public"."price_items" USING (("public"."is_tenant_user"("tenant_id") OR "public"."is_tenant_owner"("tenant_id") OR "public"."is_system_admin"())) WITH CHECK (("public"."is_tenant_user"("tenant_id") OR "public"."is_tenant_owner"("tenant_id") OR "public"."is_system_admin"()));



CREATE POLICY "Only tenanted user can CRUD" ON "public"."tenant_domains" USING (("public"."is_tenant_owner"("tenant_id") OR "public"."is_system_admin"())) WITH CHECK (("public"."is_tenant_owner"("tenant_id") OR "public"."is_system_admin"()));



CREATE POLICY "Read if authorized" ON "public"."custom_table_definitions" FOR SELECT USING (("public"."can_access_tenant_data"("tenant_id", ARRAY['admin'::"public"."user_role_type", 'super-admin'::"public"."user_role_type", 'tenant-owner'::"public"."user_role_type"]) OR "public"."has_row_permission"("tenant_id", "permissions", 'read'::"text")));



CREATE POLICY "Read if authorized" ON "public"."custom_table_fields" FOR SELECT USING (("public"."can_access_tenant_data"("tenant_id", ARRAY['admin'::"public"."user_role_type", 'super-admin'::"public"."user_role_type", 'tenant-owner'::"public"."user_role_type"]) OR "public"."has_row_permission"("tenant_id", "permissions", 'read'::"text")));



CREATE POLICY "Read if authorized" ON "public"."custom_table_progress" FOR SELECT USING ("public"."can_access_tenant_data"("tenant_id", ARRAY['admin'::"public"."user_role_type", 'super-admin'::"public"."user_role_type", 'tenant-owner'::"public"."user_role_type"]));



CREATE POLICY "Read if authorized" ON "public"."custom_table_relationships" FOR SELECT USING ("public"."can_access_tenant_data"("tenant_id", ARRAY['admin'::"public"."user_role_type", 'super-admin'::"public"."user_role_type", 'tenant-owner'::"public"."user_role_type"]));



CREATE POLICY "Service role access" ON "public"."custom_migrations" USING (("auth"."role"() = 'service_role'::"text"));



CREATE POLICY "Service role access" ON "public"."custom_table_definitions" USING (("auth"."role"() = 'service_role'::"text"));



CREATE POLICY "Service role access" ON "public"."custom_table_fields" USING (("auth"."role"() = 'service_role'::"text"));



CREATE POLICY "Service role access" ON "public"."custom_table_progress" USING (("auth"."role"() = 'service_role'::"text"));



CREATE POLICY "Service role access" ON "public"."custom_table_relationships" USING (("auth"."role"() = 'service_role'::"text"));



CREATE POLICY "System & Tenant Owner CRUD" ON "public"."ai_agents" USING (("public"."is_tenant_owner"("tenant_id") OR "public"."is_system_admin"())) WITH CHECK (("public"."is_tenant_owner"("tenant_id") OR "public"."is_system_admin"()));



CREATE POLICY "System & Tenant Owners CRUD" ON "public"."configs" USING (("public"."is_tenant_owner"("tenant_id") OR "public"."is_system_admin"())) WITH CHECK (("public"."is_tenant_owner"("tenant_id") OR "public"."is_system_admin"()));



CREATE POLICY "System & Tenant owners CRUD" ON "public"."ai_functions" USING (("public"."is_tenant_owner"("tenant_id") OR "public"."is_system_admin"())) WITH CHECK (("public"."is_tenant_owner"("tenant_id") OR "public"."is_system_admin"()));



CREATE POLICY "System & Tenant owners CRUD" ON "public"."connected_services" USING (("public"."is_tenant_owner"("tenant_id") OR "public"."is_system_admin"())) WITH CHECK (("public"."is_tenant_owner"("tenant_id") OR "public"."is_system_admin"()));



CREATE POLICY "System & Tenant owners CRUD" ON "public"."credentials" USING (("public"."is_tenant_owner"("tenant_id") OR "public"."is_system_admin"())) WITH CHECK (("public"."is_tenant_owner"("tenant_id") OR "public"."is_system_admin"()));



CREATE POLICY "System & Tenant owners CRUD" ON "public"."custom_migrations" USING (("public"."is_tenant_owner"("tenant_id") OR "public"."is_system_admin"())) WITH CHECK (("public"."is_tenant_owner"("tenant_id") OR "public"."is_system_admin"()));



CREATE POLICY "System & Tenant owners CRUD" ON "public"."custom_table_data" USING (("public"."is_tenant_owner"("tenant_id") OR "public"."is_system_admin"())) WITH CHECK (("public"."is_tenant_owner"("tenant_id") OR "public"."is_system_admin"()));



CREATE POLICY "System & Tenant owners CRUD" ON "public"."custom_table_definitions" USING (("public"."is_tenant_owner"("tenant_id") OR "public"."is_system_admin"())) WITH CHECK (("public"."is_tenant_owner"("tenant_id") OR "public"."is_system_admin"()));



CREATE POLICY "System & Tenant owners CRUD" ON "public"."custom_table_fields" USING (("public"."is_tenant_owner"("tenant_id") OR "public"."is_system_admin"())) WITH CHECK (("public"."is_tenant_owner"("tenant_id") OR "public"."is_system_admin"()));



CREATE POLICY "System & Tenant owners CRUD" ON "public"."custom_table_relationships" USING (("public"."is_tenant_owner"("tenant_id") OR "public"."is_system_admin"())) WITH CHECK (("public"."is_tenant_owner"("tenant_id") OR "public"."is_system_admin"()));



CREATE POLICY "System & Tenant owners CRUD" ON "public"."user_custom_roles" USING (("public"."is_tenant_owner"("tenant_id") OR "public"."is_system_admin"()));



CREATE POLICY "System & Tenant owners CRUD" ON "public"."webhook_events" USING (("public"."is_tenant_owner"("tenant_id") OR "public"."is_system_admin"())) WITH CHECK (("public"."is_tenant_owner"("tenant_id") OR "public"."is_system_admin"()));



CREATE POLICY "System & Tenant owners CRUD" ON "public"."workflow_instances" USING (("public"."is_tenant_owner"("tenant_id") OR "public"."is_system_admin"())) WITH CHECK (("public"."is_tenant_owner"("tenant_id") OR "public"."is_system_admin"()));



CREATE POLICY "System & Tenant owners CRUD" ON "public"."workflow_steps" USING (("public"."is_tenant_owner"("tenant_id") OR "public"."is_system_admin"())) WITH CHECK (("public"."is_tenant_owner"("tenant_id") OR "public"."is_system_admin"()));



CREATE POLICY "System & Tenant owners CRUD" ON "public"."workflows" USING (("public"."is_tenant_owner"("tenant_id") OR "public"."is_system_admin"())) WITH CHECK (("public"."is_tenant_owner"("tenant_id") OR "public"."is_system_admin"()));



CREATE POLICY "System ONLY" ON "public"."encryption_keys" USING ("public"."is_system_admin"());



CREATE POLICY "System and Tenant owners CRUD" ON "public"."conversations" USING (("public"."is_tenant_owner"("tenant_id") OR "public"."is_system_admin"())) WITH CHECK (("public"."is_tenant_owner"("tenant_id") OR "public"."is_system_admin"()));



CREATE POLICY "System and Tenant owners CRUD" ON "public"."custom_roles" USING (("public"."is_tenant_owner"("tenant_id") OR "public"."is_system_admin"()));



CREATE POLICY "System and Tenant owners CRUD" ON "public"."workflow_responses" USING (("public"."is_tenant_owner"("tenant_id") OR "public"."is_system_admin"())) WITH CHECK (("public"."is_tenant_owner"("tenant_id") OR "public"."is_system_admin"()));



CREATE POLICY "Users can create their own tenant requests" ON "public"."tenant_requests" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can join conversations" ON "public"."conversation_participants" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can leave conversations" ON "public"."conversation_participants" FOR DELETE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can see own tenant memberships" ON "public"."tenant_users" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can see own tenant requests" ON "public"."tenant_requests" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update their own profile" ON "public"."profiles" FOR UPDATE USING (("auth"."uid"() = "id"));



CREATE POLICY "Users can view their own custom roles" ON "public"."user_custom_roles" FOR SELECT USING (("public"."is_tenant_user"("tenant_id") OR "public"."is_tenant_owner"("tenant_id") OR "public"."is_system_admin"()));



CREATE POLICY "Users can view their own participation" ON "public"."conversation_participants" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view their own profile" ON "public"."profiles" FOR SELECT USING (("auth"."uid"() = "id"));



CREATE POLICY "Users can view their own roles" ON "public"."user_roles" FOR SELECT USING (("user_id" = "auth"."uid"()));



CREATE POLICY "Users can view their own tenant requests" ON "public"."tenant_requests" FOR SELECT USING (("auth"."uid"() = "user_id"));



ALTER TABLE "public"."agent_functions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."ai_agent_workflows" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."ai_agents" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."ai_functions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."configs" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."connected_services" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."conversation_messages" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."conversation_participants" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."conversations" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."credentials" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."custom_migrations" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."custom_roles" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."custom_table_data" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."custom_table_data_progress" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."custom_table_definitions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."custom_table_fields" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."custom_table_progress" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."custom_table_relationships" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."customers" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."documents" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."encryption_keys" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."function_queue" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."memories" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."messages" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."oauth_states" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."onboarding_sessions" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "only SYSTEM and TENANT OWNERS can CRUD" ON "public"."agent_functions" USING (("public"."is_tenant_owner"("tenant_id") OR "public"."is_system_admin"())) WITH CHECK (("public"."is_tenant_owner"("tenant_id") OR "public"."is_system_admin"()));



ALTER TABLE "public"."price_items" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."profiles" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."tempEmails" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."tenant_domains" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."tenant_requests" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."tenant_users" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."tenants" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_custom_roles" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_roles" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."webhook_events" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."workflow_instances" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."workflow_responses" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."workflow_steps" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."workflows" ENABLE ROW LEVEL SECURITY;




ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";






ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."conversations";



GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";



GRANT ALL ON FUNCTION "public"."halfvec_in"("cstring", "oid", integer) TO "postgres";
GRANT ALL ON FUNCTION "public"."halfvec_in"("cstring", "oid", integer) TO "anon";
GRANT ALL ON FUNCTION "public"."halfvec_in"("cstring", "oid", integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."halfvec_in"("cstring", "oid", integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."halfvec_out"("public"."halfvec") TO "postgres";
GRANT ALL ON FUNCTION "public"."halfvec_out"("public"."halfvec") TO "anon";
GRANT ALL ON FUNCTION "public"."halfvec_out"("public"."halfvec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."halfvec_out"("public"."halfvec") TO "service_role";



GRANT ALL ON FUNCTION "public"."halfvec_recv"("internal", "oid", integer) TO "postgres";
GRANT ALL ON FUNCTION "public"."halfvec_recv"("internal", "oid", integer) TO "anon";
GRANT ALL ON FUNCTION "public"."halfvec_recv"("internal", "oid", integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."halfvec_recv"("internal", "oid", integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."halfvec_send"("public"."halfvec") TO "postgres";
GRANT ALL ON FUNCTION "public"."halfvec_send"("public"."halfvec") TO "anon";
GRANT ALL ON FUNCTION "public"."halfvec_send"("public"."halfvec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."halfvec_send"("public"."halfvec") TO "service_role";



GRANT ALL ON FUNCTION "public"."halfvec_typmod_in"("cstring"[]) TO "postgres";
GRANT ALL ON FUNCTION "public"."halfvec_typmod_in"("cstring"[]) TO "anon";
GRANT ALL ON FUNCTION "public"."halfvec_typmod_in"("cstring"[]) TO "authenticated";
GRANT ALL ON FUNCTION "public"."halfvec_typmod_in"("cstring"[]) TO "service_role";



GRANT ALL ON FUNCTION "public"."sparsevec_in"("cstring", "oid", integer) TO "postgres";
GRANT ALL ON FUNCTION "public"."sparsevec_in"("cstring", "oid", integer) TO "anon";
GRANT ALL ON FUNCTION "public"."sparsevec_in"("cstring", "oid", integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."sparsevec_in"("cstring", "oid", integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."sparsevec_out"("public"."sparsevec") TO "postgres";
GRANT ALL ON FUNCTION "public"."sparsevec_out"("public"."sparsevec") TO "anon";
GRANT ALL ON FUNCTION "public"."sparsevec_out"("public"."sparsevec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."sparsevec_out"("public"."sparsevec") TO "service_role";



GRANT ALL ON FUNCTION "public"."sparsevec_recv"("internal", "oid", integer) TO "postgres";
GRANT ALL ON FUNCTION "public"."sparsevec_recv"("internal", "oid", integer) TO "anon";
GRANT ALL ON FUNCTION "public"."sparsevec_recv"("internal", "oid", integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."sparsevec_recv"("internal", "oid", integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."sparsevec_send"("public"."sparsevec") TO "postgres";
GRANT ALL ON FUNCTION "public"."sparsevec_send"("public"."sparsevec") TO "anon";
GRANT ALL ON FUNCTION "public"."sparsevec_send"("public"."sparsevec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."sparsevec_send"("public"."sparsevec") TO "service_role";



GRANT ALL ON FUNCTION "public"."sparsevec_typmod_in"("cstring"[]) TO "postgres";
GRANT ALL ON FUNCTION "public"."sparsevec_typmod_in"("cstring"[]) TO "anon";
GRANT ALL ON FUNCTION "public"."sparsevec_typmod_in"("cstring"[]) TO "authenticated";
GRANT ALL ON FUNCTION "public"."sparsevec_typmod_in"("cstring"[]) TO "service_role";



GRANT ALL ON FUNCTION "public"."vector_in"("cstring", "oid", integer) TO "postgres";
GRANT ALL ON FUNCTION "public"."vector_in"("cstring", "oid", integer) TO "anon";
GRANT ALL ON FUNCTION "public"."vector_in"("cstring", "oid", integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."vector_in"("cstring", "oid", integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."vector_out"("public"."vector") TO "postgres";
GRANT ALL ON FUNCTION "public"."vector_out"("public"."vector") TO "anon";
GRANT ALL ON FUNCTION "public"."vector_out"("public"."vector") TO "authenticated";
GRANT ALL ON FUNCTION "public"."vector_out"("public"."vector") TO "service_role";



GRANT ALL ON FUNCTION "public"."vector_recv"("internal", "oid", integer) TO "postgres";
GRANT ALL ON FUNCTION "public"."vector_recv"("internal", "oid", integer) TO "anon";
GRANT ALL ON FUNCTION "public"."vector_recv"("internal", "oid", integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."vector_recv"("internal", "oid", integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."vector_send"("public"."vector") TO "postgres";
GRANT ALL ON FUNCTION "public"."vector_send"("public"."vector") TO "anon";
GRANT ALL ON FUNCTION "public"."vector_send"("public"."vector") TO "authenticated";
GRANT ALL ON FUNCTION "public"."vector_send"("public"."vector") TO "service_role";



GRANT ALL ON FUNCTION "public"."vector_typmod_in"("cstring"[]) TO "postgres";
GRANT ALL ON FUNCTION "public"."vector_typmod_in"("cstring"[]) TO "anon";
GRANT ALL ON FUNCTION "public"."vector_typmod_in"("cstring"[]) TO "authenticated";
GRANT ALL ON FUNCTION "public"."vector_typmod_in"("cstring"[]) TO "service_role";



GRANT ALL ON FUNCTION "public"."array_to_halfvec"(real[], integer, boolean) TO "postgres";
GRANT ALL ON FUNCTION "public"."array_to_halfvec"(real[], integer, boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."array_to_halfvec"(real[], integer, boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."array_to_halfvec"(real[], integer, boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."array_to_sparsevec"(real[], integer, boolean) TO "postgres";
GRANT ALL ON FUNCTION "public"."array_to_sparsevec"(real[], integer, boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."array_to_sparsevec"(real[], integer, boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."array_to_sparsevec"(real[], integer, boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."array_to_vector"(real[], integer, boolean) TO "postgres";
GRANT ALL ON FUNCTION "public"."array_to_vector"(real[], integer, boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."array_to_vector"(real[], integer, boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."array_to_vector"(real[], integer, boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."array_to_halfvec"(double precision[], integer, boolean) TO "postgres";
GRANT ALL ON FUNCTION "public"."array_to_halfvec"(double precision[], integer, boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."array_to_halfvec"(double precision[], integer, boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."array_to_halfvec"(double precision[], integer, boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."array_to_sparsevec"(double precision[], integer, boolean) TO "postgres";
GRANT ALL ON FUNCTION "public"."array_to_sparsevec"(double precision[], integer, boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."array_to_sparsevec"(double precision[], integer, boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."array_to_sparsevec"(double precision[], integer, boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."array_to_vector"(double precision[], integer, boolean) TO "postgres";
GRANT ALL ON FUNCTION "public"."array_to_vector"(double precision[], integer, boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."array_to_vector"(double precision[], integer, boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."array_to_vector"(double precision[], integer, boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."array_to_halfvec"(integer[], integer, boolean) TO "postgres";
GRANT ALL ON FUNCTION "public"."array_to_halfvec"(integer[], integer, boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."array_to_halfvec"(integer[], integer, boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."array_to_halfvec"(integer[], integer, boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."array_to_sparsevec"(integer[], integer, boolean) TO "postgres";
GRANT ALL ON FUNCTION "public"."array_to_sparsevec"(integer[], integer, boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."array_to_sparsevec"(integer[], integer, boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."array_to_sparsevec"(integer[], integer, boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."array_to_vector"(integer[], integer, boolean) TO "postgres";
GRANT ALL ON FUNCTION "public"."array_to_vector"(integer[], integer, boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."array_to_vector"(integer[], integer, boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."array_to_vector"(integer[], integer, boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."array_to_halfvec"(numeric[], integer, boolean) TO "postgres";
GRANT ALL ON FUNCTION "public"."array_to_halfvec"(numeric[], integer, boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."array_to_halfvec"(numeric[], integer, boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."array_to_halfvec"(numeric[], integer, boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."array_to_sparsevec"(numeric[], integer, boolean) TO "postgres";
GRANT ALL ON FUNCTION "public"."array_to_sparsevec"(numeric[], integer, boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."array_to_sparsevec"(numeric[], integer, boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."array_to_sparsevec"(numeric[], integer, boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."array_to_vector"(numeric[], integer, boolean) TO "postgres";
GRANT ALL ON FUNCTION "public"."array_to_vector"(numeric[], integer, boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."array_to_vector"(numeric[], integer, boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."array_to_vector"(numeric[], integer, boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."halfvec_to_float4"("public"."halfvec", integer, boolean) TO "postgres";
GRANT ALL ON FUNCTION "public"."halfvec_to_float4"("public"."halfvec", integer, boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."halfvec_to_float4"("public"."halfvec", integer, boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."halfvec_to_float4"("public"."halfvec", integer, boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."halfvec"("public"."halfvec", integer, boolean) TO "postgres";
GRANT ALL ON FUNCTION "public"."halfvec"("public"."halfvec", integer, boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."halfvec"("public"."halfvec", integer, boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."halfvec"("public"."halfvec", integer, boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."halfvec_to_sparsevec"("public"."halfvec", integer, boolean) TO "postgres";
GRANT ALL ON FUNCTION "public"."halfvec_to_sparsevec"("public"."halfvec", integer, boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."halfvec_to_sparsevec"("public"."halfvec", integer, boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."halfvec_to_sparsevec"("public"."halfvec", integer, boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."halfvec_to_vector"("public"."halfvec", integer, boolean) TO "postgres";
GRANT ALL ON FUNCTION "public"."halfvec_to_vector"("public"."halfvec", integer, boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."halfvec_to_vector"("public"."halfvec", integer, boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."halfvec_to_vector"("public"."halfvec", integer, boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."sparsevec_to_halfvec"("public"."sparsevec", integer, boolean) TO "postgres";
GRANT ALL ON FUNCTION "public"."sparsevec_to_halfvec"("public"."sparsevec", integer, boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."sparsevec_to_halfvec"("public"."sparsevec", integer, boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."sparsevec_to_halfvec"("public"."sparsevec", integer, boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."sparsevec"("public"."sparsevec", integer, boolean) TO "postgres";
GRANT ALL ON FUNCTION "public"."sparsevec"("public"."sparsevec", integer, boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."sparsevec"("public"."sparsevec", integer, boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."sparsevec"("public"."sparsevec", integer, boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."sparsevec_to_vector"("public"."sparsevec", integer, boolean) TO "postgres";
GRANT ALL ON FUNCTION "public"."sparsevec_to_vector"("public"."sparsevec", integer, boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."sparsevec_to_vector"("public"."sparsevec", integer, boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."sparsevec_to_vector"("public"."sparsevec", integer, boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."vector_to_float4"("public"."vector", integer, boolean) TO "postgres";
GRANT ALL ON FUNCTION "public"."vector_to_float4"("public"."vector", integer, boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."vector_to_float4"("public"."vector", integer, boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."vector_to_float4"("public"."vector", integer, boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."vector_to_halfvec"("public"."vector", integer, boolean) TO "postgres";
GRANT ALL ON FUNCTION "public"."vector_to_halfvec"("public"."vector", integer, boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."vector_to_halfvec"("public"."vector", integer, boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."vector_to_halfvec"("public"."vector", integer, boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."vector_to_sparsevec"("public"."vector", integer, boolean) TO "postgres";
GRANT ALL ON FUNCTION "public"."vector_to_sparsevec"("public"."vector", integer, boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."vector_to_sparsevec"("public"."vector", integer, boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."vector_to_sparsevec"("public"."vector", integer, boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."vector"("public"."vector", integer, boolean) TO "postgres";
GRANT ALL ON FUNCTION "public"."vector"("public"."vector", integer, boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."vector"("public"."vector", integer, boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."vector"("public"."vector", integer, boolean) TO "service_role";




















































































































































































GRANT ALL ON FUNCTION "public"."add_custom_table_field"() TO "anon";
GRANT ALL ON FUNCTION "public"."add_custom_table_field"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."add_custom_table_field"() TO "service_role";



GRANT ALL ON FUNCTION "public"."add_default_columns"("table_name" "text", "add_tenant_id" boolean, "tenant_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."add_default_columns"("table_name" "text", "add_tenant_id" boolean, "tenant_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."add_default_columns"("table_name" "text", "add_tenant_id" boolean, "tenant_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."apply_custom_migration"("migration_name" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."apply_custom_migration"("migration_name" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."apply_custom_migration"("migration_name" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."apply_system_admin_rls_policy"("_table_name" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."apply_system_admin_rls_policy"("_table_name" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."apply_system_admin_rls_policy"("_table_name" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."batch_decrypt_jsonb_fields"("_table_name" "text", "_id_column" "text", "_ids" "uuid"[], "_encrypted_fields" "text"[], "_encryption_key" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."batch_decrypt_jsonb_fields"("_table_name" "text", "_id_column" "text", "_ids" "uuid"[], "_encrypted_fields" "text"[], "_encryption_key" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."batch_decrypt_jsonb_fields"("_table_name" "text", "_id_column" "text", "_ids" "uuid"[], "_encrypted_fields" "text"[], "_encryption_key" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."binary_quantize"("public"."halfvec") TO "postgres";
GRANT ALL ON FUNCTION "public"."binary_quantize"("public"."halfvec") TO "anon";
GRANT ALL ON FUNCTION "public"."binary_quantize"("public"."halfvec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."binary_quantize"("public"."halfvec") TO "service_role";



GRANT ALL ON FUNCTION "public"."binary_quantize"("public"."vector") TO "postgres";
GRANT ALL ON FUNCTION "public"."binary_quantize"("public"."vector") TO "anon";
GRANT ALL ON FUNCTION "public"."binary_quantize"("public"."vector") TO "authenticated";
GRANT ALL ON FUNCTION "public"."binary_quantize"("public"."vector") TO "service_role";



GRANT ALL ON FUNCTION "public"."build_default_permissions"() TO "anon";
GRANT ALL ON FUNCTION "public"."build_default_permissions"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."build_default_permissions"() TO "service_role";



GRANT ALL ON FUNCTION "public"."can_access_tenant_data"("target_tenant_id" "uuid", "allowed_roles" "public"."user_role_type"[]) TO "anon";
GRANT ALL ON FUNCTION "public"."can_access_tenant_data"("target_tenant_id" "uuid", "allowed_roles" "public"."user_role_type"[]) TO "authenticated";
GRANT ALL ON FUNCTION "public"."can_access_tenant_data"("target_tenant_id" "uuid", "allowed_roles" "public"."user_role_type"[]) TO "service_role";



GRANT ALL ON FUNCTION "public"."cleanup_oauth_states"() TO "anon";
GRANT ALL ON FUNCTION "public"."cleanup_oauth_states"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."cleanup_oauth_states"() TO "service_role";



GRANT ALL ON FUNCTION "public"."cosine_distance"("public"."halfvec", "public"."halfvec") TO "postgres";
GRANT ALL ON FUNCTION "public"."cosine_distance"("public"."halfvec", "public"."halfvec") TO "anon";
GRANT ALL ON FUNCTION "public"."cosine_distance"("public"."halfvec", "public"."halfvec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."cosine_distance"("public"."halfvec", "public"."halfvec") TO "service_role";



GRANT ALL ON FUNCTION "public"."cosine_distance"("public"."sparsevec", "public"."sparsevec") TO "postgres";
GRANT ALL ON FUNCTION "public"."cosine_distance"("public"."sparsevec", "public"."sparsevec") TO "anon";
GRANT ALL ON FUNCTION "public"."cosine_distance"("public"."sparsevec", "public"."sparsevec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."cosine_distance"("public"."sparsevec", "public"."sparsevec") TO "service_role";



GRANT ALL ON FUNCTION "public"."cosine_distance"("public"."vector", "public"."vector") TO "postgres";
GRANT ALL ON FUNCTION "public"."cosine_distance"("public"."vector", "public"."vector") TO "anon";
GRANT ALL ON FUNCTION "public"."cosine_distance"("public"."vector", "public"."vector") TO "authenticated";
GRANT ALL ON FUNCTION "public"."cosine_distance"("public"."vector", "public"."vector") TO "service_role";



GRANT ALL ON FUNCTION "public"."create_custom_table"() TO "anon";
GRANT ALL ON FUNCTION "public"."create_custom_table"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_custom_table"() TO "service_role";



GRANT ALL ON FUNCTION "public"."create_message_for_conversations"("conversation_ids" "uuid"[], "message_data" "jsonb", "encryption_key" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."create_message_for_conversations"("conversation_ids" "uuid"[], "message_data" "jsonb", "encryption_key" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_message_for_conversations"("conversation_ids" "uuid"[], "message_data" "jsonb", "encryption_key" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."create_rls_policy"("target_table" "regclass", "policy_suffix" "text", "with_user_check" boolean, "with_tenant_check" boolean, "apply_select" boolean, "apply_insert" boolean, "apply_update" boolean, "apply_delete" boolean, "override_roles" "text"[], "drop_existing" boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."create_rls_policy"("target_table" "regclass", "policy_suffix" "text", "with_user_check" boolean, "with_tenant_check" boolean, "apply_select" boolean, "apply_insert" boolean, "apply_update" boolean, "apply_delete" boolean, "override_roles" "text"[], "drop_existing" boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_rls_policy"("target_table" "regclass", "policy_suffix" "text", "with_user_check" boolean, "with_tenant_check" boolean, "apply_select" boolean, "apply_insert" boolean, "apply_update" boolean, "apply_delete" boolean, "override_roles" "text"[], "drop_existing" boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."create_tenant_request"("workspace_name" "text", "user_email" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."create_tenant_request"("workspace_name" "text", "user_email" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_tenant_request"("workspace_name" "text", "user_email" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."decrypt_function_task"("_id" "uuid", "_encryption_key" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."decrypt_function_task"("_id" "uuid", "_encryption_key" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."decrypt_function_task"("_id" "uuid", "_encryption_key" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."decrypt_jsonb_payload"("_encrypted" "bytea", "_encryption_key" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."decrypt_jsonb_payload"("_encrypted" "bytea", "_encryption_key" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."decrypt_jsonb_payload"("_encrypted" "bytea", "_encryption_key" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."decrypt_message"("_message_id" "uuid", "_decryption_key" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."decrypt_message"("_message_id" "uuid", "_decryption_key" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."decrypt_message"("_message_id" "uuid", "_decryption_key" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."decrypt_refresh_token"("_credential_id" "uuid", "_encryption_key" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."decrypt_refresh_token"("_credential_id" "uuid", "_encryption_key" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."decrypt_refresh_token"("_credential_id" "uuid", "_encryption_key" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."delete_custom_table_record"("p_table_name" "text", "p_record_id" "uuid", "p_tenant_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."delete_custom_table_record"("p_table_name" "text", "p_record_id" "uuid", "p_tenant_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."delete_custom_table_record"("p_table_name" "text", "p_record_id" "uuid", "p_tenant_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."delete_expired_oauth_states"() TO "anon";
GRANT ALL ON FUNCTION "public"."delete_expired_oauth_states"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."delete_expired_oauth_states"() TO "service_role";



GRANT ALL ON FUNCTION "public"."encrypt_credentials_trigger"() TO "anon";
GRANT ALL ON FUNCTION "public"."encrypt_credentials_trigger"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."encrypt_credentials_trigger"() TO "service_role";



GRANT ALL ON FUNCTION "public"."encrypt_json_payload"("json_data" "jsonb", "key" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."encrypt_json_payload"("json_data" "jsonb", "key" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."encrypt_json_payload"("json_data" "jsonb", "key" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."encrypt_jsonb_payload"("_payload" "jsonb", "_encryption_key" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."encrypt_jsonb_payload"("_payload" "jsonb", "_encryption_key" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."encrypt_jsonb_payload"("_payload" "jsonb", "_encryption_key" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."enqueue_function_task"("_action" "text", "_payload" "jsonb", "_encryption_key" "text", "_priority" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."enqueue_function_task"("_action" "text", "_payload" "jsonb", "_encryption_key" "text", "_priority" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."enqueue_function_task"("_action" "text", "_payload" "jsonb", "_encryption_key" "text", "_priority" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_conversation_messages"("_conversation_id" "uuid", "_decryption_key" "text", "_search" "text", "_metadata_search" "text", "_role" "text", "_limit" integer, "_offset" integer, "_order" "text", "_sort_direction" "text", "_include_deleted" boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."get_conversation_messages"("_conversation_id" "uuid", "_decryption_key" "text", "_search" "text", "_metadata_search" "text", "_role" "text", "_limit" integer, "_offset" integer, "_order" "text", "_sort_direction" "text", "_include_deleted" boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_conversation_messages"("_conversation_id" "uuid", "_decryption_key" "text", "_search" "text", "_metadata_search" "text", "_role" "text", "_limit" integer, "_offset" integer, "_order" "text", "_sort_direction" "text", "_include_deleted" boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."get_custom_table_data"("p_table_name" "text", "p_tenant_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_custom_table_data"("p_table_name" "text", "p_tenant_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_custom_table_data"("p_table_name" "text", "p_tenant_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_field_types"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_field_types"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_field_types"() TO "service_role";



GRANT ALL ON FUNCTION "public"."get_message"("_message_id" "uuid", "_decryption_key" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."get_message"("_message_id" "uuid", "_decryption_key" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_message"("_message_id" "uuid", "_decryption_key" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_message_by_id"("_message_id" "uuid", "_decryption_key" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."get_message_by_id"("_message_id" "uuid", "_decryption_key" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_message_by_id"("_message_id" "uuid", "_decryption_key" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_next_decrypted_function_tasks"("_batch_size" integer, "_encryption_key" "text", "_task_id" "uuid", "_priority" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."get_next_decrypted_function_tasks"("_batch_size" integer, "_encryption_key" "text", "_task_id" "uuid", "_priority" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_next_decrypted_function_tasks"("_batch_size" integer, "_encryption_key" "text", "_task_id" "uuid", "_priority" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_table_schema"("t_name" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."get_table_schema"("t_name" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_table_schema"("t_name" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_user_tenants"("user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_user_tenants"("user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_user_tenants"("user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."halfvec_accum"(double precision[], "public"."halfvec") TO "postgres";
GRANT ALL ON FUNCTION "public"."halfvec_accum"(double precision[], "public"."halfvec") TO "anon";
GRANT ALL ON FUNCTION "public"."halfvec_accum"(double precision[], "public"."halfvec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."halfvec_accum"(double precision[], "public"."halfvec") TO "service_role";



GRANT ALL ON FUNCTION "public"."halfvec_add"("public"."halfvec", "public"."halfvec") TO "postgres";
GRANT ALL ON FUNCTION "public"."halfvec_add"("public"."halfvec", "public"."halfvec") TO "anon";
GRANT ALL ON FUNCTION "public"."halfvec_add"("public"."halfvec", "public"."halfvec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."halfvec_add"("public"."halfvec", "public"."halfvec") TO "service_role";



GRANT ALL ON FUNCTION "public"."halfvec_avg"(double precision[]) TO "postgres";
GRANT ALL ON FUNCTION "public"."halfvec_avg"(double precision[]) TO "anon";
GRANT ALL ON FUNCTION "public"."halfvec_avg"(double precision[]) TO "authenticated";
GRANT ALL ON FUNCTION "public"."halfvec_avg"(double precision[]) TO "service_role";



GRANT ALL ON FUNCTION "public"."halfvec_cmp"("public"."halfvec", "public"."halfvec") TO "postgres";
GRANT ALL ON FUNCTION "public"."halfvec_cmp"("public"."halfvec", "public"."halfvec") TO "anon";
GRANT ALL ON FUNCTION "public"."halfvec_cmp"("public"."halfvec", "public"."halfvec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."halfvec_cmp"("public"."halfvec", "public"."halfvec") TO "service_role";



GRANT ALL ON FUNCTION "public"."halfvec_combine"(double precision[], double precision[]) TO "postgres";
GRANT ALL ON FUNCTION "public"."halfvec_combine"(double precision[], double precision[]) TO "anon";
GRANT ALL ON FUNCTION "public"."halfvec_combine"(double precision[], double precision[]) TO "authenticated";
GRANT ALL ON FUNCTION "public"."halfvec_combine"(double precision[], double precision[]) TO "service_role";



GRANT ALL ON FUNCTION "public"."halfvec_concat"("public"."halfvec", "public"."halfvec") TO "postgres";
GRANT ALL ON FUNCTION "public"."halfvec_concat"("public"."halfvec", "public"."halfvec") TO "anon";
GRANT ALL ON FUNCTION "public"."halfvec_concat"("public"."halfvec", "public"."halfvec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."halfvec_concat"("public"."halfvec", "public"."halfvec") TO "service_role";



GRANT ALL ON FUNCTION "public"."halfvec_eq"("public"."halfvec", "public"."halfvec") TO "postgres";
GRANT ALL ON FUNCTION "public"."halfvec_eq"("public"."halfvec", "public"."halfvec") TO "anon";
GRANT ALL ON FUNCTION "public"."halfvec_eq"("public"."halfvec", "public"."halfvec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."halfvec_eq"("public"."halfvec", "public"."halfvec") TO "service_role";



GRANT ALL ON FUNCTION "public"."halfvec_ge"("public"."halfvec", "public"."halfvec") TO "postgres";
GRANT ALL ON FUNCTION "public"."halfvec_ge"("public"."halfvec", "public"."halfvec") TO "anon";
GRANT ALL ON FUNCTION "public"."halfvec_ge"("public"."halfvec", "public"."halfvec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."halfvec_ge"("public"."halfvec", "public"."halfvec") TO "service_role";



GRANT ALL ON FUNCTION "public"."halfvec_gt"("public"."halfvec", "public"."halfvec") TO "postgres";
GRANT ALL ON FUNCTION "public"."halfvec_gt"("public"."halfvec", "public"."halfvec") TO "anon";
GRANT ALL ON FUNCTION "public"."halfvec_gt"("public"."halfvec", "public"."halfvec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."halfvec_gt"("public"."halfvec", "public"."halfvec") TO "service_role";



GRANT ALL ON FUNCTION "public"."halfvec_l2_squared_distance"("public"."halfvec", "public"."halfvec") TO "postgres";
GRANT ALL ON FUNCTION "public"."halfvec_l2_squared_distance"("public"."halfvec", "public"."halfvec") TO "anon";
GRANT ALL ON FUNCTION "public"."halfvec_l2_squared_distance"("public"."halfvec", "public"."halfvec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."halfvec_l2_squared_distance"("public"."halfvec", "public"."halfvec") TO "service_role";



GRANT ALL ON FUNCTION "public"."halfvec_le"("public"."halfvec", "public"."halfvec") TO "postgres";
GRANT ALL ON FUNCTION "public"."halfvec_le"("public"."halfvec", "public"."halfvec") TO "anon";
GRANT ALL ON FUNCTION "public"."halfvec_le"("public"."halfvec", "public"."halfvec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."halfvec_le"("public"."halfvec", "public"."halfvec") TO "service_role";



GRANT ALL ON FUNCTION "public"."halfvec_lt"("public"."halfvec", "public"."halfvec") TO "postgres";
GRANT ALL ON FUNCTION "public"."halfvec_lt"("public"."halfvec", "public"."halfvec") TO "anon";
GRANT ALL ON FUNCTION "public"."halfvec_lt"("public"."halfvec", "public"."halfvec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."halfvec_lt"("public"."halfvec", "public"."halfvec") TO "service_role";



GRANT ALL ON FUNCTION "public"."halfvec_mul"("public"."halfvec", "public"."halfvec") TO "postgres";
GRANT ALL ON FUNCTION "public"."halfvec_mul"("public"."halfvec", "public"."halfvec") TO "anon";
GRANT ALL ON FUNCTION "public"."halfvec_mul"("public"."halfvec", "public"."halfvec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."halfvec_mul"("public"."halfvec", "public"."halfvec") TO "service_role";



GRANT ALL ON FUNCTION "public"."halfvec_ne"("public"."halfvec", "public"."halfvec") TO "postgres";
GRANT ALL ON FUNCTION "public"."halfvec_ne"("public"."halfvec", "public"."halfvec") TO "anon";
GRANT ALL ON FUNCTION "public"."halfvec_ne"("public"."halfvec", "public"."halfvec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."halfvec_ne"("public"."halfvec", "public"."halfvec") TO "service_role";



GRANT ALL ON FUNCTION "public"."halfvec_negative_inner_product"("public"."halfvec", "public"."halfvec") TO "postgres";
GRANT ALL ON FUNCTION "public"."halfvec_negative_inner_product"("public"."halfvec", "public"."halfvec") TO "anon";
GRANT ALL ON FUNCTION "public"."halfvec_negative_inner_product"("public"."halfvec", "public"."halfvec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."halfvec_negative_inner_product"("public"."halfvec", "public"."halfvec") TO "service_role";



GRANT ALL ON FUNCTION "public"."halfvec_spherical_distance"("public"."halfvec", "public"."halfvec") TO "postgres";
GRANT ALL ON FUNCTION "public"."halfvec_spherical_distance"("public"."halfvec", "public"."halfvec") TO "anon";
GRANT ALL ON FUNCTION "public"."halfvec_spherical_distance"("public"."halfvec", "public"."halfvec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."halfvec_spherical_distance"("public"."halfvec", "public"."halfvec") TO "service_role";



GRANT ALL ON FUNCTION "public"."halfvec_sub"("public"."halfvec", "public"."halfvec") TO "postgres";
GRANT ALL ON FUNCTION "public"."halfvec_sub"("public"."halfvec", "public"."halfvec") TO "anon";
GRANT ALL ON FUNCTION "public"."halfvec_sub"("public"."halfvec", "public"."halfvec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."halfvec_sub"("public"."halfvec", "public"."halfvec") TO "service_role";



GRANT ALL ON FUNCTION "public"."hamming_distance"(bit, bit) TO "postgres";
GRANT ALL ON FUNCTION "public"."hamming_distance"(bit, bit) TO "anon";
GRANT ALL ON FUNCTION "public"."hamming_distance"(bit, bit) TO "authenticated";
GRANT ALL ON FUNCTION "public"."hamming_distance"(bit, bit) TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "service_role";



GRANT ALL ON FUNCTION "public"."has_role"("_user_id" "uuid", "_tenant_id" "uuid", "_role" "public"."user_role_type") TO "anon";
GRANT ALL ON FUNCTION "public"."has_role"("_user_id" "uuid", "_tenant_id" "uuid", "_role" "public"."user_role_type") TO "authenticated";
GRANT ALL ON FUNCTION "public"."has_role"("_user_id" "uuid", "_tenant_id" "uuid", "_role" "public"."user_role_type") TO "service_role";



GRANT ALL ON FUNCTION "public"."has_row_permission"("target_tenant_id" "uuid", "perms" "jsonb", "action" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."has_row_permission"("target_tenant_id" "uuid", "perms" "jsonb", "action" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."has_row_permission"("target_tenant_id" "uuid", "perms" "jsonb", "action" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."hnsw_bit_support"("internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."hnsw_bit_support"("internal") TO "anon";
GRANT ALL ON FUNCTION "public"."hnsw_bit_support"("internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."hnsw_bit_support"("internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."hnsw_halfvec_support"("internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."hnsw_halfvec_support"("internal") TO "anon";
GRANT ALL ON FUNCTION "public"."hnsw_halfvec_support"("internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."hnsw_halfvec_support"("internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."hnsw_sparsevec_support"("internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."hnsw_sparsevec_support"("internal") TO "anon";
GRANT ALL ON FUNCTION "public"."hnsw_sparsevec_support"("internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."hnsw_sparsevec_support"("internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."hnswhandler"("internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."hnswhandler"("internal") TO "anon";
GRANT ALL ON FUNCTION "public"."hnswhandler"("internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."hnswhandler"("internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."import_custom_table_data"("import_data" "jsonb", "input_tenant_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."import_custom_table_data"("import_data" "jsonb", "input_tenant_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."import_custom_table_data"("import_data" "jsonb", "input_tenant_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."inner_product"("public"."halfvec", "public"."halfvec") TO "postgres";
GRANT ALL ON FUNCTION "public"."inner_product"("public"."halfvec", "public"."halfvec") TO "anon";
GRANT ALL ON FUNCTION "public"."inner_product"("public"."halfvec", "public"."halfvec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."inner_product"("public"."halfvec", "public"."halfvec") TO "service_role";



GRANT ALL ON FUNCTION "public"."inner_product"("public"."sparsevec", "public"."sparsevec") TO "postgres";
GRANT ALL ON FUNCTION "public"."inner_product"("public"."sparsevec", "public"."sparsevec") TO "anon";
GRANT ALL ON FUNCTION "public"."inner_product"("public"."sparsevec", "public"."sparsevec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."inner_product"("public"."sparsevec", "public"."sparsevec") TO "service_role";



GRANT ALL ON FUNCTION "public"."inner_product"("public"."vector", "public"."vector") TO "postgres";
GRANT ALL ON FUNCTION "public"."inner_product"("public"."vector", "public"."vector") TO "anon";
GRANT ALL ON FUNCTION "public"."inner_product"("public"."vector", "public"."vector") TO "authenticated";
GRANT ALL ON FUNCTION "public"."inner_product"("public"."vector", "public"."vector") TO "service_role";



GRANT ALL ON FUNCTION "public"."insert_and_trigger_function_task"("_action" "text", "_payload" "jsonb", "_encryption_key" "text", "_function_url" "text", "_service_role_key" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."insert_and_trigger_function_task"("_action" "text", "_payload" "jsonb", "_encryption_key" "text", "_function_url" "text", "_service_role_key" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."insert_and_trigger_function_task"("_action" "text", "_payload" "jsonb", "_encryption_key" "text", "_function_url" "text", "_service_role_key" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."insert_credential"("_encryption_key" "text", "_access_token" "text", "_refresh_token" "text", "_scopes" "text"[], "_type" "text", "_user_id" "uuid", "_tenant_id" "uuid", "_expires_at" timestamp without time zone, "_provider" "text", "_encryption_key_id" "uuid", "_name" "text", "_domain" "text", "_password" "text", "_username" "text", "_tid" "text", "_associated_email" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."insert_credential"("_encryption_key" "text", "_access_token" "text", "_refresh_token" "text", "_scopes" "text"[], "_type" "text", "_user_id" "uuid", "_tenant_id" "uuid", "_expires_at" timestamp without time zone, "_provider" "text", "_encryption_key_id" "uuid", "_name" "text", "_domain" "text", "_password" "text", "_username" "text", "_tid" "text", "_associated_email" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."insert_credential"("_encryption_key" "text", "_access_token" "text", "_refresh_token" "text", "_scopes" "text"[], "_type" "text", "_user_id" "uuid", "_tenant_id" "uuid", "_expires_at" timestamp without time zone, "_provider" "text", "_encryption_key_id" "uuid", "_name" "text", "_domain" "text", "_password" "text", "_username" "text", "_tid" "text", "_associated_email" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."insert_custom_table_record"("p_table_name" "text", "p_tenant_id" "uuid", "p_data" "jsonb") TO "anon";
GRANT ALL ON FUNCTION "public"."insert_custom_table_record"("p_table_name" "text", "p_tenant_id" "uuid", "p_data" "jsonb") TO "authenticated";
GRANT ALL ON FUNCTION "public"."insert_custom_table_record"("p_table_name" "text", "p_tenant_id" "uuid", "p_data" "jsonb") TO "service_role";



GRANT ALL ON FUNCTION "public"."insert_custom_tables"("schema_data" "jsonb", "input_tenant_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."insert_custom_tables"("schema_data" "jsonb", "input_tenant_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."insert_custom_tables"("schema_data" "jsonb", "input_tenant_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."insert_user_role"("p_email" "text", "p_tenant_workspace" "text", "p_role" "public"."user_role_type") TO "anon";
GRANT ALL ON FUNCTION "public"."insert_user_role"("p_email" "text", "p_tenant_workspace" "text", "p_role" "public"."user_role_type") TO "authenticated";
GRANT ALL ON FUNCTION "public"."insert_user_role"("p_email" "text", "p_tenant_workspace" "text", "p_role" "public"."user_role_type") TO "service_role";



GRANT ALL ON FUNCTION "public"."is_super_admin"("_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."is_super_admin"("_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_super_admin"("_user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."is_system_admin"() TO "anon";
GRANT ALL ON FUNCTION "public"."is_system_admin"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_system_admin"() TO "service_role";



GRANT ALL ON FUNCTION "public"."is_tenant_owner"("_tenant_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."is_tenant_owner"("_tenant_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_tenant_owner"("_tenant_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."is_tenant_user"("_tenant_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."is_tenant_user"("_tenant_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_tenant_user"("_tenant_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."ivfflat_bit_support"("internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."ivfflat_bit_support"("internal") TO "anon";
GRANT ALL ON FUNCTION "public"."ivfflat_bit_support"("internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."ivfflat_bit_support"("internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."ivfflat_halfvec_support"("internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."ivfflat_halfvec_support"("internal") TO "anon";
GRANT ALL ON FUNCTION "public"."ivfflat_halfvec_support"("internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."ivfflat_halfvec_support"("internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."ivfflathandler"("internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."ivfflathandler"("internal") TO "anon";
GRANT ALL ON FUNCTION "public"."ivfflathandler"("internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."ivfflathandler"("internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."jaccard_distance"(bit, bit) TO "postgres";
GRANT ALL ON FUNCTION "public"."jaccard_distance"(bit, bit) TO "anon";
GRANT ALL ON FUNCTION "public"."jaccard_distance"(bit, bit) TO "authenticated";
GRANT ALL ON FUNCTION "public"."jaccard_distance"(bit, bit) TO "service_role";



GRANT ALL ON FUNCTION "public"."l1_distance"("public"."halfvec", "public"."halfvec") TO "postgres";
GRANT ALL ON FUNCTION "public"."l1_distance"("public"."halfvec", "public"."halfvec") TO "anon";
GRANT ALL ON FUNCTION "public"."l1_distance"("public"."halfvec", "public"."halfvec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."l1_distance"("public"."halfvec", "public"."halfvec") TO "service_role";



GRANT ALL ON FUNCTION "public"."l1_distance"("public"."sparsevec", "public"."sparsevec") TO "postgres";
GRANT ALL ON FUNCTION "public"."l1_distance"("public"."sparsevec", "public"."sparsevec") TO "anon";
GRANT ALL ON FUNCTION "public"."l1_distance"("public"."sparsevec", "public"."sparsevec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."l1_distance"("public"."sparsevec", "public"."sparsevec") TO "service_role";



GRANT ALL ON FUNCTION "public"."l1_distance"("public"."vector", "public"."vector") TO "postgres";
GRANT ALL ON FUNCTION "public"."l1_distance"("public"."vector", "public"."vector") TO "anon";
GRANT ALL ON FUNCTION "public"."l1_distance"("public"."vector", "public"."vector") TO "authenticated";
GRANT ALL ON FUNCTION "public"."l1_distance"("public"."vector", "public"."vector") TO "service_role";



GRANT ALL ON FUNCTION "public"."l2_distance"("public"."halfvec", "public"."halfvec") TO "postgres";
GRANT ALL ON FUNCTION "public"."l2_distance"("public"."halfvec", "public"."halfvec") TO "anon";
GRANT ALL ON FUNCTION "public"."l2_distance"("public"."halfvec", "public"."halfvec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."l2_distance"("public"."halfvec", "public"."halfvec") TO "service_role";



GRANT ALL ON FUNCTION "public"."l2_distance"("public"."sparsevec", "public"."sparsevec") TO "postgres";
GRANT ALL ON FUNCTION "public"."l2_distance"("public"."sparsevec", "public"."sparsevec") TO "anon";
GRANT ALL ON FUNCTION "public"."l2_distance"("public"."sparsevec", "public"."sparsevec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."l2_distance"("public"."sparsevec", "public"."sparsevec") TO "service_role";



GRANT ALL ON FUNCTION "public"."l2_distance"("public"."vector", "public"."vector") TO "postgres";
GRANT ALL ON FUNCTION "public"."l2_distance"("public"."vector", "public"."vector") TO "anon";
GRANT ALL ON FUNCTION "public"."l2_distance"("public"."vector", "public"."vector") TO "authenticated";
GRANT ALL ON FUNCTION "public"."l2_distance"("public"."vector", "public"."vector") TO "service_role";



GRANT ALL ON FUNCTION "public"."l2_norm"("public"."halfvec") TO "postgres";
GRANT ALL ON FUNCTION "public"."l2_norm"("public"."halfvec") TO "anon";
GRANT ALL ON FUNCTION "public"."l2_norm"("public"."halfvec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."l2_norm"("public"."halfvec") TO "service_role";



GRANT ALL ON FUNCTION "public"."l2_norm"("public"."sparsevec") TO "postgres";
GRANT ALL ON FUNCTION "public"."l2_norm"("public"."sparsevec") TO "anon";
GRANT ALL ON FUNCTION "public"."l2_norm"("public"."sparsevec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."l2_norm"("public"."sparsevec") TO "service_role";



GRANT ALL ON FUNCTION "public"."l2_normalize"("public"."halfvec") TO "postgres";
GRANT ALL ON FUNCTION "public"."l2_normalize"("public"."halfvec") TO "anon";
GRANT ALL ON FUNCTION "public"."l2_normalize"("public"."halfvec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."l2_normalize"("public"."halfvec") TO "service_role";



GRANT ALL ON FUNCTION "public"."l2_normalize"("public"."sparsevec") TO "postgres";
GRANT ALL ON FUNCTION "public"."l2_normalize"("public"."sparsevec") TO "anon";
GRANT ALL ON FUNCTION "public"."l2_normalize"("public"."sparsevec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."l2_normalize"("public"."sparsevec") TO "service_role";



GRANT ALL ON FUNCTION "public"."l2_normalize"("public"."vector") TO "postgres";
GRANT ALL ON FUNCTION "public"."l2_normalize"("public"."vector") TO "anon";
GRANT ALL ON FUNCTION "public"."l2_normalize"("public"."vector") TO "authenticated";
GRANT ALL ON FUNCTION "public"."l2_normalize"("public"."vector") TO "service_role";



GRANT ALL ON FUNCTION "public"."log_credential_update"() TO "anon";
GRANT ALL ON FUNCTION "public"."log_credential_update"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."log_credential_update"() TO "service_role";



GRANT ALL ON FUNCTION "public"."log_oauth_state_insert"() TO "anon";
GRANT ALL ON FUNCTION "public"."log_oauth_state_insert"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."log_oauth_state_insert"() TO "service_role";



GRANT ALL ON FUNCTION "public"."log_webhook_event"("_tenant_id" "uuid", "_payload" "jsonb", "_encryption_key" "text", "_headers" "jsonb", "_connected_service_id" "uuid", "_status" "text", "_error_message" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."log_webhook_event"("_tenant_id" "uuid", "_payload" "jsonb", "_encryption_key" "text", "_headers" "jsonb", "_connected_service_id" "uuid", "_status" "text", "_error_message" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."log_webhook_event"("_tenant_id" "uuid", "_payload" "jsonb", "_encryption_key" "text", "_headers" "jsonb", "_connected_service_id" "uuid", "_status" "text", "_error_message" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."make_column_unique_to_tenant"("table_name" "text", "col1" "text", "constraint_name" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."make_column_unique_to_tenant"("table_name" "text", "col1" "text", "constraint_name" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."make_column_unique_to_tenant"("table_name" "text", "col1" "text", "constraint_name" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."mark_function_task_failed"("_id" "uuid", "_error" "text", "_max_retries" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."mark_function_task_failed"("_id" "uuid", "_error" "text", "_max_retries" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."mark_function_task_failed"("_id" "uuid", "_error" "text", "_max_retries" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."mark_function_task_passed"("_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."mark_function_task_passed"("_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."mark_function_task_passed"("_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."match_documents"("query_embedding" "public"."vector", "match_count" integer, "filter" "jsonb") TO "anon";
GRANT ALL ON FUNCTION "public"."match_documents"("query_embedding" "public"."vector", "match_count" integer, "filter" "jsonb") TO "authenticated";
GRANT ALL ON FUNCTION "public"."match_documents"("query_embedding" "public"."vector", "match_count" integer, "filter" "jsonb") TO "service_role";



GRANT ALL ON FUNCTION "public"."notify_progress"() TO "anon";
GRANT ALL ON FUNCTION "public"."notify_progress"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."notify_progress"() TO "service_role";



GRANT ALL ON FUNCTION "public"."set_current_setting"("name" "text", "value" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."set_current_setting"("name" "text", "value" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."set_current_setting"("name" "text", "value" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."shared_message_columns"("_decryption_key" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."shared_message_columns"("_decryption_key" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."shared_message_columns"("_decryption_key" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."sparsevec_cmp"("public"."sparsevec", "public"."sparsevec") TO "postgres";
GRANT ALL ON FUNCTION "public"."sparsevec_cmp"("public"."sparsevec", "public"."sparsevec") TO "anon";
GRANT ALL ON FUNCTION "public"."sparsevec_cmp"("public"."sparsevec", "public"."sparsevec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."sparsevec_cmp"("public"."sparsevec", "public"."sparsevec") TO "service_role";



GRANT ALL ON FUNCTION "public"."sparsevec_eq"("public"."sparsevec", "public"."sparsevec") TO "postgres";
GRANT ALL ON FUNCTION "public"."sparsevec_eq"("public"."sparsevec", "public"."sparsevec") TO "anon";
GRANT ALL ON FUNCTION "public"."sparsevec_eq"("public"."sparsevec", "public"."sparsevec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."sparsevec_eq"("public"."sparsevec", "public"."sparsevec") TO "service_role";



GRANT ALL ON FUNCTION "public"."sparsevec_ge"("public"."sparsevec", "public"."sparsevec") TO "postgres";
GRANT ALL ON FUNCTION "public"."sparsevec_ge"("public"."sparsevec", "public"."sparsevec") TO "anon";
GRANT ALL ON FUNCTION "public"."sparsevec_ge"("public"."sparsevec", "public"."sparsevec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."sparsevec_ge"("public"."sparsevec", "public"."sparsevec") TO "service_role";



GRANT ALL ON FUNCTION "public"."sparsevec_gt"("public"."sparsevec", "public"."sparsevec") TO "postgres";
GRANT ALL ON FUNCTION "public"."sparsevec_gt"("public"."sparsevec", "public"."sparsevec") TO "anon";
GRANT ALL ON FUNCTION "public"."sparsevec_gt"("public"."sparsevec", "public"."sparsevec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."sparsevec_gt"("public"."sparsevec", "public"."sparsevec") TO "service_role";



GRANT ALL ON FUNCTION "public"."sparsevec_l2_squared_distance"("public"."sparsevec", "public"."sparsevec") TO "postgres";
GRANT ALL ON FUNCTION "public"."sparsevec_l2_squared_distance"("public"."sparsevec", "public"."sparsevec") TO "anon";
GRANT ALL ON FUNCTION "public"."sparsevec_l2_squared_distance"("public"."sparsevec", "public"."sparsevec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."sparsevec_l2_squared_distance"("public"."sparsevec", "public"."sparsevec") TO "service_role";



GRANT ALL ON FUNCTION "public"."sparsevec_le"("public"."sparsevec", "public"."sparsevec") TO "postgres";
GRANT ALL ON FUNCTION "public"."sparsevec_le"("public"."sparsevec", "public"."sparsevec") TO "anon";
GRANT ALL ON FUNCTION "public"."sparsevec_le"("public"."sparsevec", "public"."sparsevec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."sparsevec_le"("public"."sparsevec", "public"."sparsevec") TO "service_role";



GRANT ALL ON FUNCTION "public"."sparsevec_lt"("public"."sparsevec", "public"."sparsevec") TO "postgres";
GRANT ALL ON FUNCTION "public"."sparsevec_lt"("public"."sparsevec", "public"."sparsevec") TO "anon";
GRANT ALL ON FUNCTION "public"."sparsevec_lt"("public"."sparsevec", "public"."sparsevec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."sparsevec_lt"("public"."sparsevec", "public"."sparsevec") TO "service_role";



GRANT ALL ON FUNCTION "public"."sparsevec_ne"("public"."sparsevec", "public"."sparsevec") TO "postgres";
GRANT ALL ON FUNCTION "public"."sparsevec_ne"("public"."sparsevec", "public"."sparsevec") TO "anon";
GRANT ALL ON FUNCTION "public"."sparsevec_ne"("public"."sparsevec", "public"."sparsevec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."sparsevec_ne"("public"."sparsevec", "public"."sparsevec") TO "service_role";



GRANT ALL ON FUNCTION "public"."sparsevec_negative_inner_product"("public"."sparsevec", "public"."sparsevec") TO "postgres";
GRANT ALL ON FUNCTION "public"."sparsevec_negative_inner_product"("public"."sparsevec", "public"."sparsevec") TO "anon";
GRANT ALL ON FUNCTION "public"."sparsevec_negative_inner_product"("public"."sparsevec", "public"."sparsevec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."sparsevec_negative_inner_product"("public"."sparsevec", "public"."sparsevec") TO "service_role";



GRANT ALL ON FUNCTION "public"."subvector"("public"."halfvec", integer, integer) TO "postgres";
GRANT ALL ON FUNCTION "public"."subvector"("public"."halfvec", integer, integer) TO "anon";
GRANT ALL ON FUNCTION "public"."subvector"("public"."halfvec", integer, integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."subvector"("public"."halfvec", integer, integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."subvector"("public"."vector", integer, integer) TO "postgres";
GRANT ALL ON FUNCTION "public"."subvector"("public"."vector", integer, integer) TO "anon";
GRANT ALL ON FUNCTION "public"."subvector"("public"."vector", integer, integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."subvector"("public"."vector", integer, integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."test_encryption_setting"() TO "anon";
GRANT ALL ON FUNCTION "public"."test_encryption_setting"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."test_encryption_setting"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_credential"("_credential_id" "uuid", "_access_token" "text", "_refresh_token" "text", "_expires_at" timestamp without time zone, "_scopes" "text"[], "_encryption_key" "text", "_encryption_key_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."update_credential"("_credential_id" "uuid", "_access_token" "text", "_refresh_token" "text", "_expires_at" timestamp without time zone, "_scopes" "text"[], "_encryption_key" "text", "_encryption_key_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_credential"("_credential_id" "uuid", "_access_token" "text", "_refresh_token" "text", "_expires_at" timestamp without time zone, "_scopes" "text"[], "_encryption_key" "text", "_encryption_key_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."update_credential"("_credential_id" "uuid", "_access_token" "text", "_refresh_token" "text", "_expires_at" timestamp without time zone, "_scopes" "text"[], "_encryption_key" "text", "_encryption_key_id" "uuid", "_refresh_failed" boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."update_credential"("_credential_id" "uuid", "_access_token" "text", "_refresh_token" "text", "_expires_at" timestamp without time zone, "_scopes" "text"[], "_encryption_key" "text", "_encryption_key_id" "uuid", "_refresh_failed" boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_credential"("_credential_id" "uuid", "_access_token" "text", "_refresh_token" "text", "_expires_at" timestamp without time zone, "_scopes" "text"[], "_encryption_key" "text", "_encryption_key_id" "uuid", "_refresh_failed" boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."update_custom_table_record"("p_table_name" "text", "p_record_id" "uuid", "p_tenant_id" "uuid", "p_data" "jsonb") TO "anon";
GRANT ALL ON FUNCTION "public"."update_custom_table_record"("p_table_name" "text", "p_record_id" "uuid", "p_tenant_id" "uuid", "p_data" "jsonb") TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_custom_table_record"("p_table_name" "text", "p_record_id" "uuid", "p_tenant_id" "uuid", "p_data" "jsonb") TO "service_role";



GRANT ALL ON FUNCTION "public"."update_message"("_message_id" "uuid", "_content" "jsonb", "_role" "text", "_metadata" "jsonb", "_encryption_key" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."update_message"("_message_id" "uuid", "_content" "jsonb", "_role" "text", "_metadata" "jsonb", "_encryption_key" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_message"("_message_id" "uuid", "_content" "jsonb", "_role" "text", "_metadata" "jsonb", "_encryption_key" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."update_timestamp"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_timestamp"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_timestamp"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_webhook_event"("_id" "uuid", "_tenant_id" "uuid", "_status" "text", "_error_message" "text", "_processed" boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."update_webhook_event"("_id" "uuid", "_tenant_id" "uuid", "_status" "text", "_error_message" "text", "_processed" boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_webhook_event"("_id" "uuid", "_tenant_id" "uuid", "_status" "text", "_error_message" "text", "_processed" boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."user_has_custom_role"("_user_id" "uuid", "_tenant_id" "uuid", "_custom_role_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."user_has_custom_role"("_user_id" "uuid", "_tenant_id" "uuid", "_custom_role_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."user_has_custom_role"("_user_id" "uuid", "_tenant_id" "uuid", "_custom_role_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."user_has_field_permission"("_user_id" "uuid", "_tenant_id" "uuid", "_field_id" "uuid", "_permission" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."user_has_field_permission"("_user_id" "uuid", "_tenant_id" "uuid", "_field_id" "uuid", "_permission" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."user_has_field_permission"("_user_id" "uuid", "_tenant_id" "uuid", "_field_id" "uuid", "_permission" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."user_has_table_permission"("_user_id" "uuid", "_tenant_id" "uuid", "_table_id" "uuid", "_permission" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."user_has_table_permission"("_user_id" "uuid", "_tenant_id" "uuid", "_table_id" "uuid", "_permission" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."user_has_table_permission"("_user_id" "uuid", "_tenant_id" "uuid", "_table_id" "uuid", "_permission" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."vector_accum"(double precision[], "public"."vector") TO "postgres";
GRANT ALL ON FUNCTION "public"."vector_accum"(double precision[], "public"."vector") TO "anon";
GRANT ALL ON FUNCTION "public"."vector_accum"(double precision[], "public"."vector") TO "authenticated";
GRANT ALL ON FUNCTION "public"."vector_accum"(double precision[], "public"."vector") TO "service_role";



GRANT ALL ON FUNCTION "public"."vector_add"("public"."vector", "public"."vector") TO "postgres";
GRANT ALL ON FUNCTION "public"."vector_add"("public"."vector", "public"."vector") TO "anon";
GRANT ALL ON FUNCTION "public"."vector_add"("public"."vector", "public"."vector") TO "authenticated";
GRANT ALL ON FUNCTION "public"."vector_add"("public"."vector", "public"."vector") TO "service_role";



GRANT ALL ON FUNCTION "public"."vector_avg"(double precision[]) TO "postgres";
GRANT ALL ON FUNCTION "public"."vector_avg"(double precision[]) TO "anon";
GRANT ALL ON FUNCTION "public"."vector_avg"(double precision[]) TO "authenticated";
GRANT ALL ON FUNCTION "public"."vector_avg"(double precision[]) TO "service_role";



GRANT ALL ON FUNCTION "public"."vector_cmp"("public"."vector", "public"."vector") TO "postgres";
GRANT ALL ON FUNCTION "public"."vector_cmp"("public"."vector", "public"."vector") TO "anon";
GRANT ALL ON FUNCTION "public"."vector_cmp"("public"."vector", "public"."vector") TO "authenticated";
GRANT ALL ON FUNCTION "public"."vector_cmp"("public"."vector", "public"."vector") TO "service_role";



GRANT ALL ON FUNCTION "public"."vector_combine"(double precision[], double precision[]) TO "postgres";
GRANT ALL ON FUNCTION "public"."vector_combine"(double precision[], double precision[]) TO "anon";
GRANT ALL ON FUNCTION "public"."vector_combine"(double precision[], double precision[]) TO "authenticated";
GRANT ALL ON FUNCTION "public"."vector_combine"(double precision[], double precision[]) TO "service_role";



GRANT ALL ON FUNCTION "public"."vector_concat"("public"."vector", "public"."vector") TO "postgres";
GRANT ALL ON FUNCTION "public"."vector_concat"("public"."vector", "public"."vector") TO "anon";
GRANT ALL ON FUNCTION "public"."vector_concat"("public"."vector", "public"."vector") TO "authenticated";
GRANT ALL ON FUNCTION "public"."vector_concat"("public"."vector", "public"."vector") TO "service_role";



GRANT ALL ON FUNCTION "public"."vector_dims"("public"."halfvec") TO "postgres";
GRANT ALL ON FUNCTION "public"."vector_dims"("public"."halfvec") TO "anon";
GRANT ALL ON FUNCTION "public"."vector_dims"("public"."halfvec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."vector_dims"("public"."halfvec") TO "service_role";



GRANT ALL ON FUNCTION "public"."vector_dims"("public"."vector") TO "postgres";
GRANT ALL ON FUNCTION "public"."vector_dims"("public"."vector") TO "anon";
GRANT ALL ON FUNCTION "public"."vector_dims"("public"."vector") TO "authenticated";
GRANT ALL ON FUNCTION "public"."vector_dims"("public"."vector") TO "service_role";



GRANT ALL ON FUNCTION "public"."vector_eq"("public"."vector", "public"."vector") TO "postgres";
GRANT ALL ON FUNCTION "public"."vector_eq"("public"."vector", "public"."vector") TO "anon";
GRANT ALL ON FUNCTION "public"."vector_eq"("public"."vector", "public"."vector") TO "authenticated";
GRANT ALL ON FUNCTION "public"."vector_eq"("public"."vector", "public"."vector") TO "service_role";



GRANT ALL ON FUNCTION "public"."vector_ge"("public"."vector", "public"."vector") TO "postgres";
GRANT ALL ON FUNCTION "public"."vector_ge"("public"."vector", "public"."vector") TO "anon";
GRANT ALL ON FUNCTION "public"."vector_ge"("public"."vector", "public"."vector") TO "authenticated";
GRANT ALL ON FUNCTION "public"."vector_ge"("public"."vector", "public"."vector") TO "service_role";



GRANT ALL ON FUNCTION "public"."vector_gt"("public"."vector", "public"."vector") TO "postgres";
GRANT ALL ON FUNCTION "public"."vector_gt"("public"."vector", "public"."vector") TO "anon";
GRANT ALL ON FUNCTION "public"."vector_gt"("public"."vector", "public"."vector") TO "authenticated";
GRANT ALL ON FUNCTION "public"."vector_gt"("public"."vector", "public"."vector") TO "service_role";



GRANT ALL ON FUNCTION "public"."vector_l2_squared_distance"("public"."vector", "public"."vector") TO "postgres";
GRANT ALL ON FUNCTION "public"."vector_l2_squared_distance"("public"."vector", "public"."vector") TO "anon";
GRANT ALL ON FUNCTION "public"."vector_l2_squared_distance"("public"."vector", "public"."vector") TO "authenticated";
GRANT ALL ON FUNCTION "public"."vector_l2_squared_distance"("public"."vector", "public"."vector") TO "service_role";



GRANT ALL ON FUNCTION "public"."vector_le"("public"."vector", "public"."vector") TO "postgres";
GRANT ALL ON FUNCTION "public"."vector_le"("public"."vector", "public"."vector") TO "anon";
GRANT ALL ON FUNCTION "public"."vector_le"("public"."vector", "public"."vector") TO "authenticated";
GRANT ALL ON FUNCTION "public"."vector_le"("public"."vector", "public"."vector") TO "service_role";



GRANT ALL ON FUNCTION "public"."vector_lt"("public"."vector", "public"."vector") TO "postgres";
GRANT ALL ON FUNCTION "public"."vector_lt"("public"."vector", "public"."vector") TO "anon";
GRANT ALL ON FUNCTION "public"."vector_lt"("public"."vector", "public"."vector") TO "authenticated";
GRANT ALL ON FUNCTION "public"."vector_lt"("public"."vector", "public"."vector") TO "service_role";



GRANT ALL ON FUNCTION "public"."vector_mul"("public"."vector", "public"."vector") TO "postgres";
GRANT ALL ON FUNCTION "public"."vector_mul"("public"."vector", "public"."vector") TO "anon";
GRANT ALL ON FUNCTION "public"."vector_mul"("public"."vector", "public"."vector") TO "authenticated";
GRANT ALL ON FUNCTION "public"."vector_mul"("public"."vector", "public"."vector") TO "service_role";



GRANT ALL ON FUNCTION "public"."vector_ne"("public"."vector", "public"."vector") TO "postgres";
GRANT ALL ON FUNCTION "public"."vector_ne"("public"."vector", "public"."vector") TO "anon";
GRANT ALL ON FUNCTION "public"."vector_ne"("public"."vector", "public"."vector") TO "authenticated";
GRANT ALL ON FUNCTION "public"."vector_ne"("public"."vector", "public"."vector") TO "service_role";



GRANT ALL ON FUNCTION "public"."vector_negative_inner_product"("public"."vector", "public"."vector") TO "postgres";
GRANT ALL ON FUNCTION "public"."vector_negative_inner_product"("public"."vector", "public"."vector") TO "anon";
GRANT ALL ON FUNCTION "public"."vector_negative_inner_product"("public"."vector", "public"."vector") TO "authenticated";
GRANT ALL ON FUNCTION "public"."vector_negative_inner_product"("public"."vector", "public"."vector") TO "service_role";



GRANT ALL ON FUNCTION "public"."vector_norm"("public"."vector") TO "postgres";
GRANT ALL ON FUNCTION "public"."vector_norm"("public"."vector") TO "anon";
GRANT ALL ON FUNCTION "public"."vector_norm"("public"."vector") TO "authenticated";
GRANT ALL ON FUNCTION "public"."vector_norm"("public"."vector") TO "service_role";



GRANT ALL ON FUNCTION "public"."vector_spherical_distance"("public"."vector", "public"."vector") TO "postgres";
GRANT ALL ON FUNCTION "public"."vector_spherical_distance"("public"."vector", "public"."vector") TO "anon";
GRANT ALL ON FUNCTION "public"."vector_spherical_distance"("public"."vector", "public"."vector") TO "authenticated";
GRANT ALL ON FUNCTION "public"."vector_spherical_distance"("public"."vector", "public"."vector") TO "service_role";



GRANT ALL ON FUNCTION "public"."vector_sub"("public"."vector", "public"."vector") TO "postgres";
GRANT ALL ON FUNCTION "public"."vector_sub"("public"."vector", "public"."vector") TO "anon";
GRANT ALL ON FUNCTION "public"."vector_sub"("public"."vector", "public"."vector") TO "authenticated";
GRANT ALL ON FUNCTION "public"."vector_sub"("public"."vector", "public"."vector") TO "service_role";



GRANT ALL ON FUNCTION "public"."avg"("public"."halfvec") TO "postgres";
GRANT ALL ON FUNCTION "public"."avg"("public"."halfvec") TO "anon";
GRANT ALL ON FUNCTION "public"."avg"("public"."halfvec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."avg"("public"."halfvec") TO "service_role";



GRANT ALL ON FUNCTION "public"."avg"("public"."vector") TO "postgres";
GRANT ALL ON FUNCTION "public"."avg"("public"."vector") TO "anon";
GRANT ALL ON FUNCTION "public"."avg"("public"."vector") TO "authenticated";
GRANT ALL ON FUNCTION "public"."avg"("public"."vector") TO "service_role";



GRANT ALL ON FUNCTION "public"."sum"("public"."halfvec") TO "postgres";
GRANT ALL ON FUNCTION "public"."sum"("public"."halfvec") TO "anon";
GRANT ALL ON FUNCTION "public"."sum"("public"."halfvec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."sum"("public"."halfvec") TO "service_role";



GRANT ALL ON FUNCTION "public"."sum"("public"."vector") TO "postgres";
GRANT ALL ON FUNCTION "public"."sum"("public"."vector") TO "anon";
GRANT ALL ON FUNCTION "public"."sum"("public"."vector") TO "authenticated";
GRANT ALL ON FUNCTION "public"."sum"("public"."vector") TO "service_role";


















GRANT ALL ON TABLE "public"."agent_functions" TO "anon";
GRANT ALL ON TABLE "public"."agent_functions" TO "authenticated";
GRANT ALL ON TABLE "public"."agent_functions" TO "service_role";



GRANT ALL ON TABLE "public"."ai_agent_workflows" TO "anon";
GRANT ALL ON TABLE "public"."ai_agent_workflows" TO "authenticated";
GRANT ALL ON TABLE "public"."ai_agent_workflows" TO "service_role";



GRANT ALL ON TABLE "public"."ai_agents" TO "anon";
GRANT ALL ON TABLE "public"."ai_agents" TO "authenticated";
GRANT ALL ON TABLE "public"."ai_agents" TO "service_role";



GRANT ALL ON TABLE "public"."ai_functions" TO "anon";
GRANT ALL ON TABLE "public"."ai_functions" TO "authenticated";
GRANT ALL ON TABLE "public"."ai_functions" TO "service_role";



GRANT ALL ON TABLE "public"."configs" TO "anon";
GRANT ALL ON TABLE "public"."configs" TO "authenticated";
GRANT ALL ON TABLE "public"."configs" TO "service_role";



GRANT ALL ON TABLE "public"."connected_services" TO "anon";
GRANT ALL ON TABLE "public"."connected_services" TO "authenticated";
GRANT ALL ON TABLE "public"."connected_services" TO "service_role";



GRANT ALL ON TABLE "public"."conversation_messages" TO "anon";
GRANT ALL ON TABLE "public"."conversation_messages" TO "authenticated";
GRANT ALL ON TABLE "public"."conversation_messages" TO "service_role";



GRANT ALL ON TABLE "public"."messages" TO "anon";
GRANT ALL ON TABLE "public"."messages" TO "authenticated";
GRANT ALL ON TABLE "public"."messages" TO "service_role";



GRANT ALL ON TABLE "public"."profiles" TO "anon";
GRANT ALL ON TABLE "public"."profiles" TO "authenticated";
GRANT ALL ON TABLE "public"."profiles" TO "service_role";



GRANT ALL ON TABLE "public"."conversation_messages_view" TO "anon";
GRANT ALL ON TABLE "public"."conversation_messages_view" TO "authenticated";
GRANT ALL ON TABLE "public"."conversation_messages_view" TO "service_role";



GRANT ALL ON TABLE "public"."conversation_participants" TO "anon";
GRANT ALL ON TABLE "public"."conversation_participants" TO "authenticated";
GRANT ALL ON TABLE "public"."conversation_participants" TO "service_role";



GRANT ALL ON TABLE "public"."conversations" TO "anon";
GRANT ALL ON TABLE "public"."conversations" TO "authenticated";
GRANT ALL ON TABLE "public"."conversations" TO "service_role";



GRANT ALL ON TABLE "public"."credentials" TO "anon";
GRANT ALL ON TABLE "public"."credentials" TO "authenticated";
GRANT ALL ON TABLE "public"."credentials" TO "service_role";



GRANT ALL ON TABLE "public"."custom_migrations" TO "anon";
GRANT ALL ON TABLE "public"."custom_migrations" TO "authenticated";
GRANT ALL ON TABLE "public"."custom_migrations" TO "service_role";



GRANT ALL ON TABLE "public"."custom_roles" TO "anon";
GRANT ALL ON TABLE "public"."custom_roles" TO "authenticated";
GRANT ALL ON TABLE "public"."custom_roles" TO "service_role";



GRANT ALL ON TABLE "public"."custom_table_data" TO "anon";
GRANT ALL ON TABLE "public"."custom_table_data" TO "authenticated";
GRANT ALL ON TABLE "public"."custom_table_data" TO "service_role";



GRANT ALL ON TABLE "public"."custom_table_data_progress" TO "anon";
GRANT ALL ON TABLE "public"."custom_table_data_progress" TO "authenticated";
GRANT ALL ON TABLE "public"."custom_table_data_progress" TO "service_role";



GRANT ALL ON TABLE "public"."custom_table_definitions" TO "anon";
GRANT ALL ON TABLE "public"."custom_table_definitions" TO "authenticated";
GRANT ALL ON TABLE "public"."custom_table_definitions" TO "service_role";



GRANT ALL ON TABLE "public"."custom_table_fields" TO "anon";
GRANT ALL ON TABLE "public"."custom_table_fields" TO "authenticated";
GRANT ALL ON TABLE "public"."custom_table_fields" TO "service_role";



GRANT ALL ON TABLE "public"."custom_table_progress" TO "anon";
GRANT ALL ON TABLE "public"."custom_table_progress" TO "authenticated";
GRANT ALL ON TABLE "public"."custom_table_progress" TO "service_role";



GRANT ALL ON TABLE "public"."custom_table_relationships" TO "anon";
GRANT ALL ON TABLE "public"."custom_table_relationships" TO "authenticated";
GRANT ALL ON TABLE "public"."custom_table_relationships" TO "service_role";



GRANT ALL ON TABLE "public"."customers" TO "anon";
GRANT ALL ON TABLE "public"."customers" TO "authenticated";
GRANT ALL ON TABLE "public"."customers" TO "service_role";



GRANT ALL ON TABLE "public"."documents" TO "anon";
GRANT ALL ON TABLE "public"."documents" TO "authenticated";
GRANT ALL ON TABLE "public"."documents" TO "service_role";



GRANT ALL ON SEQUENCE "public"."documents_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."documents_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."documents_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."encryption_keys" TO "anon";
GRANT ALL ON TABLE "public"."encryption_keys" TO "authenticated";
GRANT ALL ON TABLE "public"."encryption_keys" TO "service_role";



GRANT ALL ON TABLE "public"."function_queue" TO "anon";
GRANT ALL ON TABLE "public"."function_queue" TO "authenticated";
GRANT ALL ON TABLE "public"."function_queue" TO "service_role";



GRANT ALL ON TABLE "public"."memories" TO "anon";
GRANT ALL ON TABLE "public"."memories" TO "authenticated";
GRANT ALL ON TABLE "public"."memories" TO "service_role";



GRANT ALL ON SEQUENCE "public"."memories_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."memories_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."memories_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."oauth_states" TO "anon";
GRANT ALL ON TABLE "public"."oauth_states" TO "authenticated";
GRANT ALL ON TABLE "public"."oauth_states" TO "service_role";



GRANT ALL ON TABLE "public"."onboarding_sessions" TO "anon";
GRANT ALL ON TABLE "public"."onboarding_sessions" TO "authenticated";
GRANT ALL ON TABLE "public"."onboarding_sessions" TO "service_role";



GRANT ALL ON TABLE "public"."price_items" TO "anon";
GRANT ALL ON TABLE "public"."price_items" TO "authenticated";
GRANT ALL ON TABLE "public"."price_items" TO "service_role";



GRANT ALL ON TABLE "public"."tempEmails" TO "anon";
GRANT ALL ON TABLE "public"."tempEmails" TO "authenticated";
GRANT ALL ON TABLE "public"."tempEmails" TO "service_role";



GRANT ALL ON SEQUENCE "public"."tempEmails_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."tempEmails_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."tempEmails_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."tenant_domains" TO "anon";
GRANT ALL ON TABLE "public"."tenant_domains" TO "authenticated";
GRANT ALL ON TABLE "public"."tenant_domains" TO "service_role";



GRANT ALL ON TABLE "public"."tenant_requests" TO "anon";
GRANT ALL ON TABLE "public"."tenant_requests" TO "authenticated";
GRANT ALL ON TABLE "public"."tenant_requests" TO "service_role";



GRANT ALL ON TABLE "public"."tenant_users" TO "anon";
GRANT ALL ON TABLE "public"."tenant_users" TO "authenticated";
GRANT ALL ON TABLE "public"."tenant_users" TO "service_role";



GRANT ALL ON TABLE "public"."tenants" TO "anon";
GRANT ALL ON TABLE "public"."tenants" TO "authenticated";
GRANT ALL ON TABLE "public"."tenants" TO "service_role";



GRANT ALL ON TABLE "public"."user_custom_roles" TO "anon";
GRANT ALL ON TABLE "public"."user_custom_roles" TO "authenticated";
GRANT ALL ON TABLE "public"."user_custom_roles" TO "service_role";



GRANT ALL ON TABLE "public"."user_roles" TO "anon";
GRANT ALL ON TABLE "public"."user_roles" TO "authenticated";
GRANT ALL ON TABLE "public"."user_roles" TO "service_role";



GRANT ALL ON TABLE "public"."webhook_events" TO "anon";
GRANT ALL ON TABLE "public"."webhook_events" TO "authenticated";
GRANT ALL ON TABLE "public"."webhook_events" TO "service_role";



GRANT ALL ON TABLE "public"."workflow_instances" TO "anon";
GRANT ALL ON TABLE "public"."workflow_instances" TO "authenticated";
GRANT ALL ON TABLE "public"."workflow_instances" TO "service_role";



GRANT ALL ON TABLE "public"."workflow_responses" TO "anon";
GRANT ALL ON TABLE "public"."workflow_responses" TO "authenticated";
GRANT ALL ON TABLE "public"."workflow_responses" TO "service_role";



GRANT ALL ON TABLE "public"."workflow_steps" TO "anon";
GRANT ALL ON TABLE "public"."workflow_steps" TO "authenticated";
GRANT ALL ON TABLE "public"."workflow_steps" TO "service_role";



GRANT ALL ON TABLE "public"."workflows" TO "anon";
GRANT ALL ON TABLE "public"."workflows" TO "authenticated";
GRANT ALL ON TABLE "public"."workflows" TO "service_role";



ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "service_role";






























RESET ALL;
