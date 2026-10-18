// Motor del prototipo 2D (novela visual): la cámara no se mueve por la casona,
// cambia de plano. Cada vista es una lámina SVG que se encuadra, se acerca o se funde.
import * as ui from './interfaz';
import { casona, generos, type Genero, type GeneroId, type Objeto } from '../../data/museo-prototipo';

type VistaCasona = 'frente' | 'derecha' | 'fondo' | 'izquierda' | 'arriba' | 'abajo';
type Vista = VistaCasona | `sala-${GeneroId}`;

interface Camara {
  /** Punto de la lámina que queda en el foco de la pantalla */
  cx: number;
  cy: number;
  zoom: number;
  /** Foco en la pantalla (0–1); por defecto el centro */
  fx?: number;
  fy?: number;
  /** Sin límites: puede verse el borde de la lámina (acercamientos bajo un panel) */
  libre?: boolean;
}

const ALTO = 900;
const PAREDES: Vista[] = ['frente', 'derecha', 'fondo', 'izquierda'];
const salaDe = (g: Genero): Vista => `sala-${g.id}`;

const raiz = document.querySelector<HTMLElement>('.proto')!;
const mundo = document.querySelector<HTMLElement>('.mundo-2d')!;
const vistas = new Map<Vista, HTMLElement>();
mundo.querySelectorAll<HTMLElement>('.vista-2d').forEach((el) => vistas.set(el.dataset.vista as Vista, el));
if (ui.tactil) raiz.classList.add('es-tactil');

let actual: Vista = 'frente';
let cam: Camara = { cx: 800, cy: ALTO / 2, zoom: 1 };
let paredBase: Vista = 'frente';
let asomo: Genero | null = null;
let enSala: Genero | null = null;
let camAntesFicha: Camara | null = null;
const vistos = new Set<string>();

const vw = () => mundo.clientWidth;
const vh = () => mundo.clientHeight;
const ancho = (v: Vista) => Number(vistas.get(v)!.dataset.ancho);
const escalaBase = (v: Vista) => Math.max(vw() / ancho(v), vh() / ALTO);
const estrecho = () => vw() < 640;

function transformar(v: Vista, c: Camara, ox = 0, oy = 0) {
  const S = escalaBase(v) * c.zoom;
  let tx = vw() * (c.fx ?? 0.5) - c.cx * S;
  let ty = vh() * (c.fy ?? 0.5) - c.cy * S;
  // Con cámara libre solo se limita en horizontal (si la lámina alcanza a cubrir la pantalla)
  if (!c.libre || ancho(v) * S >= vw()) tx = Math.min(0, Math.max(vw() - ancho(v) * S, tx));
  if (!c.libre) ty = Math.min(0, Math.max(vh() - ALTO * S, ty));
  return `translate(${(tx + ox * vw()).toFixed(1)}px, ${(ty + oy * vh()).toFixed(1)}px) scale(${S.toFixed(4)})`;
}

function poner(v: Vista, c: Camara, animar = true, ox = 0, oy = 0) {
  const el = vistas.get(v)!;
  if (!animar) el.classList.add('sin-trans');
  el.style.transform = transformar(v, c, ox, oy);
  if (!animar) {
    void el.offsetWidth;
    el.classList.remove('sin-trans');
  }
}

function activar(v: Vista, si: boolean) {
  const el = vistas.get(v)!;
  el.classList.toggle('activa', si);
  el.inert = !si;
}

/** Centros posibles de la cámara en una vista a zoom 1 (para recorrerla con las flechas) */
function limites(v: Vista): [number, number] {
  const media = vw() / (2 * escalaBase(v));
  return [media, ancho(v) - media];
}

function paradas(v: Vista) {
  const [a, b] = limites(v);
  const visible = vw() / escalaBase(v);
  // Si casi toda la lámina cabe en pantalla, no vale la pena recorrerla por partes
  if (b - a < visible * 0.3) return [ancho(v) / 2];
  const n = Math.ceil((b - a) / (visible * 0.7));
  return Array.from({ length: n + 1 }, (_, i) => a + ((b - a) * i) / n);
}

