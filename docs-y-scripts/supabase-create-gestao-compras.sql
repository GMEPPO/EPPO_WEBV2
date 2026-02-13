-- ============================================
-- TABLA: gestao_compras (Gestão Compras)
-- Almacena los productos a encomendar cuando el estado de la propuesta es "Pedido de encomenda".
-- Para productos con código PHC: solo cantidad a encomendar.
-- Para productos sin PHC: referencia, designación, peso, quantidade por caixa, personalizado y observaciones.
-- ============================================

CREATE TABLE IF NOT EXISTS public.gestao_compras (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    presupuesto_id UUID NOT NULL REFERENCES public.presupuestos(id) ON DELETE CASCADE,
    presupuesto_articulo_id UUID REFERENCES public.presupuestos_articulos(id) ON DELETE SET NULL,

    -- Datos comunes (todos los productos)
    phc_ref TEXT,
    nome_fornecedor TEXT,
    foto_url TEXT,
    quantidade_encomendar INTEGER NOT NULL DEFAULT 1,
    nome_articulo TEXT,

    -- Solo para productos SIN número PHC creado
    referencia TEXT,
    designacao TEXT,
    peso TEXT,
    quantidade_por_caixa INTEGER,
    personalizado BOOLEAN DEFAULT FALSE,
    personalizado_observacoes TEXT,

    -- Dossier gráfico y logotipo: ligación con el dossier de la propuesta y logo del artículo
    presupuesto_dossier_id UUID REFERENCES public.presupuestos_dossiers(id) ON DELETE SET NULL,
    logo_url TEXT,

    -- Auditoría
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_gestao_compras_presupuesto_id ON public.gestao_compras(presupuesto_id);
CREATE INDEX IF NOT EXISTS idx_gestao_compras_presupuesto_articulo_id ON public.gestao_compras(presupuesto_articulo_id);

-- Comentarios
COMMENT ON TABLE public.gestao_compras IS 'Productos a encomendar por propuesta (estado Pedido de encomenda). Con PHC: cantidad; sin PHC: referencia, designação, peso, etc.';
COMMENT ON COLUMN public.gestao_compras.presupuesto_id IS 'Propuesta asociada';
COMMENT ON COLUMN public.gestao_compras.presupuesto_articulo_id IS 'Línea del presupuesto (artículo)';
COMMENT ON COLUMN public.gestao_compras.phc_ref IS 'Código PHC del producto (null si no tiene)';
COMMENT ON COLUMN public.gestao_compras.nome_fornecedor IS 'Nombre del fornecedor';
COMMENT ON COLUMN public.gestao_compras.quantidade_encomendar IS 'Cantidad a encomendar';
COMMENT ON COLUMN public.gestao_compras.referencia IS 'Referencia (solo productos sin PHC)';
COMMENT ON COLUMN public.gestao_compras.designacao IS 'Designação (solo productos sin PHC)';
COMMENT ON COLUMN public.gestao_compras.personalizado IS 'Personalizado sim/não (solo productos sin PHC)';
COMMENT ON COLUMN public.gestao_compras.personalizado_observacoes IS 'Observaciones del campo personalizado (solo productos sin PHC)';
COMMENT ON COLUMN public.gestao_compras.presupuesto_dossier_id IS 'Dossier gráfico de la propuesta asociado a esta línea de encomenda';
COMMENT ON COLUMN public.gestao_compras.logo_url IS 'URL del logotipo del artículo (productos personalizados con logo)';

-- Trigger updated_at
CREATE OR REPLACE FUNCTION update_gestao_compras_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_gestao_compras_updated_at ON public.gestao_compras;
CREATE TRIGGER trigger_gestao_compras_updated_at
    BEFORE UPDATE ON public.gestao_compras
    FOR EACH ROW
    EXECUTE FUNCTION update_gestao_compras_updated_at();

-- RLS (opcional: habilitar y definir políticas según seguridad)
-- ALTER TABLE public.gestao_compras ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY "Allow all on gestao_compras" ON public.gestao_compras FOR ALL USING (true) WITH CHECK (true);

-- ============================================
-- MIGRACIÓN: si la tabla gestao_compras ya existía sin dossier/logo, ejecutar:
-- ============================================
-- ALTER TABLE public.gestao_compras ADD COLUMN IF NOT EXISTS presupuesto_dossier_id UUID REFERENCES public.presupuestos_dossiers(id) ON DELETE SET NULL;
-- ALTER TABLE public.gestao_compras ADD COLUMN IF NOT EXISTS logo_url TEXT;
-- COMMENT ON COLUMN public.gestao_compras.presupuesto_dossier_id IS 'Dossier gráfico de la propuesta asociado a esta línea de encomenda';
-- COMMENT ON COLUMN public.gestao_compras.logo_url IS 'URL del logotipo del artículo (productos personalizados con logo)';
