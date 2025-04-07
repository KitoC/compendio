
ALTER TABLE data_tables DROP CONSTRAINT IF EXISTS data_tables_unique_external;
ALTER TABLE data_fields DROP CONSTRAINT IF EXISTS data_fields_unique_external;

-- More scoped, avoids clashes across different sources or bases
ALTER TABLE data_tables ADD CONSTRAINT data_tables_unique_external UNIQUE (external_id, schema_id, source);
ALTER TABLE data_fields ADD CONSTRAINT data_fields_unique_external UNIQUE (external_id, schema_id, source);