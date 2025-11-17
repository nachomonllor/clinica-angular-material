# Plan Sprint 4 - Frontend Angular

## Resumen
Implementar gráficos y estadísticas para administradores, incluyendo visualización de datos, descarga de informes (Excel/PDF), y verificación de pipes y directivas.

---

## Estado del Sprint 3

### ✅ Completado
- Historia Clínica - Visualización (Paciente, Admin, Especialista)
- Mejoras en filtros de turnos con parámetro `search`
- Descarga Excel para usuarios (Admin)
- Descarga PDF para historia clínica (con logo)
- Animaciones de transición entre rutas

---

## Requerimientos Mínimos del Sprint 4

### Pipes (mínimo 3)
- ✅ `StatusLabelPipe` - Transforma estados de turno a etiquetas en español
- ✅ `RoleLabelPipe` - Transforma roles a etiquetas en español
- ✅ `LocalDatePipe` - Formatea fechas según idioma del localStorage
- 🔄 Verificar que funcionen correctamente y usarlos en los componentes de reportes

### Directivas (mínimo 3)
- ✅ `StatusBadgeDirective` - Aplica clases CSS según estado del turno
- ✅ `ElevateOnHoverDirective` - Eleva sombra al hacer hover
- ✅ `AutoFocusDirective` - Auto-focus en elementos (útil para modales)
- 🔄 Verificar que funcionen correctamente y aplicarlas en los componentes de reportes

---

## Endpoints Backend Disponibles

### Base URL: `GET /admin/reports`

1. **Log de Ingresos**
   - `GET /admin/reports/logins?desde=YYYY-MM-DD&hasta=YYYY-MM-DD&userId=...`
   - Retorna: Array de `LoginLog` con `user` incluido
   - Campos: `id`, `userId`, `createdAt`, `ip`, `userAgent`, `user` (nombre, apellido, email, role)

2. **Turnos por Especialidad**
   - `GET /admin/reports/turnos-por-especialidad?desde=YYYY-MM-DD&hasta=YYYY-MM-DD`
   - Retorna: Array de `{ especialidadId: number, _count: { _all: number } }`
   - Nota: Necesitamos hacer join con `Especialidad` para obtener nombres

3. **Turnos por Día**
   - `GET /admin/reports/turnos-por-dia?desde=YYYY-MM-DD&hasta=YYYY-MM-DD`
   - Retorna: Array de `{ date: Date, count: number }`

4. **Turnos por Médico**
   - `GET /admin/reports/turnos-por-medico?desde=YYYY-MM-DD&hasta=YYYY-MM-DD&soloFinalizados=true|false`
   - Retorna: Array de `{ especialistaId: number, _count: { _all: number } }`
   - Nota: Necesitamos hacer join con `EspecialistaProfile` para obtener nombres

5. **Turnos Finalizados por Médico**
   - `GET /admin/reports/turnos-finalizados-por-medico?desde=YYYY-MM-DD&hasta=YYYY-MM-DD`
   - Retorna: Array de `{ especialistaId: number, _count: { _all: number } }`
   - Similar al anterior pero solo con `status: DONE`

---

## Tareas Sprint 4

### 1. Crear Servicio de Reportes

#### 1.1 `ReportsService`
- [ ] Crear `frontend/src/app/services/reports.service.ts`
- [ ] Métodos para cada endpoint:
  - `getLogins(params?: { desde?: string, hasta?: string, userId?: string })`
  - `getTurnosPorEspecialidad(params?: { desde?: string, hasta?: string })`
  - `getTurnosPorDia(params?: { desde?: string, hasta?: string })`
  - `getTurnosPorMedico(params?: { desde?: string, hasta?: string, soloFinalizados?: boolean })`
  - `getTurnosFinalizadosPorMedico(params?: { desde?: string, hasta?: string })`
- [ ] Usar `HttpClient` con `withCredentials: true`

#### 1.2 Modelos/Interfaces
- [ ] Crear `frontend/src/app/models/report.model.ts`
- [ ] Interfaces:
  - `LoginLog` (con `user` incluido)
  - `TurnosPorEspecialidad`
  - `TurnosPorDia`
  - `TurnosPorMedico`
  - `QueryReportParams` (para filtros de fecha)

---

### 2. Componente de Estadísticas (Admin)

#### 2.1 Ruta
- [ ] Agregar ruta `/admin/estadisticas` en `app.routes.ts`
- [ ] Proteger con `authGuard` y `roleGuard(["ADMIN"])`

#### 2.2 Componente Principal
- [ ] Crear `features/admin/estadisticas/estadisticas.component.ts`
- [ ] Sección con pestañas o tabs:
  1. Log de Ingresos
  2. Turnos por Especialidad
  3. Turnos por Día
  4. Turnos por Médico
  5. Turnos Finalizados por Médico

#### 2.3 Filtros de Fecha
- [ ] Inputs de fecha para `desde` y `hasta` (type="date")
- [ ] Botón "Aplicar Filtros"
- [ ] Botón "Limpiar Filtros" (resetea a valores por defecto)
- [ ] Valores por defecto: últimos 30 días

---

### 3. Gráficos (usar Chart.js o ng2-charts)

#### 3.1 Instalación
- [ ] `npm install chart.js ng2-charts` (o solo Chart.js si preferimos implementación manual)
- [ ] Importar módulos necesarios

#### 3.2 Tipos de Gráficos
1. **Log de Ingresos**: Tabla con opción de gráfico de barras por día/usuario
2. **Turnos por Especialidad**: Gráfico de barras o pie chart
3. **Turnos por Día**: Gráfico de líneas o barras (tendencia temporal)
4. **Turnos por Médico**: Gráfico de barras horizontal
5. **Turnos Finalizados por Médico**: Gráfico de barras horizontal

