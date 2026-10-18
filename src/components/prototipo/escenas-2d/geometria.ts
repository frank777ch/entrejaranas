// Ayudas de dibujo para las escenas 2D: colores y perspectiva de un punto.
// Todas las vistas de la casona miden 1600 × 900 y comparten el mismo punto de fuga.

export const ANCHO = 1600;
export const ALTO = 900;
/** Punto de fuga de las vistas frontales de la casona */
export const FUGA = { x: 800, y: 380 };
/** Rectángulo de la pared que se mira de frente */
export const PARED = { x0: 110, x1: 1490, y0: 70, y1: 720 };

const hex = (n: number) => Math.round(Math.max(0, Math.min(255, n))).toString(16).padStart(2, '0');

/** Mezcla dos colores #rrggbb (t = 0 → a, t = 1 → b) */
export function mezcla(a: string, b: string, t: number) {
  const pa = [1, 3, 5].map((i) => parseInt(a.slice(i, i + 2), 16));
  const pb = [1, 3, 5].map((i) => parseInt(b.slice(i, i + 2), 16));
  return '#' + pa.map((v, i) => hex(v + (pb[i] - v) * t)).join('');
}

const f2 = (n: number) => Math.round(n * 10) / 10;
const pts = (p: [number, number][]) => p.map(([x, y]) => `${f2(x)},${f2(y)}`).join(' ');

/** Punto en la recta que une el punto de fuga con (x, y), prolongada hasta la abscisa xDestino */
export function haciaFuga(x: number, y: number, xDestino: number) {
  const m = (y - FUGA.y) / (x - FUGA.x);
  return FUGA.y + m * (xDestino - FUGA.x);
}

/** Polígonos de las paredes laterales, techo y piso que enmarcan la pared frontal */
export function caja() {
  const { x0, x1, y0, y1 } = PARED;
  return {
    techo: pts([
      [0, 0],
      [ANCHO, 0],
      [ANCHO, haciaFuga(x1, y0, ANCHO)],
      [x1, y0],
      [x0, y0],
      [0, haciaFuga(x0, y0, 0)],
    ]),
    izquierda: pts([
      [0, haciaFuga(x0, y0, 0)],
      [x0, y0],
      [x0, y1],
      [0, haciaFuga(x0, y1, 0)],
    ]),
    derecha: pts([
      [ANCHO, haciaFuga(x1, y0, ANCHO)],
      [x1, y0],
      [x1, y1],
      [ANCHO, haciaFuga(x1, y1, ANCHO)],
    ]),
    piso: pts([
      [0, haciaFuga(x0, y1, 0)],
      [x0, y1],
      [x1, y1],
      [ANCHO, haciaFuga(x1, y1, ANCHO)],
      [ANCHO, ALTO],
      [0, ALTO],
    ]),
  };
}

/**
 * Baldosas del piso en damero, en perspectiva.
 * El piso va de la base de la pared (z = 1) hacia el espectador; x en el mundo va de −1 a 1.
 */
export function damero(columnas = 18) {
  const f = (PARED.x1 - PARED.x0) / 2;
  const k = PARED.y1 - FUGA.y;
  const proy = (X: number, z: number): [number, number] => [FUGA.x + (f * X) / z, FUGA.y + k / z];
  const d = 2 / columnas;
  const zCerca = k / (ALTO - FUGA.y + 40);
  const claras: string[] = [];
  const oscuras: string[] = [];
  let fila = 0;
  for (let z = 1; z > zCerca; z -= d, fila++) {
    const z2 = z - d;
    for (let c = 0; c < columnas; c++) {
      const X = -1 + c * d;
      const p = pts([proy(X, z), proy(X + d, z), proy(X + d, z2), proy(X, z2)]);
      ((c + fila) % 2 ? oscuras : claras).push(p);
    }
  }
  return { claras, oscuras };
}

/** Trazo de un arco de medio punto con la base en y = base */
export function arco(cx: number, ancho: number, alto: number, base: number) {
  const r = ancho / 2;
  const arranque = base - alto + r;
  return `M${f2(cx - r)},${base} V${f2(arranque)} A${f2(r)},${f2(r)} 0 0 1 ${f2(cx + r)},${f2(arranque)} V${base} Z`;
}

export { pts };
