-- =====================================================
-- ESTRUCTURA DE BASE DE DATOS MODULAR POR CATEGORÍAS
-- =====================================================
-- Este script crea tablas separadas para cada categoría
-- con variables técnicas específicas y filtros dinámicos

-- =====================================================
-- 1. TABLA DE CATEGORÍAS
-- =====================================================
CREATE TABLE IF NOT EXISTS categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    "name_pt" VARCHAR(100) NOT NULL,
    "name_es" VARCHAR(100) NOT NULL,
    "name_en" VARCHAR(100) NOT NULL,
    description TEXT,
    icon VARCHAR(100),
    color VARCHAR(20) DEFAULT '#2563eb',
    sort_order INTEGER DEFAULT 0,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 2. TABLA DE SECADORES
-- =====================================================
CREATE TABLE IF NOT EXISTS secadores (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(255) NOT NULL,
    "descripcion_pt" TEXT,
    "descripcion_es" TEXT,
    "descripcion_en" TEXT,
    foto VARCHAR(500),
    "foto_2" VARCHAR(500),
    "foto_3" VARCHAR(500),
    precio DECIMAL(10,2) NOT NULL,
    
    -- Variables técnicas específicas de secadores
    potencia INTEGER NOT NULL, -- W
    voltaje INTEGER DEFAULT 220, -- V
    frecuencia INTEGER DEFAULT 50, -- Hz
    velocidad_aire DECIMAL(5,2), -- m/s
    temperatura_max INTEGER, -- °C
    peso DECIMAL(5,2), -- kg
    dimensiones VARCHAR(100), -- LxAxP cm
    cable_largo DECIMAL(4,2), -- metros
    
    -- Características específicas
    velocidades INTEGER DEFAULT 2, -- número de velocidades
    niveles_calor INTEGER DEFAULT 2, -- niveles de temperatura
    tecnologia_ionica BOOLEAN DEFAULT false,
    tecnologia_ceramica BOOLEAN DEFAULT false,
    tecnologia_infrarroja BOOLEAN DEFAULT false,
    filtro_aire BOOLEAN DEFAULT false,
    concentrador_aire BOOLEAN DEFAULT false,
    difusor BOOLEAN DEFAULT false,
    
    -- Características físicas
    color VARCHAR(50),
    material VARCHAR(100),
    tipo_instalacion VARCHAR(50), -- 'suelto', 'pared', 'inalambrico'
    plegable BOOLEAN DEFAULT false,
    ergonomico BOOLEAN DEFAULT false,
    
    -- Características adicionales
    features JSONB DEFAULT '[]'::jsonb,
    badge VARCHAR(50) DEFAULT '',
    garantia INTEGER DEFAULT 12, -- meses
    "ficha_tecnica" VARCHAR(500),
    
    -- Metadatos
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 3. TABLA DE PLANCHAS/IRONING
-- =====================================================
CREATE TABLE IF NOT EXISTS ironing (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(255) NOT NULL,
    "descripcion_pt" TEXT,
    "descripcion_es" TEXT,
    "descripcion_en" TEXT,
    foto VARCHAR(500),
    "foto_2" VARCHAR(500),
    "foto_3" VARCHAR(500),
    precio DECIMAL(10,2) NOT NULL,
    
    -- Variables técnicas específicas de planchas
    potencia INTEGER NOT NULL, -- W
    voltaje INTEGER DEFAULT 220, -- V
    peso DECIMAL(5,2), -- kg
    dimensiones VARCHAR(100), -- LxAxP cm
    cable_largo DECIMAL(4,2), -- metros
    
    -- Características específicas
    tipo_plancha VARCHAR(50), -- 'vapor', 'seco', 'vertical'
    deposito_agua DECIMAL(4,2), -- litros
    presion_vapor INTEGER, -- gramos/min
    temperatura_max INTEGER, -- °C
    superficie_plancha VARCHAR(100), -- material de la base
    anti_calcario BOOLEAN DEFAULT false,
    auto_apagado BOOLEAN DEFAULT false,
    vapor_continuo BOOLEAN DEFAULT false,
    vapor_impulso BOOLEAN DEFAULT false,
    
    -- Características físicas
    color VARCHAR(50),
    material VARCHAR(100),
    ergonomico BOOLEAN DEFAULT false,
    led_display BOOLEAN DEFAULT false,
    
    -- Características adicionales
    features JSONB DEFAULT '[]'::jsonb,
    badge VARCHAR(50) DEFAULT '',
    garantia INTEGER DEFAULT 12, -- meses
    "ficha_tecnica" VARCHAR(500),
    
    -- Metadatos
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 4. TABLA DE PORTA MALAS
-- =====================================================
CREATE TABLE IF NOT EXISTS porta_malas (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(255) NOT NULL,
    "descripcion_pt" TEXT,
    "descripcion_es" TEXT,
    "descripcion_en" TEXT,
    foto VARCHAR(500),
    "foto_2" VARCHAR(500),
    "foto_3" VARCHAR(500),
    precio DECIMAL(10,2) NOT NULL,
    
    -- Variables técnicas específicas de porta malas
    capacidad DECIMAL(5,2), -- litros
    peso DECIMAL(5,2), -- kg
    dimensiones VARCHAR(100), -- LxAxP cm
    dimensiones_cerrado VARCHAR(100), -- LxAxP cm cuando está plegado
    
    -- Características específicas
    tipo_material VARCHAR(100), -- 'madera', 'metal', 'tela', 'plastico'
    tipo_estructura VARCHAR(50), -- 'dobravel', 'fijo', 'modular'
    numero_ruedas INTEGER DEFAULT 4,
    tipo_ruedas VARCHAR(50), -- 'giratorias', 'fijas', 'silenciosas'
    sistema_cierre VARCHAR(100), -- tipo de cierre
    candado_tsa BOOLEAN DEFAULT false,
    compartimentos INTEGER DEFAULT 1,
    bolsillos_exteriores INTEGER DEFAULT 0,
    asa_retractil BOOLEAN DEFAULT false,
    asa_lateral BOOLEAN DEFAULT false,
    
    -- Características físicas
    color VARCHAR(50),
    acabado VARCHAR(100), -- tipo de acabado
    resistente_agua BOOLEAN DEFAULT false,
    resistente_rayones BOOLEAN DEFAULT false,
    
    -- Características adicionales
    features JSONB DEFAULT '[]'::jsonb,
    badge VARCHAR(50) DEFAULT '',
    garantia INTEGER DEFAULT 12, -- meses
    "ficha_tecnica" VARCHAR(500),
    
    -- Metadatos
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 5. ÍNDICES PARA OPTIMIZACIÓN
-- =====================================================

-- Índices para secadores
CREATE INDEX IF NOT EXISTS idx_secadores_potencia ON secadores(potencia);
CREATE INDEX IF NOT EXISTS idx_secadores_precio ON secadores(precio);
CREATE INDEX IF NOT EXISTS idx_secadores_color ON secadores(color);
CREATE INDEX IF NOT EXISTS idx_secadores_tipo_instalacion ON secadores(tipo_instalacion);
CREATE INDEX IF NOT EXISTS idx_secadores_tecnologia_ionica ON secadores(tecnologia_ionica);
CREATE INDEX IF NOT EXISTS idx_secadores_tecnologia_ceramica ON secadores(tecnologia_ceramica);

-- Índices para ironing
CREATE INDEX IF NOT EXISTS idx_ironing_potencia ON ironing(potencia);
CREATE INDEX IF NOT EXISTS idx_ironing_precio ON ironing(precio);
CREATE INDEX IF NOT EXISTS idx_ironing_tipo_plancha ON ironing(tipo_plancha);
CREATE INDEX IF NOT EXISTS idx_ironing_presion_vapor ON ironing(presion_vapor);
CREATE INDEX IF NOT EXISTS idx_ironing_anti_calcario ON ironing(anti_calcario);

-- Índices para porta malas
CREATE INDEX IF NOT EXISTS idx_porta_malas_capacidad ON porta_malas(capacidad);
CREATE INDEX IF NOT EXISTS idx_porta_malas_precio ON porta_malas(precio);
CREATE INDEX IF NOT EXISTS idx_porta_malas_tipo_material ON porta_malas(tipo_material);
CREATE INDEX IF NOT EXISTS idx_porta_malas_tipo_estructura ON porta_malas(tipo_estructura);
CREATE INDEX IF NOT EXISTS idx_porta_malas_candado_tsa ON porta_malas(candado_tsa);

-- =====================================================
-- 6. FUNCIONES DE ACTUALIZACIÓN
-- =====================================================

-- Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers para actualizar updated_at
CREATE TRIGGER update_categories_updated_at 
    BEFORE UPDATE ON categories 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_secadores_updated_at 
    BEFORE UPDATE ON secadores 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ironing_updated_at 
    BEFORE UPDATE ON ironing 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_porta_malas_updated_at 
    BEFORE UPDATE ON porta_malas 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 7. DATOS INICIALES
-- =====================================================

-- Insertar categorías
INSERT INTO categories (name, name_pt, name_es, name_en, description, icon, color, sort_order) VALUES
('secadores', 'Secadores', 'Secadores', 'Hair Dryers', 'Secadores profesionales para el cuidado del cabello', 'fas fa-wind', '#2563eb', 1),
('ironing', 'Passar a ferro', 'Planchado', 'Ironing', 'Equipos para planchar ropa con calidad', 'fas fa-tshirt', '#f59e0b', 2),
('porta-malas', 'Porta-malas', 'Porta malas', 'Luggage Racks', 'Porta malas elegantes para habitaciones de hotel', 'fas fa-suitcase', '#10b981', 3)
ON CONFLICT (name) DO NOTHING;

-- =====================================================
-- 8. SEGURIDAD (RLS)
-- =====================================================

-- Habilitar RLS en todas las tablas
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE secadores ENABLE ROW LEVEL SECURITY;
ALTER TABLE ironing ENABLE ROW LEVEL SECURITY;
ALTER TABLE porta_malas ENABLE ROW LEVEL SECURITY;

-- Políticas para lectura pública
CREATE POLICY "Permitir lectura pública de categorías" ON categories
    FOR SELECT USING (true);

CREATE POLICY "Permitir lectura pública de secadores" ON secadores
    FOR SELECT USING (true);

CREATE POLICY "Permitir lectura pública de ironing" ON ironing
    FOR SELECT USING (true);

CREATE POLICY "Permitir lectura pública de porta malas" ON porta_malas
    FOR SELECT USING (true);

-- =====================================================
-- 9. VISTAS PARA CONSULTAS FÁCILES
-- =====================================================

-- Vista unificada de todos los productos
CREATE OR REPLACE VIEW all_products AS
SELECT 
    'secadores' as categoria,
    id,
    nombre,
    "descripcion_pt",
    "descripcion_es", 
    "descripcion_en",
    foto,
    "foto_2",
    "foto_3",
    precio,
    potencia as variable_principal,
    color,
    features,
    badge,
    "ficha_tecnica",
    created_at,
    updated_at
FROM secadores
UNION ALL
SELECT 
    'ironing' as categoria,
    id,
    nombre,
    "descripcion_pt",
    "descripcion_es",
    "descripcion_en", 
    foto,
    "foto_2",
    "foto_3",
    precio,
    potencia as variable_principal,
    color,
    features,
    badge,
    "ficha_tecnica",
    created_at,
    updated_at
FROM ironing
UNION ALL
SELECT 
    'porta-malas' as categoria,
    id,
    nombre,
    "descripcion_pt",
    "descripcion_es",
    "descripcion_en",
    foto,
    "foto_2", 
    "foto_3",
    precio,
    capacidad as variable_principal,
    color,
    features,
    badge,
    "ficha_tecnica",
    created_at,
    updated_at
FROM porta_malas;

-- =====================================================
-- 10. VERIFICACIÓN
-- =====================================================

-- Verificar que las tablas se crearon correctamente
SELECT 'Estructura de base de datos modular creada exitosamente' as mensaje;
SELECT 'Categorías:' as info, COUNT(*) as total FROM categories;
SELECT 'Secadores:' as info, COUNT(*) as total FROM secadores;
SELECT 'Ironing:' as info, COUNT(*) as total FROM ironing;
SELECT 'Porta malas:' as info, COUNT(*) as total FROM porta_malas;


