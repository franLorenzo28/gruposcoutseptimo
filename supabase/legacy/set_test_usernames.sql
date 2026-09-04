-- Agregar usernames a los usuarios de prueba
-- Ejecutar DESPUÉS de ejecutar add_username_field.sql
-- Este script es seguro para re-ejecutar (usa update con where)

update public.profiles set 
  username = 'maria.gonzalez',
  username_updated_at = now() - interval '8 days'  -- Hace 8 días, puede cambiar
where user_id = 'c2596711-08ce-42dc-b56a-e6384a07f437'
  and (username is null or username != 'maria.gonzalez');

update public.profiles set 
  username = 'juan.perez',
  username_updated_at = now() - interval '3 days'  -- Hace 3 días, NO puede cambiar todavía
where user_id = 'af3b94a7-384b-40e1-8a26-0131341cf391'
  and (username is null or username != 'juan.perez');

update public.profiles set 
  username = 'ana.rodriguez',
  username_updated_at = now() - interval '10 days'  -- Hace 10 días, puede cambiar
where user_id = 'e027845e-dd82-4a72-9ca0-5df77d523d2b'
  and (username is null or username != 'ana.rodriguez');

update public.profiles set 
  username = 'pedro.martinez',
  username_updated_at = now() - interval '1 day'  -- Hace 1 día, NO puede cambiar
where user_id = 'd5d93a82-840c-4c97-acf6-cba8cf9c7bfc'
  and (username is null or username != 'pedro.martinez');
