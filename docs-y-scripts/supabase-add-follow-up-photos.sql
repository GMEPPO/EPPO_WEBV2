-- ============================================
-- AÑADIR COLUMNAS DE FOTOS A presupuestos_follow_ups
-- Permite 1 o 2 imágenes por follow-up (URLs en bucket follow-up-photos)
-- ============================================

ALTER TABLE presupuestos_follow_ups
ADD COLUMN IF NOT EXISTS foto_url_1 TEXT,
ADD COLUMN IF NOT EXISTS foto_url_2 TEXT;

COMMENT ON COLUMN presupuestos_follow_ups.foto_url_1 IS 'URL pública de la primera foto del follow-up (bucket follow-up-photos)';
COMMENT ON COLUMN presupuestos_follow_ups.foto_url_2 IS 'URL pública de la segunda foto del follow-up (bucket follow-up-photos)';
