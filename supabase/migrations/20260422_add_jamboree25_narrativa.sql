-- Agregar narrativa del 25º Jamboree Scout Mundial 2023

insert into narrativas (titulo, year_section, bloques, autor_id, fecha_publicacion)
select
  '25º Jamboree Scout Mundial - Corea del Sur 2023',
  '2023',
  jsonb_build_array(
    jsonb_build_object(
      'tipo', 'titulo',
      'contenido', '25º Jamboree Scout Mundial'
    ),
    jsonb_build_object(
      'tipo', 'subtitulo',
      'contenido', 'Dibuja tu Mundo'
    ),
    jsonb_build_object(
      'tipo', 'fecha',
      'contenido', 'Saemangeum, Buan-Gun, Corea del Sur | 1 al 12 agosto 2023'
    ),
    jsonb_build_object(
      'tipo', 'parrafo',
      'contenido', 'El Gobierno de Corea del Sur ha decidido trasladar a cubierto a los más de 150 países participantes en el 25º Jamboree Scout Mundial debido al cambio de rumbo del tifón ''Khanun''.'
    ),
    jsonb_build_object(
      'tipo', 'parrafo',
      'contenido', 'Decenas de miles de jóvenes fueron evacuados del campamento del Jamboree Scout Mundial en Corea del Sur para alejarlos de la trayectoria de un inminente tifón, según informaron los organizadores, días después de que cientos de ellos enfermaran en medio de las altas temperaturas.'
    ),
    jsonb_build_object(
      'tipo', 'parrafo',
      'contenido', 'La tormenta, sumada a la peor ola de calor de los últimos años en el país, aumentó la presión sobre los organizadores, que han tenido que hacer frente a las crecientes quejas de los padres y a la retirada de los contingentes estadounidense y británico.'
    ),
    jsonb_build_object(
      'tipo', 'parrafo',
      'contenido', 'El jefe de los scouts británicos explicó que las preocupaciones sobre la limpieza y la comida, y no sólo el calor, habían motivado su decisión de abandonar la primera reunión mundial de scouts desde la pandemia.'
    ),
    jsonb_build_object(
      'tipo', 'parrafo',
      'contenido', 'Unos 36.000 participantes fueron trasladados en autobús a zonas alejadas de la trayectoria del tifón Khanun, que ya había causado estragos en el sur de Japón. El gobierno de Corea del Sur estuvo buscando sedes y alojamientos alternativos en Seúl y sus alrededores.'
    ),
    jsonb_build_object(
      'tipo', 'parrafo',
      'contenido', 'A pesar de los desafíos climáticos y de infraestructura, el Jamboree continuó adelante. Las autoridades enviaron decenas de camiones cisterna y aparatos de aire acondicionado para mantener frescos a los participantes.'
    ),
    jsonb_build_object(
      'tipo', 'parrafo',
      'contenido', 'Un Jamboree Scout Mundial es un gran campamento de scouts provenientes de todo el mundo, que suele tener lugar cada cuatro años. Su nombre hace referencia a una antigua expresión anglosajona que refiere una ''reunión ruidosa'', que era la idea que tenía el fundador del movimiento Robert Baden-Powell de un encuentro masivo de scouts.'
    )
  ),
  (select id from auth.users where email = 'franciscolorenzo2406@gmail.com' limit 1),
  '2023-08-07'::timestamp
where not exists (
  select 1 from narrativas where titulo = '25º Jamboree Scout Mundial - Corea del Sur 2023'
);
