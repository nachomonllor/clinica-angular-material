# Plan de Pruebas – Sprint 3 (Historia Clínica y Búsquedas)

## Objetivo
Validar la incorporación de la historia clínica por turno, las nuevas vistas según rol y la búsqueda ampliada sobre los datos de los turnos/medical records.

## Preparación
1. Backend corriendo: `cd backend && npm run start:dev`.
2. Base con usuarios existentes (admin, paciente verificado, especialista aprobado).
3. Haber generado al menos un turno completado para contar con datos previos (puede reutilizarse Sprint 2).
4. Herramienta de requests (`curl`, Postman) y cookies para cada rol (`tmp-pruebas/`).

## Casos de prueba

### A. Finalizar turno con historia clínica
| ID | Descripción | Pasos | Resultado esperado |
|----|-------------|-------|--------------------|
| A1 | Finalizar turno aceptado | `PATCH /appointments/:id/finalize` (especialista) con DTO completo (altura, peso, temp., presión, reseña) | 200; turno `DONE`, `medicalRecord` creado con datos fijos y `extraData` vacío, `AppointmentHistory` registra acción |
| A2 | Campos dinámicos | Finalizar otro turno con `extraData` (1–3 pares clave/valor) | `medicalRecord.extraData` guarda todos los pares y `searchText` combina valores |
| A3 | Validación de reseña | Omitir `specialistReview` | 400 “Debe agregar una reseña” |
| A4 | Validación de extraData | Enviar >3 pares o campos en blanco | 400 con mensaje de validación |

### B. Consulta de historia clínica
| Rol | Endpoint | Pasos | Resultado |
|-----|----------|-------|----------|
| Paciente | `GET /medical-records/me` | Con sesión de paciente | Devuelve sus registros ordenados desc. con info del turno/especialidad |
| Admin | `GET /medical-records/admin/patient/:id` | Paso 1: obtener `patientId` conocido | Devuelve todos los registros del paciente |
| Especialista – lista | `GET /medical-records/specialist/patients` | Sesión especialista | Lista solo pacientes que haya atendido (deduplicados) |
| Especialista – historial | `GET /medical-records/specialist/patient/:id` (paciente atendido) | Debe retornar registros si el especialista lo atendió; si no, 403 |

### C. Búsquedas en “Mis turnos” y “Turnos admin”
| ID | Descripción | Pasos | Resultado |
|----|-------------|-------|----------|
| C1 | Buscar por especialidad | `GET /appointments/me?search=cardio` (paciente) | Filtra turnos con especialidad “Cardiología” |
| C2 | Buscar por datos dinámicos | `GET /appointments/me?search=caries` cuando `extraData` incluye esa clave/valor | Devuelve los turnos cuyo `MedicalRecord.extraData` contiene esa palabra |
| C3 | Buscar por reseñas | `GET /appointments/me?search=excelente` | Coincide con `specialistReview` o `patientComment` |
| C4 | Admin search global | `GET /appointments/admin?search=120/80` | Encuentra turnos cuyo `presion` o `searchText` contenga el término |

### D. Restricciones de acceso
| Caso | Pasos | Resultado |
|------|-------|----------|
| D1 | Especialista intenta ver historia de paciente no atendido | `GET /medical-records/specialist/patient/:id` con `:id` > paciente sin registros | 403 “No tienes historial disponible” |
| D2 | Paciente intenta acceder a `admin` endpoint | `GET /medical-records/admin/patient/:id` con sesión paciente | 403/401 según guard |

### E. Historial y consistencia
| ID | Descripción | Pasos | Resultado |
|----|-------------|-------|----------|
| E1 | Verificar `AppointmentHistory` | `SELECT id, appointmentId, action, actorId FROM "AppointmentHistory"` | Registra transición `DONE` con actor especialista (y `PENDING` al inicio) |
| E2 | Verificar `MedicalRecord` | `SELECT altura, peso, presion, extraData FROM "MedicalRecord"` | Datos coinciden con payload finalizado |

## Evidencias
- Guardar respuestas JSON/errores en `tmp-pruebas/` como en sprints anteriores.
- Capturas/queries SQL para validar `MedicalRecord` y `AppointmentHistory`.

## Notas
- Para exportables (Excel/PDF) aún no hay endpoints; cuando se implementen, agregarlos al plan.
- Ante cada prueba que modifique datos (finalizar turnos, etc.), reutilizar slots generados en Sprint 2 o crear nuevos.

