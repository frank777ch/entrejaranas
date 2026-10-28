// Escena 3D de la casona y de las cinco salas de los géneros, renderizada una sola vez
// como panoramas 360° (cubemaps de seis caras) para el prototipo B, o con ?fija como
// tomas planas de cámara fija para el prototipo C (las piezas se agrupan frente a la cámara).
// Ejes: -z = frente, +x = derecha, +z = fondo, -x = izquierda. 1 unidad = 1 metro.
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/examples/jsm/libs/meshopt_decoder.module.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { generos } from '../../src/data/museo-prototipo.ts';
import * as T from './texturas.js';
import * as P from './piezas.js';

const params = new URLSearchParams(location.search);
const RAPIDO = params.has('rapido');
// Lado de cada cara del cubo; se renderiza SS veces más grande y se reduce (supermuestreo)
const CARA = Number(params.get('cara') ?? (RAPIDO ? 512 : 2048));
const SS = Number(params.get('ss') ?? 2);
const MSAA = Number(params.get('msaa') ?? 0);
const CALIDAD = Number(params.get('calidad') ?? 0.84);
const CALIDAD_MEDIA = Number(params.get('media') ?? 0.76);
const SOLO = params.get('solo');
const EXPO_BASE = Number(params.get('expo') ?? 1);
const FIJA = params.has('fija');

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
renderer.setSize(CARA, CARA, false);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = EXPO_BASE;
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
const luces = { casona: [] };
const marcas = []; // objetos cuyo centro se exporta como punto tocable

const casona = cuarto(escena, 0, 0, 2 * R, 2 * R);
const matParedCasona = matYeso('#d39c52', 0.45, 11);
const texDamero = T.damero();
const matDamero = new THREE.MeshStandardMaterial({ map: conRepeticion(texDamero, 2 * R, 2 * R), roughness: 0.22 });
matDamero.map.rotation = Math.PI / 4;
matDamero.map.center.set(0.5, 0.5);
const matTechoCasona = P.matMadera('#3a1d0e', '#140702', 33, 0.75, 3);
const pisoCasona = pisoYTecho(casona, 2 * R, 2 * R, ALTO, matDamero, matTechoCasona);
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
  // El arco del frente es el principal; los de los costados van en pareja y son más angostos
  const forma = pared === 'frente' ? ARCO_GRANDE : ARCO;
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
    const ancho = nombre === 'frente' ? 2.7 : 2.3;
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

