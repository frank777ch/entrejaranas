// Piezas sueltas de la escena: muebles, lámparas, objetos de la sala.
// Todas se arman en coordenadas locales: y = 0 es el piso, +z mira hacia la cámara.
import * as THREE from 'three';
import * as T from './texturas.js';

export const ORO = new THREE.MeshStandardMaterial({ color: 0xc9a050, metalness: 1, roughness: 0.3 });
export const BRONCE = new THREE.MeshStandardMaterial({ color: 0xa8793a, metalness: 1, roughness: 0.38 });
export const BLANCO = new THREE.MeshStandardMaterial({ color: 0xeee3cc, roughness: 0.72 });
export const NEGRO = new THREE.MeshStandardMaterial({ color: 0x15100c, roughness: 0.35 });
export const VIDRIO = new THREE.MeshStandardMaterial({
  color: 0xdfe8e6,
  roughness: 0.04,
  metalness: 0.2,
  transparent: true,
  opacity: 0.14,
  depthWrite: false,
});

export function rep(t, x, y = x) {
  const c = t.clone();
  c.needsUpdate = true;
  c.wrapS = c.wrapT = THREE.RepeatWrapping;
  c.repeat.set(x, y);
  return c;
}

export const matMadera = (base = '#5a2f15', veta = '#1e0c04', semilla = 3, rugosidad = 0.42, r = 1) =>
  new THREE.MeshStandardMaterial({ map: rep(T.madera(base, veta, semilla), r), roughness: rugosidad });

export const MADERA = matMadera();
export const MADERA_CLARA = matMadera('#8a5227', '#3a1a08', 9, 0.36);

function sombras(o, emite = true, recibe = true) {
  o.traverse((n) => {
    if (n.isMesh) {
      n.castShadow = emite;
      n.receiveShadow = recibe;
    }
  });
  return o;
}

function caja(w, h, d, mat, x = 0, y = 0, z = 0) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
  m.position.set(x, y, z);
  return m;
}

function torneado(perfil, mat, segmentos = 32) {
  return new THREE.Mesh(new THREE.LatheGeometry(perfil.map(([x, y]) => new THREE.Vector2(x, y)), segmentos), mat);
}

/** Pata torneada de mueble */
function pata(alto, grosor, mat) {
  const g = grosor;
  return torneado(
    [
      [0, 0],
      [g * 0.6, 0],
      [g * 0.7, alto * 0.06],
      [g * 0.45, alto * 0.18],
      [g * 0.8, alto * 0.3],
      [g * 0.5, alto * 0.42],
      [g * 0.45, alto * 0.8],
      [g * 0.75, alto * 0.88],
      [g * 0.75, alto],
      [0, alto],
    ],
    mat,
    16,
  );
}

/* ---------- Luz de vela ---------- */

/** Llamas y halos que deben mirar a la cámara en cada captura */
export const halos = [];
const texHalo = T.halo();
const matLlama = new THREE.MeshBasicMaterial({ color: new THREE.Color(4, 2.6, 1.1) });

export function vela(alto = 0.14, radio = 0.016) {
  const g = new THREE.Group();
  const cera = new THREE.Mesh(new THREE.CylinderGeometry(radio, radio, alto, 12), new THREE.MeshStandardMaterial({ color: 0xf3ead6, roughness: 0.6, emissive: 0x4a2a08 }));
  cera.position.y = alto / 2;
  const llama = new THREE.Mesh(new THREE.SphereGeometry(1, 12, 8), matLlama);
  llama.scale.set(radio * 0.55, radio * 1.6, radio * 0.55);
  llama.position.y = alto + radio * 1.4;
  const h = new THREE.Mesh(
    new THREE.PlaneGeometry(radio * 16, radio * 16),
    new THREE.MeshBasicMaterial({ map: texHalo, transparent: true, opacity: 0.55, depthWrite: false, blending: THREE.AdditiveBlending }),
  );
  h.position.y = alto + radio * 1.4;
  halos.push(h);
  g.add(cera, llama, h);
  cera.castShadow = false;
  return g;
}

