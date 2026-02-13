-- ============================================
-- TABLA PARA CAMPOS/FILTROS DE CATEGORÍAS
-- ============================================

CREATE TABLE IF NOT EXISTS category_fields (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Relación con la categoría del home
    categoria_id UUID NOT NULL REFERENCES home_categories(id) ON DELETE CASCADE,
    
    -- Información del campo
    field_id TEXT NOT NULL, -- ID único del campo (ej: 'potencia', 'color')
    label_es TEXT NOT NULL, -- Etiqueta en español
    label_pt TEXT NOT NULL, -- Etiqueta en portugués
    
    -- Tipo de campo: 'text', 'number', 'select', 'textarea'
    field_type TEXT NOT NULL DEFAULT 'text',
    
    -- Placeholder (opcional)
    placeholder_es TEXT,
    placeholder_pt TEXT,
    
    -- Si es campo select, opciones en JSON
    options JSONB DEFAULT '[]'::jsonb, -- [{value: '', label_es: '', label_pt: ''}, ...]
    
    -- Configuración
    is_required BOOLEAN DEFAULT FALSE,
    orden INTEGER DEFAULT 0, -- Orden de aparición
    
    -- Metadatos
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraint: no puede haber dos campos con el mismo field_id en la misma categoría
    UNIQUE(categoria_id, field_id)
);

-- Índices para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_category_fields_categoria ON category_fields(categoria_id);
CREATE INDEX IF NOT EXISTS idx_category_fields_orden ON category_fields(categoria_id, orden);

-- Comentarios
COMMENT ON TABLE category_fields IS 'Tabla para almacenar los campos/filtros personalizados de cada categoría del home';
COMMENT ON COLUMN category_fields.categoria_id IS 'ID de la categoría padre en home_categories';
COMMENT ON COLUMN category_fields.field_id IS 'ID único del campo (sin espacios, minúsculas, ej: potencia, color)';
COMMENT ON COLUMN category_fields.label_es IS 'Etiqueta del campo en español';
COMMENT ON COLUMN category_fields.label_pt IS 'Etiqueta del campo en portugués';
COMMENT ON COLUMN category_fields.field_type IS 'Tipo de campo: text, number, select, textarea';
COMMENT ON COLUMN category_fields.options IS 'Opciones para campos tipo select en formato JSON';
COMMENT ON COLUMN category_fields.is_required IS 'Indica si el campo es obligatorio';
COMMENT ON COLUMN category_fields.orden IS 'Orden de visualización del campo';

-- Trigger para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_category_fields_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_category_fields_updated_at ON category_fields;
CREATE TRIGGER trigger_update_category_fields_updated_at
    BEFORE UPDATE ON category_fields
    FOR EACH ROW
    EXECUTE FUNCTION update_category_fields_updated_at();

-- Política RLS (Row Level Security)
ALTER TABLE category_fields ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all operations on category_fields" ON category_fields;
CREATE POLICY "Allow all operations on category_fields" ON category_fields
    FOR ALL
    USING (true)
    WITH CHECK (true);

