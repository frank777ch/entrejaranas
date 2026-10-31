// Museo virtual: cámara fija, como en una novela visual.
// Cada lugar es una sola ilustración más grande que la pantalla: un fondo pintado con las artes del
// equipo de diseño encima. La cámara sigue al mouse dentro de un margen y nunca sale del cuadro;
// al elegir una pieza se acerca a ella y abre su ficha. La sala principal deja mirar más (a los
// costados y arriba); en las salas solo se mira a los costados.
// Las tomas se arman con: node herramientas/fija-ilustrada/componer.mjs
import { casona, generos, type Genero, type GeneroId, type Objeto } from '../../data/museo';
import * as ui from './interfaz';
import { Visor, type Textura, type Vista } from './visor-360';

type Lugar = 'casona' | GeneroId;

interface DatosPunto {
  /** Posición en la imagen, de 0 a 1 desde arriba a la izquierda */
  x: number;
  y: number;
  /** Recuadro [x0, y0, x1, y1] de la pieza o del arco en la imagen */
  caja?: [number, number, number, number];
}

interface DatosVista {
  ancho: number;
  alto: number;
  /** Campo horizontal que abarca la imagen, en grados */
  fovH: number;
  puntos: Record<string, DatosPunto>;
}

const RUTA = '/museo/salas';
/** Qué parte del ancho de la imagen se ve de una vez: la sala principal deja recorrer más */
const ENCUADRE: Record<'casona' | 'sala', number> = { casona: 0.6, sala: 0.8 };

const lienzo = document.querySelector<HTMLCanvasElement>('.visor-360')!;
const capa = document.querySelector<HTMLElement>('.puntos-360')!;
const visor = crearVisor();
const params = new URLSearchParams(location.search);
const instantaneo = params.has('sala') || params.has('asomo') || params.has('ficha');
const T = (ms: number) => (instantaneo || ui.sinMovimiento ? 0 : ms);

const nav = navigator as Navigator & { connection?: { saveData?: boolean }; deviceMemory?: number };
const modesto = (nav.deviceMemory ?? 8) <= 2 && (nav.hardwareConcurrency ?? 8) <= 4;
const nitida = visor.maxTextura >= 4096 && !nav.connection?.saveData && !modesto;

const datos: Partial<Record<Lugar, DatosVista>> = {};
const texturas: Partial<Record<Lugar, Textura>> = {};
const cargas: Partial<Record<Lugar, Promise<Textura>>> = {};
const generacion: Partial<Record<Lugar, number>> = {};
let lugar: Lugar = 'casona';
let sala: Genero | null = null;
let ocupado = false;
const vistos = new Set<string>();

/** Salas que se pueden recorrer (src/data/museo.ts: `completa`); las demás se muestran "en preparación" */
const lista = (g: Genero) => g.completa;

function crearVisor() {
  try {
    return new Visor(lienzo, { reducido: ui.sinMovimiento });
  } catch (e) {
    ui.progreso(0, 'Este navegador no puede mostrar el museo: necesita WebGL. Prueba con otro navegador o actualízalo.');
    throw e;
  }
}

// Si el navegador descarta el contexto gráfico (pasa en celulares al cambiar de app), se vuelve a abrir
lienzo.addEventListener('webglcontextlost', (e) => {
  e.preventDefault();
  ui.mostrarCarga();
  ui.progreso(0, 'La imagen del museo se perdió. Toca la pantalla para volver a abrirlo.');
  addEventListener('pointerdown', () => location.reload(), { once: true, capture: true });
});

/* ---------- Encuadre ---------- */

/** fov vertical del encuadre de reposo: deja ver una parte del ancho y el resto se recorre */
function fovBase(l: Lugar = lugar) {
  const t = texturas[l];
  if (!t?.plano) return 60;
  const parte = ENCUADRE[l === 'casona' ? 'casona' : 'sala'];
  const fov = (2 * Math.atan((parte * t.plano.tanH) / visor.aspecto) * 180) / Math.PI;
  return Math.min(fov, visor.fovCubrir(t));
}

