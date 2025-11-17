# Plan Sprint 2 - Frontend Angular

## Resumen
Implementar las funcionalidades de gestión de turnos según la consigna: listado de turnos para paciente/especialista/admin, solicitar turnos, y gestión de disponibilidad horaria para especialistas.

---

## Estructura del Backend (referencia)

### Endpoints disponibles:

1. **Turnos (Appointments)**
   - `POST /appointments` - Crear turno (requiere slotId)
   - `GET /appointments/me` - Listar mis turnos (filtrado por rol automático)
   - `GET /appointments/admin` - Listar todos los turnos (solo ADMIN)
   - `PATCH /appointments/:id/cancel` - Cancelar turno (con nota)
   - `PATCH /appointments/:id/accept` - Aceptar turno (solo SPECIALIST/ADMIN)
   - `PATCH /appointments/:id/reject` - Rechazar turno (solo SPECIALIST/ADMIN, con nota)
   - `PATCH /appointments/:id/finalize` - Finalizar turno (solo SPECIALIST/ADMIN, con datos historia clínica)
   - `PATCH /appointments/:id/patient-review` - Calificar atención (solo PATIENT, con nota)

2. **Slots disponibles**
   - `GET /slots?especialistaId=&especialidadId=&status=FREE&dateFrom=&dateTo=` - Listar slots libres

3. **Disponibilidad (Availability)**
   - `GET /availability?especialistaId=` - Listar disponibilidades del especialista
   - `POST /availability` - Crear disponibilidad (solo SPECIALIST/ADMIN)
   - `PATCH /availability/:id` - Actualizar disponibilidad
   - `POST /availability/:id/generate-slots` - Generar slots desde disponibilidad

---

## Tareas Sprint 2

### 1. Modelos y Servicios Base ✅ COMPLETADO

#### 1.1 Modelos (`frontend/src/app/models/`)
- [x] `appointment.model.ts` - Interface para Appointment ✅
- [x] `slot.model.ts` - Interface para AppointmentSlot ✅
- [x] `availability.model.ts` - Interface para SpecialistAvailability ✅
- [x] `specialty.model.ts` - Interface para Especialidad ✅
- [x] `history-clinic.model.ts` - Los campos de historia clínica están en `appointment.model.ts` como `MedicalRecord` y `MedicalExtraField` ✅

#### 1.2 Servicios (`frontend/src/app/services/`)
- [x] `appointments.service.ts` ✅
  - [x] `getMyAppointments(filters?)` → `GET /appointments/me` ✅
  - [x] `getAdminAppointments(filters?)` → `GET /appointments/admin` ✅
  - [x] `createAppointment(slotId, pacienteId?)` → `POST /appointments` ✅
  - [x] `cancelAppointment(id, note)` → `PATCH /appointments/:id/cancel` ✅
  - [x] `acceptAppointment(id)` → `PATCH /appointments/:id/accept` ✅
  - [x] `rejectAppointment(id, note)` → `PATCH /appointments/:id/reject` ✅
  - [x] `finalizeAppointment(id, data)` → `PATCH /appointments/:id/finalize` ✅
  - [x] `patientReview(id, note)` → `PATCH /appointments/:id/patient-review` ✅
- [x] `slots.service.ts` ✅
  - [x] `getAvailableSlots(filters)` → `GET /slots` ✅
- [x] `availability.service.ts` ✅
  - [x] `getAvailability(especialistaId)` → `GET /availability` ✅
  - [x] `createAvailability(data)` → `POST /availability` ✅
  - [x] `updateAvailability(id, data)` → `PATCH /availability/:id` ✅
  - [x] `generateSlots(availabilityId, days?)` → `POST /availability/:id/generate-slots` ✅

---

### 2. Mis Turnos - Paciente ✅ COMPLETADO

#### 2.1 Componente (`features/turnos/mis-turnos-paciente/`)
- [x] **Listado de turnos** ✅
  - [x] Cards con: Fecha, Hora, Especialidad, Especialista, Estado ✅
  - [x] Mostrar estado con badge/colores (PENDING, ACCEPTED, DONE, CANCELLED, REJECTED) ✅
  - [x] Filtro único (input de texto libre, NO combobox) ✅:
    - [x] Filtrar por: Especialidad, Especialista (texto libre) ✅
    - [x] Implementado con computed signals ✅
- [x] **Acciones disponibles** (según estado) ✅:
  - [x] **Cancelar turno** (visible si: `status !== 'DONE'`) ✅
    - [x] Dialog con campo de texto para comentario (requerido, min 10 caracteres) ✅
    - [x] Llamar a `appointmentsService.cancelAppointment(id, note)` ✅
  - [x] **Ver reseña** (visible si: `specialistReview !== null`) ✅
    - [x] Dialog mostrando `specialistReview` ✅
  - [x] **Completar encuesta** (visible si: `status === 'DONE' && specialistReview !== null`) ✅
    - [x] Navegar a `/encuesta-atencion/:id` (placeholder para Sprint 6) ✅
  - [x] **Calificar Atención** (visible si: `status === 'DONE'`) ✅
    - [x] Dialog con campo de texto para comentario (requerido, min 10 caracteres) ✅
    - [x] Llamar a `appointmentsService.patientReview(id, note)` ✅

