## Plan de pruebas Sprint 4 – Reportes y estadísticas (backend)

### 1. Alcance

- **Sprint**: 4  
- **Objetivo**: Validar que el backend:
  - Registre correctamente los **ingresos (logins)** en la tabla `LoginLog`.
  - Exponga los **endpoints de reportes** para el administrador con los filtros indicados.
  - Aplique correctamente la **seguridad** (solo usuarios con rol `ADMIN` pueden acceder a `/admin/reports/...`).
  - Devuelva datos consistentes con la información almacenada en las tablas (`User`, `Appointment`, `LoginLog`, etc.).

### 2. Preparación del entorno

- Backend NestJS levantado:
  - `cd backend`
  - `npm run start:dev`
- Base de datos PostgreSQL levantada (Docker Compose ya configurado).
- Variables de entorno configuradas (`.env` en `backend`):
  - `DATABASE_URL`
  - `SESSION_SECRET`
- Usuarios de prueba creados y verificados:
  - **Admin**: 1 usuario con `role = ADMIN`.
  - **Especialistas**: mínimo 2 especialistas aprobados con turnos generados y finalizados.
  - **Pacientes**: mínimo 2 pacientes con turnos tomados (en diferentes estados).
- Flujos de Sprints 1–3 ya probados (registros, login, agenda, turnos, historias clínicas).

### 3. Datos de prueba sugeridos

- **Usuarios**:
  - `admin1@example.com` – rol `ADMIN`.
  - `esp1@example.com`, `esp2@example.com` – rol `SPECIALIST`.
  - `pac1@example.com`, `pac2@example.com` – rol `PATIENT`.
- **Turnos**:
  - Turnos creados en diferentes días y con diferentes especialidades.
  - Algunos turnos en estado `PENDING`, `ACCEPTED`, `CANCELLED`, `REJECTED`, `DONE`.
  - Varios turnos **finalizados** (`DONE`) por distintos especialistas.
- **Fechas de referencia**:
  - Rango de pruebas, por ejemplo, del `2025-11-01` al `2025-11-30`.

---

### 4. Casos de prueba – Registro de logins (LoginLog)

#### 4.1. Login exitoso registra entrada en LoginLog

- **Precondiciones**:
  - Usuario `admin1@example.com` existente y con password correcto.
- **Pasos**:
  1. Realizar `POST /auth/login` con credenciales válidas de admin.
  2. Repetir el login 2–3 veces (puede incluir cerrar y abrir navegador para regenerar sesión).
  3. Consultar la base de datos: `SELECT * FROM "LoginLog" WHERE "userId" = '<id_admin>';`.
- **Resultado esperado**:
  - Se crean tantos registros en `LoginLog` como logins exitosos se realizaron.
  - Cada registro tiene:
    - `userId` correcto (el del admin).
    - `createdAt` con la fecha/hora aproximada del login.
    - `ip` y `userAgent` no nulos o coherentes con el cliente utilizado.

#### 4.2. Login fallido **no** registra entrada en LoginLog

- **Pasos**:
  1. Realizar `POST /auth/login` con email existente y **password incorrecto**.
  2. Realizar `POST /auth/login` con email inexistente.
  3. Consultar la tabla `LoginLog` para el `userId` de ese usuario.
- **Resultado esperado**:
  - No se crea ningún registro nuevo en `LoginLog` para esos intentos fallidos.

#### 4.3. Login de otros roles (paciente, especialista)

- **Pasos**:
  1. Login exitoso con paciente.
  2. Login exitoso con especialista aprobado.
  3. Consultar `LoginLog` filtrando por cada `userId`.
- **Resultado esperado**:
  - Se registra un `LoginLog` por cada login exitoso, independientemente del rol.

---

### 5. Casos de prueba – Endpoint `/admin/reports/logins`

Ruta: `GET /admin/reports/logins?desde=&hasta=&userId=`

#### 5.1. Acceso como ADMIN sin filtros

