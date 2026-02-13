# 🧪 Guía para Probar el Sistema de Roles en Local

## ✅ Verificación de Configuración

Para que el sistema de roles funcione correctamente en local, necesitas:

### 1. Archivo `config.local.js` configurado

Asegúrate de que existe y tiene tus credenciales:
```javascript
window.VITE_SUPABASE_URL = 'https://tu-proyecto.supabase.co';
window.VITE_SUPABASE_ANON_KEY = 'tu-api-key-aqui';
```

### 2. Usar un servidor HTTP local

**NO abras los archivos directamente** desde el explorador (`file://`).

Usa uno de estos métodos:

#### Opción A: Python
```bash
python -m http.server 8000
```

#### Opción B: Node.js
```bash
npx http-server -p 8000
```

Luego abre: `http://localhost:8000`

### 3. Scripts cargados correctamente

Todas las páginas deben cargar estos scripts en este orden:
1. `load-config.js`
2. `supabase-config-universal.js`
3. `auth.js`
4. `roles.js` ← **IMPORTANTE**
5. `menu-hamburguesa.js`

## 🧪 Cómo Probar

### Paso 1: Iniciar sesión

1. Abre `http://localhost:8000/login.html`
2. Inicia sesión con un usuario

### Paso 2: Verificar que el rol se carga

1. Abre la consola del navegador (F12)
2. Deberías ver que el rol se carga automáticamente
3. Ejecuta en la consola:
```javascript
await window.rolesManager.getCurrentUserRole()
```
Debería devolver: `'admin'` o `'comercial'`

### Paso 3: Probar ocultación del menú

#### Si eres ADMIN:
- Deberías ver TODAS las opciones del menú:
  - Comparar
  - Creador/Editor
  - Propuestas
  - Presupuesto

#### Si eres COMERCIAL:
- NO deberías ver:
  - ❌ Comparar
  - ❌ Creador/Editor
- SÍ deberías ver:
  - ✅ Propuestas
  - ✅ Presupuesto

### Paso 4: Probar acceso a páginas protegidas

#### Como COMERCIAL, intenta acceder a:
- `http://localhost:8000/comparar-productos.html`
  - **Resultado esperado:** Redirige a `index.html` con mensaje de error

- `http://localhost:8000/selector-productos.html`
  - **Resultado esperado:** Redirige a `index.html` con mensaje de error

#### Como ADMIN:
- Deberías poder acceder a todas las páginas sin problemas

## 🔍 Verificación en Consola

Abre la consola del navegador (F12) y verifica:

### 1. Scripts cargados
```javascript
typeof window.authManager  // Debe ser "object"
typeof window.rolesManager  // Debe ser "object"
```

### 2. Rol del usuario
```javascript
await window.rolesManager.getCurrentUserRole()
// Debe devolver: 'admin' o 'comercial'
```

### 3. Permisos
```javascript
await window.rolesManager.isAdmin()
// true si es admin, false si es comercial
```

### 4. Verificar elementos ocultos
```javascript
// Estos elementos deberían estar ocultos si eres comercial
document.querySelector('a[href="comparar-productos.html"]').style.display
// Debe ser "none" si eres comercial, "" si eres admin

document.querySelector('a[href="selector-productos.html"]').style.display
// Debe ser "none" si eres comercial, "" si eres admin
```

## ⚠️ Problemas Comunes

### El menú no se oculta
- **Causa:** `roles.js` no está cargado o `menu-hamburguesa.js` se ejecuta antes
- **Solución:** Verifica que `roles.js` esté cargado antes de `menu-hamburguesa.js`

### Error: "rolesManager no disponible"
- **Causa:** `roles.js` no está cargado en la página
- **Solución:** Agrega `<script src="roles.js"></script>` después de `auth.js`

### El rol siempre es "comercial"
- **Causa:** El usuario no tiene rol asignado en la tabla `user_roles`
- **Solución:** Asigna un rol desde Supabase SQL Editor o desde `gestion-usuarios.html`

### No puedo acceder a ninguna página
- **Causa:** Problemas con la autenticación o configuración de Supabase
- **Solución:** Verifica que `config.local.js` tenga las credenciales correctas

## ✅ Checklist de Verificación

- [ ] `config.local.js` existe y tiene credenciales correctas
- [ ] Estás usando un servidor HTTP local (no `file://`)
- [ ] `roles.js` está cargado en todas las páginas
- [ ] Puedes iniciar sesión correctamente
- [ ] El rol se carga después del login
- [ ] El menú se oculta/muestra según el rol
- [ ] Las páginas protegidas redirigen correctamente

¡Listo! Si todo está correcto, el sistema debería funcionar perfectamente en local. 🎉

