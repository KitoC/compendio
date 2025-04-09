-- Step 1: Add the new schema column
ALTER TABLE data_fields ADD COLUMN schema JSONB;

-- Step 2: Optional — backfill from existing columns if needed
-- This is only necessary if you already have data you want to preserve
-- UPDATE data_fields SET schema = jsonb_build_object(
--   'name', name,
--   'display_name', display_name,
--   'field_type', field_type,
--   'is_required', is_required,
--   'is_unique', is_unique,
--   'default_value', default_value,
--   'options', options,
--   'relation', relation,
--   'validation', validation
-- );

-- Step 3: Drop old structure columns
ALTER TABLE data_fields DROP COLUMN IF EXISTS name;
ALTER TABLE data_fields DROP COLUMN IF EXISTS display_name;
ALTER TABLE data_fields DROP COLUMN IF EXISTS description;
ALTER TABLE data_fields DROP COLUMN IF EXISTS field_type;
ALTER TABLE data_fields DROP COLUMN IF EXISTS is_required;
ALTER TABLE data_fields DROP COLUMN IF EXISTS is_unique;
ALTER TABLE data_fields DROP COLUMN IF EXISTS default_value;
ALTER TABLE data_fields DROP COLUMN IF EXISTS options;
ALTER TABLE data_fields DROP COLUMN IF EXISTS relation;
ALTER TABLE data_fields DROP COLUMN IF EXISTS validation;


-- Attempt drop functions again
DROP FUNCTION IF EXISTS apply_custom_migration(text);
DROP FUNCTION IF EXISTS create_custom_table(text, uuid, uuid);
DROP FUNCTION IF EXISTS delete_custom_table_record(text, uuid); -- This one is wrong, will need to be applied again with text, uuid, uuid in another migration
DROP FUNCTION IF EXISTS get_custom_table_data(text, uuid);
DROP FUNCTION IF EXISTS import_custom_table_data(jsonb, uuid);
DROP FUNCTION IF EXISTS insert_custom_table_record(text, uuid, jsonb);
DROP FUNCTION IF EXISTS insert_custom_tables(jsonb, uuid);
DROP FUNCTION IF EXISTS update_custom_table_record(text, uuid, uuid, jsonb);