/** Araña colgante de bronce con velas */
export function arana(brazos = 8, radio = 0.62, cadena = 1.0) {
  const g = new THREE.Group();
  const eslabones = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, cadena, 8), BRONCE);
  eslabones.position.y = cadena / 2;
  g.add(eslabones);
  const cuerpo = torneado(
    [
      [0, -0.62],
      [0.05, -0.6],
      [0.03, -0.52],
      [0.11, -0.42],
      [0.16, -0.3],
      [0.1, -0.2],
      [0.07, -0.1],
      [0.12, -0.04],
      [0.05, 0.02],
      [0.03, 0.1],
      [0, 0.12],
    ],
    BRONCE,
  );
  g.add(cuerpo);
  for (let k = 0; k < brazos; k++) {
    const a = (k / brazos) * Math.PI * 2;
    const dir = new THREE.Vector3(Math.cos(a), 0, Math.sin(a));
    const curva = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, -0.34, 0),
      dir.clone().multiplyScalar(radio * 0.45).setY(-0.46),
      dir.clone().multiplyScalar(radio * 0.9).setY(-0.36),
      dir.clone().multiplyScalar(radio).setY(-0.22),
    ]);
    g.add(new THREE.Mesh(new THREE.TubeGeometry(curva, 24, 0.012, 8), BRONCE));
    const plato = torneado([[0, 0], [0.05, 0], [0.06, 0.02], [0.03, 0.03], [0.02, 0.05], [0, 0.05]], BRONCE, 16);
    plato.position.copy(dir.clone().multiplyScalar(radio).setY(-0.22));
    g.add(plato);
    const v = vela(0.13, 0.014);
    v.position.copy(plato.position).setY(-0.17);
    g.add(v);
    // Lágrimas de cristal
    const gota = new THREE.Mesh(new THREE.OctahedronGeometry(0.025), new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.02, metalness: 0.9 }));
    gota.scale.y = 1.8;
    gota.position.copy(dir.clone().multiplyScalar(radio * 0.7).setY(-0.5));
    g.add(gota);
  }
  // Ninguna pieza de la araña proyecta sombra: la luz va dentro
  g.traverse((n) => n.isMesh && (n.castShadow = false));
  return g;
}

/** Aplique de pared con dos velas (z+ hacia la sala) */
export function aplique() {
  const g = new THREE.Group();
  const placa = torneado([[0, 0], [0.09, 0], [0.1, 0.015], [0.07, 0.03], [0, 0.03]], ORO, 24);
  placa.rotation.x = Math.PI / 2;
  placa.scale.set(1, 1, 1.8);
  g.add(placa);
  for (const lado of [-1, 1]) {
    const curva = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, -0.05, 0.03),
      new THREE.Vector3(lado * 0.1, -0.08, 0.12),
      new THREE.Vector3(lado * 0.18, 0.02, 0.16),
    ]);
    g.add(new THREE.Mesh(new THREE.TubeGeometry(curva, 16, 0.01, 8), ORO));
    const plato = torneado([[0, 0], [0.04, 0], [0.045, 0.015], [0, 0.015]], ORO, 16);
    plato.position.set(lado * 0.18, 0.02, 0.16);
    g.add(plato);
    const v = vela(0.12, 0.013);
    v.position.set(lado * 0.18, 0.035, 0.16);
    g.add(v);
  }
  g.traverse((n) => n.isMesh && (n.castShadow = false));
  return g;
}

/* ---------- Cuadros y espejos ---------- */

