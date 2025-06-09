#!/bin/bash

# ========================================
# Script de Inicialización del Repositorio
# Sistema de Gestión de Alquileres
# ========================================

echo "🏠 Inicializando repositorio Sistema de Gestión de Alquileres..."

# Verificar si Git está instalado
if ! command -v git &> /dev/null; then
    echo "❌ Git no está instalado. Por favor instala Git primero."
    exit 1
fi

# Verificar si Node.js está instalado
if ! command -v node &> /dev/null; then
    echo "❌ Node.js no está instalado. Por favor instala Node.js 18+ primero."
    exit 1
fi

# Inicializar Git si no está inicializado
if [ ! -d ".git" ]; then
    echo "📦 Inicializando repositorio Git..."
    git init
    echo "✅ Repositorio Git inicializado"
else
    echo "📦 Repositorio Git ya existe"
fi

# Crear o actualizar .gitignore
echo "📝 Configurando .gitignore..."
cat > .gitignore << 'EOF'
# Dependencias
node_modules/
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Archivos de producción
dist/
build/

# Variables de entorno
.env
.env.local
.env.development.local
.env.test.local
.env.production.local

# Logs
logs
*.log

# Cache
.cache/
.vite/
.vercel/

# IDE
.vscode/
.idea/
*.swp
*.swo

# OS
.DS_Store
Thumbs.db

# Archivos temporales
*.tmp
*.temp

# Coverage
coverage/

# ESLint cache
.eslintcache
EOF

echo "✅ .gitignore configurado"

# Verificar e instalar dependencias
echo "📦 Instalando dependencias..."
if [ -f "package-lock.json" ]; then
    npm ci
else
    npm install
fi
echo "✅ Dependencias instaladas"

# Ejecutar verificaciones
echo "🔍 Ejecutando verificaciones..."
npm run lint
echo "✅ Lint completado"

echo "🏗️ Probando build..."
npm run build
echo "✅ Build exitoso"

# Staging inicial
echo "📝 Preparando commit inicial..."
git add .
git status

echo ""
echo "🎉 ¡Repositorio inicializado exitosamente!"
echo ""
echo "📋 Próximos pasos:"
echo "1. Configura tus variables de entorno en .env"
echo "2. Ejecuta los scripts SQL en Supabase"
echo "3. Realiza tu primer commit:"
echo "   git commit -m \"Initial commit: Sistema de Gestión de Alquileres\""
echo "4. Conecta con tu repositorio remoto:"
echo "   git remote add origin <tu-repositorio-url>"
echo "   git push -u origin main"
echo ""
echo "🚀 Para desplegar en Vercel:"
echo "   npm install -g vercel"
echo "   vercel"
echo ""
echo "✨ ¡Listo para desarrollo!" 