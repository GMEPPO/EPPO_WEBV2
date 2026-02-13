-- Agregar columnas para encomendado en la tabla presupuestos_articulos
-- NOTA: Algunas columnas ya pueden existir según el esquema actual

-- Columna para indicar si el artículo está encomendado (ya existe según el esquema)
ALTER TABLE public.presupuestos_articulos
ADD COLUMN IF NOT EXISTS encomendado BOOLEAN DEFAULT FALSE;

-- Columna para la fecha de encomenda (DATE) - ya existe según el esquema
ALTER TABLE public.presupuestos_articulos
ADD COLUMN IF NOT EXISTS fecha_encomenda DATE NULL;

-- Columna para el número de encomenda - ya existe según el esquema
ALTER TABLE public.presupuestos_articulos
ADD COLUMN IF NOT EXISTS numero_encomenda TEXT NULL;

-- Columna para la cantidad encomendada
ALTER TABLE public.presupuestos_articulos
ADD COLUMN IF NOT EXISTS cantidad_encomendada INTEGER NULL;

-- Columna para la fecha prevista de entrega
ALTER TABLE public.presupuestos_articulos
ADD COLUMN IF NOT EXISTS fecha_prevista_entrega DATE NULL;

-- Comentarios para documentación
COMMENT ON COLUMN public.presupuestos_articulos.encomendado IS 'Indica si el artículo ha sido encomendado';
COMMENT ON COLUMN public.presupuestos_articulos.fecha_encomenda IS 'Fecha en que se realizó la encomenda del artículo (DATE)';
COMMENT ON COLUMN public.presupuestos_articulos.numero_encomenda IS 'Número de encomenda asignado al artículo';
COMMENT ON COLUMN public.presupuestos_articulos.cantidad_encomendada IS 'Cantidad del artículo que fue encomendada';
COMMENT ON COLUMN public.presupuestos_articulos.fecha_prevista_entrega IS 'Fecha prevista de entrega del artículo encomendado';

