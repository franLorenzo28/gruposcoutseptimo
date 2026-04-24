/**
 * Generador de sitemap XML para SEO
 * Ejecutar: node scripts/generate-sitemap.js
 */

import { writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const BASE_URL = process.env.SITE_URL || 'https://gruposcoutseptimo.vercel.app';

const routes = [
  { path: '/', priority: 1.0, changefreq: 'weekly' },
  { path: '/usuarios', priority: 0.9, changefreq: 'daily' },
  { path: '/historia', priority: 0.8, changefreq: 'monthly' },
  { path: '/eventos', priority: 0.9, changefreq: 'weekly' },
  { path: '/bauen', priority: 0.8, changefreq: 'weekly' },
  { path: '/movimiento-scout', priority: 0.7, changefreq: 'monthly' },
  { path: '/contacto', priority: 0.7, changefreq: 'monthly' },
  { path: '/galeria', priority: 0.6, changefreq: 'weekly' },
  { path: '/unidades/manada', priority: 0.7, changefreq: 'monthly' },
  { path: '/unidades/tropa', priority: 0.7, changefreq: 'monthly' },
  { path: '/unidades/pioneros', priority: 0.7, changefreq: 'monthly' },
  { path: '/unidades/rovers', priority: 0.7, changefreq: 'monthly' },
  { path: '/unidades/comite', priority: 0.6, changefreq: 'monthly' },
  { path: '/unidades/staff', priority: 0.6, changefreq: 'monthly' },
];

function generateSitemap() {
  const now = new Date().toISOString();
  
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
        xsi:schemaLocation="http://www.sitemaps.org/schemas/sitemap/0.9
        http://www.sitemaps.org/schemas/sitemap/0.9/sitemap.xsd">
${routes.map(route => `  <url>
    <loc>${BASE_URL}${route.path}</loc>
    <lastmod>${now}</lastmod>
    <changefreq>${route.changefreq}</changefreq>
    <priority>${route.priority}</priority>
  </url>`).join('\n')}
</urlset>`;

  const outputPath = join(__dirname, '../public/sitemap.xml');
  writeFileSync(outputPath, xml, 'utf-8');
  
  console.log('✅ Sitemap generado exitosamente en:', outputPath);
  console.log(`📊 Total de URLs: ${routes.length}`);
}

generateSitemap();
