# Railway - Deploy Solo Frontend

## 📋 Prerequisitos

Ya deberías tener el backend deployado y funcionando:
- ✅ Backend URL: `https://clinica-angular-material-production.up.railway.app`
- ✅ Backend funcionando correctamente

---

## ✅ PASO 1: Crear Nuevo Servicio en Railway

1. En Railway, click en **"+ New"** (botón verde)
2. Seleccionar **"GitHub Repo"** o **"Empty Project"**
3. Si es nuevo proyecto:
   - Buscar tu repositorio: `clinica-angular-material` (o el que tengas)
   - Seleccionar el repositorio
4. Railway creará un nuevo servicio

---

## ✅ PASO 2: Configurar Root Directory

1. Click en el nuevo servicio (frontend)
2. Click en **"Settings"** (pestaña)
3. Buscar **"Root Directory"**
4. Escribir: `frontend`
5. Guardar

---

## ✅ PASO 3: Configurar Build Command

1. En **"Settings"** del servicio frontend
2. Buscar **"Build Command"**
3. Escribir:

```bash
npm install && npm run build -- --configuration production
```

**Explicación:**
- `npm install`: Instala dependencias del frontend Angular
- `npm run build -- --configuration production`: Compila el frontend en modo producción

4. Guardar

---

## ✅ PASO 4: Configurar Start Command (Servir archivos estáticos)

Para servir el frontend compilado, necesitamos un servidor simple. Railway puede usar `npx` para servir archivos estáticos:

**Opción A: Usar `npx serve` (Recomendado)**
```bash
npx serve -s dist/frontend/browser -l $PORT
```

**Opción B: Usar `npx http-server`**
```bash
npx http-server dist/frontend/browser -p $PORT -c-1
```

**Explicación:**
- `-s`: Modo SPA (Single Page Application) - sirve `index.html` para todas las rutas
- `-l $PORT`: Escucha en el puerto que Railway asigna
- `dist/frontend/browser`: Directorio donde Angular compila el frontend

4. Guardar

---

## ✅ PASO 5: Variables de Entorno

1. Click en **"Variables"** (pestaña del servicio frontend)
2. Agregar estas variables:

```env
NODE_ENV=production
API_BASE_URL=https://clinica-angular-material-production.up.railway.app
```

**⚠️ IMPORTANTE**: 
- `API_BASE_URL` debe apuntar a tu backend deployado
- En desarrollo local, el frontend usa `http://localhost:3000`
- En producción, debe usar la URL de Railway del backend

3. Guardar cada una

---

## ✅ PASO 6: Actualizar api-config.ts (si es necesario)

Si `api-config.ts` no lee variables de entorno correctamente, puedes:

**Opción A: Usar variable de entorno en tiempo de build**
Modificar el build command para inyectar la URL:
```bash
npm install && API_BASE_URL=https://clinica-angular-material-production.up.railway.app npm run build -- --configuration production
```

**Opción B: Modificar api-config.ts para leer de variable de entorno**
Ya está configurado para usar `process.env['NODE_ENV']`, pero Angular necesita que las variables se inyecten en build time.

---

## ✅ PASO 7: Generar Domain Público

1. En el servicio frontend, click en **"Settings"**
2. Buscar **"Domains"** o **"Generate Domain"**
3. Click en **"Generate Domain"**
4. Copiar la URL (ejemplo: `frontend-production.up.railway.app`)

---

## ✅ PASO 8: Verificar el Deploy

1. Railway debería hacer un deploy automáticamente
2. Esperar a que termine el build (puede tardar varios minutos)
3. Verificar los logs para confirmar:
   - ✅ Build del frontend exitoso
   - ✅ Servidor estático iniciado
   - ✅ Escuchando en puerto asignado

---

## ✅ PASO 9: Probar la Aplicación

1. Abrir la URL del frontend en el navegador
2. Deberías ver la aplicación Angular funcionando
3. Probar login, navegación, etc.
4. Verificar que las llamadas a la API apunten al backend correcto

---

## 🔧 Troubleshooting

### Error: "Cannot find module" durante el build
- Verificar que el Root Directory sea `frontend`
- Verificar que `package.json` esté en `frontend/`

### Error: "API_BASE_URL" no funciona
- Verificar que `api-config.ts` esté configurado correctamente
- Verificar que las variables de entorno estén configuradas
- Revisar la consola del navegador para ver las URLs de las peticiones

### Error: "CORS" en el navegador
- Verificar que el backend tenga CORS configurado para aceptar el origen del frontend
- El backend ya tiene `origin: true` en CORS, debería funcionar

### Error: "404" en rutas del frontend
- Verificar que el servidor esté configurado en modo SPA (`-s` flag)
- Verificar que `dist/frontend/browser/index.html` exista

### Build muy lento
- Es normal, el build de Angular puede tardar varios minutos
- Railway tiene límites de tiempo, pero debería ser suficiente

---

## 📝 Notas Importantes

- El frontend se despliega en un servicio separado del backend
- El frontend hace peticiones HTTP al backend usando `API_BASE_URL`
- El backend debe tener CORS configurado para aceptar peticiones del frontend
- Las sesiones y cookies funcionan si ambos servicios están en el mismo dominio o con CORS configurado correctamente

---

## 🔄 Alternativa: Usar Vercel o Netlify

Si Railway da problemas con el frontend, también puedes usar:
- **Vercel**: Deploy automático desde GitHub, muy fácil para Angular
- **Netlify**: Similar a Vercel, también muy fácil

Ambos son gratuitos y muy buenos para frontend estático (SPA).

