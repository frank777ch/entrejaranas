import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const enlace = () => z.url({ protocol: /^https?$/ });

// Cada colección es una carpeta dentro de src/content/.
// Para agregar contenido basta con crear un archivo nuevo en la carpeta.

const noticias = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/noticias' }),
  schema: z.object({
    titulo: z.string(),
    fecha: z.coerce.date(),
    resumen: z.string(),
    // Enlace a la nota completa (medio de prensa, post en redes, etc.)
    enlace: enlace().optional(),
  }),
});

const documentales = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/documentales' }),
  schema: ({ image }) =>
    z.object({
      titulo: z.string(),
      descripcion: z.string(),
      imagen: image().optional(),
      // Enlace de YouTube o Vimeo
      video: enlace().optional(),
      orden: z.number().default(0),
    }),
});

const talleres = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/talleres' }),
  schema: ({ image }) =>
    z.object({
      titulo: z.string(),
      descripcion: z.string(),
      imagen: image().optional(),
      video: enlace().optional(),
      orden: z.number().default(0),
    }),
});

const promesas = defineCollection({
  loader: glob({ pattern: '**/*.json', base: './src/content/promesas' }),
  schema: z.object({
    nombre: z.string(),
    distrito: z.string(),
    descripcion: z.string(),
    // Coordenadas del chinche en el mapa (clic derecho en Google Maps → copiar coordenadas)
    lat: z.number(),
    lng: z.number(),
    spotify: enlace().optional(),
    instagram: enlace().optional(),
    facebook: enlace().optional(),
    tiktok: enlace().optional(),
    youtube: enlace().optional(),
  }),
});

export const collections = { noticias, documentales, talleres, promesas };
