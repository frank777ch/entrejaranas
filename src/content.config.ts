import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const enlace = () => z.url({ protocol: /^https?$/ });

// Cada colección es una carpeta dentro de src/content/.
// Para agregar contenido basta con crear un archivo nuevo en la carpeta.

const noticias = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/noticias' }),
  schema: ({ image }) =>
    z.object({
      titulo: z.string(),
      fecha: z.coerce.date(),
      resumen: z.string(),
      // Enlace a la nota completa (medio de prensa, post en redes, etc.).
      // Sin enlace, si el archivo tiene texto debajo del encabezado, se publica en /prensa/<archivo>
      enlace: enlace().optional(),
      imagen: image().optional(),
      imagenAlt: z.string().optional(),
    }),
});

const documentales = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/documentales' }),
  schema: ({ image }) =>
    z.object({
      titulo: z.string(),
      subtitulo: z.string().optional(),
      descripcion: z.string(),
      // Portada; se muestra mientras no haya video
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
  schema: ({ image }) =>
    z.object({
      nombre: z.string(),
      // Uno o varios distritos separados por " · "
      distrito: z.string(),
      descripcion: z.string(),
      foto: image().optional(),
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
