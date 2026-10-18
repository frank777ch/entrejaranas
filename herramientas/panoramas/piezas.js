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
  const cuerpo = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.07, 0.28, 6), new THREE.MeshBasicMaterial({ color: new THREE.Color(1.6, 1.05, 0.5) }));
  cuerpo.position.set(0, 0.12, 0.3);
  for (let k = 0; k < 6; k++) {
    const a = (k / 6) * Math.PI * 2 + Math.PI / 6;
    g.add(caja(0.012, 0.28, 0.012, NEGRO, Math.sin(a) * 0.09, 0.12, 0.3 + Math.cos(a) * 0.09));
  }
  g.add(cuerpo);
  const techo = new THREE.Mesh(new THREE.ConeGeometry(0.14, 0.12, 6), NEGRO);
  techo.position.set(0, 0.32, 0.3);
  g.add(techo);
  return g;
}

/* ---------- Piezas de las salas de los géneros ---------- */

/** Plinto de exhibición */
export function plinto(ancho = 0.5, alto = 0.9, mat = MADERA, fondo = ancho) {
  const g = new THREE.Group();
  g.add(caja(ancho, alto, fondo, mat, 0, alto / 2, 0));
  g.add(caja(ancho + 0.06, 0.06, fondo + 0.06, mat, 0, 0.03, 0));
  g.add(caja(ancho + 0.04, 0.04, fondo + 0.04, mat, 0, alto - 0.02, 0));
  return sombras(g);
}

const PIEL_MANIQUI = new THREE.MeshStandardMaterial({ color: 0xe8dcc4, roughness: 0.75 });

/** Maniquí de costura sobre trípode; devuelve el grupo y la altura de la cintura */
export function maniqui(tela = PIEL_MANIQUI) {
  const g = new THREE.Group();
  const torso = torneado(
    [
      [0, 0.95],
      [0.12, 0.95],
      [0.14, 1.02],
      [0.125, 1.12],
      [0.14, 1.25],
      [0.17, 1.38],
      [0.165, 1.46],
      [0.14, 1.53],
      [0.075, 1.58],
      [0.045, 1.6],
      [0.045, 1.68],
      [0.06, 1.7],
      [0, 1.71],
    ],
    tela,
    40,
  );
  torso.scale.z = 0.78;
  g.add(torso);
  const palo = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.95, 10), BRONCE);
  palo.position.y = 0.475;
  g.add(palo);
  for (let k = 0; k < 3; k++) {
    const a = (k / 3) * Math.PI * 2 + Math.PI / 6;
    const pie = caja(0.03, 0.03, 0.34, MADERA);
    pie.position.set(Math.sin(a) * 0.15, 0.03, Math.cos(a) * 0.15);
    pie.rotation.y = a;
    g.add(pie);
  }
  return sombras(g);
}

/** Maniquí con blusa blanca y falda amplia de colores (festejo) */
export function faldaFestejo() {
  const g = maniqui(new THREE.MeshStandardMaterial({ color: 0xf5eee0, roughness: 0.85 }));
  const perfil = [];
  for (let i = 0; i <= 24; i++) {
    const t = i / 24;
    perfil.push([0.135 + Math.pow(t, 1.5) * 0.62, 1.05 - t * 0.95]);
  }
  const geo = new THREE.LatheGeometry(perfil.map(([x, y]) => new THREE.Vector2(x, y)), 120);
  // Vuelos de la falda: ondas que crecen hacia el ruedo
  const p = geo.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i);
    const z = p.getZ(i);
    const y = p.getY(i);
    const t = (1.05 - y) / 0.95;
    const a = Math.atan2(x, z);
    const k = 1 + Math.sin(a * 14) * 0.07 * t;
    p.setXYZ(i, x * k, y + Math.sin(a * 5) * 0.03 * t, z * k);
  }
  geo.computeVertexNormals();
  const falda = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ map: T.bandas(), roughness: 0.8, side: THREE.DoubleSide }));
  g.add(falda);
  // Faja en la cintura
  const faja = new THREE.Mesh(new THREE.CylinderGeometry(0.145, 0.15, 0.08, 40), new THREE.MeshStandardMaterial({ color: 0xd9472b, roughness: 0.7 }));
  faja.scale.z = 0.8;
  faja.position.y = 1.08;
  g.add(faja);
  // Mangas abullonadas
  for (const s of [-1, 1]) {
    const manga = new THREE.Mesh(new THREE.SphereGeometry(0.075, 20, 14), new THREE.MeshStandardMaterial({ color: 0xf5eee0, roughness: 0.85 }));
    manga.position.set(s * 0.17, 1.47, 0);
    manga.scale.set(1, 0.8, 0.9);
    g.add(manga);
  }
  return sombras(g);
}

