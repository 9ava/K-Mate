-- Add has_multilingual_menu column to places table (safe migration)

-- Check if column exists and add only if it doesn't
SET @col_exists = (
    SELECT COUNT(*)
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'places'
    AND COLUMN_NAME = 'has_multilingual_menu'
);

-- Only add column if it doesn't exist
SET @sql = IF(
    @col_exists = 0,
    'ALTER TABLE places ADD COLUMN has_multilingual_menu BOOLEAN DEFAULT FALSE COMMENT "다국어 메뉴판 지원 여부"',
    'SELECT "Column has_multilingual_menu already exists" as message'
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Update existing places to have multilingual menu support disabled by default (only if column exists)
UPDATE places SET has_multilingual_menu = FALSE WHERE has_multilingual_menu IS NULL;