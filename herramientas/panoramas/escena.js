// Escena 3D de la casona y de la sala de la marinera, renderizada una sola vez
// como panoramas 360° (equirectangulares) para el prototipo B.
// Ejes: -z = frente, +x = derecha, +z = fondo, -x = izquierda. 1 unidad = 1 metro.
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/examples/jsm/libs/meshopt_decoder.module.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { generos, casona as datosCasona } from '../../src/data/museo-prototipo.ts';
import * as T from './texturas.js';
import * as P from './piezas.js';

const params = new URLSearchParams(location.search);
const RAPIDO = params.has('rapido');
const CARA = Number(params.get('cara') ?? (RAPIDO ? 768 : 2048));
const ANCHO = Number(params.get('ancho') ?? (RAPIDO ? 2048 : 4096));
const CALIDAD = Number(params.get('calidad') ?? 0.82);
const SOLO = params.get('solo');

const OJO = 1.6;
const R = 6; // media casona
const ALTO = 6.2;
const G = 0.6; // grosor de muros
const ARCO_GRANDE = { w: 3.2, hs: 2.95 };
const ARCO = { w: 2.5, hs: 2.8 };

const estado = (t) => {
  document.querySelector('#estado').textContent = t;
  console.log(t);
};

const lienzo = document.querySelector('canvas');
const renderer = new THREE.WebGLRenderer({ canvas: lienzo, antialias: false, preserveDrawingBuffer: true });
renderer.setPixelRatio(1);
renderer.setSize(ANCHO, ANCHO / 2, false);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = Number(params.get('expo') ?? 1);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

const escena = new THREE.Scene();
escena.background = new THREE.Color(0x000000);

/* ---------- Materiales ---------- */

const INVISIBLE = new THREE.MeshBasicMaterial({ visible: false });
const conRepeticion = (t, x, y = x) => P.rep(t, x, y);
const matYeso = (color, rep = 0.45, semilla = 11) =>
  new THREE.MeshStandardMaterial({ map: conRepeticion(T.yeso(color, semilla), rep), roughness: 0.94 });
const MOLDURA = new THREE.MeshStandardMaterial({ color: 0xefe5cf, roughness: 0.7 });
const VIGA = P.matMadera('#2e160a', '#0c0401', 21, 0.6, 2);
const texAzulejo = T.azulejo();
const texCenefa = T.cenefa();
const texDegradado = T.degradado();
const SOMBRA_CONTACTO = new THREE.MeshBasicMaterial({ color: 0x000000, alphaMap: texDegradado, transparent: true, opacity: 0.42, depthWrite: false });

/* ---------- Muros con vanos ---------- */

function formaMuro(L, alto, huecos) {
  const s = new THREE.Shape();
  const arcos = huecos.filter((h) => h.hs !== undefined).sort((a, b) => a.x - b.x);
  s.moveTo(-L / 2, 0);
  for (const a of arcos) {
    s.lineTo(a.x - a.w / 2, 0);
    s.lineTo(a.x - a.w / 2, a.hs);
    s.absarc(a.x, a.hs, a.w / 2, Math.PI, 0, true);
    s.lineTo(a.x + a.w / 2, 0);
  }
  s.lineTo(L / 2, 0);
  s.lineTo(L / 2, alto);
  s.lineTo(-L / 2, alto);
  s.closePath();
  for (const v of huecos.filter((h) => h.y0 !== undefined)) {
    const p = new THREE.Path();
    p.moveTo(v.x - v.w / 2, v.y0);
    p.lineTo(v.x + v.w / 2, v.y0);
    p.lineTo(v.x + v.w / 2, v.y0 + v.h);
    p.lineTo(v.x - v.w / 2, v.y0 + v.h);
    p.closePath();
    s.holes.push(p);
  }
  return s;
}

function muro(g, L, alto, huecos, material) {
  const m = new THREE.Mesh(new THREE.ShapeGeometry(formaMuro(L, alto, huecos), 40), material);
  m.receiveShadow = true;
  m.castShadow = true;
  g.add(m);
  return m;
}

/** Espesor del muro dentro de un vano (z de -G a 0) */
function derrame(g, h, material) {
  const s = new THREE.Shape();
  if (h.hs !== undefined) {
    s.moveTo(h.x - h.w / 2, 0);
    s.lineTo(h.x - h.w / 2, h.hs);
    s.absarc(h.x, h.hs, h.w / 2, Math.PI, 0, true);
    s.lineTo(h.x + h.w / 2, 0);
  } else {
    s.moveTo(h.x - h.w / 2, h.y0);
    s.lineTo(h.x + h.w / 2, h.y0);
    s.lineTo(h.x + h.w / 2, h.y0 + h.h);
    s.lineTo(h.x - h.w / 2, h.y0 + h.h);
  }
  s.closePath();
  const lado = material.clone();
  lado.side = THREE.DoubleSide;
  const m = new THREE.Mesh(new THREE.ExtrudeGeometry(s, { depth: G, bevelEnabled: false, curveSegments: 40 }), [INVISIBLE, lado]);
  m.position.z = -G;
  m.receiveShadow = true;
  m.castShadow = true;
  g.add(m);
  if (h.hs !== undefined) {
    // Umbral de mármol
    const umbral = new THREE.Mesh(new THREE.BoxGeometry(h.w, 0.04, G + 0.04), new THREE.MeshStandardMaterial({ color: 0xd9d0bd, roughness: 0.3 }));
    umbral.position.set(h.x, 0.02, -G / 2);
    umbral.receiveShadow = true;
    g.add(umbral);
  }
}

/** Marco moldurado alrededor de un arco, con impostas y clave */
function marcoArco(g, a, ancho = 0.26, prof = 0.1, mat = MOLDURA) {
  const o = a.w / 2 + ancho;
  const i = a.w / 2;
  const s = new THREE.Shape();
  s.moveTo(a.x - o, 0);
  s.lineTo(a.x - o, a.hs);
  s.absarc(a.x, a.hs, o, Math.PI, 0, true);
  s.lineTo(a.x + o, 0);
  s.lineTo(a.x + i, 0);
  s.lineTo(a.x + i, a.hs);
  s.absarc(a.x, a.hs, i, 0, Math.PI, false);
  s.lineTo(a.x - i, 0);
  s.closePath();
  const m = new THREE.Mesh(
    new THREE.ExtrudeGeometry(s, { depth: prof, bevelEnabled: true, bevelThickness: 0.025, bevelSize: 0.025, bevelSegments: 3, curveSegments: 48 }),
    mat,
  );
  m.castShadow = m.receiveShadow = true;
  g.add(m);
  for (const lado of [-1, 1]) {
    const imposta = new THREE.Mesh(new THREE.BoxGeometry(ancho + 0.14, 0.14, prof + 0.08), mat);
    imposta.position.set(a.x + lado * (i + ancho / 2), a.hs, prof / 2 + 0.02);
    const basa = new THREE.Mesh(new THREE.BoxGeometry(ancho + 0.1, 0.3, prof + 0.06), mat);
    basa.position.set(a.x + lado * (i + ancho / 2), 0.15, prof / 2 + 0.01);
    for (const n of [imposta, basa]) {
      n.castShadow = n.receiveShadow = true;
      g.add(n);
    }
  }
  const clave = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.46, prof + 0.1), mat);
  clave.position.set(a.x, a.hs + i + 0.1, prof / 2 + 0.03);
  clave.castShadow = clave.receiveShadow = true;
  g.add(clave);
}