/** En reposo: la sala principal deja mirar a los costados y arriba; las salas, solo a los costados */
function encerrar() {
  visor.pasarAbajo = false;
  visor.encierro = lugar === 'casona' ? { yaw: [-90, 90], pitch: [-4, 90] } : { yaw: [-90, 90], pitch: [-1.5, 1.5] };
  visor.deriva = ui.tactil ? 0 : 1;
}

/** Durante un acercamiento la cámara queda quieta donde se la deja */
function liberar() {
  visor.encierro = null;
  visor.deriva = 0;
}

function ajustarLimites() {
  visor.fovMin = 8;
  visor.fovMax = 100;
}

/* ---------- Carga ---------- */

/** Devuelve la mejor textura que haya del lugar (la grande si ya llegó). Si la descarga falla, se puede reintentar. */
async function cargar(l: Lugar, alAvanzar?: (p: number) => void): Promise<Textura> {
  if (texturas[l]) return texturas[l]!;
  if (!cargas[l]) {
    // Número de esta descarga: si soltarMenos() la cancela mientras baja, el número cambia
    const n = (generacion[l] = (generacion[l] ?? 0) + 1);
    cargas[l] = (async () => {
      try {
        const d: DatosVista =
          datos[l] ??
          (await fetch(`${RUTA}/${l}.json`).then((r) => {
            if (!r.ok) throw new Error(`${r.status} ${l}.json`);
            return r.json();
          }));
        datos[l] = d;
        // Primero la imagen mediana; la grande llega después sin hacer esperar
        const t = await visor.cargarPlano(`${RUTA}/${l}-${d.ancho / 2}.webp`, d.fovH, alAvanzar);
        if (generacion[l] !== n) {
          // Mientras bajaba, el visitante se fue a otra sala y ya no hace falta
          visor.liberar(t);
          throw new Error(`carga de ${l} cancelada`);
        }
        texturas[l] = t;
        if (nitida) mejorar(l, t);
        return t;
      } catch (e) {
        if (generacion[l] === n) delete cargas[l];
        throw e;
      }
    })();
  }
  const t = await cargas[l]!;
  return texturas[l] ?? t;
}

async function mejorar(l: Lugar, chica: Textura) {
  try {
    const grande = await visor.cargarPlano(`${RUTA}/${l}-${datos[l]!.ancho}.webp`, datos[l]!.fovH);
    if (texturas[l] !== chica) return visor.liberar(grande);
    texturas[l] = grande;
    visor.reemplazar(chica, grande);
    visor.liberar(chica);
  } catch {
    // Se queda con la mediana
  }
}

/** Libera las tomas de las otras salas, incluidas las que todavía estaban bajando */
function soltarMenos(...quedan: Lugar[]) {
  for (const l of new Set([...Object.keys(texturas), ...Object.keys(cargas)]) as Set<Lugar>) {
    if (l === 'casona' || quedan.includes(l)) continue;
    if (texturas[l]) visor.liberar(texturas[l]!);
    delete texturas[l];
    delete cargas[l];
    generacion[l] = (generacion[l] ?? 0) + 1;
  }
}

/* ---------- Puntos ---------- */

/** Dirección de un punto de la imagen del lugar actual */
const dir = (x: number, y: number, l: Lugar = lugar) => Visor.direccionPlano(texturas[l]!, x, y);

interface Marca {
  id: string;
  nombre: string;
  color: string;
  alTocar: () => void;
  siempre?: boolean;
}

