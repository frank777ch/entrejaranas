// Controles del museo virtual: flechas, regreso, asomo, ficha y sonido.
// Cada motor (2D o 360°) decide qué mostrar y llama a estas funciones.
import { casona, type Genero, type Objeto } from '../../data/museo';

export type Dir = 'izquierda' | 'derecha' | 'arriba' | 'abajo';
export type Modo = 'carga' | 'casona' | 'asomo' | 'sala';

const raiz = document.querySelector<HTMLElement>('.proto')!;
const $ = <T extends HTMLElement>(sel: string) => raiz.querySelector<T>(sel)!;

const flechas = [...raiz.querySelectorAll<HTMLButtonElement>('.flecha')];
const regreso = $<HTMLButtonElement>('.regreso');
const cartel = $<HTMLElement>('.cartel');
const ficha = $<HTMLElement>('.ficha');
const infoSala = $<HTMLElement>('.info-sala');
const pista = $<HTMLElement>('.pista');
const sonidoBoton = $<HTMLButtonElement>('.barra__sonido');

export const tactil = matchMedia('(hover: none)').matches;
export const sinMovimiento = matchMedia('(prefers-reduced-motion: reduce)').matches;

let alFlecha: (d: Dir) => void = () => {};
let alRegreso: () => void = () => {};
let alEntrar: () => void = () => {};
let alVolver: () => void = () => {};
let alCerrarFicha: () => void = () => {};
let alPaso: ((d: number) => void) | null = null;

flechas.forEach((b) => b.addEventListener('click', () => alFlecha(b.dataset.dir as Dir)));
regreso.addEventListener('click', () => alRegreso());
$('.cartel__entrar').addEventListener('click', () => alEntrar());
$('.cartel__volver').addEventListener('click', () => alVolver());
$('.ficha__cerrar').addEventListener('click', () => alCerrarFicha());
raiz.querySelectorAll<HTMLButtonElement>('.ficha__paso').forEach((b) => b.addEventListener('click', () => alPaso?.(Number(b.dataset.paso))));

addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    if (!ficha.hidden) alCerrarFicha();
    else if (!cartel.hidden) alVolver();
    else if (!regreso.hidden) alRegreso();
    return;
  }
  const dir = ({ ArrowLeft: 'izquierda', ArrowRight: 'derecha', ArrowUp: 'arriba', ArrowDown: 'abajo' } as const)[e.key];
  const boton = dir && flechas.find((b) => b.dataset.dir === dir);
  if (boton && !boton.hidden) {
    e.preventDefault();
    alFlecha(dir);
  }
});

export function alUsarFlecha(cb: (d: Dir) => void) {
  alFlecha = cb;
}

export function modo(m: Modo) {
  raiz.dataset.modo = m;
  modoActual = m;
  sincronizarFondo();
}

/** Nombre del lugar actual en la barra superior */
export function lugar(texto: string, color = '#fead15') {
  $('.barra__texto').textContent = texto;
  raiz.style.setProperty('--sala', color);
}

/** Qué flechas se muestran */
export function mostrarFlechas(dirs: Partial<Record<Dir, boolean>>) {
  flechas.forEach((b) => (b.hidden = !dirs[b.dataset.dir as Dir]));
}

export function mostrarRegreso(texto: string | null, cb: () => void = () => {}) {
  regreso.hidden = texto === null;
  if (texto) $('.regreso__texto').textContent = texto;
  alRegreso = cb;
}

/** Panel del asomo: el visitante ve parte de la sala y decide si entra */
export function mostrarCartel(g: Genero | null, cbs?: { entrar: () => void; volver: () => void }) {
  cartel.hidden = !g;
  generoCartel = g;
  sincronizarFondo();
  if (!g || !cbs) return;
  raiz.style.setProperty('--sala', g.color);
  $('.cartel__titulo').textContent = g.nombre;
  $('.cartel__texto').textContent = g.intro;
  $('.cartel__lista').replaceChildren(
    ...g.objetos.map((o) => Object.assign(document.createElement('li'), { textContent: o.nombre })),
  );
  const entrar = $<HTMLButtonElement>('.cartel__entrar');
  entrar.textContent = g.completa ? 'Entrar a la sala' : 'Sala en preparación';
  entrar.disabled = !g.completa;
  $('.cartel__ante').textContent = g.completa ? 'Te asomas a la sala · toca de nuevo para entrar' : 'Te asomas a la sala';
  alEntrar = cbs.entrar;
  alVolver = cbs.volver;
  if (!tactil) entrar.focus({ preventScroll: true });
}

/** Introducción de la sala (plegable) mientras se recorre */
export function mostrarInfoSala(g: Genero | null, vistos = 0) {
  infoSala.hidden = !g;
  if (g !== generoSala) {
    generoSala = g;
    sincronizarFondo();
  }
  if (!g) return;
  $('.info-sala__titulo').textContent = g.nombre;
  $('.info-sala__contador').textContent = `${vistos}/${g.objetos.length}`;
  $('.info-sala__texto').textContent = g.intro;
  $('.info-sala__interpretes').textContent = g.interpretes.length ? `Intérpretes: ${g.interpretes.join(', ')}` : '';
}

