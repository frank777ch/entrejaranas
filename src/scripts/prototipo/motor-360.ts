// Prototipo B: la casona y las cinco salas como panoramas 360° (cubemaps).
// Los panoramas se renderizan con herramientas/panoramas/render.mjs.
import { casona, generos, type Genero, type GeneroId, type Objeto } from '../../data/museo-prototipo';
import * as ui from './interfaz';
import { Visor, type Textura, type Vista } from './visor-360';

type Lugar = 'casona' | GeneroId;

interface DatosPunto {
  yaw: number;
  pitch: number;
  fov?: number;
  asomo?: { pitch: number; fov: number; ancho: number };
}

type Puntos = Record<string, DatosPunto> & { camara?: unknown; entrada?: DatosPunto };

const RUTA = '/prototipos/360';
const lienzo = document.querySelector<HTMLCanvasElement>('.visor-360')!;
const capa = document.querySelector<HTMLElement>('.puntos-360')!;
const visor = new Visor(lienzo, { reducido: ui.sinMovimiento });
const params = new URLSearchParams(location.search);
const instantaneo = params.has('vista') || params.has('sala') || params.has('asomo') || params.has('ficha');
const T = (ms: number) => (instantaneo || ui.sinMovimiento ? 0 : ms);

const nav = navigator as Navigator & { connection?: { saveData?: boolean }; deviceMemory?: number };
// Caras de 1024 px para empezar; las de 2048 se bajan después, sin hacer esperar,
// salvo en modo ahorro de datos o en equipos con poca memoria
const modesto = (nav.deviceMemory ?? 8) <= 2 && (nav.hardwareConcurrency ?? 8) <= 4;
const nitida = visor.maxTextura >= 2048 && !nav.connection?.saveData && !modesto;

const datos: Partial<Record<Lugar, Puntos>> = {};
const texturas: Partial<Record<Lugar, Textura>> = {};
const cargas: Partial<Record<Lugar, Promise<Textura>>> = {};
let lugar: Lugar = 'casona';
/** Sala en la que está el visitante (o null en la casona) */
let sala: Genero | null = null;
let ocupado = false;
const vistos = new Set<string>();

/* ---------- Vistas ---------- */

/** fov vertical cómodo: en pantallas verticales se abre para no ver un pasillo angosto */
function fovBase() {
  const a = visor.aspecto;
  if (a >= 1) return a > 1.9 ? 64 : 72;
  return Math.min(96, visor.fovParaAncho(54));
}

function ajustarLimites() {
  visor.fovMax = Math.max(fovBase() + 8, 90);
  visor.fovMin = 26;
}

const angulo = (yaw: number) => ((yaw % 360) + 540) % 360 - 180;

/* ---------- Carga de panoramas ---------- */

async function panorama(l: Lugar, alAvanzar?: (p: number) => void) {
  if (texturas[l]) return texturas[l]!;
  cargas[l] ??= (async () => {
    const [t, puntos] = await Promise.all([visor.cargar(`${RUTA}/${l}-1024`, alAvanzar), datos[l] ?? fetch(`${RUTA}/${l}.json`).then((r) => r.json())]);
    datos[l] = puntos;
    texturas[l] = t;
    if (nitida) mejorar(l, t);
    return t;
  })();
  return cargas[l]!;
}

async function mejorar(l: Lugar, chica: Textura) {
  try {
    const grande = await visor.cargar(`${RUTA}/${l}-2048`);
    // Si el panorama se soltó mientras bajaba, no se usa
    if (texturas[l] !== chica) return visor.liberar(grande);
    texturas[l] = grande;
    visor.reemplazar(chica, grande);
    visor.liberar(chica);
  } catch {
    // Se queda con la versión liviana
  }
}

/** Libera de la GPU los panoramas que no se están viendo (la casona siempre queda) */
function soltarMenos(...quedan: Lugar[]) {
  for (const l of Object.keys(texturas) as Lugar[]) {
    if (l === 'casona' || quedan.includes(l)) continue;
    visor.liberar(texturas[l]!);
    delete texturas[l];
    delete cargas[l];
  }
}

/* ---------- Puntos tocables ---------- */

