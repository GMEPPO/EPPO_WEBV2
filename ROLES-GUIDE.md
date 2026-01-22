# 🔐 Guía del Sistema de Roles

## 📋 Roles Disponibles

El sistema tiene 2 roles predefinidos:

### 1. **Admin** (`admin`)
- **Permisos:** Todos (`*`)
- **Acceso completo** a todas las funcionalidades
- Puede gestionar usuarios y asignar roles
- Único rol que puede acceder a:
  - `gestion-usuarios.html`
  - `admin-productos.html`

### 2. **Comercial** (`comercial`) - Por defecto
- **Permisos:**
  - Ver productos
  - Crear propuestas
  - Editar propuestas
  - Ver propuestas
  - Ver stock
- **No puede:** 
  - Editar productos (solo admin)
  - Gestionar usuarios (solo admin)

## 🔧 Uso del Sistema de Roles

### Obtener el rol del usuario actual

```javascript
const role = await window.rolesManager.getCurrentUserRole();
console.log('Rol actual:', role); // 'admin', 'editor', 'viewer', 'comercial'
```

### Verificar permisos

```javascript
// Verificar si tiene un permiso específico
const canEdit = await window.rolesManager.hasPermission('edit-products');

// Verificar si tiene acceso a una página
const hasAccess = await window.rolesManager.hasPageAccess('admin-productos.html');

// Requerir acceso (redirige si no tiene)
await window.rolesManager.requireAccess('admin-productos.html', 'index.html');
```

### Verificar roles específicos

```javascript
// Verificar si es admin
const isAdmin = await window.rolesManager.isAdmin();

// Verificar si tiene un rol específico
const isComercial = await window.rolesManager.hasRole('comercial');
```

### Asignar rol a un usuario (solo admin)

```javascript
// Asignar rol 'editor' a un usuario
const result = await window.rolesManager.assignRole(userId, 'editor');

if (result.success) {
    console.log('Rol asignado correctamente');
} else {
    console.error('Error:', result.error);
}
```

### Obtener información de roles

```javascript
// Obtener todos los roles disponibles
const roles = window.rolesManager.getAvailableRoles();
// [{ value: 'admin', label: 'Administrador' }, ...]

// Obtener información de un rol específico
const roleInfo = window.rolesManager.getRoleInfo('editor');
// { name: 'Editor', permissions: [...] }
```

## 📝 Asignar Roles a Usuarios

### Desde la Interfaz (gestion-usuarios.html)

Si tienes la página `gestion-usuarios.html`, puedes asignar roles desde ahí.

### Desde el Código (solo admin)

```javascript
// Ejemplo: Asignar rol 'comercial' a un usuario
const userId = 'uuid-del-usuario';
const result = await window.rolesManager.assignRole(userId, 'comercial');

if (result.success) {
    alert('Rol asignado correctamente');
} else {
    alert('Error: ' + result.error);
}

// Ejemplo: Asignar rol 'admin' a un usuario
const resultAdmin = await window.rolesManager.assignRole(userId, 'admin');
```

### Desde Supabase SQL Editor

Puedes asignar roles directamente desde Supabase:

```sql
-- Asignar rol 'admin' a un usuario
INSERT INTO public.user_roles (user_id, role)
VALUES ('uuid-del-usuario', 'admin')
ON CONFLICT (user_id) 
DO UPDATE SET role = 'admin', updated_at = NOW();

-- Asignar rol 'comercial' a un usuario
INSERT INTO public.user_roles (user_id, role)
VALUES ('uuid-del-usuario', 'comercial')
ON CONFLICT (user_id) 
DO UPDATE SET role = 'comercial', updated_at = NOW();
```

## 🔒 Control de Acceso en Páginas

El sistema automáticamente controla el acceso según los permisos definidos:

```javascript
// En cualquier página HTML, al inicio:
document.addEventListener('DOMContentLoaded', async function() {
    // Verificar autenticación
    const isAuth = await window.authManager.requireAuth('login.html');
    if (!isAuth) return;
    
    // Verificar permisos para esta página
    const hasAccess = await window.rolesManager.requireAccess(
        window.location.pathname,
        'index.html'
    );
    if (!hasAccess) return;
    
    // Continuar con la carga de la página...
});
```

## ⚠️ Importante

1. **Rol por defecto:** Si un usuario no tiene rol asignado, se le asigna `comercial` automáticamente
2. **Solo admin puede asignar roles:** La función `assignRole()` verifica que el usuario actual sea admin
3. **Los roles se cargan automáticamente** después del login
4. **Los permisos se verifican** antes de permitir acceso a páginas
5. **Roles válidos:** Solo `admin` y `comercial` están disponibles

## 🛠️ Personalización

### Agregar nuevos permisos

Edita `roles.js` y agrega permisos a los roles:

```javascript
'editor': {
    name: 'Editor',
    permissions: [
        'view-products',
        'edit-products',
        'nuevo-permiso' // Agregar aquí
    ]
}
```

### Agregar control de acceso a nuevas páginas

Edita `roles.js` y agrega la página al mapeo:

```javascript
this.pagePermissions = {
    // ... páginas existentes
    'nueva-pagina.html': ['view-products', 'edit-products']
};
```

## 📚 Ejemplos de Uso

### Mostrar/Ocultar elementos según rol

```javascript
const role = await window.rolesManager.getCurrentUserRole();
const isAdmin = role === 'admin';

if (isAdmin) {
    document.getElementById('admin-panel').style.display = 'block';
} else {
    document.getElementById('admin-panel').style.display = 'none';
}
```

### Habilitar/Deshabilitar botones según permisos

```javascript
const canEdit = await window.rolesManager.hasPermission('edit-products');
const editButton = document.getElementById('edit-btn');

editButton.disabled = !canEdit;
if (!canEdit) {
    editButton.title = 'No tienes permiso para editar productos';
}
```

¡Listo! El sistema de roles está completamente integrado y funcionando. 🎉