/** Maniquí con saco oscuro, camisa blanca y corbatín (vals) */
export function saco() {
  const g = maniqui(new THREE.MeshStandardMaterial({ color: 0xf4f1ea, roughness: 0.6 }));
  const pano = new THREE.MeshStandardMaterial({ color: 0x1b1d2a, roughness: 0.78, side: THREE.DoubleSide });
  const perfil = [
    [0.15, 0.82],
    [0.155, 0.95],
    [0.145, 1.12],
    [0.16, 1.25],
    [0.19, 1.38],
    [0.185, 1.47],
    [0.16, 1.54],
    [0.08, 1.585],
  ];
  const cuerpo = new THREE.Mesh(new THREE.LatheGeometry(perfil.map(([x, y]) => new THREE.Vector2(x, y)), 48, 0.42, Math.PI * 2 - 0.84), pano);
  cuerpo.scale.z = 0.8;
  g.add(cuerpo);
  // Solapas
  for (const s of [-1, 1]) {
    const f = new THREE.Shape();
    f.moveTo(0, 0);
    f.lineTo(s * 0.07, 0.24);
    f.lineTo(s * 0.11, 0.2);
    f.lineTo(s * 0.06, 0.34);
    f.lineTo(s * 0.03, 0.34);
    f.closePath();
    const solapa = new THREE.Mesh(new THREE.ExtrudeGeometry(f, { depth: 0.01, bevelEnabled: false }), new THREE.MeshStandardMaterial({ color: 0x0f1018, roughness: 0.45 }));
    solapa.position.set(s * 0.015, 1.2, 0.128);
    solapa.rotation.x = -0.12;
    g.add(solapa);
  }
  // Botones
  for (const y of [1.06, 1.15]) {
    const b = new THREE.Mesh(new THREE.SphereGeometry(0.011, 10, 8), NEGRO);
    b.position.set(0.035, y, 0.125);
    g.add(b);
  }
  // Corbatín
  for (const s of [-1, 1]) {
    const lazo = new THREE.Mesh(new THREE.ConeGeometry(0.03, 0.06, 12), NEGRO);
    lazo.rotation.z = (s * Math.PI) / 2;
    lazo.position.set(s * 0.03, 1.535, 0.1);
    g.add(lazo);
  }
  // Pañuelo de bolsillo
  const pan = caja(0.05, 0.03, 0.01, new THREE.MeshStandardMaterial({ color: 0x93171e, roughness: 0.7 }), -0.095, 1.37, 0.155);
  pan.rotation.y = -0.4;
  g.add(pan);
  return sombras(g);
}

/** Maniquí con chaleco de brocado y cadena de reloj (polka) */
export function chaleco() {
  const g = maniqui(new THREE.MeshStandardMaterial({ color: 0xf4f1ea, roughness: 0.6 }));
  const perfil = [
    [0.142, 0.98],
    [0.145, 1.1],
    [0.155, 1.25],
    [0.182, 1.38],
    [0.177, 1.46],
    [0.15, 1.52],
  ];
  const geo = new THREE.LatheGeometry(perfil.map(([x, y]) => new THREE.Vector2(x, y)), 48, 0.3, Math.PI * 2 - 0.6);
  const cuerpo = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ map: rep(T.brocado(), 3, 2), roughness: 0.55, side: THREE.DoubleSide }));
  cuerpo.scale.z = 0.8;
  g.add(cuerpo);
  for (let k = 0; k < 5; k++) {
    const b = new THREE.Mesh(new THREE.SphereGeometry(0.01, 10, 8), ORO);
    b.position.set(0.04, 1.06 + k * 0.08, 0.118);
    g.add(b);
  }
  // Cadena del reloj de bolsillo
  const cadena = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0.04, 1.22, 0.12),
    new THREE.Vector3(0.08, 1.16, 0.13),
    new THREE.Vector3(0.12, 1.19, 0.11),
  ]);
  g.add(new THREE.Mesh(new THREE.TubeGeometry(cadena, 20, 0.004, 6), ORO));
  // Corbata de lazo
  const corbata = caja(0.05, 0.1, 0.01, new THREE.MeshStandardMaterial({ color: 0x2b3f6b, roughness: 0.6 }), 0, 1.5, 0.11);
  g.add(corbata);
  return sombras(g);
}

/** Soporte en T con cintas de colores colgando (festejo) */
export function cintas() {
  const g = new THREE.Group();
  g.add(caja(0.04, 1.6, 0.04, MADERA, 0, 0.8, 0));
  g.add(caja(0.9, 0.05, 0.05, MADERA, 0, 1.6, 0));
  g.add(caja(0.4, 0.04, 0.4, MADERA, 0, 0.02, 0));
  const colores = [0xd9472b, 0xf2b233, 0x2f7a4a, 0xf7ecd6, 0xa24b78, 0x2b3f6b, 0xd9472b];
  colores.forEach((color, k) => {
    const x = -0.36 + k * 0.12;
    const largo = 0.75 + (k % 3) * 0.18;
    const geo = new THREE.PlaneGeometry(0.075, largo, 1, 24);
    const p = geo.attributes.position;
    for (let i = 0; i < p.count; i++) {
      const y = p.getY(i);
      const t = (largo / 2 - y) / largo;
      p.setZ(i, Math.sin(t * 5 + k) * 0.03 * t);
      p.setX(i, p.getX(i) + Math.sin(t * 3 + k * 2) * 0.02 * t);
    }
    geo.computeVertexNormals();
    const cinta = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ color, roughness: 0.55, side: THREE.DoubleSide }));
    cinta.position.set(x, 1.58 - largo / 2, 0.03);
    g.add(cinta);
  });
  // Faja enrollada en la cruz
  const faja = new THREE.Mesh(new THREE.TorusGeometry(0.1, 0.03, 12, 32), new THREE.MeshStandardMaterial({ color: 0xf2b233, roughness: 0.6 }));
  faja.position.set(0, 1.6, 0.02);
  g.add(faja);
  return sombras(g);
}

