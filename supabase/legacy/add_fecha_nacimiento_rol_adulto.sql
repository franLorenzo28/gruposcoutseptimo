-- Agregar columnas fecha_nacimiento y rol_adulto a la tabla profiles

ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS fecha_nacimiento DATE,
ADD COLUMN IF NOT EXISTS rol_adulto TEXT;

-- Agregar comentarios para documentar las columnas
COMMENT ON COLUMN profiles.fecha_nacimiento IS 'Fecha de nacimiento del usuario (opcional). Si se completa, la edad se calcula automáticamente.';
COMMENT ON COLUMN profiles.rol_adulto IS 'Rol del usuario si tiene 21 años o más. Opciones: No educador/a, Educador/a, Miembro del Comité, Familiar de Scout';