/** Marco dorado con moldura (ancho y alto exteriores del lienzo) */
export function marco(ancho, alto, borde = 0.11, prof = 0.07, mat = ORO) {
  const g = new THREE.Group();
  const lados = [
    [ancho + borde * 2, borde, 0, alto / 2 + borde / 2],
    [ancho + borde * 2, borde, 0, -alto / 2 - borde / 2],
    [borde, alto, -ancho / 2 - borde / 2, 0],
    [borde, alto, ancho / 2 + borde / 2, 0],
  ];
  for (const [w, h, x, y] of lados) {
    g.add(caja(w, h, prof, mat, x, y, prof / 2));
    // Moldura interior más clara
    const filete = caja(w === borde ? borde * 0.35 : w - borde * 1.3, h === borde ? borde * 0.35 : h - borde * 1.3, prof * 0.4, mat, 0, 0, prof + prof * 0.15);
    filete.position.x = x === 0 ? 0 : x - Math.sign(x) * borde * 0.3;
    filete.position.y = y === 0 ? 0 : y - Math.sign(y) * borde * 0.3;
    g.add(filete);
  }
  // Florones en las esquinas
  for (const sx of [-1, 1])
    for (const sy of [-1, 1]) {
      const f = new THREE.Mesh(new THREE.SphereGeometry(borde * 0.38, 16, 12), mat);
      f.position.set(sx * (ancho / 2 + borde / 2), sy * (alto / 2 + borde / 2), prof + 0.01);
      f.scale.z = 0.6;
      g.add(f);
    }
  return sombras(g);
}

export function cuadro(textura, ancho, alto, borde = 0.11) {
  const g = marco(ancho, alto, borde);
  const lienzo = new THREE.Mesh(new THREE.PlaneGeometry(ancho, alto), new THREE.MeshStandardMaterial({ map: textura, roughness: 0.62 }));
  lienzo.position.z = 0.02;
  lienzo.receiveShadow = true;
  g.add(lienzo);
  return g;
}

/** Espejo de marco dorado con copete */
export function espejo(ancho, alto, envMap) {
  const g = marco(ancho, alto, 0.13, 0.08);
  const luna = new THREE.Mesh(
    new THREE.PlaneGeometry(ancho, alto),
    new THREE.MeshStandardMaterial({ color: 0xcfc6b4, metalness: 1, roughness: 0.06, envMap, envMapIntensity: 1 }),
  );
  luna.position.z = 0.02;
  g.add(luna);
  // Copete tallado
  const s = new THREE.Shape();
  s.moveTo(-ancho * 0.42, 0);
  s.bezierCurveTo(-ancho * 0.3, 0.1, -ancho * 0.18, 0.06, -0.08, 0.2);
  s.bezierCurveTo(-0.05, 0.3, 0.05, 0.3, 0.08, 0.2);
  s.bezierCurveTo(ancho * 0.18, 0.06, ancho * 0.3, 0.1, ancho * 0.42, 0);
  s.closePath();
  const copete = new THREE.Mesh(new THREE.ExtrudeGeometry(s, { depth: 0.05, bevelEnabled: true, bevelThickness: 0.015, bevelSize: 0.015, bevelSegments: 3 }), ORO);
  copete.position.set(0, alto / 2 + 0.12, 0.01);
  g.add(copete);
  const roseta = new THREE.Mesh(new THREE.SphereGeometry(0.07, 20, 14), ORO);
  roseta.position.set(0, alto / 2 + 0.3, 0.05);
  g.add(roseta);
  return { grupo: sombras(g), luna };
}

/* ---------- Muebles ---------- */

export function mesaConsola(ancho = 1.3, fondo = 0.45, alto = 0.86, mat = MADERA) {
  const g = new THREE.Group();
  g.add(caja(ancho, 0.05, fondo, mat, 0, alto - 0.025, 0));
  g.add(caja(ancho - 0.1, 0.14, fondo - 0.08, mat, 0, alto - 0.12, 0));
  // Faldón con filete dorado
  g.add(caja(ancho - 0.2, 0.012, 0.012, ORO, 0, alto - 0.14, fondo / 2 - 0.035));
  for (const sx of [-1, 1])
    for (const sz of [-1, 1]) {
      const p = pata(alto - 0.05, 0.035, mat);
      p.position.set(sx * (ancho / 2 - 0.08), 0, sz * (fondo / 2 - 0.07));
      g.add(p);
    }
  return sombras(g);
}

