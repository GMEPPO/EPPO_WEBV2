# Web Interna - Sistema de Gestión de Propuestas

Sistema web para gestión de propuestas, productos y presupuestos con integración a Supabase.

## 🚀 Despliegue en Vercel

### Prerrequisitos

1. Cuenta en [Vercel](https://vercel.com)
2. Cuenta en [Supabase](https://supabase.com)
3. Repositorio Git (GitHub, GitLab o Bitbucket)

### Pasos para Desplegar

#### 1. Preparar el Repositorio Git

```bash
# Inicializar repositorio (si no existe)
git init

# Agregar todos los archivos
git add .

# Hacer commit inicial
git commit -m "Initial commit"

# Conectar con tu repositorio remoto
git remote add origin https://github.com/tu-usuario/tu-repositorio.git

# Subir al repositorio
git push -u origin main
```

#### 2. Configurar Variables de Entorno en Vercel

1. Ve a tu proyecto en [Vercel Dashboard](https://vercel.com/dashboard)
2. Ve a **Settings** → **Environment Variables**
3. Agrega las siguientes variables:

   ```
   VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
   VITE_SUPABASE_ANON_KEY=tu-api-key-aqui
   ```

   **Nota:** También puedes usar los nombres sin el prefijo `VITE_`:
   ```
   SUPABASE_URL=https://tu-proyecto.supabase.co
   SUPABASE_ANON_KEY=tu-api-key-aqui
   ```

#### 3. Conectar Repositorio con Vercel

1. Ve a [Vercel Dashboard](https://vercel.com/dashboard)
2. Haz clic en **Add New Project**
3. Importa tu repositorio Git
4. Vercel detectará automáticamente la configuración
5. Haz clic en **Deploy**

### 📁 Estructura del Proyecto

```
.
├── index.html                 # Página principal
├── admin-productos.html      # Administración de productos
├── carrito-compras.html      # Carrito de compras
├── consultar-propuestas.html # Consulta de propuestas
├── productos-dinamico.html   # Listado de productos
├── supabase-config-universal.js  # Configuración de Supabase
├── vercel.json               # Configuración de Vercel
├── .gitignore                # Archivos ignorados por Git
└── sql/                      # Scripts SQL para la base de datos
```

### 🔧 Configuración Local

Si quieres ejecutar el proyecto localmente:

1. Clona el repositorio:
   ```bash
   git clone https://github.com/tu-usuario/tu-repositorio.git
   cd tu-repositorio
   ```

2. Crea un archivo `.env` (copia de `.env.example`):
   ```bash
   cp .env.example .env
   ```

3. Edita `.env` con tus credenciales de Supabase

4. Usa un servidor local (por ejemplo, con Python):
   ```bash
   # Python 3
   python -m http.server 8000
   
   # O con Node.js (http-server)
   npx http-server
   ```

5. Abre `http://localhost:8000` en tu navegador

### 🔐 Variables de Entorno

El proyecto usa las siguientes variables de entorno:

- `VITE_SUPABASE_URL`: URL de tu proyecto Supabase
- `VITE_SUPABASE_ANON_KEY`: API Key anónima de Supabase

**Importante:** 
- Estas variables son públicas y seguras para usar en el frontend
- Nunca subas el archivo `.env` al repositorio
- Configura estas variables en Vercel antes de hacer deploy

### 📝 Notas Importantes

1. **Rutas:** El proyecto usa rutas relativas, por lo que funciona correctamente en Vercel
2. **SPA:** Vercel está configurado para redirigir todas las rutas a `index.html` (SPA mode)
3. **CORS:** Los headers CORS están configurados para permitir comunicación con Supabase
4. **Seguridad:** Se han configurado headers de seguridad básicos

### 🐛 Solución de Problemas

#### Error 404 en Vercel
Si ves un error 404 al desplegar:
1. **Verifica que `index.html` esté en la raíz del proyecto**
2. **Asegúrate de que `vercel.json` esté en la raíz**
3. **En Vercel Dashboard, ve a Settings → General y verifica:**
   - Framework Preset: "Other" o "Other (Static)"
   - Root Directory: "." (raíz)
   - Build Command: (dejar vacío)
   - Output Directory: "." (raíz)
   - Install Command: (dejar vacío)
4. **Haz un nuevo deploy después de verificar la configuración**

#### El sitio no carga correctamente
- Verifica que las variables de entorno estén configuradas en Vercel
- Revisa los logs de deploy en Vercel Dashboard
- Asegúrate de que todos los archivos HTML, CSS y JS estén en la raíz o en rutas accesibles

#### Error de conexión con Supabase
- Verifica que `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY` estén correctamente configuradas
- Asegúrate de que las políticas RLS en Supabase permitan acceso público (si es necesario)

#### Rutas no funcionan
- Verifica que `vercel.json` tenga la configuración de rewrites correcta
- Asegúrate de que todas las rutas redirijan a `index.html`

### 📚 Recursos

- [Documentación de Vercel](https://vercel.com/docs)
- [Documentación de Supabase](https://supabase.com/docs)
- [Guía de Variables de Entorno en Vercel](https://vercel.com/docs/concepts/projects/environment-variables)

### 📄 Licencia

[Especificar licencia si aplica]