function mostrarPuntos(marcas: Marca[]) {
  const d = datos[lugar]!;
  const puntos = marcas
    .filter((m) => d.puntos[m.id])
    .map((m) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'punto';
      b.style.setProperty('--sala', m.color);
      b.setAttribute('aria-label', m.nombre);
      if (m.siempre || ui.tactil) b.classList.add('punto--etiqueta');
      if (vistos.has(m.id)) b.classList.add('punto--visto');
      const n = document.createElement('span');
      n.className = 'punto__nombre';
      n.textContent = m.nombre;
      b.append(n);
      b.addEventListener('click', (e) => {
        e.stopPropagation();
        m.alTocar();
      });
      const p = d.puntos[m.id];
      return { el: b, ...dir(p.x, p.y) };
    });
  capa.replaceChildren(...puntos.map((p) => p.el));
  visor.colocarPuntos(puntos);
}

function ocultarPuntos(ocultar: boolean) {
  capa.classList.toggle('puntos-360--ocultos', ocultar);
}

/** Acercamiento máximo sin que la imagen se vea pixelada (hasta 2 px de pantalla por px de imagen) */
function fovNitido() {
  const t = texturas[lugar]!;
  const ancho = Math.max(t.lado, datos[lugar]!.ancho * 0.75);
  return (2 * Math.atan((lienzo.clientHeight * t.plano!.tanH) / (2 * ancho)) * 180) / Math.PI;
}

/** Vista que encuadra un recuadro de la imagen; `hueco` es la parte de la pantalla libre de paneles */
function encuadrar(caja: [number, number, number, number], llenar: number, hueco = { x0: 0, x1: 1, y0: 0, y1: 1 }): Vista {
  const [x0, y0, x1, y1] = caja;
  const arriba = dir((x0 + x1) / 2, y0).pitch;
  const abajo = dir((x0 + x1) / 2, y1).pitch;
  const izq = dir(x0, (y0 + y1) / 2).yaw;
  const der = dir(x1, (y0 + y1) / 2).yaw;
  const altoH = (hueco.y1 - hueco.y0) * llenar;
  const anchoH = (hueco.x1 - hueco.x0) * llenar;
  // fov para que el recuadro quepa en el hueco, a lo alto y a lo ancho
  let fov = (arriba - abajo) / altoH;
  fov = Math.max(fov, visor.fovParaAncho((der - izq) / anchoH));
  fov = Math.max(fovNitido(), Math.min(fov, fovBase()));
  // Centro del recuadro corrido hacia el centro del hueco
  const tanV = Math.tan((fov * Math.PI) / 360);
  const tanH = tanV * visor.aspecto;
  const cx = ((hueco.x0 + hueco.x1) / 2) * 2 - 1;
  const cy = 1 - ((hueco.y0 + hueco.y1) / 2) * 2;
  const centro = dir((x0 + x1) / 2, (y0 + y1) / 2);
  return { fov, yaw: centro.yaw - (Math.atan(cx * tanH) * 180) / Math.PI, pitch: centro.pitch - (Math.atan(cy * tanV) * 180) / Math.PI };
}

/** En pantallas angostas la ficha es una hoja que sube desde abajo (mismo corte que museo.css) */
const conHoja = () => matchMedia('(max-width: 40rem)').matches;

/** La ficha va del lado contrario a la pieza, para que la cámara no tenga que salir de la imagen */
const ladoFicha = (p: DatosPunto) => (p.x > 0.5 ? 'izquierda' : 'derecha');

/** Parte de la pantalla que deja libre la ficha (a un costado) o la hoja inferior (en celular) */
function huecoFicha(lado: 'izquierda' | 'derecha') {
  if (conHoja()) return { x0: 0, x1: 1, y0: 0.14, y1: 0.4 };
  // Ancho de la ficha según museo.css (24rem, o la pantalla menos los márgenes)
  const rem = parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;
  const ficha = (Math.min(24 * rem, innerWidth - 32) + 32) / innerWidth;
  return lado === 'derecha' ? { x0: 0.02, x1: 1 - ficha, y0: 0.1, y1: 0.95 } : { x0: ficha, x1: 0.98, y0: 0.1, y1: 0.95 };
}

