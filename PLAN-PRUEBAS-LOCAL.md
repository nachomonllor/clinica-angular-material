# Plan de Pruebas Locales - Pre-Deploy

## 🎯 Objetivos

1. ✅ Probar que el backend sirve el frontend correctamente (modo producción local)
2. ✅ Probar carga y visualización de imágenes
3. ✅ Probar el sistema de emails (verificación de email)
4. ✅ Desarrollar y probar la subida de imágenes de perfil
5. ✅ Verificar que todo funciona antes del deploy en Railway

---

## 📋 Checklist de Tareas

### Fase 1: Preparar entorno de producción local ⏳
- [ ] Compilar frontend en modo producción
- [ ] Configurar backend para servir archivos estáticos
- [ ] Probar que el backend sirve el frontend correctamente
- [ ] Verificar rutas del frontend (SPA routing)
- [ ] Verificar que las llamadas a la API funcionan

### Fase 2: Probar sistema de imágenes 📸
- [ ] Verificar que las imágenes estáticas se sirven correctamente
- [ ] Probar carga de imágenes de perfil (endpoint backend)
- [ ] Verificar almacenamiento local de imágenes
- [ ] Probar visualización de imágenes de perfil en frontend
- [ ] Verificar permisos y validaciones

### Fase 3: Desarrollar subida de imágenes en frontend 🖼️
- [ ] Crear componente/service para upload de imágenes
- [ ] Agregar input de tipo file en formularios de registro/perfil
- [ ] Integrar con endpoint de storage del backend
- [ ] Mostrar preview de imagen antes de subir
- [ ] Actualizar perfil de usuario con URL de imagen
- [ ] Manejar errores y validaciones

### Fase 4: Probar sistema de emails 📧
- [ ] Configurar SMTP (Gmail o servicio de prueba)
- [ ] Probar envío de email de verificación al registrar
- [ ] Verificar que el link de verificación funciona
- [ ] Probar flujo completo de registro → email → verificación → login

### Fase 5: Verificación final ✅
- [ ] Probar todas las funcionalidades en modo producción local
- [ ] Verificar que no hay errores en consola
- [ ] Verificar que las imágenes se cargan correctamente
- [ ] Verificar que los emails se envían correctamente
- [ ] Documentar cualquier problema encontrado

---

## 🚀 Pasos Detallados

### Paso 1: Configurar modo producción local

**1.1. Compilar frontend**
```bash
cd frontend
npm install
npm run build -- --configuration production
# Esto genera: frontend/dist/frontend/browser/
```

**1.2. Verificar que el build se generó correctamente**
```bash
ls -la frontend/dist/frontend/browser/
# Debe contener: index.html, main-*.js, styles-*.css, assets/, etc.
```

**1.3. Configurar backend para producción local**
```bash
cd backend
# Verificar que .env tiene:
# NODE_ENV=production
# FRONTEND_DIST_PATH=../frontend/dist/frontend/browser
```

**1.4. Iniciar backend en modo producción**
```bash
cd backend
npm install
NODE_ENV=production npm run start:prod
# O: npm run start:prod
```

**1.5. Probar que funciona**
- Abrir navegador en: `http://localhost:3000`
- Debe mostrar el frontend Angular
- Probar login/registro
- Probar navegación (rutas del frontend)

---

### Paso 2: Probar sistema de imágenes

**2.1. Verificar endpoint de storage del backend**
```bash
# El endpoint ya existe: POST /storage/profile-image
# Verificar que funciona:
curl -X POST http://localhost:3000/storage/profile-image \
  -H "Cookie: connect.sid=..." \
  -F "file=@/path/to/image.jpg"
```

**2.2. Verificar que las imágenes se guardan**
```bash
ls -la backend/uploads/profiles/
# Debe mostrar las imágenes subidas
```

**2.3. Verificar que las imágenes se sirven**
```bash
# Abrir en navegador:
http://localhost:3000/uploads/profiles/nombre-imagen.jpg
# Debe mostrar la imagen
```

**2.4. Probar visualización de imágenes en frontend**
- Verificar que las URLs de imágenes son correctas
- Verificar que las imágenes se cargan en los componentes

---

### Paso 3: Desarrollar subida de imágenes en frontend

**3.1. Crear servicio para upload de imágenes**

Crear: `frontend/src/app/services/storage.service.ts`

```typescript
import { inject, Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { API_BASE_URL } from "../utils/api-config";

@Injectable({ providedIn: "root" })
export class StorageService {
  private http = inject(HttpClient);

  uploadProfileImage(file: File) {
    const formData = new FormData();
    formData.append("file", file);

    return this.http.post<{ success: boolean; filename: string; url: string }>(
      `${API_BASE_URL}/storage/profile-image`,
      formData,
      { withCredentials: true }
    );
  }

  deleteProfileImage(filename: string) {
    return this.http.delete(
      `${API_BASE_URL}/storage/profile-image/${filename}`,
      { withCredentials: true }
    );
  }
}
```

**3.2. Crear componente para upload de imagen**

Crear: `frontend/src/app/shared/image-upload/image-upload.component.ts`

- Input de tipo file
- Preview de imagen antes de subir
- Botón para subir
- Manejo de errores

**3.3. Integrar en formularios**

- Registro de paciente: `imagenUno`, `imagenDos`
- Registro de especialista: `imagen`
- Actualización de perfil: `imagen`

