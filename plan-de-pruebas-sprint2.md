# Plan de Pruebas – Sprint 2 (Turnos y Disponibilidad)

## Objetivo
Verificar que las nuevas funcionalidades del Sprint 2 (gestión de disponibilidades, generación de slots, solicitud y administración de turnos con acciones según rol) cumplen la consigna funcional y de datos.

## Preparación
1. `docker compose up -d` (Postgres activo).
2. `cd backend && npm run start:dev`.
3. Usuarios mínimos:
   - Admin aprobado (ej. `laura.perez@example.com`).
   - Paciente verificado (`ana.gomez@example.com`).
   - Especialista aprobado con al menos una especialidad (`juan.lopez@example.com`).
4. Contar con su sesión (cookies) o token según corresponda.

## Casos de Prueba

### A. Disponibilidades
| ID | Descripción | Pasos | Resultado Esperado |
|----|-------------|-------|--------------------|
| A1 | Crear disponibilidad base | `POST /availability` (admin o especialista) con `dayOfWeek`, `startMinute`, `endMinute`, `duration` | 201 + registro activo asociado al especialista/especialidad |
| A2 | Validaciones de horario | Intentar crear con `startMinute >= endMinute` o no múltiplos de 5 | 400 con mensaje de error |
| A3 | Listar plantillas | `GET /availability?especialistaId=...` | Devuelve solo las activas filtradas |
| A4 | Actualizar disponibilidad | `PATCH /availability/:id` | Cambios reflejados en respuesta |
| A5 | Desactivar disponibilidad | `DELETE /availability/:id` | Campo `active=false`; ya no se usa para generar slots |

### B. Generación de slots
| ID | Descripción | Pasos | Resultado |
|----|-------------|-------|----------|
| B1 | Generar slots por primera vez | `POST /availability/:id/generate-slots` para cada disponibilidad | Respuesta `{ created: N }`; slots `FREE` creados dentro de los próximos 15 días |
| B2 | Intentar generar sin disponibilidad activa | Especialista sin plantillas → endpoint | 400 con mensaje “no posee disponibilidades activas” |
| B3 | Generar slots nuevamente | Ejecutar de nuevo, deben agregarse solo días posteriores sin duplicar existentes | `created` = cantidad de días nuevos; slots previos intactos |

### C. Consulta de slots
| ID | Descripción | Pasos | Resultado |
|----|-------------|-------|----------|
| C1 | Listar slots libres | `GET /slots?especialistaId=...&status=FREE` | Devuelve lista ordenada por `startAt` |
| C2 | Filtrar por especialidad y rango | `GET /slots?especialidadId=...&dateFrom=...&dateTo=...` | Solo slots del rango solicitado |

### D. Creación de turnos
| ID | Descripción | Pasos | Resultado |
|----|-------------|-------|----------|
| D1 | Paciente reserva turno | `POST /appointments` con `slotId` libre usando sesión paciente | Turno `status=PENDING`, slot pasa a `RESERVED`, `AppointmentHistory` registra acción |
| D2 | Admin carga turno para paciente | `POST /appointments` como admin indicando `pacienteId` | Turno `status=ACCEPTED`, `acceptedAt` seteado |
| D3 | Intentar reservar slot ya tomado | Repetir D1 con mismo `slotId` | 400 “turno ya fue reservado” |

### E. Listados
| ID | Descripción | Pasos | Resultado |
|----|-------------|-------|----------|
| E1 | Mis turnos (paciente) | `GET /appointments/me` con sesión paciente | Lista solo sus turnos; filtros por `especialidadId`, `status` y `search` funcionando |
| E2 | Mis turnos (especialista) | `GET /appointments/me` con sesión especialista | Lista solo turnos donde es titular; filtros por paciente y especialidad |
| E3 | Turnos admin | `GET /appointments/admin?status=PENDING` | Devuelve todos los turnos de la clínica según filtros |

### F. Acciones sobre turnos
| ID | Descripción | Pasos | Resultado |
|----|-------------|-------|----------|
| F1 | Paciente cancela turno pendiente | `PATCH /appointments/:id/cancel` (paciente dueño) | Estado → `CANCELLED`, `cancelReason` guardado, slot → `CANCELLED` |
| F2 | Paciente intenta cancelar turno ajeno o ya aceptado | Usar otro paciente/situación | 403 (sin permiso) o 400 según corresponda |
| F3 | Especialista acepta turno pendiente | `PATCH /appointments/:id/accept` | Estado → `ACCEPTED`, `acceptedAt` seteado, `AppointmentHistory` actualizado |
| F4 | Especialista rechaza turno aceptado o pendiente | `PATCH /appointments/:id/reject` con motivo | Estado → `REJECTED`, `rejectReason` guardado |
| F5 | Especialista finaliza turno aceptado | `PATCH /appointments/:id/finalize` con reseña | Estado → `DONE`, `specialistReview` + `completedAt` seteados |
| F6 | Paciente deja comentario tras turno finalizado | `PATCH /appointments/:id/patient-review` | `patientComment` actualizado |
| F7 | Admin cancela turno en cualquier estado | `PATCH /appointments/:id/cancel` con sesión admin | Acción permitida siempre |

### G. Historial
| ID | Descripción | Pasos | Resultado |
|----|-------------|-------|----------|
| G1 | Verificar registros | Consultar `appointment_history` via DB | Cada acción (creación, aceptación, cancelación, etc.) genera fila con `actorId`, `action`, `note` |

## Registro de Resultados
Para cada caso documentar:
- Request (endpoint, payload).
- Response (status code + cuerpo).
- Cambios en BD si aplica (`SELECT * FROM ...`).
- Estado final (OK / Falla) con nota.

## Notas
- Mantener cookies separadas para paciente, especialista y admin para facilitar los casos.
- Usar los IDs de `AppointmentSlot` generados en la sección B para probar las reservas.
- Ante cambios en disponibilidad, regenerar slots para reflejar la nueva agenda.

