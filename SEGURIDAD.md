# 🔐 Guía de Seguridad - Configuración de Variables de Entorno

## ⚠️ IMPORTANTE: Protección de Credenciales

Este proyecto ha sido configurado para proteger tus credenciales de API. **NUNCA subas credenciales directamente en el código**.

## 📋 Configuración Requerida

### Variables de Entorno Necesarias

El proyecto requiere las siguientes variables de entorno:

- `VITE_SUPABASE_URL`: URL de tu proyecto Supabase
- `VITE_SUPABASE_ANON_KEY`: API Key anónima de Supabase

## 🚀 Configuración por Plataforma

### Desarrollo Local

1. Crea un archivo `.env` en la raíz del proyecto (copia de `.env.example` si existe)
2. Agrega tus credenciales:

```env
VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
VITE_SUPABASE_ANON_KEY=tu-api-key-aqui
```

3. **IMPORTANTE**: El archivo `.env` está en `.gitignore` y NO se subirá a GitHub

### Netlify

1. Ve a tu proyecto en [Netlify Dashboard](https://app.netlify.com)
2. Navega a **Site settings** → **Environment variables**
3. Agrega las variables:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
4. Haz un nuevo deploy

**Nota**: El archivo `netlify.toml` ya no contiene credenciales hardcodeadas.

### Vercel

1. Ve a tu proyecto en [Vercel Dashboard](https://vercel.com/dashboard)
2. Navega a **Settings** → **Environment Variables**
3. Agrega las variables:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
4. Haz un nuevo deploy

## ✅ Cambios Realizados para Seguridad

1. ✅ Creado `.gitignore` para proteger archivos sensibles
2. ✅ Eliminadas credenciales hardcodeadas de `netlify.toml`
3. ✅ Eliminados fallbacks hardcodeados en `supabase-config-universal.js`
4. ✅ Actualizados todos los archivos para usar variables de entorno
5. ✅ El código ahora valida que las variables estén configuradas antes de ejecutarse

## 🛡️ Buenas Prácticas

1. **NUNCA** subas archivos `.env` a GitHub
2. **NUNCA** hardcodees credenciales en el código
3. **SIEMPRE** usa variables de entorno para información sensible
4. **VERIFICA** que `.gitignore` incluya `.env` antes de hacer commit
5. **REVISA** el historial de Git si accidentalmente subiste credenciales (cámbialas inmediatamente)

## 🔍 Verificación

Antes de hacer push a GitHub, verifica:

```bash
# Ver qué archivos se van a subir
git status

# Verificar que .env NO aparece en la lista
# Si aparece, NO hagas commit hasta moverlo o agregarlo a .gitignore
```

## ⚠️ Si Ya Subiste Credenciales a GitHub

Si accidentalmente ya subiste credenciales:

1. **CAMBIA INMEDIATAMENTE** tus credenciales en Supabase
2. Elimina el historial de Git o usa `git filter-branch` para remover las credenciales
3. Considera hacer el repositorio privado temporalmente
4. Revisa la documentación de GitHub sobre [remover datos sensibles](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/removing-sensitive-data-from-a-repository)

## 📝 Nota sobre Supabase Anon Key

La "anon key" de Supabase está diseñada para ser pública (se usa en el frontend). Sin embargo:

- **SIEMPRE** configura Row Level Security (RLS) en tus tablas de Supabase
- **NUNCA** uses la "service role key" en el frontend (solo en el backend)
- **REVISA** las políticas de seguridad de tus tablas regularmente