/** Máscara festiva de diablo para colgar (z+ al frente) */
export function mascara() {
  const g = new THREE.Group();
  g.add(caja(0.62, 0.78, 0.04, MADERA, 0, 0, -0.02));
  const cara = new THREE.Mesh(new THREE.SphereGeometry(0.2, 40, 30, 0, Math.PI * 2, 0, Math.PI / 2), new THREE.MeshStandardMaterial({ map: T.mascaraDiablo(), roughness: 0.5 }));
  cara.rotation.x = Math.PI / 2;
  cara.scale.set(1, 0.6, 1.35);
  cara.position.set(0, -0.02, 0.01);
  g.add(cara);
  for (const s of [-1, 1]) {
    const ojo = new THREE.Mesh(new THREE.CircleGeometry(0.035, 20), NEGRO);
    ojo.position.set(s * 0.075, 0.06, 0.112);
    ojo.scale.y = 0.7;
    g.add(ojo);
    const ceja = caja(0.09, 0.02, 0.02, new THREE.MeshStandardMaterial({ color: 0xf2b233, roughness: 0.4 }), s * 0.075, 0.11, 0.11);
    ceja.rotation.z = s * 0.35;
    g.add(ceja);
    const cuerno = new THREE.Mesh(
      new THREE.TubeGeometry(
        new THREE.CatmullRomCurve3([new THREE.Vector3(s * 0.1, 0.2, 0.02), new THREE.Vector3(s * 0.2, 0.3, 0.05), new THREE.Vector3(s * 0.19, 0.38, 0.08)]),
        16,
        0.025,
        10,
      ),
      new THREE.MeshStandardMaterial({ color: 0xf2e5c4, roughness: 0.4 }),
    );
    g.add(cuerno);
  }
  const boca = new THREE.Mesh(new THREE.TorusGeometry(0.06, 0.012, 8, 24, Math.PI), NEGRO);
  boca.rotation.z = Math.PI;
  boca.position.set(0, -0.08, 0.1);
  g.add(boca);
  for (let k = -2; k <= 2; k++) {
    const diente = new THREE.Mesh(new THREE.ConeGeometry(0.01, 0.03, 6), BLANCO);
    diente.rotation.z = Math.PI;
    diente.position.set(k * 0.022, -0.1, 0.1);
    g.add(diente);
  }
  return sombras(g);
}

/** Cajita afroperuana con la tapa abierta, correa y palillo */
export function cajita() {
  const g = new THREE.Group();
  const mad = matMadera('#7a4423', '#2e1406', 33, 0.45);
  g.add(caja(0.26, 0.16, 0.18, mad, 0, 0.08, 0));
  const tapa = caja(0.26, 0.015, 0.18, mad, 0, 0, 0.09);
  const bisagra = new THREE.Group();
  bisagra.position.set(0, 0.16, -0.09);
  bisagra.rotation.x = -1.9;
  tapa.position.set(0, 0, 0.09);
  bisagra.add(tapa);
  g.add(bisagra);
  // Correa de cuero
  const correa = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-0.13, 0.12, 0),
    new THREE.Vector3(-0.2, 0.05, 0.12),
    new THREE.Vector3(0, 0.0, 0.22),
    new THREE.Vector3(0.2, 0.05, 0.12),
    new THREE.Vector3(0.13, 0.12, 0),
  ]);
  g.add(new THREE.Mesh(new THREE.TubeGeometry(correa, 30, 0.008, 6), new THREE.MeshStandardMaterial({ color: 0x3a1a08, roughness: 0.7 })));
  const palillo = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.26, 8), MADERA_CLARA);
  palillo.rotation.z = Math.PI / 2 - 0.3;
  palillo.position.set(0.05, 0.015, 0.14);
  g.add(palillo);
  return sombras(g);
}

/** Sombrero de paja piurano */
export function sombrero() {
  const g = new THREE.Group();
  const paja = new THREE.MeshStandardMaterial({ map: rep(T.paja(), 4, 2), roughness: 0.8, side: THREE.DoubleSide });
  const ala = torneado(
    [
      [0.1, 0.0],
      [0.2, 0.004],
      [0.27, 0.012],
      [0.3, 0.028],
      [0.302, 0.034],
    ],
    paja,
    64,
  );
  const copa = torneado(
    [
      [0.105, 0.0],
      [0.112, 0.07],
      [0.108, 0.12],
      [0.09, 0.14],
      [0.04, 0.15],
      [0, 0.145],
    ],
    paja,
    64,
  );
  const cinta = new THREE.Mesh(new THREE.CylinderGeometry(0.113, 0.111, 0.035, 48, 1, true), new THREE.MeshStandardMaterial({ color: 0x2a1a10, roughness: 0.6 }));
  cinta.position.y = 0.025;
  g.add(ala, copa, cinta);
  return sombras(g);
}

