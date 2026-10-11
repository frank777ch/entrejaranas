// Interfaz de la sala: pantalla de entrada, marcadores, ficha de cada pieza y progreso.
import { piezas, type Pieza } from './piezas';

const CLAVE = 'museo-criollo:vistas';

function leerVistas(): Set<string> {
  try {
    return new Set(JSON.parse(localStorage.getItem(CLAVE) ?? '[]'));
  } catch {
    return new Set();
  }
}
function guardarVistas(v: Set<string>) {
  try {
    localStorage.setItem(CLAVE, JSON.stringify([...v]));
  } catch {
    /* modo privado: el progreso dura solo esta visita */
  }
}

function hayWebGL() {
  try {
    const c = document.createElement('canvas');
    return !!(c.getContext('webgl2') || c.getContext('webgl'));
  } catch {
    return false;
  }
}

export async function iniciarMuseo(raiz: HTMLElement) {
  const $ = <T extends HTMLElement>(s: string) => raiz.querySelector<T>(s)!;
  const escenario = $('.escenario');
  const intro = $('.intro');
  const barra = $<HTMLElement>('.intro__barra span');
  const estado = $('.intro__estado');
  const botonEntrar = $<HTMLButtonElement>('.intro__entrar');
  const marcadores = $('.marcadores');
  const ficha = $('.ficha');
  const contador = $('.contador');
  const pista = $('.pista');
  const final = $('.final');

  if (!hayWebGL()) {
    estado.textContent = 'Tu navegador no puede mostrar la sala en 3D. Más abajo puedes leer todas las piezas.';
    raiz.classList.add('sin-3d');
    return;
  }

  const movimientoReducido = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const vistas = leerVistas();
  let actual: Pieza | null = null;

  // Las placas de bronce usan la tipografía de la marca
  await Promise.race([document.fonts.ready, new Promise((r) => setTimeout(r, 1500))]);

  const { crearSala } = await import('./sala');
  const sala = await crearSala({
    lienzo: $<HTMLCanvasElement>('canvas'),
    contenedor: escenario,
    movimientoReducido,
    alProgreso: (f) => {
      barra.style.transform = `scaleX(${f})`;
      estado.textContent = f < 1 ? `Preparando la sala… ${Math.round(f * 100)}%` : 'La sala está lista';
    },
    alPasarSobre: (p) => marcarActivo(p?.id ?? null),
    alElegir: (p) => abrir(p),
  });

  botonEntrar.hidden = false;
  botonEntrar.focus({ preventScroll: true });

  // ---------- Marcadores ----------
  const botones = new Map<string, HTMLButtonElement>();
  piezas.forEach((p, i) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'marcador';
    b.innerHTML = `<span class="marcador__num">${i + 1}</span><span class="marcador__nombre">${p.titulo}</span>`;
    b.setAttribute('aria-label', `${p.titulo}: ${p.subtitulo}`);
    b.addEventListener('click', () => abrir(p));
    b.addEventListener('pointerenter', () => marcarActivo(p.id));
    b.addEventListener('pointerleave', () => marcarActivo(null));
    marcadores.append(b);
    botones.set(p.id, b);
  });

  function marcarActivo(id: string | null) {
    botones.forEach((b, k) => b.classList.toggle('activo', k === id));
  }

  sala.alCuadro(() => {
    const ocultar = raiz.classList.contains('en-intro') || !!sala.enFoco;
    marcadores.classList.toggle('oculto', ocultar);
    if (ocultar) return;
    for (const p of piezas) {
      const b = botones.get(p.id)!;
      const pos = sala.proyectar(p.id);
      const w = escenario.clientWidth;
      // Si la pieza asoma por el borde, su marcador se queda dentro de la pantalla
      const visible = !!pos && pos.visible && pos.x > -60 && pos.x < w + 60 && pos.y > 10;
      b.classList.toggle('fuera', !visible);
      if (pos) b.style.transform = `translate(${Math.min(Math.max(pos.x, 24), w - 24)}px, ${pos.y}px)`;
      b.classList.toggle('visto', vistas.has(p.id));
    }
  });

  // ---------- Progreso ----------
  function pintarContador() {
    const n = vistas.size;
    contador.querySelector('.contador__n')!.textContent = `${n}/${piezas.length}`;
    contador.querySelectorAll('.contador__punto').forEach((el, i) => el.classList.toggle('lleno', vistas.has(piezas[i].id)));
    contador.setAttribute('aria-label', `Piezas descubiertas: ${n} de ${piezas.length}`);
  }
  contador.querySelector('.contador__puntos')!.innerHTML = piezas.map(() => '<i class="contador__punto"></i>').join('');
  pintarContador();

  // ---------- Entrada ----------
  botonEntrar.addEventListener('click', () => {
    raiz.classList.remove('en-intro');
    intro.classList.add('saliendo');
    setTimeout(() => (intro.hidden = true), 900);
    sala.entrar();
    // En celular la sala pasa a pantalla completa: así no compite con el menú de la página
    if (matchMedia('(hover: none)').matches) pantallaCompleta(true);
    else escenario.scrollIntoView({ behavior: movimientoReducido ? 'auto' : 'smooth', block: 'center' });
    setTimeout(() => pista.classList.add('visible'), movimientoReducido ? 0 : 3200);
  });
  escenario.addEventListener('pointerdown', () => pista.classList.remove('visible'), { once: false });

  // ---------- Ficha ----------
  function abrir(p: Pieza) {
    actual = p;
    const i = piezas.indexOf(p);
    $('.ficha__num').textContent = `Pieza ${i + 1} de ${piezas.length}`;
    $('.ficha__titulo').textContent = p.titulo;
    $('.ficha__subtitulo').textContent = p.subtitulo;
    $('.ficha__texto').textContent = p.texto;
    $('.ficha__dato p').textContent = p.dato;
    const hecho = $<HTMLButtonElement>('.ficha__hecho');
    hecho.textContent = vistas.has(p.id) ? 'Volver a la sala' : 'Hecho';
    ficha.hidden = false;
    requestAnimationFrame(() => ficha.classList.add('abierta'));
    ficha.scrollTop = 0;
    pista.classList.remove('visible');
    sala.enfocar(p.id);
    encuadrar();
    $<HTMLElement>('.ficha__titulo').focus({ preventScroll: true });
  }

  // La ficha va a la derecha (escritorio) o abajo (celular): la pieza se corre al espacio libre
  function encuadrar() {
    if (!actual) return sala.desplazar(0, 0);
    const lateral = ficha.offsetWidth < escenario.clientWidth * 0.7;
    if (lateral) sala.desplazar((ficha.offsetWidth + 16) / 2, 0);
    else sala.desplazar(0, (ficha.offsetHeight + 10) / 2);
  }
  new ResizeObserver(encuadrar).observe(ficha);

  function cerrar(marcar: boolean) {
    if (!actual) return;
    const id = actual.id;
    if (marcar && !vistas.has(id)) {
      vistas.add(id);
      guardarVistas(vistas);
      pintarContador();
      contador.classList.remove('latido');
      void contador.offsetWidth;
      contador.classList.add('latido');
    }
    actual = null;
    sala.desplazar(0, 0);
    ficha.classList.remove('abierta');
    setTimeout(() => !actual && (ficha.hidden = true), 400);
    sala.vistaGeneral();
    botones.get(id)?.focus({ preventScroll: true });
    if (marcar && vistas.size === piezas.length && !final.dataset.mostrado) celebrar();
  }

  function mover(paso: number) {
    if (!actual) return;
    const i = (piezas.indexOf(actual) + paso + piezas.length) % piezas.length;
    abrir(piezas[i]);
  }

  $('.ficha__hecho').addEventListener('click', () => cerrar(true));
  $('.ficha__cerrar').addEventListener('click', () => cerrar(false));
  $('.ficha__ant').addEventListener('click', () => mover(-1));
  $('.ficha__sig').addEventListener('click', () => mover(1));

  raiz.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && actual) cerrar(false);
    if (actual && (e.key === 'ArrowRight' || e.key === 'ArrowLeft') && !(e.target instanceof HTMLInputElement)) {
      e.preventDefault();
      mover(e.key === 'ArrowRight' ? 1 : -1);
    }
  });

  // ---------- Herramientas ----------
  $('.herr__general').addEventListener('click', () => (actual ? cerrar(false) : sala.vistaGeneral()));

  const botonPantalla = $<HTMLButtonElement>('.herr__pantalla');
  const enPantallaCompleta = () => !!document.fullscreenElement || raiz.classList.contains('completo');
  const marcarPantalla = () => {
    const activa = enPantallaCompleta();
    botonPantalla.setAttribute('aria-pressed', String(activa));
    botonPantalla.setAttribute('aria-label', activa ? 'Salir de pantalla completa' : 'Pantalla completa');
    // Con la sala a toda pantalla, la página de atrás no se desplaza
    document.documentElement.style.overflow = raiz.classList.contains('completo') ? 'hidden' : '';
  };
  async function pantallaCompleta(activar: boolean) {
    if (!activar) {
      if (document.fullscreenElement) await document.exitFullscreen().catch(() => {});
      raiz.classList.remove('completo');
    } else if (escenario.requestFullscreen) {
      await escenario.requestFullscreen().catch(() => raiz.classList.add('completo'));
    } else {
      // iPhone: sin API de pantalla completa, la sala ocupa toda la ventana
      raiz.classList.add('completo');
    }
    marcarPantalla();
  }
  botonPantalla.addEventListener('click', () => pantallaCompleta(!enPantallaCompleta()));
  document.addEventListener('fullscreenchange', marcarPantalla);

  // ---------- Final ----------
  function celebrar() {
    final.dataset.mostrado = '1';
    final.hidden = false;
    const confeti = final.querySelector('.confeti')!;
    const colores = ['#fead15', '#93171e', '#f0e7d8', '#a52f32', '#ffffff'];
    confeti.innerHTML = Array.from({ length: movimientoReducido ? 0 : 90 }, () => {
      const c = colores[Math.floor(Math.random() * colores.length)];
      return `<i style="left:${Math.random() * 100}%;background:${c};animation-delay:${Math.random() * 1.2}s;animation-duration:${2.6 + Math.random() * 2.2}s;--giro:${Math.random() * 720 - 360}deg"></i>`;
    }).join('');
    requestAnimationFrame(() => final.classList.add('visible'));
    final.querySelector<HTMLElement>('h2')!.focus({ preventScroll: true });
  }

  final.querySelector('.final__seguir')!.addEventListener('click', () => {
    final.classList.remove('visible');
    setTimeout(() => (final.hidden = true), 500);
  });
  final.querySelector('.final__reiniciar')!.addEventListener('click', () => {
    vistas.clear();
    guardarVistas(vistas);
    pintarContador();
    delete final.dataset.mostrado;
    final.classList.remove('visible');
    setTimeout(() => (final.hidden = true), 500);
  });
  final.querySelector('.final__compartir')!.addEventListener('click', async () => {
    const datos = { title: 'Mi museo criollo · Entre Jaranas', text: '¡Recorrí el museo criollo en 3D! Aquí nadie celebra solo:', url: location.href };
    if (navigator.share) {
      try {
        await navigator.share(datos);
      } catch {
        /* la persona canceló */
      }
    } else {
      window.open(`https://wa.me/?text=${encodeURIComponent(`${datos.text} ${datos.url}`)}`, '_blank', 'noopener');
    }
  });
}