const limitar = (v: Vista, cx: number) => {
  const [a, b] = limites(v);
  return b - a < 1 ? ancho(v) / 2 : Math.min(b, Math.max(a, cx));
};

function indiceParada() {
  const p = paradas(actual);
  const cx = limitar(actual, cam.cx);
  return p.reduce((mejor, x, i) => (Math.abs(x - cx) < Math.abs(p[mejor] - cx) ? i : mejor), 0);
}

function actualizarFlechas() {
  if (asomo || camAntesFicha) return ui.mostrarFlechas({});
  if (actual === 'arriba') return ui.mostrarFlechas({ abajo: true });
  if (actual === 'abajo') return ui.mostrarFlechas({ arriba: true });
  if (enSala) {
    const i = indiceParada();
    return ui.mostrarFlechas({ izquierda: i > 0, derecha: i < paradas(actual).length - 1 });
  }
  ui.mostrarFlechas({ izquierda: true, derecha: true, arriba: true, abajo: true });
}

const NOMBRES: Record<VistaCasona, string> = {
  frente: 'Casona limeña',
  derecha: 'Casona limeña',
  fondo: 'Casona limeña · balcón',
  izquierda: 'Casona limeña',
  arriba: 'Casona limeña · artesonado',
  abajo: 'Casona limeña · piso',
};

function lugarCasona() {
  ui.lugar(NOMBRES[actual as VistaCasona] ?? 'Casona limeña');
}

/** Cambia de lámina con un fundido y un leve desplazamiento en la dirección del giro */
function cambiar(nueva: Vista, c: Camara, ox = 0, oy = 0) {
  const vieja = actual;
  if (nueva !== vieja) {
    poner(nueva, c, false, ox, oy);
    vistas.get(vieja)!.style.transform = transformar(vieja, cam, -ox, -oy);
    activar(vieja, false);
    activar(nueva, true);
  }
  actual = nueva;
  cam = c;
  poner(nueva, c);
}

const arcoDe = (id: string) => mundo.querySelector<SVGGElement>(`.arco-2d[data-genero="${id}"]`)!;
const num = (el: SVGElement, k: string) => Number(el.dataset[k]);
const vistosEn = (g: Genero) => g.objetos.filter((o) => vistos.has(o.id)).length;

function girar(paso: 1 | -1) {
  const nueva = PAREDES[(PAREDES.indexOf(actual) + paso + 4) % 4];
  const p = paradas(nueva);
  cambiar(nueva, { cx: paso > 0 ? p[0] : p[p.length - 1], cy: ALTO / 2, zoom: 1 }, paso * 0.35);
  paredBase = nueva;
  lugarCasona();
  actualizarFlechas();
}

ui.alUsarFlecha((d) => {
  ui.toque({ izquierda: -2, derecha: 2, arriba: 5, abajo: -5 }[d]);
  if (actual === 'arriba' || actual === 'abajo') {
    cambiar(paredBase, { cx: limitar(paredBase, 800), cy: ALTO / 2, zoom: 1 }, 0, actual === 'arriba' ? 0.35 : -0.35);
    lugarCasona();
    return actualizarFlechas();
  }
  if (d === 'arriba' || d === 'abajo') {
    cambiar(d, { cx: 800, cy: ALTO / 2, zoom: 1 }, 0, d === 'arriba' ? -0.35 : 0.35);
    lugarCasona();
    return actualizarFlechas();
  }
  const paso = d === 'derecha' ? 1 : -1;
  const p = paradas(actual);
  const j = indiceParada() + paso;
  if (j >= 0 && j < p.length) {
    cam = { ...cam, cx: p[j] };
    poner(actual, cam);
    return actualizarFlechas();
  }
  if (!enSala) girar(paso);
});

