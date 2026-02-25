# 🔧 Solución de Problemas

## Problema 1: Error "Asegúrate de que el servidor esté corriendo"

### Síntoma
El chat muestra el error: "Lo siento, hubo un error al procesar tu mensaje. Asegúrate de que el servidor esté corriendo en http://localhost:5000"

### Solución
El servidor backend no está corriendo. Ejecuta:

```powershell
cd server
npm install  # Solo la primera vez
npm start
```

Deberías ver: `Servidor corriendo en http://localhost:5000`

## Problema 2: Webhook en n8n configurado como GET

### Síntoma
En n8n, el webhook está configurado con método HTTP "GET"

### Solución
1. Abre tu workflow en n8n
2. Haz clic en el nodo Webhook
3. En "HTTP Method", cambia de **GET** a **POST**
4. Guarda y activa el workflow
5. Usa la **Production URL** (no la Test URL) en tu archivo `.env`

### URL Correcta
La URL en `server/.env` debe ser la **Production URL**, no la Test URL:
```
N8N_WEBHOOK_URL=https://groupegmpi.app.n8n.cloud/webhook/761b05cc-158e-4140-9f11-8be71f4d2f3a
```

**NOTA**: Asegúrate de usar `/webhook/` (no `/webhook-test/`)

## Verificación

1. ✅ Servidor backend corriendo en `http://localhost:5000`
2. ✅ Webhook en n8n configurado como **POST**
3. ✅ URL en `.env` es la Production URL (no Test URL)
4. ✅ Workflow en n8n está **activado**

## Prueba

1. Abre `index.html` en el navegador
2. Escribe un mensaje
3. Debería llegar a n8n y recibir respuesta

