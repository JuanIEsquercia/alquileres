-- ============================================
-- AGREGAR COLUMNA PLAZO DE ACTUALIZACIÓN
-- ============================================
-- Ejecuta este script en Supabase SQL Editor

-- Agregar nueva columna plazo_actualizacion_meses
ALTER TABLE alquileres 
ADD COLUMN plazo_actualizacion_meses INTEGER DEFAULT 12 CHECK (plazo_actualizacion_meses > 0);

-- Agregar comentario para documentar la columna
COMMENT ON COLUMN alquileres.plazo_actualizacion_meses IS 'Plazo en meses para la actualización del precio del alquiler';

-- Verificar que la columna se agregó correctamente
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'alquileres' 
AND table_schema = 'public'
ORDER BY ordinal_position; 