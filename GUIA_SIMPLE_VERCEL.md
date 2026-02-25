# 🚀 Guía Simple: De Cero a Vercel (SIN PowerShell)

## ✅ Todo se hace desde el navegador - No necesitas PowerShell

---

## 📋 Paso 1: Subir a GitHub

### 1.1 Crear Repositorio

1. Ve a [github.com](https://github.com) e inicia sesión
2. Haz clic en el **"+"** (arriba derecha) → **"New repository"**
3. Nombre: `chat-web`
4. **NO** marques "Add a README"
5. Haz clic en **"Create repository"**

### 1.2 Subir Archivos (2 Opciones)

**Opción A: GitHub Desktop (Recomendado)**

1. Descarga [GitHub Desktop](https://desktop.github.com)
2. Instálalo y ábrelo
3. Inicia sesión con tu cuenta de GitHub
4. **File** → **Add Local Repository**
5. Haz clic en **"Choose..."** y selecciona la carpeta **"Chat web"**
6. Verás todos los archivos pendientes
7. Abajo, escribe: **"Initial commit - Chat Web"**
8. Haz clic en **"Commit to main"**
9. Haz clic en **"Publish repository"** (o "Push origin" si ya existe)

**Opción B: Desde la Web (Sin Descargar Nada)**

1. En tu repositorio nuevo en GitHub, verás una página con instrucciones
2. Haz clic en **"uploading an existing file"**
3. Arrastra y suelta **TODOS** los archivos de la carpeta "Chat web"
4. Abajo, escribe: **"Initial commit - Chat Web"**
5. Haz clic en **"Commit changes"**

### 1.3 Verificar

Ve a tu repositorio en GitHub y verifica que veas:
- ✅ `index.html`
- ✅ `vercel.json`
- ✅ `README.md`
- ✅ Otros archivos

---

## 📋 Paso 2: Desplegar en Vercel

### 2.1 Conectar con Vercel

1. Ve a [vercel.com](https://vercel.com)
2. Haz clic en **"Sign Up"** o **"Log In"**
3. Elige **"Continue with GitHub"**
4. Autoriza a Vercel a acceder a tus repositorios

### 2.2 Crear Proyecto

1. Haz clic en **"Add New Project"**
2. Selecciona tu repositorio **"chat-web"**
3. Configuración:
   - **Framework Preset**: `Other`
   - **Root Directory**: `./` (dejar como está)
   - **Build Command**: (dejar vacío)
   - **Output Directory**: (dejar vacío)
4. Haz clic en **"Deploy"**

### 2.3 ¡Listo!

Vercel te dará una URL como:
```
https://chat-web.vercel.app
```

Abre esa URL y tu chat debería funcionar perfectamente.

---

## ✅ Resumen

1. **GitHub**: Sube archivos (GitHub Desktop o Web)
2. **Vercel**: Conecta el repositorio y despliega
3. **¡Listo!** Tu chat funciona online

**NO necesitas:**
- ❌ PowerShell
- ❌ Terminal
- ❌ Git desde línea de comandos
- ❌ Instalar nada (excepto GitHub Desktop si eliges esa opción)

---

## 🐛 Si Algo Sale Mal

### Error: "Repository is empty"
- **Solución**: Asegúrate de haber subido los archivos en el Paso 1

### Error: "Branch not found"
- **Solución**: Verifica que hayas hecho un commit (Paso 1.2)

### No veo mi repositorio en Vercel
- **Solución**: Refresca la página o verifica que hayas autorizado a Vercel

---

## 💡 Consejos

- Usa **GitHub Desktop** si no estás familiarizado con Git
- Es más fácil y visual
- Todo se hace con clics, sin escribir comandos