/** Tramos de pared libres entre vanos, para el zócalo */
function tramos(L, huecos, margen, hasta = 2) {
  let libres = [[-L / 2, L / 2]];
  for (const h of huecos) {
    if (h.y0 !== undefined && h.y0 > hasta) continue;
    const a = h.x - h.w / 2 - margen;
    const b = h.x + h.w / 2 + margen;
    libres = libres.flatMap(([x0, x1]) => [
      [x0, Math.min(x1, a)],
      [Math.max(x0, b), x1],
    ]).filter(([x0, x1]) => x1 - x0 > 0.02);
  }
  return libres;
}

/** Zócalo de azulejos con cenefa y remate de madera */
function zocaloAzulejos(g, L, huecos, margen, alto = 1.15) {
  for (const [x0, x1] of tramos(L, huecos, margen)) {
    const w = x1 - x0;
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, alto), new THREE.MeshStandardMaterial({ map: conRepeticion(texAzulejo, w / 0.56, alto / 0.56), roughness: 0.22 }));
    m.position.set((x0 + x1) / 2, alto / 2, 0.006);
    m.receiveShadow = true;
    const c = new THREE.Mesh(new THREE.PlaneGeometry(w, 0.1), new THREE.MeshStandardMaterial({ map: conRepeticion(texCenefa, w / 0.56, 1), roughness: 0.25 }));
    c.position.set((x0 + x1) / 2, alto + 0.05, 0.006);
    c.receiveShadow = true;
    const remate = new THREE.Mesh(new THREE.BoxGeometry(w, 0.05, 0.04), P.MADERA);
    remate.position.set((x0 + x1) / 2, alto + 0.12, 0.02);
    remate.castShadow = remate.receiveShadow = true;
    g.add(m, c, remate);
  }
}

/** Zócalo de madera con tableros (salón de la marinera) */
function zocaloMadera(g, L, huecos, margen, alto = 1.0, mat = P.MADERA) {
  for (const [x0, x1] of tramos(L, huecos, margen)) {
    const w = x1 - x0;
    const base = new THREE.Mesh(new THREE.BoxGeometry(w, alto, 0.03), mat);
    base.position.set((x0 + x1) / 2, alto / 2, 0.015);
    base.receiveShadow = true;
    g.add(base);
    const n = Math.max(1, Math.round(w / 0.75));
    const paso = w / n;
    for (let k = 0; k < n; k++) {
      const t = new THREE.Mesh(new THREE.BoxGeometry(paso - 0.16, alto - 0.3, 0.02), mat);
      t.position.set(x0 + paso * (k + 0.5), alto / 2 + 0.02, 0.04);
      t.castShadow = t.receiveShadow = true;
      g.add(t);
    }
    const remate = new THREE.Mesh(new THREE.BoxGeometry(w, 0.06, 0.06), mat);
    remate.position.set((x0 + x1) / 2, alto, 0.03);
    remate.castShadow = true;
    g.add(remate);
  }
}

/** Cornisa blanca bajo el techo */
function cornisa(g, L, alto, mat = MOLDURA) {
  const capas = [
    [0.1, 0.1, -0.42],
    [0.18, 0.12, -0.3],
    [0.3, 0.16, -0.16],
  ];
  for (const [prof, h, dy] of capas) {
    const m = new THREE.Mesh(new THREE.BoxGeometry(L, h, prof), mat);
    m.position.set(0, alto + dy, prof / 2);
    m.receiveShadow = true;
    g.add(m);
  }
}

/** Pilastra adosada */
function pilastra(g, x, alto, mat = MOLDURA) {
  const fuste = new THREE.Mesh(new THREE.BoxGeometry(0.48, alto, 0.1), mat);
  fuste.position.set(x, alto / 2, 0.05);
  const basa = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.36, 0.16), mat);
  basa.position.set(x, 0.18, 0.08);
  const capitel = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.22, 0.18), mat);
  capitel.position.set(x, alto - 0.11, 0.09);
  for (const n of [fuste, basa, capitel]) {
    n.castShadow = n.receiveShadow = true;
    g.add(n);
  }
}

/** Sombras de contacto en el encuentro de pared con piso y techo */
function contacto(g, L, alto) {
  const piso = new THREE.Mesh(new THREE.PlaneGeometry(L, 0.55), SOMBRA_CONTACTO);
  piso.rotation.x = -Math.PI / 2;
  piso.position.set(0, 0.008, 0.275);
  // alphaMap: v = 1 (borde junto a la pared) es opaco; en la pared se invierte para oscurecer abajo
  const pared = new THREE.Mesh(new THREE.PlaneGeometry(L, 0.45), SOMBRA_CONTACTO);
  pared.position.set(0, 0.225, 0.009);
  pared.geometry.attributes.uv.array.forEach((_, i, a) => i % 2 && (a[i] = 1 - a[i]));
  const techo = new THREE.Mesh(new THREE.PlaneGeometry(L, 0.6), SOMBRA_CONTACTO.clone());
  techo.material.opacity = 0.3;
  techo.position.set(0, alto - 0.3, 0.004);
  g.add(piso, pared, techo);
}

/**
 * Cuarto de cuatro paredes que miran hacia adentro.
 * Devuelve un grupo por pared; en cada uno x corre a lo largo de la pared (izquierda → derecha
 * vista desde dentro) y +z apunta al interior.
 */
function cuarto(padre, x, z, ancho, fondo) {
  const g = new THREE.Group();
  g.position.set(x, 0, z);
  padre.add(g);
  const pared = (px, pz, giro, L) => {
    const p = new THREE.Group();
    p.position.set(px, 0, pz);
    p.rotation.y = giro;
    p.userData.L = L;
    g.add(p);
    return p;
  };
  return {
    grupo: g,
    atras: pared(0, -fondo / 2, 0, ancho),
    adelante: pared(0, fondo / 2, Math.PI, ancho),
    izq: pared(-ancho / 2, 0, Math.PI / 2, fondo),
    der: pared(ancho / 2, 0, -Math.PI / 2, fondo),
  };
}