const infoAbrir = $<HTMLButtonElement>('.info-sala__abrir');
infoAbrir.addEventListener('click', () => {
  const abierto = infoAbrir.getAttribute('aria-expanded') === 'true';
  infoAbrir.setAttribute('aria-expanded', String(!abierto));
  $('.info-sala__cuerpo').hidden = abierto;
});

/** Recorrido de piezas dentro de la ficha: "Pieza 2 de 5" y flechas para pasar a la anterior o la siguiente */
export interface PasoFicha {
  indice: number;
  total: number;
  lugar: string;
  paso: (d: number) => void;
  /** Lado de la pantalla donde va la ficha (en celular siempre es una hoja abajo) */
  lado?: 'izquierda' | 'derecha';
}

export function mostrarFicha(o: Objeto | null, cerrar: () => void = () => {}, recorrido?: PasoFicha) {
  ficha.hidden = !o;
  ficha.classList.toggle('ficha--izquierda', recorrido?.lado === 'izquierda');
  raiz.classList.toggle('con-ficha', !!o);
  alCerrarFicha = cerrar;
  alPaso = recorrido?.paso ?? null;
  $('.ficha__nav').hidden = !recorrido;
  $('.ficha__lugar').hidden = !recorrido;
  if (o && recorrido) {
    $('.ficha__contador').textContent = `${recorrido.indice + 1} / ${recorrido.total}`;
    $('.ficha__lugar').textContent = recorrido.lugar;
  }
  if (o?.id !== objetoFicha?.id) detenerFragmento();
  objetoFicha = o;
  if (!o) return;
  $('.ficha__categoria').textContent = recorrido ? `Pieza ${recorrido.indice + 1} de ${recorrido.total} · ${o.categoria}` : o.categoria;
  $('.ficha__titulo').textContent = o.nombre;
  $('.ficha__texto').textContent = o.texto;
  $('.ficha__audio-texto').textContent = `· ${o.audio}`;
  $('.ficha__dato p').textContent = o.dato;
  $('.ficha__titulo').focus({ preventScroll: true });
  if (sonido && desbloqueado && !fragmento) void tocarFragmento(o);
}

/** Texto de ayuda breve en la parte inferior */
export function mostrarPista(texto: string) {
  pista.textContent = texto;
  pista.classList.remove('pista--ver');
  void pista.offsetWidth;
  pista.classList.add('pista--ver');
}

export function progreso(p: number, estado?: string) {
  $<HTMLElement>('.carga__barra span').style.transform = `scaleX(${p})`;
  if (estado) $('.carga__estado').textContent = estado;
}

export function terminarCarga() {
  raiz.classList.add('cargado');
}

/* Sonido: música de fondo según el lugar, fragmento por objeto y efecto al tocar.
   Archivos en /museo/audio (música de muestra; ver herramientas/musica). */
const AUDIO = '/museo/audio/';
const NIVEL = { casona: 0.3, asomo: 0.2, sala: 0.55 };

let ctx: AudioContext | null = null;
let maestro: GainNode | null = null;
let sonido = true;
const datos = new Map<string, Promise<ArrayBuffer | null>>();
const buffers = new Map<string, Promise<AudioBuffer | null>>();

function contexto() {
  if (!ctx) {
    ctx = new AudioContext();
    maestro = ctx.createGain();
    maestro.gain.value = sonido ? 1 : 0;
    maestro.connect(ctx.destination);
  }
  if (ctx.state === 'suspended') void ctx.resume();
  return ctx;
}

/** Descarga sin decodificar (se puede llamar antes del primer toque) */
function bajar(nombre: string) {
  let p = datos.get(nombre);
  if (!p) {
    p = fetch(`${AUDIO}${nombre}.mp3`)
      .then((r) => (r.ok ? r.arrayBuffer() : null))
      .catch(() => null);
    datos.set(nombre, p);
  }
  return p;
}

function cargar(nombre: string) {
  let p = buffers.get(nombre);
  if (!p) {
    p = bajar(nombre).then((b) => (b ? contexto().decodeAudioData(b).catch(() => null) : null));
    buffers.set(nombre, p);
  }
  return p;
}

function rampa(g: GainNode, valor: number, seg: number) {
  const ahora = g.context.currentTime;
  g.gain.cancelScheduledValues(ahora);
  g.gain.setValueAtTime(g.gain.value, ahora);
  g.gain.linearRampToValueAtTime(valor, ahora + seg);
}

let desbloqueado = false;
let fondo: { nombre: string; src: AudioBufferSourceNode; vol: GainNode } | null = null;
let deseado = { nombre: 'ambiente-casona', nivel: NIVEL.casona };
let agachado = false;

