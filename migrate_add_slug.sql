-- Migration Script: Add slug column to existing dua_categories table
-- Run this if you already have the dua_categories table without the slug column

-- Add slug column if it doesn't exist
ALTER TABLE dua_categories 
ADD COLUMN IF NOT EXISTS slug TEXT UNIQUE;

-- Create index on slug if it doesn't exist
CREATE INDEX IF NOT EXISTS idx_dua_categories_slug ON dua_categories(slug);