/* Asomo: primer toque en un arco */
function asomarse(g: Genero) {
  const el = arcoDe(g.id);
  if (actual !== g.pared) cambiar(g.pared, { cx: limitar(g.pared, num(el, 'cx')), cy: ALTO / 2, zoom: 1 });
  paredBase = g.pared;
  asomo = g;
  ui.toque(4);
  ui.modo('asomo');
  const S0 = escalaBase(actual);
  const alto = num(el, 'alto');
  const zoom = Math.min((vh() * (estrecho() ? 0.52 : 0.8)) / (alto * S0), (vw() * 0.94) / (num(el, 'ancho') * S0));
  cam = { cx: num(el, 'cx'), cy: num(el, 'cy') - (estrecho() ? 0 : 30), zoom: Math.max(zoom, 1.08), fy: estrecho() ? 0.3 : 0.4, libre: true };
  poner(actual, cam);
  ui.lugar(`Te asomas · ${g.nombre}`, g.color);
  ui.mostrarRegreso(null);
  ui.mostrarCartel(g, { entrar: () => entrar(g), volver: salirAsomo });
  if (g.completa) cargarSala(g).catch(() => {});
  actualizarFlechas();
}

function salirAsomo() {
  if (!asomo) return;
  ui.toque(-4);
  cam = { cx: limitar(actual, num(arcoDe(asomo.id), 'cx')), cy: ALTO / 2, zoom: 1 };
  poner(actual, cam);
  asomo = null;
  ui.mostrarCartel(null);
  ui.modo('casona');
  lugarCasona();
  actualizarFlechas();
}

/* Segundo toque: la sala completa (su lámina se descarga al asomarse) */
let entrando = false;
async function entrar(g: Genero) {
  if (!g.completa || entrando) return;
  entrando = true;
  ui.toque(7);
  try {
    await cargarSala(g);
  } catch {
    entrando = false;
    ui.mostrarPista('No se pudo abrir la sala. Revisa tu conexión e inténtalo de nuevo');
    return;
  }
  entrando = false;
  // El visitante pudo volver a la casona mientras se descargaba
  if (asomo !== g) return;
  const sala = salaDe(g);
  ui.mostrarCartel(null);
  const vieja = actual;
  vistas.get(vieja)!.style.transform = transformar(vieja, { ...cam, zoom: cam.zoom * 2.4 });
  activar(vieja, false);
  const p = paradas(sala);
  const centro = p[Math.floor((p.length - 1) / 2)];
  poner(sala, { cx: centro, cy: ALTO / 2, zoom: 1.35, libre: true }, false);
  activar(sala, true);
  actual = sala;
  cam = { cx: limitar(sala, centro), cy: ALTO / 2, zoom: 1 };
  poner(sala, cam);
  asomo = null;
  enSala = g;
  ui.modo('sala');
  ui.lugar(g.nombre, g.color);
  ui.mostrarInfoSala(g, vistosEn(g));
  ui.mostrarRegreso('Volver a la casona', salirSala);
  actualizarFlechas();
  ui.mostrarPista(ui.tactil ? 'Toca los objetos marcados' : 'Haz clic en los objetos que brillan para conocerlos');
}

/* Regreso: al plano frente al arco, en la casona */
function salirSala() {
  const g = enSala;
  if (!g) return;
  ui.toque(-7);
  cerrarFicha(false);
  const vieja = actual;
  vistas.get(vieja)!.style.transform = transformar(vieja, { ...cam, zoom: 1.2, libre: true });
  activar(vieja, false);
  const cx = num(arcoDe(g.id), 'cx');
  poner(g.pared, { cx, cy: num(arcoDe(g.id), 'cy'), zoom: 2.2, libre: true }, false);
  activar(g.pared, true);
  actual = g.pared;
  paredBase = g.pared;
  cam = { cx: limitar(g.pared, cx), cy: ALTO / 2, zoom: 1 };
  poner(actual, cam);
  enSala = null;
  ui.modo('casona');
  lugarCasona();
  ui.mostrarInfoSala(null);
  ui.mostrarRegreso(null);
  actualizarFlechas();
}

