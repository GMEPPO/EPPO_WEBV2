# 🔧 Instrucciones para Configurar las Variables de Entorno

## ⚠️ PROBLEMA ACTUAL

Estás viendo errores porque las variables de entorno de Supabase no están configuradas. Sigue estos pasos para solucionarlo:

## 🚀 SOLUCIÓN RÁPIDA (Desarrollo Local)

### Paso 1: Crear archivo de configuración local

1. **Copia el archivo de ejemplo:**
   ```bash
   # En Windows (PowerShell)
   Copy-Item config.local.example.js config.local.js
   
   # O manualmente: copia config.local.example.js y renómbralo a config.local.js
   ```

2. **Edita `config.local.js`** y completa con tus credenciales reales:
   ```javascript
   window.VITE_SUPABASE_URL = 'https://tu-proyecto.supabase.co';
   window.VITE_SUPABASE_ANON_KEY = 'tu-api-key-aqui';
   ```

3. **Recarga la página** en tu navegador

### Paso 2: Obtener tus credenciales de Supabase

Si no tienes las credenciales:

1. Ve a tu proyecto en [Supabase Dashboard](https://app.supabase.com)
2. Ve a **Settings** → **API**
3. Copia:
   - **Project URL** → `VITE_SUPABASE_URL`
   - **anon public key** → `VITE_SUPABASE_ANON_KEY`

## 📝 IMPORTANTE

- ✅ El archivo `config.local.js` está en `.gitignore` y **NO se subirá a GitHub**
- ✅ Solo úsalo para desarrollo local
- ✅ En producción (Netlify/Vercel), configura las variables en el dashboard de la plataforma

## 🌐 Para Producción (Netlify/Vercel)

### Netlify:
1. Ve a tu proyecto en [Netlify Dashboard](https://app.netlify.com)
2. **Site settings** → **Environment variables**
3. Agrega:
   - `VITE_SUPABASE_URL` = tu URL de Supabase
   - `VITE_SUPABASE_ANON_KEY` = tu anon key

### Vercel:
1. Ve a tu proyecto en [Vercel Dashboard](https://vercel.com/dashboard)
2. **Settings** → **Environment Variables**
3. Agrega:
   - `VITE_SUPABASE_URL` = tu URL de Supabase
   - `VITE_SUPABASE_ANON_KEY` = tu anon key

## ✅ Verificación

Después de configurar, deberías ver en la consola del navegador:
- ✅ "Configuración local cargada desde config.local.js" (en desarrollo)
- ✅ O las variables se cargarán automáticamente desde la plataforma (en producción)

Los errores de "Variables de entorno no configuradas" deberían desaparecer.

