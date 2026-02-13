-- ============================================
-- TABLA PARA SUBCATEGORÍAS DE CATEGORÍAS ESPECIALES
-- ============================================

CREATE TABLE IF NOT EXISTS subcategorias (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Relación con categoría padre (home_categories)
    categoria_id UUID NOT NULL REFERENCES home_categories(id) ON DELETE CASCADE,
    
    -- Información básica
    nombre_es TEXT NOT NULL,
    nombre_pt TEXT NOT NULL,
    
    -- Configuración
    orden INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    
    -- Metadatos
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_subcategorias_categoria ON subcategorias(categoria_id);
CREATE INDEX IF NOT EXISTS idx_subcategorias_active ON subcategorias(is_active);
CREATE INDEX IF NOT EXISTS idx_subcategorias_orden ON subcategorias(orden);
CREATE INDEX IF NOT EXISTS idx_subcategorias_categoria_active_orden ON subcategorias(categoria_id, is_active, orden);

-- Comentarios
COMMENT ON TABLE subcategorias IS 'Tabla para almacenar subcategorías de categorías especiales (ej: Personalizados)';
COMMENT ON COLUMN subcategorias.categoria_id IS 'ID de la categoría padre (debe ser una categoría especial como "Personalizados")';
COMMENT ON COLUMN subcategorias.nombre_es IS 'Nombre de la subcategoría en español';
COMMENT ON COLUMN subcategorias.nombre_pt IS 'Nombre de la subcategoría en portugués';
COMMENT ON COLUMN subcategorias.orden IS 'Orden de visualización';
COMMENT ON COLUMN subcategorias.is_active IS 'Indica si la subcategoría está activa';

-- Trigger para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_subcategorias_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_subcategorias_updated_at ON subcategorias;
CREATE TRIGGER trigger_update_subcategorias_updated_at
    BEFORE UPDATE ON subcategorias
    FOR EACH ROW
    EXECUTE FUNCTION update_subcategorias_updated_at();

-- Política RLS (Row Level Security)
ALTER TABLE subcategorias ENABLE ROW LEVEL SECURITY;

-- Eliminar política si existe antes de crearla
DROP POLICY IF EXISTS "Allow all operations on subcategorias" ON subcategorias;

CREATE POLICY "Allow all operations on subcategorias" ON subcategorias
    FOR ALL
    USING (true)
    WITH CHECK (true);

-- ============================================
-- EJEMPLO: Insertar categoría "Personalizados" y subcategoría "Paraguas"
-- ============================================
-- NOTA: Primero debes crear la categoría "Personalizados" en home_categories
-- Luego puedes ejecutar esto para crear la subcategoría "Paraguas"

/*
-- 1. Primero crear la categoría "Personalizados" en home_categories (si no existe)
INSERT INTO home_categories (nombre_es, nombre_pt, foto, orden, is_active)
VALUES ('Personalizados', 'Personalizados', 'personalizados.png', 999, true)
ON CONFLICT DO NOTHING;

-- 2. Obtener el ID de la categoría "Personalizados"
-- SELECT id FROM home_categories WHERE nombre_es = 'Personalizados';

-- 3. Insertar subcategoría "Paraguas" (reemplaza 'CATEGORIA_ID_AQUI' con el ID real)
INSERT INTO subcategorias (categoria_id, nombre_es, nombre_pt, orden, is_active)
VALUES (
    (SELECT id FROM home_categories WHERE nombre_es = 'Personalizados' LIMIT 1),
    'Paraguas',
    'Guardachuvas',
    1,
    true
);
*/

