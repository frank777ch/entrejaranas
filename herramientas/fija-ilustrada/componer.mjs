// Tomas ilustradas del museo virtual: fondo pintado + artes del equipo de diseño encima.
// Los fondos los pintó Codex (GPT) en el estilo de las artes del equipo; las piezas que ya llegaron
// se pegan tal cual, sin redibujarlas, y sus recuadros salen solos para los puntos tocables.
// Cuando el equipo mande las artes de otra sala: pedir su fondo vacío, copiar las artes a artes/<sala>
// y cambiar sus `puntos` por `piezas` en lugares.mjs.
//
//   node herramientas/fija-ilustrada/componer.mjs [casona,vals,...]
//
// Requiere ImageMagick 7 (`magick`). Escribe en public/museo/salas: <lugar>-<ancho>.webp,
// <lugar>-<ancho/2>.webp y <lugar>.json, lo mismo que el render 3D.
import { execFileSync } from 'node:child_process';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { LUGARES } from './lugares.mjs';

const aqui = path.dirname(fileURLToPath(import.meta.url));
const salida = path.resolve(aqui, '../../public/museo/salas');
/** Los fondos salen de Codex a ~1774 px; se agrandan para que las artes del equipo luzcan nítidas */
const ESCALA = 2;
const CALIDAD = 86;
const CALIDAD_MEDIA = 80;

const magick = (...args) => execFileSync('magick', args.flat(), { encoding: 'utf8' }).trim();
const medir = (archivo) => magick(archivo, '-format', '%w %h', 'info:').split(' ').map(Number);

/** Recuadro de la silueta principal de un arte con transparencia (descarta manchitas sueltas) */
function silueta(arte) {
  const [w, h] = medir(arte);
  if (magick(arte, '-format', '%[opaque]', 'info:') === 'True') return [w, h, 0, 0];
  const lineas = magick(arte, '-alpha', 'extract', '-threshold', '50%', '-define', 'connected-components:verbose=true', '-connected-components', '8', 'null:');
  const blancos = lineas
    .split('\n')
    .filter((l) => l.includes('(255,255,255)') || l.includes('gray(255)'))
    .map((l) => l.trim().split(/\s+/))
    .sort((a, b) => Number(b[3]) - Number(a[3]));
  const [, caja] = blancos[0];
  const [, cw, ch, cx, cy] = caja.match(/(\d+)x(\d+)\+(\d+)\+(\d+)/).map(Number);
  return [cw, ch, cx, cy];
}

const redondear = (n) => +n.toFixed(4);

function componer(nombre, lugar) {
  const tmp = mkdtempSync(path.join(tmpdir(), 'fija-'));
  try {
    const fondo = path.join(aqui, lugar.fondo);
    const [fw, fh] = medir(fondo);
    const W = fw * ESCALA;
    const H = fh * ESCALA;
    const capas = [];
    const puntos = {};

    for (const p of lugar.piezas ?? []) {
      const arte = path.join(aqui, p.arte);
      const [sw, sh, sx, sy] = silueta(arte);
      let x0, y0, w, h;
      const ajuste = p.ajuste ?? [];
      if (p.cubrir) {
        // Llena un hueco (el interior de un marco), recortando lo que sobre del arte;
        // con `contener` el arte entra completo, centrado, y deja ver el fondo del marco alrededor
        const [a, b, c, d] = p.cubrir.map((n) => n * ESCALA);
        [x0, y0, w, h] = [a, b, c - a, d - b];
        const r = p.recorte ?? 0;
        const crop = `${Math.round(sw * (1 - 2 * r))}x${Math.round(sh * (1 - 2 * r))}+${Math.round(sx + sw * r)}+${Math.round(sy + sh * r)}`;
        const m = p.contener ? 1 - (p.margen ?? 0.08) : 1;
        const tam = p.contener ? `${Math.round(w * m)}x${Math.round(h * m)}` : `${w}x${h}^`;
        capas.push(['(', arte, '-crop', crop, '+repage', ...ajuste, '-resize', tam, '-background', 'none', '-gravity', 'center', '-extent', `${w}x${h}`, ')', '-gravity', 'northwest', '-geometry', `+${x0}+${y0}`, '-composite']);
      } else {
        // Apoyada: se da el punto donde toca (centro de la base) y su alto en el fondo original
        h = Math.round(p.alto * ESCALA);
        w = Math.round((sw * h) / sh);
        x0 = Math.round(p.base[0] * ESCALA - w / 2);
        y0 = Math.round(p.base[1] * ESCALA - h);
        if (p.sombra) {
          const [rx, ry] = [w * p.sombra, w * p.sombra * 0.16];
          const cx = p.base[0] * ESCALA;
          const cy = p.base[1] * ESCALA - ry * 0.3;
          capas.push(['(', '-size', `${W}x${H}`, 'xc:none', '-fill', 'rgba(8,6,20,0.55)', '-draw', `ellipse ${cx},${cy} ${rx},${ry} 0,360`, '-blur', `0x${Math.round(ry * 0.6)}`, ')', '-gravity', 'northwest', '-geometry', '+0+0', '-composite']);
        }
        capas.push(['(', arte, '-crop', `${sw}x${sh}+${sx}+${sy}`, '+repage', ...ajuste, '-resize', `${w}x${h}`, ')', '-gravity', 'northwest', '-geometry', `+${x0}+${y0}`, '-composite']);
      }
      puntos[p.id] = {
        x: redondear((x0 + w / 2) / W),
        y: redondear((y0 + h / 2) / H),
        caja: [x0 / W, y0 / H, (x0 + w) / W, (y0 + h) / H].map(redondear),
      };
    }

    // Arcos y piezas pintadas en el mismo fondo: recuadro a mano en px del fondo original
    for (const [id, c] of Object.entries(lugar.puntos ?? {})) {
      const [x0, y0, x1, y1] = c.caja;
      puntos[id] = {
        x: redondear((c.x ?? (x0 + x1) / 2) / fw),
        y: redondear((c.y ?? (y0 + y1) / 2) / fh),
        caja: [x0 / fw, y0 / fh, x1 / fw, y1 / fh].map(redondear),
      };
    }

    const lleno = path.join(tmp, 'lleno.png');
    magick(fondo, '-filter', 'Lanczos', '-resize', `${W}x${H}!`, '-unsharp', '0x1.2+0.7+0.01', ...capas.flat(), lleno);
    magick(lleno, '-quality', String(CALIDAD), path.join(salida, `${nombre}-${W}.webp`));
    magick(lleno, '-resize', '50%', '-quality', String(CALIDAD_MEDIA), path.join(salida, `${nombre}-${W / 2}.webp`));
    writeFileSync(path.join(salida, `${nombre}.json`), JSON.stringify({ ancho: W, alto: H, fovH: lugar.fovH, puntos }, null, 2) + '\n');
    console.log(`✓ ${nombre}: ${W}×${H}, ${Object.keys(puntos).length} puntos`);
  } finally {
    rmSync(tmp, { recursive: true, force: true });
  }
}

const solo = process.argv[2]?.split(',');
for (const [nombre, lugar] of Object.entries(LUGARES)) if (!solo || solo.includes(nombre)) componer(nombre, lugar);
