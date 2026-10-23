# Plan de mejoras 2026 — Grupo Scout Séptimo

Actualizado: 23 de octubre de 2026.

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

El 21 de octubre se comprobó que los commits `12a5aa5` y `695511c` están en `origin/main`, que Vercel los desplegó y que el sitio y el sitemap publicados responden con HTTP 200. El sitemap publicado incluye `/contacto` y no incluye `/interno`. Se ajustó la descarga de documentos internos: la URL firmada pide el nombre original como adjunto y el navegador inicia la descarga sin depender de ventanas emergentes. Ante un error, el reintento vuelve a solicitar el mismo archivo. Tres pruebas nuevas cubren el contrato de descarga. `pnpm run ci` pasa con 148 pruebas de frontend y 72 de servidor, además de tipos, lint, migraciones y compilación.

La API real de Storage se comprobó el 21 de octubre con `scripts/verify-internal-storage-api.mjs` contra el proyecto enlazado. El script creó cuatro cuentas temporales `@example.invalid` (integrante Rover, educador Rover, educador Manada y cuenta pública), subió un PPP y un formulario mínimos, verificó lectura y descarga con nombre original, denegó lectura y subida a otras unidades o cuentas sin permiso, comprobó que los borrados ajenos no retiraban los objetos y que titular y educador sí podían borrar los propios. El endpoint de metadatos de Storage confirmó el borrado; una descarga inmediata puede servirse desde caché y no es una prueba fiable de eliminación. Requiere credenciales suministradas por variables de entorno y `STORAGE_PROBE_APPROVED=1`; no guarda claves en el repositorio.

La prueba reveló que borrar un usuario Auth dejaba su identidad en `app_users` y su perfil, porque `profiles` referencia `app_users` y no `auth.users`. Se limpiaron 16 filas de `app_users` y 12 perfiles generados por las ejecuciones de prueba. La migración `20261021010000_cleanup_local_identity_on_auth_delete.sql` instala un trigger que elimina la identidad local en la misma transacción que el usuario Auth, con cascada hacia el perfil y las sesiones. Se validó dentro de una transacción con `ROLLBACK`; el `dry-run` de la CLI mostró solo esa migración y después se aplicó al proyecto enlazado. Una nueva ejecución de la prueba verificó la cascada. La consulta final confirmó **cero** usuarios Auth, identidades `app_users`, perfiles, objetos y filas documentales de prueba. Los asesores de seguridad y rendimiento de Supabase no reportaron errores de nivel alto. `pnpm run ci` pasa con 71 migraciones validadas, 148 pruebas de frontend y 72 de servidor.

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
- [x] Probar subida, descarga y borrado mediante la API de Storage con sesiones reales de cuentas de distintas unidades; comprobar también las denegaciones y la limpieza final.
- [x] Corregir la limpieza de `app_users` y perfiles al borrar una cuenta Auth; aplicar la migración y verificar la cascada con cuentas de prueba.
- [x] Publicar el frontend para que las nuevas pantallas queden disponibles fuera del entorno local; Vercel confirmó los despliegues `12a5aa5` y `695511c`.
- [ ] Revisar las cuentas internas activas sin unidad asignada; cuatro integrantes recibieron una asignación por edad durante la migración. El 21 de octubre había 26 cuentas internas activas: 22 sin `internal_unit`, de las cuales 10 son educadores aprobados y 12 requieren revisión administrativa antes de asignar acceso documental.
- [x] Preparar en el panel administrativo un filtro para esas cuentas pendientes y permitir asignarles una unidad sin retirar primero su acceso interno. La selección queda en manos del administrador; una unidad asignada concede acceso documental y no se infiere automáticamente de la edad o del rol. Las cifras anteriores son una fotografía del 21 de octubre y pueden cambiar.
- [x] Resolver los dos registros documentales heredados con la decisión editorial: la imagen de la patrulla Adler de 1966 pertenece a Tropa; el PDF del campamento de distrito de 1965 permanece en Rover y se restaura desde el archivo original facilitado.
- [x] Añadir `scripts/audit-internal-documents.sql` para obtener, sin alterar datos, la unidad, el archivo y el motivo de revisión de cada registro documental heredado. Ejecutar la consulta antes de resolver los dos casos; el equipo debe decidir la unidad de destino del primero y si conserva o retira el registro sin archivo del segundo.

La consulta de solo lectura se ejecutó el 22 de octubre contra el Supabase enlazado y devolvió exactamente esos dos registros: el archivo de `caminantes` existe en Storage y el registro Rover no tiene objeto. No se modificaron archivos ni metadatos.

La revisión administrativa del panel pasó `pnpm run ci` el 22 de octubre: 71 migraciones validadas, 152 pruebas de frontend y 72 del servidor, además de tipos, lint y compilaciones.

El 23 de octubre se restauró `campamento_distrito_1965.pdf` desde el archivo original local; su tamaño (108594 bytes) coincide con el registro. La imagen `patrulla_adler_1966_elias_regules.png` se copió a `rama_tropa/` y se comprobó por SHA-256 antes de cambiar el registro. La base remota tenía una restricción heredada que admitía `caminantes` pero impedía `tropa`; la migración versionada `20261023010000_reclassify_historical_tropa_document.sql` corrige esa restricción y traslada el registro en una transacción. Se probó el SQL completo con `ROLLBACK`; después el `dry-run` mostró únicamente esa migración y se aplicó mediante la CLI de Supabase con un directorio temporal que refleja el historial remoto. Por último se retiró la copia de `rama_caminantes/`. El script `scripts/repair-legacy-documents.mjs` deja verificables las fases de preparación y finalización y requiere autorización explícita para modificar Storage. La auditoría documental devuelve cero casos pendientes, los dos objetos se descargan con el SHA-256 esperado y `scripts/verify-internal-resources-rls.sql` volvió a pasar.

Una prueba adicional con RLS y `ROLLBACK` confirmó que un educador aprobado de Tropa ve la imagen y su objeto de Storage; una cuenta Rover no los ve, pero sí ve el PDF restaurado. `pnpm run ci` pasó con 72 migraciones validadas, 152 pruebas de frontend y 72 del servidor, además de tipos, lint y compilaciones.
