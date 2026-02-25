# Chat Web con n8n

Una aplicación web moderna de chat que se conecta con n8n mediante webhooks. Interfaz bonita y moderna para enviar y recibir mensajes desde/hacia n8n.

## 🚀 Características

- 💬 Chat web con interfaz moderna y bonita
- 🔗 Integración con n8n mediante webhooks
- 📄 Soporte para enlaces y documentos
- 🎨 Diseño responsive y animaciones suaves
- ⚡ Comunicación bidireccional con n8n

## 📋 Requisitos Previos

- Node.js (v14 o superior)
- npm o yarn
- n8n instalado y configurado

## 🛠️ Instalación

1. Clona o descarga este repositorio

2. Instala las dependencias:
```bash
npm run install-all
```

3. Configura las variables de entorno:
   - Copia `server/env.example` a `server/.env`
   - Configura la URL del webhook de n8n:
   ```
   N8N_WEBHOOK_URL=http://localhost:5678/webhook/chat
   PORT=5000
   ```

## 🎯 Uso

### 🌐 Opción 1: Desplegar en Vercel (RECOMENDADO - Sin CORS)

**La mejor solución**: Despliega en Vercel y olvídate de problemas de CORS.

**📖 Guía Completa**: Ver `GUIA_SIMPLE_VERCEL.md` (TODO desde el navegador, SIN PowerShell)

**Pasos rápidos**:
1. **Sube a GitHub** (GitHub Desktop o desde la web)
2. **Despliega en Vercel** (conecta el repositorio)
3. **¡Listo!** Tu chat funcionará desde cualquier lugar

**Ventajas**:
- ✅ Sin problemas de CORS
- ✅ No necesitas servidor local
- ✅ No necesitas PowerShell ni terminal
- ✅ Todo desde el navegador
- ✅ Accesible desde cualquier dispositivo
- ✅ Gratis

### 💻 Opción 2: Usar el Servidor Simple (Local)

Para evitar problemas de CORS, usa el servidor HTTP simple incluido:

**Opción 1: Con Python (Más fácil)**
```bash
python servidor_simple.py
```
Luego abre: `http://localhost:8000`

**Opción 2: Doble clic en Windows**
- Haz doble clic en `servidor_simple.bat`
- Abre: `http://localhost:8000`

**⚠️ IMPORTANTE**: 
- El workflow en n8n debe estar **activado**
- El método HTTP del webhook debe ser **POST** (no GET)
- Necesitas Python 3 (viene preinstalado en Windows 10/11)

Ver `INSTRUCCIONES_CORS.md` para más detalles.

### Opción 2: Desarrollo con React (Opcional)

Si quieres desarrollar o modificar la aplicación con React:

**Terminal 1 - Servidor Backend:**
```powershell
cd server
npm install  # Solo la primera vez
npm start
```
Deberías ver: `Servidor corriendo en http://localhost:5000`

**Terminal 2 - Cliente Frontend:**
```powershell
cd client
npm install  # Solo la primera vez
npm start
```
Esto abrirá automáticamente el navegador en `http://localhost:3000`

### Acceso

- ✅ **CORRECTO**: Abre `http://localhost:3000` en el navegador
- ❌ **INCORRECTO**: Abrir `index.html` directamente desde el explorador

### Script de Inicio Rápido

También puedes usar el script PowerShell:
```powershell
.\iniciar.ps1
```
Este script verificará las dependencias y te dará instrucciones.

## 📁 Estructura del Proyecto

```
chat-web-ia/
├── server/              # Backend (Node.js + Express)
│   ├── index.js        # Servidor principal
│   ├── package.json    # Dependencias del servidor
│   └── .env           # Variables de entorno (crear)
├── client/             # Frontend (React)
│   ├── src/
│   │   ├── components/ # Componentes React
│   │   ├── App.js     # Componente principal
│   │   └── index.js   # Punto de entrada
│   └── package.json   # Dependencias del cliente
├── uploads/           # Archivos subidos (se crea automáticamente)
└── package.json       # Scripts principales
```

## 🔧 Configuración de n8n

### Configurar el Webhook en n8n

1. Crea un workflow en n8n
2. Agrega un nodo **Webhook** como trigger
3. Configura el método como `POST`
4. Copia la URL del webhook (ej: `http://localhost:5678/webhook/chat`)
5. Agrega esa URL al archivo `server/.env` como `N8N_WEBHOOK_URL`

### Respuesta desde n8n

n8n puede responder de dos formas:

**Opción 1: Respuesta síncrona (inmediata)**
- El webhook de n8n devuelve directamente la respuesta en el mismo request
- Formato esperado: `{ "message": "texto de respuesta", "links": [], "documents": [] }`

**Opción 2: Respuesta asíncrona (con callback)**
- n8n procesa y luego envía la respuesta al webhook de la app
- Usa el endpoint: `POST http://localhost:5000/api/webhook/n8n-response`
- Formato: `{ "messageId": "id-del-mensaje", "message": "respuesta", "links": [], "documents": [] }`

### Personalización

- **Puerto del servidor**: Modifica `PORT` en `server/.env`
- **URL de la API**: Configura `REACT_APP_API_URL` en `client/.env` si es necesario

## 📝 API Endpoints

- `POST /api/chat` - Enviar mensaje a n8n
- `POST /api/webhook/n8n-response` - Recibir respuesta de n8n (webhook)
- `GET /api/response/:messageId` - Obtener respuesta pendiente
- `DELETE /api/responses` - Limpiar respuestas pendientes

## 🎨 Características de la UI

- Diseño moderno con gradientes
- Animaciones suaves
- Responsive para móviles y tablets
- Indicador de escritura mientras el asistente procesa
- Visualización de enlaces y documentos en los mensajes

## 🔒 Seguridad

- No subas el archivo `.env` al repositorio
- Considera implementar autenticación para producción
- Protege los webhooks con tokens si es necesario

## 📄 Licencia

MIT

## 🤝 Contribuciones

Las contribuciones son bienvenidas. Por favor, abre un issue o pull request.

