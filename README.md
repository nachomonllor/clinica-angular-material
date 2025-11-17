# Clínica Online - Sistema de Gestión de Turnos Médicos

Sistema web para la gestión de turnos médicos, desarrollado con Angular (frontend) y NestJS (backend), con PostgreSQL como base de datos.

## Descripción

Clínica Online es una plataforma que permite a pacientes solicitar turnos médicos con especialistas, gestionar sus citas, y acceder a su historial clínico. Los especialistas pueden gestionar su disponibilidad, aceptar o rechazar turnos, y completar historias clínicas. Los administradores tienen acceso a todas las funcionalidades de gestión de usuarios y turnos.

## Pantallas y Secciones

### Públicas (sin autenticación)

1. **Bienvenida** (`/bienvenida`)
   - Pantalla de inicio de la aplicación
   - Muestra información general sobre la clínica
   - Acceso a registro e inicio de sesión

2. **Registro**
   - Selección de tipo de usuario (`/seleccionar-registro`)
   - Registro de Paciente (`/register`)
   - Registro de Especialista (`/register-especialista`)
   - Incluye validación con Google reCAPTCHA

3. **Login** (`/login`)
   - Inicio de sesión unificado para todos los tipos de usuarios
   - Accesos rápidos para pruebas (Admin, Especialista, Paciente)

### Pacientes

1. **Mis Turnos** (`/mis-turnos-paciente`)
   - Listado de turnos solicitados
   - Búsqueda avanzada por:
     - Especialidad, especialista o estado (texto)
     - Datos de historia clínica (altura, peso, temperatura, presión, datos dinámicos)
     - Reseñas y comentarios
   - Acciones:
     - Cancelar turno (con motivo)
     - Ver reseña del especialista
     - Calificar atención (cuando el turno está realizado)

2. **Solicitar Turno** (`/solicitar-turno`)
   - Selección de especialidad (búsqueda por texto)
   - Selección de especialista (búsqueda por texto)
   - Selección de día y horario disponible
   - Muestra solo turnos disponibles para los próximos 15 días

3. **Mi Perfil** (`/mi-perfil`)
   - Visualización de datos personales
   - Información de obra social
   - Subida de imágenes de perfil (2 imágenes)
   - Sección "Historia Clínica":
     - Visualización completa del historial médico
     - Datos fijos (altura, peso, temperatura, presión)
     - Datos dinámicos (genéricos y específicos)
     - Descarga de historia clínica en PDF

### Especialistas

1. **Mis Turnos** (`/mis-turnos-especialista`)
   - Listado de turnos asignados
   - Búsqueda avanzada por:
     - Especialidad o paciente (texto)
     - Datos de historia clínica (altura, peso, temperatura, presión, datos dinámicos)
     - Reseñas y comentarios
   - Acciones:
     - Aceptar turno
     - Rechazar turno (con motivo)
     - Cancelar turno (con motivo)
     - Finalizar turno (con historia clínica completa):
       - Datos fijos: altura, peso, temperatura, presión
       - Datos dinámicos genéricos (máximo 3 pares clave-valor)
       - Datos dinámicos específicos:
         - Control de rango (0-100)
         - Valor numérico
         - Switch Si/No
       - Reseña de la consulta (requerida)
     - Ver reseñas

2. **Mi Perfil** (`/mi-perfil`)
   - Visualización de datos personales
   - Subida de imagen de perfil
   - Sección "Mis horarios":
     - Crear/editar disponibilidades por día de la semana y especialidad
     - Configurar horarios de inicio y fin (intervalos de 15 minutos)
     - Seleccionar duración del turno (15, 30 o 60 minutos)
     - Activar/desactivar disponibilidades
     - Generar slots disponibles para los próximos 15 días
   - Sección "Mis Pacientes":
     - Listado de pacientes atendidos
     - Acceso a historia clínica de cada paciente

### Administradores

