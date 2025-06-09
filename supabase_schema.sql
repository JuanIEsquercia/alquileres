-- ============================================
-- SISTEMA DE GESTIÓN DE ALQUILERES
-- Script SQL para Supabase (Corregido)
-- ============================================

-- Habilitar extensiones necesarias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- 1. TABLA INQUILINOS
-- ============================================

CREATE TABLE inquilinos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nombre VARCHAR(100) NOT NULL,
    apellido VARCHAR(100) NOT NULL,
    dni VARCHAR(8) NOT NULL UNIQUE,
    telefono VARCHAR(20) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para inquilinos
CREATE INDEX idx_inquilinos_dni ON inquilinos(dni);
CREATE INDEX idx_inquilinos_nombre ON inquilinos(nombre, apellido);

-- Validación DNI (solo números y 7-8 dígitos)
ALTER TABLE inquilinos ADD CONSTRAINT chk_dni_format 
CHECK (dni ~ '^[0-9]{7,8}$');

-- ============================================
-- 2. TABLA PROPIEDADES
-- ============================================

CREATE TABLE propiedades (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nombre VARCHAR(200) NOT NULL,
    direccion TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para propiedades
CREATE INDEX idx_propiedades_nombre ON propiedades(nombre);

-- ============================================
-- 3. TABLA ÍNDICES DE ACTUALIZACIÓN
-- ============================================

CREATE TABLE indices_actualizacion (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nombre VARCHAR(50) NOT NULL UNIQUE,
    descripcion TEXT NOT NULL,
    activo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 4. TABLA ALQUILERES
-- ============================================

CREATE TABLE alquileres (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    propiedad_id UUID NOT NULL,
    inquilino_id UUID NOT NULL,
    inicio_contrato DATE NOT NULL,
    plazo_meses INTEGER NOT NULL CHECK (plazo_meses > 0),
    fecha_finalizacion DATE NOT NULL,
    indice_id UUID NOT NULL,
    precio DECIMAL(12,2) NOT NULL CHECK (precio > 0),
    expensas DECIMAL(12,2) DEFAULT 0 CHECK (expensas >= 0),
    luz DECIMAL(12,2) DEFAULT 0 CHECK (luz >= 0),
    agua DECIMAL(12,2) DEFAULT 0 CHECK (agua >= 0),
    otros_importes DECIMAL(12,2) DEFAULT 0 CHECK (otros_importes >= 0),
    activo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Agregar foreign keys después de crear las tablas
ALTER TABLE alquileres ADD CONSTRAINT fk_alquileres_propiedad 
FOREIGN KEY (propiedad_id) REFERENCES propiedades(id) ON DELETE RESTRICT;

ALTER TABLE alquileres ADD CONSTRAINT fk_alquileres_inquilino 
FOREIGN KEY (inquilino_id) REFERENCES inquilinos(id) ON DELETE RESTRICT;

ALTER TABLE alquileres ADD CONSTRAINT fk_alquileres_indice 
FOREIGN KEY (indice_id) REFERENCES indices_actualizacion(id) ON DELETE RESTRICT;

-- Índices para alquileres
CREATE INDEX idx_alquileres_propiedad ON alquileres(propiedad_id);
CREATE INDEX idx_alquileres_inquilino ON alquileres(inquilino_id);
CREATE INDEX idx_alquileres_fechas ON alquileres(inicio_contrato, fecha_finalizacion);
CREATE INDEX idx_alquileres_activo ON alquileres(activo);

-- Constraint: Una propiedad solo puede tener un alquiler activo
CREATE UNIQUE INDEX idx_alquileres_propiedad_activo 
ON alquileres(propiedad_id) 
WHERE activo = TRUE;

-- ============================================
-- 5. INSERTAR DATOS INICIALES
-- ============================================

-- Insertar índices predefinidos
INSERT INTO indices_actualizacion (nombre, descripcion) VALUES
('IPC', 'Índice de Precios al Consumidor'),
('ICL', 'Índice Costo de Vida'),
('Casa Propia', 'Índice Casa Propia'),
('Fijo', 'Sin actualización');

-- ============================================
-- 6. FUNCIONES Y TRIGGERS
-- ============================================

-- Función para actualizar fecha de modificación
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Función para calcular fecha de finalización
CREATE OR REPLACE FUNCTION calculate_fecha_finalizacion()
RETURNS TRIGGER AS $$
BEGIN
    NEW.fecha_finalizacion = NEW.inicio_contrato + (NEW.plazo_meses || ' months')::INTERVAL;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Aplicar triggers de updated_at a todas las tablas
CREATE TRIGGER trigger_inquilinos_updated_at
    BEFORE UPDATE ON inquilinos
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_propiedades_updated_at
    BEFORE UPDATE ON propiedades
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_alquileres_updated_at
    BEFORE UPDATE ON alquileres
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger para calcular fecha_finalizacion automáticamente
CREATE TRIGGER trigger_calculate_fecha_finalizacion
    BEFORE INSERT OR UPDATE OF inicio_contrato, plazo_meses ON alquileres
    FOR EACH ROW EXECUTE FUNCTION calculate_fecha_finalizacion();

-- ============================================
-- 7. VISTAS ÚTILES
-- ============================================

-- Vista con información completa de alquileres
CREATE VIEW vista_alquileres_completa AS
SELECT 
    a.id,
    p.nombre as propiedad_nombre,
    p.direccion as propiedad_direccion,
    i.nombre as inquilino_nombre,
    i.apellido as inquilino_apellido,
    i.dni as inquilino_dni,
    i.telefono as inquilino_telefono,
    a.inicio_contrato,
    a.plazo_meses,
    a.fecha_finalizacion,
    ind.nombre as indice_nombre,
    ind.descripcion as indice_descripcion,
    a.precio,
    a.expensas,
    a.luz,
    a.agua,
    a.otros_importes,
    (a.precio + a.expensas + a.luz + a.agua + a.otros_importes) as total_mensual,
    a.activo,
    a.created_at,
    a.updated_at,
    CASE 
        WHEN a.fecha_finalizacion < CURRENT_DATE THEN 'vencido'
        WHEN a.fecha_finalizacion <= CURRENT_DATE + INTERVAL '30 days' THEN 'por_vencer'
        ELSE 'vigente'
    END as estado_contrato
FROM alquileres a
JOIN propiedades p ON a.propiedad_id = p.id
JOIN inquilinos i ON a.inquilino_id = i.id
JOIN indices_actualizacion ind ON a.indice_id = ind.id;

-- Vista de propiedades disponibles (sin alquiler activo)
CREATE VIEW vista_propiedades_disponibles AS
SELECT p.*
FROM propiedades p
LEFT JOIN alquileres a ON p.id = a.propiedad_id AND a.activo = true
WHERE a.id IS NULL;

-- ============================================
-- 8. FUNCIONES ÚTILES
-- ============================================

-- Función para obtener alquileres próximos a vencer
CREATE OR REPLACE FUNCTION get_alquileres_por_vencer(dias_adelanto INTEGER DEFAULT 30)
RETURNS TABLE (
    alquiler_id UUID,
    propiedad_nombre VARCHAR,
    inquilino_nombre TEXT,
    fecha_finalizacion DATE,
    dias_restantes INTEGER,
    total_mensual DECIMAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        a.id as alquiler_id,
        p.nombre as propiedad_nombre,
        (i.nombre || ' ' || i.apellido) as inquilino_nombre,
        a.fecha_finalizacion,
        (a.fecha_finalizacion - CURRENT_DATE)::INTEGER as dias_restantes,
        (a.precio + a.expensas + a.luz + a.agua + a.otros_importes) as total_mensual
    FROM alquileres a
    JOIN propiedades p ON a.propiedad_id = p.id
    JOIN inquilinos i ON a.inquilino_id = i.id
    WHERE a.activo = true
    AND a.fecha_finalizacion <= CURRENT_DATE + (dias_adelanto || ' days')::INTERVAL
    AND a.fecha_finalizacion >= CURRENT_DATE
    ORDER BY a.fecha_finalizacion ASC;
END;
$$ LANGUAGE plpgsql;

-- Función para obtener estadísticas del dashboard
CREATE OR REPLACE FUNCTION get_estadisticas_dashboard()
RETURNS JSON AS $$
DECLARE
    stats JSON;
BEGIN
    SELECT json_build_object(
        'total_propiedades', (SELECT COUNT(*) FROM propiedades),
        'propiedades_ocupadas', (SELECT COUNT(DISTINCT propiedad_id) FROM alquileres WHERE activo = true),
        'total_inquilinos', (SELECT COUNT(*) FROM inquilinos),
        'total_alquileres_activos', (SELECT COUNT(*) FROM alquileres WHERE activo = true),
        'ingresos_mensual', (
            SELECT COALESCE(SUM(precio + expensas + luz + agua + otros_importes), 0)
            FROM alquileres 
            WHERE activo = true
        ),
        'alquileres_por_vencer', (
            SELECT COUNT(*) 
            FROM alquileres 
            WHERE activo = true 
            AND fecha_finalizacion <= CURRENT_DATE + INTERVAL '30 days'
            AND fecha_finalizacion >= CURRENT_DATE
        )
    ) INTO stats;
    
    RETURN stats;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 9. ROW LEVEL SECURITY (RLS)
-- ============================================

-- Habilitar RLS en todas las tablas
ALTER TABLE inquilinos ENABLE ROW LEVEL SECURITY;
ALTER TABLE propiedades ENABLE ROW LEVEL SECURITY;
ALTER TABLE indices_actualizacion ENABLE ROW LEVEL SECURITY;
ALTER TABLE alquileres ENABLE ROW LEVEL SECURITY;

-- Políticas básicas (permitir todo para usuarios autenticados)
CREATE POLICY "Permitir todo a usuarios autenticados" ON inquilinos
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Permitir todo a usuarios autenticados" ON propiedades
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Permitir lectura de índices" ON indices_actualizacion
    FOR SELECT USING (true);

CREATE POLICY "Permitir todo a usuarios autenticados" ON alquileres
    FOR ALL USING (auth.role() = 'authenticated');

-- ============================================
-- 10. DATOS DE EJEMPLO (OPCIONAL)
-- ============================================

-- Inquilinos de ejemplo
INSERT INTO inquilinos (nombre, apellido, dni, telefono) VALUES
('Juan', 'Pérez', '12345678', '+54 11 1234-5678'),
('María', 'García', '87654321', '+54 11 9876-5432'),
('Carlos', 'López', '11223344', '+54 11 5555-6666');

-- Propiedades de ejemplo
INSERT INTO propiedades (nombre, direccion) VALUES
('Departamento 2A', 'Av. Principal 123, Piso 2'),
('Casa Los Pinos', 'Calle Los Pinos 456'),
('Departamento 1B', 'Av. Libertad 789, Piso 1'),
('Local Comercial Centro', 'Av. San Martín 100');

-- ============================================
-- SCRIPT COMPLETADO
-- ============================================

-- Para verificar que todo se creó correctamente, ejecuta:
-- SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name;
-- SELECT * FROM vista_alquileres_completa;
-- SELECT get_estadisticas_dashboard(); 