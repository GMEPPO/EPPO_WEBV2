# 📦 Subir a GitHub - Guía Rápida (SIN PowerShell)

## ✅ Pasos para Subir a GitHub

### 1. Crear Repositorio en GitHub

1. Ve a [github.com](https://github.com)
2. Haz clic en "New repository"
3. Nombre: `chat-web` (o el que prefieras)
4. **NO** marques "Add a README" (ya tienes uno)
5. Haz clic en "Create repository"

### 2. Subir Archivos (SIN PowerShell)

**Opción A: Desde GitHub Desktop (RECOMENDADO - Más Fácil)**

1. Descarga [GitHub Desktop](https://desktop.github.com) si no lo tienes
2. Abre GitHub Desktop
3. File → Add Local Repository
4. Selecciona la carpeta "Chat web"
5. Verás todos los archivos pendientes
6. Abajo, escribe: "Initial commit - Chat Web"
7. Haz clic en "Commit to main"
8. Haz clic en "Publish repository" o "Push origin"

**Opción B: Desde la Web de GitHub (SIN Descargar Nada)**

1. En tu repositorio nuevo en GitHub, verás instrucciones
2. O haz clic en "uploading an existing file"
3. Arrastra y suelta TODOS los archivos de la carpeta "Chat web"
4. Abajo, escribe: "Initial commit"
5. Haz clic en "Commit changes"

### 3. Verificar Archivos Protegidos

**✅ NO se subirán** (ya están en `.gitignore`):
- `server/.env` - ✅ Protegido
- `node_modules/` - ✅ Protegido
- Archivos temporales - ✅ Protegidos

**✅ SÍ se subirán**:
- `index.html` - ✅
- `vercel.json` - ✅
- `README.md` - ✅
- Todos los archivos de código - ✅

## ⚠️ IMPORTANTE: Seguridad

La URL del webhook está en el código HTML. Esto es **normal y seguro** porque:
- Los webhooks públicos están diseñados para ser accesibles
- No contiene información sensible
- Es necesario para que funcione

## 🔗 Siguiente Paso

Después de subir a GitHub, sigue las instrucciones en `DEPLOY_VERCEL.md` para desplegar en Vercel.

