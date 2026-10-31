// Controles del museo virtual: flechas, regreso, asomo y ficha.
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
  if (!o) return;
  $('.ficha__categoria').textContent = recorrido ? `Pieza ${recorrido.indice + 1} de ${recorrido.total} · ${o.categoria}` : o.categoria;
  $('.ficha__titulo').textContent = o.nombre;
  $('.ficha__texto').textContent = o.texto;
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

export { casona };
