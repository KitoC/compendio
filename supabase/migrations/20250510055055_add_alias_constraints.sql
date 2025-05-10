ALTER TABLE data_views ADD CONSTRAINT data_views_unique_alias UNIQUE (alias, tenant_id);
