# 🖥️ Cómo Ejecutar la Aplicación en Desarrollo Local

## ⚠️ IMPORTANTE: Usa un Servidor HTTP Local

**NO abras el archivo HTML directamente** desde el explorador de archivos (usando `file://`).

Esto causa errores de CORS y la aplicación no funcionará correctamente.

## ✅ Solución: Usa un Servidor HTTP Local

### Opción 1: Python (Recomendado - Más Simple)

Si tienes Python instalado:

```bash
# Python 3
python -m http.server 8000

# O Python 2
python -m SimpleHTTPServer 8000
```

Luego abre en el navegador:
```
http://localhost:8000
```

### Opción 2: Node.js (http-server)

Si tienes Node.js instalado:

```bash
# Instalar http-server globalmente (solo una vez)
npm install -g http-server

# O usar npx (sin instalar)
npx http-server -p 8000
```

Luego abre en el navegador:
```
http://localhost:8000
```

### Opción 3: VS Code Live Server

1. Instala la extensión "Live Server" en VS Code
2. Haz clic derecho en `index.html`
3. Selecciona "Open with Live Server"

### Opción 4: PHP (si tienes PHP instalado)

```bash
php -S localhost:8000
```

## 🔍 Verificación

Cuando uses un servidor HTTP local correctamente:

1. La URL en el navegador será: `http://localhost:8000` (NO `file:///`)
2. En la consola verás: `✅ Configuración local cargada desde config.local.js`
3. NO verás errores de CORS
4. La aplicación debería funcionar correctamente

## ❌ Errores Comunes

### Error: "file:///C:/api/config"
- **Causa:** Estás abriendo el HTML directamente desde el explorador
- **Solución:** Usa un servidor HTTP local (ver opciones arriba)

### Error: "CORS policy"
- **Causa:** Mismo problema, usando `file://` en lugar de `http://`
- **Solución:** Usa un servidor HTTP local

### Error: "Variables de entorno no configuradas"
- **Causa:** `config.local.js` no se está cargando correctamente
- **Solución:** 
  1. Verifica que `config.local.js` existe en la raíz del proyecto
  2. Verifica que tiene las credenciales correctas
  3. Usa un servidor HTTP local (no `file://`)

## 📝 Resumen

1. ✅ Crea `config.local.js` con tus credenciales
2. ✅ Inicia un servidor HTTP local (Python, Node.js, etc.)
3. ✅ Abre `http://localhost:8000` en el navegador
4. ✅ Verifica que no hay errores en la consola

¡Listo! Tu aplicación debería funcionar correctamente en desarrollo local. 🎉

