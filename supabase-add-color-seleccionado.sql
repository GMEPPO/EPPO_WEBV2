-- ============================================
-- AGREGAR COLUMNA PARA GUARDAR COLOR SELECCIONADO
-- ============================================
-- Esta columna guarda el nombre del color seleccionado para productos VACAVALIENTE
-- Esto permite que el color se mantenga incluso si se elimina de las variantes del producto

-- Agregar la columna si no existe
ALTER TABLE presupuestos_articulos 
ADD COLUMN IF NOT EXISTS color_seleccionado TEXT;

-- Comentario de la columna
COMMENT ON COLUMN presupuestos_articulos.color_seleccionado IS 'Nombre del color seleccionado para productos VACAVALIENTE. Se guarda para mantener el color incluso si se elimina de las variantes del producto.';

-- Crear índice para búsquedas rápidas
CREATE INDEX IF NOT EXISTS idx_presupuestos_articulos_color_seleccionado 
ON presupuestos_articulos(color_seleccionado);