function pisoYTecho(c, ancho, fondo, alto, matPiso, matTecho) {
  const piso = new THREE.Mesh(new THREE.PlaneGeometry(ancho, fondo), matPiso);
  piso.rotation.x = -Math.PI / 2;
  piso.receiveShadow = true;
  const techo = new THREE.Mesh(new THREE.PlaneGeometry(ancho, fondo), matTecho);
  techo.rotation.x = Math.PI / 2;
  techo.position.y = alto;
  techo.receiveShadow = true;
  techo.castShadow = true;
  piso.castShadow = true;
  c.grupo.add(piso, techo);
  return { piso, techo };
}

/** Vigas de madera bajo el techo (artesonado) */
function artesonado(c, ancho, fondo, alto, paso = 1.5, mat = VIGA) {
  const g = new THREE.Group();
  for (let x = -ancho / 2 + paso; x < ancho / 2 - 0.1; x += paso) {
    const v = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.26, fondo), mat);
    v.position.set(x, alto - 0.13, 0);
    g.add(v);
  }
  for (let z = -fondo / 2 + paso; z < fondo / 2 - 0.1; z += paso) {
    const v = new THREE.Mesh(new THREE.BoxGeometry(ancho, 0.2, 0.18), mat);
    v.position.set(0, alto - 0.1, z);
    g.add(v);
  }
  // Perímetro
  for (const [w, d, x, z] of [
    [ancho, 0.3, 0, -fondo / 2 + 0.15],
    [ancho, 0.3, 0, fondo / 2 - 0.15],
    [0.3, fondo, -ancho / 2 + 0.15, 0],
    [0.3, fondo, ancho / 2 - 0.15, 0],
  ]) {
    const v = new THREE.Mesh(new THREE.BoxGeometry(w, 0.32, d), mat);
    v.position.set(x, alto - 0.16, z);
    g.add(v);
  }
  g.traverse((n) => n.isMesh && ((n.castShadow = true), (n.receiveShadow = true)));
  c.grupo.add(g);
}

function colgar(g, objeto, x, y, z = 0) {
  objeto.position.set(x, y, z);
  g.add(objeto);
  return objeto;
}

/* ---------- Modelos GLB ---------- */

const gltf = new GLTFLoader().setMeshoptDecoder(MeshoptDecoder);

async function modelo(archivo, tam, { medida = 'alto', giro = 0 } = {}) {
  const g = await gltf.loadAsync(`/museo/modelos/${archivo}`);
  const m = g.scene;
  m.traverse((n) => {
    if (n.isMesh) {
      n.castShadow = n.receiveShadow = true;
      n.material.metalness = 0;
      if (n.material.map) n.material.map.anisotropy = 16;
    }
  });
  m.rotation.y = THREE.MathUtils.degToRad(giro);
  const env = new THREE.Group();
  env.add(m);
  const caja = new THREE.Box3().setFromObject(env);
  const s = caja.getSize(new THREE.Vector3());
  env.scale.setScalar(tam / (medida === 'ancho' ? Math.max(s.x, s.z) : s.y));
  caja.setFromObject(env);
  const c = caja.getCenter(new THREE.Vector3());
  const raiz = new THREE.Group();
  env.position.set(-c.x, -caja.min.y, -c.z);
  raiz.add(env);
  return raiz;
}

const imagen = (url) =>
  new Promise((ok, mal) => {
    const i = new Image();
    i.onload = () => ok(i);
    i.onerror = mal;
    i.src = url;
  });

/** Orienta un objeto (que mira a +z) hacia un punto del mundo */
function mirarA(o, destino) {
  o.updateWorldMatrix(true, false);
  const p = new THREE.Vector3().setFromMatrixPosition(o.matrixWorld);
  const padreGiro = new THREE.Quaternion();
  o.parent.getWorldQuaternion(padreGiro);
  const d = destino.clone().sub(p);
  const giroMundo = Math.atan2(d.x, d.z);
  const padreY = new THREE.Euler().setFromQuaternion(padreGiro, 'YXZ').y;
  o.rotation.y = giroMundo - padreY;
}

/* ================= CASONA ================= */

const CAM_CASONA = new THREE.Vector3(0, OJO, 0);
const puntosCasona = {};
const puntosMarinera = {};
const luces = { casona: [], marinera: [] };
const marcas = []; // objetos cuyo centro se exporta como punto tocable

const casona = cuarto(escena, 0, 0, 2 * R, 2 * R);
const matParedCasona = matYeso('#d39c52', 0.45, 11);
const texDamero = T.damero();
const matDamero = new THREE.MeshStandardMaterial({ map: conRepeticion(texDamero, 2 * R, 2 * R), roughness: 0.22 });
matDamero.map.rotation = Math.PI / 4;
matDamero.map.center.set(0.5, 0.5);
const matTechoCasona = P.matMadera('#3a1d0e', '#140702', 33, 0.75, 3);
pisoYTecho(casona, 2 * R, 2 * R, ALTO, matDamero, matTechoCasona);
artesonado(casona, 2 * R, 2 * R, ALTO, 1.5);

// Alfombra redonda bajo la cámara
const alfombra = new THREE.Mesh(new THREE.CircleGeometry(2.0, 96), new THREE.MeshStandardMaterial({ map: T.alfombraRedonda(), roughness: 0.96 }));
alfombra.rotation.x = -Math.PI / 2;
alfombra.position.y = 0.008;
alfombra.receiveShadow = true;
casona.grupo.add(alfombra);

const paredCasona = { frente: casona.atras, derecha: casona.der, fondo: casona.adelante, izquierda: casona.izq };
const huecosCasona = { frente: [], derecha: [], fondo: [], izquierda: [] };

for (const gen of generos) {
  const pared = gen.pared;
  const enPared = generos.filter((x) => x.pared === pared).length;
  const forma = gen.completa ? ARCO_GRANDE : ARCO;
  const x = enPared === 1 ? 0 : gen.posicion === 0 ? -2.7 : 2.7;
  huecosCasona[pared].push({ id: gen.id, x, ...forma, gen });
}
const VENTANA_FONDO = { x: 0, y0: 0.9, w: 3.0, h: 3.3 };
huecosCasona.fondo.push(VENTANA_FONDO);

