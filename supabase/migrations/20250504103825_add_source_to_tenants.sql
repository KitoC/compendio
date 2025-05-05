ALTER TABLE tenants ADD COLUMN source TEXT;

UPDATE tenants SET source = 'airtable';

ALTER TABLE tenants ALTER COLUMN source SET NOT NULL;