export function mesaRedonda(radio = 0.32, alto = 0.74, mat = MADERA) {
  const g = new THREE.Group();
  const tapa = new THREE.Mesh(new THREE.CylinderGeometry(radio, radio, 0.04, 40), mat);
  tapa.position.y = alto - 0.02;
  g.add(tapa);
  const columna = pata(alto - 0.04, 0.05, mat);
  g.add(columna);
  for (let k = 0; k < 3; k++) {
    const a = (k / 3) * Math.PI * 2;
    const pie = caja(0.04, 0.05, radio * 0.9, mat);
    pie.position.set(Math.sin(a) * radio * 0.4, 0.04, Math.cos(a) * radio * 0.4);
    pie.rotation.y = a;
    g.add(pie);
  }
  return sombras(g);
}

/** Silla de época tapizada */
export function silla(tela = 0x7a1a20, mat = MADERA) {
  const g = new THREE.Group();
  const tapiz = new THREE.MeshStandardMaterial({ color: tela, roughness: 0.85 });
  g.add(caja(0.48, 0.07, 0.46, mat, 0, 0.45, 0));
  g.add(caja(0.42, 0.05, 0.4, tapiz, 0, 0.5, 0.01));
  for (const sx of [-1, 1])
    for (const sz of [-1, 1]) {
      const p = pata(0.44, 0.024, mat);
      p.position.set(sx * 0.2, 0, sz * 0.19);
      g.add(p);
    }
  // Respaldo con medallón
  for (const sx of [-1, 1]) g.add(caja(0.04, 0.6, 0.04, mat, sx * 0.21, 0.78, -0.21));
  g.add(caja(0.46, 0.06, 0.05, mat, 0, 1.08, -0.21));
  const medallon = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, 0.04, 32), tapiz);
  medallon.rotation.x = Math.PI / 2;
  medallon.scale.set(1, 1, 1.35);
  medallon.position.set(0, 0.8, -0.21);
  g.add(medallon);
  return sombras(g);
}

/** Sofá (canapé) de época */
export function sofa(tela = 0x8a1c22, mat = MADERA, ancho = 1.8) {
  const g = new THREE.Group();
  const tapiz = new THREE.MeshStandardMaterial({ color: tela, roughness: 0.88 });
  g.add(caja(ancho, 0.1, 0.62, mat, 0, 0.42, 0));
  const asiento = new THREE.Mesh(new THREE.BoxGeometry(ancho - 0.12, 0.12, 0.56), tapiz);
  asiento.position.set(0, 0.52, 0.01);
  g.add(asiento);
  const s = new THREE.Shape();
  s.moveTo(-ancho / 2, 0);
  s.lineTo(-ancho / 2, 0.42);
  s.bezierCurveTo(-ancho * 0.3, 0.46, -ancho * 0.18, 0.62, 0, 0.64);
  s.bezierCurveTo(ancho * 0.18, 0.62, ancho * 0.3, 0.46, ancho / 2, 0.42);
  s.lineTo(ancho / 2, 0);
  s.closePath();
  const respaldo = new THREE.Mesh(new THREE.ExtrudeGeometry(s, { depth: 0.1, bevelEnabled: true, bevelSize: 0.03, bevelThickness: 0.03, bevelSegments: 3 }), tapiz);
  respaldo.position.set(0, 0.52, -0.31);
  g.add(respaldo);
  const marcoR = new THREE.Mesh(new THREE.ExtrudeGeometry(s, { depth: 0.04, bevelEnabled: false }), mat);
  marcoR.position.set(0, 0.52, -0.36);
  marcoR.scale.set(1.04, 1.06, 1);
  g.add(marcoR);
  for (const sx of [-1, 1]) {
    g.add(caja(0.08, 0.26, 0.56, tapiz, sx * (ancho / 2 - 0.02), 0.65, 0.02));
    for (const sz of [-1, 1]) {
      const p = pata(0.38, 0.03, mat);
      p.position.set(sx * (ancho / 2 - 0.08), 0, sz * 0.24);
      g.add(p);
    }
  }
  return sombras(g);
}