for (const [nombre, g] of Object.entries(paredCasona)) {
  const huecos = huecosCasona[nombre];
  muro(g, 2 * R, ALTO, huecos, matParedCasona);
  for (const h of huecos) derrame(g, h, matParedCasona);
  zocaloAzulejos(g, 2 * R, huecos, 0.36);
  cornisa(g, 2 * R, ALTO);
  contacto(g, 2 * R, ALTO);
  for (const a of huecos.filter((h) => h.hs !== undefined)) {
    marcoArco(g, a);
    // Cartela con el nombre del género
    const ancho = a.gen.completa ? 2.7 : 2.3;
    const cartel = new THREE.Mesh(
      new THREE.PlaneGeometry(ancho, ancho / 4),
      new THREE.MeshStandardMaterial({ map: T.cartela(a.gen.nombre, a.gen.color), roughness: 0.45, emissive: 0xffffff, emissiveIntensity: 0.12 }),
    );
    cartel.material.emissiveMap = cartel.material.map;
    cartel.position.set(a.x, a.hs + a.w / 2 + 0.42 + ancho / 8, 0.04);
    g.add(cartel);
    // Punto tocable: centro del vano, a la altura de la mirada
    marcas.push({ pano: 'casona', id: a.id, grupo: g, local: new THREE.Vector3(a.x, Math.min(2.1, a.hs * 0.72), 0), arco: a });
  }
}

// Pilastras
for (const x of [-5.55, -2.35, 2.35, 5.55]) pilastra(casona.atras, x, ALTO - 0.4);
for (const x of [-5.55, 5.55]) {
  pilastra(casona.der, x, ALTO - 0.4);
  pilastra(casona.izq, x, ALTO - 0.4);
}
for (const x of [-5.55, -2.25, 2.25, 5.55]) pilastra(casona.adelante, x, ALTO - 0.4);

// Apliques de vela
const apliques = [
  [casona.atras, -2.35],
  [casona.atras, 2.35],
  [casona.adelante, -2.25],
  [casona.adelante, 2.25],
  [casona.der, -0.85],
  [casona.der, 0.85],
  [casona.izq, -0.85],
  [casona.izq, 0.85],
];
for (const [g, x] of apliques) {
  colgar(g, P.aplique(), x, 2.55, 0.1);
  const luz = new THREE.PointLight(0xffa64d, 2.2, 5.5, 2);
  luz.position.set(x, 2.7, 0.45);
  g.add(luz);
  luces.casona.push(luz);
}

// Cuadros y muebles de la casona
const [imgPinglo, imgTondero, imgPareja, imgPlaza] = await Promise.all([
  imagen('./recursos/pinglo.webp'),
  imagen('./recursos/tondero.webp'),
  imagen('./recursos/pareja.webp'),
  imagen('/museo/texturas/cuadro-plaza.webp'),
]);
const texPlaza = new THREE.Texture(imgPlaza);
texPlaza.colorSpace = THREE.SRGBColorSpace;
texPlaza.needsUpdate = true;

colgar(casona.atras, P.cuadro(T.paisajeCosta(), 1.5, 1.12), -3.95, 2.5, 0.02);
colgar(casona.atras, P.cuadro(T.lienzoCuadro(imgTondero, { fondo: ['#d8c497', '#6b5a3a'], ancho: 768, alto: 1024 }), 1.05, 1.4), 3.95, 2.55, 0.02);
colgar(casona.atras, P.mesaConsola(1.25, 0.42), -3.95, 0, 0.26);
colgar(casona.atras, P.mesaConsola(1.25, 0.42), 3.95, 0, 0.26);
for (const x of [-4.35, 3.55]) {
  const v = P.vela(0.22, 0.02);
  colgar(casona.atras, v, x, 0.86, 0.3);
}
colgar(casona.der, P.cuadro(T.lienzoCuadro(imgPinglo, { fondo: ['#6f6a7a', '#1f2033'], ancho: 768, alto: 1024 }), 0.84, 1.12), 0, 3.3, 0.02);
colgar(casona.izq, P.cuadro(texPlaza, 1.2, 0.8), 0, 3.3, 0.02);
for (const g of [casona.der, casona.izq]) {
  colgar(g, P.silla(0x7a1a20), -0.55, 0, 0.45).rotation.y = 0.15;
  colgar(g, P.silla(0x7a1a20), 0.55, 0, 0.45).rotation.y = -0.15;
}
// Macetas en las esquinas
for (const [g, x] of [
  [casona.atras, -5.15],
  [casona.atras, 5.15],
  [casona.adelante, -5.15],
  [casona.adelante, 5.15],
])
  colgar(g, P.maceta(1.05, Math.abs(x) + (g === casona.atras ? 1 : 2)), x, 0, 0.75);

// Fondo: balcón limeño, gramófono y espejo
balcon(casona.adelante, VENTANA_FONDO, CAM_CASONA, luces.casona);
const gramo = colgar(casona.adelante, P.gramofono(), -3.85, 0, 0.75);
gramo.rotation.y = 0.5;
marcas.push({ pano: 'casona', id: 'gramofono', objeto: gramo });
colgar(casona.adelante, P.mesaConsola(1.2, 0.42), 3.85, 0, 0.26);
const espejoCasona = P.espejo(1.0, 1.5, null);
colgar(casona.adelante, espejoCasona.grupo, 3.85, 2.2, 0.03);
marcas.push({ pano: 'casona', id: 'espejo', objeto: espejoCasona.luna });
for (const x of [3.45, 4.25]) colgar(casona.adelante, P.vela(0.22, 0.02), x, 0.86, 0.3);

// Araña central
const aranaCasona = P.arana(10, 0.72, 0.9);
aranaCasona.position.set(0, ALTO - 0.9, 0);
casona.grupo.add(aranaCasona);
{
  const luz = new THREE.PointLight(0xffc27a, 60, 0, 2);
  luz.position.set(0, ALTO - 1.45, 0);
  luz.castShadow = true;
  luz.shadow.mapSize.set(2048, 2048);
  luz.shadow.bias = -0.0004;
  luz.shadow.normalBias = 0.03;
  luz.shadow.camera.near = 0.2;
  luz.shadow.camera.far = 30;
  casona.grupo.add(luz);
  luces.casona.push(luz);
  const relleno = new THREE.HemisphereLight(0xfff0dc, 0x5a3420, 0.35);
  escena.add(relleno);
}

