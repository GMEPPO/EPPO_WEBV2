-- ============================================
-- TABLA PRINCIPAL: presupuestos
-- ============================================
CREATE TABLE IF NOT EXISTS presupuestos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Datos obligatorios
    nombre_cliente TEXT NOT NULL,
    fecha_propuesta DATE NOT NULL DEFAULT CURRENT_DATE,
    nombre_comercial TEXT NOT NULL,
    estado_propuesta TEXT NOT NULL DEFAULT 'propuesta enviada',
    
    -- Campos para funciones futuras
    factura_proforma TEXT,
    numero_encomienda TEXT,
    numero_cliente TEXT,
    fecha_ultima_actualizacion TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    veces_modificado INTEGER DEFAULT 0,
    
    -- Campos de auditoría
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- TABLA DE ARTÍCULOS: presupuestos_articulos
-- ============================================
CREATE TABLE IF NOT EXISTS presupuestos_articulos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    presupuesto_id UUID NOT NULL REFERENCES presupuestos(id) ON DELETE CASCADE,
    
    -- Datos del artículo
    nombre_articulo TEXT NOT NULL,
    referencia_articulo TEXT,
    cantidad INTEGER NOT NULL DEFAULT 1,
    precio DECIMAL(10, 2) NOT NULL,
    observaciones TEXT,
    precio_personalizado BOOLEAN DEFAULT FALSE,
    
    -- Campo para almacenar el valor seleccionado del dropdown de personalización
    -- Ej: "Sem personalização", "Com logo do hotel", etc.
    tipo_personalizacion TEXT,
    
    -- Campos de auditoría
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- ÍNDICES para mejorar el rendimiento
-- ============================================
CREATE INDEX IF NOT EXISTS idx_presupuestos_fecha_propuesta ON presupuestos(fecha_propuesta);
CREATE INDEX IF NOT EXISTS idx_presupuestos_estado ON presupuestos(estado_propuesta);
CREATE INDEX IF NOT EXISTS idx_presupuestos_cliente ON presupuestos(nombre_cliente);
CREATE INDEX IF NOT EXISTS idx_presupuestos_comercial ON presupuestos(nombre_comercial);
CREATE INDEX IF NOT EXISTS idx_presupuestos_articulos_presupuesto_id ON presupuestos_articulos(presupuesto_id);

-- ============================================
-- TRIGGER: Actualizar fecha_ultima_actualizacion y veces_modificado
-- ============================================
CREATE OR REPLACE FUNCTION update_presupuesto_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    NEW.fecha_ultima_actualizacion = NOW();
    
    -- Incrementar contador de modificaciones solo si es una actualización (no inserción)
    IF TG_OP = 'UPDATE' THEN
        NEW.veces_modificado = COALESCE(OLD.veces_modificado, 0) + 1;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_presupuesto_timestamp
    BEFORE UPDATE ON presupuestos
    FOR EACH ROW
    EXECUTE FUNCTION update_presupuesto_timestamp();

-- ============================================
-- TRIGGER: Actualizar updated_at en presupuestos_articulos
-- ============================================
CREATE OR REPLACE FUNCTION update_presupuesto_articulo_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_presupuesto_articulo_timestamp
    BEFORE UPDATE ON presupuestos_articulos
    FOR EACH ROW
    EXECUTE FUNCTION update_presupuesto_articulo_timestamp();

-- ============================================
-- TRIGGER: Actualizar fecha_ultima_actualizacion del presupuesto cuando se modifiquen artículos
-- ============================================
CREATE OR REPLACE FUNCTION update_presupuesto_on_articulo_change()
RETURNS TRIGGER AS $$
BEGIN
    -- Actualizar la fecha de última actualización del presupuesto padre
    UPDATE presupuestos
    SET fecha_ultima_actualizacion = NOW(),
        veces_modificado = veces_modificado + 1
    WHERE id = COALESCE(NEW.presupuesto_id, OLD.presupuesto_id);
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_presupuesto_on_articulo_insert
    AFTER INSERT ON presupuestos_articulos
    FOR EACH ROW
    EXECUTE FUNCTION update_presupuesto_on_articulo_change();