// En la vista fija el muro del fondo queda detrás de la cámara: el espejo y el gramófono pasan al frente
if (!FIJA) colgar(casona.atras, P.cuadro(T.paisajeCosta(), 1.5, 1.12), -3.95, 2.5, 0.02);
colgar(casona.atras, P.cuadro(T.lienzoCuadro(imgTondero, { fondo: ['#d8c497', '#6b5a3a'], ancho: 768, alto: 1024 }), 1.05, 1.4), 3.95, 2.55, 0.02);
if (!FIJA) colgar(casona.atras, P.mesaConsola(1.25, 0.42), -3.95, 0, 0.26);
colgar(casona.atras, P.mesaConsola(1.25, 0.42), 3.95, 0, 0.26);
for (const x of FIJA ? [3.55] : [-4.35, 3.55]) {
  const v = P.vela(0.22, 0.02);
  colgar(casona.atras, v, x, 0.86, 0.3);
}
const pinglo = colgar(casona.der, P.cuadro(T.lienzoCuadro(imgPinglo, { fondo: ['#6f6a7a', '#1f2033'], ancho: 768, alto: 1024 }), 0.84, 1.12), 0, 3.3, 0.02);
const plaza = colgar(casona.izq, P.cuadro(texPlaza, 1.2, 0.8), 0, 3.3, 0.02);
if (FIJA) {
  marcas.push({ pano: 'casona', id: 'pinglo', objeto: pinglo }, { pano: 'casona', id: 'plaza', objeto: plaza });
}
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
balcon(casona.adelante, VENTANA_FONDO, CAM_CASONA, luces.casona, { cieloAncho: 14, cieloAlto: 14 });
const gramo = FIJA ? colgar(casona.atras, P.gramofono(), -3.95, 0, 0.7) : colgar(casona.adelante, P.gramofono(), -3.85, 0, 0.75);
gramo.rotation.y = FIJA ? -0.35 : 0.5;
marcas.push({ pano: 'casona', id: 'gramofono', objeto: gramo });
colgar(casona.adelante, P.mesaConsola(1.2, 0.42), 3.85, 0, 0.26);
const espejoCasona = P.espejo(1.0, 1.5, null);
if (FIJA) colgar(casona.atras, espejoCasona.grupo, -3.95, 2.45, 0.03);
else colgar(casona.adelante, espejoCasona.grupo, 3.85, 2.2, 0.03);
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
if (FIJA) {
  marcas.push({ pano: 'casona', id: 'arana', objeto: aranaCasona });
  // La cámara mira desde más atrás del muro del fondo, que se oculta, para que los cinco
  // arcos entren en un solo cuadro; el piso se alarga hasta debajo de la cámara
  casona.adelante.visible = false;
  pisoCasona.piso.geometry = new THREE.PlaneGeometry(2 * R, 4 * R);
  pisoCasona.piso.position.z = R;
  matDamero.map.repeat.set(2 * R, 4 * R);
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


/* ================= SALAS DE LOS GÉNEROS ================= */
// Cada sala es un cuarto detrás de su arco. Las del frente es única y centrada; las de los
// costados van de a dos por pared, cada una a un lado del eje, para que no se crucen.

const S_ALTO = 5;
const salas = {};
const camaras = { casona: CAM_CASONA };
const puntos = { casona: puntosCasona };

function nuevaSala(gen, { W = 8, D = 8.6, A = S_ALTO } = {}) {
  const pared = paredCasona[gen.pared];
  const h = huecosCasona[gen.pared].find((x) => x.id === gen.id);
  const sola = generos.filter((x) => x.pared === gen.pared).length === 1;
  const xc = sola ? 0 : gen.posicion === 0 ? -W / 2 : W / 2;
  const c = cuarto(pared, xc, -G - D / 2, W, D);
  // En la pared "adelante" el eje x corre al revés que en la casona
  const vano = { x: xc - h.x, w: h.w, hs: h.hs };
  const exterior = sola ? null : gen.posicion === 0 ? 'izq' : 'der';
  escena.updateMatrixWorld(true);
  // Vista fija: la cámara se para en la entrada y mira al fondo
  const cam = c.grupo.localToWorld(new THREE.Vector3(0, OJO, FIJA ? D / 2 - 0.8 : 0));
  const s = { gen, c, W, D, A, vano, exterior, cam, luces: [], focos: [], principal: null };
  salas[gen.id] = s;
  camaras[gen.id] = cam;
  puntos[gen.id] = {};
  marcas.push({ pano: gen.id, id: 'salida', grupo: c.adelante, local: new THREE.Vector3(vano.x, 2.0, 0) });
  return s;
}

/** Muros, zócalo y cornisa de la sala; `huecos` agrega ventanas por pared */
function paredesSala(s, { mat, huecos = {}, zocalo = 'madera', matZocalo, cornisaMat = MOLDURA, filete = false, sinTecho = false }) {
  const todos = { atras: [], izq: [], der: [], ...huecos, adelante: [s.vano, ...(huecos.adelante ?? [])] };
  for (const nombre of ['atras', 'adelante', 'izq', 'der']) {
    const p = s.c[nombre];
    const L = p.userData.L;
    muro(p, L, s.A, todos[nombre], mat);
    for (const v of todos[nombre]) if (v !== s.vano) derrame(p, v, mat);
    if (zocalo === 'madera') zocaloMadera(p, L, todos[nombre], 0.12, 1.0, matZocalo);
    else if (zocalo === 'azulejo') zocaloAzulejos(p, L, todos[nombre], 0.2, 1.0);
    else if (zocalo === 'pintado') {
      for (const [x0, x1] of tramos(L, todos[nombre], 0.05)) {
        const m = new THREE.Mesh(new THREE.PlaneGeometry(x1 - x0, 0.7), matZocalo);
        m.position.set((x0 + x1) / 2, 0.35, 0.006);
        m.receiveShadow = true;
        p.add(m);
      }
    }
    if (!sinTecho) cornisa(p, L, s.A, cornisaMat);
    contacto(p, L, s.A);
    if (filete) {
      const f = new THREE.Mesh(new THREE.BoxGeometry(L, 0.04, 0.03), P.ORO);
      f.position.set(0, s.A - 0.62, 0.015);
      p.add(f);
    }
  }
  marcoArco(s.c.adelante, s.vano, 0.22, 0.08, P.MADERA);
  return todos;
}

function luzPrincipal(s, color, intensidad, y = s.A - 1.2) {
  const luz = new THREE.PointLight(color, intensidad, 0, 2);
  luz.position.set(0, y, 0);
  luz.castShadow = true;
  luz.shadow.mapSize.set(2048, 2048);
  luz.shadow.bias = -0.0004;
  luz.shadow.normalBias = 0.03;
  luz.shadow.camera.near = 0.2;
  s.c.grupo.add(luz);
  s.principal = luz;
  s.luces.push(luz);
  return luz;
}

function luz(s, padre, color, intensidad, x, y, z, alcance = 5) {
  const l = new THREE.PointLight(color, intensidad, alcance, 2);
  l.position.set(x, y, z);
  padre.add(l);
  s.luces.push(l);
  return l;
}

/** Foco cenital sobre un objeto (proyecta sombra solo al renderizar su propia sala) */
function foco(s, objeto, intensidad = 60, angulo = 0.38, color = 0xffe2b8) {
  const g = s.c.grupo;
  objeto.updateWorldMatrix(true, true);
  const caja = new THREE.Box3().setFromObject(objeto);
  const centro = caja.getCenter(new THREE.Vector3());
  const local = g.worldToLocal(centro.clone());
  const l = new THREE.SpotLight(color, intensidad, 0, angulo, 0.75, 2);
  l.position.set(local.x * 0.75, s.A - 0.05, local.z * 0.75);
  l.target.position.copy(local);
  l.castShadow = true;
  l.shadow.mapSize.set(1024, 1024);
  l.shadow.bias = -0.0004;
  l.shadow.normalBias = 0.02;
  g.add(l, l.target);
  s.focos.push(l);
  return l;
}

function marca(s, id, objeto, extra = {}) {
  marcas.push({ pano: s.gen.id, id, objeto, ...extra });
}

function apoyar(s, objeto, x, z, mirar = true) {
  colgar(s.c.grupo, objeto, x, 0, z);
  if (mirar) mirarA(objeto, s.cam);
  return objeto;
}

/* ----- Vista fija: las cinco piezas sobre una tarima redonda al centro, frente a la cámara ----- */

const ALTO_TARIMA = 0.2;

function tarima(s, radio = 1.75, z = -1.1) {
  const g = new THREE.Group();
  const base = new THREE.Mesh(new THREE.CylinderGeometry(radio, radio + 0.08, ALTO_TARIMA, 96), P.matMadera('#3a1a0a', '#120500', 71, 0.32));
  base.position.y = ALTO_TARIMA / 2;
  const canto = new THREE.Mesh(new THREE.TorusGeometry(radio + 0.02, 0.025, 8, 96), P.ORO);
  canto.rotation.x = Math.PI / 2;
  canto.position.y = ALTO_TARIMA;
  const pano = new THREE.Mesh(new THREE.CircleGeometry(radio * 0.82, 96), new THREE.MeshStandardMaterial({ map: T.alfombraRedonda([s.gen.color, '#2a120a', '#d4a24a', '#efe2c4']), roughness: 0.95 }));
  pano.rotation.x = -Math.PI / 2;
  pano.position.y = ALTO_TARIMA + 0.004;
  g.add(base, canto, pano);
  g.traverse((n) => n.isMesh && ((n.castShadow = n !== pano), (n.receiveShadow = true)));
  colgar(s.c.grupo, g, 0, 0, z);
  s.tarima = { z };
  return g;
}

/** Apoya una pieza sobre la tarima (x, z relativos a su centro) mirando a la cámara */
function sobreTarima(s, objeto, x, z, giro = 0) {
  colgar(s.c.grupo, objeto, x, ALTO_TARIMA, s.tarima.z + z);
  mirarA(objeto, s.cam);
  objeto.rotation.y += giro;
  return objeto;
}

/** "Sala N · Nombre" pintado en una pared, como en el boceto del equipo */
function letrero(s, pared, x, numero, y = 2.9) {
  const m = new THREE.Mesh(
    new THREE.PlaneGeometry(1.7, 1.7),
    new THREE.MeshStandardMaterial({ map: T.letreroSala(numero, s.gen.nombre), transparent: true, roughness: 0.5, metalness: 0.3, emissive: 0xffffff, emissiveIntensity: 0.08, depthWrite: false }),
  );
  m.material.emissiveMap = m.material.map;
  m.position.set(x, y, 0.02);
  s.c[pared].add(m);
  return m;
}

const matPiso = (tex, rep, rugosidad = 0.4, giro = 0) => {
  const m = new THREE.MeshStandardMaterial({ map: conRepeticion(tex, rep, rep), roughness: rugosidad });
  if (giro) m.map.rotation = giro;
  return m;
};

/* ----- Marinera limeña: salón de jarana con balcón ----- */
async function salaMarinera(gen) {
  const s = nuevaSala(gen, { W: 9, D: 9 });
  const { c } = s;
  const matDamasco = new THREE.MeshStandardMaterial({ map: conRepeticion(T.damasco(), 1.5), roughness: 0.82 });
  pisoYTecho(c, s.W, s.D, s.A, matPiso(T.entablado(), 9 / 1.1, 0.32, Math.PI / 2), P.matMadera('#4a2412', '#1a0904', 27, 0.7, 3));
  artesonado(c, s.W, s.D, s.A, 1.5);
  const VENTANA_M = { x: 0, y0: 0.9, w: 2.6, h: 2.9 };
  const crema = new THREE.MeshStandardMaterial({ color: 0xf1e6cf, roughness: 0.6 });
  // El balcón va en el muro exterior: el otro costado da a la sala vecina
  const exterior = s.exterior ?? 'izq';
  const interior = exterior === 'izq' ? 'der' : 'izq';
  paredesSala(s, { mat: matDamasco, huecos: { [exterior]: [VENTANA_M] }, cornisaMat: crema, filete: true });
  balcon(c[exterior], VENTANA_M, s.cam, s.luces, { cieloDist: 3, cieloAncho: 6, cieloAlto: 10 });
  for (const x of [-3.2, 3.2]) pilastra(c.adelante, x, s.A - 0.4, crema);
  const alfombraM = new THREE.Mesh(new THREE.CircleGeometry(2.0, 96), new THREE.MeshStandardMaterial({ map: T.alfombraRedonda(['#93171e', '#3a160c', '#fead15', '#f0e7d8']), roughness: 0.96 }));
  alfombraM.rotation.x = -Math.PI / 2;
  alfombraM.position.y = 0.008;
  alfombraM.receiveShadow = true;
  c.grupo.add(alfombraM);
  const ar = P.arana(8, 0.6, 0.75);
  ar.position.set(0, s.A - 0.75, 0);
  c.grupo.add(ar);
  luzPrincipal(s, 0xffc27a, 34, s.A - 1.25);
  colgar(c.atras, P.sofa(0x8a1c22), 0, 0, 0.45);
  for (const x of [-1.55, 1.55]) {
    colgar(c.atras, P.aplique(), x, 2.5, 0.1);
    luz(s, c.atras, 0xffa64d, 2, x, 2.65, 0.45, 4.5);
  }
  colgar(c[interior], P.cuadro(T.paisajeCosta(), 1.6, 1.2), 0, 2.45, 0.02);
  colgar(c[interior], P.mesaConsola(1.4, 0.44), 0, 0, 0.26);
  for (const x of [-0.45, 0.45]) colgar(c[interior], P.vela(0.24, 0.02), x, 0.86, 0.3);
  colgar(c[interior], P.silla(0x8a1c22), -1.6, 0, 0.5).rotation.y = 0.3;
  colgar(c[interior], P.silla(0x8a1c22), 1.6, 0, 0.5).rotation.y = -0.3;
  colgar(c[exterior], P.silla(0x8a1c22), -2.3, 0, 0.6).rotation.y = 0.5;
  colgar(c[exterior], P.silla(0x8a1c22), 2.3, 0, 0.6).rotation.y = -0.5;
  for (const [x, z] of [[-4.0, -4.0], [4.0, -4.0]]) colgar(c.grupo, P.maceta(0.9, x + z + 40), x, 0, z);

  const tarima = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.54, 0.14, 48), P.MADERA);
  tarima.position.set(-2.55, 0.07, -2.75);
  tarima.castShadow = tarima.receiveShadow = true;
  c.grupo.add(tarima);
  const vestido = await modelo('01-marinera-vestido.glb', 1.62);
  colgar(c.grupo, vestido, -2.55, 0.14, -2.75);
  mirarA(vestido, s.cam);
  marca(s, 'manto', vestido);
  foco(s, vestido, 70);
  const ar2 = apoyar(s, P.arpa(), 2.5, -2.75);
  ar2.rotation.y += 0.55;
  marca(s, 'arpa', ar2);
  foco(s, ar2, 60);
  const cu = P.cuadro(T.lienzoCuadro(imgPareja, { fondo: ['#c79a5c', '#4a2410'] }), 1.25, 1.25, 0.13);
  colgar(c.atras, cu, 0, 2.35, 0.02);
  marca(s, 'cuadro', cu);
  foco(s, cu, 45, 0.45);
  const vit = apoyar(s, P.vitrina(), -3.0, 2.55);
  const abanico = await modelo('05-abanico.glb', 0.52, { medida: 'ancho' });
  colgar(vit, abanico, 0, 0.93, 0);
  marca(s, 'abanico', vit, { foco: abanico });
  foco(s, vit, 55);
  const mesa = apoyar(s, P.mesaPanuelo(), 3.0, 2.55, false);
  marca(s, 'panuelo', mesa);
  foco(s, mesa, 50);
}