/** Checo: mate burilado con boca superior */
export function checo() {
  const g = new THREE.Group();
  const perfil = [];
  for (let i = 0; i <= 30; i++) {
    const t = i / 30;
    const y = t * 0.36;
    const r = Math.sin(Math.PI * Math.min(1, t * 1.05)) * 0.19 * (1 - 0.25 * Math.max(0, t - 0.6)) + 0.03;
    perfil.push([Math.max(0.055, r), y]);
  }
  perfil[0][0] = 0.06;
  const mate = torneado(perfil, new THREE.MeshStandardMaterial({ map: T.pirograbado(), roughness: 0.55 }), 48);
  g.add(mate);
  const fondo = new THREE.Mesh(new THREE.CircleGeometry(0.065, 32), NEGRO);
  fondo.rotation.x = -Math.PI / 2;
  fondo.position.y = 0.355;
  g.add(fondo);
  // Rodete de tela
  const rodete = new THREE.Mesh(new THREE.TorusGeometry(0.1, 0.03, 12, 32), new THREE.MeshStandardMaterial({ color: 0xc23a2a, roughness: 0.85 }));
  rodete.rotation.x = Math.PI / 2;
  rodete.position.y = 0.02;
  g.add(rodete);
  mate.position.y = 0.02;
  return sombras(g);
}

/** Mesita con una tela caída (pañuelo de color, mantel) */
export function mesaTela(textura, { radio = 0.3, alto = 0.76, tam = 0.62, mat = MADERA } = {}) {
  const g = mesaRedonda(radio, alto, mat);
  const tela = new THREE.MeshStandardMaterial({ map: textura, side: THREE.DoubleSide, roughness: 0.85 });
  const geo = new THREE.PlaneGeometry(tam, tam, 48, 48);
  geo.rotateX(-Math.PI / 2);
  const p = geo.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i) + 0.12;
    const z = p.getZ(i) + 0.06;
    const d = Math.hypot(x, z);
    let y = 0.002 + Math.sin(x * 40) * Math.cos(z * 33) * 0.004;
    let fx = x;
    let fz = z;
    if (d > radio - 0.01) {
      const sobra = d - (radio - 0.01);
      const k = (radio - 0.01) / d;
      fx = x * k + (x / d) * Math.sin(Math.min(sobra * 6, 1.4)) * 0.02;
      fz = z * k + (z / d) * Math.sin(Math.min(sobra * 6, 1.4)) * 0.02;
      y = -sobra + Math.sin(Math.atan2(z, x) * 7) * 0.012;
    }
    p.setXYZ(i, fx, alto + 0.004 + y, fz);
  }
  geo.computeVertexNormals();
  const m = new THREE.Mesh(geo, tela);
  m.castShadow = m.receiveShadow = true;
  g.add(m);
  return g;
}

/** Canasta de mimbre con frutos de la cosecha */
export function canasta() {
  const g = new THREE.Group();
  const mimbre = new THREE.MeshStandardMaterial({ map: rep(T.mimbre(), 6, 2), roughness: 0.85, side: THREE.DoubleSide });
  g.add(
    torneado(
      [
        [0, 0.0],
        [0.2, 0.0],
        [0.24, 0.04],
        [0.29, 0.2],
        [0.3, 0.24],
      ],
      mimbre,
      48,
    ),
  );
  const borde = new THREE.Mesh(new THREE.TorusGeometry(0.3, 0.018, 10, 48), new THREE.MeshStandardMaterial({ color: 0x8a6030, roughness: 0.8 }));
  borde.rotation.x = Math.PI / 2;
  borde.position.y = 0.24;
  g.add(borde);
  const asa = new THREE.Mesh(new THREE.TorusGeometry(0.28, 0.016, 8, 40, Math.PI), new THREE.MeshStandardMaterial({ color: 0x8a6030, roughness: 0.8 }));
  asa.position.y = 0.24;
  g.add(asa);
  const r = T.azar(44);
  const frutos = [
    [0xf2a531, 0.06, 1.35],
    [0xe8c23a, 0.055, 1.3],
    [0x7da43a, 0.035, 1],
    [0xd9472b, 0.045, 1.1],
    [0xf5f2ea, 0.04, 1],
  ];
  for (let k = 0; k < 22; k++) {
    const [color, rad, alarg] = frutos[k % frutos.length];
    const f = new THREE.Mesh(new THREE.SphereGeometry(rad, 20, 14), new THREE.MeshStandardMaterial({ color, roughness: 0.45 }));
    const a = r() * Math.PI * 2;
    const d = Math.sqrt(r()) * 0.22;
    f.position.set(Math.cos(a) * d, 0.2 + r() * 0.08 + (0.22 - d) * 0.3, Math.sin(a) * d);
    f.scale.set(1, 1, alarg);
    f.rotation.y = r() * 3;
    g.add(f);
  }
  return sombras(g);
}