/** Balcón limeño cerrado con celosías, visto desde dentro; la luz del día entra por él */
function balcon(g, v, camara, lista, { cieloDist = 5, cieloAncho = 30, cieloAlto = 18 } = {}) {
  const fondoB = 1.0;
  const ancho = v.w + 0.4;
  const z0 = -G;
  const caja = new THREE.Group();
  g.add(caja);
  const madera = P.matMadera('#4a230e', '#170802', 17, 0.55);
  const tex = T.celosia();
  const matCelosia = (w, h) =>
    new THREE.MeshStandardMaterial({ map: conRepeticion(tex, w / 0.5, h / 0.5), alphaTest: 0.5, side: THREE.DoubleSide, roughness: 0.6 });
  const yTab = v.y0 + 0.75;
  const yTop = v.y0 + v.h + 0.15;
  // Piso y techo del balcón
  for (const [y, h] of [
    [v.y0 - 0.06, 0.12],
    [yTop + 0.08, 0.16],
  ]) {
    const m = new THREE.Mesh(new THREE.BoxGeometry(ancho + 0.2, h, fondoB + 0.2), madera);
    m.position.set(v.x, y, z0 - fondoB / 2);
    caja.add(m);
  }
  // Tres paños: frente e izquierda/derecha
  const panos = [
    { w: ancho, x: v.x, z: z0 - fondoB, giro: 0 },
    { w: fondoB, x: v.x - ancho / 2, z: z0 - fondoB / 2, giro: Math.PI / 2 },
    { w: fondoB, x: v.x + ancho / 2, z: z0 - fondoB / 2, giro: -Math.PI / 2 },
  ];
  for (const p of panos) {
    const pano = new THREE.Group();
    pano.position.set(p.x, 0, p.z);
    pano.rotation.y = p.giro;
    caja.add(pano);
    const tablero = new THREE.Mesh(new THREE.BoxGeometry(p.w, yTab - v.y0, 0.06), madera);
    tablero.position.set(0, (v.y0 + yTab) / 2, 0);
    pano.add(tablero);
    const n = Math.max(1, Math.round(p.w / 0.7));
    for (let k = 0; k < n; k++) {
      const caseton = new THREE.Mesh(new THREE.BoxGeometry(p.w / n - 0.12, yTab - v.y0 - 0.22, 0.03), madera);
      caseton.position.set(-p.w / 2 + (p.w / n) * (k + 0.5), (v.y0 + yTab) / 2, 0.04);
      pano.add(caseton);
    }
    const hCel = yTop - yTab - 0.1;
    const cel = new THREE.Mesh(new THREE.PlaneGeometry(p.w, hCel), matCelosia(p.w, hCel));
    cel.position.set(0, yTab + 0.05 + hCel / 2, 0);
    pano.add(cel);
    // Parteluces
    for (let k = 0; k <= n; k++) {
      const poste = new THREE.Mesh(new THREE.BoxGeometry(0.08, yTop - yTab, 0.08), madera);
      poste.position.set(-p.w / 2 + (p.w / n) * k, (yTab + yTop) / 2, 0);
      pano.add(poste);
    }
    const travesano = new THREE.Mesh(new THREE.BoxGeometry(p.w, 0.08, 0.1), madera);
    travesano.position.set(0, yTab, 0);
    pano.add(travesano);
  }
  caja.traverse((n) => n.isMesh && ((n.castShadow = true), (n.receiveShadow = true)));
  // Cielo detrás de la celosía
  const cielo = new THREE.Mesh(new THREE.PlaneGeometry(cieloAncho, cieloAlto), new THREE.MeshBasicMaterial({ map: T.cielo(), color: new THREE.Color(2.4, 2.4, 2.4) }));
  cielo.position.set(v.x, v.y0 + 2, z0 - fondoB - cieloDist);
  g.add(cielo);
  // Marco interior de la ventana
  for (const [w, h, x, y] of [
    [0.16, v.h + 0.16, v.x - v.w / 2 - 0.08, v.y0 + v.h / 2],
    [0.16, v.h + 0.16, v.x + v.w / 2 + 0.08, v.y0 + v.h / 2],
    [v.w + 0.32, 0.16, v.x, v.y0 + v.h + 0.08],
    [v.w + 0.4, 0.08, v.x, v.y0 - 0.04],
  ]) {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, 0.1), madera);
    m.position.set(x, y, 0.04);
    m.castShadow = m.receiveShadow = true;
    g.add(m);
  }
  // Sol de la mañana entrando por la celosía
  const sol = new THREE.SpotLight(0xfff0d8, 900, 0, 0.42, 0.35, 2);
  g.add(sol, sol.target);
  sol.position.set(v.x + 1.5, v.y0 + v.h + 4.5, z0 - fondoB - 5.5);
  sol.target.position.set(v.x - 0.6, 0, 3.6);
  sol.castShadow = true;
  sol.shadow.mapSize.set(2048, 2048);
  sol.shadow.bias = -0.0003;
  sol.shadow.normalBias = 0.02;
  lista.push(sol);
  // Luz difusa del cielo
  const relleno = new THREE.PointLight(0xdfe8f0, 6, 7, 2);
  relleno.position.set(v.x, v.y0 + v.h / 2, -0.8 - G);
  g.add(relleno);
  lista.push(relleno);
  void camara;
  return caja;
}

/* ---------- Salas que se asoman tras los arcos ---------- */

const SALA_P = 4.6; // fondo de las salas pequeñas
const SALA_A = 4.4;

