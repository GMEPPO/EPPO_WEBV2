-- ============================================
-- TABLA: presupuestos_follow_ups
-- Almacena follow-ups por propuesta: fecha, observaciones y fecha follow up futuro
-- ============================================

CREATE TABLE IF NOT EXISTS presupuestos_follow_ups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    presupuesto_id UUID NOT NULL REFERENCES presupuestos(id) ON DELETE CASCADE,
    fecha_follow_up DATE NOT NULL DEFAULT CURRENT_DATE,
    observaciones TEXT,
    fecha_follow_up_futuro DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

COMMENT ON TABLE presupuestos_follow_ups IS 'Follow-ups de cada propuesta: fecha del follow-up, observaciones y próxima fecha';
COMMENT ON COLUMN presupuestos_follow_ups.fecha_follow_up IS 'Fecha en que se realizó el follow-up';
COMMENT ON COLUMN presupuestos_follow_ups.observaciones IS 'Observaciones del follow-up (editable)';
COMMENT ON COLUMN presupuestos_follow_ups.fecha_follow_up_futuro IS 'Fecha prevista para el próximo follow-up (editable)';

CREATE INDEX IF NOT EXISTS idx_presupuestos_follow_ups_presupuesto ON presupuestos_follow_ups(presupuesto_id);
CREATE INDEX IF NOT EXISTS idx_presupuestos_follow_ups_fecha ON presupuestos_follow_ups(fecha_follow_up);

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION update_presupuestos_follow_ups_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_presupuestos_follow_ups_timestamp ON presupuestos_follow_ups;
CREATE TRIGGER trigger_update_presupuestos_follow_ups_timestamp
    BEFORE UPDATE ON presupuestos_follow_ups
    FOR EACH ROW
    EXECUTE FUNCTION update_presupuestos_follow_ups_timestamp();

-- RLS
ALTER TABLE presupuestos_follow_ups ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all operations on presupuestos_follow_ups" ON presupuestos_follow_ups;
CREATE POLICY "Allow all operations on presupuestos_follow_ups" ON presupuestos_follow_ups
    FOR ALL
    USING (true)
    WITH CHECK (true);