/** Guitarra criolla (de frente, z+), parada sobre su soporte */
export function guitarra(color = '#b8763c') {
  const g = new THREE.Group();
  const instrumento = new THREE.Group();
  const contorno = new THREE.Shape();
  const N = 64;
  for (let i = 0; i <= N; i++) {
    const a = (i / N) * Math.PI * 2;
    const y = Math.cos(a);
    // Dos lóbulos: abajo más ancho, cintura al medio
    const ancho = 0.185 * (1 - 0.32 * Math.exp(-Math.pow((y - 0.12) / 0.22, 2))) * (y < 0 ? 1 : 0.84);
    const x = Math.sin(a) * ancho;
    const yy = y * 0.245;
    if (i) contorno.lineTo(x, yy);
    else contorno.moveTo(x, yy);
  }
  const tapaMat = new THREE.MeshStandardMaterial({ map: rep(T.madera('#e0b072', '#a87035', 9), 1, 1), roughness: 0.35 });
  const aros = new THREE.MeshStandardMaterial({ map: rep(T.madera(color, '#3a1a08', 4), 1, 1), roughness: 0.35 });
  const cuerpo = new THREE.Mesh(new THREE.ExtrudeGeometry(contorno, { depth: 0.09, bevelEnabled: true, bevelThickness: 0.008, bevelSize: 0.006, bevelSegments: 3, curveSegments: 48 }), [tapaMat, aros]);
  cuerpo.position.z = -0.09;
  instrumento.add(cuerpo);
  const boca = new THREE.Mesh(new THREE.CircleGeometry(0.043, 32), NEGRO);
  boca.position.set(0, 0.07, 0.0085);
  instrumento.add(boca);
  const roseta = new THREE.Mesh(new THREE.RingGeometry(0.046, 0.058, 40), new THREE.MeshStandardMaterial({ color: 0x5a2a12, roughness: 0.5 }));
  roseta.position.set(0, 0.07, 0.0088);
  instrumento.add(roseta);
  const puente = caja(0.1, 0.018, 0.012, NEGRO, 0, -0.12, 0.012);
  instrumento.add(puente);
  const mastil = caja(0.052, 0.46, 0.025, MADERA, 0, 0.24 + 0.23, -0.004);
  instrumento.add(mastil);
  const diapason = caja(0.05, 0.44, 0.006, NEGRO, 0, 0.24 + 0.22, 0.011);
  instrumento.add(diapason);
  for (let k = 1; k < 14; k++) instrumento.add(caja(0.05, 0.003, 0.003, BRONCE, 0, 0.7 - k * 0.03 * (1 - k * 0.02), 0.015));
  const cabeza = caja(0.07, 0.17, 0.02, MADERA, 0, 0.78, -0.012);
  cabeza.rotation.x = -0.25;
  instrumento.add(cabeza);
  const cuerda = new THREE.MeshStandardMaterial({ color: 0xf2ead8, roughness: 0.3, metalness: 0.4 });
  for (let k = 0; k < 6; k++) {
    const x = -0.02 + k * 0.008;
    const c = new THREE.Mesh(new THREE.CylinderGeometry(0.0012, 0.0012, 0.82, 4), cuerda);
    c.position.set(x * (1.3 - 0.3), 0.29, 0.017);
    instrumento.add(c);
  }
  instrumento.position.y = 0.33;
  instrumento.rotation.x = -0.18;
  g.add(instrumento);
  // Soporte
  for (const s of [-1, 1]) {
    const pata = caja(0.025, 0.4, 0.025, NEGRO, s * 0.12, 0.2, 0.05);
    pata.rotation.z = s * 0.15;
    g.add(pata);
  }
  g.add(caja(0.3, 0.025, 0.12, NEGRO, 0, 0.1, 0.06));
  const trasera = caja(0.025, 0.7, 0.025, NEGRO, 0, 0.4, -0.12);
  trasera.rotation.x = -0.18;
  g.add(trasera);
  return sombras(g);
}

/** Mandolina con caja abombada, sobre soporte */
export function mandolina() {
  const g = new THREE.Group();
  const inst = new THREE.Group();
  const lomo = new THREE.Mesh(
    new THREE.SphereGeometry(0.15, 40, 24, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2),
    new THREE.MeshStandardMaterial({ map: rep(T.madera('#7a3a18', '#2a0e04', 6), 6, 1), roughness: 0.3 }),
  );
  // Media esfera hacia atrás (−z): la tapa queda mirando al frente
  lomo.rotation.x = Math.PI / 2;
  lomo.scale.set(0.82, 0.65, 1.15);
  inst.add(lomo);
  const tapa = new THREE.Mesh(new THREE.CircleGeometry(0.15, 48), new THREE.MeshStandardMaterial({ map: rep(T.madera('#e3b678', '#a87035', 12), 1, 1), roughness: 0.35 }));
  tapa.scale.set(0.82, 1.15, 1);
  tapa.position.z = 0.001;
  inst.add(tapa);
  const boca = new THREE.Mesh(new THREE.CircleGeometry(0.03, 24), NEGRO);
  boca.position.set(0, 0.04, 0.003);
  inst.add(boca);
  const golpeador = new THREE.Mesh(new THREE.CircleGeometry(0.04, 24, 0, Math.PI), new THREE.MeshStandardMaterial({ color: 0x2a1a10, roughness: 0.3 }));
  golpeador.position.set(0, -0.02, 0.002);
  golpeador.rotation.z = Math.PI;
  inst.add(golpeador);
  inst.add(caja(0.035, 0.26, 0.02, MADERA, 0, 0.29, 0.0));
  const cabeza = caja(0.06, 0.1, 0.018, MADERA, 0, 0.46, -0.004);
  inst.add(cabeza);
  for (let k = 0; k < 8; k++) {
    const c = new THREE.Mesh(new THREE.CylinderGeometry(0.001, 0.001, 0.5, 4), new THREE.MeshStandardMaterial({ color: 0xe8e4dc, metalness: 0.8, roughness: 0.3 }));
    c.position.set(-0.012 + Math.floor(k / 2) * 0.008 + (k % 2) * 0.002, 0.17, 0.012);
    inst.add(c);
  }
  inst.add(caja(0.06, 0.012, 0.008, NEGRO, 0, -0.07, 0.006));
  inst.position.y = 0.3;
  inst.rotation.x = -0.2;
  g.add(inst);
  for (const s of [-1, 1]) {
    const pata = caja(0.02, 0.3, 0.02, NEGRO, s * 0.09, 0.15, 0.04);
    pata.rotation.z = s * 0.15;
    g.add(pata);
  }
  g.add(caja(0.22, 0.02, 0.1, NEGRO, 0, 0.1, 0.05));
  const trasera = caja(0.02, 0.5, 0.02, NEGRO, 0, 0.3, -0.09);
  trasera.rotation.x = -0.2;
  g.add(trasera);
  return sombras(g);
}

