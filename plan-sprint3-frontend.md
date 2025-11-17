# Plan Sprint 3 - Frontend Angular

## Resumen
Implementar la visualización de historia clínica para pacientes, especialistas y administradores, mejoras en filtros de turnos, descarga de documentos (Excel/PDF), y animaciones de transición.

---

## Estado del Sprint 2

### ✅ Completado
- Modelos y servicios base
- Mis Turnos - Paciente
- Mis Turnos - Especialista
- Turnos - Admin
- Solicitar Turno
- Mi Perfil con sección "Mis horarios"
- Google reCAPTCHA en registros
- README actualizado

### ⏳ Pendientes del Sprint 2
- ✅ Todo completado
- 📝 Nota: Los pipes y directivas ya están creados (copiados del proyecto anterior)

---

## Pipes y Directivas (ya disponibles del proyecto anterior)

### Pipes
- ✅ `StatusLabelPipe` - Transforma estados de turno a etiquetas en español
- ✅ `RoleLabelPipe` - Transforma roles a etiquetas en español
- ✅ `LocalDatePipe` - Formatea fechas según idioma del localStorage

### Directivas
- ✅ `StatusBadgeDirective` - Aplica clases CSS según estado del turno
- ✅ `ElevateOnHoverDirective` - Eleva sombra al hacer hover
- ✅ `AutoFocusDirective` - Auto-focus en elementos (útil para modales)

---

## Tareas Sprint 3

### 1. Historia Clínica - Visualización

#### 1.1 Endpoints Backend disponibles
- `GET /medical-records/me` - Para pacientes (sus propios registros)
- `GET /medical-records/admin/patient/:patientId` - Para admins (historia de cualquier paciente)
- `GET /medical-records/specialist/patients` - Lista de pacientes atendidos por especialista
- `GET /medical-records/specialist/patient/:patientId` - Historia de paciente para especialista

#### 1.2 Estructura de MedicalRecord (ya definido en modelo)
```typescript
interface MedicalRecord {
  id: string;
  appointmentId: string;
  pacienteId: string;
  especialistaId: number;
  altura: number;
  peso: number;
  temperatura: number;
  presion: string;
  extraData: MedicalExtraField[]; // Hasta 3 campos dinámicos
  searchText: string;
  createdAt: string;
  updatedAt: string;
  appointment: {
    id: string;
    especialidad: { nombre: string };
    specialist: { user: { nombre, apellido } };
    slot: { date, startAt };
  };
  especialista: {
    user: { nombre, apellido };
  };
}
```

#### 1.3 Componentes a crear/actualizar

**1.3.1 Mi Perfil - Paciente** (`features/profile/mi-perfil/`)
- [ ] Agregar sección "Historia Clínica"
- [ ] Listar registros médicos del paciente
- [ ] Mostrar:
  - Fecha de atención
  - Especialidad
  - Especialista
  - Datos fijos (altura, peso, temperatura, presión)
  - Datos dinámicos (extraData)
- [ ] Botón para descargar PDF de historia clínica

**1.3.2 Admin - Usuarios** (`features/admin/admin-users/`)
- [ ] Agregar botón "Ver Historia Clínica" en cada fila de paciente
- [ ] Modal/componente para mostrar historia clínica del paciente seleccionado
- [ ] Mostrar misma información que en Mi Perfil - Paciente
- [ ] Botón para descargar PDF

**1.3.3 Especialista - Mis Pacientes** (nuevo componente: `features/especialista/pacientes/`)
- [ ] Listar pacientes que el especialista haya atendido al menos 1 vez
- [ ] Usar endpoint: `GET /medical-records/specialist/patients`
- [ ] Botón "Ver Historia" para cada paciente
- [ ] Modal/componente para mostrar historia clínica de ese paciente
- [ ] Mostrar solo registros donde el especialista fue el que atendió

#### 1.4 Servicio (`services/medical-records.service.ts`)
- [ ] Crear `MedicalRecordsService`:
  - `getMyRecords()` → `GET /medical-records/me`
  - `getPatientRecords(patientId)` → `GET /medical-records/admin/patient/:patientId`
  - `getSpecialistPatients()` → `GET /medical-records/specialist/patients`
  - `getSpecialistPatientHistory(patientId)` → `GET /medical-records/specialist/patient/:patientId`

---

### 2. Mejoras en Filtros de Turnos

#### 2.1 Mis Turnos - Paciente
- [ ] Mejorar filtro para buscar por:
  - Especialidad
  - Especialista
  - Estado
  - **NUEVO**: Datos de historia clínica (altura, peso, temperatura, presión, datos dinámicos)
  - **NUEVO**: Comentarios/reseñas
- [ ] El backend ya soporta `search` que busca en `searchText` del MedicalRecord
- [ ] Usar el campo `search` en `QueryAppointmentsParams` del servicio

#### 2.2 Mis Turnos - Especialista
- [ ] Mejorar filtro para buscar por:
  - Especialidad
  - Paciente
  - Estado
  - **NUEVO**: Datos de historia clínica (altura, peso, temperatura, presión, datos dinámicos)
  - **NUEVO**: Comentarios/reseñas
- [ ] Usar el campo `search` en `QueryAppointmentsParams` del servicio

---

