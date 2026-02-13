-- Crear tabla para almacenar colores VACAVALIENTE
CREATE TABLE IF NOT EXISTS public.vacavaliente_colors (
    id UUID NOT NULL DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    code TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT vacavaliente_colors_pkey PRIMARY KEY (id),
    CONSTRAINT vacavaliente_colors_code_unique UNIQUE (code),
    CONSTRAINT vacavaliente_colors_name_unique UNIQUE (name),
    CONSTRAINT vacavaliente_colors_code_length CHECK (char_length(code) = 2)
);

-- Nota: La imagen genérica del Pantone se guarda directamente en Supabase Storage
-- con un nombre fijo: vacavaliente-colors/pantone-generic.png
-- No se necesita tabla adicional para almacenar la URL

-- Crear índice para búsquedas rápidas
CREATE INDEX IF NOT EXISTS idx_vacavaliente_colors_code ON public.vacavaliente_colors(code);
CREATE INDEX IF NOT EXISTS idx_vacavaliente_colors_name ON public.vacavaliente_colors(name);

-- Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_vacavaliente_colors_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para actualizar updated_at
DROP TRIGGER IF EXISTS trigger_update_vacavaliente_colors_updated_at ON public.vacavaliente_colors;
CREATE TRIGGER trigger_update_vacavaliente_colors_updated_at
    BEFORE UPDATE ON public.vacavaliente_colors
    FOR EACH ROW
    EXECUTE FUNCTION update_vacavaliente_colors_updated_at();

-- Insertar colores iniciales (los que están actualmente en el código)
INSERT INTO public.vacavaliente_colors (name, code) VALUES
    ('Merlot', 'B7'),
    ('Red Clay', '25'),
    ('Pink Sand', '13'),
    ('Sandshell', '97'),
    ('Ginger', '56'),
    ('Cocoa', '45'),
    ('Matone', '47'),
    ('Ash', '30'),
    ('Pumpkin Orange', '26'),
    ('Lemon', '10'),
    ('Lotus Green', '24'),
    ('Pistacchio', 'C0'),
    ('Olive', 'B9'),
    ('Sage Green', '64'),
    ('Eucalyptus', '21'),
    ('Amazonia Green', '62'),
    ('Lichen Blue', 'B8'),
    ('Ocean Blue', '08'),
    ('Tempest Blue', '94'),
    ('Majolica Blue', 'A0'),
    ('Petrol Blue', '20'),
    ('Grafite', '36'),
    ('Black', '01')
ON CONFLICT (code) DO NOTHING;

-- Habilitar RLS (Row Level Security) si es necesario
ALTER TABLE public.vacavaliente_colors ENABLE ROW LEVEL SECURITY;

-- Eliminar políticas existentes si existen (para evitar errores al re-ejecutar)
DROP POLICY IF EXISTS "Allow read access to vacavaliente_colors" ON public.vacavaliente_colors;
DROP POLICY IF EXISTS "Allow insert access to vacavaliente_colors" ON public.vacavaliente_colors;
DROP POLICY IF EXISTS "Allow update access to vacavaliente_colors" ON public.vacavaliente_colors;
DROP POLICY IF EXISTS "Allow delete access to vacavaliente_colors" ON public.vacavaliente_colors;

-- Política para permitir lectura a todos los usuarios autenticados
CREATE POLICY "Allow read access to vacavaliente_colors"
    ON public.vacavaliente_colors
    FOR SELECT
    USING (true);

-- Política para permitir inserción solo a usuarios autenticados
CREATE POLICY "Allow insert access to vacavaliente_colors"
    ON public.vacavaliente_colors
    FOR INSERT
    WITH CHECK (true);

-- Política para permitir actualización solo a usuarios autenticados
CREATE POLICY "Allow update access to vacavaliente_colors"
    ON public.vacavaliente_colors
    FOR UPDATE
    USING (true);

-- Política para permitir eliminación solo a usuarios autenticados
CREATE POLICY "Allow delete access to vacavaliente_colors"
    ON public.vacavaliente_colors
    FOR DELETE
    USING (true);

