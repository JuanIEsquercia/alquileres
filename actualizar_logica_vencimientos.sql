-- ============================================
-- ACTUALIZAR LÓGICA DE LIBERACIÓN AUTOMÁTICA
-- ============================================
-- Ejecuta este script en Supabase SQL Editor

-- 1. Actualizar función get_estadisticas_dashboard para considerar fechas
CREATE OR REPLACE FUNCTION get_estadisticas_dashboard()
RETURNS JSON AS $$
DECLARE
    stats JSON;
BEGIN
    SELECT json_build_object(
        'total_propiedades', (SELECT COUNT(*) FROM propiedades),
        -- Propiedades ocupadas: tienen alquileres activos Y no vencidos
        'propiedades_ocupadas', (
            SELECT COUNT(DISTINCT propiedad_id) 
            FROM alquileres 
            WHERE activo = true 
            AND fecha_finalizacion >= CURRENT_DATE
        ),
        'total_inquilinos', (SELECT COUNT(*) FROM inquilinos),
        -- Alquileres activos: activos en BD Y no vencidos por fecha
        'total_alquileres_activos', (
            SELECT COUNT(*) 
            FROM alquileres 
            WHERE activo = true 
            AND fecha_finalizacion >= CURRENT_DATE
        ),
        -- Ingresos solo de alquileres realmente activos (no vencidos)
        'ingresos_mensual', (
            SELECT COALESCE(SUM(precio + expensas + luz + agua + otros_importes), 0)
            FROM alquileres 
            WHERE activo = true 
            AND fecha_finalizacion >= CURRENT_DATE
        ),
        -- Alquileres por vencer en los próximos 30 días
        'alquileres_por_vencer', (
            SELECT COUNT(*) 
            FROM alquileres 
            WHERE activo = true 
            AND fecha_finalizacion >= CURRENT_DATE
            AND fecha_finalizacion <= CURRENT_DATE + INTERVAL '30 days'
        )
    ) INTO stats;
    
    RETURN stats;
END;
$$ LANGUAGE plpgsql;

-- 2. Crear vista de propiedades realmente disponibles
CREATE OR REPLACE VIEW vista_propiedades_realmente_disponibles AS
SELECT p.*
FROM propiedades p
LEFT JOIN alquileres a ON p.id = a.propiedad_id 
    AND a.activo = true 
    AND a.fecha_finalizacion >= CURRENT_DATE
WHERE a.id IS NULL;

-- 3. Función para obtener alquileres por estado real
CREATE OR REPLACE FUNCTION get_alquileres_por_estado()
RETURNS TABLE (
    total_contratos BIGINT,
    realmente_activos BIGINT,
    vencidos_pero_activos BIGINT,
    finalizados BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        -- Total de contratos
        (SELECT COUNT(*) FROM alquileres)::BIGINT,
        
        -- Realmente activos (activo=true Y no vencidos)
        (SELECT COUNT(*) FROM alquileres 
         WHERE activo = true AND fecha_finalizacion >= CURRENT_DATE)::BIGINT,
        
        -- Vencidos pero marcados como activos (necesitan atención)
        (SELECT COUNT(*) FROM alquileres 
         WHERE activo = true AND fecha_finalizacion < CURRENT_DATE)::BIGINT,
        
        -- Finalizados (activo=false)
        (SELECT COUNT(*) FROM alquileres WHERE activo = false)::BIGINT;
END;
$$ LANGUAGE plpgsql;

-- 4. Función para finalizar automáticamente contratos vencidos (opcional)
CREATE OR REPLACE FUNCTION finalizar_contratos_vencidos()
RETURNS INTEGER AS $$
DECLARE
    contratos_finalizados INTEGER;
BEGIN
    -- Marcar como inactivos los contratos vencidos hace más de X días
    UPDATE alquileres 
    SET activo = false, 
        updated_at = NOW()
    WHERE activo = true 
    AND fecha_finalizacion < CURRENT_DATE - INTERVAL '7 days'; -- 7 días de gracia
    
    GET DIAGNOSTICS contratos_finalizados = ROW_COUNT;
    
    RETURN contratos_finalizados;
END;
$$ LANGUAGE plpgsql;

-- 5. Verificar que todo funciona
SELECT * FROM get_estadisticas_dashboard();
SELECT * FROM get_alquileres_por_estado();
SELECT * FROM vista_propiedades_realmente_disponibles LIMIT 5; 