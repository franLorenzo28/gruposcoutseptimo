#!/usr/bin/env node

import sharp from "sharp";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ASSETS_DIR = path.join(__dirname, "../src/assets");

// Imágenes a optimizar con sus configuraciones
const imagesToOptimize = [
  {
    input: "hero-scouts.jpg",
    // Ancho hero típico en desktop: ~1200px
    width: 1200,
    compress: { quality: 85 },
  },
  {
    input: "tropa-nueva.jpeg",
    width: 1000,
    compress: { quality: 80 },
  },
  {
    input: "community-scouts.jpg",
    width: 900,
    compress: { quality: 82 },
  },
  {
    input: "scout-emblem.jpg",
    width: 400,
    compress: { quality: 80 },
  },
];

async function optimizeImages() {
  console.log("🖼️  Optimizando imágenes...\n");
  let totalKBBefore = 0;
  let totalKBSaved = 0;

  for (const image of imagesToOptimize) {
    const inputPath = path.join(ASSETS_DIR, image.input);

    if (!fs.existsSync(inputPath)) {
      console.warn(`⚠️  No encontrado: ${image.input}`);
      continue;
    }

    const inputSize = fs.statSync(inputPath).size / 1024;
    totalKBBefore += inputSize;

    try {
      const basename = path.basename(inputPath, path.extname(inputPath));
      const ext = path.extname(inputPath).toLowerCase();
      const optimizedPath = path.join(
        ASSETS_DIR,
        `${basename}-optimized${ext}`
      );
      const webpPath = path.join(ASSETS_DIR, `${basename}.webp`);

      // Crear versión comprimida
      await sharp(inputPath)
        .resize(image.width, null, { withoutEnlargement: true })
        .jpeg({ quality: image.compress.quality })
        .toFile(optimizedPath);

      // Crear versión WebP
      await sharp(inputPath)
        .resize(image.width, null, { withoutEnlargement: true })
        .webp({ quality: image.compress.quality })
        .toFile(webpPath);

      const optimizedSize = fs.statSync(optimizedPath).size / 1024;
      const webpSize = fs.statSync(webpPath).size / 1024;
      const bestSize = Math.min(optimizedSize, webpSize);
      const savings = inputSize - bestSize;
      totalKBSaved += savings;

      const savingsPercent = ((savings / inputSize) * 100).toFixed(1);
      console.log(
        `✅ ${image.input}: ${inputSize.toFixed(1)}KB original`
      );
      console.log(
        `   → JPEG optimizado: ${optimizedSize.toFixed(1)}KB (${savingsPercent}% reducción)`
      );
      console.log(`   → WebP: ${webpSize.toFixed(1)}KB`);
    } catch (error) {
      console.error(`❌ Error optimizando ${image.input}:`, error.message);
    }
  }

  console.log("\n📊 Resumen:");
  console.log(
    `Total original: ${totalKBBefore.toFixed(1)}KB`
  );
  console.log(`Bytes ahorrados: ${totalKBSaved.toFixed(1)}KB`);
  console.log(
    `Reducción potencial: ${((totalKBSaved / totalKBBefore) * 100).toFixed(1)}%\n`
  );
  console.log(
    "💡 Se crearon versiones optimizadas con sufijo -optimized (.jpg/.jpeg) y .webp"
  );
  console.log("   Actualiza componentes para usar estas versiones.\n"
  );
}

optimizeImages().catch(console.error);