/* ----- Tondero: casa norteña luminosa, paisaje de Piura ----- */
async function salaTondero(gen) {
  const s = nuevaSala(gen);
  const { c } = s;
  const matCal = matYeso('#efe4cc', 0.5, 7);
  pisoYTecho(c, s.W, s.D, s.A, matPiso(T.ladrillo(), s.W / 1.2, 0.75), new THREE.MeshStandardMaterial({ map: conRepeticion(T.cana(), 3, 3), roughness: 0.9 }));
  // Vigas de algarrobo
  const viga = P.matMadera('#5a3a1e', '#24140a', 61, 0.8, 2);
  for (let x = -s.W / 2 + 1.2; x < s.W / 2; x += 1.6) {
    const v = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.12, s.D, 12), viga);
    v.rotation.x = Math.PI / 2;
    v.position.set(x, s.A - 0.12, 0);
    v.castShadow = v.receiveShadow = true;
    c.grupo.add(v);
  }
  const V1 = { x: 0, y0: 0.85, w: 2.6, h: 2.3 };
  const V2 = { x: -0.4, y0: 0.85, w: 2.4, h: 2.3 };
  const verde = new THREE.MeshStandardMaterial({ color: 0x5f7d2e, roughness: 0.7 });
  paredesSala(s, { mat: matCal, huecos: { atras: [V1], [s.exterior]: [V2] }, zocalo: 'pintado', matZocalo: verde, cornisaMat: new THREE.MeshStandardMaterial({ color: 0xe9dcc0, roughness: 0.8 }) });
  // Ventanas con postigos de madera abiertos y el paisaje afuera
  for (const [p, v, lejos] of [
    [c.atras, V1, 4.5],
    [c[s.exterior], V2, 4.0],
  ]) {
    const paisaje = new THREE.Mesh(new THREE.PlaneGeometry(13, 6.5), new THREE.MeshBasicMaterial({ map: T.paisajePiura(), color: new THREE.Color(1.5, 1.45, 1.35) }));
    paisaje.position.set(v.x, 2.2, -G - lejos);
    p.add(paisaje);
    const marcoV = P.marco(v.w, v.h, 0.12, 0.1, P.MADERA_CLARA);
    marcoV.position.set(v.x, v.y0 + v.h / 2, 0.01);
    p.add(marcoV);
    for (const sx of [-1, 1]) {
      const postigo = new THREE.Mesh(new THREE.BoxGeometry(v.w / 2, v.h, 0.04), verde);
      const bis = new THREE.Group();
      bis.position.set(v.x + (sx * v.w) / 2, v.y0 + v.h / 2, 0.06);
      bis.rotation.y = sx * 1.9;
      postigo.position.x = (sx * v.w) / 4;
      postigo.castShadow = postigo.receiveShadow = true;
      bis.add(postigo);
      p.add(bis);
    }
    // Sol de la tarde entrando
    const sol = new THREE.SpotLight(0xfff0d0, 700, 0, 0.5, 0.4, 2);
    sol.position.set(v.x + 1.2, v.y0 + v.h + 3.5, -G - 4.5);
    sol.target.position.set(v.x - 0.4, 0, 3.0);
    sol.castShadow = true;
    sol.shadow.mapSize.set(2048, 2048);
    sol.shadow.bias = -0.0003;
    p.add(sol, sol.target);
    s.focos.push(sol);
    luz(s, p, 0xfff2dc, 8, v.x, v.y0 + v.h / 2, 0.8, 7);
  }
  luzPrincipal(s, 0xfff0d8, 22, s.A - 0.6);
  // Decoración: varón bailando, hamaca, cántaros, banca y sombreros colgados
  const fig = await modelo('03-tondero-varon.glb', 1.72);
  apoyar(s, fig, -2.6 * (s.exterior === 'izq' ? 1 : -1), -2.9);
  foco(s, fig, 40, 0.4);
  const lado = s.exterior === 'izq' ? -1 : 1;
  // Hamaca entre dos horcones de algarrobo, junto a la pared lateral
  for (const z of [-0.2, 3.2]) {
    const horcon = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.11, 2.4, 10), viga);
    horcon.position.set(-lado * 3.55, 1.2, z);
    horcon.castShadow = horcon.receiveShadow = true;
    c.grupo.add(horcon);
  }
  c.grupo.add(P.hamaca(new THREE.Vector3(-lado * 3.4, 1.75, -0.2), new THREE.Vector3(-lado * 3.4, 1.75, 3.2), 0.55));
  colgar(c.grupo, P.cantaro(1.1), lado * 3.5, 0, -3.8);
  colgar(c.grupo, P.cantaro(0.8, 0x8a4426), lado * 3.1, 0, -3.95);
  colgar(c.grupo, P.cantaro(0.9, 0xb86a3e), -lado * 3.6, 0, -3.9);
  colgar(c.atras, P.banca(1.8), lado * -2.6, 0, 0.3);
  for (const [x, y] of [[-3.0, 2.6], [-2.4, 2.9]]) {
    const sb = P.sombrero();
    sb.rotation.x = Math.PI / 2;
    colgar(c[s.exterior === 'izq' ? 'der' : 'izq'], sb, x * 0.3, y, 0.12);
  }
  for (const [x, z] of [[lado * 3.6, 3.6], [-lado * 3.6, -0.5]]) colgar(c.grupo, P.maceta(1.0, x * 7 + z), x, 0, z);
  // Objetos
  const pl = apoyar(s, P.plinto(0.5, 1.0, P.MADERA_CLARA), lado * 1.7, -3.4);
  const sb = P.sombrero();
  sb.position.y = 1.0;
  sb.rotation.x = -0.25;
  pl.add(sb);
  marca(s, 'sombrero', pl, { foco: sb });
  foco(s, pl, 45);
  const pc = apoyar(s, P.plinto(0.45, 0.75, P.MADERA_CLARA), lado * 3.2, -1.4);
  const ch = P.checo();
  ch.position.y = 0.75;
  pc.add(ch);
  marca(s, 'checo', pc, { foco: ch });
  foco(s, pc, 45);
  const mt = apoyar(s, P.mesaTela(T.panueloColor(), { mat: P.MADERA_CLARA }), lado * 3.0, 1.6, false);
  marca(s, 'panuelo-color', mt);
  foco(s, mt, 40);
  const ca = apoyar(s, P.canasta(), -lado * 2.8, 2.2);
  marca(s, 'canasta', ca);
  foco(s, ca, 40);
  const mapa = P.cuadro(T.mapaPiura(), 1.1, 1.375, 0.09);
  colgar(c[s.exterior === 'izq' ? 'der' : 'izq'], mapa, 1.2 * -lado, 2.3, 0.02);
  marca(s, 'mapa', mapa);
  foco(s, mapa, 35, 0.45);
}

