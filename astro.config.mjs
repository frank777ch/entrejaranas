// @ts-check
import { defineConfig, envField } from 'astro/config';
import cloudflare from '@astrojs/cloudflare';

// https://astro.build/config
export default defineConfig({
  // Cambiar por el dominio final cuando exista
  site: 'https://entrejaranas.pages.dev',
  // Imágenes optimizadas al compilar (Sharp no corre dentro de Cloudflare Workers)
  adapter: cloudflare({ imageService: 'compile' }),
  // Genera museo-virtual.html para que /museo-virtual se sirva sin redirección
  build: { format: 'file' },
  env: {
    schema: {
      // Correo que recibe los mensajes del formulario de contacto.
      // Se cambia en Cloudflare → Workers → entrejaranas → Settings → Variables and Secrets, sin tocar código.
      CONTACT_TO_EMAIL: envField.string({ context: 'server', access: 'secret' }),
      // Remitente. Sin dominio propio verificado en Resend, usar onboarding@resend.dev
      CONTACT_FROM_EMAIL: envField.string({
        context: 'server',
        access: 'secret',
        default: 'Entre Jaranas <onboarding@resend.dev>',
      }),
      // Si falta (desarrollo local), el mensaje se imprime en consola en vez de enviarse.
      RESEND_API_KEY: envField.string({ context: 'server', access: 'secret', optional: true }),
    },
  },
});
