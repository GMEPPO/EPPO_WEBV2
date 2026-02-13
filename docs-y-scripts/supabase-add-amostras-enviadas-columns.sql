-- ============================================
-- AGREGAR COLUMNAS PARA MUESTRAS ENVIADAS EN LA TABLA presupuestos
-- ============================================

-- Columna para almacenar las URLs de las fotos de las muestras enviadas (array de strings)
ALTER TABLE presupuestos
ADD COLUMN IF NOT EXISTS amostras_enviadas_fotos_urls TEXT[] DEFAULT '{}';

COMMENT ON COLUMN presupuestos.amostras_enviadas_fotos_urls IS 'Array de URLs de las fotos de las muestras enviadas';

-- Columna para almacenar los IDs de los artículos que se enviaron como muestras (array de strings)
ALTER TABLE presupuestos
ADD COLUMN IF NOT EXISTS amostras_enviadas_articulos_ids TEXT[] DEFAULT '{}';

COMMENT ON COLUMN presupuestos.amostras_enviadas_articulos_ids IS 'Array de IDs de los artículos que se enviaron como muestras';





