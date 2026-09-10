import { copyFileSync, constants, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const root = fileURLToPath(new URL('../', import.meta.url));
if (Number(process.versions.node.split('.')[0]) < 22) {
  console.error('El proyecto requiere Node 22 o superior.');
  process.exit(1);
}
const pnpm = process.env.npm_execpath;
if (!pnpm) {
  console.error('Ejecuta este asistente con pnpm run setup.');
  process.exit(1);
}
if (process.argv.includes('--check')) {
  console.log(`Entorno compatible: Node ${process.versions.node}.`);
  process.exit(0);
}
const install = spawnSync(process.execPath, [pnpm, 'install', '--frozen-lockfile'], {
  cwd: root, stdio: 'inherit',
});
if (install.error || install.status !== 0) process.exit(install.status || 1);
for (const [template, target] of [['.env.example', '.env.local'], ['server/.env.example', 'server/.env']]) {
  const source = new URL('../' + template, import.meta.url);
  const destination = new URL('../' + target, import.meta.url);
  if (existsSync(source) && !existsSync(destination)) {
    copyFileSync(source, destination, constants.COPYFILE_EXCL);
    console.log(`Creado ${target}. Completa sus valores antes de iniciar.`);
  }
}
console.log('Instalación completa. Inicia web y API con pnpm run dev.');