---

### 3. Mis Turnos - Especialista ✅ COMPLETADO

#### 3.1 Componente (`features/turnos/mis-turnos-especialista/`)
- [x] **Listado de turnos** ✅
  - [x] Cards con: Fecha, Hora, Especialidad, Paciente, Estado ✅
  - [x] Mostrar estado con badge/colores ✅
  - [x] Filtro único (input de texto libre, NO combobox) ✅:
    - [x] Filtrar por: Especialidad, Paciente (texto libre) ✅
- [x] **Acciones disponibles** (según estado) ✅:
  - [x] **Cancelar turno** (visible si: `status !== 'ACCEPTED' && status !== 'DONE' && status !== 'REJECTED'`) ✅
    - [x] Dialog con comentario requerido ✅
    - [x] Llamar a `appointmentsService.cancelAppointment(id, note)` ✅
  - [x] **Rechazar turno** (visible si: `status !== 'ACCEPTED' && status !== 'DONE' && status !== 'CANCELLED'`) ✅
    - [x] Dialog con comentario requerido ✅
    - [x] Llamar a `appointmentsService.rejectAppointment(id, note)` ✅
  - [x] **Aceptar turno** (visible si: `status !== 'DONE' && status !== 'CANCELLED' && status !== 'REJECTED'`) ✅
    - [x] Botón directo (sin modal) ✅
    - [x] Llamar a `appointmentsService.acceptAppointment(id)` ✅
  - [x] **Finalizar Turno** (visible si: `status === 'ACCEPTED'`) ✅
    - [x] Dialog con formulario de historia clínica ✅:
      - [x] Campos fijos: Altura (cm), Peso (kg), Temperatura (°C), Presión (string, ej: "120/80") ✅
      - [x] Campos dinámicos: Máximo 3 pares clave-valor (texto libre) ✅
      - [x] Campo de reseña/comentario (requerido) ✅
    - [x] Llamar a `appointmentsService.finalizeAppointment(id, { altura, peso, temperatura, presion, extraData[], specialistReview })` ✅
  - [x] **Ver Reseña** (visible si: `specialistReview !== null || patientComment !== null`) ✅
    - [x] Dialog mostrando reseñas disponibles ✅

---

### 4. Turnos - Admin ✅ COMPLETADO

#### 4.1 Componente (`features/admin/turnos-admin/`)
- [x] **Listado de todos los turnos** ✅
  - [x] Cards con: Fecha, Hora, Especialidad, Especialista, Paciente, Estado ✅
  - [x] Filtro único (input de texto libre, NO combobox) ✅:
    - [x] Filtrar por: Especialidad, Especialista (texto libre) ✅
- [x] **Acciones disponibles** ✅:
  - [x] **Cancelar turno** (visible si: `status !== 'ACCEPTED' && status !== 'DONE' && status !== 'REJECTED'`) ✅
    - [x] Dialog con comentario requerido ✅
    - [x] Llamar a `appointmentsService.cancelAppointment(id, note)` ✅

---

### 5. Solicitar Turno ✅ COMPLETADO

#### 5.1 Componente (`features/turnos/solicitar-turno/`)
- [x] **Acceso**: PATIENT y ADMIN ✅
- [x] **Formulario** ✅:
  - [x] **Selección de Especialidad** (input texto libre, NO combobox) ✅
    - [x] Buscar/cargar especialidades desde slots disponibles ✅
    - [x] Usa datalist para autocompletado ✅
  - [x] **Selección de Especialista** (input texto libre, NO combobox) ✅
    - [x] Filtrar especialistas por especialidad seleccionada ✅
    - [x] Cargar desde slots disponibles ✅
    - [x] Usa datalist para autocompletado ✅
  - [x] **Selección de Paciente** (solo si es ADMIN) ✅
    - [x] Input texto libre para buscar/autocompletar pacientes ✅
    - [x] TODO: Implementar carga de pacientes desde `GET /admin/users?role=PATIENT` (actualmente placeholder)
  - [x] **Día del turno** (NO usar datepicker, usar botones personalizados) ✅
    - [x] Mostrar solo días disponibles (próximos 15 días según disponibilidad del especialista) ✅
    - [x] Generar lista de días basado en slots disponibles para ese especialista ✅
    - [x] Botones clickeables con estilos ✅
  - [x] **Horario del turno** ✅
    - [x] Mostrar solo horarios disponibles para el día seleccionado ✅
    - [x] Basado en slots libres del especialista para ese día ✅
    - [x] Botones clickeables con estilos ✅
- [x] **Lógica** ✅:
  - [x] Al seleccionar especialidad → cargar especialistas con esa especialidad ✅
  - [x] Al seleccionar especialista → cargar slots disponibles (`GET /slots?especialistaId=X&status=FREE&dateFrom=HOY&dateTo=HOY+15dias`) ✅
  - [x] Al seleccionar día → filtrar slots para ese día ✅
  - [x] Al seleccionar horario → tener el `slotId` listo ✅
  - [x] Al submitir → llamar a `appointmentsService.createAppointment(slotId, pacienteId?)` ✅
