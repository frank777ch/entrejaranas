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

/** Muro de adobe revocado (festejo): bloques grandes que asoman bajo el enlucido */
export function adobe() {
  const [c, g] = lienzo(1024, 1024);
  const r = azar(31);
  g.fillStyle = '#d9a46c';
  g.fillRect(0, 0, 1024, 1024);
  // Juntas de los bloques, apenas marcadas
  const alto = 256;
  for (let f = 0; f < 4; f++) {
    const off = f % 2 ? 0 : -256;
    for (let x = off; x < 1024; x += 512) {
      const tono = r() * 22 - 11;
      g.fillStyle = `rgb(${214 + tono},${158 + tono},${100 + tono})`;
      g.fillRect(x + 10, f * alto + 10, 492, alto - 20);
    }
  }
  // Revoque de cal encima, con desconchados que dejan ver el barro
  manchas(g, 1024, 1024, r, 50, 'rgba(240,205,150,0.35)', 'rgba(170,100,50,0.1)', [90, 260]);
  manchas(g, 1024, 1024, r, 12, 'rgba(150,80,35,0.16)', 'rgba(150,80,35,0.12)', [25, 60]);
  grano(g, 1024, 1024, r, 30000, 0.035);
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

/* ---------- Salas de los géneros ---------- */

/** Baldosa pastelera de barro (tondero, festejo): 4 × 4 piezas de 30 cm */
export function ladrillo(tonos = ['#b5603a', '#a85634', '#bf6a42', '#9e4f2f'], semilla = 61) {
  const [c, g] = lienzo(512, 512);
  const r = azar(semilla);
  g.fillStyle = '#7a5a44';
  g.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 4; i++)
    for (let j = 0; j < 4; j++) {
      g.fillStyle = tonos[Math.floor(r() * tonos.length)];
      g.fillRect(i * 128 + 3, j * 128 + 3, 122, 122);
    }
  manchas(g, 512, 512, r, 60, 'rgba(255,210,160,0.12)', 'rgba(60,20,5,0.14)', [15, 60]);
  grano(g, 512, 512, r, 14000, 0.05);
  return aTextura(c, { repetir: true });
}

/** Techo de caña con barro (casa norteña) */
export function cana() {
  const [c, g] = lienzo(512, 512);
  const r = azar(71);
  g.fillStyle = '#b89565';
  g.fillRect(0, 0, 512, 512);
  for (let x = 0; x < 512; x += 16) {
    const tono = 170 + Math.floor(r() * 40);
    g.fillStyle = `rgb(${tono + 20},${tono - 5},${tono - 60})`;
    g.fillRect(x + 1, 0, 13, 512);
    g.fillStyle = 'rgba(60,35,10,0.35)';
    g.fillRect(x + 13, 0, 3, 512);
    for (let y = r() * 90; y < 512; y += 70 + r() * 50) g.fillRect(x + 1, y, 13, 3);
  }
  grano(g, 512, 512, r, 9000, 0.04);
  return aTextura(c, { repetir: true });
}

/** Parquet en espiga (salón de la polka) */
export function parquet() {
  const [c, g] = lienzo(512, 512);
  const r = azar(91);
  g.fillStyle = '#4a2a14';
  g.fillRect(0, 0, 512, 512);
  const tonos = ['#a8693a', '#b5773f', '#9a5d31', '#c08048', '#8f552d'];
  const L = 128;
  const A = 32;
  for (let k = -8; k < 24; k++)
    for (let f = -4; f < 12; f++) {
      const x0 = k * A;
      const y0 = f * L + k * A;
      for (const lado of [0, 1]) {
        g.save();
        g.translate(x0 + (lado ? A : 0), y0 + (lado ? A : 0));
        g.rotate(lado ? -Math.PI / 2 : 0);
        g.fillStyle = tonos[Math.floor(r() * tonos.length)];
        g.fillRect(1, 1, A - 2, L - 2);
        g.fillStyle = 'rgba(40,15,0,0.18)';
        for (let v = 0; v < 4; v++) g.fillRect(4 + r() * (A - 8), 2, 1, L - 4);
        g.restore();
      }
    }
  grano(g, 512, 512, r, 9000, 0.03);
  return aTextura(c, { repetir: true });
}