/* ----- Vals criollo: salón nocturno con balcón a la ciudad ----- */
async function salaVals(gen) {
  const s = nuevaSala(gen);
  const { c } = s;
  const matPared = new THREE.MeshStandardMaterial({ map: conRepeticion(T.damasco('#1c2a4f', 'rgba(80,110,180,0.35)', 'rgba(220,190,120,0.25)'), 1.4), roughness: 0.85 });
  pisoYTecho(c, s.W, s.D, s.A, matPiso(T.entablado(['#4a2a16', '#3e2212', '#55301a'], 9), s.W / 1.1, 0.3, Math.PI / 2), P.matMadera('#2a160a', '#0a0402', 51, 0.7, 3));
  artesonado(c, s.W, s.D, s.A, 1.4);
  const BALCON = { x: 0, w: 2.2, hs: 2.6 };
  const VENT = { x: 0, y0: 0.9, w: 2.0, h: 2.4 };
  const maderaOscura = P.matMadera('#2a160a', '#0a0402', 53, 0.4);
  // Al frente la sala va sola y sus costados quedan junto a las otras salas: el balcón pasa al fondo
  const conBalcon = s.exterior ?? 'atras';
  const huecos = conBalcon === 'atras' ? { atras: [BALCON] } : { [conBalcon]: [BALCON], atras: [VENT] };
  paredesSala(s, { mat: matPared, huecos, matZocalo: maderaOscura, cornisaMat: new THREE.MeshStandardMaterial({ color: 0xcfc4ae, roughness: 0.7 }), filete: true });
  marcoArco(c[conBalcon], BALCON, 0.18, 0.08, maderaOscura);
  // Ciudad de noche y farolas al otro lado del balcón
  const ciudad = new THREE.Mesh(new THREE.PlaneGeometry(14, 7), new THREE.MeshBasicMaterial({ map: T.nocheLima(), color: new THREE.Color(1.15, 1.15, 1.25) }));
  ciudad.position.set(0, 2.4, -G - 3.6);
  c[conBalcon].add(ciudad);
  const piso = new THREE.Mesh(new THREE.PlaneGeometry(4, 2.4), new THREE.MeshStandardMaterial({ color: 0x3a3330, roughness: 0.9 }));
  piso.rotation.x = -Math.PI / 2;
  piso.position.set(0, 0.0, -G - 1.2);
  c[conBalcon].add(piso);
  for (let k = -3; k <= 3; k++) {
    const b = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 1.0, 8), P.NEGRO);
    b.position.set(k * 0.3, 0.5, -G - 2.3);
    c[conBalcon].add(b);
  }
  const baranda = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.05, 0.05), P.NEGRO);
  baranda.position.set(0, 1.0, -G - 2.3);
  c[conBalcon].add(baranda);
  for (const x of [-2.4, 2.6]) {
    const f = P.farola(3.0);
    f.position.set(x, 0, -G - 3.0);
    c[conBalcon].add(f);
    luz(s, c[conBalcon], 0xffb45a, 10, x, 3.0, -G - 2.6, 6);
  }
  if (conBalcon !== 'atras') {
    const ciudad2 = new THREE.Mesh(new THREE.PlaneGeometry(9, 6), new THREE.MeshBasicMaterial({ map: T.nocheLima(), color: new THREE.Color(1.1, 1.1, 1.2) }));
    ciudad2.position.set(0, 2.2, -G - 2.5);
    c.atras.add(ciudad2);
    const marcoV = P.marco(VENT.w, VENT.h, 0.12, 0.1, maderaOscura);
    marcoV.position.set(0, VENT.y0 + VENT.h / 2, 0.01);
    c.atras.add(marcoV);
  }
  // Luz tenue: araña baja y apliques
  const ar = P.arana(6, 0.5, 0.9);
  ar.position.set(0, s.A - 0.9, 0);
  c.grupo.add(ar);
  luzPrincipal(s, 0xffb870, 14, s.A - 1.4);
  const ambiente = new THREE.PointLight(0x5a74c8, 6, 0, 2);
  ambiente.position.set(0, 3.5, 0);
  c.grupo.add(ambiente);
  s.luces.push(ambiente);
  const lateral = s.exterior === 'izq' ? 'der' : 'izq';
  for (const x of [-2.2, 2.2]) {
    colgar(c[lateral], P.aplique(), x, 2.5, 0.1);
    luz(s, c[lateral], 0xffa64d, 2.5, x, 2.65, 0.45, 4.5);
  }
  const lado = s.exterior === 'izq' ? -1 : 1;
  if (FIJA) return valsFija(s, lado, lateral);
  // Decoración: pareja bailando, busto de Pinglo, sofá azul
  const pareja = await modelo('02-vals-pareja.glb', 1.72);
  apoyar(s, pareja, -lado * 0.6, -3.0);
  foco(s, pareja, 35, 0.42, 0xffd6a0);
  const pp = apoyar(s, P.plinto(0.45, 1.05), -lado * 3.4, -3.4);
  const busto = await modelo('04-busto-pinglo.glb', 0.62);
  busto.position.y = 1.05;
  pp.add(busto);
  mirarA(busto, s.cam);
  foco(s, pp, 40, 0.35);
  colgar(c[lateral], P.sofa(0x2b3f6b), 0, 0, 0.45);
  colgar(c[lateral], P.cuadro(T.lienzoCuadro(imgPinglo, { fondo: ['#6f6a7a', '#1f2033'], ancho: 768, alto: 1024 }), 0.84, 1.12), 0, 2.6, 0.02);
  for (const [x, z] of [[lado * 3.5, -3.7], [-lado * 3.5, 3.7]]) colgar(c.grupo, P.maceta(0.85, x * 3 + z), x, 0, z);
  // Objetos
  const sc = apoyar(s, P.saco(), lado * 2.4, -2.6);
  marca(s, 'saco', sc);
  foco(s, sc, 55);
  const gt = apoyar(s, P.guitarra(), lado * 3.2, -0.6);
  marca(s, 'guitarra', gt);
  foco(s, gt, 60);
  const at = apoyar(s, P.atril(T.partitura()), -lado * 2.8, -0.9);
  marca(s, 'partitura', at);
  foco(s, at, 55);
  const mf = apoyar(s, P.mesaRedonda(0.3, 0.74), -lado * 3.0, 2.2, false);
  const fm = P.farolMesa();
  fm.position.y = 0.74;
  mf.add(fm);
  luz(s, mf, 0xffa94a, 3.5, 0, 0.95, 0, 4);
  marca(s, 'farol', mf, { foco: fm });
  foco(s, mf, 20, 0.3);
  const td = apoyar(s, P.tocadiscos(), lado * 2.9, 2.6);
  marca(s, 'disco', td);
  foco(s, td, 70);
}