/** Vuelve al encuadre de reposo, con la mirada al centro o hacia un punto */
function reposo(ms: number, hacia?: { yaw: number; pitch: number }) {
  encerrar();
  return visor.ir({ fov: fovBase(), yaw: hacia?.yaw ?? 0, pitch: hacia?.pitch ?? 0 }, ms);
}

/* ---------- Sala principal ---------- */

function puntosCasona() {
  mostrarPuntos([
    ...generos.map((g) => ({ id: g.id, nombre: g.nombre, color: g.color, alTocar: () => asomarse(g), siempre: true })),
    ...casona.objetos.map((o) => ({ id: o.id, nombre: o.nombre, color: '#fead15', alTocar: () => abrirFicha(o) })),
  ]);
}

function enCasona() {
  lugar = 'casona';
  ui.modo('casona');
  ui.lugar('Sala principal');
  ui.mostrarFlechas({ izquierda: true, derecha: true, arriba: true, abajo: true });
  ui.mostrarRegreso(null);
  ui.mostrarInfoSala(null);
  ui.mostrarCartel(null);
  puntosCasona();
  ocultarPuntos(false);
}

let asomado: Genero | null = null;

/** Se acerca al arco para ver la sala por dentro antes de entrar */
async function asomarse(g: Genero) {
  if (ocupado) return;
  if (asomado?.id === g.id) return entrar(g);
  asomado = g;
  enFicha = null;
  ui.modo('asomo');
  ui.mostrarFlechas({});
  ui.mostrarFicha(null);
  const p = datos.casona!.puntos[g.id];
  const listo = lista(g);
  ui.mostrarCartel(g, { entrar: () => entrar(g), volver: () => volver() });
  // El arco arriba y al centro; el panel del asomo ocupa la parte de abajo
  const hueco = conHoja() ? { x0: 0.05, x1: 0.95, y0: 0.1, y1: 0.55 } : { x0: 0.1, x1: 0.9, y0: 0.08, y1: 0.62 };
  liberar();
  const vista = encuadrar(p.caja!, 0.95, hueco);
  mostrarPuntos([{ id: g.id, nombre: listo ? 'Entrar' : 'En preparación', color: g.color, alTocar: () => entrar(g), siempre: true }]);
  // Se adelanta la descarga de la sala; si falla, entrar() la vuelve a pedir
  if (listo) cargar(g.id).catch(() => {});
  await visor.ir(vista, T(900));
}

async function volver() {
  if (ocupado || !asomado) return;
  const g = asomado;
  asomado = null;
  ui.mostrarCartel(null);
  enCasona();
  const p = datos.casona!.puntos[g.id];
  await reposo(T(800), { yaw: dir(p.x, p.y).yaw * 0.5, pitch: 0 });
}

/* ---------- Salas ---------- */

async function entrar(g: Genero) {
  if (ocupado || !lista(g)) return;
  ocupado = true;
  asomado = null;
  enFicha = null;
  ui.mostrarCartel(null);
  ocultarPuntos(true);
  try {
    await cargar(g.id);
  } catch {
    // Sin la toma no se puede entrar: de vuelta a la sala principal, con aviso
    enCasona();
    ocupado = false;
    void reposo(T(600));
    ui.mostrarPista('No se pudo abrir la sala. Revisa tu conexión y vuelve a intentar.');
    return;
  }
  try {
    const p = datos.casona!.puntos[g.id];
    // Cruza el arco: acercamiento al vano y fundido hacia la sala, que aparece algo acercada
    const centro = dir(p.x, p.y);
    const acercar = visor.ir({ ...centro, fov: Math.max(8, visor.vista.fov * 0.45) }, T(900));
    await new Promise((r) => setTimeout(r, T(380)));
    // La textura se toma recién aquí: si la versión grande llegó durante la espera, la mediana ya se liberó
    await visor.mostrar(texturas[g.id]!, T(650));
    await acercar;
    lugar = g.id;
    sala = g;
    soltarMenos(g.id);
    visor.vista = { yaw: 0, pitch: 0, fov: fovBase() * 0.7 };
    ui.modo('sala');
    ui.lugar(`Sala ${g.sala} · ${g.nombre}`, g.color);
    ui.mostrarInfoSala(g, vistosSala());
    ui.mostrarRegreso('Volver a la sala principal', salir);
    ui.mostrarFlechas({ izquierda: true, derecha: true });
    puntosSala();
    ocultarPuntos(false);
    await reposo(T(1100));
  } finally {
    ocupado = false;
  }
  ui.mostrarPista(ui.tactil ? 'Desliza para mirar · toca una pieza' : 'Mueve el mouse para mirar · haz clic en una pieza');
}