/** Cielo de atardecer para el patio del festejo */
export function cieloTarde() {
  const [c, g] = lienzo(512, 1024);
  const gr = g.createLinearGradient(0, 0, 0, 1024);
  gr.addColorStop(0, '#16224a');
  gr.addColorStop(0.45, '#3d3f78');
  gr.addColorStop(0.75, '#b8607a');
  gr.addColorStop(1, '#f2a35e');
  g.fillStyle = gr;
  g.fillRect(0, 0, 512, 1024);
  const r = azar(5);
  for (let i = 0; i < 90; i++) {
    g.fillStyle = `rgba(255,250,235,${0.25 + r() * 0.6})`;
    g.fillRect(r() * 512, r() * 420, 2, 2);
  }
  manchas(g, 512, 1024, r, 14, 'rgba(255,190,150,0.18)', 'rgba(255,170,140,0.12)', [60, 160]);
  return aTextura(c);
}

/** Franjas horizontales de colores (falda del festejo) */
export function bandas(colores = ['#f2b233', '#d9472b', '#f7ecd6', '#2f7a4a', '#d9472b', '#f2b233'], n = 9) {
  const [c, g] = lienzo(64, 1024);
  for (let i = 0; i < n; i++) {
    g.fillStyle = colores[i % colores.length];
    g.fillRect(0, (i * 1024) / n, 64, 1024 / n + 1);
    g.fillStyle = 'rgba(255,255,255,0.5)';
    g.fillRect(0, (i * 1024) / n, 64, 4);
  }
  return aTextura(c);
}

/** Tejido de paja (sombrero) */
export function paja() {
  const [c, g] = lienzo(256, 256);
  const r = azar(23);
  g.fillStyle = '#e3c98d';
  g.fillRect(0, 0, 256, 256);
  for (let y = 0; y < 256; y += 6) {
    g.fillStyle = y % 12 ? 'rgba(150,110,50,0.35)' : 'rgba(255,245,210,0.35)';
    g.fillRect(0, y, 256, 2);
  }
  for (let x = 0; x < 256; x += 8) {
    g.fillStyle = 'rgba(120,85,35,0.18)';
    g.fillRect(x, 0, 1, 256);
  }
  grano(g, 256, 256, r, 4000, 0.05);
  return aTextura(c, { repetir: true });
}

/** Tejido de canasta (mimbre) */
export function mimbre() {
  const [c, g] = lienzo(256, 256);
  g.fillStyle = '#6e4a22';
  g.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 8; i++)
    for (let j = 0; j < 8; j++) {
      const h = (i + j) % 2;
      g.fillStyle = h ? '#c49a5a' : '#b0864a';
      g.fillRect(i * 32 + 2, j * 32 + (h ? 2 : 8), 28, h ? 28 : 16);
      g.fillStyle = 'rgba(255,240,200,0.25)';
      g.fillRect(i * 32 + 4, j * 32 + (h ? 4 : 10), 24, 3);
    }
  return aTextura(c, { repetir: true });
}

/** Mate burilado (checo): calabaza clara con dibujos quemados */
export function pirograbado() {
  const [c, g] = lienzo(1024, 512);
  const r = azar(37);
  g.fillStyle = '#c9a265';
  g.fillRect(0, 0, 1024, 512);
  manchas(g, 1024, 512, r, 40, 'rgba(255,230,180,0.2)', 'rgba(110,70,30,0.2)', [40, 120]);
  g.strokeStyle = '#4a2a12';
  g.lineWidth = 4;
  for (const y of [150, 360]) {
    g.beginPath();
    for (let x = 0; x <= 1024; x += 8) g.lineTo(x, y + Math.sin(x / 32) * 10);
    g.stroke();
  }
  // Aves y hojas de algarrobo entre las franjas
  g.fillStyle = '#4a2a12';
  for (let k = 0; k < 8; k++) {
    const x = 60 + k * 128;
    g.beginPath();
    g.ellipse(x, 255, 26, 12, -0.3, 0, Math.PI * 2);
    g.fill();
    g.beginPath();
    g.moveTo(x - 10, 250);
    g.lineTo(x - 40, 225);
    g.lineTo(x - 18, 262);
    g.fill();
    for (let h = 0; h < 5; h++) {
      g.beginPath();
      g.ellipse(x + 50, 220 + h * 18, 9, 4, 0.6, 0, Math.PI * 2);
      g.fill();
    }
  }
  grano(g, 1024, 512, r, 12000, 0.04);
  return aTextura(c, { repetir: true });
}

