import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { gzipSync } from 'node:zlib';
import ts from 'typescript';

const root = fileURLToPath(new URL('../', import.meta.url));
const dist = path.join(root, 'dist');
const html = fs.readFileSync(path.join(dist, 'index.html'), 'utf8');
const entry = html.match(/<script[^>]*src="([^"]+\.js)"/)?.[1];
if (!entry) throw new Error('No se encontró el script inicial. Ejecuta primero el build.');
const chunks = new Map();
for (const name of fs.readdirSync(path.join(dist, 'assets')).filter(name => name.endsWith('.js'))) {
  const file = 'assets/' + name;
  const contents = fs.readFileSync(path.join(dist, file));
  const ast = ts.createSourceFile(file, contents.toString(), ts.ScriptTarget.Latest);
  const imports = ast.statements.flatMap(statement => {
    if ((ts.isImportDeclaration(statement) || ts.isExportDeclaration(statement)) && statement.moduleSpecifier && ts.isStringLiteral(statement.moduleSpecifier)) {
      const spec = statement.moduleSpecifier.text;
      return spec.startsWith('.') ? [path.posix.normalize(path.posix.join('assets', spec))] : [];
    }
    return [];
  });
  chunks.set(file, { file, bytes: contents.length, gzip: gzipSync(contents).length, imports });
}
function reachable(entries) {
  const visited = new Set();
  function visit(file) {
    if (visited.has(file) || !chunks.has(file)) return;
    visited.add(file);
    chunks.get(file).imports.forEach(visit);
  }
  entries.forEach(visit);
  const files = [...visited].map(file => chunks.get(file));
  return { bytes: files.reduce((sum, file) => sum + file.bytes, 0), gzip: files.reduce((sum, file) => sum + file.gzip, 0), files: files.map(file => file.file) };
}
const initialEntry = entry.replace(/^\//, '');
const homeEntry = [...chunks.keys()].find(file => /\/Inicio-/.test(file));
const report = {
  initial: reachable([initialEntry]),
  home: reachable([initialEntry, ...(homeEntry ? [homeEntry] : [])]),
  chunks: [...chunks.values()].sort((a, b) => b.bytes - a.bytes),
};
const output = path.resolve(root, process.argv[2] || 'artifacts/bundle-analysis.json');
fs.mkdirSync(path.dirname(output), { recursive: true });
fs.writeFileSync(output, JSON.stringify(report, null, 2));
console.log(`JS inicial: ${report.initial.bytes} bytes (${report.initial.gzip} gzip).`);
console.log(`JS portada: ${report.home.bytes} bytes (${report.home.gzip} gzip).`);
console.log(`Informe: ${output}`);
