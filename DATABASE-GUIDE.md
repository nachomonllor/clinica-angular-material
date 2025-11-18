# Guía de Base de Datos - Clínica Online

## 🔍 Verificar el Estado de la Base de Datos

### Opción 1: Endpoint del Backend (Recomendado)

Hay un endpoint especial para administradores que muestra el estado completo de la base de datos:

**URL:** `GET https://clinica-angular-material-production.up.railway.app/admin/db-status`

**Requisitos:**
- Debes estar autenticado como ADMIN
- Usar las credenciales de sesión (cookies)

**Respuesta incluye:**
- Conteo de registros en cada tabla
- Ejemplos de usuarios y especialidades
- Estado de conexión a la base de datos

### Opción 2: Desde el Frontend

1. Iniciar sesión como administrador
2. Ir a la página de administración
3. El endpoint se puede llamar desde la consola del navegador:
   ```javascript
   fetch('https://clinica-angular-material-production.up.railway.app/admin/db-status', {
     credentials: 'include'
   }).then(r => r.json()).then(console.log)
   ```

---

## 📊 Verificar Tablas Creadas

Las migraciones deberían haber creado estas tablas:
- `User` - Usuarios del sistema
- `PacienteProfile` - Perfiles de pacientes
- `EspecialistaProfile` - Perfiles de especialistas
- `AdminProfile` - Perfiles de administradores
- `Especialidad` - Especialidades médicas
- `EspecialistaEspecialidad` - Relación especialista-especialidad
- `SpecialistAvailability` - Disponibilidades de especialistas
- `AppointmentSlot` - Slots de turnos
- `Appointment` - Turnos
- `AppointmentHistory` - Historial de turnos
- `MedicalRecord` - Registros médicos
- `EmailVerificationToken` - Tokens de verificación de email
- `LoginLog` - Logs de ingresos

---

## 🌱 Agregar Datos Básicos (Seed)

### Opción 1: Script de Seed (Recomendado)

El proyecto incluye un script de seed que agrega:
- Especialidades básicas (Clínica Médica, Pediatría, Cardiología, etc.)
- Usuario admin de prueba
- Usuario especialista de prueba
- Usuario paciente de prueba

**Ejecutar el seed:**

**Localmente:**
```bash
cd backend
npm run prisma:seed
```

**En Railway (mediante Railway CLI o conexión directa):**
1. Instalar Railway CLI: `npm i -g @railway/cli`
2. Conectarse al proyecto: `railway link`
3. Ejecutar el seed: `railway run npm run prisma:seed`

**O conectarse directamente a la DB:**
1. Obtener `DATABASE_URL` desde Railway (Variables)
2. Configurarla localmente:
   ```bash
   export DATABASE_URL="postgresql://..."
   cd backend
   npm run prisma:seed
   ```

**Usuarios creados por el seed:**
- **Admin:** `admin@clinica.com` / `admin123`
- **Especialista:** `especialista@clinica.com` / `especialista123`
- **Paciente:** `paciente@clinica.com` / `paciente123`

---

## ➕ Agregar Datos Manualmente

### Opción 2: Usar el Frontend

1. **Crear usuarios:**
   - Iniciar sesión como admin
   - Ir a "Usuarios" → "Crear nuevo usuario"
   - Completar el formulario y crear

2. **Crear especialidades:**
   - Las especialidades se crean automáticamente cuando un especialista se registra con una especialidad nueva
   - O pueden crearse manualmente en la base de datos

3. **Crear turnos:**
   - Un especialista debe crear disponibilidades primero
   - Luego generar slots disponibles
   - Un paciente puede solicitar turnos desde el frontend

---

## 🗄️ Usar Prisma Studio (GUI para la Base de Datos)

Prisma Studio es una interfaz visual para explorar y editar la base de datos:

**Localmente conectado a Railway:**

1. Obtener `DATABASE_URL` desde Railway (Variables)
2. Configurarla localmente:
   ```bash
   export DATABASE_URL="postgresql://..."
   cd backend
   npx prisma studio
   ```
3. Se abrirá en el navegador: `http://localhost:5555`

**Desde Railway (no disponible directamente):**
- Prisma Studio necesita ejecutarse localmente, pero puede conectarse a la DB de Railway

---

## 🔐 Conectarse Directamente a PostgreSQL

### Usar Railway CLI:

```bash
# Instalar Railway CLI
npm i -g @railway/cli

# Conectarse al proyecto
railway link

# Conectarse a PostgreSQL
railway connect postgres
```

### Usar cualquier cliente PostgreSQL:

1. Obtener `DATABASE_URL` desde Railway (Variables del servicio PostgreSQL)
2. Usar un cliente como:
   - **pgAdmin**
   - **DBeaver**
   - **TablePlus**
   - **psql** (línea de comandos)
3. Conectarse con la URL de conexión

---

## 📝 Comandos Útiles de Prisma

```bash
# Ver el estado de las migraciones
npx prisma migrate status

# Ejecutar migraciones pendientes (NO usar en producción sin cuidado)
npx prisma migrate deploy

# Generar el cliente de Prisma
npx prisma generate

# Ver el schema
npx prisma format

# Abrir Prisma Studio
npx prisma studio
```

---

## ⚠️ Importante

- **NO ejecutar `prisma migrate reset` en producción** - esto borra todos los datos
- **Las migraciones en Railway se ejecutan automáticamente** en el Start Command
- **El seed es seguro** - usa `upsert` para no duplicar datos
- **Los usuarios del seed tienen contraseñas conocidas** - cámbialas en producción

---

## 🚀 Próximos Pasos

1. Ejecutar el seed para tener datos de prueba
2. Verificar el estado con el endpoint `/admin/db-status`
3. Probar login con los usuarios creados
4. Crear más datos desde el frontend según necesites

