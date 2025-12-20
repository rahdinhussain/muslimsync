-- SQL Schema for Duas Feature
-- Run this in your Supabase SQL Editor

-- Create dua_categories table
CREATE TABLE IF NOT EXISTS dua_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    icon TEXT, -- Icon name for Ionicons (e.g., 'sunny', 'moon', 'restaurant')
    slug TEXT UNIQUE, -- Slug to match hardcoded category IDs (e.g., 'morning', 'evening')
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create duas table
CREATE TABLE IF NOT EXISTS duas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category_id UUID NOT NULL REFERENCES dua_categories(id) ON DELETE CASCADE,
    name TEXT NOT NULL, -- Dua title
    arabic_text TEXT NOT NULL,
    transliteration TEXT,
    translation TEXT,
    reference TEXT, -- Reference citation (e.g., 'Sahih Muslim 2723')
    audio_url TEXT, -- Primary R2 URL (e.g., 'https://cdn.muslimsync.com/duas/{category_id}/{dua_id}.mp3')
    audio_url_fallback TEXT, -- Fallback R2 URL (e.g., 'https://pub-2c4edd4aaabe4396b691206a23c98516.r2.dev/duas/{category_id}/{dua_id}.mp3')
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_duas_category_id ON duas(category_id);
CREATE INDEX IF NOT EXISTS idx_dua_categories_name ON dua_categories(name);
CREATE INDEX IF NOT EXISTS idx_dua_categories_slug ON dua_categories(slug);

-- Enable Row Level Security (RLS) - adjust policies as needed
ALTER TABLE dua_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE duas ENABLE ROW LEVEL SECURITY;

-- Create policy to allow public read access (adjust based on your security needs)
CREATE POLICY "Allow public read access on dua_categories" 
    ON dua_categories FOR SELECT 
    USING (true);

CREATE POLICY "Allow public read access on duas" 
    ON duas FOR SELECT 
    USING (true);

-- Create updated_at trigger function (if not exists)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers to update updated_at automatically
CREATE TRIGGER update_dua_categories_updated_at
    BEFORE UPDATE ON dua_categories
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_duas_updated_at
    BEFORE UPDATE ON duas
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

