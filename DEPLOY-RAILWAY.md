# Deploy en Railway - Guía Paso a Paso

## 🚀 Preparación Rápida

Sigue estos pasos para deployar tu aplicación en Railway en menos de 10 minutos.

---

## Paso 1: Crear cuenta y conectar GitHub

1. Ir a **https://railway.app**
2. Click en **"Start a New Project"** o **"Login"**
3. Conectar tu cuenta de **GitHub**
4. Autorizar Railway para acceder a tus repositorios

---

## Paso 2: Crear nuevo proyecto

1. Click en **"New Project"**
2. Seleccionar **"Deploy from GitHub repo"**
3. Buscar y seleccionar tu repositorio: `clinica-2025-recur-v2`
4. Click en **"Deploy Now"**

Railway detectará automáticamente que hay un `backend/` con Node.js.

---

## Paso 3: Agregar PostgreSQL

1. En el proyecto, click en **"+ New"** (botón verde)
2. Seleccionar **"Database"**
3. Seleccionar **"PostgreSQL"**
4. Railway creará la base de datos automáticamente
5. Railway agregará automáticamente la variable `DATABASE_URL` a tu backend

**✅ No necesitas configurar nada más para la DB**

---

## Paso 4: Configurar el Backend Service

### 4.1. Ajustar Settings del servicio Backend

En el servicio que Railway creó automáticamente:

1. Click en el servicio (el que dice "backend" o el nombre de tu repo)
2. Click en **"Settings"** tab
3. Configurar:

**Root Directory:**
```
backend
```

**Build Command:**
```bash
npm install && cd ../frontend && npm install && npm run build -- --configuration production && cd ../backend && npm run build
```

**Start Command:**
```bash
npm run start:prod
```

### 4.2. Agregar Variables de Entorno

Click en **"Variables"** tab y agregar estas variables:

```env
# Aplicación
NODE_ENV=production
PORT=3000
SESSION_SECRET=tu-secret-super-aleatorio-aqui-generar-uno

# Frontend (ruta relativa desde backend)
FRONTEND_DIST_PATH=../frontend/dist/frontend/browser

# URLs (se configurarán después del primer deploy)
FRONTEND_URL=https://tu-proyecto.up.railway.app
BACKEND_URL=https://tu-proyecto.up.railway.app

# Email (opcional, configurar después si quieres)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=tu-email@gmail.com
SMTP_PASS=tu-app-password
EMAIL_FROM=Clínica Online <tu-email@gmail.com>

# Almacenamiento
STORAGE_TYPE=local
UPLOADS_DIR=/tmp/uploads
STORAGE_BASE_URL=https://tu-proyecto.up.railway.app/uploads
```

**Notas importantes:**
- `DATABASE_URL` ya está configurado automáticamente por Railway (no lo toques)
- `SESSION_SECRET`: Genera uno aleatorio (puedes usar `openssl rand -hex 32` o cualquier generador)
- `FRONTEND_URL` y `BACKEND_URL`: Actualizarás después del primer deploy con la URL real que te dé Railway

---

## Paso 5: Primera migración de base de datos

Después del primer deploy exitoso:

1. Click en el servicio Backend
2. Click en **"Deployments"** tab
3. Click en el deployment más reciente
4. Click en **"View Logs"** o **"Open Terminal"**
5. Ejecutar:

```bash
npx prisma migrate deploy
```

O puedes agregar esto al build command (después de `npm run build`):

```bash
npm install && cd ../frontend && npm install && npm run build -- --configuration production && cd ../backend && npx prisma migrate deploy && npm run build
```

**Recomendación**: Agregar `npx prisma migrate deploy` al build command para que se ejecute automáticamente en cada deploy.

---

## Paso 6: Obtener la URL pública

1. Click en el servicio Backend
2. Click en **"Settings"** tab
3. Buscar la sección **"Domains"** o **"Public URL"**
4. Click en **"Generate Domain"** (si no hay uno)
5. Copiar la URL (algo como: `tu-proyecto-production.up.railway.app`)

---

## Paso 7: Actualizar URLs en variables de entorno

1. Ir a **"Variables"** tab del servicio Backend
2. Actualizar estas variables con la URL real:

