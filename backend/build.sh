#!/bin/bash
set -e  # Salir si algún comando falla

echo "🔨 Iniciando build..."

# Railway ejecuta desde /app cuando Root Directory = backend
# Necesitamos ir a la raíz del repo para acceder a frontend/
CURRENT_DIR="$(pwd)"
echo "📁 Current dir: $CURRENT_DIR"

# Si estamos en /app (backend/), ir a la raíz
if [ "$CURRENT_DIR" = "/app" ] || [ "$(basename "$CURRENT_DIR")" = "backend" ]; then
  echo "📁 Detectado Root Directory = backend, subiendo a la raíz..."
  cd .. || {
    echo "❌ Error: No se pudo acceder al directorio padre"
    exit 1
  }
fi

PROJECT_ROOT="$(pwd)"
echo "📁 Project root: $PROJECT_ROOT"

# Verificar que existen los directorios
if [ ! -d "backend" ]; then
  echo "❌ Error: No se encontró el directorio backend/"
  exit 1
fi

if [ ! -d "frontend" ]; then
  echo "❌ Error: No se encontró el directorio frontend/"
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

# Backend: Prisma y compilar
echo "🔨 Configurando Prisma..."
cd "$PROJECT_ROOT/backend" || exit 1
npx prisma generate
npx prisma migrate deploy

echo "🔨 Compilando backend..."
npm run build

echo "✅ Build completado exitosamente!"

