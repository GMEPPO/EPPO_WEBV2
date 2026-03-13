-- Script SQL para crear la tabla de productos en Supabase
-- Ejecutar este código en el SQL Editor de Supabase

-- Crear la tabla de productos (estructura actualizada basada en la base de datos real)
CREATE TABLE IF NOT EXISTS products (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(255) NOT NULL,
    "descripcion PT" TEXT,
    "Descripcion ES" TEXT,
    foto VARCHAR(500),
    "Foto 2" VARCHAR(500),
    precio DECIMAL(10,2) NOT NULL,
    potencia INTEGER DEFAULT 0,
    color VARCHAR(50),
    tipo VARCHAR(100),
    categoria VARCHAR(100) NOT NULL,
    features JSONB DEFAULT '[]'::jsonb,
    badge VARCHAR(50) DEFAULT '',
    "Carateristicas" TEXT,
    "Especificações" TEXT,
    "Dimensões e peso" TEXT,
    "Ficha tecnica" VARCHAR(500),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear índices para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_products_categoria ON products(categoria);
CREATE INDEX IF NOT EXISTS idx_products_precio ON products(precio);
CREATE INDEX IF NOT EXISTS idx_products_potencia ON products(potencia);
CREATE INDEX IF NOT EXISTS idx_products_color ON products(color);
CREATE INDEX IF NOT EXISTS idx_products_tipo ON products(tipo);

-- Crear función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Crear trigger para actualizar updated_at
CREATE TRIGGER update_products_updated_at 
    BEFORE UPDATE ON products 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Insertar datos de ejemplo basados en los archivos JSON existentes
INSERT INTO products (nombre, descripcion, foto, precio, potencia, color, tipo, categoria, features, badge) VALUES
('REGAL', 'Secador profesional de alta calidad', 'https://northmace.com/app/uploads/2023/08/0008617-600x600.jpg', 70.00, 1800, 'black', 'suelto', 'secadores', '["1800W", "Profesional", "3 Velocidades"]', 'NEW'),
('1800 TF', 'Secador de alta potencia', 'secador.png', 10.00, 1200, 'black', 'suelto', 'secadores', '["1200W", "Compacto"]', ''),
('Secador Profissional Valera+', 'Secador de alta potência com tecnologia iônica', 'secador.png', 89.99, 1800, 'black', 'suelto', 'secadores', '["1800W", "Iônico", "3 Velocidades"]', 'NEW'),
('Secador Compacto Travel', 'Perfeito para viagens, compacto e eficiente', 'secador.png', 49.99, 1200, 'white', 'suelto', 'secadores', '["1200W", "Compacto", "2 Velocidades"]', ''),
('Secador Premium Salon', 'Para uso profissional em salões de beleza', 'secador.png', 129.99, 2000, 'silver', 'pared', 'secadores', '["2000W", "Profissional", "4 Velocidades"]', ''),
('Secador Cerâmico Avançado', 'Tecnologia cerâmica para cabelos mais saudáveis', 'secador.png', 79.99, 1600, 'black', 'suelto', 'secadores', '["1600W", "Cerâmico", "Iônico"]', ''),
('Secador Infravermelho', 'Tecnologia infravermelha para secagem suave', 'secador.png', 99.99, 1500, 'white', 'suelto', 'secadores', '["1500W", "Infravermelho", "Suave"]', ''),
('Secador Sem Fio', 'Liberdade total de movimento, bateria recarregável', 'secador.png', 149.99, 0, 'black', 'inalambrico', 'secadores', '["Bateria", "Sem fio", "30min"]', ''),
('PLANCHA VAPOR', 'Plancha a vapor profesional', 'plancha.png', 45.00, 2000, 'white', 'vapor', 'ironing', '["2000W", "Vapor continuo", "Anti-cal"]', 'HOT'),
('Ferro de Passar Premium', 'Ferro de alta qualidade para resultados profissionais', 'Ironing.png', 79.99, 1800, 'black', 'vapor', 'ironing', '["1800W", "Vapor", "Anti-calcário"]', ''),
('MALETA PREMIUM', 'Maleta de viaje premium', 'maleta.png', 120.00, 0, 'silver', 'dobravel', 'porta-malas', '["4 ruedas", "Tela resistente", "Candado TSA"]', 'PREMIUM'),
('Porta-malas Premium', 'Porta-malas elegante e funcional para quartos', 'PORTA MALAS.png', 129.99, 0, 'black', 'madera', 'porta-malas', '["Madeira", "Elegante", "Resistente"]', '');

-- Habilitar Row Level Security (RLS) para seguridad
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- Crear política para permitir lectura pública (para la web)
CREATE POLICY "Permitir lectura pública de productos" ON products
    FOR SELECT USING (true);

-- Crear política para permitir inserción, actualización y eliminación solo a usuarios autenticados
-- (opcional, descomenta si necesitas autenticación)
-- CREATE POLICY "Permitir gestión de productos a usuarios autenticados" ON products
--     FOR ALL USING (auth.role() = 'authenticated');

-- Verificar que la tabla se creó correctamente
SELECT 'Tabla products creada exitosamente' as mensaje;
SELECT COUNT(*) as total_productos FROM products;

