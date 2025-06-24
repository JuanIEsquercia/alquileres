-- ============================================
-- LIMPIAR TABLAS MANTENIENDO ESTRUCTURA
-- ============================================

-- Desactivar triggers temporalmente para evitar problemas con las restricciones
SET session_replication_role = 'replica';

-- Limpiar tablas en orden correcto (respetando las foreign keys)
DELETE FROM actualizaciones_contrato;
DELETE FROM alquileres;
DELETE FROM inquilinos;
DELETE FROM propiedades;

-- Mantener solo los índices predefinidos en indices_actualizacion
DELETE FROM indices_actualizacion 
WHERE nombre NOT IN ('IPC', 'ICL', 'Casa Propia', 'Fijo');

-- Reiniciar las secuencias si existen
ALTER SEQUENCE IF EXISTS actualizaciones_contrato_id_seq RESTART WITH 1;

-- Reactivar triggers
SET session_replication_role = 'origin';

-- Verificar que las tablas estén vacías
SELECT 'Verificación de tablas vacías:' as mensaje;
SELECT 'actualizaciones_contrato' as tabla, COUNT(*) as registros FROM actualizaciones_contrato;
SELECT 'alquileres' as tabla, COUNT(*) as registros FROM alquileres;
SELECT 'inquilinos' as tabla, COUNT(*) as registros FROM inquilinos;
SELECT 'propiedades' as tabla, COUNT(*) as registros FROM propiedades;
SELECT 'indices_actualizacion' as tabla, COUNT(*) as registros FROM indices_actualizacion; 