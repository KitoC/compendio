-- Rename tables
ALTER TABLE custom_table_definitions RENAME TO data_tables;
ALTER TABLE custom_table_fields RENAME TO data_fields;

-- Drop relationships table if no longer needed
DROP TABLE IF EXISTS custom_migrations;
DROP TABLE IF EXISTS custom_table_data;
DROP TABLE IF EXISTS custom_table_data_progress;
DROP TABLE IF EXISTS custom_table_progress;
DROP TABLE IF EXISTS custom_table_relationships;

-- Drop functions
DROP FUNCTION IF EXISTS add_custom_table_field();
DROP FUNCTION IF EXISTS apply_custom_migration();
DROP FUNCTION IF EXISTS create_custom_table();
DROP FUNCTION IF EXISTS delete_custom_table_record();
DROP FUNCTION IF EXISTS get_custom_table_data();
DROP FUNCTION IF EXISTS import_custom_table_data();
DROP FUNCTION IF EXISTS insert_custom_table_record();
DROP FUNCTION IF EXISTS insert_custom_tables();
DROP FUNCTION IF EXISTS update_custom_table_record();




-- Add generic external mapping columns to data_tables
ALTER TABLE data_tables
ADD COLUMN external_id text,
ADD COLUMN source text DEFAULT 'airtable',
ADD COLUMN base_id text;

-- Add generic external mapping columns to data_fields
ALTER TABLE data_fields
ADD COLUMN external_id text,
ADD COLUMN source text DEFAULT 'airtable',
ADD COLUMN base_id text;

-- Add indexes for external_id
CREATE INDEX IF NOT EXISTS idx_data_tables_external_id ON data_tables (external_id);
CREATE INDEX IF NOT EXISTS idx_data_fields_external_id ON data_fields (external_id);