- **Pasos**:
  1. Autenticarse como `ADMIN` (guardar cookies).
  2. Hacer `GET /admin/reports/logins` sin query params.
- **Resultado esperado**:
  - Respuesta `200 OK`.
  - Devuelve un array de objetos con:
    - Campos de `LoginLog`: `id`, `userId`, `createdAt`, `ip`, `userAgent`.
    - Objeto `user` embebido con `id`, `nombre`, `apellido`, `email`, `role`.
  - Ordenados por `createdAt` ascendente.

#### 5.2. Filtro por rango de fechas (`desde` / `hasta`)

- **Pasos**:
  1. En DB, identificar logins entre `2025-11-10` y `2025-11-15`.
  2. Llamar a `GET /admin/reports/logins?desde=2025-11-10&hasta=2025-11-15`.
- **Resultado esperado**:
  - Solo aparecen logins cuyo `createdAt` esté dentro del rango.
  - Validar que logins fuera de ese rango no aparezcan.

#### 5.3. Filtro por `userId`

- **Pasos**:
  1. Obtener el `userId` del admin.
  2. Llamar a `GET /admin/reports/logins?userId=<id_admin>`.
- **Resultado esperado**:
  - Solo se devuelven logins asociados a ese usuario.

#### 5.4. Seguridad – Acceso sin login o con rol incorrecto

- **Pasos**:
  1. Llamar a `GET /admin/reports/logins` **sin cookies de sesión**.
  2. Llamar a `GET /admin/reports/logins` con sesión de **PACIENTE**.
  3. Llamar a `GET /admin/reports/logins` con sesión de **SPECIALIST**.
- **Resultado esperado**:
  - En todos los casos, la respuesta **no** debe ser `200`.
  - Esperado: `401` o `403` según implementación de `SessionAuthGuard` + `RolesGuard`.

---

### 6. Casos de prueba – Endpoint `/admin/reports/turnos-por-especialidad`

Ruta: `GET /admin/reports/turnos-por-especialidad?desde=&hasta=`

#### 6.1. Conteo básico por especialidad

- **Precondiciones**:
  - Existen turnos de al menos 2 especialidades distintas.
- **Pasos**:
  1. Autenticarse como ADMIN.
  2. Llamar a `GET /admin/reports/turnos-por-especialidad`.
  3. Comparar manualmente en DB: `SELECT "especialidadId", COUNT(*) FROM "Appointment" GROUP BY "especialidadId";`.
- **Resultado esperado**:
  - El array devuelto debe tener un elemento por cada `especialidadId`.
  - El `_count._all` debe coincidir con el resultado de la consulta manual.

#### 6.2. Filtro por rango de fechas

- **Pasos**:
  1. Identificar en DB cuántos turnos se crearon entre `2025-11-01` y `2025-11-15` por especialidad.
  2. Llamar a `GET /admin/reports/turnos-por-especialidad?desde=2025-11-01&hasta=2025-11-15`.
- **Resultado esperado**:
  - Los conteos por `especialidadId` coinciden con los datos filtrados por `createdAt` en DB.

#### 6.3. Seguridad (igual que 5.4)

- Misma lógica: probar acceso sin login, con paciente, con especialista → no deben poder acceder.

---

### 7. Casos de prueba – Endpoint `/admin/reports/turnos-por-dia`

Ruta: `GET /admin/reports/turnos-por-dia?desde=&hasta=`

#### 7.1. Conteo de turnos por día (sin filtros)

- **Pasos**:
  1. Autenticarse como ADMIN.
  2. Llamar a `GET /admin/reports/turnos-por-dia`.
  3. En DB, hacer una consulta similar:
     - `SELECT DATE("createdAt") AS date, COUNT(*) FROM "Appointment" GROUP BY DATE("createdAt") ORDER BY date;`
- **Resultado esperado**:
  - El array devuelto tiene objetos `{ date, count }`.
  - Cada fila coincide con la consulta manual (mismas fechas, mismos conteos).