/** Vals en vista fija: las cinco piezas juntas sobre la tarima, como en el boceto de la sala 1 */
async function valsFija(s, lado, lateral) {
  const { c } = s;
  tarima(s, 1.75, -0.7);
  // Atrás el saco al centro, el farol y la guitarra a los lados; adelante la partitura y el tocadiscos,
  // corridos hacia afuera para no tapar a las piezas de atrás
  const sc = sobreTarima(s, P.saco(), 0, -0.75);
  marca(s, 'saco', sc);
  foco(s, sc, 70, 0.32);
  const gt = sobreTarima(s, P.guitarra(), 0.8, -0.5, -0.25);
  marca(s, 'guitarra', gt);
  foco(s, gt, 55, 0.3);
  const mf = sobreTarima(s, P.mesaRedonda(0.26, 0.62), -0.78, -0.55);
  const fm = P.farolMesa();
  fm.position.y = 0.62;
  mf.add(fm);
  luz(s, mf, 0xffa94a, 4, 0, 0.85, 0, 4);
  marca(s, 'farol', mf, { foco: fm });
  foco(s, mf, 25, 0.3);
  const at = sobreTarima(s, P.atril(T.partitura()), -1.1, 0.55, 0.2);
  marca(s, 'partitura', at);
  foco(s, at, 50, 0.3);
  const td = sobreTarima(s, P.tocadiscos(), 1.15, 0.5, -0.3);
  marca(s, 'disco', td);
  foco(s, td, 55, 0.3);
  // Decoración al fondo: pareja bailando y busto de Pinglo a los costados
  const pareja = await modelo('02-vals-pareja.glb', 1.72);
  apoyar(s, pareja, lado * 2.7, -3.2);
  foco(s, pareja, 28, 0.42, 0xffd6a0);
  const pp = apoyar(s, P.plinto(0.45, 1.05), -lado * 2.9, -3.4);
  const busto = await modelo('04-busto-pinglo.glb', 0.62);
  busto.position.y = 1.05;
  pp.add(busto);
  mirarA(busto, s.cam);
  foco(s, pp, 35, 0.35);
  colgar(c[lateral], P.sofa(0x2b3f6b), 0.4, 0, 0.45);
  colgar(c[lateral], P.cuadro(T.lienzoCuadro(imgPinglo, { fondo: ['#6f6a7a', '#1f2033'], ancho: 768, alto: 1024 }), 0.84, 1.12), 0.4, 2.6, 0.02);
  for (const [x, z] of [[lado * 3.5, -3.7], [-lado * 3.5, -3.7]]) colgar(c.grupo, P.maceta(0.85, x * 3 + z), x, 0, z);
  letrero(s, 'atras', -2.55, 1);
}