/** Par de zapatos de baile de charol sobre cojín */
export function zapatos() {
  const g = new THREE.Group();
  const cojin = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.08, 0.38, 6, 2, 6), new THREE.MeshStandardMaterial({ color: 0xa24b78, roughness: 0.9 }));
  const p = cojin.geometry.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i);
    const z = p.getZ(i);
    if (p.getY(i) > 0) p.setY(i, 0.04 + 0.03 * Math.cos((x / 0.25) * 1.4) * Math.cos((z / 0.19) * 1.4));
  }
  cojin.geometry.computeVertexNormals();
  cojin.position.y = 0.04;
  g.add(cojin);
  const charol = new THREE.MeshStandardMaterial({ color: 0x0d0d0f, roughness: 0.12, metalness: 0.1 });
  for (const s of [-1, 1]) {
    const perfil = new THREE.Shape();
    perfil.moveTo(-0.13, 0);
    perfil.lineTo(0.12, 0);
    perfil.quadraticCurveTo(0.15, 0.0, 0.15, 0.03);
    perfil.quadraticCurveTo(0.14, 0.06, 0.06, 0.07);
    perfil.lineTo(-0.02, 0.085);
    perfil.lineTo(-0.11, 0.09);
    perfil.quadraticCurveTo(-0.14, 0.085, -0.135, 0.04);
    perfil.closePath();
    // Perfil del zapato hacia el visitante, uno delante del otro, con la punta en diagonal
    const zap = new THREE.Group();
    const z = new THREE.Mesh(new THREE.ExtrudeGeometry(perfil, { depth: 0.07, bevelEnabled: true, bevelThickness: 0.015, bevelSize: 0.015, bevelSegments: 4 }), charol);
    z.position.z = -0.035;
    zap.add(z);
    zap.add(caja(0.04, 0.035, 0.07, charol, -0.11, -0.0, 0));
    zap.add(caja(0.035, 0.015, 0.004, ORO, 0.04, 0.072, 0.052));
    zap.position.set(s * 0.04, 0.115, s * -0.085);
    zap.rotation.y = -0.5;
    g.add(zap);
  }
  return sombras(g);
}

/** Atril de partituras con hoja */
export function atril(textura) {
  const g = new THREE.Group();
  const metal = NEGRO;
  g.add(caja(0.02, 1.0, 0.02, metal, 0, 0.5, 0));
  for (let k = 0; k < 3; k++) {
    const a = (k / 3) * Math.PI * 2;
    const pata = caja(0.015, 0.015, 0.3, metal);
    pata.position.set(Math.sin(a) * 0.12, 0.05, Math.cos(a) * 0.12);
    pata.rotation.y = a;
    pata.rotation.x = 0.3;
    g.add(pata);
  }
  const bandeja = new THREE.Group();
  bandeja.position.set(0, 1.08, 0);
  bandeja.rotation.x = -0.35;
  bandeja.add(caja(0.5, 0.36, 0.01, metal, 0, 0, -0.006));
  bandeja.add(caja(0.5, 0.02, 0.04, metal, 0, -0.19, 0.015));
  const hoja = new THREE.Mesh(new THREE.PlaneGeometry(0.3, 0.4), new THREE.MeshStandardMaterial({ map: textura, roughness: 0.85 }));
  hoja.position.set(-0.08, 0.01, 0.004);
  hoja.rotation.z = 0.03;
  const hoja2 = hoja.clone();
  hoja2.position.x = 0.13;
  hoja2.rotation.z = -0.04;
  bandeja.add(hoja, hoja2);
  g.add(bandeja);
  return sombras(g);
}