/** Pañuelo de color con borde (tondero) */
export function panueloColor() {
  const [c, g] = lienzo(512, 512);
  g.fillStyle = '#d6246e';
  g.fillRect(0, 0, 512, 512);
  g.fillStyle = '#f2b233';
  g.fillRect(28, 28, 456, 456);
  g.fillStyle = '#d6246e';
  g.fillRect(52, 52, 408, 408);
  g.fillStyle = '#2f8a5a';
  for (let i = 0; i < 6; i++)
    for (let j = 0; j < 6; j++) {
      g.beginPath();
      g.arc(90 + i * 66, 90 + j * 66, 13, 0, Math.PI * 2);
      g.fill();
    }
  g.fillStyle = '#f7ecd6';
  for (let i = 0; i < 5; i++)
    for (let j = 0; j < 5; j++) {
      g.beginPath();
      g.arc(123 + i * 66, 123 + j * 66, 6, 0, Math.PI * 2);
      g.fill();
    }
  return aTextura(c);
}

/** Mapa antiguo del departamento de Piura */
export function mapaPiura() {
  const [c, g] = lienzo(1024, 1280);
  const r = azar(97);
  g.fillStyle = '#ead7aa';
  g.fillRect(0, 0, 1024, 1280);
  manchas(g, 1024, 1280, r, 70, 'rgba(255,245,215,0.25)', 'rgba(140,95,40,0.16)', [40, 180]);
  // Proyección simple: longitud −81.5…−79.0, latitud −3.9…−6.6
  const P = (lon, lat) => [80 + ((lon + 81.5) / 2.5) * 860, 200 + ((-3.9 - lat) / 2.7) * 1000];
  // Mar
  g.fillStyle = 'rgba(120,160,170,0.35)';
  g.fillRect(0, 0, P(-81.0, 0)[0], 1280);
  const borde = [
    [-81.33, -4.25], [-81.05, -4.06], [-80.6, -4.05], [-80.2, -4.3], [-79.65, -4.4], [-79.4, -4.7], [-79.2, -5.1], [-79.3, -5.5],
    [-79.6, -5.8], [-79.9, -6.2], [-80.4, -6.36], [-80.9, -6.25], [-81.15, -5.95], [-80.95, -5.75], [-81.2, -5.4], [-81.15, -5.1], [-81.3, -4.75],
  ];
  g.beginPath();
  borde.forEach(([lon, lat], i) => g[i ? 'lineTo' : 'moveTo'](...P(lon, lat)));
  g.closePath();
  g.fillStyle = 'rgba(206,170,110,0.55)';
  g.fill();
  g.lineWidth = 5;
  g.strokeStyle = '#6b3f1a';
  g.setLineDash([18, 8]);
  g.stroke();
  g.setLineDash([]);
  // Ríos Chira y Piura
  g.strokeStyle = '#3f6f8a';
  g.lineWidth = 6;
  for (const rio of [
    [[-79.6, -4.55], [-80.2, -4.7], [-80.69, -4.88], [-81.15, -4.9]],
    [[-79.7, -5.35], [-80.2, -5.2], [-80.63, -5.19], [-80.75, -5.45], [-80.85, -5.65]],
  ]) {
    g.beginPath();
    rio.forEach(([lon, lat], i) => g[i ? 'lineTo' : 'moveTo'](...P(lon, lat)));
    g.stroke();
  }
  // Pueblos
  const pueblos = [
    ['Talara', -81.27, -4.58, 1], ['Paita', -81.11, -5.09, 1], ['Sullana', -80.69, -4.9, 1], ['PIURA', -80.63, -5.19, 2],
    ['Catacaos', -80.67, -5.27, 1], ['Sechura', -80.82, -5.56, 1], ['Chulucanas', -80.16, -5.09, 1], ['Ayabaca', -79.72, -4.64, 1],
    ['Huancabamba', -79.45, -5.24, 1], ['Morropón', -79.97, -5.18, 1],
  ];
  for (const [n, lon, lat, peso] of pueblos) {
    const [x, y] = P(lon, lat);
    g.fillStyle = peso > 1 ? '#93171e' : '#3a1a08';
    g.beginPath();
    g.arc(x, y, peso > 1 ? 14 : 9, 0, Math.PI * 2);
    g.fill();
    g.font = `${peso > 1 ? 'bold 46px' : 'italic 32px'} ${FUENTE}`;
    g.fillStyle = '#3a1a08';
    g.textAlign = x > 800 ? 'right' : 'left';
    g.fillText(n, x + (x > 800 ? -18 : 18), y - 12);
  }
  // Cerros y algarrobos
  g.fillStyle = 'rgba(90,60,30,0.6)';
  for (let k = 0; k < 14; k++) {
    const [x, y] = P(-79.5 + r() * 0.35, -4.7 - r() * 1.1);
    g.beginPath();
    g.moveTo(x - 22, y);
    g.lineTo(x, y - 30);
    g.lineTo(x + 22, y);
    g.fill();
  }
  // Rosa de los vientos
  const [rx, ry] = [170, 1080];
  g.fillStyle = '#6b3f1a';
  for (let k = 0; k < 4; k++) {
    g.save();
    g.translate(rx, ry);
    g.rotate((k * Math.PI) / 2);
    g.beginPath();
    g.moveTo(0, -90);
    g.lineTo(16, 0);
    g.lineTo(-16, 0);
    g.fill();
    g.restore();
  }
  g.font = `bold 40px ${FUENTE}`;
  g.textAlign = 'center';
  g.fillText('N', rx, ry - 100);
  // Título
  g.fillStyle = 'rgba(255,248,230,0.85)';
  g.fillRect(260, 46, 504, 120);
  g.strokeStyle = '#6b3f1a';
  g.lineWidth = 4;
  g.strokeRect(272, 58, 480, 96);
  g.fillStyle = '#3a1a08';
  g.font = `bold 58px ${FUENTE}`;
  g.fillText('PIURA', 512, 126);
  g.font = `italic 30px ${FUENTE}`;
  g.fillText('Cuna del tondero', 512, 1235);
  g.strokeStyle = '#6b3f1a';
  g.lineWidth = 10;
  g.strokeRect(14, 14, 996, 1252);
  grano(g, 1024, 1280, r, 30000, 0.04);
  return aTextura(c);
}

