CREATE POLICY "avatars_read_team" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'avatars');
CREATE POLICY "avatars_insert_own" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "avatars_update_own" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "avatars_delete_own" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'avatars' AND ((storage.foldername(name))[1] = auth.uid()::text OR public.is_admin()));

CREATE POLICY "workspace_read_team" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'workspace');
CREATE POLICY "workspace_insert_own" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'workspace' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "workspace_update_own" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'workspace' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "workspace_delete_own" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'workspace' AND ((storage.foldername(name))[1] = auth.uid()::text OR public.is_admin()));