/** Farol antiguo de mesa con vela encendida */
export function farolMesa() {
  const g = new THREE.Group();
  const metal = new THREE.MeshStandardMaterial({ color: 0x2a2620, roughness: 0.4, metalness: 0.8 });
  g.add(new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.13, 0.04, 6), metal));
  const vidrio = new THREE.Mesh(
    new THREE.CylinderGeometry(0.1, 0.1, 0.3, 6, 1, true),
    new THREE.MeshStandardMaterial({ color: 0xfff1d0, emissive: 0xffa94a, emissiveIntensity: 0.35, transparent: true, opacity: 0.35, side: THREE.DoubleSide, depthWrite: false }),
  );
  vidrio.position.y = 0.19;
  g.add(vidrio);
  for (let k = 0; k < 6; k++) {
    const a = (k / 6) * Math.PI * 2;
    g.add(caja(0.015, 0.31, 0.015, metal, Math.sin(a) * 0.1, 0.19, Math.cos(a) * 0.1));
  }
  const techo = new THREE.Mesh(new THREE.ConeGeometry(0.15, 0.13, 6), metal);
  techo.position.y = 0.41;
  g.add(techo);
  const aro = new THREE.Mesh(new THREE.TorusGeometry(0.04, 0.008, 8, 20), metal);
  aro.position.y = 0.5;
  g.add(aro);
  const v = vela(0.12, 0.022);
  v.position.y = 0.03;
  g.add(v);
  g.traverse((n) => n.isMesh && (n.castShadow = false));
  return g;
}

/** Tocadiscos de mueble con vinilo y carátulas */
export function tocadiscos() {
  const g = new THREE.Group();
  const mueble = matMadera('#5a2c12', '#1c0904', 41, 0.35);
  g.add(caja(0.7, 0.7, 0.45, mueble, 0, 0.42, 0));
  for (const s of [-1, 1]) g.add(pata(0.08, 0.03, mueble).translateX(s * 0.3).translateZ(0.17));
  for (const s of [-1, 1]) g.add(pata(0.08, 0.03, mueble).translateX(s * 0.3).translateZ(-0.17));
  g.add(caja(0.6, 0.5, 0.01, matMadera('#7a4422', '#2a1006', 43, 0.4), 0, 0.42, 0.226));
  const tela = caja(0.5, 0.25, 0.01, new THREE.MeshStandardMaterial({ color: 0x8a6a40, roughness: 0.95 }), 0, 0.46, 0.232);
  g.add(tela);
  const plato = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 0.015, 48), NEGRO);
  plato.position.set(-0.08, 0.785, 0);
  g.add(plato);
  const disco = new THREE.Mesh(new THREE.CircleGeometry(0.15, 64), new THREE.MeshStandardMaterial({ map: T.vinilo(), roughness: 0.25 }));
  disco.rotation.x = -Math.PI / 2;
  disco.position.set(-0.08, 0.794, 0);
  g.add(disco);
  const brazo = new THREE.CatmullRomCurve3([new THREE.Vector3(0.22, 0.81, -0.12), new THREE.Vector3(0.18, 0.81, 0.02), new THREE.Vector3(0.04, 0.81, 0.07)]);
  g.add(new THREE.Mesh(new THREE.TubeGeometry(brazo, 20, 0.008, 8), BRONCE));
  // Carátulas apoyadas al costado
  const colores = [0x93171e, 0x2b3f6b, 0xf2b233];
  colores.forEach((color, k) => {
    const sobre = caja(0.31, 0.31, 0.006, new THREE.MeshStandardMaterial({ color, roughness: 0.7 }), 0.52 + k * 0.012, 0.16, 0.05 - k * 0.03);
    sobre.rotation.z = -0.15 + k * 0.02;
    g.add(sobre);
  });
  return sombras(g);
}

/** Caballete con un cartel o invitación */
export function caballete(textura, ancho = 0.6, alto = 0.8) {
  const g = new THREE.Group();
  const mad = MADERA_CLARA;
  for (const s of [-1, 1]) {
    const pata = caja(0.035, 1.75, 0.035, mad, s * 0.25, 0.87, 0.05);
    pata.rotation.z = s * -0.1;
    pata.rotation.x = -0.12;
    g.add(pata);
  }
  const trasera = caja(0.035, 1.7, 0.035, mad, 0, 0.82, -0.3);
  trasera.rotation.x = 0.22;
  g.add(trasera);
  g.add(caja(0.66, 0.04, 0.08, mad, 0, 0.72, 0.13));
  const tabla = new THREE.Group();
  tabla.position.set(0, 0.74 + alto / 2, 0.1);
  tabla.rotation.x = -0.12;
  tabla.add(caja(ancho + 0.06, alto + 0.06, 0.02, ORO, 0, 0, -0.012));
  const lam = new THREE.Mesh(new THREE.PlaneGeometry(ancho, alto), new THREE.MeshStandardMaterial({ map: textura, roughness: 0.7 }));
  lam.position.z = 0.0;
  tabla.add(lam);
  g.add(tabla);
  return sombras(g);
}

