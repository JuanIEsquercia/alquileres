-- ============================================
-- SCRIPT DE VERIFICACIÓN RLS
-- ============================================
-- Ejecuta esto en Supabase SQL Editor para verificar el estado

-- 1. Verificar si RLS está habilitado en las tablas
SELECT 
    schemaname,
    tablename,
    rowsecurity as "RLS_HABILITADO"
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('inquilinos', 'propiedades', 'indices_actualizacion', 'alquileres')
ORDER BY tablename;

-- 2. Verificar políticas existentes
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies 
WHERE schemaname = 'public'
AND tablename IN ('inquilinos', 'propiedades', 'indices_actualizacion', 'alquileres')
ORDER BY tablename, policyname;

-- 3. Si RLS sigue habilitado, ejecuta este bloque:
-- UNCOMMENT THE LINES BELOW IF RLS IS STILL ENABLED:

/*
-- Forzar deshabilitación de RLS
ALTER TABLE public.inquilinos DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.propiedades DISABLE ROW LEVEL SECURITY; 
ALTER TABLE public.indices_actualizacion DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.alquileres DISABLE ROW LEVEL SECURITY;

-- Eliminar TODAS las políticas existentes
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT policyname, tablename FROM pg_policies WHERE schemaname = 'public') LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON public.' || quote_ident(r.tablename);
    END LOOP;
END $$;
*/

-- 4. Verificar permisos de la tabla
SELECT 
    table_name,
    privilege_type,
    grantee
FROM information_schema.table_privileges 
WHERE table_schema = 'public'
AND table_name IN ('inquilinos', 'propiedades', 'indices_actualizacion', 'alquileres')
ORDER BY table_name, privilege_type; 