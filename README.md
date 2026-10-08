# Entre Jaranas

Landing page del proyecto **Entre Jaranas** (Facultad de Letras y Ciencias Humanas, UNMSM), hecha con [Astro](https://astro.build) siguiendo el Manual de Identidad.

## Desarrollo

```sh
npm install
cp .env.example .env   # y completar valores
npm run dev            # http://localhost:4321
npm run build          # compila para producción
```

Sin `RESEND_API_KEY`, el formulario funciona igual pero el mensaje se imprime en la consola en vez de enviarse.

## Publicar en Cloudflare

El sitio usa `@astrojs/cloudflare`, que publica en **Cloudflare Workers** (el reemplazo que Cloudflare recomienda hoy en lugar de Pages; mismo panel).

1. Cloudflare → *Workers & Pages* → *Create* → *Import a repository* → elegir este repo de GitHub.
2. Build command: `npm run build` · Deploy command: `npx wrangler deploy` (vienen por defecto).
3. En *Settings → Variables and Secrets* agregar `CONTACT_TO_EMAIL` y `RESEND_API_KEY` como **Secret**.
4. Cada `git push` a `main` vuelve a publicar.

También se puede publicar desde la terminal: `npm run build && npx wrangler deploy`.

Cuando haya dominio propio, cambiar `site` en `astro.config.mjs`.

## Foto grupal

Poner el archivo en `src/assets/fotos/equipo.jpg` (o `.png` / `.webp`), horizontal 4:3, idealmente 1600 × 1200 px o más. Aparece sola en "Quiénes somos" (se muestra a ~420 × 320 px en escritorio; Astro genera versiones optimizadas para cada pantalla).

## Cómo actualizar el contenido

Todo se edita en archivos; al hacer `git push`, Cloudflare publica los cambios en 1–2 minutos.

| Qué | Dónde |
|---|---|
| Noticias de prensa | `src/content/noticias/*.md` (se muestran las 4 más recientes) |
| Microdocumentales | `src/content/documentales/*.md` |
| Talleres | `src/content/talleres/*.md` |
| Nuevas promesas (mapa) | `src/content/promesas/*.json` |
| Museo virtual, aliados, redes sociales | `src/data/sitio.ts` |
| Opciones del formulario | `src/data/contacto.ts` |

### Agregar una noticia

Crear `src/content/noticias/2026-11-mi-noticia.md`:

```md
---
titulo: Título de la noticia
fecha: 2026-11-15
resumen: Una o dos líneas.
enlace: https://medio.pe/nota   # opcional
---
```

### Agregar un documental o taller

```md
---
titulo: Nombre del documental
descripcion: Breve descripción.
video: https://www.youtube.com/watch?v=XXXX   # opcional, YouTube o Vimeo
imagen: ../../assets/documentales/foto.jpg    # opcional, si no hay video
orden: 5
---
```

### Agregar una nueva promesa al mapa

Crear `src/content/promesas/nombre-apellido.json`. Las coordenadas se sacan en Google Maps: clic derecho sobre el lugar → copiar las coordenadas.

```json
{
  "nombre": "Nombre artístico",
  "distrito": "Rímac",
  "descripcion": "Breve descripción.",
  "lat": -12.0287,
  "lng": -77.0306,
  "spotify": "https://open.spotify.com/artist/...",
  "instagram": "https://instagram.com/..."
}
```

Redes disponibles: `spotify`, `instagram`, `facebook`, `tiktok`, `youtube` (todas opcionales).

Los archivos `ejemplo-*.json` son de muestra: borrarlos cuando haya promesas reales.

### Incrustar el museo virtual

En `src/data/sitio.ts`, pegar en `museoVirtual.embedUrl` el enlace de inserción (embed) que da la plataforma (Artsteps, Kuula, Matterport, etc.). Mientras esté vacío, la página `/museo-virtual` muestra "Próximamente". Lo que cambien dentro de la plataforma del museo se ve al instante, sin volver a publicar el sitio.

## Buscador

Botón "Buscar" en el encabezado (atajos: `/` o `Ctrl+K`). El índice se genera solo al compilar desde `src/content/` (`src/pages/buscar.json.ts`): todo lo que se agregue aparece en la búsqueda sin hacer nada más. Las secciones fijas y sus palabras clave están en ese mismo archivo.

## Formulario de contacto

Usa Astro Actions (`src/actions/index.ts`) y [Resend](https://resend.com) para enviar el correo.

Variables de entorno (en Cloudflare: *Workers & Pages → entrejaranas → Settings → Variables and Secrets*, tipo **Secret**). Para desarrollo local van en `.env`:

| Variable | Para qué |
|---|---|
| `CONTACT_TO_EMAIL` | Correo que recibe los mensajes. Para cambiarlo, solo se edita esta variable. |
| `RESEND_API_KEY` | API key de Resend |
| `CONTACT_FROM_EMAIL` | Opcional. Remitente; por defecto `onboarding@resend.dev` |

**Importante:** sin un dominio propio verificado en Resend, el remitente `onboarding@resend.dev` solo puede enviar al correo con el que se creó la cuenta de Resend. Crear la cuenta de Resend con el mismo correo de `CONTACT_TO_EMAIL`, o verificar un dominio para enviar a cualquier correo.

Incluye un campo oculto anti-spam (honeypot). Si llega spam, el siguiente paso es agregar Cloudflare Turnstile.

## Marca

- Colores: `#93171e` vino, `#522011` café, `#fead15` oro, `#f0e7d8` crema (`src/styles/global.css`)
- Títulos: Libre Baskerville. Cuerpo: Agrandir (no está en Google Fonts; mientras tanto se usa Archivo expandida).
- Logos extraídos del manual en `src/assets/marca/`. Si hay archivos originales en mejor calidad (SVG), reemplazarlos ahí.

## Pendientes

- Foto grupal (`src/assets/fotos/equipo.jpg`), textos finales de Misión/Visión/Valores, documentales y noticias reales
- Redes sociales en `src/data/sitio.ts`
- Selector de idioma (estaba en el wireframe)