/* ----- Polka criolla: salón de baile con guirnaldas ----- */
async function salaPolka(gen) {
  const s = nuevaSala(gen);
  const { c } = s;
  const matPared = new THREE.MeshStandardMaterial({ map: conRepeticion(T.rayas('#ecd3dd', '#dcb6c6', 'rgba(201,160,80,0.5)'), 3), roughness: 0.8 });
  pisoYTecho(c, s.W, s.D, s.A, matPiso(T.parquet(), s.W / 1.4, 0.22), new THREE.MeshStandardMaterial({ color: 0xf2e8d6, roughness: 0.85 }));
  const VA = { x: -2.0, y0: 0.7, w: 1.4, h: 2.9 };
  const VB = { x: 2.0, y0: 0.7, w: 1.4, h: 2.9 };
  const blanco = new THREE.MeshStandardMaterial({ color: 0xf4ece0, roughness: 0.6 });
  paredesSala(s, { mat: matPared, huecos: { [s.exterior]: [VA, VB] }, matZocalo: blanco, cornisaMat: blanco, filete: true });
  for (const v of [VA, VB]) {
    const jardin = new THREE.Mesh(new THREE.PlaneGeometry(4, 5), new THREE.MeshBasicMaterial({ map: T.nocheLima(), color: new THREE.Color(1.1, 1.1, 1.2) }));
    jardin.position.set(v.x, 2.2, -G - 1.6);
    c[s.exterior].add(jardin);
    const m = P.marco(v.w, v.h, 0.1, 0.08, blanco);
    m.position.set(v.x, v.y0 + v.h / 2, 0.01);
    c[s.exterior].add(m);
    // Cortinas
    for (const sx of [-1, 1]) {
      const cort = new THREE.Mesh(new THREE.BoxGeometry(0.42, v.h + 0.5, 0.06, 6, 1, 1), new THREE.MeshStandardMaterial({ color: 0xa24b78, roughness: 0.9 }));
      const p = cort.geometry.attributes.position;
      for (let i = 0; i < p.count; i++) p.setZ(i, p.getZ(i) + Math.sin(p.getX(i) * 30) * 0.04);
      cort.geometry.computeVertexNormals();
      cort.position.set(v.x + sx * (v.w / 2 + 0.12), v.y0 + v.h / 2 + 0.2, 0.12);
      cort.castShadow = cort.receiveShadow = true;
      c[s.exterior].add(cort);
    }
  }
  // Pista de baile al centro
  const pista = new THREE.Mesh(new THREE.CircleGeometry(2.3, 96), new THREE.MeshStandardMaterial({ map: T.alfombraRedonda(['#8a5227', '#5a2f15', '#c9a050', '#e8d2a8']), roughness: 0.25 }));
  pista.rotation.x = -Math.PI / 2;
  pista.position.y = 0.006;
  pista.receiveShadow = true;
  c.grupo.add(pista);
  // Guirnaldas de banderines
  const colores = ['#a24b78', '#fead15', '#f0e7d8', '#2b3f6b', '#93171e'];
  const yG = s.A - 0.7;
  for (const [a, b] of [
    [[-3.9, -4.2], [3.9, 4.2]],
    [[3.9, -4.2], [-3.9, 4.2]],
    [[-3.9, 0], [3.9, 0]],
    [[0, -4.2], [0, 4.2]],
  ])
    c.grupo.add(P.guirnalda(new THREE.Vector3(a[0], yG, a[1]), new THREE.Vector3(b[0], yG, b[1]), 0.5, colores));
  for (const z of [-2.2, 2.2]) {
    const ar = P.arana(8, 0.55, 0.7);
    ar.position.set(0, s.A - 0.7, z);
    c.grupo.add(ar);
  }
  luzPrincipal(s, 0xffcf8a, 30, s.A - 1.3);
  luz(s, c.grupo, 0xffc27a, 10, 0, s.A - 1.3, 2.4, 9);
  const lateral = s.exterior === 'izq' ? 'der' : 'izq';
  const lado = s.exterior === 'izq' ? -1 : 1;
  // Espejos y sillas alrededor de la pista
  for (const x of [-2.2, 2.2]) {
    const e = P.espejo(1.0, 1.6, null);
    colgar(c[lateral], e.grupo, x, 2.3, 0.03);
  }
  for (const x of [-3.0, -1.0, 1.0, 3.0]) colgar(c[lateral], P.silla(0xa24b78), x, 0, 0.45);
  for (const x of [-3.2, 3.2]) colgar(c.atras, P.silla(0xa24b78), x, 0, 0.45);
  colgar(c.atras, P.mesaConsola(1.6, 0.45), 0, 0, 0.26);
  for (const x of [-0.5, 0.5]) colgar(c.atras, P.vela(0.24, 0.02), x, 0.86, 0.3);
  colgar(c.atras, P.cuadro(T.lienzoCuadro(imgPareja, { fondo: ['#d8b0c2', '#5a2a3c'] }), 1.1, 1.1, 0.12), 0, 2.5, 0.02);
  for (const [x, z] of [[lado * 3.5, -3.8], [-lado * 3.5, -3.8], [lado * 3.5, 3.8]]) colgar(c.grupo, P.maceta(0.9, x * 5 + z), x, 0, z);
  // Objetos
  const ch = apoyar(s, P.chaleco(), lado * 2.5, -2.9);
  marca(s, 'chaleco', ch);
  foco(s, ch, 55);
  const md = apoyar(s, P.plinto(0.42, 0.75), -lado * 2.5, -3.0);
  const mand = P.mandolina();
  mand.position.y = 0.75;
  md.add(mand);
  marca(s, 'mandolina', md, { foco: mand });
  foco(s, md, 50);
  const pz = apoyar(s, P.plinto(0.55, 0.6, P.MADERA_CLARA), lado * 3.1, 0.6);
  const zp = P.zapatos();
  zp.position.y = 0.6;
  pz.add(zp);
  marca(s, 'zapatos', pz, { foco: zp });
  foco(s, pz, 45);
  const cb = apoyar(s, P.caballete(T.invitacion(), 0.6, 0.8), -lado * 3.0, 1.4);
  marca(s, 'invitacion', cb);
  foco(s, cb, 45);
  const vt = apoyar(s, P.vitrina(0.5, 0.42, 0.95, 0.42), lado * 2.6, 2.9);
  const rl = P.relojBolsillo();
  rl.position.y = 0.95;
  vt.add(rl);
  marca(s, 'reloj', vt, { foco: rl });
  foco(s, vt, 45);
}

/* ----- Festejo: patio afroperuano al atardecer ----- */
async function salaFestejo(gen) {
  const s = nuevaSala(gen);
  const { c } = s;
  // Las UV de los muros están en metros: con 0,5 cada bloque mide 1 × 0,5 m
  const matAdobe = new THREE.MeshStandardMaterial({ map: conRepeticion(T.adobe(), 0.5), roughness: 0.95 });
  const piso = new THREE.Mesh(new THREE.PlaneGeometry(s.W, s.D), matPiso(T.ladrillo(['#a2512d', '#94482a', '#b05c34', '#8a4426'], 67), s.W / 1.2, 0.85));
  piso.rotation.x = -Math.PI / 2;
  piso.receiveShadow = true;
  c.grupo.add(piso);
  const azulZocalo = new THREE.MeshStandardMaterial({ color: 0x2f5d7a, roughness: 0.8 });
  const PUERTA = { x: -1.2, y0: 0.0, w: 1.3, h: 2.5 };
  const todos = paredesSala(s, { mat: matAdobe, huecos: {}, zocalo: 'pintado', matZocalo: azulZocalo, sinTecho: true });
  void todos;
  // Cielo de atardecer sobre el patio (caja abierta solo encima de la sala)
  const cielo = new THREE.MeshBasicMaterial({ map: T.cieloTarde(), side: THREE.DoubleSide });
  const techo = new THREE.Mesh(new THREE.PlaneGeometry(s.W, s.D), new THREE.MeshBasicMaterial({ color: 0x16224a }));
  techo.rotation.x = Math.PI / 2;
  techo.position.y = 12;
  c.grupo.add(techo);
  for (const [w, x, z, giro] of [
    [s.W, 0, -s.D / 2, 0],
    [s.W, 0, s.D / 2, Math.PI],
    [s.D, -s.W / 2, 0, Math.PI / 2],
    [s.D, s.W / 2, 0, -Math.PI / 2],
  ]) {
    const lado = new THREE.Mesh(new THREE.PlaneGeometry(w, 7), cielo);
    lado.position.set(x, s.A + 3.5, z);
    lado.rotation.y = giro;
    c.grupo.add(lado);
  }
  // Remate de tejas sobre los muros
  const teja = new THREE.MeshStandardMaterial({ color: 0x8a3a1e, roughness: 0.7 });
  for (const nombre of ['atras', 'adelante', 'izq', 'der']) {
    const p = c[nombre];
    const t = new THREE.Mesh(new THREE.BoxGeometry(p.userData.L, 0.12, 0.5), teja);
    t.position.set(0, s.A + 0.06, 0.15);
    t.rotation.x = 0.2;
    t.castShadow = true;
    p.add(t);
  }
  // Puerta azul y mural
  const puerta = new THREE.Mesh(new THREE.PlaneGeometry(PUERTA.w, PUERTA.h), new THREE.MeshStandardMaterial({ map: T.puertaAzul(), roughness: 0.8 }));
  puerta.position.set(PUERTA.x * -1, PUERTA.h / 2, 0.02);
  c.atras.add(puerta);
  const marcoP = P.marco(PUERTA.w, PUERTA.h, 0.1, 0.08, P.MADERA);
  marcoP.position.set(PUERTA.x * -1, PUERTA.h / 2, 0.01);
  c.atras.add(marcoP);
  const lateral = s.exterior === 'izq' ? 'der' : 'izq';
  const mural = new THREE.Mesh(new THREE.PlaneGeometry(5.4, 2.25), new THREE.MeshStandardMaterial({ map: T.muralFestejo(), roughness: 0.9 }));
  mural.position.set(0, 2.55, 0.015);
  c[lateral].add(mural);
  // Cordones de focos cruzando el patio
  const yF = s.A - 0.2;
  for (const [a, b] of [
    [[-3.9, -4.2], [3.9, 4.2]],
    [[3.9, -4.2], [-3.9, 4.2]],
    [[-3.9, -1.5], [3.9, -1.5]],
    [[-3.9, 1.8], [3.9, 1.8]],
  ])
    c.grupo.add(P.focos(new THREE.Vector3(a[0], yF, a[1]), new THREE.Vector3(b[0], yF, b[1]), 0.45));
  luzPrincipal(s, 0xffb860, 26, s.A - 0.9);
  for (const [x, z] of [[-2.5, -2.5], [2.5, 2.5], [2.5, -2.5], [-2.5, 2.5]]) luz(s, c.grupo, 0xffc070, 5, x, s.A - 0.8, z, 6);
  const crepusculo = new THREE.HemisphereLight(0x8a7ab8, 0x6a3a20, 0.6);
  c.grupo.add(crepusculo);
  s.luces.push(crepusculo);
  const lado = s.exterior === 'izq' ? -1 : 1;
  // Decoración: cajones, banca, plantas, faroles de pared
  colgar(c.grupo, P.cajon(), -lado * 1.0, 0, -3.6).rotation.y = 0.4;
  colgar(c.grupo, P.cajon(), -lado * 0.4, 0, -3.8).rotation.y = -0.2;
  colgar(c[lateral], P.banca(2.0), 0, 0, 0.3);
  for (const [x, z] of [[lado * 3.5, -3.8], [-lado * 3.5, 3.7], [lado * 3.5, 3.7]]) colgar(c.grupo, P.maceta(1.05, x * 9 + z), x, 0, z);
  for (const x of [-2.9, 2.9]) {
    colgar(c[lateral], P.farol(), x, 2.6, 0);
    luz(s, c[lateral], 0xffb45a, 3, x, 2.7, 0.4, 4);
  }
  // Objetos
  const fd = apoyar(s, P.faldaFestejo(), lado * 2.4, -2.7);
  marca(s, 'falda', fd);
  foco(s, fd, 55);
  const pq = apoyar(s, P.plinto(0.5, 0.95), -lado * 2.8, -2.6);
  const quijada = await modelo('06-quijada-burro.glb', 0.7, { medida: 'ancho', giro: -90 });
  quijada.position.y = 0.95;
  pq.add(quijada);
  marca(s, 'quijada', pq, { foco: quijada });
  foco(s, pq, 50);
  const ci = apoyar(s, P.cintas(), lado * 3.2, 0.4);
  marca(s, 'cinta', ci);
  foco(s, ci, 45);
  const ms = P.mascara();
  colgar(c.atras, ms, PUERTA.x, 2.5, 0.03);
  marca(s, 'mascara', ms);
  foco(s, ms, 35, 0.35);
  const pcj = apoyar(s, P.plinto(0.45, 0.9), -lado * 2.9, 2.0);
  const cj = P.cajita();
  cj.position.y = 0.9;
  pcj.add(cj);
  marca(s, 'cajita', pcj, { foco: cj });
  foco(s, pcj, 45);
}

