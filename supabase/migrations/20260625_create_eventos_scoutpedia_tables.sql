-- Grupo Scout Séptimo - Tablas de configuracion editable
-- Eventos y Scoutpedia

-- Tabla de eventos
CREATE TABLE IF NOT EXISTS eventos (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  date TEXT NOT NULL,
  location TEXT NOT NULL,
  participants TEXT NOT NULL,
  type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'Confirmado',
  image TEXT,
  href TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Tabla de temas de scoutpedia
CREATE TABLE IF NOT EXISTS scoutpedia_topics (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  category TEXT NOT NULL,
  icon TEXT NOT NULL,
  eyebrow TEXT NOT NULL,
  summary TEXT NOT NULL,
  paragraphs JSONB NOT NULL DEFAULT '[]',
  bullets JSONB,
  note TEXT,
  featured BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Insertar eventos iniciales
INSERT INTO eventos (title, date, location, participants, type, status, sort_order) VALUES
  ('Servicio de Grupo', '30 de Mayo, 2026', 'Sede del Grupo', 'Todos los secciones', 'Servicio', 'Confirmado', 1),
  ('Bingo', '7 de Junio, 2026', 'Sede del Grupo', 'Tropa', 'Evento de un dia', 'Confirmado', 2),
  ('Campamento Invierno', '27 y 28 de Junio, 2026', 'A confirmar', 'Todas las secciones', 'Campamento de 2 dias', 'Confirmado', 3),
  ('Lobabi', '8 de Agosto, 2026', 'Parque Rivera', 'Manada', 'Evento de un dia', 'Confirmado', 4),
  ('BAUEN', '26 y 27 de Septiembre, 2026', 'Parque Baroffio', 'Grupos Scouts de todo el pais', 'Evento Construccion de 2 dias', 'Confirmado', 5),
  ('Eniesc', '10, 11 y 12 de Octubre, 2026', 'Rivera, Uruguay', 'Tropa, Pioneros y Rovers', 'Evento internacional', 'Confirmado', 6),
  ('Ultima Reunion', '5 de Diciembre, 2026', 'Sede del Grupo', 'Todas las secciones', 'Evento de un dia', 'Confirmado', 7),
  ('Fogón de Fin de Ano', '12 de Diciembre, 2026', 'Sede del Grupo', 'Todas las secciones', 'Evento de un dia', 'Confirmado', 8),
  ('Campamento de Verano', '20 al 24 de Enero, 2027', 'A confirmar', 'Todas las secciones', 'Campamento de 5 dias', 'Confirmado', 9)
ON CONFLICT DO NOTHING;

-- Insertar temas iniciales de scoutpedia
INSERT INTO scoutpedia_topics (id, title, category, icon, eyebrow, summary, paragraphs, featured) VALUES
  ('baden-powell', 'Sir Baden-Powell of Gilwell', 'referentes', 'User', 'Fundador', '1857-1941. Impulsor del Movimiento Scout y su marco educativo.', ARRAY[
    'Vivio servicio militar activo en India y Africa antes de la Guerra de los Boers en Sur Africa.',
    'Por su trabajo en la organizacion de los movimientos Boy Scouts y Girl Scouts recibio el titulo de Sir en 1929.',
    'Entre sus publicaciones destacan Escultismo para Muchachos (1908), Rovering to Success (1922) y Scouting and Youth Movements (1929).',
    'A partir de la observacion del juego identifica la pertenencia a pequenos grupos y la vida comunitaria como dinamismos centrales para educar.'
  ], true),
  ('roland-philipps', 'Roland Erasmus Philipps', 'referentes', 'Trophy', 'Colaborador clave', '1890-1916. Referente temprano del Sistema de Patrullas.', ARRAY[
    'Fue politico, militar y escritor britanico. Colaboro con Baden-Powell en los primeros anos del Movimiento Scout.',
    'Se desempeno como Comisionado Scout entre 1912 y 1914.',
    'Escribio El Sistema de Patrullas, obra complementaria a Escultismo para Muchachos.'
  ], false),
  ('kipling', 'Rudyard Kipling', 'referentes', 'Sparkles', 'Inspiracion literaria', 'Autor de El Libro de la Selva, base simbolica de la mistica de manada.', ARRAY[
    'Nacio en Bombay en 1865 y fallecio en Londres en 1936.',
    'Trabajo como periodista en India y luego escribio obras para ninos y adultos.',
    'Recibio el Premio Nobel de Literatura en 1907.',
    'Sus textos aportaron relatos y simbolos adoptados pedagogicamente por el escultismo.'
  ], false),
  ('metodo-scout', 'El Metodo Scout', 'metodo', 'Users', 'Aprender en equipo', 'Propuesta de aventura en pequenos grupos mediante el Sistema de Patrullas.', ARRAY[
    'El metodo propone aprender haciendo, en comunidad y con responsabilidades reales.',
    'Cada joven aprende a trabajar, compartir y relaciones con otros en una pequena comunidad a su medida.',
    'El sistema de equipos organiza la vida grupal y sostiene la estructura de cada seccion del Grupo Scout.'
  ], false),
  ('sistema-patrullas', 'El Sistema de Patrullas', 'metodo', 'Flag', 'Organizacion educativa', 'Elemento central del metodo para desarrollar autonomia y responsabilidad.', ARRAY[
    'El objetivo principal es conceder responsabilidad real al mayor numero posible de muchachos.',
    'Cada integrante asume un rol definido para el bienestar de su patrulla y de la tropa.',
    'Generalmente organiza pequenos equipos de seis u ocho jovenes con un guia que coordina actividades.'
  ], false),
  ('escultismo-para-muchachos', 'Escultismo para Muchachos', 'obras', 'BookOpen', 'Texto fundacional', 'Manual publicado en 1908: base doctrinal y practica del movimiento.', ARRAY[
    'Scouting for Boys fue publicado por primera vez en Londres en 1908.',
    'Es uno de los libros mas vendidos y traducidos del siglo XX.',
    'Invita a los jovenes a ser protagonistas de sus actividades, con foco en responsabilidad, familia y naturaleza.'
  ], false),
  ('primeros-cuatro-meses', 'Los Primeros Cuatro Meses de una Tropa Scout', 'biblioteca', 'Library', 'Archivo bibliografico', 'Segunda edicion (1981), impreso en Costa Rica, 49 paginas.', ARRAY[
    'Publicado por Editorial Scout Interamericana.',
    'Firmado por Patricia Lodigiani (7-SET-1987).',
    'En custodia por Leopoldo Lecour (ABR-2022).'
  ], false),
  ('manual-jefe-tropa', 'Manual para el Jefe de Tropa y sus Ayudantes', 'biblioteca', 'FileText', 'Archivo bibliografico', 'Cuarta edicion, noviembre 1981, 278 paginas.', ARRAY[
    'Publicado por Editorial Scout Interamericana e impreso en Costa Rica.',
    'Manual forrado en plastico transparente, en buen estado.',
    'Firmado por Patricia Lodigiani (7-SET-1987).',
    'En custodia por Leopoldo Lecour (ABR-2022).'
  ], false),
  ('ciudadanos-del-manana', 'Manual para Scouts - Ciudadanos del Manana', 'biblioteca', 'BookOpen', 'Archivo bibliografico', 'Octava edicion, 1973, 562 paginas.', ARRAY[
    'Guia para la diversion, la aventura y el servicio comunitario.',
    'Fue entregado como premio a Miguel Alonso (patrulla BUFFEL), ganadora de COMORISCO 1975.',
    'Donado por VCS (ANBSU), firmado por Josefina Hernan de Bordaberry.',
    'En custodia por Leopoldo Lecour (ABR-2022).'
  ], false),
  ('libro-selva', 'El Libro de la Selva', 'mistica', 'Flame', 'Mistica de manada', 'Publicado en 1894. Referencia simbolica para lobatos.', ARRAY[
    'La obra aporta historias con lecciones morales a traves de personajes de la selva india.',
    'Las historias de Mowgli en la manada de Seonee inspiran la mistica usada en lobatos.',
    'Bandar-Log representa conductas opuestas a los valores que la manada transmite.'
  ], false)
ON CONFLICT DO NOTHING;

-- Habilitar RLS
ALTER TABLE eventos ENABLE ROW LEVEL SECURITY;
ALTER TABLE scoutpedia_topics ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para lectura pública
DROP POLICY IF EXISTS "Anyone can read eventos" ON eventos;
CREATE POLICY "Anyone can read eventos" ON eventos FOR SELECT USING (true);

DROP POLICY IF EXISTS "Anyone can read scoutpedia_topics" ON scoutpedia_topics;
CREATE POLICY "Anyone can read scoutpedia_topics" ON scoutpedia_topics FOR SELECT USING (true);

-- Políticas RLS para admins (usuarios autenticados con rol admin/mod)
DROP POLICY IF EXISTS "Admins can manage eventos" ON eventos;
CREATE POLICY "Admins can manage eventos" ON eventos FOR ALL 
USING (
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

DROP POLICY IF EXISTS "Admins can manage scoutpedia_topics" ON scoutpedia_topics;
CREATE POLICY "Admins can manage scoutpedia_topics" ON scoutpedia_topics FOR ALL 
USING (
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