const vistosSala = () => (sala ? sala.objetos.filter((o) => vistos.has(o.id)).length : 0);

function puntosSala() {
  if (!sala) return;
  const g = sala;
  mostrarPuntos(g.objetos.map((o) => ({ id: o.id, nombre: o.nombre, color: g.color, alTocar: () => abrirFicha(o) })));
}

async function salir() {
  if (ocupado || !sala) return;
  ocupado = true;
  const g = sala;
  ui.mostrarFicha(null);
  enFicha = null;
  ocultarPuntos(true);
  ui.mostrarRegreso(null);
  ui.mostrarInfoSala(null);
  try {
    const alejar = visor.ir({ fov: Math.min(visor.fovCubrir(), visor.vista.fov * 1.2) }, T(700));
    await visor.mostrar(texturas.casona!, T(650));
    await alejar;
    lugar = 'casona';
    sala = null;
    soltarMenos();
    // De vuelta en la sala principal, frente al arco por el que se salió
    const p = datos.casona!.puntos[g.id];
    liberar();
    visor.vista = { ...dir(p.x, p.y), fov: 14 };
    enCasona();
    await reposo(T(1000), { yaw: dir(p.x, p.y).yaw * 0.5, pitch: 0 });
  } finally {
    ocupado = false;
  }
}

/* ---------- Fichas ---------- */

/** Pieza abierta y la mirada que había antes de acercarse */
let enFicha: { o: Objeto; antes: Vista } | null = null;

const piezas = () => (sala ? sala.objetos : casona.objetos).filter((o) => datos[lugar]?.puntos[o.id]);

async function abrirFicha(o: Objeto) {
  if (ocupado) return;
  const p = datos[lugar]!.puntos[o.id];
  if (!p?.caja) return;
  const todas = piezas();
  const indice = todas.indexOf(o);
  enFicha = { o, antes: enFicha?.antes ?? { ...visor.vista } };
  vistos.add(o.id);
  ocultarPuntos(true);
  ui.mostrarFicha(o, cerrarFicha, {
    indice,
    total: todas.length,
    lugar: sala ? `Sala ${sala.sala} · ${sala.nombre}` : 'Sala principal',
    paso: (d) => abrirFicha(todas[(indice + d + todas.length) % todas.length]),
    lado: ladoFicha(p),
  });
  if (sala) ui.mostrarInfoSala(sala, vistosSala());
  // Acercamiento a la pieza, que queda a la vista junto a la ficha. En celular la vista puede
  // bajar más allá del borde inferior para subir la pieza sobre la hoja, que tapa ese hueco
  liberar();
  visor.pasarAbajo = conHoja();
  await visor.ir(encuadrar(p.caja, 0.82, huecoFicha(ladoFicha(p))), T(900));
}

async function cerrarFicha() {
  if (!enFicha) return;
  const { antes } = enFicha;
  enFicha = null;
  ui.mostrarFicha(null);
  ocultarPuntos(false);
  if (sala) puntosSala();
  else puntosCasona();
  await reposo(T(750), { yaw: antes.yaw, pitch: lugar === 'casona' ? antes.pitch : 0 });
  if (sala && vistosSala() === sala.objetos.length && !celebradas.has(sala.id)) {
    celebradas.add(sala.id);
    ui.mostrarPista('¡Conociste todas las piezas de la sala! Vuelve a la sala principal para visitar otra');
  }
}
const celebradas = new Set<string>();