### 3. Descarga de Documentos

#### 3.1 Excel - Datos de Usuarios (Admin)
- [ ] En `/admin/users`, agregar botón "Descargar Excel"
- [ ] Instalar librería: `xlsx` o `exceljs`
- [ ] Generar archivo Excel con columnas:
  - Nombre
  - Apellido
  - Email
  - DNI
  - Edad
  - Rol
  - Estado
  - Obra Social (si es paciente)
  - Especialidades (si es especialista)
- [ ] Descargar archivo con nombre: `usuarios-${fecha}.xlsx`

#### 3.2 PDF - Historia Clínica (Paciente)
- [ ] En Mi Perfil - Paciente, sección Historia Clínica
- [ ] Instalar librería: `jspdf` o `pdfmake`
- [ ] Generar PDF con:
  - **Logo de la clínica** (imagen o texto)
  - **Título**: "Historia Clínica"
  - **Fecha de emisión**: Fecha actual
  - **Datos del paciente**: Nombre, Apellido, DNI, Email
  - **Listado de registros médicos**:
    - Fecha de atención
    - Especialidad
    - Especialista
    - Datos fijos y dinámicos
- [ ] Descargar archivo con nombre: `historia-clinica-${paciente}-${fecha}.pdf`

---

### 4. Animaciones de Transición

#### 4.1 Requisito mínimo: 2 animaciones
- [ ] Crear animaciones en `app.component.ts` o archivos de animaciones compartidas
- [ ] Aplicar a rutas principales:
  - Opción 1: Fade in/slide desde abajo
  - Opción 2: Slide desde derecha
  - Opción 3: Scale/fade combinado

#### 4.2 Implementación
- [ ] Usar Angular Animations (`@angular/animations`)
- [ ] Crear función `routeAnimations()` o similar
- [ ] Aplicar `[@routeAnimations]` en `router-outlet` de `app.component.html`
- [ ] Configurar `RouteAnimationState` en `app.routes.ts` con `data: { animation: '...' }`

---

## Consideraciones técnicas

### Historia Clínica
- Los registros médicos se crean automáticamente cuando el especialista finaliza un turno (backend ya implementado)
- El backend incluye `searchText` para búsqueda full-text en historia clínica
- Los datos dinámicos están limitados a 3 campos máximo

### Filtros mejorados
- El backend ya soporta `search` parameter que busca en `searchText` del MedicalRecord
- Podemos mejorar el frontend para mostrar sugerencias o hacer búsqueda más intuitiva

### Descarga de documentos
- **Excel**: Considerar usar `xlsx` (más liviano) o `exceljs` (más features)
- **PDF**: Considerar usar `jspdf` (más liviano) o `pdfmake` (más fácil para layouts complejos)
- Para logo de clínica: Podemos usar texto estilizado o una imagen en assets

### Animaciones
- Angular Animations es la forma estándar
- Podemos crear animaciones reutilizables en un archivo separado
- Aplicar solo a transiciones entre rutas principales (no a modales)

---

## Orden sugerido de implementación

1. **Servicio Medical Records** (base para todo)
2. **Historia Clínica - Mi Perfil Paciente** (más simple, solo lectura propia)
3. **Historia Clínica - Admin** (similar, pero con selección de paciente)
4. **Historia Clínica - Especialista Pacientes** (nuevo componente)
5. **Mejoras en Filtros** (usar search del backend)
6. **Descarga Excel** (más simple que PDF)
7. **Descarga PDF** (requiere más diseño)
8. **Animaciones** (al final, no bloqueante)

---

## Dependencias adicionales necesarias

```json
{
  "dependencies": {
    // Para Excel
    "xlsx": "^0.18.5",
    // Para PDF
    "jspdf": "^2.5.1",
    // O alternativamente
    // "exceljs": "^4.4.0",
    // "pdfmake": "^0.2.7"
  }
}
```

---

## Notas

- La historia clínica ya se crea automáticamente cuando el especialista finaliza un turno (backend Sprint 3 completado)
- El backend ya tiene búsqueda full-text implementada en `searchText` del MedicalRecord
- Los datos dinámicos se limitan a 3 campos máximo (ya validado en backend)
- Para el logo de la clínica en PDF, podemos empezar con texto y luego agregar imagen si es necesario

---

## Checklist Sprint 3

### Historia Clínica
- [ ] Servicio MedicalRecordsService
- [ ] Mi Perfil - Paciente: Sección Historia Clínica
- [ ] Admin - Usuarios: Ver historia clínica de pacientes
- [ ] Especialista - Mis Pacientes: Lista y ver historia

### Filtros Mejorados
- [ ] Mis Turnos - Paciente: Búsqueda por historia clínica
- [ ] Mis Turnos - Especialista: Búsqueda por historia clínica

### Descarga de Documentos
- [ ] Excel - Usuarios (Admin)
- [ ] PDF - Historia Clínica (Paciente)

### Animaciones
- [ ] Al menos 2 animaciones de transición entre componentes

### Pipes y Directivas (ya disponibles)
- ✅ StatusLabelPipe
- ✅ RoleLabelPipe
- ✅ LocalDatePipe
- ✅ StatusBadgeDirective
- ✅ ElevateOnHoverDirective
- ✅ AutoFocusDirective

