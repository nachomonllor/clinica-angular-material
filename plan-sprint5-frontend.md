# Plan Sprint 5 - Frontend Angular

## Resumen
Implementar nuevos datos dinámicos en historia clínica, crear directiva de captcha propio, y agregar más animaciones de transición según la consigna.

---

## Tareas Sprint 5

### 1. Nuevos datos dinámicos en historia clínica ⏳ PENDIENTE

#### 1.1 Agregar 3 nuevos campos dinámicos con controles específicos
- [ ] **Campo 1: Control de rango entre 0 y 100**
  - Usar `<input type="range">` con min=0, max=100
  - Mostrar valor actual numérico
  - Guardar como clave/valor en `extraData` (ej: `{ clave: "Nivel de dolor", valor: "75" }`)

- [ ] **Campo 2: Cuadro de texto numérico**
  - Usar `<input type="number">`
  - Validación: solo números
  - Guardar como clave/valor en `extraData`

- [ ] **Campo 3: Switch con "Si" o "No"**
  - Usar `<input type="checkbox">` o toggle personalizado
  - Mostrar "Si" o "No" según estado
  - Guardar como clave/valor en `extraData` (ej: `{ clave: "Fiebre", valor: "Si" }` o `{ clave: "Fiebre", valor: "No" }`)

#### 1.2 Actualizar componente de finalizar turno
- [ ] Modificar `mis-turnos-especialista.component.ts`:
  - Agregar 3 nuevos campos dinámicos en la sección de datos adicionales
  - Estos campos deben ser opcionales y agregarse al array `extraData`
  - Los campos deben tener labels/placeholders descriptivos
  - Cada campo debe tener una clave fija o editable

#### 1.3 Actualizar modelo/interfaz si es necesario
- [ ] Verificar que `MedicalExtraField` y `FinalizeAppointmentDto` soporten estos nuevos campos
- [ ] No debería ser necesario cambiar el backend ya que usa `extraData` genérico

**Archivos a modificar:**
- `frontend/src/app/features/turnos/mis-turnos-especialista/mis-turnos-especialista.component.ts`

---

### 2. Generar directiva de captcha propio ⏳ PENDIENTE

#### 2.1 Crear directiva `CustomCaptchaDirective`
- [ ] Crear archivo `frontend/src/app/directives/custom-captcha.directive.ts`
- [ ] Implementar lógica de captcha personalizado:
  - Generar imagen/texto con operación matemática simple (ej: "3 + 5 = ?")
  - O generar código alfanumérico aleatorio que el usuario debe ingresar
  - Validar respuesta del usuario

- [ ] **Inputs:**
  - `@Input() enabled: boolean = true` - Para habilitar/deshabilitar el captcha
  - `@Input() difficulty: 'easy' | 'medium' | 'hard' = 'easy'` - Nivel de dificultad

- [ ] **Outputs:**
  - `@Output() captchaValid = new EventEmitter<boolean>()` - Emitir cuando el captcha es válido
  - `@Output() captchaToken = new EventEmitter<string | null>()` - Emitir token cuando es válido

#### 2.2 Implementar UI del captcha
- [ ] Mostrar:
  - Operación matemática o código generado
  - Input para que el usuario ingrese la respuesta
  - Botón "Actualizar" para generar nuevo captcha
  - Mensaje de error si la respuesta es incorrecta

#### 2.3 Integrar captcha en formularios de alta
- [ ] **Registro de Paciente** (`register.component.ts`):
  - Reemplazar o combinar con `RecaptchaComponent`
  - Usar `CustomCaptchaDirective` además del Google reCAPTCHA
  - Validar ambos antes de permitir registro

- [ ] **Registro de Especialista** (`register-especialista.component.ts`):
  - Reemplazar o combinar con `RecaptchaComponent`
  - Usar `CustomCaptchaDirective` además del Google reCAPTCHA
  - Validar ambos antes de permitir registro

- [ ] **Crear Usuario (Admin)** (`admin-users.component.ts`):
  - Agregar `CustomCaptchaDirective` al formulario de creación
  - Validar captcha antes de crear usuario

#### 2.4 Opción de deshabilitar captcha
- [ ] Agregar toggle/switch en algún lugar de configuración (puede ser en el componente de registro)
- [ ] O usar variable de entorno/configuración
- [ ] Si está deshabilitado, `CustomCaptchaDirective` no debe validar

**Archivos a crear:**
- `frontend/src/app/directives/custom-captcha.directive.ts`

**Archivos a modificar:**
- `frontend/src/app/features/auth/register/register.component.ts`
- `frontend/src/app/features/auth/register-especialista/register-especialista.component.ts`
- `frontend/src/app/features/admin/admin-users/admin-users.component.ts`

---

### 3. Animaciones de transición ⏳ PENDIENTE

#### 3.1 Verificar animaciones existentes
- [ ] Revisar animaciones actuales:
  - `route.animations` en `app.component.ts` (1 animación)
  - `fadeIn` en `bienvenida.component.ts` (1 animación)

#### 3.2 Agregar más animaciones (mínimo 6 en total)
- [ ] **Animación 1**: Fade In (ya existe en `app.component.ts`)
- [ ] **Animación 2**: Slide from right
- [ ] **Animación 3**: Slide from left
- [ ] **Animación 4**: Scale in
- [ ] **Animación 5**: Rotate + fade
- [ ] **Animación 6**: Bounce in

#### 3.3 Aplicar animaciones a diferentes rutas
- [ ] Configurar diferentes animaciones según la ruta:
  - Login/Register: Slide from right
  - Admin pages: Scale in
  - Patient/Specialist pages: Slide from left
  - etc.

- [ ] Modificar `app.component.ts` para usar diferentes animaciones según la ruta

#### 3.4 Animaciones adicionales en componentes
- [ ] Agregar animaciones de entrada/salida en:
  - Dialogs/modales (fade + scale)
  - Cards de turnos (fade in con delay escalonado)
  - Botones de acción (hover effects con transitions)

**Archivos a modificar:**
- `frontend/src/app/app.component.ts`
- `frontend/src/app/animations/route.animations.ts` (crear si no existe, o extender)
- Componentes que tengan dialogs/modales

---

## Consideraciones técnicas

### Datos dinámicos en historia clínica
- Los 3 nuevos campos son adicionales a los 3 campos dinámicos genéricos que ya existen
- Total: máximo 3 campos genéricos (clave/valor texto) + 3 campos específicos (rango, numérico, switch)
- Todos se guardan en el array `extraData` del `FinalizeAppointmentDto`

### Captcha propio
- Debe ser independiente del Google reCAPTCHA (pueden coexistir o reemplazarlo)
- La validación debe ser simple pero efectiva
- Debe generar nuevos códigos cada vez que se refresque

### Animaciones
- Usar `@angular/animations` (`trigger`, `transition`, `animate`, `style`)
- Aplicar animaciones de manera que no afecten el rendimiento
- Considerar accesibilidad (respetar `prefers-reduced-motion`)

---

## Orden sugerido de implementación

1. **Datos dinámicos en historia clínica** (más simple, no requiere nueva funcionalidad)
2. **Directiva de captcha propio** (requiere diseño y lógica)
3. **Animaciones adicionales** (mejora visual, puede hacerse en paralelo)

---

## Estado actual del Sprint 5

### ⏳ Pendiente (0/3 tareas principales)
- ⏳ Nuevos datos dinámicos en historia clínica
- ⏳ Directiva de captcha propio
- ⏳ Animaciones de transición (mínimo 6)

