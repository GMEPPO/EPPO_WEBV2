# 🔧 Configuración de Variables de Entorno en Vercel

## ⚠️ PROBLEMA ACTUAL

Tu aplicación está desplegada en Vercel pero las variables de entorno no están configuradas, por eso ves los errores.

## ✅ SOLUCIÓN: Configurar Variables en Vercel Dashboard

### Paso 1: Ir al Dashboard de Vercel

1. Ve a [Vercel Dashboard](https://vercel.com/dashboard)
2. Selecciona tu proyecto (`eppo-webv2` o el nombre que tenga)

### Paso 2: Configurar Variables de Entorno

1. En el menú lateral, haz clic en **Settings**
2. Haz clic en **Environment Variables**
3. Haz clic en **Add New** para agregar cada variable

Agrega estas **DOS variables**:

#### Variable 1:
- **Name:** `VITE_SUPABASE_URL`
- **Value:** `https://tu-proyecto.supabase.co` (reemplaza con tu URL real)
- **Environment:** Selecciona todas (Production, Preview, Development)

#### Variable 2:
- **Name:** `VITE_SUPABASE_ANON_KEY`
- **Value:** `tu-api-key-aqui` (reemplaza con tu anon key real)
- **Environment:** Selecciona todas (Production, Preview, Development)

### Paso 3: Obtener tus Credenciales de Supabase

Si no tienes las credenciales:

1. Ve a [Supabase Dashboard](https://app.supabase.com)
2. Selecciona tu proyecto
3. Ve a **Settings** (⚙️) → **API**
4. Copia:
   - **Project URL** → úsala para `VITE_SUPABASE_URL`
   - **anon public** key → úsala para `VITE_SUPABASE_ANON_KEY`

### Paso 4: Hacer Nuevo Deploy

**IMPORTANTE:** Después de agregar las variables:

1. Ve a la pestaña **Deployments** en Vercel
2. Haz clic en los **3 puntos** (⋯) del último deployment
3. Selecciona **Redeploy**
4. O haz un nuevo commit y push a tu repositorio

## 🔍 Verificación

Después de configurar y hacer redeploy:

1. Recarga tu aplicación en el navegador
2. Abre la consola del navegador (F12)
3. Los errores de "Variables de entorno no configuradas" deberían desaparecer
4. Deberías ver que la aplicación se conecta correctamente a Supabase

## 📝 Notas Importantes

- ✅ Las variables de entorno se aplican **solo después de un nuevo deploy**
- ✅ La **anon key** es pública y segura para usar en el frontend
- ✅ Asegúrate de tener **Row Level Security (RLS)** configurado en Supabase
- ✅ El archivo `api/config.js` crea un endpoint que expone estas variables de forma segura

## 🆘 Si Sigue Sin Funcionar

1. **Verifica que las variables estén correctamente escritas** (sin espacios extra)
2. **Asegúrate de hacer un nuevo deploy** después de agregar las variables
3. **Revisa los logs de deploy** en Vercel Dashboard para ver si hay errores
4. **Verifica que la API route funcione:** visita `https://tu-app.vercel.app/api/config` (debería devolver JSON con url y anonKey)

