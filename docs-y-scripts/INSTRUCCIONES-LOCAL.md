# 🖥️ Configuración para Desarrollo Local

## ✅ Archivo Creado: `config.local.js`

Ya se ha creado el archivo `config.local.js` con tus credenciales. Este archivo:

- ✅ **Está en `.gitignore`** - NO se subirá a GitHub
- ✅ **Solo para desarrollo local** - No se usa en producción
- ✅ **Ya tiene tus credenciales** - Listo para usar

## 🚀 Cómo Usar

### 1. Verificar que el archivo existe

El archivo `config.local.js` ya está creado en la raíz del proyecto con tus credenciales.

### 2. Ejecutar la aplicación localmente

Puedes usar cualquiera de estos métodos:

#### Opción A: Con Python (si tienes Python instalado)
```bash
python -m http.server 8000
```

#### Opción B: Con Node.js (http-server)
```bash
npx http-server -p 8000
```

#### Opción C: Con Live Server (si usas VS Code)
- Instala la extensión "Live Server"
- Haz clic derecho en `index.html` → "Open with Live Server"

### 3. Abrir en el navegador

Una vez que el servidor esté corriendo, abre:
```
http://localhost:8000
```

## 🔍 Verificación

Cuando abras la aplicación en el navegador:

1. Abre la consola del navegador (F12)
2. Deberías ver: `✅ Configuración local cargada desde config.local.js`
3. NO deberías ver errores de "Variables de entorno no configuradas"

## ⚠️ Importante

- **NUNCA** subas `config.local.js` a GitHub (ya está protegido por `.gitignore`)
- Si cambias las credenciales, actualiza este archivo
- Este archivo solo funciona en desarrollo local
- En producción (Vercel), las variables se cargan desde el dashboard de Vercel

## 🔄 Si Necesitas Actualizar las Credenciales

1. Edita `config.local.js`
2. Actualiza los valores de `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY`
3. Guarda el archivo
4. Recarga la página en el navegador

## 📝 Estructura del Archivo

```javascript
window.VITE_SUPABASE_URL = 'https://tu-proyecto.supabase.co';
window.VITE_SUPABASE_ANON_KEY = 'tu-api-key-aqui';
```

¡Listo! Ya puedes desarrollar localmente sin problemas. 🎉