/* ---------- Flechas y teclado ---------- */

ui.alUsarFlecha((d) => {
  if (ocupado || asomado) return;
  // Con la ficha abierta, las flechas pasan de pieza
  if (enFicha) {
    if (d === 'izquierda' || d === 'derecha') {
      const todas = piezas();
      const i = todas.indexOf(enFicha.o);
      abrirFicha(todas[(i + (d === 'derecha' ? 1 : -1) + todas.length) % todas.length]);
    }
    return;
  }
  const r = visor.rango(fovBase());
  const { yaw, pitch } = visor.vista;
  // Cada flecha lleva al borde de ese lado o, si ya está ahí, de vuelta al centro
  const lado = (v: number, borde: number) => (Math.abs(v - borde) < 1 ? 0 : borde);
  if (d === 'izquierda') visor.ir({ yaw: yaw > 1 ? 0 : lado(yaw, r.yaw[0]) }, T(800));
  else if (d === 'derecha') visor.ir({ yaw: yaw < -1 ? 0 : lado(yaw, r.yaw[1]) }, T(800));
  else if (d === 'arriba') visor.ir({ pitch: pitch < -1 ? 0 : lado(pitch, r.pitch[1]) }, T(700));
  else visor.ir({ pitch: pitch > 1 ? 0 : lado(pitch, r.pitch[0]) }, T(700));
  visor.soltarMouse();
});

addEventListener('resize', () => {
  if (ocupado || asomado) return;
  if (enFicha) {
    const p = datos[lugar]!.puntos[enFicha.o.id];
    visor.pasarAbajo = conHoja();
    if (p.caja) visor.ir(encuadrar(p.caja, 0.82, huecoFicha(ladoFicha(p))), 0);
  } else visor.ir({ fov: fovBase() }, 0);
});

/* ---------- Inicio ---------- */

async function iniciar() {
  ui.progreso(0.05, 'Abriendo la casona…');
  ajustarLimites();
  try {
    const t = await cargar('casona', (p) => ui.progreso(0.05 + p * 0.9));
    visor.vista = { yaw: 0, pitch: 0, fov: 90 };
    await visor.mostrar(t);
    encerrar();
    visor.vista = visor.acotar({ yaw: 0, pitch: 0, fov: fovBase() * 1.15 });
  } catch (e) {
    ui.progreso(0, 'No se pudo abrir la casona. Revisa tu conexión y vuelve a intentar.');
    throw e;
  }
  ui.progreso(1, 'Listo');
  enCasona();
  ui.terminarCarga();

  // Enlaces directos a un estado (para revisar o capturar)
  const salaQ = params.get('sala');
  const asomo = params.get('asomo');
  const ficha = params.get('ficha');
  const gFicha = ficha ? generos.find((g) => g.objetos.some((o) => o.id === ficha)) : undefined;
  const gSala = generos.find((g) => g.id === (salaQ ?? gFicha?.id));
  if (gSala) await entrar(gSala);
  if (asomo) {
    const g = generos.find((x) => x.id === asomo);
    if (g) await asomarse(g);
  }
  if (ficha) {
    const o = [...casona.objetos, ...generos.flatMap((g) => g.objetos)].find((x) => x.id === ficha);
    if (o) await abrirFicha(o);
  }
  if (!instantaneo) {
    await reposo(T(1600));
    // Salvo que el visitante ya se haya asomado a un arco mientras tanto
    if (lugar === 'casona' && !asomado && !ocupado) {
      ui.mostrarPista(ui.tactil ? 'Desliza para mirar · toca un arco para asomarte' : 'Mueve el mouse para mirar · haz clic en un arco para asomarte');
    }
    // Solo la sala del centro: las demás se cargan al asomarse (cada toma pesa ~1 MB y ocupa GPU)
    setTimeout(() => cargar('vals').catch(() => {}), 2500);
  }
}

iniciar();