#### 7.2. Filtro por rango de fechas

- **Pasos**:
  1. Llamar a `GET /admin/reports/turnos-por-dia?desde=2025-11-10&hasta=2025-11-20`.
  2. Validar contra la consulta manual filtrando por fechas.
- **Resultado esperado**:
  - Solo se cuentan turnos dentro del rango.

#### 7.3. Seguridad

- Igual criterio que en secciones anteriores (solo ADMIN).

---

### 8. Casos de prueba – Endpoints por médico

Rutas:
- `GET /admin/reports/turnos-por-medico?desde=&hasta=&soloFinalizados=`
- `GET /admin/reports/turnos-finalizados-por-medico?desde=&hasta=`

#### 8.1. Conteo total de turnos por médico

- **Pasos**:
  1. Autenticarse como ADMIN.
  2. Llamar a `GET /admin/reports/turnos-por-medico`.
  3. En DB, agrupar manualmente:
     - `SELECT "especialistaId", COUNT(*) FROM "Appointment" GROUP BY "especialistaId";`
- **Resultado esperado**:
  - Para cada `especialistaId`, `_count._all` coincide con la consulta manual.

#### 8.2. Solo turnos finalizados (`soloFinalizados=true`)

- **Pasos**:
  1. Llamar a `GET /admin/reports/turnos-por-medico?soloFinalizados=true`.
  2. En DB, comparar con:
     - `SELECT "especialistaId", COUNT(*) FROM "Appointment" WHERE "status" = 'DONE' GROUP BY "especialistaId";`
- **Resultado esperado**:
  - Solo se cuentan citas con `status = DONE`.

#### 8.3. Comparación con `/turnos-finalizados-por-medico`

- **Pasos**:
  1. Llamar a `GET /admin/reports/turnos-finalizados-por-medico`.
  2. Llamar a `GET /admin/reports/turnos-por-medico?soloFinalizados=true`.
- **Resultado esperado**:
  - Ambas respuestas deberían ser equivalentes (misma lógica de filtro).

#### 8.4. Filtros de fechas combinados

- **Pasos**:
  1. Identificar turnos `DONE` entre `2025-11-05` y `2025-11-25` por especialista.
  2. Llamar a:
     - `GET /admin/reports/turnos-finalizados-por-medico?desde=2025-11-05&hasta=2025-11-25`.
- **Resultado esperado**:
  - Los conteos por médico coinciden con los datos filtrados en DB.

#### 8.5. Seguridad

- Igual criterio: solo ADMIN debe acceder con éxito.

---

### 9. Casos de prueba negativos y bordes

- **Fechas inválidas en query**:
  - Llamar con `desde=fecha-invalida` o `hasta=2025-13-40`.
  - Comportamiento esperado:
    - Idealmente: error `400` o request rechazado.
    - Si se decide tolerar el formato, documentar el comportamiento observado.
- **Rango sin datos**:
  - Llamar a cualquiera de los reportes con un rango donde no existan turnos/logins.
  - Resultado esperado: respuesta `200 OK` con array vacío.
- **Filtros combinados que no matchean nada**:
  - `userId` inexistente en `/logins`.
  - Especialista sin turnos en rango determinado.
  - Resultado esperado: arrays vacíos, sin errores.

---

### 10. Verificación desde el front (para ayudar al equipo de Angular)

- Verificar que todas las respuestas:
  - Son **JSON** simples, fáciles de consumir.
  - Incluyen los campos necesarios para:
    - Armar tablas de logins.
    - Armar gráficos de barras o líneas (por día, por especialidad, por médico).
    - Poder exportar a Excel/PDF desde el front sin pedir cambios al backend.

Con este plan, si todos los casos pasan, podemos considerar que el **Sprint 4 está completo a nivel backend** y que el front tiene toda la información necesaria para implementar los reportes y las exportaciones.***