/* Ficha: la cámara se acerca al objeto */
function abrirFicha(o: Objeto, el: SVGGElement) {
  ui.toque(9);
  camAntesFicha ??= cam;
  const S0 = escalaBase(actual);
  const zoom = Math.max(estrecho() ? 0.5 : 1.15, Math.min(2.4, (vh() * (estrecho() ? 0.3 : 0.78)) / (num(el, 'alto') * S0)));
  cam = { cx: num(el, 'cx'), cy: num(el, 'cy'), zoom, fx: estrecho() ? 0.5 : 0.36, fy: estrecho() ? 0.21 : 0.5, libre: true };
  poner(actual, cam);
  mundo.querySelectorAll('.objeto-2d.abierto').forEach((x) => x.classList.remove('abierto'));
  el.classList.add('visto', 'abierto');
  vistos.add(o.id);
  ui.mostrarFicha(o, () => cerrarFicha());
  if (enSala) ui.mostrarInfoSala(enSala, vistosEn(enSala));
  actualizarFlechas();
}

function cerrarFicha(animar = true) {
  ui.mostrarFicha(null);
  mundo.querySelectorAll('.objeto-2d.abierto').forEach((x) => x.classList.remove('abierto'));
  if (!camAntesFicha) return;
  cam = camAntesFicha;
  camAntesFicha = null;
  if (animar) poner(actual, cam);
  actualizarFlechas();
  if (enSala && vistosEn(enSala) === enSala.objetos.length) {
    ui.mostrarPista('¡Conociste toda la sala! Vuelve a la casona para visitar otra');
  }
}

const objetos = [...casona.objetos, ...generos.flatMap((g) => g.objetos)];

function activarElemento(el: SVGGElement) {
  if (el.dataset.genero) {
    const g = generos.find((x) => x.id === el.dataset.genero)!;
    if (asomo?.id === g.id) entrar(g);
    else asomarse(g);
  } else if (el.dataset.objeto) {
    abrirFicha(objetos.find((o) => o.id === el.dataset.objeto)!, el);
  }
}

/* Arrastrar para mirar (sobre todo en celular, donde la lámina es más ancha que la pantalla) */
let inicio: { x: number; cx: number; S: number } | null = null;
let arrastrando = false;
let finArrastre = 0;

mundo.addEventListener('pointerdown', (e) => {
  if (asomo || camAntesFicha || actual === 'arriba' || actual === 'abajo' || e.button > 0) return;
  inicio = { x: e.clientX, cx: limitar(actual, cam.cx), S: escalaBase(actual) };
  arrastrando = false;
});

addEventListener('pointermove', (e) => {
  if (!inicio) return;
  const dx = e.clientX - inicio.x;
  if (!arrastrando && Math.abs(dx) < 8) return;
  arrastrando = true;
  mundo.classList.add('arrastrando');
  cam = { ...cam, cx: limitar(actual, inicio.cx - dx / inicio.S) };
  poner(actual, cam, false);
});

addEventListener('pointerup', (e) => {
  if (!inicio) return;
  const dx = e.clientX - inicio.x;
  const sinMover = Math.abs(limitar(actual, cam.cx) - inicio.cx) < 4;
  inicio = null;
  mundo.classList.remove('arrastrando');
  if (!arrastrando) return;
  finArrastre = performance.now();
  // Deslizar en una pared que ya se ve completa: gira a la pared vecina
  if (!enSala && sinMover && Math.abs(dx) > 70) girar(dx < 0 ? 1 : -1);
  actualizarFlechas();
});

mundo.addEventListener('click', (e) => {
  if (performance.now() - finArrastre < 250) return;
  const el = (e.target as Element).closest<SVGGElement>('.interactivo');
  if (el) activarElemento(el);
  else if (camAntesFicha) cerrarFicha();
});

mundo.addEventListener('keydown', (e) => {
  const el = (e.target as Element).closest<SVGGElement>('.interactivo');
  if (el && (e.key === 'Enter' || e.key === ' ')) {
    e.preventDefault();
    activarElemento(el);
  }
});

addEventListener('resize', () => {
  if (!camAntesFicha && !asomo) cam = { ...cam, cx: limitar(actual, cam.cx) };
  poner(actual, cam, false);
  actualizarFlechas();
});