async function salaPequena(gen, h, pared) {
  const c = cuarto(pared, h.x, -G - SALA_P / 2, 4.8, SALA_P);
  const tinte = new THREE.Color(gen.color);
  let matPared;
  let matPiso;
  if (gen.id === 'tondero') {
    matPared = matYeso('#ece0c2', 0.5, 7);
    matPiso = new THREE.MeshStandardMaterial({ map: conRepeticion(T.entablado(['#b3814e', '#a87645', '#bd8c58'], 5), 4, 4), roughness: 0.6 });
  } else if (gen.id === 'vals') {
    matPared = new THREE.MeshStandardMaterial({ map: conRepeticion(T.damasco('#1c2a4f', 'rgba(80,110,180,0.35)', 'rgba(220,190,120,0.25)'), 1.4), roughness: 0.85 });
    matPiso = new THREE.MeshStandardMaterial({ map: conRepeticion(T.entablado(['#4a2a16', '#3e2212', '#55301a'], 9), 4, 4), roughness: 0.35 });
  } else if (gen.id === 'polka') {
    matPared = new THREE.MeshStandardMaterial({ map: conRepeticion(T.rayas(), 2.5), roughness: 0.8 });
    matPiso = new THREE.MeshStandardMaterial({ map: conRepeticion(T.entablado(['#a0623a', '#8e5532', '#b07043'], 13), 4, 4), roughness: 0.3 });
  } else {
    matPared = new THREE.MeshStandardMaterial({ map: conRepeticion(T.adobe(), 1.2), roughness: 0.95 });
    matPiso = new THREE.MeshStandardMaterial({ color: 0x9a4d2a, roughness: 0.85 });
  }
  pisoYTecho(c, 4.8, SALA_P, SALA_A, matPiso, P.matMadera('#3b1d0d', '#120602', 21, 0.7, 2));
  artesonado(c, 4.8, SALA_P, SALA_A, 1.2);
  const vano = { x: 0, ...ARCO };
  for (const [nombre, p] of Object.entries({ atras: c.atras, adelante: c.adelante, izq: c.izq, der: c.der })) {
    muro(p, p.userData.L, SALA_A, nombre === 'adelante' ? [vano] : [], matPared);
    contacto(p, p.userData.L, SALA_A);
  }
  // Luz de la sala: color del género mezclado con luz cálida
  const color = tinte.clone().lerp(new THREE.Color(0xffd9a8), 0.45);
  const luz = new THREE.PointLight(color, 30, 0, 2);
  luz.position.set(0, SALA_A - 0.8, -0.3);
  luz.castShadow = true;
  luz.shadow.mapSize.set(1024, 1024);
  luz.shadow.bias = -0.0005;
  luz.shadow.normalBias = 0.03;
  c.grupo.add(luz);
  luces.casona.push(luz);
  const lamp = P.arana(5, 0.38, 0.5);
  lamp.position.set(0, SALA_A - 0.5, -0.3);
  c.grupo.add(lamp);

  const ventana = (textura, w, hgt, y) => {
    const v = new THREE.Mesh(new THREE.PlaneGeometry(w, hgt), new THREE.MeshBasicMaterial({ map: textura, color: new THREE.Color(1.6, 1.6, 1.6) }));
    v.position.set(0, y, 0.02);
    c.atras.add(v);
    const marcoV = P.marco(w, hgt, 0.12, 0.08, P.MADERA);
    marcoV.position.set(0, y, 0.01);
    c.atras.add(marcoV);
    for (const k of [-1, 1]) {
      const m = new THREE.Mesh(new THREE.BoxGeometry(0.06, hgt, 0.06), P.MADERA);
      m.position.set((k * w) / 6, y, 0.05);
      c.atras.add(m);
    }
    const t = new THREE.Mesh(new THREE.BoxGeometry(w, 0.06, 0.06), P.MADERA);
    t.position.set(0, y + hgt / 6, 0.05);
    c.atras.add(t);
  };

  if (gen.id === 'tondero') {
    ventana(T.paisajePiura(), 3.0, 1.9, 2.25);
    const fig = await modelo('03-tondero-varon.glb', 1.72);
    colgar(c.grupo, fig, 0.9, 0, -0.9);
    mirarA(fig, CAM_CASONA);
    colgar(c.grupo, P.maceta(0.9, 21), -1.7, 0, -1.6);
    colgar(c.grupo, P.silla(0x6b7d3a), -1.1, 0, -1.8).rotation.y = 0.4;
  } else if (gen.id === 'vals') {
    ventana(T.nocheLima(), 3.0, 1.9, 2.25);
    const fig = await modelo('02-vals-pareja.glb', 1.72);
    colgar(c.grupo, fig, -0.8, 0, -1.0);
    mirarA(fig, CAM_CASONA);
    for (const x of [-2.0, 2.0]) {
      const f = P.farol();
      colgar(c.atras, f, x, 2.4, 0);
      const l = new THREE.PointLight(0xffb45a, 4, 4, 2);
      l.position.set(x, 2.5, 0.35);
      c.atras.add(l);
      luces.casona.push(l);
    }
    colgar(c.grupo, P.silla(0x2b3f6b), 1.4, 0, -1.6).rotation.y = -0.5;
  } else if (gen.id === 'polka') {
    ventana(T.cielo(), 2.4, 2.4, 2.2);
    const colores = ['#a24b78', '#fead15', '#f0e7d8', '#2b3f6b', '#93171e'];
    for (const [a, b] of [
      [new THREE.Vector3(-2.3, 3.9, -2.2), new THREE.Vector3(2.3, 3.9, 2.0)],
      [new THREE.Vector3(2.3, 3.9, -2.2), new THREE.Vector3(-2.3, 3.9, 2.0)],
      [new THREE.Vector3(-2.3, 3.6, -1.0), new THREE.Vector3(2.3, 3.6, -1.0)],
    ])
      c.grupo.add(P.guirnalda(a, b, 0.35, colores));
    colgar(c.grupo, P.silla(0xa24b78), -1.6, 0, -1.7).rotation.y = 0.5;
    colgar(c.grupo, P.silla(0xa24b78), 1.6, 0, -1.7).rotation.y = -0.5;
    colgar(c.grupo, P.mesaRedonda(0.3, 0.72), 0, 0, -1.9);
  } else {
    const quijada = await modelo('06-quijada-burro.glb', 0.7, { medida: 'ancho', giro: -90 });
    const pedestal = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.95, 0.5), P.MADERA);
    pedestal.position.set(0.7, 0.475, -1.2);
    pedestal.castShadow = pedestal.receiveShadow = true;
    c.grupo.add(pedestal);
    colgar(c.grupo, quijada, 0.7, 0.95, -1.2);
    mirarA(quijada, CAM_CASONA);
    colgar(c.grupo, P.cajon(), -0.9, 0, -1.4).rotation.y = 0.5;
    colgar(c.grupo, P.cajon(), -1.4, 0, -0.8).rotation.y = -0.3;
    for (const [a, b] of [
      [new THREE.Vector3(-2.3, 3.6, -2.2), new THREE.Vector3(2.3, 3.6, -2.2)],
      [new THREE.Vector3(-2.3, 3.4, -1.0), new THREE.Vector3(2.3, 3.4, 0.4)],
    ])
      c.grupo.add(P.focos(a, b, 0.3));
  }
}

for (const [nombre, pared] of Object.entries(paredCasona))
  for (const h of huecosCasona[nombre]) if (h.gen && !h.gen.completa) await salaPequena(h.gen, h, pared);

/* ================= SALA DE LA MARINERA ================= */

