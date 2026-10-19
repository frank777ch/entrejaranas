// Renderiza los panoramas 360° del prototipo B como cubemaps y los deja en public/prototipos/360.
//   node herramientas/panoramas/render.mjs            → calidad final (caras de 2048 y de 1024)
//   node herramientas/panoramas/render.mjs --rapido   → borrador rápido (caras de 512)
//   opciones: --solo=casona,tondero  --expo=1.1  --calidad=0.84 (caras de 2048)  --media=0.76 (caras de 1024)
//             --ss=2 (supermuestreo)  --msaa=0  --salida=carpeta
//   node herramientas/panoramas/render.mjs --fija    → tomas planas de cámara fija del prototipo C
//                                                      (public/prototipos/fija: imagen grande, mediana y puntos)
import { createServer } from 'vite';
import puppeteer from 'puppeteer-core';
import { mkdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const aqui = path.dirname(fileURLToPath(import.meta.url));
const args = Object.fromEntries(
  process.argv.slice(2).map((a) => {
    const [k, v] = a.replace(/^--/, '').split('=');
    return [k, v ?? '1'];
  }),
);
const FIJA = !!args.fija;
const salida = path.resolve(args.salida ?? path.join(aqui, FIJA ? '../../public/prototipos/fija' : '../../public/prototipos/360'));
const chrome = process.env.CHROME ?? '/usr/bin/google-chrome';
const CARAS = ['px', 'nx', 'py', 'ny', 'pz', 'nz'];

const servidor = await createServer({ configFile: path.join(aqui, 'vite.config.mjs') });
await servidor.listen();
const base = servidor.resolvedUrls.local[0];

const navegador = await puppeteer.launch({
  executablePath: chrome,
  headless: true,
  protocolTimeout: 900_000,
  args: ['--use-angle=gl', '--ignore-gpu-blocklist', '--enable-gpu', '--enable-unsafe-swiftshader'],
});
try {
  const pagina = await navegador.newPage();
  pagina.on('console', (m) => console.log('  ·', m.text()));
  pagina.on('pageerror', (e) => console.error('  ✗', e.message));
  const q = new URLSearchParams();
  for (const k of ['rapido', 'solo', 'expo', 'calidad', 'media', 'cara', 'ss', 'msaa', 'fija']) if (args[k]) q.set(k, args[k]);
  const inicio = Date.now();
  await pagina.goto(`${base}?${q}`);
  await pagina.waitForFunction('window.listo || window.error', { timeout: 900_000, polling: 500 });
  const error = await pagina.evaluate(() => /** @type {any} */ (window).error);
  if (error) throw new Error(error);
  const datos = (url) => Buffer.from(url.split(',')[1], 'base64');
  const kb = (b) => (b / 1024).toFixed(0);
  if (FIJA) {
    await mkdir(salida, { recursive: true });
    const nombres = await pagina.evaluate(() => /** @type {any} */ (window).fijas.nombres);
    for (const nombre of nombres) {
      const r = await pagina.evaluate((n) => /** @type {any} */ (window).fijas.render(n), nombre);
      const g = datos(r.grande);
      const m = datos(r.mediana);
      await writeFile(path.join(salida, `${nombre}-${r.datos.ancho}.webp`), g);
      await writeFile(path.join(salida, `${nombre}-${r.datos.ancho / 2}.webp`), m);
      await writeFile(path.join(salida, `${nombre}.json`), JSON.stringify(r.datos, null, 2) + '\n');
      console.log(`✓ ${nombre}: ${kb(g.length)} KB (${r.datos.ancho}) · ${kb(m.length)} KB (${r.datos.ancho / 2})`);
    }
    console.log(`Listo en ${((Date.now() - inicio) / 1000).toFixed(1)} s → ${salida}`);
  } else {
    const { cara, nombres } = await pagina.evaluate(() => {
      const p = /** @type {any} */ (window).panoramas;
      return { cara: p.cara, nombres: p.nombres };
    });
    await mkdir(salida, { recursive: true });
    for (const nombre of nombres) {
      const r = await pagina.evaluate((n) => /** @type {any} */ (window).panoramas.render(n), nombre);
      let grande = 0;
      let mediana = 0;
      for (let i = 0; i < 6; i++) {
        const g = datos(r.grandes[i]);
        const m = datos(r.medianas[i]);
        grande += g.length;
        mediana += m.length;
        await writeFile(path.join(salida, `${nombre}-${cara}-${CARAS[i]}.webp`), g);
        await writeFile(path.join(salida, `${nombre}-${cara / 2}-${CARAS[i]}.webp`), m);
      }
      await writeFile(path.join(salida, `${nombre}.json`), JSON.stringify({ cara, ...r.puntos }, null, 2) + '\n');
      console.log(`✓ ${nombre}: ${kb(grande)} KB (${cara}) · ${kb(mediana)} KB (${cara / 2})`);
    }
    console.log(`Listo en ${((Date.now() - inicio) / 1000).toFixed(1)} s → ${salida}`);
  }
} finally {
  await navegador.close();
  await servidor.close();
}
