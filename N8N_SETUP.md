# Configuración de n8n para Chat Web

## 📋 Pasos para Configurar n8n

### 1. Crear el Webhook en n8n

1. Abre n8n y crea un nuevo workflow
2. Agrega un nodo **Webhook** como primer nodo (trigger)
3. Configura el webhook:
   - **HTTP Method**: `POST`
   - **Path**: `/webhook/chat` (o el que prefieras)
   - **Response Mode**: `Last Node` o `Using 'Respond to Webhook' Node`
4. Activa el workflow
5. Copia la URL completa del webhook (ej: `http://localhost:5678/webhook/chat`)

### 2. Configurar la URL en la Aplicación

1. Copia `server/env.example` a `server/.env`
2. Agrega la URL del webhook:
   ```
   N8N_WEBHOOK_URL=http://localhost:5678/webhook/chat
   PORT=5000
   ```

### 3. Estructura de Datos

#### Datos que Recibe n8n (del chat web)

Cuando el usuario envía un mensaje, n8n recibe:

```json
{
  "message": "Texto del mensaje del usuario",
  "sessionId": "session-1234567890",
  "messageId": "1234567890",
  "timestamp": "2024-01-01T12:00:00.000Z"
}
```

#### Datos que n8n Debe Enviar (respuesta)

**Opción A: Respuesta Inmediata (Síncrona)**

El webhook de n8n devuelve directamente la respuesta:

```json
{
  "message": "Esta es la respuesta del asistente",
  "links": ["https://ejemplo.com"],
  "documents": ["documento.pdf"]
}
```

**Opción B: Respuesta Asíncrona (Callback)**

Si n8n necesita tiempo para procesar, puede enviar la respuesta después usando un nodo HTTP Request:

1. Agrega un nodo **HTTP Request** después de procesar
2. Configura:
   - **Method**: `POST`
   - **URL**: `http://localhost:5000/api/webhook/n8n-response`
   - **Body**:
   ```json
   {
     "messageId": "{{ $json.messageId }}",
     "message": "Esta es la respuesta del asistente",
     "links": ["https://ejemplo.com"],
     "documents": ["documento.pdf"],
     "sessionId": "{{ $json.sessionId }}"
   }
   ```

### 4. Ejemplo de Workflow Básico

```
[Webhook] → [Procesar Mensaje] → [Responder]
```

O para respuesta asíncrona:

```
[Webhook] → [Procesar Mensaje] → [HTTP Request (callback)]
```

### 5. Campos Opcionales

- **links**: Array de URLs para mostrar como enlaces descargables
- **documents**: Array de nombres de documentos o URLs de documentos
- **messageId**: Solo necesario si usas respuesta asíncrona

## 🔄 Flujo de Comunicación

1. Usuario escribe mensaje en el chat web
2. Chat web envía POST a `http://localhost:5000/api/chat`
3. Backend reenvía a n8n webhook (`N8N_WEBHOOK_URL`)
4. n8n procesa el mensaje
5. n8n responde (síncrono o asíncrono)
6. Chat web muestra la respuesta

## 🧪 Probar la Conexión

1. Inicia el servidor: `npm run server`
2. Inicia el cliente: `npm run client`
3. Abre `http://localhost:3000`
4. Envía un mensaje de prueba
5. Verifica que n8n reciba el mensaje y responda

## ⚠️ Notas Importantes

- Asegúrate de que n8n esté corriendo antes de iniciar la aplicación
- Si n8n no responde en 30 segundos, el chat mostrará un timeout
- El `messageId` es importante para respuestas asíncronas
- Los enlaces y documentos se mostrarán automáticamente si están en el formato correcto

