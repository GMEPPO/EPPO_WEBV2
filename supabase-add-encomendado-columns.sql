-- Agregar columnas para encomendado en la tabla presupuestos_articulos

-- Columna para indicar si el artículo está encomendado
ALTER TABLE public.presupuestos_articulos
ADD COLUMN IF NOT EXISTS encomendado BOOLEAN DEFAULT FALSE;

-- Columna para la fecha de encomenda
ALTER TABLE public.presupuestos_articulos
ADD COLUMN IF NOT EXISTS fecha_encomenda DATE NULL;

-- Columna para el número de encomenda
ALTER TABLE public.presupuestos_articulos
ADD COLUMN IF NOT EXISTS numero_encomenda TEXT NULL;

-- Comentarios para documentación
COMMENT ON COLUMN public.presupuestos_articulos.encomendado IS 'Indica si el artículo ha sido encomendado';
COMMENT ON COLUMN public.presupuestos_articulos.fecha_encomenda IS 'Fecha en que se realizó la encomenda del artículo';
COMMENT ON COLUMN public.presupuestos_articulos.numero_encomenda IS 'Número de encomenda asignado al artículo';

