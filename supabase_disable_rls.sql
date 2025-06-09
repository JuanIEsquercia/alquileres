-- ============================================
-- SCRIPT PARA DESHABILITAR RLS TEMPORALMENTE
-- ============================================
-- Ejecuta este script en tu dashboard de Supabase
-- en la sección SQL Editor para deshabilitar 
-- temporalmente las políticas de seguridad

-- Deshabilitar RLS en todas las tablas
ALTER TABLE inquilinos DISABLE ROW LEVEL SECURITY;
ALTER TABLE propiedades DISABLE ROW LEVEL SECURITY;
ALTER TABLE indices_actualizacion DISABLE ROW LEVEL SECURITY;
ALTER TABLE alquileres DISABLE ROW LEVEL SECURITY;

-- Eliminar políticas existentes
DROP POLICY IF EXISTS "Permitir todo a usuarios autenticados" ON inquilinos;
DROP POLICY IF EXISTS "Permitir todo a usuarios autenticados" ON propiedades;
DROP POLICY IF EXISTS "Permitir lectura de índices" ON indices_actualizacion;
DROP POLICY IF EXISTS "Permitir todo a usuarios autenticados" ON alquileres;

-- Verificar que RLS está deshabilitado
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('inquilinos', 'propiedades', 'indices_actualizacion', 'alquileres'); 