const CONSTRUIR = { marinera: salaMarinera, tondero: salaTondero, vals: salaVals, polka: salaPolka, festejo: salaFestejo };

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
    const cam = camaras[m.pano];
    const destino = puntos[m.pano];
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
  // Mirada al entrar: hacia el fondo de la sala
  for (const s of Object.values(salas)) {
    const fondo = s.c.atras.localToWorld(new THREE.Vector3(0, OJO, 0));
    puntos[s.gen.id].entrada = direccion(s.cam, fondo);
  }
}

// Caras del cubo en el orden de WebGL (+X, −X, +Y, −Y, +Z, −Z): dirección y "arriba" de cada cámara
const EJES = [
  [[1, 0, 0], [0, 1, 0]],
  [[-1, 0, 0], [0, 1, 0]],
  [[0, 1, 0], [0, 0, -1]],
  [[0, -1, 0], [0, 0, 1]],
  [[0, 0, 1], [0, 1, 0]],
  [[0, 0, -1], [0, 1, 0]],
];

const quad = new THREE.Mesh(
  new THREE.PlaneGeometry(2, 2),
  new THREE.ShaderMaterial({
    uniforms: { tex: { value: null }, cara: { value: 0 }, R: { value: new THREE.Vector3() }, U: { value: new THREE.Vector3() }, F: { value: new THREE.Vector3() } },
    vertexShader: /* glsl */ `
      varying vec2 vUv;
      void main() { vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }`,
    // Para cada píxel de la cara (convención de cubemaps de WebGL) se busca la dirección
    // y se lee la imagen supermuestreada de la cámara de esa cara: el filtrado bilineal
    // en el centro de cada bloque de 2 × 2 promedia los cuatro texeles.
    fragmentShader: /* glsl */ `
      uniform sampler2D tex;
      uniform int cara;
      uniform vec3 R;
      uniform vec3 U;
      uniform vec3 F;
      varying vec2 vUv;
      void main() {
        float sc = vUv.x * 2.0 - 1.0;
        float tc = (1.0 - vUv.y) * 2.0 - 1.0;
        vec3 d;
        if (cara == 0) d = vec3(1.0, -tc, -sc);
        else if (cara == 1) d = vec3(-1.0, -tc, sc);
        else if (cara == 2) d = vec3(sc, 1.0, tc);
        else if (cara == 3) d = vec3(sc, -1.0, -tc);
        else if (cara == 4) d = vec3(sc, -tc, 1.0);
        else d = vec3(-sc, -tc, -1.0);
        float z = dot(d, F);
        vec2 uv = vec2(dot(d, R), dot(d, U)) / z * 0.5 + 0.5;
        gl_FragColor = vec4(texture2D(tex, uv).rgb, 1.0);
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
const camCara = new THREE.PerspectiveCamera(90, 1, 0.03, 200);
const rtCara = new THREE.WebGLRenderTarget(CARA * SS, CARA * SS, { type: THREE.HalfFloatType, samples: MSAA });
rtCara.texture.generateMipmaps = false;
rtCara.texture.minFilter = rtCara.texture.magFilter = THREE.LinearFilter;
quad.material.uniforms.tex.value = rtCara.texture;

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

/** Solo la sala que se renderiza proyecta todas sus sombras; las demás quedan con su luz principal */
function prepararLuces(nombre) {
  for (const s of Object.values(salas)) {
    const propia = s.gen.id === nombre;
    for (const l of s.focos) {
      l.visible = propia || nombre === 'casona';
      l.castShadow = propia;
    }
    for (const l of s.luces) l.visible = propia || nombre === 'casona' || l === s.principal;
    if (s.principal) s.principal.castShadow = propia || nombre === 'casona';
  }
}

const EXPO = { casona: 1, marinera: 1, tondero: 0.95, vals: 1.35, polka: 1, festejo: 1.05 };

async function panorama(nombre) {
  const pos = camaras[nombre];
  estado(`Renderizando ${nombre}…`);
  prepararLuces(nombre);
  renderer.toneMappingExposure = EXPO_BASE * (EXPO[nombre] ?? 1);
  // 1) Luz ambiente de la propia sala: captura chica que sirve de reflejo y rebote de luz
  escena.environment = envEstudio;
  escena.environmentIntensity = 0.12;
  const previo = capturar(pos, 256);
  const env = pmrem.fromCubemap(previo.texture).texture;
  escena.environment = env;
  escena.environmentIntensity = 0.85;
  espejoCasona.luna.material.envMap = env;
  for (const h of P.halos) h.lookAt(pos);
  // 2) Cada cara: render supermuestreado y reducción con tonos finales
  const grandes = [];
  const medianas = [];
  for (let i = 0; i < 6; i++) {
    const [f, u] = EJES[i];
    camCara.position.copy(pos);
    camCara.up.set(...u);
    camCara.lookAt(pos.clone().add(new THREE.Vector3(...f)));
    camCara.updateMatrixWorld(true);
    const e = camCara.matrixWorld.elements;
    quad.material.uniforms.R.value.set(e[0], e[1], e[2]);
    quad.material.uniforms.U.value.set(e[4], e[5], e[6]);
    quad.material.uniforms.F.value.set(-e[8], -e[9], -e[10]);
    quad.material.uniforms.cara.value = i;
    renderer.setRenderTarget(rtCara);
    renderer.render(escena, camCara);
    renderer.setRenderTarget(null);
    renderer.render(escenaQuad, camQuad);
    grandes.push(lienzo.toDataURL('image/webp', CALIDAD));
    const [cm, gm] = T.lienzo(CARA / 2, CARA / 2);
    gm.imageSmoothingQuality = 'high';
    gm.drawImage(lienzo, 0, 0, CARA / 2, CARA / 2);
    medianas.push(cm.toDataURL('image/webp', CALIDAD_MEDIA));
  }
  previo.dispose();
  return { grandes, medianas };
}

/* ================= VISTAS FIJAS (prototipo C) ================= */

// Toma plana de cada lugar: posición, punto al que mira, campo horizontal y proporción.
// La sala principal se ve desde detrás del muro del fondo (oculto) para que entren los cinco arcos.
// `env`: desde dónde se capturan los reflejos (en la casona, desde el centro y no desde fuera del muro)
const VISTAS = { casona: { pos: new THREE.Vector3(0, 1.75, 10), env: CAM_CASONA, mira: new THREE.Vector3(0, 2.05, -R), fovH: 100, ancho: 4096, prop: 2 } };

function vistasSalas() {
  escena.updateMatrixWorld(true);
  for (const s of Object.values(salas)) {
    VISTAS[s.gen.id] = { pos: s.cam, mira: s.c.grupo.localToWorld(new THREE.Vector3(0, 1.2, -s.D / 2)), fovH: 80, ancho: 2560, prop: 2 };
  }
}

/** Puntos tocables proyectados en la imagen (x, y de 0 a 1) y el campo para acercarse a cada pieza */
function puntosFija(nombre, cam) {
  const fuera = {};
  const proyectar = (p) => {
    const v = p.clone().project(cam);
    return { x: +((v.x + 1) / 2).toFixed(4), y: +((1 - v.y) / 2).toFixed(4) };
  };
  // La salida de cada sala queda a espaldas de la cámara: en la vista fija es un botón
  for (const m of marcas.filter((x) => x.pano === nombre && x.id !== 'salida')) {
    if (m.local) {
      const punto = proyectar(m.grupo.localToWorld(m.local.clone()));
      if (m.arco) {
        // Encuadre del asomo: del piso a la cartela y de jamba a jamba
        const a = proyectar(m.grupo.localToWorld(new THREE.Vector3(m.arco.x, 0, 0)));
        const b = proyectar(m.grupo.localToWorld(new THREE.Vector3(m.arco.x, m.arco.hs + m.arco.w / 2 + 1.0, 0)));
        const i = proyectar(m.grupo.localToWorld(new THREE.Vector3(m.arco.x - m.arco.w / 2 - 0.3, 1.5, 0)));
        const d = proyectar(m.grupo.localToWorld(new THREE.Vector3(m.arco.x + m.arco.w / 2 + 0.3, 1.5, 0)));
        punto.caja = [Math.min(i.x, d.x), b.y, Math.max(i.x, d.x), a.y].map((n) => +n.toFixed(4));
      }
      fuera[m.id] = punto;
    } else {
      const caja = new THREE.Box3().setFromObject(m.foco ?? m.objeto);
      const esquinas = [];
      for (const x of [caja.min.x, caja.max.x]) for (const y of [caja.min.y, caja.max.y]) for (const z of [caja.min.z, caja.max.z]) esquinas.push(proyectar(new THREE.Vector3(x, y, z)));
      const punto = proyectar(caja.getCenter(new THREE.Vector3()));
      // Recuadro de la pieza en la imagen, para encuadrarla al acercarse
      punto.caja = [Math.min(...esquinas.map((e) => e.x)), Math.min(...esquinas.map((e) => e.y)), Math.max(...esquinas.map((e) => e.x)), Math.max(...esquinas.map((e) => e.y))].map((n) => +THREE.MathUtils.clamp(n, 0, 1).toFixed(4));
      fuera[m.id] = punto;
    }
  }
  return fuera;
}

async function vistaFija(nombre) {
  const v = VISTAS[nombre];
  const alto = Math.round(v.ancho / v.prop);
  estado(`Renderizando vista fija de ${nombre}…`);
  prepararLuces(nombre);
  renderer.toneMappingExposure = EXPO_BASE * (EXPO[nombre] ?? 1);
  escena.environment = envEstudio;
  escena.environmentIntensity = 0.12;
  const previo = capturar(v.env ?? v.pos, 256);
  const env = pmrem.fromCubemap(previo.texture).texture;
  escena.environment = env;
  escena.environmentIntensity = 0.85;
  espejoCasona.luna.material.envMap = env;
  for (const h of P.halos) h.lookAt(v.pos);
  const tanH = Math.tan(THREE.MathUtils.degToRad(v.fovH / 2));
  const cam = new THREE.PerspectiveCamera(THREE.MathUtils.radToDeg(2 * Math.atan(tanH / v.prop)), v.prop, 0.03, 200);
  cam.position.copy(v.pos);
  cam.lookAt(v.mira);
  cam.updateMatrixWorld(true);
  renderer.setSize(v.ancho * SS, alto * SS, false);
  renderer.setRenderTarget(null);
  renderer.render(escena, cam);
  const salida = (w, calidad) => {
    const [c2, g2] = T.lienzo(w, Math.round(w / v.prop));
    g2.imageSmoothingQuality = 'high';
    g2.drawImage(lienzo, 0, 0, c2.width, c2.height);
    return c2.toDataURL('image/webp', calidad);
  };
  const grande = salida(v.ancho, CALIDAD);
  const mediana = salida(v.ancho / 2, CALIDAD_MEDIA);
  previo.dispose();
  return { grande, mediana, datos: { ancho: v.ancho, alto, fovH: v.fovH, puntos: puntosFija(nombre, cam) } };
}

try {
  await document.fonts.load(`700 80px "Libre Baskerville"`);
  for (const gen of generos) await CONSTRUIR[gen.id](gen);
  if (FIJA) {
    vistasSalas();
    const nombres = ['casona', ...generos.map((g) => g.id)].filter((n) => !SOLO || SOLO.split(',').includes(n));
    window.fijas = { nombres, render: vistaFija };
    estado('Listo');
    window.listo = true;
    throw null;
  }
  calcularPuntos();
  const nombres = ['casona', ...generos.map((g) => g.id)].filter((n) => !SOLO || SOLO.split(',').includes(n));
  window.panoramas = { cara: CARA, nombres, render: async (n) => ({ ...(await panorama(n)), puntos: { camara: camaras[n].toArray().map((v) => +v.toFixed(3)), ...puntos[n] } }) };
  estado('Listo');
  window.listo = true;
} catch (e) {
  if (e !== null) {
    console.error(e);
    Object.assign(window, { error: String(e?.stack ?? e) });
  }
}
