-- Migration: Add image_url column to posts table
ALTER TABLE posts ADD COLUMN image_url VARCHAR(255) NULL AFTER content;