1. **Usuarios** (`/admin/users`)
   - Listado de todos los usuarios
   - Crear nuevos usuarios (Paciente, Especialista, Admin)
   - Aprobar/Rechazar usuarios pendientes
   - Cambiar estado de usuarios
   - Descarga de usuarios en Excel
   - Visualización de historia clínica de pacientes

2. **Turnos** (`/admin/turnos`)
   - Listado de todos los turnos de la clínica
   - Búsqueda avanzada por:
     - Especialidad o especialista (texto)
     - Datos de historia clínica (altura, peso, temperatura, presión, datos dinámicos)
     - Reseñas y comentarios
   - Cancelar turnos (con motivo)

3. **Estadísticas** (`/admin/estadisticas`)
   - Reportes y gráficos:
     - Log de ingresos al sistema (filtro por fecha y usuario)
     - Cantidad de turnos por especialidad
     - Cantidad de turnos por día
     - Cantidad de turnos solicitados por médico (filtro por fecha)
     - Cantidad de turnos finalizados por médico (filtro por fecha)
   - Descarga de reportes:
     - Excel (todos los reportes)
     - PDF (todos los reportes)
     - PNG (gráficos como imágenes)
   - Filtros de fecha (desde/hasta)

4. **Solicitar Turno** (`/solicitar-turno`)
   - Misma funcionalidad que para pacientes
   - Permite seleccionar el paciente para el cual se solicita el turno

5. **Mi Perfil** (`/mi-perfil`)
   - Visualización de datos personales
   - Subida de imagen de perfil
   - Botón "Ver Historia Clínica" en lista de usuarios (para pacientes)

## Formas de Acceder

### Acceso por rol

- **Paciente**: Al iniciar sesión, es redirigido a `/mis-turnos-paciente`
- **Especialista**: Al iniciar sesión, es redirigido a `/mis-turnos-especialista`
- **Administrador**: Al iniciar sesión, es redirigido a `/admin/users`

### Rutas protegidas

Todas las rutas (excepto login, registro y bienvenida) están protegidas con:
- `authGuard`: Verifica que el usuario esté autenticado
- `roleGuard`: Verifica que el usuario tenga el rol necesario

### Navegación

- **Navbar**: Aparece cuando el usuario está autenticado, mostrando:
  - Nombre del usuario y su rol
  - Botón "Salir" para cerrar sesión
  - Click en el logo/título redirige al dashboard según el rol

## Funcionalidades Implementadas

### Sprint 1 ✅
- Registro de usuarios (Paciente, Especialista, Admin)
- Inicio de sesión unificado
- Gestión de usuarios (crear, aprobar, rechazar)
- Verificación de email (backend implementado)
- Validación de roles y estados

### Sprint 2 ✅
- Gestión de turnos:
  - Solicitar turnos (Paciente, Admin)
  - Listar mis turnos (Paciente, Especialista)
  - Aceptar/Rechazar/Cancelar turnos
  - Finalizar turnos con historia clínica básica
  - Calificar atención
- Gestión de disponibilidad (Especialistas):
  - Crear/editar disponibilidades
  - Generar slots disponibles
- Filtros sin combobox (búsqueda por texto)
- Selección de fechas sin datepicker
- Google reCAPTCHA en registros

### Sprint 3 ✅
- Historia clínica:
  - Visualización para pacientes (Mi Perfil)
  - Visualización para especialistas (Mis Pacientes)
  - Visualización para administradores (Usuarios)
  - Datos fijos: altura, peso, temperatura, presión
  - Datos dinámicos genéricos (máximo 3 pares clave-valor)
  - Búsqueda mejorada en turnos (incluye datos de historia clínica)
  - Descarga de historia clínica en PDF (con logo de la clínica)
- Descarga de datos de usuarios en Excel (Admin)

