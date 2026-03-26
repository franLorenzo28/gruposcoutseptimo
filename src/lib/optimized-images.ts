/**
 * Mapeo de imágenes optimizadas
 * Proporciona versiones JPEG comprimidas y WebP de imágenes críticas
 */

import heroJpeg from "@/assets/hero-scouts-optimized.jpg";
import heroWebp from "@/assets/hero-scouts.webp";

import tropaJpeg from "@/assets/tropa-nueva-optimized.jpeg";
import tropaWebp from "@/assets/tropa-nueva.webp";

import communityJpeg from "@/assets/community-scouts-optimized.jpg";
import communityWebp from "@/assets/community-scouts.webp";

import emblemJpeg from "@/assets/scout-emblem-optimized.jpg";
import emblemWebp from "@/assets/scout-emblem.webp";

export const optimizedImages = {
  hero: {
    jpeg: heroJpeg,
    webp: heroWebp,
    size: "852KB → 341KB (60% reducción)",
  },
  tropa: {
    jpeg: tropaJpeg,
    webp: tropaWebp,
    size: "623KB → 164KB (74% reducción)",
  },
  community: {
    jpeg: communityJpeg,
    webp: communityWebp,
    size: "294KB → 127KB (57% reducción)",
  },
  emblem: {
    jpeg: emblemJpeg,
    webp: emblemWebp,
    size: "136KB → 36KB (73% reducción)",
  },
} as const;

/**
 * Helper para usar imágenes optimizadas en OptimizedImage
 * @param key - Clave de la imagen (hero, tropa, community, emblem)
 * @returns { src: string, webpSrc: string } para pasar a OptimizedImage
 */
export function getOptimizedImageProps(
  key: keyof typeof optimizedImages
) {
  const image = optimizedImages[key];
  return {
    src: image.jpeg,
    webpSrc: image.webp,
  };
}
