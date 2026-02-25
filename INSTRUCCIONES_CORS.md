# 🔧 Solución al Problema de CORS

## ❌ Problema

Cuando abres el HTML directamente desde el explorador de archivos, el navegador bloquea las peticiones a n8n por políticas de CORS (Cross-Origin Resource Sharing).

## ✅ Solución: Servidor HTTP Simple

He creado un servidor HTTP simple que:
- ✅ Sirve el HTML
- ✅ Hace de proxy para evitar CORS
- ✅ Es muy fácil de usar

## 🚀 Cómo Usar

### Opción 1: Con Python (Recomendado)

1. **Abre una terminal** (no PowerShell, solo terminal normal)
2. **Navega a la carpeta del proyecto**
3. **Ejecuta:**
   ```bash
   python servidor_simple.py
   ```
4. **Abre tu navegador en:** `http://localhost:8000`

### Opción 2: Doble Clic (Windows)

1. **Haz doble clic en:** `servidor_simple.bat`
2. **Abre tu navegador en:** `http://localhost:8000`

### Opción 3: PowerShell

1. **Haz clic derecho en:** `servidor_simple.ps1`
2. **Selecciona:** "Ejecutar con PowerShell"
3. **Abre tu navegador en:** `http://localhost:8000`

## 📋 Requisitos

- **Python 3** (viene preinstalado en Windows 10/11)
  - Si no lo tienes, descárgalo de: https://www.python.org/downloads/

## ⚙️ Configuración

El servidor está configurado para:
- **Puerto:** 8000
- **Webhook de n8n:** Ya configurado en el código

Si necesitas cambiar el webhook, edita `servidor_simple.py` y busca:
```python
N8N_WEBHOOK_URL = 'https://groupegmpi.app.n8n.cloud/webhook/...'
```

## 🛑 Detener el Servidor

Presiona `Ctrl+C` en la terminal donde está corriendo el servidor.

## ✅ Ventajas

- ✅ No necesitas configurar nada complejo
- ✅ Evita problemas de CORS
- ✅ Funciona en cualquier sistema con Python
- ✅ Muy ligero y rápido

## 🐛 Si Python no funciona

Si no tienes Python instalado, puedes:
1. Instalar Python desde https://www.python.org/downloads/
2. O usar un servidor HTTP simple online
3. O configurar n8n para permitir CORS (requiere acceso al servidor)

