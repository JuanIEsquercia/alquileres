-- ============================================
-- TABLA DE ACTUALIZACIONES DE CONTRATOS
-- ============================================
-- Ejecuta este script en Supabase SQL Editor

-- 1. Crear tabla actualizaciones_contrato
CREATE TABLE IF NOT EXISTS actualizaciones_contrato (
    id BIGSERIAL PRIMARY KEY,
    alquiler_id UUID NOT NULL REFERENCES alquileres(id) ON DELETE CASCADE,
    fecha_actualizacion DATE NOT NULL,
    precio_anterior DECIMAL(10,2) NOT NULL,
    precio_nuevo DECIMAL(10,2) NOT NULL,
    expensas_anterior DECIMAL(10,2) DEFAULT 0,
    expensas_nuevas DECIMAL(10,2) DEFAULT 0,
    luz_anterior DECIMAL(10,2) DEFAULT 0,
    luz_nueva DECIMAL(10,2) DEFAULT 0,
    agua_anterior DECIMAL(10,2) DEFAULT 0,
    agua_nueva DECIMAL(10,2) DEFAULT 0,
    otros_anterior DECIMAL(10,2) DEFAULT 0,
    otros_nuevos DECIMAL(10,2) DEFAULT 0,
    porcentaje_aumento DECIMAL(5,2),
    indice_aplicado VARCHAR(100),
    observaciones TEXT,
    aplicada BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Crear índices para optimizar consultas
CREATE INDEX IF NOT EXISTS idx_actualizaciones_alquiler_id ON actualizaciones_contrato(alquiler_id);
CREATE INDEX IF NOT EXISTS idx_actualizaciones_fecha ON actualizaciones_contrato(fecha_actualizacion);
CREATE INDEX IF NOT EXISTS idx_actualizaciones_aplicada ON actualizaciones_contrato(aplicada);

-- 3. Función para calcular próximas actualizaciones basadas en inicio de contrato
CREATE OR REPLACE FUNCTION get_proximas_actualizaciones(meses_adelante INT DEFAULT 2)
RETURNS TABLE (
    alquiler_id UUID,
    fecha_proxima_actualizacion DATE,
    meses_desde_inicio INT,
    precio_actual DECIMAL,
    inquilino_nombre TEXT,
    propiedad_direccion TEXT,
    inicio_contrato DATE,
    ultima_actualizacion DATE
) AS $$
BEGIN
    RETURN QUERY
    WITH fechas_actualizacion AS (
        SELECT 
            a.id as alquiler_id,
            a.inicio_contrato,
            a.precio,
            COALESCE(MAX(ac.fecha_actualizacion), a.inicio_contrato) as ultima_actualizacion,
            -- Calcular próxima fecha (cada 6 meses desde inicio o última actualización)
            CASE 
                WHEN MAX(ac.fecha_actualizacion) IS NOT NULL THEN
                    MAX(ac.fecha_actualizacion) + INTERVAL '6 months'
                ELSE
                    a.inicio_contrato + INTERVAL '6 months'
            END as proxima_fecha
        FROM alquileres a
        LEFT JOIN actualizaciones_contrato ac ON a.id = ac.alquiler_id
        WHERE a.activo = true 
        AND a.fecha_finalizacion >= CURRENT_DATE
        GROUP BY a.id, a.inicio_contrato, a.precio
    )
    SELECT 
        fa.alquiler_id,
        fa.proxima_fecha::DATE,
        EXTRACT(MONTH FROM AGE(fa.proxima_fecha, fa.inicio_contrato))::INT as meses_desde_inicio,
        fa.precio,
        (i.nombre || ' ' || i.apellido) as inquilino_nombre,
        p.direccion as propiedad_direccion,
        fa.inicio_contrato,
        fa.ultima_actualizacion::DATE
    FROM fechas_actualizacion fa
    JOIN alquileres a ON fa.alquiler_id = a.id
    JOIN inquilinos i ON a.inquilino_id = i.id
    JOIN propiedades p ON a.propiedad_id = p.id
    WHERE fa.proxima_fecha <= CURRENT_DATE + (meses_adelante || ' months')::INTERVAL
    AND fa.proxima_fecha >= CURRENT_DATE
    ORDER BY fa.proxima_fecha ASC;
END;
$$ LANGUAGE plpgsql;

-- 4. Función para aplicar actualización de contrato
CREATE OR REPLACE FUNCTION aplicar_actualizacion_contrato(
    p_alquiler_id UUID,
    p_precio_nuevo DECIMAL,
    p_expensas_nuevas DECIMAL DEFAULT NULL,
    p_luz_nueva DECIMAL DEFAULT NULL,
    p_agua_nueva DECIMAL DEFAULT NULL,
    p_otros_nuevos DECIMAL DEFAULT NULL,
    p_porcentaje_aumento DECIMAL DEFAULT NULL,
    p_indice_aplicado VARCHAR DEFAULT NULL,
    p_observaciones TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
    alquiler_actual RECORD;
    actualizacion_id BIGINT;
BEGIN
    -- Obtener datos actuales del alquiler
    SELECT * INTO alquiler_actual 
    FROM alquileres 
    WHERE id = p_alquiler_id AND activo = true;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Alquiler no encontrado o no activo';
    END IF;
    
    -- Insertar registro de actualización
    INSERT INTO actualizaciones_contrato (
        alquiler_id,
        fecha_actualizacion,
        precio_anterior,
        precio_nuevo,
        expensas_anterior,
        expensas_nuevas,
        luz_anterior,
        luz_nueva,
        agua_anterior,
        agua_nueva,
        otros_anterior,
        otros_nuevos,
        porcentaje_aumento,
        indice_aplicado,
        observaciones,
        aplicada
    ) VALUES (
        p_alquiler_id,
        CURRENT_DATE,
        alquiler_actual.precio,
        p_precio_nuevo,
        alquiler_actual.expensas,
        COALESCE(p_expensas_nuevas, alquiler_actual.expensas),
        alquiler_actual.luz,
        COALESCE(p_luz_nueva, alquiler_actual.luz),
        alquiler_actual.agua,
        COALESCE(p_agua_nueva, alquiler_actual.agua),
        alquiler_actual.otros_importes,
        COALESCE(p_otros_nuevos, alquiler_actual.otros_importes),
        p_porcentaje_aumento,
        p_indice_aplicado,
        p_observaciones,
        true
    ) RETURNING id INTO actualizacion_id;
    
    -- Actualizar el alquiler con los nuevos valores
    UPDATE alquileres SET
        precio = p_precio_nuevo,
        expensas = COALESCE(p_expensas_nuevas, expensas),
        luz = COALESCE(p_luz_nueva, luz),
        agua = COALESCE(p_agua_nueva, agua),
        otros_importes = COALESCE(p_otros_nuevos, otros_importes),
        updated_at = NOW()
    WHERE id = p_alquiler_id;
    
    RETURN true;
EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Error aplicando actualización: %', SQLERRM;
END;
$$ LANGUAGE plpgsql;

-- 5. Función para obtener historial de actualizaciones de un contrato
CREATE OR REPLACE FUNCTION get_historial_actualizaciones(p_alquiler_id UUID)
RETURNS TABLE (
    fecha_actualizacion DATE,
    precio_anterior DECIMAL,
    precio_nuevo DECIMAL,
    porcentaje_aumento DECIMAL,
    indice_aplicado VARCHAR,
    observaciones TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ac.fecha_actualizacion,
        ac.precio_anterior,
        ac.precio_nuevo,
        ac.porcentaje_aumento,
        ac.indice_aplicado,
        ac.observaciones
    FROM actualizaciones_contrato ac
    WHERE ac.alquiler_id = p_alquiler_id
    AND ac.aplicada = true
    ORDER BY ac.fecha_actualizacion DESC;
END;
$$ LANGUAGE plpgsql;

-- 6. Trigger para actualizar updated_at
CREATE OR REPLACE FUNCTION update_actualizaciones_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_actualizaciones_updated_at
    BEFORE UPDATE ON actualizaciones_contrato
    FOR EACH ROW
    EXECUTE FUNCTION update_actualizaciones_updated_at();

-- 7. Habilitar RLS (opcional)
ALTER TABLE actualizaciones_contrato ENABLE ROW LEVEL SECURITY;

-- Política para permitir todas las operaciones (ajustar según necesidades)
CREATE POLICY "Permitir todas las operaciones en actualizaciones_contrato" 
ON actualizaciones_contrato 
FOR ALL 
USING (true);

-- 8. Verificar que todo funciona
SELECT 'Tabla actualizaciones_contrato creada exitosamente' as status;
SELECT * FROM get_proximas_actualizaciones(3) LIMIT 5; 