```env
FRONTEND_URL=https://tu-proyecto-production.up.railway.app
BACKEND_URL=https://tu-proyecto-production.up.railway.app
STORAGE_BASE_URL=https://tu-proyecto-production.up.railway.app/uploads
```

3. Railway redeployará automáticamente

---

## Paso 8: Configurar Email (Opcional)

Si quieres que los emails de verificación funcionen:

1. Ir a **https://myaccount.google.com/security**
2. Activar **"Verificación en 2 pasos"** (si no está activada)
3. Ir a **"Contraseñas de aplicaciones"**
4. Crear una nueva contraseña para "Correo"
5. Copiar la contraseña generada (16 caracteres)
6. En Railway, actualizar:

```env
SMTP_USER=tu-email@gmail.com
SMTP_PASS=la-contraseña-de-16-caracteres-que-generaste
```

7. Railway redeployará automáticamente

---

## ✅ Verificar que funciona

Después del deploy completo:

1. **Abrir la URL de Railway** (ej: `https://tu-proyecto-production.up.railway.app`)
2. Deberías ver tu aplicación Angular funcionando
3. **Probar registro** de usuario
4. **Probar login**
5. **Verificar que las rutas funcionan** (navegar por la app)

---

## 🔧 Troubleshooting

### El frontend no se ve / Error 404

**Problema**: El build del frontend no se ejecutó o falló.

**Solución**:
1. Verificar los logs del deploy
2. Verificar que el build command incluye la compilación del frontend
3. Verificar que `FRONTEND_DIST_PATH` apunta al directorio correcto

### Error de base de datos / Migraciones

**Problema**: Las migraciones no se ejecutaron.

**Solución**:
1. Ir a los logs del deploy
2. Ejecutar manualmente: `npx prisma migrate deploy`
3. O agregar `npx prisma migrate deploy` al build command

### Error de CORS

**Problema**: Si ves errores de CORS (aunque no debería pasar con un solo servicio).

**Solución**:
- Verificar que `FRONTEND_URL` y `BACKEND_URL` apuntan a la misma URL
- Con un solo servicio, no debería haber problemas de CORS

### Las rutas del frontend dan 404

**Problema**: El SPA routing no funciona.

**Solución**:
1. Verificar que `NODE_ENV=production`
2. Verificar que el middleware de SPA routing está activo en `main.ts`
3. Verificar los logs del servidor

### No se pueden subir imágenes

**Problema**: Las imágenes no se guardan.

**Solución**:
- En Railway, `/tmp` es temporal (se borra al reiniciar)
- Para un TP está bien (es una limitación conocida)
- En producción real usarías S3 o similar

---

## 📝 Build Command Completo (Recomendado)

Para evitar problemas, usa este build command completo:

```bash
npm install && cd ../frontend && npm install && npm run build -- --configuration production && cd ../backend && npx prisma migrate deploy && npm run build
```

Esto:
1. Instala dependencias del backend
2. Instala dependencias del frontend
3. Compila el frontend
4. Ejecuta migraciones de Prisma
5. Compila el backend

---

## 🎯 Variables de Entorno Mínimas Requeridas

```env
NODE_ENV=production
DATABASE_URL=${{Postgres.DATABASE_URL}}  # Railway lo llena automáticamente
SESSION_SECRET=tu-secret-aleatorio
FRONTEND_DIST_PATH=../frontend/dist/frontend/browser
FRONTEND_URL=https://tu-proyecto.up.railway.app
BACKEND_URL=https://tu-proyecto.up.railway.app
```

**Opcionales (para emails)**:
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=tu-email@gmail.com
SMTP_PASS=tu-app-password
EMAIL_FROM=Clínica Online <tu-email@gmail.com>
```

**Opcionales (para imágenes)**:
```env
STORAGE_TYPE=local
UPLOADS_DIR=/tmp/uploads
STORAGE_BASE_URL=https://tu-proyecto.up.railway.app/uploads
```

---

## 🎉 ¡Listo!

Tu aplicación debería estar funcionando en Railway. 

**URL final**: `https://tu-proyecto-production.up.railway.app`

Si tienes problemas, revisa los logs en Railway o consulta la sección de Troubleshooting.

---

## 📚 Recursos

- **Railway Docs**: https://docs.railway.app
- **Railway Discord**: https://discord.gg/railway
- **Railway Status**: https://status.railway.app

