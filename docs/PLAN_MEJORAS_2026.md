# Plan de mejoras 2026 — Grupo Scout Séptimo

Actualizado: 16 de octubre de 2026.

## Objetivo

Facilitar que nuevas familias y jóvenes conozcan el grupo y se comuniquen para sumarse; mejorar la claridad visual, accesibilidad y confianza del sitio público; y convertir gradualmente los módulos pendientes de la plataforma interna en herramientas útiles con permisos reales.

## Orden de trabajo y criterios de aceptación

### Fase 1 — Recorrido para sumarse

- [x] Mostrar **Quiero sumarme** en la primera pantalla de escritorio y móvil sin perder la identidad visual scout.
- [x] Simplificar los accesos secundarios de portada y enlazar unidades, edades, primera visita y contacto.
- [x] En contacto, indicar el siguiente paso, validar el formulario, conservar sus datos ante un error y ofrecer correo como alternativa.
- [x] Verificar el recorrido con ratón, teclado y tamaños móvil/escritorio.

### Fase 2 — Calidad pública

- [x] Revisar contraste, foco, texto alternativo, movimiento reducido y estados de carga/error en las páginas públicas principales.
- [x] Actualizar metadatos que quedaron fechados y generar el sitemap solo con rutas públicas indexables y accesibles sin cuenta.
- [x] Eliminar los botones inactivos de privacidad y términos hasta disponer de contenido aprobado.
- [x] Evitar que un fallo de carga de eventos parezca una cartelera oficial actualizada.

### Fase 3 — Plataforma interna existente

- [x] Hacer que el tablero y la navegación destaquen acciones disponibles y comuniquen claramente los módulos en preparación.
- [x] Diferenciar los eventos y datos compartidos de los que se guardan únicamente en este navegador.
- [x] Mejorar mensajes vacíos y de error con una acción útil, sin simular persistencia.

### Fase 4 — Módulos internos en Supabase

- [x] Clasificar los documentos por unidad como generales, formularios descargables o recursos de biblioteca; añadir restricciones de lectura y publicación con RLS y Storage a la migración.
- [x] Mostrar Formularios y Biblioteca como colecciones descargables, sin respuestas ni firmas digitales.
- [x] Hacer que Planificación utilice la agenda de la unidad como fuente de actividades.
- [x] Preparar archivos persistentes de Progresión personal con acceso del titular y supervisión de educadores autorizados mediante políticas de Supabase.
- [x] Mantener el backend local actual operativo y comunicar allí cuáles funciones nuevas requieren Supabase.
- [x] Añadir migraciones al repositorio y aplicarlas con la CLI de migraciones, no desde el panel de Supabase.

## Verificación

Ejecutar `pnpm type-check`, `pnpm lint`, `pnpm test` y `pnpm check:migrations`; comprobar visualmente inicio y contacto en móvil y escritorio. Para los módulos nuevos, probar lectura, publicación, descarga y denegación de acceso con usuarios de distintas unidades y sin acceso interno.

Estado inicial: TypeScript y ESLint sin errores; 26 archivos de pruebas y 136 pruebas aprobadas.

Estado de implementación: `pnpm type-check`, `pnpm lint`, `pnpm test` (27 archivos, 145 pruebas), `pnpm check:migrations` (70 archivos) y `pnpm build` aprobados. En navegador se comprobó el botón principal en la primera pantalla, acceso con Tab, foco en el formulario, conservación de los campos ante un error de envío simulado y envío correcto tras reintentar.

El 16 de octubre se aplicó `20261016010000_internal_resources_ppp.sql` al proyecto Supabase enlazado. Antes se verificó el SQL completo dentro de una transacción con `ROLLBACK` y se guardaron fuera del repositorio una copia del esquema y un archivo recuperable de las tablas afectadas. Se usó un directorio temporal de migraciones que refleja las versiones remotas aplicadas, porque el historial local contiene 20 SQL antiguos pendientes que bloquean `db push` sobre el árbol completo. El `dry-run` mostró únicamente esta migración nueva.

Después se comprobó que las cinco filas documentales existentes conservan la categoría `general`, los buckets `rama-documentos` y `ppp-files` son privados y el historial registra la nueva versión. `scripts/verify-internal-resources-rls.sql` pasó contra la base enlazada: simuló un integrante Rover, educadores aprobados de Rovers y Manada y una cuenta pública; verificó lectura, inserciones permitidas o denegadas, PPP y visibilidad de Storage. Todas las filas de prueba terminaron en `ROLLBACK`. Los asesores de seguridad y rendimiento de Supabase no reportaron errores de nivel alto. También pasó `pnpm run ci`: 145 pruebas de frontend y 72 pruebas de servidor.

## Decisiones y revisión editorial

- La primera prioridad de código es la portada y el recorrido hacia contacto.
- Formularios significa documentos descargables en esta versión.
- La implementación nueva de datos internos se hace primero en Supabase.
- Se conservan visibles las cifras actuales, por decisión editorial del proyecto. Antes de actualizarlas, confirmar la fuente y fecha de **+61 años**, **+100 scouts**, **+25 educadores**, **+20 personas del comité** y **1 local scout**. El texto fijo de metadatos puede usar «desde 1964» para evitar que la descripción quede desactualizada.
- No se publicarán textos de política de privacidad ni términos inventados.
- Confirmar con el equipo la edad final de Rovers: algunas páginas públicas indican 18 a 21 años y partes de la plataforma interna usan 18 a 20. El formulario presenta las edades como orientativas y pide consultar al equipo.

## Avances

- [x] Revisión de rutas, portada, contacto, tablero interno y esquema documental existente.
- [x] Capturas de portada en 1440 × 900 y 390 × 844; el botón principal queda por debajo de la primera pantalla en escritorio.
- [x] Implementación y verificación visual de fase 1: portada en 1440 × 900 y 390 × 844, acceso al formulario y validación de campos vacíos.
- [x] Implementación de fase 2 y nueve pruebas de rutas SEO y sitemap.
- [x] Implementación de fase 3, con aviso explícito de que la agenda se guarda en el navegador.
- [x] Implementación de fase 4 en código y migración versionada; validación de nombres y orden de migraciones.
- [x] Aplicar la migración con la CLI y comprobar RLS con identidades existentes simuladas en transacciones reversibles.
- [ ] Probar subida, descarga y borrado mediante la API de Storage con sesiones reales de cuentas de distintas unidades. La protección propia de Storage impide probar borrado con SQL directo.
- [ ] Publicar el frontend para que las nuevas pantallas queden disponibles fuera del entorno local.
- [ ] Revisar las cuentas internas activas sin unidad asignada; cuatro integrantes recibieron una asignación por edad durante la migración y las demás requieren decisión administrativa antes de obtener acceso documental.
- [ ] Revisar dos registros documentales heredados: uno de la antigua unidad `caminantes`, fuera de las unidades vigentes, y uno Rover cuyo objeto de Storage ya no existe. Se preservaron para una decisión editorial y administrativa.
