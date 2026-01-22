-- ============================================
-- TABLA PARA CATEGORÍAS DE LA PÁGINA PRINCIPAL (HOME)
-- ============================================

CREATE TABLE IF NOT EXISTS home_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Información básica
    nombre_es TEXT NOT NULL,
    nombre_pt TEXT NOT NULL,
    foto TEXT NOT NULL, -- URL o ruta de la imagen
    
    -- Configuración de visualización
    orden INTEGER DEFAULT 0, -- Orden de aparición en la página principal
    is_active BOOLEAN DEFAULT TRUE, -- Si está activa y se muestra
    
    -- Información adicional (opcional)
    descripcion_es TEXT,
    descripcion_pt TEXT,
    link TEXT, -- URL o ruta a donde redirige al hacer clic (opcional)
    
    -- Metadatos
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_home_categories_active ON home_categories(is_active);
CREATE INDEX IF NOT EXISTS idx_home_categories_orden ON home_categories(orden);
CREATE INDEX IF NOT EXISTS idx_home_categories_active_orden ON home_categories(is_active, orden);

-- Comentarios
COMMENT ON TABLE home_categories IS 'Tabla para almacenar las categorías que se muestran en la página principal (home)';
COMMENT ON COLUMN home_categories.nombre_es IS 'Nombre de la categoría en español';
COMMENT ON COLUMN home_categories.nombre_pt IS 'Nombre de la categoría en portugués';
COMMENT ON COLUMN home_categories.foto IS 'URL o ruta de la imagen/foto de la categoría';
COMMENT ON COLUMN home_categories.orden IS 'Orden de visualización en la página principal (menor número = aparece primero)';
COMMENT ON COLUMN home_categories.is_active IS 'Indica si la categoría está activa y se muestra en el home';
COMMENT ON COLUMN home_categories.descripcion_es IS 'Descripción opcional de la categoría en español';
COMMENT ON COLUMN home_categories.descripcion_pt IS 'Descripción opcional de la categoría en portugués';
COMMENT ON COLUMN home_categories.link IS 'URL o ruta a donde redirige al hacer clic en la categoría (opcional)';

-- Trigger para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_home_categories_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_home_categories_updated_at ON home_categories;
CREATE TRIGGER trigger_update_home_categories_updated_at
    BEFORE UPDATE ON home_categories
    FOR EACH ROW
    EXECUTE FUNCTION update_home_categories_updated_at();

-- Política RLS (Row Level Security)
ALTER TABLE home_categories ENABLE ROW LEVEL SECURITY;

-- Eliminar política si existe antes de crearla
DROP POLICY IF EXISTS "Allow all operations on home_categories" ON home_categories;

CREATE POLICY "Allow all operations on home_categories" ON home_categories
    FOR ALL
    USING (true)
    WITH CHECK (true);

-- ============================================
-- VISTA ÚTIL: Categorías activas ordenadas
-- ============================================
CREATE OR REPLACE VIEW home_categories_active AS
SELECT 
    id,
    nombre_es,
    nombre_pt,
    foto,
    orden,
    descripcion_es,
    descripcion_pt,
    link,
    created_at,
    updated_at
FROM home_categories
WHERE is_active = TRUE
ORDER BY orden ASC, created_at ASC;

COMMENT ON VIEW home_categories_active IS 'Vista que muestra solo las categorías activas ordenadas por orden y fecha de creación';

-- ============================================
-- EJEMPLO: Insertar algunas categorías de ejemplo (opcional)
-- ============================================
-- Descomenta y ajusta según tus necesidades
/*
INSERT INTO home_categories (nombre_es, nombre_pt, foto, orden, is_active, descripcion_es, descripcion_pt) VALUES
('Secadores', 'Secadores', 'secadores.jpg', 1, true, 'Secadores profesionales', 'Secadores profissionais'),
('Planchas', 'Ferros', 'planchas.jpg', 2, true, 'Planchas de vapor', 'Ferros a vapor'),
('Tablas de Planchar', 'Tábuas de Passar', 'tablas-planchar.jpg', 3, true, 'Tablas profesionales', 'Tábuas profissionais'),
('Porta-malas', 'Porta-malas', 'porta-malas.jpg', 4, true, 'Porta-malas para hoteles', 'Porta-malas para hotéis')
ON CONFLICT DO NOTHING;
*/