const M_ANCHO = 9;
const M_FONDO = 9;
const M_ALTO = 5;
const marinera = cuarto(casona.atras, 0, -G - M_FONDO / 2, M_ANCHO, M_FONDO);
const genMarinera = generos.find((g) => g.id === 'marinera');
const CAM_MARINERA = new THREE.Vector3(0, OJO, -R - G - M_FONDO / 2);
{
  const matDamasco = new THREE.MeshStandardMaterial({ map: conRepeticion(T.damasco(), 1.5), roughness: 0.82 });
  const matPiso = new THREE.MeshStandardMaterial({ map: conRepeticion(T.entablado(), 9 / 1.1, 9 / 1.1), roughness: 0.32 });
  matPiso.map.rotation = Math.PI / 2;
  pisoYTecho(marinera, M_ANCHO, M_FONDO, M_ALTO, matPiso, P.matMadera('#4a2412', '#1a0904', 27, 0.7, 3));
  artesonado(marinera, M_ANCHO, M_FONDO, M_ALTO, 1.5);
  const vanoCasona = { x: 0, ...ARCO_GRANDE };
  const VENTANA_M = { x: 0, y0: 0.9, w: 2.6, h: 2.9 };
  const huecos = { atras: [], adelante: [vanoCasona], izq: [VENTANA_M], der: [] };
  for (const nombre of ['atras', 'adelante', 'izq', 'der']) {
    const p = marinera[nombre];
    muro(p, p.userData.L, M_ALTO, huecos[nombre], matDamasco);
    zocaloMadera(p, p.userData.L, huecos[nombre], 0.12);
    cornisa(p, p.userData.L, M_ALTO, new THREE.MeshStandardMaterial({ color: 0xf1e6cf, roughness: 0.6 }));
    contacto(p, p.userData.L, M_ALTO);
    // Filete dorado bajo la cornisa
    const filete = new THREE.Mesh(new THREE.BoxGeometry(p.userData.L, 0.04, 0.03), P.ORO);
    filete.position.set(0, M_ALTO - 0.62, 0.015);
    p.add(filete);
  }
  derrame(marinera.izq, VENTANA_M, matDamasco);
  marcoArco(marinera.adelante, vanoCasona, 0.22, 0.08, P.MADERA);
  balcon(marinera.izq, VENTANA_M, CAM_MARINERA, luces.marinera, { cieloDist: 3, cieloAncho: 10, cieloAlto: 10 });
  for (const x of [-3.2, 3.2]) pilastra(marinera.adelante, x, M_ALTO - 0.4, new THREE.MeshStandardMaterial({ color: 0xf1e6cf, roughness: 0.6 }));

  const alfombraM = new THREE.Mesh(
    new THREE.CircleGeometry(2.0, 96),
    new THREE.MeshStandardMaterial({ map: T.alfombraRedonda(['#93171e', '#3a160c', '#fead15', '#f0e7d8']), roughness: 0.96 }),
  );
  alfombraM.rotation.x = -Math.PI / 2;
  alfombraM.position.y = 0.008;
  alfombraM.receiveShadow = true;
  marinera.grupo.add(alfombraM);

  // Araña
  const ar = P.arana(8, 0.6, 0.75);
  ar.position.set(0, M_ALTO - 0.75, 0);
  marinera.grupo.add(ar);
  const luz = new THREE.PointLight(0xffc27a, 34, 0, 2);
  luz.position.set(0, M_ALTO - 1.25, 0);
  luz.castShadow = true;
  luz.shadow.mapSize.set(2048, 2048);
  luz.shadow.bias = -0.0004;
  luz.shadow.normalBias = 0.03;
  marinera.grupo.add(luz);
  luces.marinera.push(luz);

  // Muebles
  colgar(marinera.atras, P.sofa(0x8a1c22), 0, 0, 0.45);
  for (const x of [-1.55, 1.55]) {
    colgar(marinera.atras, P.aplique(), x, 2.5, 0.1);
    const l = new THREE.PointLight(0xffa64d, 2, 4.5, 2);
    l.position.set(x, 2.65, 0.45);
    marinera.atras.add(l);
    luces.marinera.push(l);
  }
  colgar(marinera.der, P.cuadro(T.paisajeCosta(), 1.6, 1.2), 0, 2.45, 0.02);
  colgar(marinera.der, P.mesaConsola(1.4, 0.44), 0, 0, 0.26);
  for (const x of [-0.45, 0.45]) colgar(marinera.der, P.vela(0.24, 0.02), x, 0.86, 0.3);
  colgar(marinera.der, P.silla(0x8a1c22), -1.6, 0, 0.5).rotation.y = 0.3;
  colgar(marinera.der, P.silla(0x8a1c22), 1.6, 0, 0.5).rotation.y = -0.3;
  colgar(marinera.izq, P.silla(0x8a1c22), -2.3, 0, 0.6).rotation.y = 0.5;
  colgar(marinera.izq, P.silla(0x8a1c22), 2.3, 0, 0.6).rotation.y = -0.5;
  for (const [x, z] of [
    [-4.0, -4.0],
    [4.0, -4.0],
  ])
    colgar(marinera.grupo, P.maceta(0.9, x + z + 40), x, 0, z);
}

async function montarMarinera() {
  const g = marinera.grupo;
  const destino = CAM_MARINERA;
  const foco = (objeto, intensidad = 60, angulo = 0.38) => {
    objeto.updateWorldMatrix(true, true);
    const caja = new THREE.Box3().setFromObject(objeto);
    const centro = caja.getCenter(new THREE.Vector3());
    const local = g.worldToLocal(centro.clone());
    const s = new THREE.SpotLight(0xffe2b8, intensidad, 0, angulo, 0.75, 2);
    s.position.set(local.x * 0.75, M_ALTO - 0.05, local.z * 0.75);
    s.target.position.copy(local);
    s.castShadow = true;
    s.shadow.mapSize.set(1024, 1024);
    s.shadow.bias = -0.0004;
    s.shadow.normalBias = 0.02;
    g.add(s, s.target);
    luces.marinera.push(s);
  };

  // Vestimenta: traje sobre tarima
  const tarima = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.54, 0.14, 48), P.MADERA);
  tarima.position.set(-2.55, 0.07, -2.75);
  tarima.castShadow = tarima.receiveShadow = true;
  g.add(tarima);
  const vestido = await modelo('01-marinera-vestido.glb', 1.62);
  colgar(g, vestido, -2.55, 0.14, -2.75);
  mirarA(vestido, destino);
  marcas.push({ pano: 'marinera', id: 'manto', objeto: vestido });
  foco(vestido, 70);

  // Instrumento: arpa
  const ar = P.arpa();
  colgar(g, ar, 2.5, 0, -2.75);
  mirarA(ar, destino);
  ar.rotation.y += 0.55;
  marcas.push({ pano: 'marinera', id: 'arpa', objeto: ar });
  foco(ar, 60);

  // Símbolo visual: cuadro de una pareja bailando
  const c = P.cuadro(T.lienzoCuadro(imgPareja, { fondo: ['#c79a5c', '#4a2410'] }), 1.25, 1.25, 0.13);
  colgar(marinera.atras, c, 0, 2.35, 0.02);
  marcas.push({ pano: 'marinera', id: 'cuadro', objeto: c });
  foco(c, 45, 0.45);

  // Vida cotidiana: abanico en vitrina
  const vit = P.vitrina();
  colgar(g, vit, -3.0, 0, 2.55);
  mirarA(vit, destino);
  const abanico = await modelo('05-abanico.glb', 0.52, { medida: 'ancho' });
  colgar(vit, abanico, 0, 0.93, 0);
  marcas.push({ pano: 'marinera', id: 'abanico', objeto: vit, foco: abanico });
  foco(vit, 55);

  // Accesorio de baile: pañuelo blanco
  const mesa = P.mesaPanuelo();
  colgar(g, mesa, 3.0, 0, 2.55);
  marcas.push({ pano: 'marinera', id: 'panuelo', objeto: mesa });
  foco(mesa, 50);

  // Salida hacia la casona
  marcas.push({ pano: 'marinera', id: 'salida', grupo: marinera.adelante, local: new THREE.Vector3(0, 2.0, 0) });
}