/** Maceta de barro con helecho */
export function maceta(escala = 1, semilla = 1) {
  const g = new THREE.Group();
  const r = T.azar(semilla * 97);
  const barro = new THREE.MeshStandardMaterial({ color: 0x9c4a26, roughness: 0.82 });
  const vidriado = new THREE.MeshStandardMaterial({ color: 0x1d4a8a, roughness: 0.25 });
  const olla = torneado(
    [
      [0, 0],
      [0.16, 0],
      [0.2, 0.05],
      [0.26, 0.25],
      [0.27, 0.4],
      [0.24, 0.5],
      [0.27, 0.55],
      [0.25, 0.58],
      [0.22, 0.58],
    ],
    barro,
  );
  g.add(olla);
  const franja = new THREE.Mesh(new THREE.CylinderGeometry(0.272, 0.268, 0.06, 32, 1, true), vidriado);
  franja.position.y = 0.33;
  g.add(franja);
  const tierra = new THREE.Mesh(new THREE.CircleGeometry(0.22, 24), new THREE.MeshStandardMaterial({ color: 0x2a1a10, roughness: 1 }));
  tierra.rotation.x = -Math.PI / 2;
  tierra.position.y = 0.55;
  g.add(tierra);
  const hoja = new THREE.MeshStandardMaterial({ color: 0x3f6b2a, roughness: 0.6, side: THREE.DoubleSide });
  const hojaClara = new THREE.MeshStandardMaterial({ color: 0x5c8a35, roughness: 0.6, side: THREE.DoubleSide });
  for (let k = 0; k < 26; k++) {
    const a = r() * Math.PI * 2;
    const largo = 0.55 + r() * 0.45;
    const caida = 0.5 + r() * 0.6;
    const curva = new THREE.QuadraticBezierCurve3(
      new THREE.Vector3(0, 0.55, 0),
      new THREE.Vector3(Math.cos(a) * largo * 0.4, 0.55 + largo * 0.9, Math.sin(a) * largo * 0.4),
      new THREE.Vector3(Math.cos(a) * largo, 0.55 + largo * (1 - caida), Math.sin(a) * largo),
    );
    // Fronda: tira que se angosta en la punta
    const pts = curva.getPoints(12);
    const pos = [];
    const idx = [];
    const lado = new THREE.Vector3(-Math.sin(a), 0, Math.cos(a));
    pts.forEach((p, i) => {
      const t = i / (pts.length - 1);
      const w = 0.07 * Math.sin(Math.PI * Math.min(1, t * 1.15 + 0.08));
      pos.push(...p.clone().addScaledVector(lado, w).toArray(), ...p.clone().addScaledVector(lado, -w).toArray());
      if (i) idx.push(i * 2 - 2, i * 2 - 1, i * 2, i * 2 - 1, i * 2 + 1, i * 2);
    });
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    geo.setIndex(idx);
    geo.computeVertexNormals();
    g.add(new THREE.Mesh(geo, k % 3 ? hoja : hojaClara));
  }
  g.scale.setScalar(escala);
  return sombras(g);
}

/* ---------- Objetos de la sala de la marinera ---------- */

