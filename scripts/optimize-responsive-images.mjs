import sharp from 'sharp';
import { fileURLToPath } from 'node:url';
import { statSync } from 'node:fs';

const source = fileURLToPath(new URL('../src/assets/hero-scouts.jpg', import.meta.url));
for (const width of [640, 960]) {
  const destination = fileURLToPath(new URL(`../src/assets/hero-scouts-${width}.webp`, import.meta.url));
  await sharp(source).resize(width, null, { withoutEnlargement: true }).webp({ quality: 80 }).toFile(destination);
  console.log(`Hero ${width}px: ${statSync(destination).size} bytes`);
}
