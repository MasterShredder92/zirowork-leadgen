-- 017: storage policies for the client-uploads bucket (portal Upload view).
-- The bucket had NO policies, so every authenticated upload violated RLS.
-- Tenant-scoped: the path's first folder must be a tenant_id linked to the
-- caller via client_users. APPLIED LIVE 2026-06-09 via management SQL API.

create policy "clients_upload_own_files" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'client-uploads'
    and (storage.foldername(name))[1] in (select tenant_id::text from client_users where user_id = auth.uid())
  );

create policy "clients_read_own_files" on storage.objects
  for select to authenticated
  using (
    bucket_id = 'client-uploads'
    and (storage.foldername(name))[1] in (select tenant_id::text from client_users where user_id = auth.uid())
  );