async function aplicarFondo() {
  if (!desbloqueado || modoActual === 'carga') return;
  const { nombre, nivel } = deseado;
  const objetivo = agachado ? nivel * 0.15 : nivel;
  if (fondo?.nombre === nombre) return rampa(fondo.vol, objetivo, 0.8);
  if (fondo) {
    const viejo = fondo;
    rampa(viejo.vol, 0, 1.2);
    viejo.src.stop(viejo.vol.context.currentTime + 1.3);
    fondo = null;
  }
  const buf = await cargar(nombre);
  if (!buf || deseado.nombre !== nombre || fondo) return;
  const c = contexto();
  const src = c.createBufferSource();
  const vol = c.createGain();
  src.buffer = buf;
  src.loop = true;
  vol.gain.value = 0;
  src.connect(vol).connect(maestro!);
  src.start();
  fondo = { nombre, src, vol };
  rampa(vol, agachado ? deseado.nivel * 0.15 : deseado.nivel, 1.5);
}

let modoActual: Modo = 'carga';
let generoCartel: Genero | null = null;
let generoSala: Genero | null = null;

function sincronizarFondo() {
  const g = modoActual === 'sala' ? generoSala : modoActual === 'asomo' ? generoCartel : null;
  deseado = g
    ? { nombre: `ambiente-${g.id}`, nivel: modoActual === 'sala' ? NIVEL.sala : NIVEL.asomo }
    : { nombre: 'ambiente-casona', nivel: NIVEL.casona };
  if (!desbloqueado) void bajar(deseado.nombre);
  void aplicarFondo();
}

// El navegador solo deja sonar audio después de un gesto del visitante
const desbloquear = () => {
  if (desbloqueado) return;
  desbloqueado = true;
  contexto();
  void aplicarFondo();
};
addEventListener('pointerdown', desbloquear, { capture: true });
addEventListener('keydown', desbloquear, { capture: true });

sonidoBoton.addEventListener('click', () => {
  sonido = !sonido;
  sonidoBoton.setAttribute('aria-pressed', String(sonido));
  sonidoBoton.setAttribute('aria-label', sonido ? 'Silenciar sonido' : 'Activar sonido');
  if (maestro) rampa(maestro, sonido ? 1 : 0, 0.3);
});
sonidoBoton.setAttribute('aria-label', 'Silenciar sonido');

/* Fragmento musical del objeto (se reproduce al abrir su ficha) */
const fichaAudio = $<HTMLButtonElement>('.ficha__audio');
let objetoFicha: Objeto | null = null;
let fragmento: { src: AudioBufferSourceNode; inicio: number; dur: number } | null = null;
let pedido = 0;

function marcarFragmento(sonando: boolean) {
  fichaAudio.setAttribute('aria-pressed', String(sonando));
  $('.ficha__audio-accion').textContent = sonando ? 'Sonando' : 'Escuchar';
}

function detenerFragmento() {
  pedido++;
  if (fragmento) {
    const f = fragmento;
    fragmento = null;
    f.src.onended = null;
    try {
      f.src.stop();
    } catch {}
  }
  fichaAudio.style.setProperty('--avance', '0');
  marcarFragmento(false);
  if (agachado) {
    agachado = false;
    void aplicarFondo();
  }
}

async function tocarFragmento(o: Objeto) {
  detenerFragmento();
  const mio = ++pedido;
  marcarFragmento(true);
  const buf = await cargar(o.id);
  if (mio !== pedido || objetoFicha?.id !== o.id) return;
  if (!buf) return marcarFragmento(false);
  const c = contexto();
  const src = c.createBufferSource();
  src.buffer = buf;
  src.connect(maestro!);
  src.start();
  fragmento = { src, inicio: c.currentTime, dur: buf.duration };
  src.onended = () => detenerFragmento();
  agachado = true;
  void aplicarFondo();
  const avanzar = () => {
    if (!fragmento || fragmento.src !== src) return;
    fichaAudio.style.setProperty('--avance', String(Math.min(1, (c.currentTime - fragmento.inicio) / fragmento.dur)));
    requestAnimationFrame(avanzar);
  };
  requestAnimationFrame(avanzar);
}

fichaAudio.addEventListener('click', () => {
  if (fragmento || fichaAudio.getAttribute('aria-pressed') === 'true') detenerFragmento();
  else if (objetoFicha) {
    desbloquear();
    void tocarFragmento(objetoFicha);
  }
});

/** Efecto breve al tocar (cuerda pulsada sintetizada) */
export function toque(nota = 0) {
  if (!sonido || !desbloqueado) return;
  const c = contexto();
  const sr = c.sampleRate;
  const f = 392 * 2 ** (nota / 12);
  const n = Math.round(sr / f);
  const buf = c.createBuffer(1, Math.round(sr * 0.9), sr);
  const d = buf.getChannelData(0);
  const linea = Float32Array.from({ length: n }, () => Math.random() * 2 - 1);
  for (let i = 0; i < d.length; i++) {
    const j = i % n;
    const v = (linea[j] + linea[(j + 1) % n]) * 0.497;
    linea[j] = v;
    d[i] = v;
  }
  const src = c.createBufferSource();
  const vol = c.createGain();
  vol.gain.value = 0.12;
  src.buffer = buf;
  src.connect(vol).connect(maestro!);
  src.start();
}

export { casona };
