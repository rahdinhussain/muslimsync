-- Optional additive content-localization migration for Muslim Sync / Supabase.
-- Apply after database_schema_duas.sql. Safe to rerun; no existing content or
-- policies are changed. Interface localization does not depend on this migration.
-- Populate translations from reviewed, attributed sources before publishing them.
BEGIN;

CREATE TABLE IF NOT EXISTS public.dua_translations (
    dua_id UUID NOT NULL REFERENCES public.duas(id) ON DELETE CASCADE,
    locale TEXT NOT NULL CHECK (locale ~ '^[a-z]{2,3}(-[A-Za-z0-9]{2,8})*$'),
    title TEXT NOT NULL CHECK (btrim(title) <> ''),
    translation TEXT NOT NULL CHECK (btrim(translation) <> ''),
    transliteration TEXT,
    source TEXT NOT NULL CHECK (btrim(source) <> ''),
    reviewed BOOLEAN NOT NULL DEFAULT false,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (dua_id, locale)
);

CREATE TABLE IF NOT EXISTS public.dua_category_translations (
    category_id UUID NOT NULL REFERENCES public.dua_categories(id) ON DELETE CASCADE,
    locale TEXT NOT NULL CHECK (locale ~ '^[a-z]{2,3}(-[A-Za-z0-9]{2,8})*$'),
    name TEXT NOT NULL CHECK (btrim(name) <> ''),
    reviewed BOOLEAN NOT NULL DEFAULT false,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (category_id, locale)
);

CREATE INDEX IF NOT EXISTS dua_translations_published_locale
    ON public.dua_translations (locale, dua_id) WHERE reviewed;
CREATE INDEX IF NOT EXISTS dua_category_translations_published_locale
    ON public.dua_category_translations (locale, category_id) WHERE reviewed;

ALTER TABLE public.dua_translations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dua_category_translations ENABLE ROW LEVEL SECURITY;

-- A signed-in account alone does not confer publishing privileges. Content is
-- maintained through the existing trusted database administration workflow.
REVOKE ALL ON public.dua_translations FROM anon, authenticated;
REVOKE ALL ON public.dua_category_translations FROM anon, authenticated;
GRANT SELECT ON public.dua_translations TO anon, authenticated;
GRANT SELECT ON public.dua_category_translations TO anon, authenticated;
GRANT ALL ON public.dua_translations TO service_role;
GRANT ALL ON public.dua_category_translations TO service_role;

DROP POLICY IF EXISTS "Read reviewed dua translations" ON public.dua_translations;
CREATE POLICY "Read reviewed dua translations"
    ON public.dua_translations FOR SELECT TO anon, authenticated
    USING (reviewed = true);

DROP POLICY IF EXISTS "Read reviewed dua category translations" ON public.dua_category_translations;
CREATE POLICY "Read reviewed dua category translations"
    ON public.dua_category_translations FOR SELECT TO anon, authenticated
    USING (reviewed = true);

CREATE OR REPLACE FUNCTION public.touch_dua_translation_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS touch_dua_translation_updated_at ON public.dua_translations;
CREATE TRIGGER touch_dua_translation_updated_at
    BEFORE UPDATE ON public.dua_translations
    FOR EACH ROW EXECUTE FUNCTION public.touch_dua_translation_updated_at();

DROP TRIGGER IF EXISTS touch_dua_category_translation_updated_at ON public.dua_category_translations;
CREATE TRIGGER touch_dua_category_translation_updated_at
    BEFORE UPDATE ON public.dua_category_translations
    FOR EACH ROW EXECUTE FUNCTION public.touch_dua_translation_updated_at();

COMMENT ON TABLE public.dua_translations IS
    'Attributed translations of existing duas; only reviewed rows are publicly readable. Original Arabic and references stay in public.duas.';
COMMENT ON COLUMN public.dua_translations.source IS
    'Translator, edition, and/or source reference. Do not publish an unattributed generated religious translation.';

NOTIFY pgrst, 'reload schema';
COMMIT;
