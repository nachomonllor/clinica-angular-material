# Railway - Solo Backend (Paso a Paso)

## ✅ PASO 1: Root Directory

1. En Railway, click en tu servicio (backend)
2. Click en **"Settings"** (pestaña)
3. Buscar **"Root Directory"**
4. Escribir: `backend`
5. Guardar

---

## ✅ PASO 2: Agregar PostgreSQL

1. En Railway, click en **"+ New"** (botón verde)
2. Seleccionar **"Database"**
3. Seleccionar **"PostgreSQL"**
4. ✅ Railway crea la DB automáticamente

### Conectar PostgreSQL al Backend:

1. Ir al servicio **Backend** → **"Variables"**
2. Click en **"+ New Variable"** o **"+ Add Variable"**
3. Nombre: `DATABASE_URL`
4. Valor: `${{Postgres.DATABASE_URL}}` (o `${{TuNombrePostgres.DATABASE_URL}}`)
5. Guardar

---

## ✅ PASO 3: Build Command

1. En el servicio backend, click en **"Settings"**
2. Buscar **"Build Command"**
3. Pegar este comando:

```bash
npm install && npx prisma generate && npm run build
```

**Explicación:**
- `npm install`: Instala dependencias del backend
- `npx prisma generate`: Genera el cliente de Prisma (no requiere DB)
- `npm run build`: Compila el backend NestJS

4. Guardar

---

## ✅ PASO 4: Start Command

1. En **"Settings"** del servicio backend
2. Buscar **"Start Command"**
3. Escribir:

```bash
npx prisma migrate deploy && npm run start:prod
```

**Explicación:**
- `npx prisma migrate deploy`: Ejecuta migraciones (en runtime, cuando la DB está disponible)
- `npm run start:prod`: Inicia el servidor NestJS

4. Guardar

---

## ✅ PASO 5: Variables de Entorno

1. Click en **"Variables"** (pestaña del servicio backend)
2. Agregar estas variables (una por una):

```env
NODE_ENV=production
PORT=3000
SESSION_SECRET=tu-secret-aleatorio-aqui
```

**Para generar SESSION_SECRET:**
```bash
openssl rand -hex 32
```

3. Guardar cada una

**NOTA:** `DATABASE_URL` ya la agregaste en el Paso 2.

---

## ✅ PASO 6: Verificar el Deploy

1. Esperar a que Railway termine el build
2. Ver los logs del servicio backend
3. Deberías ver:
   - ✅ Build exitoso
   - ✅ Migraciones ejecutadas
   - ✅ Servidor iniciado en puerto 3000

---

## ✅ PASO 7: Generar Domain Público

1. En el servicio backend, click en **"Settings"**
2. Buscar **"Domains"** o **"Generate Domain"**
3. Click en **"Generate Domain"**
4. Copiar la URL (ejemplo: `backend-production.up.railway.app`)

---

## ✅ PASO 8: Probar el Backend

1. Abrir la URL que te dio Railway en el navegador
2. Si ves un mensaje (ej: "Hello World!" del AppController) o un error de CORS, significa que el backend está funcionando
3. Probar un endpoint simple:
   - `GET https://tu-url.up.railway.app/auth/session`
   - Debería devolver `{"user": null}` (porque no hay sesión)

---

## 🔧 Troubleshooting

### Error: "Can't reach database server"
- Verificar que `DATABASE_URL` esté configurada correctamente
- Verificar que el servicio PostgreSQL esté corriendo
- Verificar la referencia: `${{Postgres.DATABASE_URL}}`

### Error: "Missing script: start:prod"
- Verificar que el Root Directory sea `backend`
- Verificar que el `package.json` de backend tenga el script `start:prod`

### Error: "npm: command not found"
- Verificar que el Root Directory sea `backend`
- Railway debería detectar automáticamente que es un proyecto Node.js

---

## ✅ Siguiente Paso

Una vez que el backend funcione correctamente, podemos agregar el frontend en un servicio separado o configurarlo para que el backend lo sirva.

