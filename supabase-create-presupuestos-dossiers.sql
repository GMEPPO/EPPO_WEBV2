-- ============================================
-- TABLA PARA ALMACENAR DOSSIERS DE PROPUESTAS
-- ============================================
CREATE TABLE IF NOT EXISTS presupuestos_dossiers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    presupuesto_id UUID NOT NULL REFERENCES presupuestos(id) ON DELETE CASCADE,
    
    -- Array de URLs de los documentos del dossier (máximo 3)
    documentos_urls TEXT[] DEFAULT '{}',
    
    -- Campos de auditoría
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Asegurar que solo hay un dossier por propuesta
    UNIQUE(presupuesto_id)
);

COMMENT ON TABLE presupuestos_dossiers IS 'Tabla para almacenar los documentos del dossier de cada propuesta';
COMMENT ON COLUMN presupuestos_dossiers.presupuesto_id IS 'ID de la propuesta a la que pertenece el dossier';
COMMENT ON COLUMN presupuestos_dossiers.documentos_urls IS 'Array de URLs de los documentos del dossier (máximo 3 documentos)';

-- Índice para mejorar el rendimiento de las consultas
CREATE INDEX IF NOT EXISTS idx_presupuestos_dossiers_presupuesto_id ON presupuestos_dossiers(presupuesto_id);

-- Trigger para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_presupuestos_dossiers_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_presupuestos_dossiers_updated_at
    BEFORE UPDATE ON presupuestos_dossiers
    FOR EACH ROW
    EXECUTE FUNCTION update_presupuestos_dossiers_updated_at();

