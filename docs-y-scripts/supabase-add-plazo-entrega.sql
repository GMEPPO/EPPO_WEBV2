-- Script para agregar el campo plazo_entrega a la tabla presupuestos_articulos
-- Este campo almacena el plazo de entrega de cada producto en la propuesta

-- Agregar la columna si no existe
ALTER TABLE presupuestos_articulos 
ADD COLUMN IF NOT EXISTS plazo_entrega TEXT;

-- Comentario de la columna
COMMENT ON COLUMN presupuestos_articulos.plazo_entrega IS 'Plazo de entrega del producto en la propuesta (ej: "15 días", "3 semanas", etc.)';