function crearPunto(id: string, nombre: string, color: string, alTocar: () => void, siempre = false) {
  const b = document.createElement('button');
  b.type = 'button';
  b.className = 'punto';
  b.dataset.id = id;
  b.style.setProperty('--sala', color);
  b.setAttribute('aria-label', nombre);
  if (siempre || ui.tactil) b.classList.add('punto--etiqueta');
  const n = document.createElement('span');
  n.className = 'punto__nombre';
  n.textContent = nombre;
  b.append(n);
  b.addEventListener('click', (e) => {
    e.stopPropagation();
    alTocar();
  });
  return b;
}

function mostrarPuntos(lista: { id: string; nombre: string; color: string; alTocar: () => void; siempre?: boolean; pitch?: number }[]) {
  const d = datos[lugar]!;
  const puntos = lista
    .filter((p) => d[p.id])
    .map((p) => {
      const el = crearPunto(p.id, p.nombre, p.color, p.alTocar, p.siempre);
      if (vistos.has(p.id)) el.classList.add('punto--visto');
      return { el, yaw: d[p.id].yaw, pitch: p.pitch ?? d[p.id].pitch };
    });
  capa.replaceChildren(...puntos.map((p) => p.el));
  visor.colocarPuntos(puntos);
}

function ocultarPuntos(ocultar: boolean) {
  capa.classList.toggle('puntos-360--ocultos', ocultar);
}

/* ---------- Casona ---------- */

function puntosCasona() {
  mostrarPuntos([
    ...generos.map((g) => ({ id: g.id, nombre: g.nombre, color: g.color, alTocar: () => asomarse(g), siempre: true })),
    ...casona.objetos.map((o) => ({ id: o.id, nombre: o.nombre, color: '#fead15', alTocar: () => abrirFicha(o) })),
  ]);
}

function enCasona() {
  lugar = 'casona';
  ui.modo('casona');
  ui.lugar(casona.nombre);
  ui.mostrarFlechas({ izquierda: true, derecha: true, arriba: true, abajo: true });
  ui.mostrarRegreso(null);
  ui.mostrarInfoSala(null);
  ui.mostrarCartel(null);
  puntosCasona();
  ocultarPuntos(false);
}

let asomado: Genero | null = null;

async function asomarse(g: Genero) {
  if (ocupado) return;
  if (asomado?.id === g.id) return entrar(g);
  asomado = g;
  ui.toque(g.completa ? 4 : 0);
  ui.modo('asomo');
  ui.mostrarFlechas({});
  const p = datos.casona![g.id];
  const a = p.asomo!;
  // Encuadre: la cartela arriba y el umbral escondido tras el panel del asomo,
  // sin que el arco se corte a los lados en pantallas angostas
  const tope = a.pitch + a.fov / 2.16;
  const piso = a.pitch - a.fov / 2.16;
  let fov = Math.max((2 * (tope - piso)) / 1.67, visor.fovParaAncho(a.ancho * 1.15));
  fov = Math.min(fov, fovBase());
  const mirada = tope - 0.46 * fov;
  ui.mostrarCartel(g, { entrar: () => entrar(g), volver: () => volver() });
  // Solo queda el punto del arco, para tocarlo de nuevo y entrar; va alto para que el panel no lo tape
  const alto = mirada + (Math.atan(0.3 * Math.tan((fov * Math.PI) / 360)) * 180) / Math.PI;
  mostrarPuntos([{ id: g.id, nombre: g.completa ? 'Entrar' : 'En preparación', color: g.color, alTocar: () => entrar(g), siempre: true, pitch: alto }]);
  if (g.completa) panorama(g.id);
  await visor.ir({ yaw: p.yaw, pitch: mirada, fov }, T(900));
}

async function volver() {
  if (ocupado || !asomado) return;
  const g = asomado;
  asomado = null;
  ui.mostrarCartel(null);
  enCasona();
  await visor.ir({ yaw: datos.casona![g.id].yaw, pitch: 0, fov: fovBase() }, T(800));
}

/* ---------- Salas de los géneros ---------- */

