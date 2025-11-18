# Configuración de Nodemailer (Emails)

Esta guía explica cómo configurar el envío de emails de verificación usando Nodemailer.

## Variables de Entorno Requeridas

El servicio de email requiere las siguientes variables en tu archivo `.env`:

```env
# Configuración de Email (SMTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=tu-email@gmail.com
SMTP_PASS=tu-app-password

# Opcional: Personalización
EMAIL_FROM="Clínica Online <tu-email@gmail.com>"
FRONTEND_URL=http://localhost:4200
```

## Configuración por Proveedor

### 📧 Gmail (Recomendado para desarrollo/testing)

1. **Habilitar Autenticación de 2 Factores** en tu cuenta de Google
2. **Generar una App Password**:
   - Ir a: https://myaccount.google.com/apppasswords
   - Seleccionar "Mail" y tu dispositivo
   - Copiar la contraseña generada (16 caracteres)

3. **Configurar en `.env`**:
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=tu-email@gmail.com
SMTP_PASS=xxxx xxxx xxxx xxxx  # La app password generada (sin espacios)
EMAIL_FROM="Clínica Online <tu-email@gmail.com>"
FRONTEND_URL=http://localhost:4200
```

### 📧 Outlook/Office365

```env
SMTP_HOST=smtp-mail.outlook.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=tu-email@outlook.com
SMTP_PASS=tu-contraseña
```

### 📧 Mailtrap (Para testing/desarrollo - NO envía emails reales)

1. Crear cuenta en: https://mailtrap.io
2. Ir a "Email Testing" > "Inboxes" > "SMTP Settings"
3. Configurar:

```env
SMTP_HOST=smtp.mailtrap.io
SMTP_PORT=2525
SMTP_SECURE=false
SMTP_USER=tu-mailtrap-user
SMTP_PASS=tu-mailtrap-pass
```

**Ventajas de Mailtrap:**
- ✅ No requiere configuración especial
- ✅ Perfecto para desarrollo
- ✅ Ve los emails sin enviarlos realmente
- ✅ Gratis hasta 500 emails/mes

### 📧 SendGrid (Para producción)

1. Crear cuenta en: https://sendgrid.com
2. Crear API Key
3. Configurar:

```env
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=apikey
SMTP_PASS=tu-sendgrid-api-key
```

### 📧 AWS SES (Para producción)

```env
SMTP_HOST=email-smtp.region.amazonaws.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=tu-access-key
SMTP_PASS=tu-secret-key
```

## Configuración Local

### Paso 1: Copiar archivo de ejemplo

```bash
cd backend
cp .env.example .env
```

### Paso 2: Editar `.env` con tu configuración SMTP

Editar el archivo `.env` y configurar las variables según tu proveedor.

### Paso 3: Verificar que funciona

1. Reiniciar el servidor:
```bash
npm run start:dev
```

2. Intentar registrarse con un nuevo usuario
3. Revisar los logs del servidor:
   - ✅ `[EmailService] Email enviado exitosamente a: usuario@email.com`
   - ❌ `[EmailService] SMTP no configurado` o `Error al enviar email`

## Verificación del Servicio

El servicio muestra logs útiles:

- **Si está configurado correctamente**: `[EmailService] Email enviado exitosamente a: ...`
- **Si NO está configurado**: `[EmailService] SMTP no configurado. Los emails no se enviarán...`
- **Si hay error**: `[EmailService] Error al enviar email: ...`

## Testing

### Probar envío de email

1. Registrar un nuevo usuario desde el frontend
2. Revisar:
   - **Mailtrap**: Ver el email en el dashboard de Mailtrap
   - **Gmail/Outlook**: Revisar la bandeja de entrada (y spam)
   - **Logs del servidor**: Verificar mensajes de éxito/error

### Validar configuración sin registrar

Puedes verificar que el servicio está configurado revisando los logs al iniciar el servidor:
- Si ves el warning `SMTP no configurado` → falta configurar variables
- Si no ves warning → está configurado (aunque puede fallar si las credenciales son incorrectas)

## Variables Opcionales

- `EMAIL_FROM`: Nombre y email del remitente (default: `Clínica Online <SMTP_USER>`)
- `FRONTEND_URL`: URL del frontend para los enlaces de verificación (default: `http://localhost:4200`)

## Troubleshooting

### "SMTP no configurado"
- ✅ Verificar que todas las variables están en `.env`
- ✅ Verificar que el archivo `.env` está en `backend/`
- ✅ Reiniciar el servidor después de cambiar `.env`

### "Error al enviar email"
- ✅ Verificar credenciales (especialmente `SMTP_PASS`)
- ✅ Para Gmail: usar App Password, no la contraseña normal
- ✅ Verificar que la autenticación de 2 factores está habilitada (Gmail)
- ✅ Verificar firewall/red no bloquea el puerto SMTP

### "Email no llega"
- ✅ Revisar carpeta de spam
- ✅ Verificar que el email de destino existe
- ✅ Revisar logs del servidor para ver si se envió realmente
- ✅ Usar Mailtrap para ver el contenido del email

## Seguridad

⚠️ **NUNCA** commits el archivo `.env` al repositorio (ya está en `.gitignore`)

✅ Usa App Passwords en lugar de contraseñas reales cuando sea posible

✅ Para producción, usa servicios especializados (SendGrid, AWS SES, etc.)