/** Arpa peruana: caja de resonancia, columna, clavijero y cuerdas */
export function arpa() {
  const g = new THREE.Group();
  const mad = new THREE.MeshStandardMaterial({ map: rep(T.madera('#94582a', '#3a1a08', 9), 1, 1), roughness: 0.32 });
  const oscura = matMadera('#3a1a0b', '#120602', 5, 0.35);
  const inclinacion = 0.2;
  const frente = (t) => THREE.MathUtils.lerp(0.21, 0.06, t) - t * inclinacion;
  // Caja de resonancia: lomo redondeado que se angosta hacia arriba, con tapa plana al frente
  const prof = (t) => THREE.MathUtils.lerp(0.4, 0.11, t);
  const anch = (t) => THREE.MathUtils.lerp(0.5, 0.13, t);
  const lomo = new THREE.CylinderGeometry(1, 1, 1, 28, 12, false, Math.PI, Math.PI);
  const p = lomo.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const t = p.getY(i) + 0.5;
    p.setXYZ(i, frente(t) + p.getX(i) * prof(t), 0.12 + t * 1.3, (p.getZ(i) * anch(t)) / 2);
  }
  lomo.computeVertexNormals();
  const cuerpo = new THREE.Mesh(lomo, mad.clone());
  cuerpo.material.side = THREE.DoubleSide;
  g.add(cuerpo);
  const tapa = new THREE.PlaneGeometry(1, 1, 1, 12);
  const q = tapa.attributes.position;
  for (let i = 0; i < q.count; i++) {
    const t = q.getY(i) + 0.5;
    q.setXYZ(i, frente(t), 0.12 + t * 1.3, q.getX(i) * anch(t));
  }
  tapa.computeVertexNormals();
  g.add(new THREE.Mesh(tapa, matMadera('#c99256', '#7a4a20', 11, 0.4)));
  // Bocas en la tapa
  for (const [t, rad] of [[0.18, 0.05], [0.42, 0.04], [0.64, 0.03]]) {
    const boca = new THREE.Mesh(new THREE.CircleGeometry(rad, 24), NEGRO);
    const y = 0.12 + t * 1.3;
    boca.position.set(frente(t) + 0.004, y, 0);
    boca.rotation.y = Math.PI / 2;
    g.add(boca);
  }
  // Base
  g.add(caja(0.46, 0.12, 0.52, oscura, 0.0, 0.06, 0));
  // Columna torneada
  const columna = torneado(
    [
      [0, 0],
      [0.06, 0],
      [0.06, 0.06],
      [0.035, 0.12],
      [0.05, 0.3],
      [0.03, 0.5],
      [0.032, 1.2],
      [0.05, 1.3],
      [0.04, 1.42],
      [0, 1.42],
    ],
    mad,
    20,
  );
  columna.position.set(0.95, 0, 0);
  columna.rotation.z = 0.04;
  g.add(columna);
  // Clavijero en S
  const cuello = new THREE.CatmullRomCurve3([
    new THREE.Vector3(frente(1) - 0.05, 1.44, 0),
    new THREE.Vector3(0.12, 1.6, 0),
    new THREE.Vector3(0.45, 1.46, 0),
    new THREE.Vector3(0.75, 1.5, 0),
    new THREE.Vector3(0.92, 1.44, 0),
  ]);
  g.add(new THREE.Mesh(new THREE.TubeGeometry(cuello, 60, 0.042, 12), mad));
  // Cuerdas
  const cuerda = new THREE.MeshStandardMaterial({ color: 0xf2ead8, roughness: 0.3, metalness: 0.2 });
  const N = 28;
  for (let i = 0; i < N; i++) {
    const t = i / (N - 1);
    const tc = THREE.MathUtils.lerp(0.95, 0.12, t);
    const a = new THREE.Vector3(frente(tc) + 0.006, 0.12 + tc * 1.3, 0);
    const b = cuello.getPoint(THREE.MathUtils.lerp(0.1, 0.95, t)).add(new THREE.Vector3(0, -0.04, 0));
    const largo = a.distanceTo(b);
    const c = new THREE.Mesh(new THREE.CylinderGeometry(0.0025, 0.0025, largo, 5), cuerda);
    c.position.copy(a).lerp(b, 0.5);
    c.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), b.clone().sub(a).normalize());
    g.add(c);
    // Clavija
    const cl = caja(0.012, 0.012, 0.09, BRONCE, b.x, b.y + 0.03, 0);
    g.add(cl);
  }
  return sombras(g);
}

