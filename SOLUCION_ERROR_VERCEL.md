# 🔧 Solución: Error "Repository does not contain the requested branch"

## ❌ Error

```
The provided GitHub repository does not contain the requested branch 
or commit reference. Please ensure the repository is not empty.
```

## 🔍 Causas Posibles

1. **Repositorio vacío** - No hay archivos subidos
2. **Sin commits** - No se han hecho commits
3. **Rama incorrecta** - La rama "main" no existe
4. **Repositorio no sincronizado** - Los cambios no se subieron

## ✅ Solución Paso a Paso

### Paso 1: Verificar que el Repositorio Tenga Archivos

Abre tu repositorio en GitHub y verifica que tenga:
- ✅ `index.html`
- ✅ `vercel.json`
- ✅ `README.md`
- ✅ Otros archivos del proyecto

**Si está vacío**, sigue el Paso 2.

### Paso 2: Subir Archivos a GitHub

**Opción A: Desde GitHub Desktop**

1. Abre GitHub Desktop
2. File → Add Local Repository
3. Selecciona la carpeta "Chat web"
4. Verás todos los archivos pendientes
5. Escribe un mensaje: "Initial commit"
6. Haz clic en "Commit to main"
7. Haz clic en "Push origin"

**Opción B: Desde la Web de GitHub (SIN PowerShell)**

1. Ve a tu repositorio en GitHub
2. Haz clic en "uploading an existing file"
3. Arrastra y suelta TODOS los archivos de la carpeta "Chat web"
4. Abajo, escribe: "Initial commit - Chat Web"
5. Haz clic en "Commit changes"

### Paso 3: Verificar en GitHub

1. Ve a tu repositorio en GitHub
2. Deberías ver todos los archivos
3. Deberías ver al menos 1 commit

### Paso 4: Intentar de Nuevo en Vercel

1. Ve a Vercel
2. Haz clic en "Add New Project"
3. Selecciona tu repositorio
4. Debería funcionar ahora

## 📋 Checklist

Antes de conectar con Vercel, verifica:

- [ ] El repositorio tiene archivos (no está vacío)
- [ ] Hay al menos 1 commit
- [ ] La rama "main" existe
- [ ] Los archivos están visibles en GitHub

## 🐛 Si el Problema Persiste

### Verificar la Rama

En GitHub, verifica que la rama se llame:
- `main` (recomendado)
- O `master` (antiguo)

En Vercel, asegúrate de seleccionar la rama correcta.

### Verificar que los Archivos Estén Subidos

Los archivos esenciales que DEBEN estar en GitHub:
- ✅ `index.html` - **CRÍTICO**
- ✅ `vercel.json` - **CRÍTICO**
- ✅ `README.md` - Opcional pero recomendado

**NO deben estar** (ya están en .gitignore):
- ❌ `server/.env`
- ❌ `node_modules/`

## 💡 Consejo

Si es la primera vez que subes el proyecto:

1. **Crea el repositorio en GitHub** (vacío está bien)
2. **Sube TODOS los archivos** con un commit
3. **Luego conecta con Vercel**

## 🔄 Si Ya Tienes Archivos en GitHub

1. Verifica que el repositorio no esté vacío
2. Verifica que haya commits
3. En Vercel, intenta:
   - Refrescar la lista de repositorios
   - Seleccionar el repositorio de nuevo
   - Verificar que la rama sea "main"

