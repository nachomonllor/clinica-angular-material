# Configuración de Gmail para Envío de Emails

Guía paso a paso para configurar Gmail como servidor SMTP para enviar emails de verificación.

## Paso 1: Habilitar Autenticación de 2 Factores

1. Ir a tu cuenta de Google: https://myaccount.google.com/
2. Ir a **Seguridad** (Security)
3. En **Acceso a la cuenta de Google**, buscar **Verificación en dos pasos**
4. Si no está habilitada:
   - Hacer click en **Verificación en dos pasos**
   - Seguir las instrucciones para configurarla
   - Puedes usar un número de teléfono o la app Google Authenticator

**⚠️ IMPORTANTE:** La autenticación de 2 factores DEBE estar habilitada para generar App Passwords.

## Paso 2: Generar App Password

1. Ir a: https://myaccount.google.com/apppasswords
   - O desde Seguridad → Verificación en dos pasos → Contraseñas de aplicaciones
2. En **Seleccionar app**, elegir **Correo**
3. En **Seleccionar dispositivo**, elegir **Otro (nombre personalizado)**
4. Escribir: `Clínica Online Backend`
5. Hacer click en **Generar**
6. **Copiar la contraseña** que aparece (16 caracteres, sin espacios)
   - Ejemplo: `abcd efgh ijkl mnop`
   - **Guardarla en un lugar seguro**, no podrás verla de nuevo

## Paso 3: Configurar Variables en .env

1. Abrir el archivo `.env` en la carpeta `backend/`
2. Agregar o actualizar las siguientes variables:

```env
# Configuración de Email (Gmail SMTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=tu-email@gmail.com
SMTP_PASS=abcdefghijklmnop
EMAIL_FROM="Clínica Online <tu-email@gmail.com>"
FRONTEND_URL=http://localhost:4200
```

**Reemplazar:**
- `tu-email@gmail.com` → Tu dirección de Gmail completa
- `abcdefghijklmnop` → La App Password que generaste (16 caracteres, SIN ESPACIOS)

**Ejemplo real:**
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=juan.perez@gmail.com
SMTP_PASS=abcd efgh ijkl mnop
EMAIL_FROM="Clínica Online <juan.perez@gmail.com>"
FRONTEND_URL=http://localhost:4200
```

⚠️ **NOTA:** Si la App Password tiene espacios (ej: `abcd efgh ijkl mnop`), puedes dejarla con espacios o quitarlos (ej: `abcdefghijklmnop`). Nodemailer acepta ambos formatos.

## Paso 4: Reiniciar el Servidor

1. Detener el servidor si está corriendo (Ctrl+C)
2. Reiniciar:
```bash
cd backend
npm run start:dev
```

3. Verificar en los logs que NO aparezca:
   - ❌ `[EmailService] SMTP no configurado...`

Si aparece ese warning, significa que falta alguna variable o hay un error en la configuración.

## Paso 5: Probar el Envío

1. Ir al frontend: http://localhost:4200
2. Registrar un nuevo usuario (con un email REAL donde puedas recibir)
3. Revisar:
   - **Logs del servidor**: Debe aparecer `[EmailService] Email enviado exitosamente a: ...`
   - **Bandeja de entrada**: Debe llegar el email de verificación
   - **Carpeta Spam**: Si no llega, revisar aquí también

4. Hacer click en el botón "Verificar mi email" del email recibido
5. Debe redirigir al frontend y verificar la cuenta

## Troubleshooting

### "SMTP no configurado"
- ✅ Verificar que todas las variables están en `.env`
- ✅ Verificar que no hay espacios extras al inicio/fin de los valores
- ✅ Verificar que el archivo `.env` está en `backend/` (no en la raíz)
- ✅ Reiniciar el servidor después de cambiar `.env`

### "Error al enviar email" o "Invalid login"
- ✅ Verificar que la App Password es correcta (16 caracteres)
- ✅ Verificar que la autenticación de 2 factores está habilitada
- ✅ Generar una nueva App Password si la anterior no funciona
- ✅ Verificar que `SMTP_USER` es tu email completo (con @gmail.com)

### "Email no llega"
- ✅ Revisar carpeta de Spam
- ✅ Verificar que el email de destino es correcto
- ✅ Revisar logs del servidor para ver si se envió realmente
- ✅ Verificar que Gmail no bloqueó el acceso (revisar emails de seguridad de Google)

### "Los links de verificación no funcionan"
- ✅ Verificar que `FRONTEND_URL` es correcta
- ✅ Si estás en producción, cambiar `FRONTEND_URL` a la URL real del frontend
- ✅ Verificar que el frontend tiene la ruta `/verify-email` configurada

## Límites de Gmail

- **Gratis**: 500 emails/día
- **Google Workspace**: 2000 emails/día

Para producción con muchos usuarios, considerar:
- SendGrid (100 emails/día gratis, luego de pago)
- AWS SES (muy económico para grandes volúmenes)
- Mailgun (5000 emails/mes gratis)

## Seguridad

⚠️ **NUNCA** commits el archivo `.env` al repositorio (ya está en `.gitignore`)

✅ La App Password es específica para esta aplicación, puedes revocarla en cualquier momento

✅ Si alguien obtiene tu App Password, solo puede enviar emails (no acceder a tu cuenta)

## Verificación Rápida

Después de configurar, el servidor debe iniciar sin warnings. Al registrar un usuario:

✅ **Éxito:**
```
[EmailService] Email enviado exitosamente a: usuario@example.com
```

❌ **Error:**
```
[EmailService] SMTP no configurado. Los emails no se enviarán...
```
o
```
[EmailService] Error al enviar email: ...
```

