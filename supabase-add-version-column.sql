-- Agregar columna 'version' a la tabla presupuestos
-- Esta columna almacena el número de versión de la propuesta
-- Versión inicial: 1, se incrementa cuando el usuario confirma crear una nueva versión

ALTER TABLE presupuestos 
ADD COLUMN IF NOT EXISTS version INTEGER DEFAULT 1;

-- Actualizar todas las propuestas existentes a versión 1 si no tienen versión
UPDATE presupuestos 
SET version = 1 
WHERE version IS NULL;

-- Comentario en la columna
COMMENT ON COLUMN presupuestos.version IS 'Número de versión de la propuesta. Se incrementa cuando se crea una nueva versión del documento.';