function cargarImagen(src: string) {
  return new Promise((listo) => {
    const img = new Image();
    img.onload = img.onerror = listo;
    img.src = src;
  });
}

/* Láminas de las salas: se descargan al asomarse a su arco y se agregan al mundo */
const cargas = new Map<GeneroId, Promise<void>>();
function cargarSala(g: Genero) {
  let carga = cargas.get(g.id);
  if (!carga) {
    const url = `/prototipos/salas-2d/${g.id}${import.meta.env.DEV ? '' : '.html'}`;
    carga = fetch(url)
      .then((r) => {
        if (!r.ok) throw new Error(`${r.status} ${url}`);
        return r.text();
      })
      .then(async (html) => {
        const lamina = new DOMParser().parseFromString(html, 'text/html').querySelector<HTMLElement>('.vista-2d');
        if (!lamina) throw new Error(`Sin lámina en ${url}`);
        const el = document.importNode(lamina, true);
        mundo.append(el);
        vistas.set(el.dataset.vista as Vista, el);
        activar(el.dataset.vista as Vista, false);
        await Promise.all([...el.querySelectorAll('image')].map((i) => cargarImagen(i.getAttribute('href')!)));
      });
    carga.catch(() => cargas.delete(g.id));
    cargas.set(g.id, carga);
  }
  return carga;
}

/* Imágenes de la casona (los vistazos del arco de la marinera) */
const IMAGENES = ['/prototipos/2d/vestido.webp', '/prototipos/2d/pareja.webp', '/museo/texturas/cuadro-plaza.webp'];

/* Arranque */
async function iniciar() {
  vistas.forEach((_, v) => activar(v, v === actual));
  mundo.classList.add('sin-anim');
  poner(actual, cam, false);
  let hechos = 0;
  ui.progreso(0.15, 'Abriendo la casona…');
  await Promise.all([
    document.fonts.ready,
    ...IMAGENES.map((src) => cargarImagen(src).then(() => ui.progreso(0.15 + (++hechos / IMAGENES.length) * 0.85))),
  ]);

  // Atajos para revisar estados: ?vista=derecha, ?asomo=tondero, ?sala=marinera, ?objeto=arpa
  const q = new URLSearchParams(location.search);
  const vistaQ = q.get('vista') as Vista | null;
  if (vistaQ && vistas.has(vistaQ) && !vistaQ.startsWith('sala-')) {
    cambiar(vistaQ, { cx: limitar(vistaQ, 800), cy: ALTO / 2, zoom: 1 });
    if (PAREDES.includes(vistaQ)) paredBase = vistaQ;
  }
  ui.modo('casona');
  const oq = q.get('objeto');
  const gObj = oq ? generos.find((g) => g.objetos.some((o) => o.id === oq)) : undefined;
  const gq = gObj ?? generos.find((g) => g.id === (q.get('asomo') ?? q.get('sala')));
  if (gq) {
    asomarse(gq);
    if (q.has('sala') || gObj) await entrar(gq);
  }
  const elQ = oq && mundo.querySelector<SVGGElement>(`.objeto-2d[data-objeto="${oq}"]`);
  if (elQ) {
    const vistaObj = elQ.closest<HTMLElement>('.vista-2d')!.dataset.vista as Vista;
    if (vistaObj !== actual) cambiar(vistaObj, { cx: limitar(vistaObj, 800), cy: ALTO / 2, zoom: 1 });
    abrirFicha(objetos.find((o) => o.id === oq)!, elQ);
  }
  if (!gq && !elQ) lugarCasona();
  actualizarFlechas();

  requestAnimationFrame(() => requestAnimationFrame(() => mundo.classList.remove('sin-anim')));
  ui.terminarCarga();
  if (!gq && !elQ) {
    setTimeout(() => ui.mostrarPista(ui.tactil ? 'Desliza o usa las flechas · toca un arco' : 'Usa las flechas para mirar alrededor · toca un arco para asomarte'), 900);
  }
}

iniciar();