/** Partitura manuscrita */
export function partitura() {
  const [c, g] = lienzo(768, 1024);
  const r = azar(19);
  g.fillStyle = '#f2e7cc';
  g.fillRect(0, 0, 768, 1024);
  manchas(g, 768, 1024, r, 30, 'rgba(255,250,235,0.3)', 'rgba(150,110,50,0.12)', [40, 140]);
  g.fillStyle = '#2a1a10';
  g.textAlign = 'center';
  g.font = `bold 50px ${FUENTE}`;
  g.fillText('Vals criollo', 384, 92);
  g.font = `italic 26px ${FUENTE}`;
  g.fillText('para guitarra y canto', 384, 132);
  g.strokeStyle = '#2a1a10';
  for (let s = 0; s < 9; s++) {
    const y0 = 190 + s * 92;
    g.lineWidth = 2;
    for (let l = 0; l < 5; l++) {
      g.beginPath();
      g.moveTo(50, y0 + l * 11);
      g.lineTo(718, y0 + l * 11);
      g.stroke();
    }
    g.lineWidth = 3;
    for (const x of [50, 270, 494, 718]) {
      g.beginPath();
      g.moveTo(x, y0);
      g.lineTo(x, y0 + 44);
      g.stroke();
    }
    if (!s) {
      g.font = `bold 40px ${FUENTE}`;
      g.fillText('3', 82, y0 + 20);
      g.fillText('4', 82, y0 + 44);
    }
    for (let n = 0; n < 9; n++) {
      const x = (s ? 75 : 115) + n * 70 + r() * 8;
      const y = y0 + Math.floor(r() * 8) * 5.5;
      g.beginPath();
      g.ellipse(x, y, 8, 6, -0.4, 0, Math.PI * 2);
      g.fill();
      g.lineWidth = 2;
      g.beginPath();
      g.moveTo(x + 7, y);
      g.lineTo(x + 7, y - 34);
      g.stroke();
    }
  }
  return aTextura(c);
}

