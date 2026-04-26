SET @storage_provider_column_exists = (
  SELECT COUNT(*)
  FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'contents'
    AND COLUMN_NAME = 'storage_provider'
);

SET @storage_provider_column_sql = IF(
  @storage_provider_column_exists = 0,
  'ALTER TABLE contents ADD COLUMN storage_provider VARCHAR(20) NOT NULL DEFAULT ''local''',
  'SELECT 1'
);

PREPARE storage_provider_column_stmt FROM @storage_provider_column_sql;
EXECUTE storage_provider_column_stmt;
DEALLOCATE PREPARE storage_provider_column_stmt;

SET @storage_provider_check_exists = (
  SELECT COUNT(*)
  FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS
  WHERE CONSTRAINT_SCHEMA = DATABASE()
    AND TABLE_NAME = 'contents'
    AND CONSTRAINT_NAME = 'contents_storage_provider_check'
);

SET @storage_provider_check_sql = IF(
  @storage_provider_check_exists = 0,
  'ALTER TABLE contents ADD CONSTRAINT contents_storage_provider_check CHECK (storage_provider IN (''local'', ''s3''))',
  'SELECT 1'
);

PREPARE storage_provider_check_stmt FROM @storage_provider_check_sql;
EXECUTE storage_provider_check_stmt;
DEALLOCATE PREPARE storage_provider_check_stmt;
