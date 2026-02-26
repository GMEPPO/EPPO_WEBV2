-- Ejecuta este SQL en el Supabase SQL Editor para crear la tabla de aplicaciones
-- Dashboard Supabase -> SQL Editor -> New query

CREATE TABLE IF NOT EXISTS apps (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  name TEXT NOT NULL,
  link TEXT NOT NULL,
  icon TEXT,                    -- URL completa O ruta en bucket "Icons app hub" (ej: 'powerbi.png')
  icon_emoji TEXT,              -- Emoji (opcional). Se usa solo si no hay icon
  category TEXT,                -- Categoría para filtrar (ej: 'BI', 'CRM'). Vacío/NULL = solo en General
  orden INT DEFAULT 0,          -- Para ordenar los botones
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Habilitar Row Level Security (RLS) - permite lectura pública para anon
ALTER TABLE apps ENABLE ROW LEVEL SECURITY;

-- Política: permitir lectura pública a todos (DROP evita error si ya existe)
DROP POLICY IF EXISTS "Allow public read access" ON apps;
CREATE POLICY "Allow public read access" ON apps
  FOR SELECT USING (true);

-- Si la tabla ya existía sin category, añadir la columna:
ALTER TABLE apps ADD COLUMN IF NOT EXISTS category TEXT;

-- Para usar imágenes del bucket "Icons app hub": sube el archivo y usa la ruta en icon.
-- Ejemplo: icon = 'powerbi.png' o 'logos/powerbi.png'

-- Datos de ejemplo (opcional - puedes eliminarlos después)
INSERT INTO apps (name, link, icon_emoji, category, orden) VALUES
  ('Power BI', 'https://app.powerbi.com', '📊', 'BI', 1),
  ('Salesforce CRM', 'https://login.salesforce.com', '☁️', 'CRM', 2),
  ('HR & Payroll', 'https://example.com/hr', '👤', 'RRHH', 3),
  ('Project Management', 'https://example.com/projects', '📋', 'Proyectos', 4),
  ('ERP System', 'https://example.com/erp', '⚙️', NULL, 5),
  ('IT Help Desk', 'https://example.com/helpdesk', '🎧', 'IT', 6);