/** Reloj de bolsillo abierto, con cadena, sobre cojín (cabe en una vitrina) */
export function relojBolsillo() {
  const g = new THREE.Group();
  const cojin = new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.18, 0.05, 40), new THREE.MeshStandardMaterial({ color: 0x2b3f6b, roughness: 0.9 }));
  cojin.position.y = 0.025;
  g.add(cojin);
  const reloj = new THREE.Group();
  reloj.position.set(0, 0.11, 0.0);
  reloj.rotation.x = -0.9;
  const cuerpo = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.075, 0.025, 48), ORO);
  cuerpo.rotation.x = Math.PI / 2;
  reloj.add(cuerpo);
  const cara = new THREE.Mesh(new THREE.CircleGeometry(0.066, 48), new THREE.MeshStandardMaterial({ map: T.esfera(), roughness: 0.35 }));
  cara.position.z = 0.0131;
  reloj.add(cara);
  const bisel = new THREE.Mesh(new THREE.TorusGeometry(0.07, 0.006, 8, 48), ORO);
  bisel.position.z = 0.013;
  reloj.add(bisel);
  const corona = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.02, 16), ORO);
  corona.position.set(0, 0.085, 0);
  reloj.add(corona);
  const argolla = new THREE.Mesh(new THREE.TorusGeometry(0.016, 0.004, 8, 20), ORO);
  argolla.position.set(0, 0.103, 0);
  reloj.add(argolla);
  // Tapa abierta
  const tapa = new THREE.Mesh(new THREE.CylinderGeometry(0.073, 0.073, 0.006, 48), ORO);
  tapa.rotation.x = Math.PI / 2;
  tapa.position.set(0, -0.075 - 0.07, -0.01);
  reloj.add(tapa);
  g.add(reloj);
  const cadena = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, 0.18, -0.06),
    new THREE.Vector3(0.08, 0.06, -0.12),
    new THREE.Vector3(0.14, 0.055, -0.02),
    new THREE.Vector3(0.1, 0.055, 0.1),
  ]);
  g.add(new THREE.Mesh(new THREE.TubeGeometry(cadena, 40, 0.004, 6), ORO));
  return sombras(g);
}

/** Banca rústica de madera */
export function banca(largo = 1.6, mat = MADERA_CLARA) {
  const g = new THREE.Group();
  g.add(caja(largo, 0.06, 0.38, mat, 0, 0.45, 0));
  for (const s of [-1, 1]) {
    g.add(caja(0.06, 0.45, 0.32, mat, s * (largo / 2 - 0.12), 0.225, 0));
  }
  g.add(caja(largo, 0.08, 0.04, mat, 0, 0.85, -0.17));
  for (const s of [-1, 1]) g.add(caja(0.05, 0.42, 0.04, mat, s * (largo / 2 - 0.12), 0.66, -0.17));
  return sombras(g);
}

/** Cántaro de barro */
export function cantaro(escala = 1, color = 0xa5532e) {
  const m = torneado(
    [
      [0, 0],
      [0.1, 0],
      [0.17, 0.08],
      [0.2, 0.2],
      [0.18, 0.33],
      [0.1, 0.42],
      [0.075, 0.46],
      [0.09, 0.5],
      [0.07, 0.5],
    ],
    new THREE.MeshStandardMaterial({ color, roughness: 0.85, side: THREE.DoubleSide }),
    32,
  );
  m.scale.setScalar(escala);
  return sombras(m);
}

/** Hamaca colgada entre dos puntos (locales, con y) */
export function hamaca(a, b, caida = 0.55) {
  const g = new THREE.Group();
  const tela = new THREE.MeshStandardMaterial({ map: T.bandas(['#d9472b', '#f2b233', '#2f7a4a', '#f7ecd6', '#2b3f6b'], 14), side: THREE.DoubleSide, roughness: 0.9 });
  const largo = a.distanceTo(b);
  const geo = new THREE.PlaneGeometry(largo * 0.72, 0.9, 40, 10);
  const p = geo.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i);
    const y = p.getY(i);
    const t = x / (largo * 0.36);
    const hund = caida * (1 - t * t);
    const cierre = 1 - 0.65 * t * t;
    p.setXYZ(i, x, -hund - Math.abs(y) * 0.2 * (1 - t * t), y * cierre);
  }
  geo.computeVertexNormals();
  const tela3 = new THREE.Mesh(geo, tela);
  const medio = a.clone().lerp(b, 0.5);
  tela3.position.copy(medio);
  tela3.rotation.y = -Math.atan2(b.z - a.z, b.x - a.x);
  g.add(tela3);
  const soga = new THREE.MeshStandardMaterial({ color: 0xd8c89a, roughness: 0.9 });
  for (const [desde, s] of [
    [a, -1],
    [b, 1],
  ]) {
    const fin = medio.clone().add(b.clone().sub(a).normalize().multiplyScalar(s * largo * 0.36));
    const c = new THREE.LineCurve3(desde, fin.clone().setY(medio.y));
    g.add(new THREE.Mesh(new THREE.TubeGeometry(c, 4, 0.012, 6), soga));
  }
  return sombras(g);
}

/** Farola de calle con luz (para ver por el balcón) */
export function farola(alto = 3.2) {
  const g = new THREE.Group();
  const metal = new THREE.MeshStandardMaterial({ color: 0x15171c, roughness: 0.5, metalness: 0.7 });
  g.add(torneado([[0, 0], [0.12, 0], [0.1, 0.3], [0.05, 0.4], [0.045, alto - 0.3], [0.06, alto - 0.25], [0, alto - 0.25]], metal, 16));
  const cuerpo = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.1, 0.42, 6), new THREE.MeshBasicMaterial({ color: new THREE.Color(3.2, 2.2, 1.0) }));
  cuerpo.position.y = alto;
  g.add(cuerpo);
  const techo = new THREE.Mesh(new THREE.ConeGeometry(0.22, 0.18, 6), metal);
  techo.position.y = alto + 0.3;
  g.add(techo);
  return g;
}
