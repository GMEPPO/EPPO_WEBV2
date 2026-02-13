-- ============================================
-- AGREGAR CAMPO 'orden' A LA TABLA presupuestos_articulos
-- ============================================
-- Este campo permite guardar el orden de los productos en el presupuesto
-- para la funcionalidad de drag and drop

-- Agregar columna 'orden' si no existe
ALTER TABLE presupuestos_articulos 
ADD COLUMN IF NOT EXISTS orden INTEGER DEFAULT 0;

-- Comentario para documentar el campo
COMMENT ON COLUMN presupuestos_articulos.orden IS 'Orden de visualización del artículo en el presupuesto (para drag and drop)';

-- Crear índice para mejorar el rendimiento al ordenar
CREATE INDEX IF NOT EXISTS idx_presupuestos_articulos_orden 
ON presupuestos_articulos(presupuesto_id, orden);

-- Actualizar registros existentes para que tengan un orden basado en created_at
-- Esto asegura que los presupuestos existentes mantengan su orden original
UPDATE presupuestos_articulos
SET orden = subquery.row_number
FROM (
    SELECT 
        id,
        ROW_NUMBER() OVER (PARTITION BY presupuesto_id ORDER BY created_at ASC) - 1 AS row_number
    FROM presupuestos_articulos
) AS subquery
WHERE presupuestos_articulos.id = subquery.id;

