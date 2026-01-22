-- Script para agregar el campo visible_en_catalogo a la tabla products
-- Este campo controla si el producto aparece en la página pública de productos

-- Agregar la columna si no existe
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS visible_en_catalogo BOOLEAN DEFAULT true;

-- Actualizar productos existentes para que sean visibles por defecto (compatibilidad)
UPDATE products 
SET visible_en_catalogo = true 
WHERE visible_en_catalogo IS NULL;

-- Comentario de la columna
COMMENT ON COLUMN products.visible_en_catalogo IS 'Controla si el producto aparece en la página pública de productos. Si es false, solo aparecerá en la lista de productos para presupuestos.';