/** Mesita con pañuelo de encaje caído por el borde */
export function mesaPanuelo() {
  const g = mesaRedonda(0.3, 0.76, MADERA);
  const tela = new THREE.MeshStandardMaterial({ map: T.encaje(), alphaTest: 0.5, side: THREE.DoubleSide, roughness: 0.9 });
  const geo = new THREE.PlaneGeometry(0.62, 0.62, 48, 48);
  geo.rotateX(-Math.PI / 2);
  const p = geo.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i) + 0.14;
    const z = p.getZ(i) + 0.05;
    const d = Math.hypot(x, z);
    let y = 0.002 + Math.sin(x * 40) * Math.cos(z * 33) * 0.004;
    let fx = x;
    let fz = z;
    if (d > 0.29) {
      // Cae por el borde de la mesa
      const sobra = d - 0.29;
      const k = 0.29 / d;
      fx = x * k + (x / d) * Math.sin(Math.min(sobra * 6, 1.4)) * 0.02;
      fz = z * k + (z / d) * Math.sin(Math.min(sobra * 6, 1.4)) * 0.02;
      y = -sobra + Math.sin(Math.atan2(z, x) * 7) * 0.012;
    }
    p.setXYZ(i, fx, 0.764 + y, fz);
  }
  geo.computeVertexNormals();
  const panuelo = new THREE.Mesh(geo, tela);
  panuelo.castShadow = true;
  panuelo.receiveShadow = true;
  g.add(panuelo);
  // Segundo pañuelo doblado
  const doblado = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.025, 0.16), new THREE.MeshStandardMaterial({ color: 0xf7f3ea, roughness: 0.9 }));
  doblado.position.set(-0.1, 0.78, -0.1);
  doblado.rotation.y = 0.5;
  doblado.castShadow = true;
  g.add(doblado);
  return g;
}

/** Vitrina de pedestal con tapa de vidrio */
export function vitrina(ancho = 0.62, fondo = 0.48, altoBase = 0.92, altoVidrio = 0.56) {
  const g = new THREE.Group();
  g.add(caja(ancho, altoBase, fondo, MADERA, 0, altoBase / 2, 0));
  g.add(caja(ancho + 0.06, 0.06, fondo + 0.06, MADERA, 0, 0.03, 0));
  g.add(caja(ancho + 0.04, 0.04, fondo + 0.04, MADERA, 0, altoBase - 0.02, 0));
  g.add(caja(ancho - 0.04, 0.01, fondo - 0.04, new THREE.MeshStandardMaterial({ color: 0x5a1015, roughness: 0.95 }), 0, altoBase + 0.005, 0));
  const vidrio = caja(ancho, altoVidrio, fondo, VIDRIO, 0, altoBase + altoVidrio / 2, 0);
  vidrio.castShadow = false;
  g.add(vidrio);
  for (const sx of [-1, 1])
    for (const sz of [-1, 1]) g.add(caja(0.016, altoVidrio, 0.016, BRONCE, (sx * ancho) / 2, altoBase + altoVidrio / 2, (sz * fondo) / 2));
  g.add(caja(ancho + 0.02, 0.02, fondo + 0.02, BRONCE, 0, altoBase + altoVidrio, 0));
  sombras(g);
  vidrio.castShadow = false;
  return g;
}

/** Gramófono de bocina sobre mesita */
export function gramofono() {
  const g = mesaRedonda(0.34, 0.72, MADERA);
  const mueble = new THREE.Group();
  mueble.position.y = 0.72;
  g.add(mueble);
  mueble.add(caja(0.42, 0.16, 0.42, MADERA_CLARA, 0, 0.08, 0));
  mueble.add(caja(0.44, 0.02, 0.44, MADERA, 0, 0.17, 0));
  const plato = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 0.012, 48), NEGRO);
  plato.position.y = 0.186;
  mueble.add(plato);
  const disco = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, 0.004, 48), new THREE.MeshStandardMaterial({ color: 0x0c0c0c, roughness: 0.18 }));
  disco.position.y = 0.194;
  mueble.add(disco);
  const etiqueta = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 0.005, 32), new THREE.MeshStandardMaterial({ color: 0x93171e, roughness: 0.6 }));
  etiqueta.position.y = 0.196;
  mueble.add(etiqueta);
  // Manivela
  const manivela = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.14, 8), BRONCE);
  manivela.rotation.z = Math.PI / 2;
  manivela.position.set(0.27, 0.09, 0);
  mueble.add(manivela);
  // Brazo y bocina
  const brazo = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0.15, 0.2, -0.15),
    new THREE.Vector3(0.16, 0.3, -0.16),
    new THREE.Vector3(0.12, 0.34, -0.05),
    new THREE.Vector3(0.05, 0.22, 0.04),
  ]);
  mueble.add(new THREE.Mesh(new THREE.TubeGeometry(brazo, 30, 0.012, 10), BRONCE));
  const perfil = [];
  for (let i = 0; i <= 30; i++) {
    const t = i / 30;
    perfil.push([0.02 + Math.pow(t, 3.2) * 0.3, t * 0.62]);
  }
  const bocina = torneado(perfil, new THREE.MeshStandardMaterial({ color: 0xb98a3c, metalness: 1, roughness: 0.25, side: THREE.DoubleSide }), 48);
  bocina.position.set(0.16, 0.32, -0.16);
  bocina.rotation.set(-0.95, 0, -0.35);
  mueble.add(bocina);
  return sombras(g);
}

