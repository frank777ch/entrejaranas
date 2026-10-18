// Controles comunes de los prototipos: flechas, regreso, asomo, ficha y sonido.
// Cada motor (2D o 360°) decide qué mostrar y llama a estas funciones.
import { casona, objetosPorSala, type Genero, type Objeto } from '../../data/museo-prototipo';

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

flechas.forEach((b) => b.addEventListener('click', () => alFlecha(b.dataset.dir as Dir)));
regreso.addEventListener('click', () => alRegreso());
$('.cartel__entrar').addEventListener('click', () => alEntrar());
$('.cartel__volver').addEventListener('click', () => alVolver());
$('.ficha__cerrar').addEventListener('click', () => alCerrarFicha());

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
  if (!g || !cbs) return;
  raiz.style.setProperty('--sala', g.color);
  $('.cartel__titulo').textContent = g.nombre;
  $('.cartel__texto').textContent = g.intro;
  $('.cartel__lista').replaceChildren(
    ...objetosPorSala[g.id].map((n) => Object.assign(document.createElement('li'), { textContent: n })),
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

export function mostrarFicha(o: Objeto | null, cerrar: () => void = () => {}) {
  ficha.hidden = !o;
  raiz.classList.toggle('con-ficha', !!o);
  alCerrarFicha = cerrar;
  if (!o) return;
  $('.ficha__categoria').textContent = o.categoria;
  $('.ficha__titulo').textContent = o.nombre;
  $('.ficha__texto').textContent = o.texto;
  $('.ficha__audio-texto').textContent = `· ${o.audio}`;
  $('.ficha__dato p').textContent = o.dato;
  $('.ficha__titulo').focus({ preventScroll: true });
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

/* Efecto breve al tocar (cuerda pulsada sintetizada, sin archivos) */
let audio: AudioContext | null = null;
let sonido = true;
sonidoBoton.addEventListener('click', () => {
  sonido = !sonido;
  sonidoBoton.setAttribute('aria-pressed', String(sonido));
  sonidoBoton.setAttribute('aria-label', sonido ? 'Silenciar efectos' : 'Activar efectos');
});

export function toque(nota = 0) {
  if (!sonido) return;
  audio ??= new AudioContext();
  const sr = audio.sampleRate;
  const f = 392 * 2 ** (nota / 12);
  const n = Math.round(sr / f);
  const buf = audio.createBuffer(1, Math.round(sr * 0.9), sr);
  const d = buf.getChannelData(0);
  const linea = Float32Array.from({ length: n }, () => Math.random() * 2 - 1);
  for (let i = 0; i < d.length; i++) {
    const j = i % n;
    const v = (linea[j] + linea[(j + 1) % n]) * 0.497;
    linea[j] = v;
    d[i] = v;
  }
  const src = audio.createBufferSource();
  const vol = audio.createGain();
  vol.gain.value = 0.18;
  src.buffer = buf;
  src.connect(vol).connect(audio.destination);
  src.start();
}

export { casona };
