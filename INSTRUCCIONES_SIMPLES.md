# 🚀 Instrucciones Simples - Solo HTML

## ✅ Cómo Usar

1. **Abre el archivo `index.html`** directamente en tu navegador (doble clic)
2. **¡Listo!** El chat funciona directamente sin necesidad de servidores

## 📋 Configuración de n8n

### Requisitos en n8n:

1. **Método HTTP**: Debe ser **POST** (no GET)
2. **Workflow activado**: Asegúrate de que el workflow esté activo
3. **Formato de respuesta**: n8n debe devolver un JSON con el formato:
   ```json
   {
     "message": "Texto de la respuesta",
     "links": ["https://ejemplo.com"],
     "documents": ["documento.pdf"]
   }
   ```
   
   O simplemente puede devolver un string con el texto de la respuesta.

### URL del Webhook

La URL ya está configurada en el HTML:
```
https://groupegmpi.app.n8n.cloud/webhook/761b05cc-158e-4140-9f11-8be71f4d2f3a
```

## 🔧 Si necesitas cambiar la URL

Abre `index.html` y busca la línea:
```javascript
const N8N_WEBHOOK_URL = 'https://groupegmpi.app.n8n.cloud/webhook/761b05cc-158e-4140-9f11-8be71f4d2f3a';
```

Cambia la URL por la tuya.

## ⚠️ Notas Importantes

- **No necesitas** ejecutar ningún servidor
- **No necesitas** instalar Node.js o npm
- **Solo abre** el HTML en el navegador
- El chat se comunica **directamente** con n8n
- Asegúrate de que n8n esté configurado para recibir POST

## 🐛 Solución de Problemas

### "Error al procesar tu mensaje"
- Verifica que el workflow en n8n esté **activado**
- Verifica que el método HTTP sea **POST** (no GET)
- Verifica que la URL del webhook sea correcta

### "Tiempo de espera agotado"
- El workflow de n8n está tardando más de 30 segundos
- Verifica que n8n esté funcionando correctamente
- Considera optimizar tu workflow en n8n