/* ================= RENDER ================= */

function direccion(desde, hacia) {
  const d = hacia.clone().sub(desde);
  return {
    yaw: +THREE.MathUtils.radToDeg(Math.atan2(d.x, -d.z)).toFixed(2),
    pitch: +THREE.MathUtils.radToDeg(Math.atan2(d.y, Math.hypot(d.x, d.z))).toFixed(2),
  };
}

function calcularPuntos() {
  escena.updateMatrixWorld(true);
  for (const m of marcas) {
    const cam = m.pano === 'casona' ? CAM_CASONA : CAM_MARINERA;
    const destino = m.pano === 'casona' ? puntosCasona : puntosMarinera;
    if (m.local) {
      const p = m.grupo.localToWorld(m.local.clone());
      const punto = direccion(cam, p);
      if (m.arco) {
        // Encuadre del asomo: del piso hasta la cartela
        const base = m.grupo.localToWorld(new THREE.Vector3(m.arco.x, 0, 0));
        const tope = m.grupo.localToWorld(new THREE.Vector3(m.arco.x, m.arco.hs + m.arco.w / 2 + 1.0, 0));
        const a = direccion(cam, base).pitch;
        const b = direccion(cam, tope).pitch;
        const izq = m.grupo.localToWorld(new THREE.Vector3(m.arco.x - m.arco.w / 2 - 0.3, 1.5, 0));
        const der = m.grupo.localToWorld(new THREE.Vector3(m.arco.x + m.arco.w / 2 + 0.3, 1.5, 0));
        const ancho = Math.abs(((direccion(cam, der).yaw - direccion(cam, izq).yaw + 540) % 360) - 180);
        punto.asomo = { pitch: +((a + b) / 2).toFixed(2), fov: +((b - a) * 1.08).toFixed(2), ancho: +ancho.toFixed(2) };
      }
      destino[m.id] = punto;
    } else {
      const caja = new THREE.Box3().setFromObject(m.foco ?? m.objeto);
      const centro = caja.getCenter(new THREE.Vector3());
      const radio = caja.getSize(new THREE.Vector3()).length() / 2;
      const punto = direccion(cam, centro);
      const dist = centro.distanceTo(cam);
      const angular = THREE.MathUtils.radToDeg(2 * Math.atan(radio / dist));
      punto.fov = +THREE.MathUtils.clamp(angular * 1.6, 24, 58).toFixed(2);
      destino[m.id] = punto;
    }
  }
}

const quad = new THREE.Mesh(
  new THREE.PlaneGeometry(2, 2),
  new THREE.ShaderMaterial({
    uniforms: { cubo: { value: null } },
    vertexShader: /* glsl */ `
      varying vec2 vUv;
      void main() { vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }`,
    fragmentShader: /* glsl */ `
      uniform samplerCube cubo;
      varying vec2 vUv;
      void main() {
        float lon = (vUv.x - 0.5) * 6.28318530718;
        float lat = (vUv.y - 0.5) * 3.14159265359;
        vec3 d = vec3(sin(lon) * cos(lat), sin(lat), -cos(lon) * cos(lat));
        gl_FragColor = vec4(textureCube(cubo, d).rgb, 1.0);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }`,
    depthTest: false,
    depthWrite: false,
  }),
);
const escenaQuad = new THREE.Scene();
escenaQuad.add(quad);
const camQuad = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

function capturar(pos, cara) {
  for (const h of P.halos) h.lookAt(pos);
  const rt = new THREE.WebGLCubeRenderTarget(cara, { type: THREE.HalfFloatType, generateMipmaps: true, minFilter: THREE.LinearMipmapLinearFilter });
  const cam = new THREE.CubeCamera(0.03, 200, rt);
  cam.position.copy(pos);
  escena.add(cam);
  cam.update(renderer, escena);
  escena.remove(cam);
  return rt;
}

const pmrem = new THREE.PMREMGenerator(renderer);
const envEstudio = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;


async function panorama(nombre, pos) {
  estado(`Renderizando ${nombre}…`);
  // 1) Luz ambiente de la propia sala: captura chica que sirve de reflejo y rebote de luz
  escena.environment = envEstudio;
  escena.environmentIntensity = 0.12;
  const previo = capturar(pos, 256);
  const env = pmrem.fromCubemap(previo.texture).texture;
  escena.environment = env;
  escena.environmentIntensity = 0.85;
  espejoCasona.luna.material.envMap = env;
  // 2) Captura final y paso a equirectangular
  const rt = capturar(pos, CARA);
  quad.material.uniforms.cubo.value = rt.texture;
  renderer.setRenderTarget(null);
  renderer.render(escenaQuad, camQuad);
  const grande = lienzo.toDataURL('image/webp', CALIDAD);
  const [c2, g2] = T.lienzo(ANCHO / 2, ANCHO / 4);
  g2.imageSmoothingQuality = 'high';
  g2.drawImage(lienzo, 0, 0, ANCHO / 2, ANCHO / 4);
  const chica = c2.toDataURL('image/webp', CALIDAD);
  previo.dispose();
  rt.dispose();
  return { grande, chica };
}

try {
  await document.fonts.load(`700 80px "Libre Baskerville"`);
  await montarMarinera();
  calcularPuntos();
  const resultado = { ancho: ANCHO };
  if (!SOLO || SOLO === 'casona') resultado.casona = { ...(await panorama('casona', CAM_CASONA)), puntos: { camara: CAM_CASONA.toArray(), ...puntosCasona } };
  if (!SOLO || SOLO === 'marinera')
    resultado.marinera = { ...(await panorama('marinera', CAM_MARINERA)), puntos: { camara: CAM_MARINERA.toArray(), ...puntosMarinera } };
  void genMarinera;
  void datosCasona;
  estado('Listo');
  Object.assign(window, { resultado });
} catch (e) {
  console.error(e);
  Object.assign(window, { error: String(e?.stack ?? e) });
}
