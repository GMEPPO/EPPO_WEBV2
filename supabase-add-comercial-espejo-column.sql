-- Agregar columna 'comercial_espejo' a la tabla user_roles
-- Esta columna almacena el nombre del comercial espejo para cada comercial
-- El comercial espejo es otro comercial que puede ver las propuestas del comercial principal

ALTER TABLE public.user_roles 
ADD COLUMN IF NOT EXISTS comercial_espejo text NULL;

-- Comentario en la columna
COMMENT ON COLUMN public.user_roles.comercial_espejo IS 'Nombre del comercial espejo. Solo los comerciales con rol "comercial" pueden tener un espejo asignado.';

-- Ejemplo de cómo asignar un comercial espejo:
-- UPDATE public.user_roles 
-- SET comercial_espejo = 'Nombre del Comercial Espejo'
-- WHERE "Name" = 'Nombre del Comercial Principal' AND role = 'comercial';

