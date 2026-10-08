// @ts-check
import { defineConfig } from 'astro/config';

// https://astro.build/config
// Sitio estático publicado en Cloudflare Pages. El formulario de contacto
// es una Pages Function: functions/api/contacto.ts
export default defineConfig({
  // Cambiar por el dominio final cuando exista
  site: 'https://entrejaranas.pages.dev',
  // Genera museo-virtual.html para que /museo-virtual se sirva sin redirección
  build: { format: 'file' },
});
