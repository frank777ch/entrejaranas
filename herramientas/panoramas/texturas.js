// Texturas dibujadas con canvas para la escena de los panoramas.
// Se generan una sola vez al renderizar: no llegan al sitio, solo el panorama final.
import * as THREE from 'three';

export const FUENTE = '"Libre Baskerville", Georgia, serif';

export function lienzo(w, h) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  return [c, c.getContext('2d')];
}

export function aTextura(c, { repetir = false, srgb = true } = {}) {
  const t = new THREE.CanvasTexture(c);
  if (srgb) t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 16;
  if (repetir) t.wrapS = t.wrapT = THREE.RepeatWrapping;
  return t;
}

// Azar con semilla: la escena sale igual en cada render
export function azar(semilla) {
  let s = semilla % 2147483647 || 1;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

function manchas(g, w, h, r, n, claro, oscuro, radio = [30, 120]) {
  for (let i = 0; i < n; i++) {
    const x = r() * w;
    const y = r() * h;
    const rad = radio[0] + r() * (radio[1] - radio[0]);
    const gr = g.createRadialGradient(x, y, 0, x, y, rad);
    gr.addColorStop(0, r() > 0.5 ? claro : oscuro);
    gr.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = gr;
    // Se dibuja también en los bordes opuestos para que la textura repita sin costuras
    for (const dx of [-w, 0, w]) for (const dy of [-h, 0, h]) {
      g.save();
      g.translate(dx, dy);
      g.fillRect(x - rad, y - rad, rad * 2, rad * 2);
      g.restore();
    }
  }
}

function grano(g, w, h, r, n, alfa = 0.05) {
  for (let i = 0; i < n; i++) {
    g.fillStyle = r() > 0.5 ? `rgba(0,0,0,${alfa})` : `rgba(255,255,255,${alfa * 0.8})`;
    g.fillRect(r() * w, r() * h, 1 + r() * 2, 1 + r() * 2);
  }
}

/** Enlucido de pared, con manchas suaves de cal y pigmento */
export function yeso(base = '#d4a159', semilla = 11) {
  const [c, g] = lienzo(1024, 1024);
  const r = azar(semilla);
  g.fillStyle = base;
  g.fillRect(0, 0, 1024, 1024);
  manchas(g, 1024, 1024, r, 140, 'rgba(255,240,205,0.10)', 'rgba(110,60,20,0.09)', [40, 220]);
  grano(g, 1024, 1024, r, 26000, 0.035);
  return aTextura(c, { repetir: true });
}

/** Azulejos sevillanos del zócalo (4 × 4 piezas de 14 cm) */
export function azulejo() {
  const T = 128;
  const [c, g] = lienzo(T * 4, T * 4);
  const r = azar(5);
  const azul = '#1d4a8a';
  const ocre = '#d8952a';
  const verde = '#2f6b47';
  for (let fy = 0; fy < 4; fy++)
    for (let fx = 0; fx < 4; fx++) {
      const x = fx * T;
      const y = fy * T;
      g.save();
      g.translate(x, y);
      g.beginPath();
      g.rect(0, 0, T, T);
      g.clip();
      // Esmalte
      const tono = 232 + Math.floor(r() * 14);
      g.fillStyle = `rgb(${tono},${tono - 8},${tono - 26})`;
      g.fillRect(0, 0, T, T);
      // Cuartos de círculo en las esquinas: al juntarse forman rosetones
      for (const [cx, cy] of [[0, 0], [T, 0], [0, T], [T, T]]) {
        g.fillStyle = azul;
        g.beginPath();
        g.arc(cx, cy, T * 0.36, 0, Math.PI * 2);
        g.fill();
        g.fillStyle = ocre;
        g.beginPath();
        g.arc(cx, cy, T * 0.24, 0, Math.PI * 2);
        g.fill();
        g.fillStyle = azul;
        g.beginPath();
        g.arc(cx, cy, T * 0.1, 0, Math.PI * 2);
        g.fill();
      }
      // Flor central de cuatro pétalos
      g.translate(T / 2, T / 2);
      for (let k = 0; k < 4; k++) {
        g.rotate(Math.PI / 2);
        g.fillStyle = azul;
        g.beginPath();
        g.ellipse(0, -T * 0.2, T * 0.09, T * 0.19, 0, 0, Math.PI * 2);
        g.fill();
        g.fillStyle = verde;
        g.beginPath();
        g.ellipse(T * 0.2, -T * 0.2, T * 0.045, T * 0.1, Math.PI / 4, 0, Math.PI * 2);
        g.fill();
      }
      g.fillStyle = ocre;
      g.beginPath();
      g.arc(0, 0, T * 0.08, 0, Math.PI * 2);
      g.fill();
      g.restore();
      // Junta
      g.strokeStyle = 'rgba(120,105,85,0.9)';
      g.lineWidth = 2;
      g.strokeRect(x + 1, y + 1, T - 2, T - 2);
    }
  grano(g, T * 4, T * 4, r, 6000, 0.04);
  return aTextura(c, { repetir: true });
}

/** Cenefa: hilera de remate sobre el zócalo de azulejos */
export function cenefa() {
  const [c, g] = lienzo(512, 64);
  g.fillStyle = '#e9dfc8';
  g.fillRect(0, 0, 512, 64);
  g.fillStyle = '#1d4a8a';
  g.fillRect(0, 6, 512, 10);
  g.fillRect(0, 48, 512, 10);
  g.fillStyle = '#d8952a';
  for (let x = 0; x < 512; x += 32) {
    g.beginPath();
    g.moveTo(x, 32);
    g.lineTo(x + 16, 20);
    g.lineTo(x + 32, 32);
    g.lineTo(x + 16, 44);
    g.closePath();
    g.fill();
  }
  g.fillStyle = '#1d4a8a';
  for (let x = 16; x < 512; x += 32) {
    g.beginPath();
    g.arc(x, 32, 4, 0, Math.PI * 2);
    g.fill();
  }
  return aTextura(c, { repetir: true });
}

/** Damero de mármol: piezas claras y oscuras de 50 cm */
export function damero() {
  const N = 512;
  const [c, g] = lienzo(N * 2, N * 2);
  const r = azar(23);
  for (let fy = 0; fy < 2; fy++)
    for (let fx = 0; fx < 2; fx++) {
      const oscuro = (fx + fy) % 2 === 1;
      const x = fx * N;
      const y = fy * N;
      g.save();
      g.beginPath();
      g.rect(x, y, N, N);
      g.clip();
      g.fillStyle = oscuro ? '#2b2724' : '#e8e0cf';
      g.fillRect(x, y, N, N);
      manchas(g, N * 2, N * 2, r, 20, oscuro ? 'rgba(90,80,70,0.25)' : 'rgba(255,255,255,0.35)', oscuro ? 'rgba(0,0,0,0.3)' : 'rgba(150,130,100,0.18)', [30, 160]);
      // Vetas del mármol
      g.strokeStyle = oscuro ? 'rgba(200,190,170,0.18)' : 'rgba(120,105,90,0.22)';
      for (let v = 0; v < 6; v++) {
        g.lineWidth = 0.6 + r() * 1.6;
        g.beginPath();
        let px = x + r() * N;
        let py = y;
        g.moveTo(px, py);
        while (py < y + N) {
          px += (r() - 0.5) * 40;
          py += 10 + r() * 30;
          g.lineTo(px, py);
        }
        g.stroke();
      }
      g.restore();
      g.strokeStyle = 'rgba(60,50,40,0.55)';
      g.lineWidth = 3;
      g.strokeRect(x + 1.5, y + 1.5, N - 3, N - 3);
    }
  return aTextura(c, { repetir: true });
}

function vetas(g, x, y, w, h, r, oscuro, densidad = 3) {
  g.strokeStyle = oscuro;
  for (let i = 0; i < h / densidad; i++) {
    g.globalAlpha = 0.05 + r() * 0.14;
    g.lineWidth = 0.6 + r() * 1.6;
    const yy = y + r() * h;
    g.beginPath();
    g.moveTo(x, yy);
    for (let xx = x; xx <= x + w; xx += 24) g.lineTo(xx, yy + Math.sin(xx * 0.012 + i) * 2.4 + (r() - 0.5) * 1.6);
    g.stroke();
  }
  g.globalAlpha = 1;
}

const cacheMadera = new Map();
/** Madera con vetas (barnizada) */
export function madera(base = '#6b3a1c', veta = '#2a1206', semilla = 3) {
  const clave = base + veta + semilla;
  if (cacheMadera.has(clave)) return cacheMadera.get(clave);
  const [c, g] = lienzo(512, 512);
  const r = azar(semilla);
  g.fillStyle = base;
  g.fillRect(0, 0, 512, 512);
  vetas(g, 0, 0, 512, 512, r, veta);
  const t = aTextura(c, { repetir: true });
  cacheMadera.set(clave, t);
  return t;
}

/** Entablado de madera para pisos de las salas */
export function entablado(tonos = ['#7a4a26', '#875330', '#6e4020', '#8f5a33', '#7f4d2a'], semilla = 7) {
  const [c, g] = lienzo(1024, 1024);
  const r = azar(semilla);
  const filas = 8;
  const alto = 1024 / filas;
  for (let f = 0; f < filas; f++) {
    let x = -r() * 400;
    while (x < 1024) {
      const largo = 260 + r() * 340;
      g.fillStyle = tonos[Math.floor(r() * tonos.length)];
      g.fillRect(x, f * alto, largo, alto);
      vetas(g, x, f * alto, largo, alto, r, '#2a1608');
      g.fillStyle = 'rgba(20,8,2,0.55)';
      g.fillRect(x, f * alto, 2, alto);
      x += largo;
    }
    g.fillStyle = 'rgba(20,8,2,0.6)';
    g.fillRect(0, f * alto, 1024, 2);
  }
  return aTextura(c, { repetir: true });
}

/** Papel tapiz de damasco (salón de la marinera) */
export function damasco(fondo = '#7c1219', dibujo = 'rgba(190,60,60,0.35)', filete = 'rgba(230,180,90,0.22)') {
  const [c, g] = lienzo(512, 512);
  const r = azar(19);
  g.fillStyle = fondo;
  g.fillRect(0, 0, 512, 512);
  manchas(g, 512, 512, r, 40, 'rgba(255,200,180,0.05)', 'rgba(0,0,0,0.08)', [40, 140]);
  const motivo = (cx, cy, s) => {
    g.save();
    g.translate(cx, cy);
    g.scale(s, s);
    for (const lado of [1, -1]) {
      g.save();
      g.scale(lado, 1);
      g.beginPath();
      g.moveTo(0, -110);
      g.bezierCurveTo(40, -80, 70, -40, 30, -10);
      g.bezierCurveTo(80, 0, 80, 60, 30, 70);
      g.bezierCurveTo(20, 90, 10, 100, 0, 120);
      g.closePath();
      g.fillStyle = dibujo;
      g.fill();
      g.strokeStyle = filete;
      g.lineWidth = 3;
      g.stroke();
      g.beginPath();
      g.ellipse(48, -48, 10, 22, -0.6, 0, Math.PI * 2);
      g.ellipse(52, 40, 10, 20, 0.6, 0, Math.PI * 2);
      g.fill();
      g.restore();
    }
    g.beginPath();
    g.arc(0, 10, 16, 0, Math.PI * 2);
    g.strokeStyle = filete;
    g.stroke();
    g.restore();
  };
  motivo(128, 128, 0.85);
  motivo(384, 384, 0.85);
  for (const [x, y] of [[384, 128], [128, 384], [384 - 512, 128], [128 + 512, 384]]) motivo(x, y, 0.35);
  grano(g, 512, 512, r, 8000, 0.03);
  return aTextura(c, { repetir: true });
}

/** Papel a rayas (sala de la polka) */
export function rayas(a = '#e8c9d6', b = '#d6aec0', filete = 'rgba(255,255,255,0.35)') {
  const [c, g] = lienzo(256, 256);
  g.fillStyle = a;
  g.fillRect(0, 0, 256, 256);
  g.fillStyle = b;
  for (let x = 0; x < 256; x += 64) g.fillRect(x, 0, 28, 256);
  g.fillStyle = filete;
  for (let x = 30; x < 256; x += 64) g.fillRect(x, 0, 3, 256);
  return aTextura(c, { repetir: true });
}

/** Muro de adobe (festejo) */
export function adobe() {
  const [c, g] = lienzo(512, 512);
  const r = azar(31);
  g.fillStyle = '#b8743f';
  g.fillRect(0, 0, 512, 512);
  const alto = 64;
  for (let f = 0; f < 8; f++) {
    const off = f % 2 ? 0 : -64;
    for (let x = off; x < 512; x += 128) {
      const tono = 150 + Math.floor(r() * 40);
      g.fillStyle = `rgb(${tono + 40},${tono - 20},${tono - 70})`;
      g.fillRect(x + 4, f * alto + 4, 120, alto - 8);
    }
  }
  manchas(g, 512, 512, r, 50, 'rgba(255,220,170,0.12)', 'rgba(80,30,10,0.14)', [20, 90]);
  grano(g, 512, 512, r, 16000, 0.06);
  return aTextura(c, { repetir: true });
}

/** Celosía de balcón limeño: listones en rombo (con transparencia) */
export function celosia() {
  const [c, g] = lienzo(512, 512);
  g.clearRect(0, 0, 512, 512);
  g.strokeStyle = '#4a2410';
  g.lineWidth = 14;
  g.lineCap = 'square';
  for (let k = -512; k <= 1024; k += 64) {
    g.beginPath();
    g.moveTo(k, 0);
    g.lineTo(k + 512, 512);
    g.stroke();
    g.beginPath();
    g.moveTo(k, 512);
    g.lineTo(k + 512, 0);
    g.stroke();
  }
  g.strokeStyle = 'rgba(120,70,35,0.6)';
  g.lineWidth = 3;
  for (let k = -512; k <= 1024; k += 64) {
    g.beginPath();
    g.moveTo(k - 4, 0);
    g.lineTo(k + 508, 512);
    g.stroke();
  }
  return aTextura(c, { repetir: true });
}

/** Cielo de mediodía limeño (gris-celeste claro) */
export function cielo() {
  const [c, g] = lienzo(512, 512);
  const gr = g.createLinearGradient(0, 0, 0, 512);
  gr.addColorStop(0, '#bcd3e6');
  gr.addColorStop(0.6, '#eef1ee');
  gr.addColorStop(1, '#f7efe0');
  g.fillStyle = gr;
  g.fillRect(0, 0, 512, 512);
  manchas(g, 512, 512, azar(2), 18, 'rgba(255,255,255,0.5)', 'rgba(255,255,255,0.3)', [40, 120]);
  return aTextura(c);
}

/** Paisaje piurano con algarrobos (ventana de la sala del tondero) */
export function paisajePiura() {
  const [c, g] = lienzo(1024, 640);
  const r = azar(41);
  let gr = g.createLinearGradient(0, 0, 0, 400);
  gr.addColorStop(0, '#5aa0d8');
  gr.addColorStop(1, '#d9ecf2');
  g.fillStyle = gr;
  g.fillRect(0, 0, 1024, 640);
  // Cerros lejanos
  g.fillStyle = '#b7a58a';
  g.beginPath();
  g.moveTo(0, 380);
  for (let x = 0; x <= 1024; x += 32) g.lineTo(x, 350 - Math.sin(x * 0.006) * 40 - r() * 10);
  g.lineTo(1024, 640);
  g.lineTo(0, 640);
  g.fill();
  gr = g.createLinearGradient(0, 380, 0, 640);
  gr.addColorStop(0, '#e2c58d');
  gr.addColorStop(1, '#c99c5b');
  g.fillStyle = gr;
  g.fillRect(0, 400, 1024, 240);
  // Algarrobos
  for (let i = 0; i < 7; i++) {
    const x = 60 + i * 150 + r() * 60;
    const y = 470 + r() * 80;
    const s = 0.6 + r() * 0.6;
    g.strokeStyle = '#4a3020';
    g.lineWidth = 10 * s;
    g.beginPath();
    g.moveTo(x, y);
    g.quadraticCurveTo(x - 10 * s, y - 60 * s, x + 6 * s, y - 100 * s);
    g.stroke();
    for (let k = 0; k < 9; k++) {
      g.fillStyle = k % 2 ? '#4f7a2a' : '#5f8d33';
      g.beginPath();
      g.ellipse(x + (r() - 0.5) * 150 * s, y - 110 * s - r() * 50 * s, 50 * s, 26 * s, 0, 0, Math.PI * 2);
      g.fill();
    }
  }
  return aTextura(c);
}

/** Lima de noche: cielo, torres y ventanas encendidas (sala del vals) */
export function nocheLima() {
  const [c, g] = lienzo(1024, 640);
  const r = azar(53);
  const gr = g.createLinearGradient(0, 0, 0, 640);
  gr.addColorStop(0, '#0b1430');
  gr.addColorStop(0.7, '#253a6b');
  gr.addColorStop(1, '#5a4a6a');
  g.fillStyle = gr;
  g.fillRect(0, 0, 1024, 640);
  for (let i = 0; i < 160; i++) {
    g.fillStyle = `rgba(255,255,240,${0.3 + r() * 0.7})`;
    g.fillRect(r() * 1024, r() * 360, 2, 2);
  }
  g.fillStyle = '#f6eccd';
  g.beginPath();
  g.arc(800, 120, 38, 0, Math.PI * 2);
  g.fill();
  // Siluetas de la ciudad
  g.fillStyle = '#0a0f1f';
  let x = 0;
  while (x < 1024) {
    const w = 50 + r() * 90;
    const h = 120 + r() * 140;
    g.fillRect(x, 640 - h, w, h);
    for (let wy = 640 - h + 18; wy < 620; wy += 26)
      for (let wx = x + 10; wx < x + w - 12; wx += 22)
        if (r() > 0.55) {
          g.fillStyle = '#ffc56a';
          g.fillRect(wx, wy, 9, 13);
          g.fillStyle = '#0a0f1f';
        }
    x += w + 4;
  }
  // Torres de iglesia
  for (const tx of [260, 610]) {
    g.fillRect(tx, 250, 46, 390);
    g.beginPath();
    g.moveTo(tx - 6, 250);
    g.lineTo(tx + 23, 190);
    g.lineTo(tx + 52, 250);
    g.fill();
  }
  return aTextura(c);
}

/** Cartela de madera y pan de oro con el nombre del género (sobre cada arco) */
export function cartela(nombre, color) {
  const [c, g] = lienzo(1024, 256);
  const gr = g.createLinearGradient(0, 0, 0, 256);
  gr.addColorStop(0, '#f2cf7c');
  gr.addColorStop(0.5, '#b8862f');
  gr.addColorStop(1, '#e2b55c');
  g.fillStyle = gr;
  g.beginPath();
  g.roundRect(8, 8, 1008, 240, 40);
  g.fill();
  g.fillStyle = '#f3ead6';
  g.beginPath();
  g.roundRect(34, 34, 956, 188, 28);
  g.fill();
  g.fillStyle = color;
  g.fillRect(34, 196, 956, 26);
  g.fillStyle = color;
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  let size = 104;
  do {
    g.font = `700 ${size}px ${FUENTE}`;
    size -= 2;
  } while (g.measureText(nombre).width > 820);
  g.fillText(nombre, 512, 112);
  // Remates
  for (const lado of [1, -1]) {
    g.beginPath();
    g.arc(512 + lado * 470, 128, 10, 0, Math.PI * 2);
    g.fill();
  }
  return aTextura(c);
}

/** Lienzo de cuadro: imagen recortada sobre un fondo pintado */
export function lienzoCuadro(img, { fondo = ['#8a6a3c', '#3c2614'], ancho = 1024, alto = 1024, escala = 0.92 } = {}) {
  const [c, g] = lienzo(ancho, alto);
  const r = azar(img.width + img.height);
  const gr = g.createRadialGradient(ancho / 2, alto * 0.45, 40, ancho / 2, alto / 2, Math.max(ancho, alto) * 0.7);
  gr.addColorStop(0, fondo[0]);
  gr.addColorStop(1, fondo[1]);
  g.fillStyle = gr;
  g.fillRect(0, 0, ancho, alto);
  // Pinceladas
  for (let i = 0; i < 900; i++) {
    g.strokeStyle = `rgba(${r() > 0.5 ? '255,230,190' : '30,15,5'},${0.03 + r() * 0.04})`;
    g.lineWidth = 4 + r() * 10;
    const x = r() * ancho;
    const y = r() * alto;
    g.beginPath();
    g.moveTo(x, y);
    g.lineTo(x + (r() - 0.5) * 60, y + (r() - 0.5) * 30);
    g.stroke();
  }
  const s = Math.min(ancho / img.width, alto / img.height) * escala;
  g.drawImage(img, (ancho - img.width * s) / 2, alto - img.height * s - alto * 0.02, img.width * s, img.height * s);
  // Barniz y viñeta
  const v = g.createRadialGradient(ancho / 2, alto / 2, Math.min(ancho, alto) * 0.3, ancho / 2, alto / 2, Math.max(ancho, alto) * 0.75);
  v.addColorStop(0, 'rgba(255,220,150,0.04)');
  v.addColorStop(1, 'rgba(20,8,0,0.45)');
  g.fillStyle = v;
  g.fillRect(0, 0, ancho, alto);
  return aTextura(c);
}

/** Paisaje costero de Lima pintado al óleo (cuadro del salón) */
export function paisajeCosta() {
  const [c, g] = lienzo(1024, 768);
  const r = azar(61);
  let gr = g.createLinearGradient(0, 0, 0, 420);
  gr.addColorStop(0, '#9fb5c4');
  gr.addColorStop(1, '#f0dcb0');
  g.fillStyle = gr;
  g.fillRect(0, 0, 1024, 768);
  manchas(g, 1024, 768, r, 30, 'rgba(255,250,235,0.35)', 'rgba(255,240,215,0.25)', [40, 140]);
  g.fillStyle = '#7d8c8a';
  g.beginPath();
  g.moveTo(0, 430);
  g.quadraticCurveTo(300, 330, 620, 400);
  g.quadraticCurveTo(820, 440, 1024, 380);
  g.lineTo(1024, 768);
  g.lineTo(0, 768);
  g.fill();
  gr = g.createLinearGradient(0, 430, 0, 768);
  gr.addColorStop(0, '#4f7c8f');
  gr.addColorStop(1, '#2e5566');
  g.fillStyle = gr;
  g.fillRect(0, 470, 1024, 300);
  g.fillStyle = '#c9a874';
  g.beginPath();
  g.moveTo(0, 600);
  g.quadraticCurveTo(500, 560, 1024, 700);
  g.lineTo(1024, 768);
  g.lineTo(0, 768);
  g.fill();
  for (let i = 0; i < 1400; i++) {
    g.strokeStyle = `rgba(${r() > 0.5 ? '255,240,210' : '20,30,30'},${0.04 + r() * 0.05})`;
    g.lineWidth = 3 + r() * 8;
    const x = r() * 1024;
    const y = r() * 768;
    g.beginPath();
    g.moveTo(x, y);
    g.lineTo(x + (r() - 0.5) * 40, y + (r() - 0.5) * 12);
    g.stroke();
  }
  return aTextura(c);
}

/** Alfombra redonda con medallón */
export function alfombraRedonda(colores = ['#6d1218', '#1f2c4f', '#d4a24a', '#efe2c4']) {
  const N = 1024;
  const [c, g] = lienzo(N, N);
  const [vino, azul, oro, crema] = colores;
  const r = azar(71);
  g.translate(N / 2, N / 2);
  const anillo = (rad, color) => {
    g.fillStyle = color;
    g.beginPath();
    g.arc(0, 0, rad, 0, Math.PI * 2);
    g.fill();
  };
  anillo(512, azul);
  anillo(470, oro);
  anillo(455, vino);
  // Guarda de rombos
  g.fillStyle = oro;
  for (let k = 0; k < 48; k++) {
    g.save();
    g.rotate((k / 48) * Math.PI * 2);
    g.beginPath();
    g.moveTo(0, -440);
    g.lineTo(14, -420);
    g.lineTo(0, -400);
    g.lineTo(-14, -420);
    g.fill();
    g.restore();
  }
  anillo(380, crema);
  anillo(370, vino);
  // Pétalos del medallón
  for (let k = 0; k < 12; k++) {
    g.save();
    g.rotate((k / 12) * Math.PI * 2);
    g.fillStyle = k % 2 ? azul : oro;
    g.beginPath();
    g.ellipse(0, -230, 48, 120, 0, 0, Math.PI * 2);
    g.fill();
    g.restore();
  }
  anillo(120, oro);
  anillo(100, azul);
  for (let k = 0; k < 8; k++) {
    g.save();
    g.rotate((k / 8) * Math.PI * 2);
    g.fillStyle = crema;
    g.beginPath();
    g.ellipse(0, -55, 16, 40, 0, 0, Math.PI * 2);
    g.fill();
    g.restore();
  }
  anillo(22, vino);
  g.setTransform(1, 0, 0, 1, 0, 0);
  // Textura de lana
  for (let i = 0; i < 40000; i++) {
    g.fillStyle = r() > 0.5 ? 'rgba(0,0,0,0.07)' : 'rgba(255,240,220,0.05)';
    g.fillRect(r() * N, r() * N, 2, 2);
  }
  return aTextura(c);
}

/** Encaje del pañuelo: blanco con borde calado (con transparencia) */
export function encaje() {
  const [c, g] = lienzo(512, 512);
  g.fillStyle = '#f7f4ee';
  g.fillRect(0, 0, 512, 512);
  const r = azar(83);
  grano(g, 512, 512, r, 9000, 0.025);
  // Bordado de las esquinas
  g.strokeStyle = 'rgba(200,190,170,0.9)';
  g.lineWidth = 3;
  g.strokeRect(46, 46, 420, 420);
  // Calado del borde
  g.globalCompositeOperation = 'destination-out';
  for (let k = 0; k < 512; k += 22) {
    for (const [x, y] of [[k, 14], [k, 498], [14, k], [498, k]]) {
      g.beginPath();
      g.arc(x, y, 7, 0, Math.PI * 2);
      g.fill();
    }
  }
  for (let k = 11; k < 512; k += 22) {
    for (const [x, y] of [[k, 32], [k, 480], [32, k], [480, k]]) {
      g.beginPath();
      g.arc(x, y, 4, 0, Math.PI * 2);
      g.fill();
    }
  }
  g.globalCompositeOperation = 'source-over';
  return aTextura(c);
}

/** Degradado para sombras de contacto en las esquinas (falsa oclusión) */
export function degradado() {
  const [c, g] = lienzo(4, 256);
  const gr = g.createLinearGradient(0, 0, 0, 256);
  // alphaMap lee el canal verde: blanco = opaco, negro = transparente
  gr.addColorStop(0, '#ffffff');
  gr.addColorStop(0.3, '#5a5a5a');
  gr.addColorStop(1, '#000000');
  g.fillStyle = gr;
  g.fillRect(0, 0, 4, 256);
  return aTextura(c, { srgb: false });
}

/** Halo de luz para llamas y focos */
export function halo() {
  const [c, g] = lienzo(128, 128);
  const gr = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  gr.addColorStop(0, 'rgba(255,240,200,1)');
  gr.addColorStop(0.2, 'rgba(255,200,120,0.45)');
  gr.addColorStop(1, 'rgba(255,160,60,0)');
  g.fillStyle = gr;
  g.fillRect(0, 0, 128, 128);
  return aTextura(c);
}
