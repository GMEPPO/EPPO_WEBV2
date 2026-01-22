-- ============================================
-- TABLA PARA CATEGORÍAS DE PRODUCTOS
-- ============================================

CREATE TABLE IF NOT EXISTS product_categories (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    fields JSONB NOT NULL DEFAULT '[]'::jsonb,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_product_categories_active ON product_categories(is_active);
CREATE INDEX IF NOT EXISTS idx_product_categories_sort ON product_categories(sort_order);

-- Comentarios
COMMENT ON TABLE product_categories IS 'Tabla para almacenar categorías de productos personalizadas';
COMMENT ON COLUMN product_categories.id IS 'ID único de la categoría (sin espacios, minúsculas)';
COMMENT ON COLUMN product_categories.name IS 'Nombre de la categoría';
COMMENT ON COLUMN product_categories.fields IS 'Campos personalizados de la categoría en formato JSON';
COMMENT ON COLUMN product_categories.description IS 'Descripción opcional de la categoría';
COMMENT ON COLUMN product_categories.is_active IS 'Indica si la categoría está activa';
COMMENT ON COLUMN product_categories.sort_order IS 'Orden de visualización de la categoría';

-- Trigger para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_product_categories_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_product_categories_updated_at ON product_categories;
CREATE TRIGGER trigger_update_product_categories_updated_at
    BEFORE UPDATE ON product_categories
    FOR EACH ROW
    EXECUTE FUNCTION update_product_categories_updated_at();

-- Política RLS (Row Level Security)
ALTER TABLE product_categories ENABLE ROW LEVEL SECURITY;

-- Eliminar política si existe antes de crearla
DROP POLICY IF EXISTS "Allow all operations on product_categories" ON product_categories;

CREATE POLICY "Allow all operations on product_categories" ON product_categories
    FOR ALL
    USING (true)
    WITH CHECK (true);

-- ============================================
-- VALIDACIÓN: Función para validar estructura de fields
-- ============================================
CREATE OR REPLACE FUNCTION validate_category_fields(fields_json JSONB)
RETURNS BOOLEAN AS $$
BEGIN
    -- Verificar que es un array
    IF jsonb_typeof(fields_json) != 'array' THEN
        RETURN FALSE;
    END IF;
    
    -- Verificar que cada campo tiene id, label y type
    RETURN (
        SELECT bool_and(
            jsonb_typeof(field->'id') = 'string' AND
            jsonb_typeof(field->'label') = 'string' AND
            jsonb_typeof(field->'type') = 'string'
        )
        FROM jsonb_array_elements(fields_json) AS field
    );
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- EJEMPLO: Insertar categorías predefinidas (opcional)
-- ============================================
-- Descomenta si quieres migrar las categorías predefinidas a la base de datos
/*
INSERT INTO product_categories (id, name, fields, is_active, sort_order) VALUES
('secadores', 'Secadores', '[
    {"id": "potencia", "label": "Potencia (W)", "type": "number", "required": true},
    {"id": "color", "label": "Color", "type": "text", "required": true},
    {"id": "garantia", "label": "Garantía (años)", "type": "number", "required": true},
    {"id": "tecnologia_iones", "label": "Tecnología de iones", "type": "select", "required": true, "options": [{"value": "si", "label": "Sí"}, {"value": "no", "label": "No"}]}
]'::jsonb, true, 1),
('planchas', 'Planchas', '[
    {"id": "potencia", "label": "Potencia (W)", "type": "number", "required": true},
    {"id": "color", "label": "Color", "type": "text", "required": true},
    {"id": "garantia", "label": "Garantía (años)", "type": "number", "required": true}
]'::jsonb, true, 2)
ON CONFLICT (id) DO NOTHING;
*/