async function entrar(g: Genero) {
  if (ocupado || !g.completa) return;
  ocupado = true;
  asomado = null;
  ui.toque(7);
  ui.mostrarCartel(null);
  ocultarPuntos(true);
  const t = await panorama(g.id);
  const p = datos.casona![g.id];
  // Cruza el arco: acercamiento y fundido hacia el interior. Todos los panoramas comparten
  // los mismos ejes, así que la mirada sigue en la misma dirección al cambiar.
  const acercar = visor.ir({ yaw: p.yaw, pitch: 2, fov: Math.max(18, visor.vista.fov * 0.45) }, T(900));
  await new Promise((r) => setTimeout(r, T(380)));
  await visor.mostrar(t, T(650));
  await acercar;
  lugar = g.id;
  sala = g;
  soltarMenos(g.id);
  ui.modo('sala');
  ui.lugar(g.nombre, g.color);
  ui.mostrarInfoSala(g, vistosSala());
  ui.mostrarRegreso('Volver a la casona', salir);
  ui.mostrarFlechas({ izquierda: true, derecha: true, arriba: true, abajo: true });
  puntosSala();
  ocultarPuntos(false);
  const entrada = datos[g.id]!.entrada ?? { yaw: p.yaw, pitch: 0 };
  await visor.ir({ yaw: entrada.yaw, pitch: 0, fov: fovBase() }, T(1100));
  ocupado = false;
  ui.mostrarPista(ui.tactil ? 'Toca los objetos para conocerlos' : 'Haz clic en los objetos para conocerlos');
}

const vistosSala = () => (sala ? sala.objetos.filter((o) => vistos.has(o.id)).length : 0);

function puntosSala() {
  if (!sala) return;
  const g = sala;
  mostrarPuntos([
    ...g.objetos.map((o) => ({ id: o.id, nombre: o.nombre, color: g.color, alTocar: () => abrirFicha(o) })),
    { id: 'salida', nombre: 'Volver a la casona', color: '#fead15', alTocar: salir },
  ]);
}

async function salir() {
  if (ocupado || !sala) return;
  ocupado = true;
  const g = sala;
  ui.toque(0);
  ui.mostrarFicha(null);
  antesDeFicha = null;
  ocultarPuntos(true);
  ui.mostrarRegreso(null);
  ui.mostrarInfoSala(null);
  const t = await panorama('casona');
  const yawArco = datos.casona![g.id].yaw;
  const alejar = visor.ir({ fov: Math.min(visor.fovMax, visor.vista.fov * 1.25) }, T(700));
  await visor.mostrar(t, T(650));
  await alejar;
  lugar = 'casona';
  sala = null;
  soltarMenos();
  // De vuelta en la casona, frente al arco por el que se entró
  visor.vista = { yaw: yawArco, pitch: 2, fov: 30 };
  enCasona();
  await visor.ir({ yaw: yawArco, pitch: 0, fov: fovBase() }, T(900));
  ocupado = false;
}

/* ---------- Fichas ---------- */

let antesDeFicha: Vista | null = null;

async function abrirFicha(o: Objeto) {
  if (ocupado) return;
  const p = datos[lugar]![o.id];
  if (!p) return;
  ui.toque(sala ? 5 + (sala.objetos.indexOf(o) % 3) : 2);
  antesDeFicha ??= { ...visor.vista, fov: fovBase() };
  vistos.add(o.id);
  ocultarPuntos(true);
  // Acercamiento al objeto, dejándolo a la vista junto a la ficha
  const hoja = visor.aspecto < 1 || innerWidth <= 640;
  // En celular la ficha es una hoja inferior: el objeto va en la parte de arriba, que es más chica
  const fov = Math.min((p.fov ?? 40) * (hoja ? 1.7 : 1), fovBase());
  const tanV = Math.tan((fov * Math.PI) / 360);
  let yaw = p.yaw;
  let pitch = p.pitch;
  if (hoja) {
    pitch = p.pitch - (Math.atan(0.42 * tanV) * 180) / Math.PI;
  } else {
    const ficha = Math.min(24 * 16, innerWidth - 32) + 32;
    const ndc = (innerWidth - ficha) / innerWidth - 1;
    const tanH = tanV * visor.aspecto;
    yaw = p.yaw - (Math.atan(ndc * tanH) * 180) / Math.PI;
  }
  ui.mostrarFicha(o, cerrarFicha);
  if (sala) ui.mostrarInfoSala(sala, vistosSala());
  await visor.ir({ yaw, pitch, fov }, T(900));
}

async function cerrarFicha() {
  ui.mostrarFicha(null);
  ocultarPuntos(false);
  if (sala) puntosSala();
  else puntosCasona();
  const vuelta = antesDeFicha;
  antesDeFicha = null;
  if (vuelta) await visor.ir({ fov: vuelta.fov, pitch: Math.max(-20, Math.min(20, visor.vista.pitch)) }, T(700));
  if (sala && vistosSala() === sala.objetos.length && !celebradas.has(sala.id)) {
    celebradas.add(sala.id);
    const restantes = generos.filter((g) => !g.objetos.every((o) => vistos.has(o.id))).length;
    ui.mostrarPista(restantes ? `¡Conociste toda la sala! Vuelve a la casona para visitar otra` : '¡Recorriste todo el museo!');
  }
}
const celebradas = new Set<string>();

