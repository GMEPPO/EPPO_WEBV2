-- ============================================
-- POLÍTICAS RLS PARA EL BUCKET follow-up-photos
-- Ejecutar en Supabase SQL Editor después de crear el bucket en Storage
-- Soluciona: "new row violates row-level security policy"
-- ============================================

-- 1) Permitir a todos leer (ver fotos) en el bucket follow-up-photos
DROP POLICY IF EXISTS "follow_up_photos_public_read" ON storage.objects;
CREATE POLICY "follow_up_photos_public_read"
ON storage.objects FOR SELECT
USING ( bucket_id = 'follow-up-photos' );

-- 2) Permitir subir archivos al bucket follow-up-photos
--    (anon y authenticated: si tu app usa anon key, necesita INSERT para anon)
DROP POLICY IF EXISTS "follow_up_photos_allow_upload" ON storage.objects;
CREATE POLICY "follow_up_photos_allow_upload"
ON storage.objects FOR INSERT
WITH CHECK ( bucket_id = 'follow-up-photos' );

-- 3) Opcional: permitir actualizar (p. ej. reemplazar imagen)
DROP POLICY IF EXISTS "follow_up_photos_allow_update" ON storage.objects;
CREATE POLICY "follow_up_photos_allow_update"
ON storage.objects FOR UPDATE
USING ( bucket_id = 'follow-up-photos' );

-- 4) Opcional: permitir borrar archivos del bucket
DROP POLICY IF EXISTS "follow_up_photos_allow_delete" ON storage.objects;
CREATE POLICY "follow_up_photos_allow_delete"
ON storage.objects FOR DELETE
USING ( bucket_id = 'follow-up-photos' );
