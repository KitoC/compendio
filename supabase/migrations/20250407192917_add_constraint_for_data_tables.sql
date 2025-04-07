-- More scoped, avoids clashes across different sources or bases
ALTER TABLE data_tables ADD CONSTRAINT data_tables_unique_external UNIQUE (external_id, base_id, source);

ALTER TABLE data_fields ADD CONSTRAINT data_fields_unique_external UNIQUE (external_id, base_id, source);

-- Rename base_id → schema_id
ALTER TABLE data_tables RENAME COLUMN base_id TO schema_id;
ALTER TABLE data_fields RENAME COLUMN base_id TO schema_id;

-- Add schema_name column
ALTER TABLE data_tables ADD COLUMN schema_name text;
ALTER TABLE data_fields ADD COLUMN schema_name text;


-- Finally drop last function that was wrong
DROP FUNCTION IF EXISTS delete_custom_table_record(text, uuid, uuid);