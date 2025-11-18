# Pasos para Configurar Railway - Orden Exacto

## ✅ PASO 1: Root Directory

1. En Railway, click en tu servicio (backend)
2. Click en **"Settings"** (pestaña)
3. Buscar **"Root Directory"**
4. Escribir: `.` (punto - raíz del repositorio)
5. Guardar

**⚠️ IMPORTANTE**: Debe ser `.` (punto) para que el script pueda acceder tanto a `backend/` como a `frontend/`

---

## ✅ PASO 2: Agregar PostgreSQL

1. En Railway, click en **"+ New"** (botón verde)
2. Seleccionar **"Database"**
3. Seleccionar **"PostgreSQL"**
4. ✅ Railway crea la DB automáticamente
5. **IMPORTANTE**: Railway crea un servicio PostgreSQL separado, pero NO conecta automáticamente

### Conectar PostgreSQL al Backend:

**Opción A: Referencia (Recomendado)**
1. Ir al servicio **Backend** → **"Variables"**
2. Click en **"+ New Variable"** o **"+ Add Variable"**
3. Nombre: `DATABASE_URL`
4. Valor: `${{Postgres.DATABASE_URL}}` (o `${{TuNombrePostgres.DATABASE_URL}}`)
5. Guardar

**Opción B: Copiar directamente**
1. Ir al servicio **PostgreSQL** → **"Variables"**
2. Copiar el valor de `DATABASE_URL`
3. Ir al servicio **Backend** → **"Variables"**
4. Agregar variable:
   - Nombre: `DATABASE_URL`
   - Valor: (pegar lo que copiaste)
5. Guardar

---

## ✅ PASO 3: Build Command

1. En el servicio backend, click en **"Settings"**
2. Buscar **"Build Command"**
3. Pegar este comando:

**Opción A: Script de build (Recomendado)**
```bash
bash build.sh
```

**⚠️ IMPORTANTE**: El script `build.sh` está en la raíz del repositorio

**Opción B: Comando directo (si el script no funciona)**
```bash
npm install && cd ../frontend && npm install && npm run build -- --configuration production && cd ../backend && npx prisma generate && npx prisma migrate deploy && npm run build
```

**Importante sobre las migraciones:**
- `prisma migrate deploy` solo ejecuta migraciones que aún no se aplicaron
- NO borra datos existentes
- Solo crea/modifica tablas según las migraciones nuevas
- La base de datos es persistente en Railway (los datos se mantienen entre deploys)

4. Guardar

---

## ✅ PASO 4: Start Command

1. En **"Settings"** del servicio backend
2. Buscar **"Start Command"**
3. Escribir: `npm start` (o `cd backend && npm run start:prod`)
4. Guardar

**⚠️ IMPORTANTE**: Como el Root Directory es `.` (raíz), el `package.json` raíz tiene el script `start` configurado

---

## ✅ PASO 5: Variables de Entorno

1. Click en **"Variables"** (pestaña del servicio backend)
2. Agregar estas variables (una por una o importar):

```env
NODE_ENV=production
PORT=3000
SESSION_SECRET=GENERAR-UNO-ALEATORIO
FRONTEND_DIST_PATH=../frontend/dist/frontend/browser
FRONTEND_URL=https://placeholder.up.railway.app
BACKEND_URL=https://placeholder.up.railway.app
STORAGE_TYPE=local
UPLOADS_DIR=/tmp/uploads
STORAGE_BASE_URL=https://placeholder.up.railway.app/uploads
```

**Para SESSION_SECRET**: Puedes usar cualquier string aleatorio, por ejemplo:
- `mi-secreto-super-seguro-2025`
- O generar uno con: `openssl rand -hex 32`

**Para FRONTEND_URL y BACKEND_URL**: Por ahora usa un placeholder, lo actualizaremos después.

---

## ✅ PASO 6: Generar Domain Público

1. En el servicio backend, click en **"Settings"**
2. Buscar **"Domains"** o **"Generate Domain"**
3. Click en **"Generate Domain"**
4. Copiar la URL que te da (ejemplo: `clinica-production.up.railway.app`)

---

## ✅ PASO 7: Actualizar URLs

1. Ir a **"Variables"** del servicio backend
2. Actualizar estas variables con la URL real que copiaste:
   - `FRONTEND_URL=https://clinica-angular-material-production.up.railway.app`
   - `BACKEND_URL=https://clinica-angular-material-production.up.railway.app`
   - `STORAGE_BASE_URL=https://clinica-angular-material-production.up.railway.app/uploads`
3. Guardar
4. Railway redeployará automáticamente con las nuevas URLs

---

## ✅ PASO 8: Verificar el Deploy

1. Esperar a que termine el deploy (ver en "Deployments")
2. Abrir la URL pública en el navegador
3. Deberías ver tu aplicación Angular funcionando

---

## 🔍 Si algo falla

Ver los logs en Railway:
1. Click en el servicio backend
2. Click en **"Deployments"**
3. Click en el deployment más reciente
4. Ver **"Logs"** para ver qué falló