- [x] **Validaciones** ✅:
  - [x] Todos los campos requeridos ✅
  - [x] Verificar que el slot esté disponible antes de crear el turno ✅

---

### 6. Mi Perfil

#### 6.1 Componente (`features/profile/mi-perfil/`)
- [ ] **Datos básicos del usuario**:
  - Mostrar: Nombre, Apellido, Email, DNI, Edad, Rol
  - Mostrar imágenes de perfil (si existen)
- [ ] **Sección "Mis horarios"** (solo SPECIALIST)
  - Listado de disponibilidades actuales
  - Formulario para crear/editar disponibilidad:
    - Día de la semana (Lunes a Sábado)
    - Especialidad (asociada a la disponibilidad)
    - Hora de inicio (formato HH:MM)
    - Hora de fin (formato HH:MM)
    - Duración del turno (15, 30, 60 minutos)
    - Botón "Activar/Desactivar"
  - Botón "Generar slots" (llama a `POST /availability/:id/generate-slots`)
    - Opcional: pedir cantidad de días (default 15)
- [ ] **Rutas**:
  - `GET /profile` - Obtener datos del perfil actual (puede ser `GET /auth/session` o crear endpoint específico)
  - Usar `AuthService.currentUser` para mostrar datos

---

### 7. Requerimientos mínimos Sprint 2

#### 7.1 Captcha
- [ ] Agregar componente de captcha en registro de pacientes y especialistas
- [ ] Puede ser Google reCAPTCHA o captcha propio (en Sprint 5 se implementa captcha propio)
- [ ] Por ahora: usar captcha de Google o implementación simple propia

#### 7.2 README
- [ ] Crear/actualizar `README.md` con:
  - Descripción de la clínica
  - Listado de pantallas/secciones
  - Formas de acceder a cada sección
  - Contenido de cada sección

---

## Consideraciones técnicas

### Filtros sin combobox
- Usar **input de texto libre** con autocompletado o búsqueda en tiempo real
- Filtrar en el frontend sobre la lista completa cargada desde el backend
- Ejemplo: Input donde el usuario escribe "Cardiología" y se filtra la lista

### NO usar datepicker
- Para "Solicitar Turno", usar:
  - Botones con días disponibles
  - Dropdown personalizado con días
  - Input tipo `date` limitado a días disponibles
  - Lista de cards/botones con días

### Estados de turnos
- `PENDING` - Pendiente (recién creado)
- `ACCEPTED` - Aceptado por especialista
- `DONE` - Finalizado (con historia clínica)
- `CANCELLED` - Cancelado
- `REJECTED` - Rechazado por especialista

---

## Dependencias adicionales necesarias

```json
{
  "dependencies": {
    // Ya tenemos HttpClient en app.config.ts
    // Posiblemente necesitemos:
    // - Dialog/Modal: Crear componentes dialog simples o usar Angular Material
    // - Para autocompletado: Implementación propia o Angular Material Autocomplete
  }
}
```

---

## Orden sugerido de implementación

1. ✅ **Modelos y Servicios** (base para todo) - COMPLETADO
2. ⏳ **Mi Perfil** (especialmente "Mis horarios" para especialistas - necesario para generar slots) - PENDIENTE
3. ✅ **Solicitar Turno** (depende de slots disponibles) - COMPLETADO
4. ✅ **Mis Turnos - Paciente** (depende de turnos creados) - COMPLETADO
5. ✅ **Mis Turnos - Especialista** (depende de turnos creados) - COMPLETADO
6. ✅ **Turnos - Admin** (similar a los anteriores) - COMPLETADO
7. ⏳ **Captcha y README** (requerimientos mínimos) - PENDIENTE

## Estado actual del Sprint 2

### ✅ Completado (5/7 tareas principales)
- ✅ Modelos y Servicios Base
- ✅ Mis Turnos - Paciente
- ✅ Mis Turnos - Especialista  
- ✅ Turnos - Admin
- ✅ Solicitar Turno

### ⏳ Pendiente (2/7 tareas principales)
- ⏳ Mi Perfil con sección "Mis horarios" (especialistas)
- ⏳ Captcha en registros + README actualizado

### 📝 Notas
- Las rutas están configuradas en `app.routes.ts`
- ✅ **Completado**: El componente Solicitar Turno ahora carga pacientes correctamente usando `GET /admin/users?role=PATIENT`
- Todos los componentes usan signals de Angular para reactividad

---

## Notas

- Los slots se generan desde las disponibilidades del especialista
- Un slot libre (`status: FREE`) puede convertirse en un turno (`status: RESERVED`) cuando se crea el appointment
- Las acciones sobre turnos deben validar el estado antes de mostrar botones
- Los filtros deben ser de texto libre, NO combobox (según consigna)
- NO usar datepicker para selección de fechas (según consigna)