#### 3.3 Componentes de Gráficos
- [ ] Crear componente reutilizable `shared/chart/chart.component.ts` (opcional)
- [ ] O implementar directamente en cada sección del componente de estadísticas

---

### 4. Descarga de Informes

#### 4.1 Excel
- [ ] Reutilizar `excel.util.ts` existente
- [ ] Botón "Descargar Excel" en cada sección
- [ ] Generar archivos:
  - `logins-YYYY-MM-DD.xlsx`
  - `turnos-por-especialidad-YYYY-MM-DD.xlsx`
  - `turnos-por-dia-YYYY-MM-DD.xlsx`
  - `turnos-por-medico-YYYY-MM-DD.xlsx`
  - `turnos-finalizados-por-medico-YYYY-MM-DD.xlsx`

#### 4.2 PDF
- [ ] Extender `pdf.util.ts` o crear `reports-pdf.util.ts`
- [ ] Botón "Descargar PDF" en cada sección
- [ ] Generar PDFs con:
  - Logo de la clínica
  - Título del informe
  - Fecha de emisión
  - Período consultado (desde - hasta)
  - Datos tabulares o gráfico (si es posible)
- [ ] Archivos:
  - `logins-YYYY-MM-DD.pdf`
  - `turnos-por-especialidad-YYYY-MM-DD.pdf`
  - etc.

#### 4.3 Descarga de Gráficos (Imagen)
- [ ] Botón "Descargar Gráfico" en cada sección con gráfico
- [ ] Convertir canvas del gráfico a imagen PNG
- [ ] Descargar como: `grafico-turnos-por-especialidad-YYYY-MM-DD.png`

---

### 5. Vista Detallada de Logs

#### 5.1 Tabla de Logs de Ingresos
- [ ] Columnas: Usuario (nombre + apellido), Email, Rol, Fecha/Hora, IP (opcional), User Agent (opcional)
- [ ] Paginación o scroll infinito (si hay muchos registros)
- [ ] Ordenamiento por fecha (desc por defecto)
- [ ] Filtro adicional por usuario (combobox/dropdown con búsqueda)

---

### 6. Mejoras en Backend (si es necesario)

#### 6.1 Enriquecer Datos
- [ ] Backend puede necesitar incluir nombres de especialidades en `turnos-por-especialidad`
- [ ] Backend puede necesitar incluir nombres de especialistas en `turnos-por-medico`
- [ ] Crear DTOs específicos si es necesario

---

## Consideraciones Técnicas

### Librería de Gráficos
- **Opción A**: Chart.js + ng2-charts (Angular wrapper oficial)
  - Pros: Fácil de usar, bien mantenido, muchos tipos de gráficos
  - Cons: Dependencia adicional
- **Opción B**: Chart.js directo (sin wrapper)
  - Pros: Menos dependencias, más control
  - Cons: Más código manual
- **Opción C**: Otra librería (ApexCharts, etc.)
  - Evaluar según necesidad

### Estilos
- Mantener consistencia con el resto de la aplicación
- Usar colores distintivos pero coherentes para cada gráfico
- Responsive: gráficos deben adaptarse a móviles (puede requerir ajustes)

### Performance
- Los gráficos pueden ser pesados si hay muchos datos
- Considerar límites en la consulta o agregar paginación
- Lazy loading de gráficos (cargar solo cuando se selecciona la pestaña)

### Fechas
- Formato: `YYYY-MM-DD` para inputs `type="date"`
- Validar que `desde <= hasta`
- Considerar zona horaria (usar UTC o timezone local consistente)

---

## Orden Sugerido de Implementación

1. **Servicio y Modelos** (base para todo)
2. **Componente de Estadísticas** (estructura básica con tabs)
3. **Log de Ingresos** (tabla, más simple)
4. **Turnos por Día** (gráfico de línea, simple)
5. **Turnos por Especialidad** (gráfico de barras/pie)
6. **Turnos por Médico** (gráfico de barras horizontal)
7. **Descarga Excel** (ya tenemos util)
8. **Descarga PDF** (extender util existente)
9. **Descarga de Gráficos como Imagen**
10. **Verificación de Pipes y Directivas** (aplicar donde corresponda)

---

## Archivos a Crear

```
frontend/src/app/
├── services/
│   └── reports.service.ts (nuevo)
├── models/
│   └── report.model.ts (nuevo)
├── features/
│   └── admin/
│       └── estadisticas/
│           ├── estadisticas.component.ts (nuevo)
│           ├── estadisticas.component.html (nuevo)
│           └── estadisticas.component.scss (nuevo)
└── utils/
    └── reports-pdf.util.ts (nuevo, opcional)
```

---

## Archivos a Modificar

- `app.routes.ts` - Agregar ruta `/admin/estadisticas`
- `navbar.component.html` - Agregar link "Estadísticas" para ADMIN
- `app.config.ts` - Importar módulos de gráficos si es necesario
- Verificar y aplicar pipes/directivas en componentes existentes si falta

---

## Notas Importantes

1. **Seguridad**: Todos los endpoints requieren autenticación y rol ADMIN
2. **Datos de Prueba**: Asegurarse de tener datos suficientes para visualizar gráficos significativos
3. **Enriquecimiento de Datos**: Puede ser necesario modificar el backend para incluir nombres de especialidades/especialistas en los reportes
4. **Pipes y Directivas**: Ya existen, solo verificar que funcionen y usarlos en los nuevos componentes