/** Invitación a un baile de sociedad */
export function invitacion() {
  const [c, g] = lienzo(768, 1024);
  const r = azar(29);
  g.fillStyle = '#f6ecd6';
  g.fillRect(0, 0, 768, 1024);
  manchas(g, 768, 1024, r, 24, 'rgba(255,252,240,0.3)', 'rgba(170,120,60,0.1)', [40, 140]);
  g.strokeStyle = '#a24b78';
  g.lineWidth = 10;
  g.strokeRect(30, 30, 708, 964);
  g.strokeStyle = '#c9a050';
  g.lineWidth = 3;
  g.strokeRect(52, 52, 664, 920);
  g.fillStyle = '#3a160c';
  g.textAlign = 'center';
  g.font = `italic 34px ${FUENTE}`;
  g.fillText('Se invita a usted y familia al', 384, 190);
  g.font = `bold 78px ${FUENTE}`;
  g.fillText('Gran Baile', 384, 300);
  g.font = `italic 36px ${FUENTE}`;
  g.fillText('de Sociedad', 384, 352);
  g.fillStyle = '#a24b78';
  g.fillRect(234, 400, 300, 4);
  g.fillStyle = '#3a160c';
  g.font = `bold 34px ${FUENTE}`;
  g.fillText('PROGRAMA', 384, 480);
  g.font = `32px ${FUENTE}`;
  ['1. Vals', '2. Polka', '3. Mazurca', '4. Vals', '5. Polka'].forEach((t, i) => g.fillText(t, 384, 545 + i * 56));
  g.font = `italic 28px ${FUENTE}`;
  g.fillText('Lima, sábado a las nueve de la noche', 384, 880);
  return aTextura(c);
}

/** Esfera de reloj con números romanos */
export function esfera() {
  const [c, g] = lienzo(512, 512);
  g.fillStyle = '#f7f1e2';
  g.beginPath();
  g.arc(256, 256, 250, 0, Math.PI * 2);
  g.fill();
  g.strokeStyle = '#2a1a10';
  g.lineWidth = 6;
  g.beginPath();
  g.arc(256, 256, 236, 0, Math.PI * 2);
  g.stroke();
  g.fillStyle = '#2a1a10';
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  g.font = `bold 46px ${FUENTE}`;
  const romanos = ['XII', 'I', 'II', 'III', 'IIII', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI'];
  romanos.forEach((t, i) => {
    const a = (i / 12) * Math.PI * 2;
    g.fillText(t, 256 + Math.sin(a) * 186, 256 - Math.cos(a) * 186);
  });
  for (let i = 0; i < 60; i++) {
    const a = (i / 60) * Math.PI * 2;
    g.fillRect(256 + Math.sin(a) * 226 - 2, 256 - Math.cos(a) * 226 - 2, 4, 4);
  }
  g.lineCap = 'round';
  g.lineWidth = 12;
  g.beginPath();
  g.moveTo(256, 256);
  g.lineTo(256 + 90, 256 - 60);
  g.stroke();
  g.lineWidth = 7;
  g.beginPath();
  g.moveTo(256, 256);
  g.lineTo(256 - 40, 256 - 150);
  g.stroke();
  g.beginPath();
  g.arc(256, 256, 14, 0, Math.PI * 2);
  g.fill();
  return aTextura(c);
}

/** Disco de vinilo con surcos y etiqueta */
export function vinilo() {
  const [c, g] = lienzo(512, 512);
  g.fillStyle = '#0c0c0c';
  g.beginPath();
  g.arc(256, 256, 255, 0, Math.PI * 2);
  g.fill();
  for (let rad = 110; rad < 250; rad += 3) {
    g.strokeStyle = rad % 2 ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.3)';
    g.lineWidth = 1.5;
    g.beginPath();
    g.arc(256, 256, rad, 0, Math.PI * 2);
    g.stroke();
  }
  g.fillStyle = '#93171e';
  g.beginPath();
  g.arc(256, 256, 92, 0, Math.PI * 2);
  g.fill();
  g.fillStyle = '#fead15';
  g.textAlign = 'center';
  g.font = `bold 24px ${FUENTE}`;
  g.fillText('VALS CRIOLLO', 256, 226);
  g.font = `italic 18px ${FUENTE}`;
  g.fillText('Lado A · 78 rpm', 256, 300);
  g.fillStyle = '#0c0c0c';
  g.beginPath();
  g.arc(256, 256, 8, 0, Math.PI * 2);
  g.fill();
  return aTextura(c);
}

