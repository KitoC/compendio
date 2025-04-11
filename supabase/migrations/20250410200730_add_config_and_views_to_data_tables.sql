ALTER TABLE data_tables ADD COLUMN config jsonb DEFAULT '{}';
ALTER TABLE data_tables ADD COLUMN views jsonb DEFAULT '[]';
