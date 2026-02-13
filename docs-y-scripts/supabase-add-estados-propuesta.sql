-- ============================================
-- AGREGAR CAMPOS PARA NUEVOS ESTADOS DE PROPUESTA
-- ============================================

-- Campo para almacenar el motivo de rechazo
ALTER TABLE presupuestos
ADD COLUMN IF NOT EXISTS motivo_rechazo TEXT;

COMMENT ON COLUMN presupuestos.motivo_rechazo IS 'Motivo del rechazo de la propuesta (Preços, Prazo de entrega, Outro)';

-- Campo para almacenar el motivo de rechazo personalizado (cuando se selecciona "Outro")
ALTER TABLE presupuestos
ADD COLUMN IF NOT EXISTS motivo_rechazo_otro TEXT;

COMMENT ON COLUMN presupuestos.motivo_rechazo_otro IS 'Motivo personalizado de rechazo cuando se selecciona "Outro"';

-- Campo para almacenar los números de encomenda (puede haber múltiples, separados por comas)
ALTER TABLE presupuestos
ADD COLUMN IF NOT EXISTS numeros_encomenda TEXT;

COMMENT ON COLUMN presupuestos.numeros_encomenda IS 'Números de encomenda asociados a la propuesta (puede haber múltiples, separados por comas)';

-- Campo para almacenar la fecha de encomenda
ALTER TABLE presupuestos
ADD COLUMN IF NOT EXISTS data_encomenda DATE;

COMMENT ON COLUMN presupuestos.data_encomenda IS 'Fecha en que se realizó la encomenda';

-- ============================================
-- TABLA PARA ALMACENAR ARTÍCULOS ENCOMENDADOS
-- ============================================
CREATE TABLE IF NOT EXISTS presupuestos_articulos_encomendados (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    presupuesto_id UUID NOT NULL REFERENCES presupuestos(id) ON DELETE CASCADE,
    articulo_id UUID NOT NULL REFERENCES presupuestos_articulos(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

COMMENT ON TABLE presupuestos_articulos_encomendados IS 'Tabla para almacenar qué artículos de una propuesta fueron encomendados';

CREATE INDEX IF NOT EXISTS idx_presupuestos_articulos_encomendados_presupuesto ON presupuestos_articulos_encomendados(presupuesto_id);
CREATE INDEX IF NOT EXISTS idx_presupuestos_articulos_encomendados_articulo ON presupuestos_articulos_encomendados(articulo_id);

-- Política RLS
ALTER TABLE presupuestos_articulos_encomendados ENABLE ROW LEVEL SECURITY;

-- Eliminar política si existe antes de crearla
DROP POLICY IF EXISTS "Allow all operations on presupuestos_articulos_encomendados" ON presupuestos_articulos_encomendados;

CREATE POLICY "Allow all operations on presupuestos_articulos_encomendados" ON presupuestos_articulos_encomendados
    FOR ALL
    USING (true)
    WITH CHECK (true);

-- ============================================
-- TABLA PARA ALMACENAR ARTÍCULOS CONCLUÍDOS
-- (Productos con los que el cliente realmente avanzó/compró)
-- ============================================
CREATE TABLE IF NOT EXISTS presupuestos_articulos_concluidos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    presupuesto_id UUID NOT NULL REFERENCES presupuestos(id) ON DELETE CASCADE,
    articulo_id UUID NOT NULL REFERENCES presupuestos_articulos(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

COMMENT ON TABLE presupuestos_articulos_concluidos IS 'Tabla para almacenar qué artículos de una propuesta fueron realmente comprados/concluidos por el cliente. Permite comparar productos propuestos vs productos comprados.';

CREATE INDEX IF NOT EXISTS idx_presupuestos_articulos_concluidos_presupuesto ON presupuestos_articulos_concluidos(presupuesto_id);
CREATE INDEX IF NOT EXISTS idx_presupuestos_articulos_concluidos_articulo ON presupuestos_articulos_concluidos(articulo_id);

-- Política RLS
ALTER TABLE presupuestos_articulos_concluidos ENABLE ROW LEVEL SECURITY;

-- Eliminar política si existe antes de crearla
DROP POLICY IF EXISTS "Allow all operations on presupuestos_articulos_concluidos" ON presupuestos_articulos_concluidos;

CREATE POLICY "Allow all operations on presupuestos_articulos_concluidos" ON presupuestos_articulos_concluidos
    FOR ALL
    USING (true)
    WITH CHECK (true);

