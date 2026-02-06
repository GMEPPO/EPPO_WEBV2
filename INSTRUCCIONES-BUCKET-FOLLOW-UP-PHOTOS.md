# Bucket de Supabase: follow-up-photos

Para que las fotos de los follow-ups se guarden y se muestren, hay que crear un **nuevo bucket** en Supabase y configurar sus políticas.

## 1. Crear el bucket

1. Entra en **Supabase Dashboard** → tu proyecto → **Storage**.
2. Pulsa **New bucket**.
3. Configuración:
   - **Name:** `follow-up-photos`
   - **Public bucket:** activado (para poder mostrar las imágenes con URL pública).
   - Opcional: desactiva "Allow file uploads" si prefieres controlarlo solo con políticas.
4. Guarda.

## 2. Políticas RLS del bucket (obligatorio)

El error **"new row violates row-level security policy"** se debe a que el bucket no tiene políticas que permitan INSERT. Hay que crearlas en SQL:

1. En Supabase Dashboard → **SQL Editor** → New query.
2. Copia y ejecuta todo el contenido del archivo **`supabase-storage-policies-follow-up-photos.sql`**.
3. Eso crea las políticas sobre `storage.objects` para el bucket `follow-up-photos`:
   - **SELECT:** lectura pública (ver fotos).
   - **INSERT:** subida permitida (anon y authenticated).
   - **UPDATE / DELETE:** opcionales (reemplazar o borrar archivos).

Si prefieres configurar a mano en la interfaz:

- En **Storage** → **Policies** del bucket `follow-up-photos`:
  - **SELECT:** Policy definition `true` (o `bucket_id = 'follow-up-photos'`).
  - **INSERT:** Policy definition `bucket_id = 'follow-up-photos'`, y asegúrate de que el rol que usa tu app (p. ej. **anon** si usas la anon key) tenga permiso de INSERT.

## 3. Comprobar

Después de crear el bucket y las políticas:

1. Ejecuta la migración de la tabla: `supabase-add-follow-up-photos.sql`.
2. En la app, en Detalles de una propuesta → sección Follow up, deberías poder subir 1 o 2 fotos por follow-up y verlas correctamente.

## Nombre del bucket en código

El código de la aplicación usa el nombre de bucket **`follow-up-photos`**. Si en el Dashboard usas otro nombre, tendrás que cambiarlo también en `consultar-propuestas.js` (búsqueda por `follow-up-photos`).