/** Cajón peruano */
export function cajon() {
  const g = new THREE.Group();
  const mad = matMadera('#9a6233', '#4a2610', 13, 0.5);
  g.add(caja(0.31, 0.48, 0.3, mad, 0, 0.24, 0));
  const boca = new THREE.Mesh(new THREE.CircleGeometry(0.055, 24), NEGRO);
  boca.position.set(0, 0.3, -0.151);
  boca.rotation.y = Math.PI;
  g.add(boca);
  return sombras(g);
}

/** Guirnalda de banderines entre dos puntos */
export function guirnalda(a, b, caida, colores) {
  const g = new THREE.Group();
  const curva = new THREE.QuadraticBezierCurve3(a, a.clone().lerp(b, 0.5).add(new THREE.Vector3(0, -caida * 2, 0)), b);
  g.add(new THREE.Mesh(new THREE.TubeGeometry(curva, 40, 0.004, 4), NEGRO));
  const n = Math.round(a.distanceTo(b) / 0.22);
  for (let i = 1; i < n; i++) {
    const p = curva.getPoint(i / n);
    const tri = new THREE.Mesh(
      new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(-0.07, 0, 0), new THREE.Vector3(0.07, 0, 0), new THREE.Vector3(0, -0.14, 0)]),
      new THREE.MeshStandardMaterial({ color: colores[i % colores.length], side: THREE.DoubleSide, roughness: 0.8 }),
    );
    tri.geometry.computeVertexNormals();
    tri.position.copy(p);
    tri.lookAt(p.clone().add(new THREE.Vector3(b.z - a.z, 0, a.x - b.x)));
    g.add(tri);
  }
  return g;
}

/** Cordón de focos encendidos */
export function focos(a, b, caida, color = 0xffc46a) {
  const g = new THREE.Group();
  const curva = new THREE.QuadraticBezierCurve3(a, a.clone().lerp(b, 0.5).add(new THREE.Vector3(0, -caida * 2, 0)), b);
  g.add(new THREE.Mesh(new THREE.TubeGeometry(curva, 40, 0.004, 4), NEGRO));
  const n = Math.round(a.distanceTo(b) / 0.4);
  const brillo = new THREE.MeshBasicMaterial({ color: new THREE.Color(color).multiplyScalar(3) });
  for (let i = 1; i < n; i++) {
    const f = new THREE.Mesh(new THREE.SphereGeometry(0.03, 12, 8), brillo);
    f.position.copy(curva.getPoint(i / n)).add(new THREE.Vector3(0, -0.04, 0));
    g.add(f);
  }
  return g;
}

/** Farol de pared con luz cálida */
export function farol() {
  const g = new THREE.Group();
  g.add(caja(0.04, 0.04, 0.3, NEGRO, 0, 0.3, 0.15));
  const cuerpo = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.07, 0.28, 6), new THREE.MeshBasicMaterial({ color: new THREE.Color(3, 2.1, 1) }));
  cuerpo.position.set(0, 0.12, 0.3);
  g.add(cuerpo);
  const techo = new THREE.Mesh(new THREE.ConeGeometry(0.14, 0.12, 6), NEGRO);
  techo.position.set(0, 0.32, 0.3);
  g.add(techo);
  return g;
}
