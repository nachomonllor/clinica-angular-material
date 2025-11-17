# Plan de Pruebas – Sprint 1

## Objetivo
Validar que el backend cumple con todos los requerimientos del Sprint 1 respecto a modelo de datos, autenticación y administración de usuarios (paciente, especialista, administrador).

## Preparación
1. `docker compose up -d` (levanta Postgres configurado en `docker-compose.yml`).
2. Crear `backend/.env` con:
   ```
   DATABASE_URL=postgresql://postgres:postgres@localhost:5432/clinica?schema=public
   SESSION_SECRET=<clave>
   ```
3. `cd backend && npx prisma migrate dev --name init`.
4. `npm run start:dev`.
5. Tener herramienta para requests (curl/Postman/etc.).

## Casos de Prueba

### 1. Registro de usuarios
| ID | Descripción | Paso a paso | Resultado esperado |
|----|-------------|-------------|--------------------|
| R1 | Registrar paciente | `POST /auth/register` con `role=PATIENT` + datos perfil | Usuario creado, `status=APPROVED`, `emailVerified=false`, token devuelto |
| R2 | Registrar especialista | `POST /auth/register` con `role=SPECIALIST` + especialidades | Usuario `status=PENDING`, perfiles y especialidades creados, token devuelto |
| R3 | Crear admin | (Requiere sesión admin) `POST /admin/users` con `role=ADMIN` | Usuario admin creado, perfil admin asociado |

### 2. Verificación de correo
| ID | Descripción | Paso a paso | Resultado esperado |
|----|-------------|-------------|--------------------|
| V1 | Intento login sin verificar | `POST /auth/login` (paciente no verificado) | 401 + mensaje de verificación requerida |
| V2 | Verificar correo | `POST /auth/verify-email` con token de R1 | `emailVerified=true` |
| V3 | Login tras verificación | `POST /auth/login` (paciente verificado) | Sesión creada, cookie asignada |

### 3. Sesión y logout
| ID | Descripción | Paso a paso | Resultado esperado |
|----|-------------|-------------|--------------------|
| S1 | Obtener sesión activa | Tras V3, `GET /auth/session` | Devuelve datos del usuario logueado |
| S2 | Logout | `POST /auth/logout` | Sesión destruida |
| S3 | Sesión luego de logout | `GET /auth/session` | `user: null` |

### 4. Gestión de especialistas (aprobación)
| ID | Descripción | Paso a paso | Resultado esperado |
|----|-------------|-------------|--------------------|
| E1 | Login especialista pendiente | `POST /auth/login` (usuario R2, sin aprobar) | 401 indicando aprobación pendiente |
| E2 | Aprobar especialista | `PATCH /admin/users/:id/status` → `APPROVED` | `status` actualizado en DB |
| E3 | Login especialista aprobado | `POST /auth/login` tras E2 | Sesión creada |

### 5. Gestión de usuarios por admin
| ID | Descripción | Paso a paso | Resultado esperado |
|----|-------------|-------------|--------------------|
| A1 | Listado general | `GET /admin/users` | Devuelve todos los usuarios con perfiles |
| A2 | Filtros | `GET /admin/users?role=SPECIALIST&status=PENDING` | Solo especialistas pendientes |
| A3 | Búsqueda | `GET /admin/users?search=<texto>` | Filtrado por nombre/apellido/email/dni |
| A4 | Actualización de datos | `PATCH /admin/users/:id` | Modificaciones reflejadas en DB |

### 6. Validaciones negativas
| ID | Descripción | Paso a paso | Resultado esperado |
|----|-------------|-------------|--------------------|
| N1 | Registro paciente sin perfil | `POST /auth/register` sin `paciente` | 400 indicando datos faltantes |
| N2 | Registro especialista sin especialidades | `POST /auth/register` sin array | 400 |
| N3 | Acceso admin sin sesión | `GET /admin/users` sin login | 401 |
| N4 | Acceso admin con rol paciente | Sesión paciente + `GET /admin/users` | 403 por RolesGuard |

### 7. Verificación en base de datos
- Revisar tablas `users`, `paciente_profiles`, `especialista_profiles`, `admin_profiles`, `especialidades`, `especialista_especialidad`, `email_verification_token`.
- Confirmar integridad de relaciones 1-1 y referencias cruzadas.
- Validar que los tokens usados se marcan con `usedAt`.

## Registro de resultados
Para cada caso, documentar:
- Request (payload, headers relevantes).
- Response (status code y body).
- Estado final en la base (consulta específica si aplica).
- Marcar como **OK** o **Falla** y registrar evidencias (capturas/logs).