**3.4. Actualizar DTOs del backend**

Verificar que los DTOs aceptan las URLs de imágenes:
- `CreateUserDto` - ya acepta `imagenUno`, `imagenDos`, `imagen`
- Verificar que se guardan en la base de datos

**3.5. Actualizar componentes para mostrar imágenes**

- Mostrar imagen de perfil en navbar
- Mostrar imagen en perfil de usuario
- Mostrar imagen en listados

---

### Paso 4: Probar sistema de emails

**4.1. Configurar Gmail SMTP**

1. Ir a https://myaccount.google.com/security
2. Activar "Verificación en 2 pasos"
3. Crear "Contraseña de aplicación"
4. Copiar la contraseña de 16 caracteres

**4.2. Configurar variables de entorno**

```env
# backend/.env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=tu-email@gmail.com
SMTP_PASS=la-contraseña-de-16-caracteres
EMAIL_FROM=Clínica Online <tu-email@gmail.com>
FRONTEND_URL=http://localhost:3000
```

**4.3. Probar envío de email**

1. Registrar un nuevo usuario
2. Verificar que se recibe el email
3. Verificar que el link de verificación es correcto
4. Click en el link y verificar que funciona

**4.4. Probar flujo completo**

1. Registrar usuario → recibe email
2. Click en link de verificación → usuario verificado
3. Login → debe funcionar (antes no funcionaba sin verificar)

---

### Paso 5: Verificación final

**5.1. Probar todas las funcionalidades**
- [ ] Login
- [ ] Registro de paciente (con imágenes)
- [ ] Registro de especialista (con imagen)
- [ ] Actualización de perfil (con imagen)
- [ ] Verificación de email
- [ ] Solicitar turno
- [ ] Gestionar turnos
- [ ] Ver historia clínica
- [ ] Reportes (admin)

**5.2. Verificar consola del navegador**
- [ ] No hay errores en consola
- [ ] No hay warnings importantes
- [ ] Las imágenes se cargan correctamente

**5.3. Verificar logs del backend**
- [ ] No hay errores en logs
- [ ] Los emails se envían correctamente
- [ ] Las imágenes se guardan correctamente

---

## 🐛 Problemas Potenciales y Soluciones

### Problema: Frontend no se ve en `http://localhost:3000`

**Solución:**
- Verificar que `NODE_ENV=production`
- Verificar que `FRONTEND_DIST_PATH` apunta al directorio correcto
- Verificar que el build del frontend se completó
- Verificar logs del backend

### Problema: Imágenes no se cargan

**Solución:**
- Verificar que el directorio `backend/uploads/profiles/` existe
- Verificar permisos del directorio
- Verificar que el middleware de Express está configurado
- Verificar las URLs en el frontend

### Problema: Emails no se envían

**Solución:**
- Verificar configuración SMTP en `.env`
- Verificar que la contraseña de aplicación es correcta
- Verificar logs del backend para errores de SMTP
- Probar con un servicio de email de prueba (Mailtrap, etc.)

### Problema: Upload de imágenes falla

**Solución:**
- Verificar que el archivo es menor a 5MB
- Verificar que el tipo de archivo es válido (JPEG, PNG, WebP)
- Verificar que el usuario está autenticado
- Verificar logs del backend

---

## 📝 Comandos Útiles

### Compilar frontend
```bash
cd frontend
npm run build -- --configuration production
```

### Iniciar backend en producción local
```bash
cd backend
NODE_ENV=production npm run start:prod
```

### Ver logs del backend
```bash
# En otra terminal mientras corre el backend
tail -f backend/logs/app.log  # Si hay logs
# O ver en la terminal donde corre
```

### Verificar estructura de directorios
```bash
# Frontend build
ls -la frontend/dist/frontend/browser/

# Imágenes subidas
ls -la backend/uploads/profiles/

# Verificar que backend puede acceder al frontend
ls -la backend/../frontend/dist/frontend/browser/
```

### Probar endpoint de imágenes
```bash
# Subir imagen (necesitas cookie de sesión)
curl -X POST http://localhost:3000/storage/profile-image \
  -H "Cookie: connect.sid=TU_SESSION_ID" \
  -F "file=@/path/to/imagen.jpg"

# Ver imagen
open http://localhost:3000/uploads/profiles/nombre-imagen.jpg
```

---

## ✅ Criterios de Éxito

Al finalizar este plan, deberías poder:

1. ✅ Abrir `http://localhost:3000` y ver el frontend funcionando
2. ✅ Registrarte como usuario y recibir email de verificación
3. ✅ Verificar tu email y hacer login
4. ✅ Subir una imagen de perfil y verla en tu perfil
5. ✅ Ver que las imágenes se cargan correctamente en toda la app
6. ✅ Probar todas las funcionalidades sin errores

---

## 🎯 Siguiente Paso

Una vez completado este plan, estarás listo para:
- Deploy en Railway
- Todo debería funcionar igual que localmente
- Solo cambiar las URLs en las variables de entorno

---

## 📚 Recursos

- **Express Static Files**: https://expressjs.com/en/starter/static-files.html
- **Multer (File Upload)**: https://github.com/expressjs/multer
- **Nodemailer (Emails)**: https://nodemailer.com/
- **Angular File Upload**: https://angular.io/guide/http#sending-data-to-the-server

