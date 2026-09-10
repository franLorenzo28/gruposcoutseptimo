import { rmSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { relative } from 'node:path';

const root = fileURLToPath(new URL('../', import.meta.url));
const target = fileURLToPath(new URL('../dist', import.meta.url));
if (relative(root, target) !== 'dist') throw new Error('Destino de limpieza inválido');
if (process.argv.includes('--dry-run')) console.log(`Se limpiaría: ${target}`);
else {
  rmSync(target, { recursive: true, force: true });
  console.log('Build local eliminado.');
}
