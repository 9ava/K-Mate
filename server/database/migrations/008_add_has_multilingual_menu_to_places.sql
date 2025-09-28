-- Add has_multilingual_menu column to places table

ALTER TABLE places
ADD COLUMN has_multilingual_menu BOOLEAN DEFAULT FALSE COMMENT '다국어 메뉴판 지원 여부';

-- Update existing places to have multilingual menu support disabled by default
UPDATE places SET has_multilingual_menu = FALSE WHERE has_multilingual_menu IS NULL;