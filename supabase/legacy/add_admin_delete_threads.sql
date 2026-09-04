-- Permitir que admins eliminen cualquier hilo
-- Actualiza la política de DELETE para threads

DROP POLICY IF EXISTS threads_delete_author ON public.threads;
DROP POLICY IF EXISTS threads_delete_author_or_admin ON public.threads;

-- Nueva política: autor O admin puede eliminar
-- Los admins se definen directamente en la política (actualiza el email según necesites)
CREATE POLICY threads_delete_author_or_admin ON public.threads
  FOR DELETE TO authenticated
  USING (
    author_id = auth.uid() 
    OR 
    auth.email() IN ('franciscolorenzo2406@gmail.com', 'otro@admin.com', 'tercero@admin.com')
  );

