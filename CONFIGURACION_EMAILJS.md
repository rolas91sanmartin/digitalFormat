# Configuración de EmailJS para Recuperación de Contraseña

## ¿Qué es EmailJS?

EmailJS es un servicio gratuito que permite enviar emails directamente desde el navegador sin necesidad de un servidor backend. Es perfecto para aplicaciones Electron como FormatPrinter IA.

## Límites del Plan Gratuito

- **200 emails por mes** (suficiente para una aplicación de uso interno)
- Sin necesidad de tarjeta de crédito
- Soporte para múltiples servicios de email (Gmail, Outlook, etc.)

## Pasos para Configurar EmailJS

### 1. Crear Cuenta

1. Ve a [https://www.emailjs.com/](https://www.emailjs.com/)
2. Haz clic en **"Sign Up"**
3. Regístrate con tu email o cuenta de Google
4. Verifica tu email

### 2. Agregar un Servicio de Email

1. En el dashboard, ve a **"Email Services"**
2. Haz clic en **"Add New Service"**
3. Selecciona tu proveedor (recomendado: **Gmail**)
4. Sigue las instrucciones para conectar tu cuenta
5. Copia el **Service ID** (algo como: `service_xxxxxxx`)

### 3. Crear una Plantilla de Email

1. Ve a **"Email Templates"**
2. Haz clic en **"Create New Template"**
3. Usa esta plantilla de ejemplo:

**Subject (Asunto):**
```
Código de recuperación de contraseña - FormatPrinter IA
```

**Body (Contenido):**
```html
<p>Hola {{username}},</p>

<p>Has solicitado recuperar tu contraseña en FormatPrinter IA.</p>

<p>Tu código de verificación es:</p>

<h2 style="font-size: 32px; letter-spacing: 5px; color: #2196F3; text-align: center;">
  {{reset_code}}
</h2>

<p><strong>Este código expira en 15 minutos.</strong></p>

<p>Si no solicitaste este cambio, ignora este mensaje.</p>

<hr>
<p style="color: #999; font-size: 12px;">
  FormatPrinter IA - Sistema de reconocimiento de formularios
</p>
```

4. En la configuración de la plantilla:
   - **To Email:** `{{to_email}}`
   - **From Name:** FormatPrinter IA
   - **Reply To:** tu@email.com (tu email)

5. Guarda y copia el **Template ID** (algo como: `template_xxxxxxx`)

### 4. Obtener tu Public Key

1. Ve a **"Account"** → **"General"**
2. Encuentra tu **Public Key** (algo como: `xxxxxxxxxxxxxxxxxx`)
3. Cópialo

### 5. Configurar en la Aplicación

Abre el archivo: `src/renderer/src/pages/ForgotPassword.tsx`

Reemplaza estas líneas (cerca de la línea 15):

```typescript
const EMAILJS_SERVICE_ID = 'YOUR_SERVICE_ID'; // Reemplazar con tu Service ID
const EMAILJS_TEMPLATE_ID = 'YOUR_TEMPLATE_ID'; // Reemplazar con tu Template ID
const EMAILJS_PUBLIC_KEY = 'YOUR_PUBLIC_KEY'; // Reemplazar con tu Public Key
```

Por ejemplo:
```typescript
const EMAILJS_SERVICE_ID = 'service_abc123';
const EMAILJS_TEMPLATE_ID = 'template_xyz789';
const EMAILJS_PUBLIC_KEY = 'AbCdEfGhIjKlMnOpQrSt';
```

### 6. Recompilar y Probar

```bash
npm run build
npm run dev
```

## Cómo Funciona el Sistema

1. **Usuario solicita recuperación:**
   - Ingresa su email
   - El sistema genera un código de 6 dígitos
   - Se guarda en la base de datos (válido por 15 minutos)

2. **Email enviado:**
   - EmailJS envía el código al email del usuario
   - Si falla el envío, se muestra el código en pantalla (solo desarrollo)

3. **Usuario verifica código:**
   - Ingresa el código recibido
   - El sistema verifica que sea válido y no haya expirado

4. **Cambio de contraseña:**
   - Usuario ingresa nueva contraseña
   - Se actualiza en la base de datos
   - El código se marca como usado

## Modo Desarrollo (Sin EmailJS)

Si no configuras EmailJS, el sistema seguirá funcionando pero mostrará el código en una alerta de SweetAlert2 en lugar de enviarlo por email. Esto es útil para pruebas.

## Alternativas a EmailJS

Si necesitas enviar más de 200 emails al mes, puedes considerar:

- **SendGrid:** 100 emails/día gratis
- **Mailgun:** 5,000 emails/mes gratis durante 3 meses
- **Amazon SES:** Muy económico ($0.10 por 1,000 emails)

## Seguridad

✅ **El código expira en 15 minutos**
✅ **Solo puede usarse una vez**
✅ **Se eliminan códigos anteriores al generar uno nuevo**
✅ **Las contraseñas se hashean con bcrypt**

## Soporte

Si tienes problemas con EmailJS:
1. Verifica que tu cuenta esté verificada
2. Revisa la consola del navegador para ver errores
3. Asegúrate de que el servicio de email esté conectado correctamente
4. Consulta la documentación: https://www.emailjs.com/docs/

---

**Desarrollado para FormatPrinter IA**

