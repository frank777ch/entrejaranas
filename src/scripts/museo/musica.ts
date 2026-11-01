// Música de fondo de las salas: un solo <audio> que cambia de tema al entrar y se apaga al salir.
// Los navegadores solo dejan sonar tras un gesto del visitante: `sonar()` se llama dentro del clic
// de "Entrar"; si aun así se bloquea (enlace directo a una sala), arranca con el primer toque.
import type { Musica } from '../../data/museo';

const VOLUMEN = 0.45;
const FUNDIDO = 1200;
const CLAVE = 'museo-silencio';

const raiz = document.querySelector<HTMLElement>('.proto')!;
const boton = raiz.querySelector<HTMLButtonElement>('.sonido')!;
const audio = new Audio();
audio.loop = true;
audio.preload = 'none';

let actual: Musica | null = null;
let silencio = leer();
let animacion = 0;
let pendiente = false;

function leer() {
  try {
    return localStorage.getItem(CLAVE) === '1';
  } catch {
    return false;
  }
}

function guardar() {
  try {
    localStorage.setItem(CLAVE, silencio ? '1' : '0');
  } catch {
    // Sin almacenamiento: la preferencia dura solo esta visita
  }
}

/** Lleva el volumen a `hasta` poco a poco; en iOS el volumen no se puede cambiar y solo pausa */
function fundir(hasta: number, alTerminar?: () => void) {
  cancelAnimationFrame(animacion);
  const desde = audio.volume;
  const inicio = performance.now();
  const paso = (t: number) => {
    const p = Math.min(1, (t - inicio) / FUNDIDO);
    audio.volume = desde + (hasta - desde) * p;
    if (p < 1) animacion = requestAnimationFrame(paso);
    else alTerminar?.();
  };
  animacion = requestAnimationFrame(paso);
}

function tocar() {
  if (!actual || silencio || document.hidden) return;
  audio.play().then(
    () => {
      pendiente = false;
      fundir(VOLUMEN);
    },
    () => {
      // Bloqueado por el navegador: se reintenta con el próximo toque o tecla
      pendiente = true;
    },
  );
}

function pintarBoton() {
  boton.hidden = !actual;
  boton.setAttribute('aria-pressed', String(silencio));
  boton.setAttribute('aria-label', silencio ? 'Activar la música' : 'Silenciar la música');
  boton.title = actual ? `${actual.tema} · ${actual.interpretes}` : '';
}

/** Cambia la música al tema de la sala, o la apaga con `null` */
export function sonar(m: Musica | null) {
  if (m?.archivo === actual?.archivo) return;
  actual = m;
  pintarBoton();
  if (!m) {
    fundir(0, () => audio.pause());
    return;
  }
  cancelAnimationFrame(animacion);
  audio.pause();
  audio.src = m.archivo;
  audio.volume = 0;
  tocar();
}

boton.addEventListener('click', () => {
  silencio = !silencio;
  guardar();
  pintarBoton();
  if (silencio) fundir(0, () => audio.pause());
  else tocar();
});

const reintentar = (e: Event) => {
  // El botón de sonido decide por sí mismo
  if (pendiente && !boton.contains(e.target as Node)) tocar();
};
addEventListener('pointerdown', reintentar, true);
addEventListener('keydown', reintentar, true);

// Con la pestaña oculta no suena
document.addEventListener('visibilitychange', () => {
  if (document.hidden) audio.pause();
  else tocar();
});

pintarBoton();
