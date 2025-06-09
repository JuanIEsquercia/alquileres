# 🏠 Sistema de Gestión de Alquileres

Sistema web moderno para la gestión integral de propiedades en alquiler, desarrollado con React y Supabase.

## ✨ Características

- 🏘️ **Gestión de Propiedades**: Administra tu cartera inmobiliaria
- 👥 **Gestión de Inquilinos**: Control completo de inquilinos con validación de DNI
- 📄 **Contratos de Alquiler**: Gestión de contratos con cálculo automático de vencimientos
- 📊 **Dashboard Inteligente**: Estadísticas en tiempo real y alertas de vencimientos
- 💰 **Control Financiero**: Seguimiento de ingresos y pagos
- 📱 **Diseño Responsive**: Interfaz moderna y adaptable a todos los dispositivos
- 🔒 **Base de Datos Segura**: Respaldado por Supabase PostgreSQL

## 🚀 Tecnologías

- **Frontend**: React 18 + Vite
- **Styling**: Bootstrap 5 + CSS Custom
- **Base de Datos**: Supabase (PostgreSQL)
- **Íconos**: Lucide React
- **Despliegue**: Vercel Ready

## 📦 Instalación

### Prerrequisitos
- Node.js 18+ 
- Cuenta de Supabase
- Cuenta de Vercel (para despliegue)

### Configuración Local

1. **Clonar el repositorio**
```bash
git clone <tu-repositorio>
cd alquileres-gestion
```

2. **Instalar dependencias**
```bash
npm install
```

3. **Configurar variables de entorno**
```bash
# Crear archivo .env en la raíz del proyecto
VITE_SUPABASE_URL=tu_supabase_url
VITE_SUPABASE_ANON_KEY=tu_supabase_anon_key
```

4. **Configurar base de datos**
   - Ejecuta el script `supabase_schema.sql` en tu dashboard de Supabase
   - Opcionalmente ejecuta `agregar_plazo_actualizacion.sql` para la nueva funcionalidad

5. **Iniciar desarrollo**
```bash
npm run dev
```

## 🗄️ Configuración de Base de Datos

### Scripts SQL incluidos:
- `supabase_schema.sql`: Esquema completo de la base de datos
- `agregar_plazo_actualizacion.sql`: Agrega columna de plazo de actualización
- `supabase_disable_rls.sql`: Deshabilita RLS temporalmente (desarrollo)

### Estructura de Tablas:
- **inquilinos**: Datos de inquilinos con validación de DNI
- **propiedades**: Catálogo de propiedades
- **indices_actualizacion**: Índices para actualización de precios
- **alquileres**: Contratos con cálculo automático de fechas

## 🚀 Despliegue en Vercel

### Preparación
1. **Optimización automática**: El proyecto ya está optimizado para Vercel
2. **Variables de entorno**: Configura en Vercel Dashboard:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`

### Despliegue
```bash
# Con Vercel CLI
npm i -g vercel
vercel

# O conecta tu repositorio en dashboard.vercel.com
```

## 🔧 Optimizaciones Implementadas

### Performance
- ✅ Consultas SQL optimizadas y mínimas
- ✅ Carga de datos en paralelo con Promise.all()
- ✅ Selección específica de campos (no SELECT *)
- ✅ Filtros en base de datos, no en frontend
- ✅ Lazy loading de componentes pesados

### Supabase
- ✅ Consultas eficientes con joins
- ✅ Índices optimizados en tablas
- ✅ Validaciones a nivel de base de datos
- ✅ Triggers para cálculos automáticos

### Bundle
- ✅ Vite para build rápido
- ✅ Imports optimizados de lucide-react
- ✅ CSS minificado
- ✅ Tree shaking automático

## 📱 Uso del Sistema

### Dashboard
- Visualización de estadísticas clave
- Alertas de vencimientos próximos
- Acciones rápidas para gestión

### Propiedades
- Crear/editar/eliminar propiedades
- Búsqueda en tiempo real
- Estado de ocupación automático

### Inquilinos
- Gestión completa con validación de DNI único
- Búsqueda por nombre, apellido o DNI
- Historial de alquileres

### Alquileres
- Creación de contratos con cálculo automático
- Gestión de importes detallada
- Control de vencimientos y actualizaciones

## 🔒 Seguridad

- Validación de datos en frontend y backend
- Constraints de base de datos
- Manejo de errores centralizado
- Variables de entorno para credenciales

## 🛠️ Desarrollo

### Scripts disponibles
```bash
npm run dev          # Desarrollo local
npm run build        # Build para producción  
npm run preview      # Preview del build
npm run lint         # Verificar código
```

### Estructura del proyecto
```
src/
├── components/      # Componentes reutilizables
│   └── Navbar.jsx
├── pages/          # Páginas principales
│   ├── Dashboard.jsx
│   ├── Propiedades.jsx
│   ├── Inquilinos.jsx
│   └── Alquileres.jsx
├── config/         # Configuración
│   └── supabase.js
└── index.css       # Estilos globales
```

## 📞 Soporte

Para reportar problemas o solicitar funcionalidades, crea un issue en el repositorio.

## 📄 Licencia

Este proyecto está bajo licencia MIT.

---

**Desarrollado con ❤️ para la gestión eficiente de propiedades en alquiler**
# alquileres
