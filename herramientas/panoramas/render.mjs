// Renderiza los panoramas 360° del prototipo B y los deja en public/prototipos/360.
//   node herramientas/panoramas/render.mjs            → calidad final (4096 × 2048 y 2048 × 1024)
//   node herramientas/panoramas/render.mjs --rapido   → borrador rápido para revisar
//   opciones: --solo=casona|marinera  --expo=1.1  --calidad=0.8  --salida=carpeta
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
const salida = path.resolve(args.salida ?? path.join(aqui, '../../public/prototipos/360'));
const chrome = process.env.CHROME ?? '/usr/bin/google-chrome';

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
  for (const k of ['rapido', 'solo', 'expo', 'calidad', 'cara', 'ancho']) if (args[k]) q.set(k, args[k]);
  const inicio = Date.now();
  await pagina.goto(`${base}?${q}`);
  await pagina.waitForFunction('window.resultado || window.error', { timeout: 900_000, polling: 500 });
  const error = await pagina.evaluate(() => /** @type {any} */ (window).error);
  if (error) throw new Error(error);
  const r = await pagina.evaluate(() => /** @type {any} */ (window).resultado);
  await mkdir(salida, { recursive: true });
  const datos = (url) => Buffer.from(url.split(',')[1], 'base64');
  for (const nombre of ['casona', 'marinera']) {
    if (!r[nombre]) continue;
    const { grande, chica, puntos } = r[nombre];
    await writeFile(path.join(salida, `${nombre}-${r.ancho}.webp`), datos(grande));
    await writeFile(path.join(salida, `${nombre}-${r.ancho / 2}.webp`), datos(chica));
    await writeFile(path.join(salida, `${nombre}.json`), JSON.stringify(puntos, null, 2) + '\n');
    console.log(`✓ ${nombre}: ${(datos(grande).length / 1024).toFixed(0)} KB (${r.ancho}) · ${(datos(chica).length / 1024).toFixed(0)} KB (${r.ancho / 2})`);
  }
  console.log(`Listo en ${((Date.now() - inicio) / 1000).toFixed(1)} s → ${salida}`);
} finally {
  await navegador.close();
  await servidor.close();
}
