# 📋 Lista de Verificación para Despliegue

## ✅ Pre-requisitos

### Cuentas Necesarias
- [ ] Cuenta de Supabase creada
- [ ] Cuenta de Vercel creada  
- [ ] Cuenta de GitHub/GitLab (opcional)

### Software Instalado
- [ ] Node.js 18+ instalado
- [ ] Git instalado
- [ ] Vercel CLI instalado (`npm i -g vercel`)

## 🗄️ Configuración de Base de Datos

### Supabase Setup
- [ ] Proyecto Supabase creado
- [ ] Ejecutado `supabase_schema.sql` en SQL Editor
- [ ] Ejecutado `agregar_plazo_actualizacion.sql` en SQL Editor
- [ ] Ejecutado `supabase_disable_rls.sql` en SQL Editor (desarrollo)
- [ ] Variables obtenidas:
  - [ ] `VITE_SUPABASE_URL`
  - [ ] `VITE_SUPABASE_ANON_KEY`

### Verificación de Tablas
- [ ] Tabla `inquilinos` creada y funcional
- [ ] Tabla `propiedades` creada y funcional
- [ ] Tabla `alquileres` creada y funcional
- [ ] Tabla `indices_actualizacion` con datos iniciales
- [ ] Función `get_estadisticas_dashboard()` creada

## 💻 Configuración Local

### Variables de Entorno
- [ ] Archivo `.env` creado en raíz del proyecto
- [ ] Variables configuradas:
  ```
  VITE_SUPABASE_URL=tu_url_aqui
  VITE_SUPABASE_ANON_KEY=tu_key_aqui
  ```

### Instalación y Pruebas
- [ ] Dependencias instaladas (`npm install`)
- [ ] Aplicación ejecuta localmente (`npm run dev`)
- [ ] Build funciona (`npm run build`)
- [ ] Lint pasa sin errores (`npm run lint`)

### Funcionalidades Probadas
- [ ] Dashboard carga estadísticas correctas
- [ ] Crear propiedades funciona
- [ ] Crear inquilinos funciona
- [ ] Crear alquileres funciona
- [ ] Editar registros funciona
- [ ] Eliminar registros funciona
- [ ] Búsquedas funcionan

## 🚀 Despliegue en Vercel

### Preparación
- [ ] Repositorio Git inicializado
- [ ] Código subido a GitHub/GitLab (opcional)
- [ ] Build local exitoso

### Configuración Vercel
- [ ] Proyecto conectado en Vercel
- [ ] Variables de entorno configuradas en Vercel:
  - [ ] `VITE_SUPABASE_URL`
  - [ ] `VITE_SUPABASE_ANON_KEY`
- [ ] Build settings configurados:
  - Build Command: `npm run build`
  - Output Directory: `dist`
  - Install Command: `npm install`

### Verificación Despliegue
- [ ] Deploy exitoso en Vercel
- [ ] Aplicación accesible en URL de producción
- [ ] Dashboard carga correctamente
- [ ] Conexión a Supabase funcional
- [ ] Formularios funcionan en producción
- [ ] Responsive design verificado

## 🔧 Optimizaciones Aplicadas

### Consultas SQL
- [ ] Queries optimizadas (no `SELECT *`)
- [ ] Consultas en paralelo con `Promise.all()`
- [ ] Función `get_estadisticas_dashboard()` implementada
- [ ] Límites aplicados en consultas grandes
- [ ] Filtros en base de datos, no en frontend

### Performance
- [ ] Bundle optimizado con Vite
- [ ] Imports específicos de lucide-react
- [ ] CSS minificado
- [ ] Tree shaking habilitado
- [ ] Assets optimizados

### Monitoreo
- [ ] Error handling implementado
- [ ] Console logs apropiados para debugging
- [ ] Loading states en todas las consultas
- [ ] Feedback usuario en operaciones

## 📊 Verificación Final

### Funcionalidad Completa
- [ ] CRUD completo en todas las secciones
- [ ] Validaciones frontend y backend
- [ ] Cálculos automáticos funcionando
- [ ] Relaciones entre tablas correctas

### UX/UI
- [ ] Interfaz responsive en mobile
- [ ] Navegación intuitiva
- [ ] Feedback visual en acciones
- [ ] Loading states apropiados
- [ ] Manejo de errores user-friendly

### Seguridad
- [ ] Variables sensibles en .env
- [ ] Validaciones de datos
- [ ] Constraints de base de datos
- [ ] RLS configurado apropiadamente

## 🎯 Comandos Útiles

### Desarrollo
```bash
npm run dev          # Servidor desarrollo
npm run build        # Build producción
npm run preview      # Preview build
npm run lint         # Verificar código
```

### Despliegue
```bash
vercel              # Deploy a Vercel
vercel --prod       # Deploy a producción
vercel logs         # Ver logs de deploy
```

### Git
```bash
git add .
git commit -m "feat: sistema completo de gestión de alquileres"
git push origin main
```

## 🐛 Troubleshooting

### Errores Comunes
- [ ] Error RLS: Verificar que `supabase_disable_rls.sql` fue ejecutado
- [ ] Error 500: Verificar variables de entorno en Vercel
- [ ] Build falla: Verificar que `npm run build` funciona localmente
- [ ] Datos no cargan: Verificar conexión a Supabase

### Verificación Logs
- [ ] Browser DevTools sin errores
- [ ] Network tab muestra requests exitosos
- [ ] Vercel Function Logs sin errores
- [ ] Supabase Dashboard sin errores de autenticación

---

## ✅ ¡Completado!

Una vez que todos los ítems estén marcados, tu sistema estará listo para producción.

**URL de producción**: `https://tu-proyecto.vercel.app`

**Próximos pasos**: 
- Agregar autenticación de usuarios
- Implementar sistema de pagos
- Agregar reportes avanzados
- Implementar notificaciones 