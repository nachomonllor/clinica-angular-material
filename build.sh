#!/bin/bash
set -e  # Salir si algún comando falla

echo "🔨 Iniciando build..."

# Railway ejecuta desde la raíz del repo cuando Root Directory = .
PROJECT_ROOT="$(pwd)"
echo "📁 Project root: $PROJECT_ROOT"
echo "📁 Current dir: $(pwd)"

# Verificar que existen los directorios
if [ ! -d "backend" ]; then
  echo "❌ Error: No se encontró el directorio backend/"
  echo "📁 Directorios disponibles:"
  ls -la
  exit 1
fi

if [ ! -d "frontend" ]; then
  echo "❌ Error: No se encontró el directorio frontend/"
  echo "📁 Directorios disponibles:"
  ls -la
  exit 1
fi

# Backend: instalar dependencias
echo "📦 Instalando dependencias del backend..."
cd "$PROJECT_ROOT/backend" || exit 1
npm install

# Frontend: instalar y compilar
echo "📦 Instalando dependencias del frontend..."
cd "$PROJECT_ROOT/frontend" || exit 1
npm install

echo "🔨 Compilando frontend..."
npm run build -- --configuration production

# Backend: Prisma generate y compilar
echo "🔨 Configurando Prisma (solo generate, migraciones se ejecutan en runtime)..."
cd "$PROJECT_ROOT/backend" || exit 1
npx prisma generate

echo "🔨 Compilando backend..."
npm run build

echo "ℹ️  Nota: Las migraciones de Prisma se ejecutarán en el Start Command (runtime)"

echo "✅ Build completado exitosamente!"

