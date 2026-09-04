-- Cambiar novedad de eventos por actualización de jamboree
update novedades 
set titulo = 'Actualización de Jamboree', 
    descripcion = 'Se han actualizado los detalles y nueva información de los Jamborees históricos del grupo scout.',
    href = '/eventos/jamborees'
where titulo = 'Sistema de eventos mejorado';
