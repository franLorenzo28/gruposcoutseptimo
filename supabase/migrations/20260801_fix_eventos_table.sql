-- Grupo Scout Séptimo - Corregir tabla eventos
-- La tabla existente tiene columnas en inglés, pero el código espera columnas en español

-- Primero eliminar la tabla incorrecta si existe (con columnas en inglés)
DROP TABLE IF EXISTS eventos CASCADE;

-- Crear la tabla eventos con la estructura correcta (columnas en español)
CREATE TABLE eventos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo TEXT NOT NULL,
  descripcion TEXT,
  fecha_inicio TEXT NOT NULL,
  fecha_fin TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Habilitar RLS
ALTER TABLE eventos ENABLE ROW LEVEL SECURITY;

-- Políticas RLS: lectura pública
DROP POLICY IF EXISTS "Anyone can read eventos" ON eventos;
CREATE POLICY "Anyone can read eventos" ON eventos
  FOR SELECT USING (true);

-- Políticas RLS: admins pueden gestionar
DROP POLICY IF EXISTS "Admins can manage eventos" ON eventos;
CREATE POLICY "Admins can manage eventos" ON eventos
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
      AND (p.role IN ('admin', 'mod') OR p.rol_adulto IN ('admin', 'mod'))
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
      AND (p.role IN ('admin', 'mod') OR p.rol_adulto IN ('admin', 'mod'))
    )
  );

-- Insertar algunos eventos de ejemplo
INSERT INTO eventos (titulo, descripcion, fecha_inicio, fecha_fin) VALUES
  ('Servicio de Grupo', 'Actividad de servicio comunitario', '2026-05-30', '2026-05-30'),
  ('Bingo', 'Bingo solidario en la sede del grupo', '2026-06-07', '2026-06-07'),
  ('Campamento de Invierno', 'Campamento para todas las secciones', '2026-06-27', '2026-06-28'),
  ('Lobabi', 'Evento de manada en Parque Rivera', '2026-08-08', '2026-08-08'),
  ('BAUEN', 'Evento de construcción para grupos scouts', '2026-09-26', '2026-09-27'),
  ('Eniesc', 'Evento internacional en Rivera, Uruguay', '2026-10-10', '2026-10-12'),
  ('Última Reunión', 'Última reunión del año', '2026-12-05', '2026-12-05'),
  ('Fogón de Fin de Año', 'Celebración de cierre de año', '2026-12-12', '2026-12-12'),
  ('Campamento de Verano', 'Campamento de verano para todas las secciones', '2027-01-20', '2027-01-24')
ON CONFLICT DO NOTHING;