/** Pintura de máscara de diablo (rojo, negro y oro) */
export function mascaraDiablo() {
  const [c, g] = lienzo(512, 512);
  g.fillStyle = '#c3261d';
  g.fillRect(0, 0, 512, 512);
  g.fillStyle = '#f2b233';
  for (let x = 0; x < 512; x += 64) {
    g.beginPath();
    g.moveTo(x, 0);
    g.lineTo(x + 32, 70);
    g.lineTo(x + 64, 0);
    g.fill();
  }
  g.fillStyle = '#111';
  for (const y of [200, 330]) {
    for (let x = 0; x < 512; x += 48) {
      g.beginPath();
      g.arc(x + 24, y, 12, 0, Math.PI * 2);
      g.fill();
    }
  }
  g.fillStyle = '#f7ecd6';
  for (let x = 12; x < 512; x += 48) g.fillRect(x, 260, 24, 14);
  return aTextura(c, { repetir: true });
}

/** Brocado del chaleco */
export function brocado(fondo = '#5a1a2e', dibujo = 'rgba(230,180,90,0.5)') {
  const [c, g] = lienzo(256, 256);
  g.fillStyle = fondo;
  g.fillRect(0, 0, 256, 256);
  g.fillStyle = dibujo;
  for (let i = 0; i < 4; i++)
    for (let j = 0; j < 4; j++) {
      const x = i * 64 + (j % 2) * 32 + 16;
      const y = j * 64 + 32;
      g.beginPath();
      g.moveTo(x, y - 14);
      g.lineTo(x + 9, y);
      g.lineTo(x, y + 14);
      g.lineTo(x - 9, y);
      g.fill();
    }
  return aTextura(c, { repetir: true });
}

/** Mural de figuras danzantes para el patio del festejo */
export function muralFestejo() {
  const [c, g] = lienzo(1536, 640);
  const r = azar(77);
  g.fillStyle = '#e9b465';
  g.fillRect(0, 0, 1536, 640);
  manchas(g, 1536, 640, r, 40, 'rgba(255,230,180,0.25)', 'rgba(150,70,20,0.18)', [40, 160]);
  const piel = '#4a2412';
  const colores = ['#d9472b', '#2f7a4a', '#f2b233', '#2b3f6b', '#a24b78'];
  for (let k = 0; k < 7; k++) {
    const x = 130 + k * 210;
    const y = 520;
    const giro = (k % 2 ? 1 : -1) * 0.25;
    g.save();
    g.translate(x, y);
    g.rotate(giro * 0.4);
    g.fillStyle = colores[k % colores.length];
    g.beginPath();
    g.moveTo(-90, 0);
    g.quadraticCurveTo(-40, -170, 0, -200);
    g.quadraticCurveTo(40, -170, 90, 0);
    g.fill();
    g.fillStyle = '#f7ecd6';
    g.fillRect(-24, -300, 48, 110);
    g.fillStyle = piel;
    g.beginPath();
    g.arc(0, -340, 36, 0, Math.PI * 2);
    g.fill();
    g.strokeStyle = piel;
    g.lineWidth = 16;
    g.lineCap = 'round';
    g.beginPath();
    g.moveTo(-20, -280);
    g.lineTo(-80, -360 + giro * 80);
    g.moveTo(20, -280);
    g.lineTo(80, -230 - giro * 80);
    g.stroke();
    g.restore();
  }
  g.fillStyle = '#3a1a08';
  g.font = `bold 64px ${FUENTE}`;
  g.textAlign = 'center';
  g.fillText('¡Festejo!', 768, 90);
  grano(g, 1536, 640, r, 30000, 0.05);
  return aTextura(c);
}

/** Puerta de madera pintada de azul (callejón) */
export function puertaAzul() {
  const [c, g] = lienzo(256, 512);
  const r = azar(15);
  g.fillStyle = '#2f5d7a';
  g.fillRect(0, 0, 256, 512);
  g.fillStyle = 'rgba(0,0,0,0.25)';
  for (let x = 0; x < 256; x += 32) g.fillRect(x, 0, 3, 512);
  g.strokeStyle = '#d9c38c';
  g.lineWidth = 8;
  g.strokeRect(24, 24, 208, 200);
  g.strokeRect(24, 268, 208, 220);
  manchas(g, 256, 512, r, 30, 'rgba(255,255,255,0.12)', 'rgba(60,30,10,0.25)', [10, 50]);
  return aTextura(c);
}
