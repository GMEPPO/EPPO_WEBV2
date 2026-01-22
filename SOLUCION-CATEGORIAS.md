# 🔧 Solución: Categorías no se muestran en Home

## 🔍 Diagnóstico

El problema **NO es de roles** - el código JavaScript no bloquea la carga de categorías según el rol. El problema probablemente está en **Supabase RLS (Row Level Security)**.

## ✅ Verificación Rápida

Abre la consola del navegador (F12) y busca estos mensajes:

1. **Si ves:** `🔄 Inicializando Supabase...`
   - ✅ Supabase se está inicializando

2. **Si ves:** `🔄 Cargando categorías desde Supabase...`
   - ✅ La consulta se está ejecutando

3. **Si ves:** `❌ Error de Supabase:` seguido de un error
   - ❌ Hay un problema con la consulta o permisos

4. **Si ves:** `✅ Categorías cargadas: 0`
   - ⚠️ No hay categorías en la base de datos o están inactivas

## 🔐 Solución: Configurar RLS en Supabase

El problema más probable es que las políticas RLS en Supabase están bloqueando el acceso a la tabla `categorias_geral`.

### Paso 1: Ir a Supabase Dashboard

1. Ve a [Supabase Dashboard](https://app.supabase.com)
2. Selecciona tu proyecto
3. Ve a **Authentication** → **Policies**

### Paso 2: Verificar políticas de `categorias_geral`

1. Ve a **Table Editor** → `categorias_geral`
2. Haz clic en la pestaña **Policies**
3. Verifica que exista una política que permita **SELECT** a usuarios autenticados

### Paso 3: Crear política si no existe

Si no hay política, crea una nueva:

**Nombre:** `Allow authenticated users to read categorias_geral`

**Comando SQL:**
```sql
-- Permitir a usuarios autenticados leer categorías
CREATE POLICY "Allow authenticated users to read categorias_geral"
ON public.categorias_geral
FOR SELECT
TO authenticated
USING (true);
```

O desde el Dashboard:
1. Haz clic en **New Policy**
2. Selecciona **For full customization**
3. Nombre: `Allow authenticated users to read categorias_geral`
4. Allowed operation: `SELECT`
5. Target roles: `authenticated`
6. USING expression: `true`
7. Guarda

### Paso 4: Verificar que RLS esté habilitado

1. Ve a **Table Editor** → `categorias_geral`
2. Verifica que **RLS Enabled** esté activado (debe estar activado)
3. Si no está activado, actívalo

## 🧪 Verificación en Consola

Después de configurar las políticas, recarga la página y verifica en la consola:

```javascript
// Verificar que puedes hacer consultas
const client = await window.universalSupabase.getClient();
const { data, error } = await client
    .from('categorias_geral')
    .select('*')
    .eq('tipo', 'home')
    .eq('is_active', true)
    .limit(5);

console.log('Datos:', data);
console.log('Error:', error);
```

## 📋 Checklist

- [ ] Usuario está autenticado (verificado en consola)
- [ ] RLS está habilitado en `categorias_geral`
- [ ] Existe política que permite SELECT a `authenticated`
- [ ] Hay categorías en la base de datos con `tipo = 'home'` y `is_active = true`
- [ ] No hay errores en la consola del navegador

## 🔍 Otros Problemas Posibles

### 1. No hay categorías en la base de datos

Verifica en Supabase:
```sql
SELECT * FROM categorias_geral 
WHERE tipo = 'home' AND is_active = true;
```

Si no hay resultados, crea categorías desde `admin-productos.html` o directamente en Supabase.

### 2. Problema de conexión con Supabase

Verifica en la consola:
- ¿Aparece `✅ Supabase inicializado correctamente`?
- ¿Hay errores de CORS o conexión?

### 3. Elemento HTML no existe

Verifica que exista:
```html
<div id="categoriesGrid"></div>
```

## 💡 Solución Rápida (Temporal)

Si necesitas una solución temporal mientras configuras RLS, puedes deshabilitar RLS temporalmente (NO recomendado para producción):

```sql
ALTER TABLE public.categorias_geral DISABLE ROW LEVEL SECURITY;
```

**⚠️ IMPORTANTE:** Esto es solo para desarrollo. En producción, siempre usa políticas RLS adecuadas.

## ✅ Después de Configurar

1. Recarga la página (F5)
2. Deberías ver las categorías cargándose
3. En la consola deberías ver: `✅ Categorías cargadas: X`

¡Listo! El problema debería estar resuelto. 🎉