CREATE TRIGGER trigger_update_presupuesto_on_articulo_update
    AFTER UPDATE ON presupuestos_articulos
    FOR EACH ROW
    EXECUTE FUNCTION update_presupuesto_on_articulo_change();

CREATE TRIGGER trigger_update_presupuesto_on_articulo_delete
    AFTER DELETE ON presupuestos_articulos
    FOR EACH ROW
    EXECUTE FUNCTION update_presupuesto_on_articulo_change();

-- ============================================
-- COMENTARIOS en las tablas y columnas
-- ============================================
COMMENT ON TABLE presupuestos IS 'Tabla principal para almacenar presupuestos/propuestas';
COMMENT ON TABLE presupuestos_articulos IS 'Tabla para almacenar los artículos de cada presupuesto';

COMMENT ON COLUMN presupuestos.nombre_cliente IS 'Nombre del cliente para el presupuesto';
COMMENT ON COLUMN presupuestos.fecha_propuesta IS 'Fecha en que se creó la propuesta';
COMMENT ON COLUMN presupuestos.nombre_comercial IS 'Nombre del comercial que creó el presupuesto';
COMMENT ON COLUMN presupuestos.estado_propuesta IS 'Estado actual de la propuesta (por defecto: "propuesta enviada")';
COMMENT ON COLUMN presupuestos.factura_proforma IS 'Número o referencia de factura proforma';
COMMENT ON COLUMN presupuestos.numero_encomienda IS 'Número de encomienda asociado';
COMMENT ON COLUMN presupuestos.numero_cliente IS 'Número de cliente en el sistema';
COMMENT ON COLUMN presupuestos.fecha_ultima_actualizacion IS 'Fecha y hora de la última modificación';
COMMENT ON COLUMN presupuestos.veces_modificado IS 'Contador de cuántas veces se ha modificado el presupuesto';

COMMENT ON COLUMN presupuestos_articulos.nombre_articulo IS 'Nombre del artículo propuesto';
COMMENT ON COLUMN presupuestos_articulos.referencia_articulo IS 'Referencia o código del artículo';
COMMENT ON COLUMN presupuestos_articulos.cantidad IS 'Cantidad propuesta del artículo';
COMMENT ON COLUMN presupuestos_articulos.precio IS 'Precio unitario del artículo';
COMMENT ON COLUMN presupuestos_articulos.observaciones IS 'Observaciones adicionales sobre el artículo (opcional)';
COMMENT ON COLUMN presupuestos_articulos.precio_personalizado IS 'Indica si se seleccionó un precio personalizado';
COMMENT ON COLUMN presupuestos_articulos.tipo_personalizacion IS 'Tipo de personalización seleccionado (ej: "Sem personalização", "Com logo do hotel")';

-- ============================================
-- POLÍTICAS RLS (Row Level Security)
-- ============================================
-- Habilitar RLS en ambas tablas
ALTER TABLE presupuestos ENABLE ROW LEVEL SECURITY;
ALTER TABLE presupuestos_articulos ENABLE ROW LEVEL SECURITY;

-- Política para permitir todas las operaciones (ajustar según tus necesidades de seguridad)
-- Para desarrollo: permitir todo
CREATE POLICY "Allow all operations on presupuestos" ON presupuestos
    FOR ALL
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Allow all operations on presupuestos_articulos" ON presupuestos_articulos
    FOR ALL
    USING (true)
    WITH CHECK (true);

-- ============================================
-- VISTA ÚTIL: Presupuestos con resumen de artículos
-- ============================================
CREATE OR REPLACE VIEW presupuestos_detalle AS
SELECT 
    p.id,
    p.nombre_cliente,
    p.fecha_propuesta,
    p.nombre_comercial,
    p.estado_propuesta,
    p.factura_proforma,
    p.numero_encomienda,
    p.numero_cliente,
    p.fecha_ultima_actualizacion,
    p.veces_modificado,
    p.created_at,
    p.updated_at,
    COUNT(pa.id) as total_articulos,
    SUM(pa.cantidad * pa.precio) as total_presupuesto
FROM presupuestos p
LEFT JOIN presupuestos_articulos pa ON p.id = pa.presupuesto_id
GROUP BY p.id;

COMMENT ON VIEW presupuestos_detalle IS 'Vista que muestra los presupuestos con resumen de artículos y total';


