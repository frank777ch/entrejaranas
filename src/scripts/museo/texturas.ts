// Texturas dibujadas con canvas: no pesan nada en la descarga.
import * as THREE from 'three';

function lienzo(w: number, h: number) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  return [c, c.getContext('2d')!] as const;
}

function aTextura(c: HTMLCanvasElement, repetir = false) {
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  if (repetir) t.wrapS = t.wrapT = THREE.RepeatWrapping;
  return t;
}

// Generador pseudoaleatorio con semilla: la madera sale igual en cada visita
function azar(semilla: number) {
  return () => {
    semilla = (semilla * 16807) % 2147483647;
    return (semilla - 1) / 2147483646;
  };
}

function vetas(g: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: () => number, oscuro: string) {
  g.strokeStyle = oscuro;
  for (let i = 0; i < h / 3; i++) {
    g.globalAlpha = 0.05 + r() * 0.12;
    g.lineWidth = 0.6 + r() * 1.4;
    const yy = y + r() * h;
    g.beginPath();
    g.moveTo(x, yy);
    for (let xx = x; xx <= x + w; xx += 24) g.lineTo(xx, yy + Math.sin(xx * 0.012 + i) * 2.2 + (r() - 0.5) * 1.5);
    g.stroke();
  }
  g.globalAlpha = 1;
}

export function piso(ancho: number, fondo: number) {
  const [c, g] = lienzo(1024, 1024);
  const r = azar(7);
  const filas = 8;
  const alto = 1024 / filas;
  const tonos = ['#7a4a26', '#875330', '#6e4020', '#8f5a33', '#7f4d2a', '#744524'];
  for (let f = 0; f < filas; f++) {
    let x = -r() * 400;
    while (x < 1024) {
      const largo = 260 + r() * 340;
      g.fillStyle = tonos[Math.floor(r() * tonos.length)];
      g.fillRect(x, f * alto, largo, alto);
      vetas(g, x, f * alto, largo, alto, r, '#3a1e0c');
      g.fillStyle = 'rgba(20,8,2,0.55)';
      g.fillRect(x, f * alto, 2, alto);
      x += largo;
    }
    g.fillStyle = 'rgba(20,8,2,0.6)';
    g.fillRect(0, f * alto, 1024, 2);
  }
  const t = aTextura(c, true);
  // Cada tabla mide ~14 cm de ancho
  t.repeat.set(ancho / 1.1, fondo / 1.1);
  t.rotation = Math.PI / 2;
  return t;
}

export function alfombra() {
  const [c, g] = lienzo(384, 1280);
  g.fillStyle = '#7d1219';
  g.fillRect(0, 0, 384, 1280);
  const r = azar(3);
  for (let i = 0; i < 4000; i++) {
    g.fillStyle = r() > 0.5 ? 'rgba(0,0,0,0.06)' : 'rgba(255,200,150,0.04)';
    g.fillRect(r() * 384, r() * 1280, 2, 2);
  }
  g.strokeStyle = '#d9a23a';
  g.lineWidth = 10;
  g.strokeRect(22, 22, 340, 1236);
  g.lineWidth = 3;
  g.strokeRect(44, 44, 296, 1192);
  // Rombos al centro, guiño a la celosía de los balcones limeños
  g.fillStyle = 'rgba(217,162,58,0.55)';
  for (let y = 120; y < 1200; y += 110) {
    g.beginPath();
    g.moveTo(192, y - 34);
    g.lineTo(226, y);
    g.lineTo(192, y + 34);
    g.lineTo(158, y);
    g.closePath();
    g.fill();
  }
  return aTextura(c);
}

export function pergamino() {
  const [c, g] = lienzo(512, 512);
  g.fillStyle = '#cfa266';
  g.fillRect(0, 0, 512, 512);
  const r = azar(11);
  for (let i = 0; i < 60; i++) {
    const x = r() * 512;
    const y = r() * 512;
    const rad = 30 + r() * 90;
    const gr = g.createRadialGradient(x, y, 0, x, y, rad);
    gr.addColorStop(0, r() > 0.5 ? 'rgba(120,80,30,0.10)' : 'rgba(255,235,190,0.10)');
    gr.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = gr;
    g.fillRect(0, 0, 512, 512);
  }
  const t = aTextura(c, true);
  t.repeat.set(3, 2);
  return t;
}

const cache = new Map<string, THREE.Material>();

function madera(clave: string, base: string, veta: string) {
  if (cache.has(clave)) return cache.get(clave)!;
  const [c, g] = lienzo(512, 512);
  g.fillStyle = base;
  g.fillRect(0, 0, 512, 512);
  vetas(g, 0, 0, 512, 512, azar(clave.length * 13), veta);
  const m = new THREE.MeshStandardMaterial({ map: aTextura(c), roughness: 0.48, metalness: 0 });
  cache.set(clave, m);
  return m;
}

export const matMadera = () => madera('madera', '#6b3a1c', '#2a1206');
export const matMaderaOscura = () => madera('madera-oscura', '#3d1f0f', '#120602');

export function placa(titulo: string, subtitulo: string) {
  const [c, g] = lienzo(640, 192);
  const gr = g.createLinearGradient(0, 0, 640, 192);
  gr.addColorStop(0, '#f6d27e');
  gr.addColorStop(0.45, '#c99a3e');
  gr.addColorStop(0.55, '#e6be63');
  gr.addColorStop(1, '#a87b2a');
  g.fillStyle = gr;
  g.fillRect(0, 0, 640, 192);
  g.strokeStyle = '#5a3a0c';
  g.lineWidth = 5;
  g.strokeRect(14, 14, 612, 164);
  g.fillStyle = '#3a2208';
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  let size = 54;
  do {
    g.font = `700 ${size}px "Libre Baskerville", Georgia, serif`;
    size -= 2;
  } while (g.measureText(titulo.toUpperCase()).width > 560);
  g.fillText(titulo.toUpperCase(), 320, 82);
  g.font = 'italic 30px "Libre Baskerville", Georgia, serif';
  g.fillText(subtitulo, 320, 140);
  return aTextura(c);
}

export function sombra() {
  const [c, g] = lienzo(128, 128);
  const gr = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  gr.addColorStop(0, 'rgba(0,0,0,0.75)');
  gr.addColorStop(0.55, 'rgba(0,0,0,0.35)');
  gr.addColorStop(1, 'rgba(0,0,0,0)');
  g.fillStyle = gr;
  g.fillRect(0, 0, 128, 128);
  return aTextura(c);
}

export function punto() {
  const [c, g] = lienzo(64, 64);
  const gr = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  gr.addColorStop(0, 'rgba(255,255,255,1)');
  gr.addColorStop(0.4, 'rgba(255,255,255,0.35)');
  gr.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = gr;
  g.fillRect(0, 0, 64, 64);
  return aTextura(c);
}
