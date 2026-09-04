// El adaptador SQLite es legado y se retirará al migrar las rutas Express.
// Se limita el shim a este módulo para no desactivar los tipos del resto del servidor.
declare module "better-sqlite3";
