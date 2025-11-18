#!/bin/bash
set -e  # Salir si algún comando falla

echo "🔨 Iniciando build..."

# Asegurar que estamos en el directorio correcto
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

echo "📁 Project root: $PROJECT_ROOT"
echo "📁 Current dir: $(pwd)"

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