### Sprint 4 ✅
- Reportes y estadísticas (Admin):
  - Log de ingresos al sistema
  - Cantidad de turnos por especialidad (gráfico)
  - Cantidad de turnos por día (gráfico)
  - Cantidad de turnos solicitados por médico
  - Cantidad de turnos finalizados por médico
  - Filtros de fecha (desde/hasta)
  - Descarga en Excel, PDF y PNG
- Implementación de Pipes:
  - `StatusLabelPipe` - Etiquetas de estado en español
  - `RoleLabelPipe` - Etiquetas de rol en español
  - `LocalDatePipe` - Formato de fechas según idioma
- Implementación de Directivas:
  - `StatusBadgeDirective` - Badges de estado
  - `ElevateOnHoverDirective` - Efecto hover
  - `AutoFocusDirective` - Auto-focus en elementos

### Sprint 5 ✅
- Datos dinámicos adicionales en historia clínica:
  - Control de rango (0-100)
  - Campo numérico
  - Switch Si/No
- Captcha propio:
  - Directiva `CustomCaptchaDirective` con operaciones matemáticas
  - Integrado en registro de pacientes, especialistas y creación de usuarios (admin)
  - Opción para deshabilitar el captcha
- Animaciones de transición:
  - 6+ animaciones de transición entre componentes
  - Diferentes animaciones según la ruta (slide, scale, bounce, etc.)

### Otras funcionalidades ✅
- Subida de imágenes de perfil:
  - Pacientes: 2 imágenes (imagenUno, imagenDos)
  - Especialistas y Admins: 1 imagen
  - Actualización desde Mi Perfil
  - Almacenamiento local (compatible con S3/R2)
- Envío de emails de verificación (backend implementado con Nodemailer)
- Búsqueda mejorada en turnos (incluye todos los campos de historia clínica)
- Validación mejorada en formularios (mensajes de error visibles)

## Tecnologías

### Frontend
- Angular 19 (standalone components)
- TypeScript
- Signals para reactividad
- HTTP Client para comunicación con backend
- Chart.js para gráficos y estadísticas
- xlsx para generación de Excel
- jspdf para generación de PDF
- Angular Animations para transiciones
- Google reCAPTCHA v2 (opcional)
- Custom Captcha (operaciones matemáticas)

### Backend
- NestJS
- Prisma ORM
- PostgreSQL
- Express Session para autenticación
- Passport.js (Local Strategy)
- Nodemailer para envío de emails
- Multer para manejo de archivos
- Express Static para servir archivos estáticos (frontend en producción)

### Base de Datos
- PostgreSQL (Docker Compose)

## Instalación y Ejecución

### Backend

```bash
cd backend
npm install
# Configurar .env con DATABASE_URL y SESSION_SECRET
npm run prisma:migrate
npm run start:dev
```

### Frontend

```bash
cd frontend
npm install
npm start
```

### Base de Datos

```bash
docker compose up -d postgres
```

## Notas Técnicas

- **Sin combobox**: Todos los filtros usan inputs de texto con autocompletado
- **Sin datepicker**: La selección de fechas usa botones personalizados
- **Sesiones**: El backend usa cookies HTTP-only para sesiones
- **reCAPTCHA**: Google reCAPTCHA v2 (opcional) + Captcha propio con operaciones matemáticas
- **Almacenamiento**: Almacenamiento local de imágenes (compatible con S3/R2)
- **Búsqueda avanzada**: Los filtros de turnos buscan en todos los campos, incluyendo historia clínica
- **Historia clínica**: Datos fijos + datos dinámicos (genéricos y específicos con controles especiales)
- **Deploy**: El backend sirve el frontend en producción (single-service deployment)

## Estado del Proyecto

- ✅ Sprint 1: Completado
- ✅ Sprint 2: Completado
- ✅ Sprint 3: Completado
- ✅ Sprint 4: Completado
- ✅ Sprint 5: Completado
- ⏳ Sprint 6: Pendiente (traducción multi-idioma)