/* ---------- Flechas ---------- */

/** Direcciones de los arcos y objetos del lugar actual */
function paradas() {
  const d = datos[lugar] ?? {};
  return Object.entries(d)
    .filter(([k, v]) => k !== 'entrada' && typeof v === 'object' && v !== null && 'yaw' in v)
    .map(([, v]) => (v as DatosPunto).yaw);
}

ui.alUsarFlecha((d) => {
  if (ocupado || (lugar === 'casona' && asomado)) return;
  const { yaw, pitch } = visor.vista;
  ui.toque(-5);
  if (d === 'izquierda' || d === 'derecha') {
    let destino: number;
    if (visor.fovHorizontal(fovBase()) >= 80) {
      // Pantalla ancha: de pared en pared
      destino = Math.round(angulo(yaw) / 90) * 90 + (d === 'derecha' ? 90 : -90);
    } else {
      // Pantalla angosta (celular vertical): al siguiente arco u objeto, para que quede centrado
      const deltas = paradas().map((y) => angulo(y - yaw));
      const siguiente = d === 'derecha' ? Math.min(...deltas.filter((x) => x > 8)) : Math.max(...deltas.filter((x) => x < -8));
      destino = yaw + (Number.isFinite(siguiente) ? siguiente : d === 'derecha' ? 45 : -45);
    }
    visor.ir({ yaw: destino, pitch: 0, fov: fovBase() }, T(750));
  } else if (d === 'arriba') {
    visor.ir({ pitch: pitch < -15 ? 0 : 62, fov: fovBase() }, T(700));
  } else {
    visor.ir({ pitch: pitch > 15 ? 0 : -62, fov: fovBase() }, T(700));
  }
});

addEventListener('resize', () => {
  ajustarLimites();
  if (!ocupado && !antesDeFicha && !asomado) visor.ir({ fov: fovBase() }, 0);
});

/* ---------- Inicio ---------- */

async function iniciar() {
  ui.progreso(0.05, 'Abriendo la casona…');
  ajustarLimites();
  const vistaInicial: Vista = { yaw: 0, pitch: 0, fov: fovBase() };
  try {
    const t = await panorama('casona', (p) => ui.progreso(0.05 + p * 0.9));
    if (!datos.casona) throw new Error('Sin datos de la casona');
    visor.vista = { ...vistaInicial, fov: fovBase() + 14 };
    await visor.mostrar(t);
  } catch (e) {
    ui.progreso(0, 'No se pudo abrir la casona. Revisa tu conexión y vuelve a intentar.');
    throw e;
  }
  ui.progreso(1, 'Listo');
  enCasona();
  ui.terminarCarga();

  // Enlaces directos a un estado (para revisar o capturar)
  const vista = params.get('vista');
  const salaQ = params.get('sala');
  const asomo = params.get('asomo');
  const ficha = params.get('ficha');
  // Una ficha de sala entra primero a su sala
  const gFicha = ficha ? generos.find((g) => g.objetos.some((o) => o.id === ficha)) : undefined;
  const gSala = generos.find((g) => g.id === (salaQ ?? gFicha?.id));
  if (gSala) await entrar(gSala);
  if (asomo) {
    const g = generos.find((x) => x.id === asomo);
    if (g) await asomarse(g);
  }
  if (vista) {
    const yaw = { frente: 0, derecha: 90, fondo: 180, izquierda: -90 }[vista];
    const pitch = { arriba: 62, abajo: -62 }[vista];
    await visor.ir({ yaw: yaw ?? 0, pitch: pitch ?? 0, fov: fovBase() }, 0);
  }
  if (ficha) {
    const o = [...casona.objetos, ...generos.flatMap((g) => g.objetos)].find((x) => x.id === ficha);
    if (o) await abrirFicha(o);
  }
  if (!instantaneo) {
    await visor.ir({ fov: fovBase() }, T(1600));
    ui.mostrarPista(ui.tactil ? 'Desliza para mirar · toca un arco' : 'Arrastra o usa las flechas para mirar · haz clic en un arco para asomarte');
    // Se adelanta la sala del frente para que entrar sea inmediato
    setTimeout(() => panorama('marinera'), 2500);
  }
}

iniciar();
