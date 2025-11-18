# Railway - Deploy Frontend + Backend

## 📋 Prerequisitos

Ya deberías tener el backend funcionando con:
- ✅ Root Directory: `backend`
- ✅ PostgreSQL configurado
- ✅ Variables de entorno configuradas
- ✅ Build Command funcionando

## ✅ PASO 1: Cambiar Root Directory

1. En Railway, click en el servicio backend
2. Click en **"Settings"** (pestaña)
3. Buscar **"Root Directory"**
4. Cambiar de `backend` a `.` (punto - raíz del repositorio)
5. Guardar

**⚠️ IMPORTANTE**: Esto permite acceder tanto a `backend/` como a `frontend/` durante el build

---

## ✅ PASO 2: Actualizar Build Command

1. En **"Settings"** del servicio backend
2. Buscar **"Build Command"**
3. Cambiar a:

```bash
cd backend && npm install && npx prisma generate && npm run build && cd ../frontend && npm install && npm run build -- --configuration production
```

**Explicación:**
- `cd backend && npm install`: Instala dependencias del backend
- `npx prisma generate`: Genera el cliente de Prisma (no requiere DB)
- `npm run build`: Compila el backend NestJS
- `cd ../frontend && npm install`: Instala dependencias del frontend
- `npm run build -- --configuration production`: Compila el frontend Angular en producción

4. Guardar

---

## ✅ PASO 3: Actualizar Start Command

1. En **"Settings"** del servicio backend
2. Buscar **"Start Command"**
3. Cambiar a:

```bash
cd backend && npx prisma migrate deploy && npm run start:prod
```

**Explicación:**
- `cd backend`: Entra al directorio del backend
- `npx prisma migrate deploy`: Ejecuta migraciones (en runtime, cuando la DB está disponible)
- `npm run start:prod`: Inicia el servidor NestJS

4. Guardar

---

## ✅ PASO 4: Actualizar Variable FRONTEND_DIST_PATH

1. Ir a **"Variables"** del servicio backend
2. Buscar o agregar la variable `FRONTEND_DIST_PATH`
3. Valor: `frontend/dist/frontend/browser`

**Explicación:**
- Como el Root Directory ahora es `.` (raíz), el path relativo es `frontend/dist/frontend/browser`
- Esto le dice al backend dónde encontrar los archivos compilados del frontend

4. Guardar

---

## ✅ PASO 5: Verificar Variables de Entorno

Asegurarse de que estas variables estén configuradas:

```env
NODE_ENV=production
PORT=3000
DATABASE_URL=${{Postgres.DATABASE_URL}}
SESSION_SECRET=tu-secret-aleatorio
FRONTEND_DIST_PATH=frontend/dist/frontend/browser
FRONTEND_URL=https://clinica-angular-material-production.up.railway.app
BACKEND_URL=https://clinica-angular-material-production.up.railway.app
STORAGE_TYPE=local
UPLOADS_DIR=/tmp/uploads
STORAGE_BASE_URL=https://clinica-angular-material-production.up.railway.app/uploads
```

---

## ✅ PASO 6: Verificar el Deploy

1. Railway debería hacer un nuevo deploy automáticamente
2. Esperar a que termine el build (puede tardar varios minutos)
3. Verificar los logs para confirmar:
   - ✅ Build del backend exitoso
   - ✅ Build del frontend exitoso
   - ✅ Migraciones ejecutadas
   - ✅ Servidor iniciado
   - ✅ Frontend encontrado y siendo servido

---

## ✅ PASO 7: Probar la Aplicación

1. Abrir la URL de Railway en el navegador: `https://clinica-angular-material-production.up.railway.app`
2. Deberías ver la aplicación Angular funcionando
3. Probar login, navegación, etc.

---

## 🔧 Troubleshooting

### Error: "Cannot find module" durante el build
- Verificar que el Root Directory sea `.` (punto)
- Verificar que los comandos `cd` estén correctos

### Error: "Frontend no encontrado"
- Verificar que `FRONTEND_DIST_PATH=frontend/dist/frontend/browser`
- Verificar que el build del frontend se completó correctamente
- Revisar los logs del build

### Error: "404 Not Found" en rutas del frontend
- Verificar que el build del frontend generó `index.html`
- Verificar que `FRONTEND_DIST_PATH` apunta al directorio correcto

### Build muy lento
- Es normal, el build del frontend Angular puede tardar varios minutos
- Railway tiene límites de tiempo, pero debería ser suficiente

---

## 📝 Notas Importantes

- El frontend se compila durante el build, no en runtime
- El backend sirve el frontend compilado como archivos estáticos
- Todas las rutas del frontend pasan por el backend (SPA routing)
- Las rutas de API (`/auth/*`, `/admin/*`, etc.) se manejan antes del frontend

---

## ✅ Siguiente Paso

Una vez que funcione, puedes probar:
- Login de usuarios
- Navegación entre páginas
- Funcionalidades completas de la aplicación
- Subir imágenes de perfil (se guardarán en `/tmp/uploads` en Railway, temporal)

