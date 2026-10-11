import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/examples/jsm/libs/meshopt_decoder.module.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { OutlinePass } from 'three/examples/jsm/postprocessing/OutlinePass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';
import { piezas, type Pieza } from './piezas';
import * as tex from './texturas';

const ANCHO = 7;
const FONDO = 9;
const ALTO = 5;
const ZOCALO = 0.15;
const RUTA = '/museo';

const VISTA_GENERAL = {
  pos: new THREE.Vector3(0, 1.75, 3.9),
  mira: new THREE.Vector3(0, 1.25, -1.4),
};
// En pantallas verticales la cámara retrocede y sube para que entre toda la sala
const VISTA_VERTICAL = {
  pos: new THREE.Vector3(0, 2.45, 4.25),
  mira: new THREE.Vector3(0, 0.75, -1.2),
};
const VISTA_ENTRADA = new THREE.Vector3(0, 2.3, 7.5);

export interface Opciones {
  lienzo: HTMLCanvasElement;
  contenedor: HTMLElement;
  movimientoReducido: boolean;
  alProgreso: (fraccion: number) => void;
  alPasarSobre: (pieza: Pieza | null) => void;
  alElegir: (pieza: Pieza) => void;
}

interface Montada {
  pieza: Pieza;
  grupo: THREE.Group;
  /** Lo que se resalta con el contorno blanco */
  objeto: THREE.Object3D;
  centro: THREE.Vector3;
  ancla: THREE.Vector3;
  foco: THREE.SpotLight;
  potencia: number;
}

export async function crearSala(o: Opciones) {
  // Modo liviano para pantallas táctiles: sin mouse no hay contorno al pasar, y la GPU del celular agradece
  const liviano = matchMedia('(hover: none)').matches;
  const renderer = new THREE.WebGLRenderer({ canvas: o.lienzo, antialias: liviano, powerPreference: 'high-performance' });
  let nitidez = Math.min(window.devicePixelRatio, liviano ? 1.5 : 1.75);
  renderer.setPixelRatio(nitidez);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;

  const escena = new THREE.Scene();
  escena.background = new THREE.Color(0x140a06);
  escena.fog = new THREE.Fog(0x140a06, 12, 22);
  const pmrem = new THREE.PMREMGenerator(renderer);
  escena.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  escena.environmentIntensity = 0.35;

  const camara = new THREE.PerspectiveCamera(55, 1, 0.05, 40);
  camara.position.copy(VISTA_ENTRADA);

  const controles = new OrbitControls(camara, o.lienzo);
  controles.enableDamping = true;
  controles.dampingFactor = 0.08;
  controles.enablePan = false;
  controles.rotateSpeed = 0.55;
  controles.zoomSpeed = 0.7;
  controles.target.copy(VISTA_GENERAL.mira);
  controles.enabled = false;

  // Postproceso: contorno blanco al pasar el mouse, como en el boceto (solo con mouse)
  let composer: EffectComposer | null = null;
  let contorno: OutlinePass | null = null;
  if (!liviano) {
    const destino = new THREE.WebGLRenderTarget(512, 512, { samples: 4, type: THREE.HalfFloatType });
    composer = new EffectComposer(renderer, destino);
    composer.addPass(new RenderPass(escena, camara));
    // Tamaño inicial real: con 1×1 sus búferes reducidos quedan en 0 px y WebGL se queja
    contorno = new OutlinePass(new THREE.Vector2(512, 512), escena, camara);
    contorno.visibleEdgeColor.set(0xffffff);
    contorno.hiddenEdgeColor.set(0xffe6b0);
    contorno.edgeStrength = 5;
    contorno.edgeThickness = 1.6;
    contorno.edgeGlow = 0.4;
    composer.addPass(contorno);
    composer.addPass(new OutputPass());
  }

  // ---------- Sala ----------
  const cargador = new THREE.LoadingManager();
  const texLoader = new THREE.TextureLoader(cargador);
  const cargarTex = (nombre: string) => {
    const t = texLoader.load(`${RUTA}/texturas/${nombre}`);
    t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = renderer.capabilities.getMaxAnisotropy();
    return t;
  };

  const pergamino = tex.pergamino();
  const matPared = new THREE.MeshStandardMaterial({ map: pergamino, roughness: 0.95 });

  const plano = (w: number, h: number, mat: THREE.Material) => new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat);

  // Paredes lisas (detrás de los murales)
  // ancho, x, z, giro (todas miran hacia adentro)
  const paredes: [number, number, number, number][] = [
    [ANCHO, 0, -FONDO / 2, 0],
    [ANCHO, 0, FONDO / 2, Math.PI],
    [FONDO, -ANCHO / 2, 0, Math.PI / 2],
    [FONDO, ANCHO / 2, 0, -Math.PI / 2],
  ];
  for (const [w, x, z, giro] of paredes) {
    const m = plano(w, ALTO, matPared);
    m.position.set(x, ALTO / 2, z);
    m.rotation.y = giro;
    escena.add(m);
    // Zócalo de madera
    const zocalo = new THREE.Mesh(new THREE.BoxGeometry(w, ZOCALO, 0.04), tex.matMaderaOscura());
    zocalo.position.set(x, ZOCALO / 2, z);
    zocalo.rotation.y = giro;
    zocalo.translateZ(0.02);
    escena.add(zocalo);
  }

  // Murales sacados del boceto (rectificados)
  const altoMural = ALTO - ZOCALO;
  const mural = (nombre: string, proporcion: number, x: number, z: number, giro: number, desplazar = 0) => {
    const w = altoMural * proporcion;
    const mat = new THREE.MeshStandardMaterial({ map: cargarTex(nombre), roughness: 0.9 });
    mat.emissive.set(0xffffff);
    mat.emissiveMap = mat.map;
    mat.emissiveIntensity = 0.32;
    const m = plano(w, altoMural, mat);
    m.position.set(x, ZOCALO + altoMural / 2, z);
    m.rotation.y = giro;
    m.translateZ(0.005);
    m.translateX(desplazar);
    escena.add(m);
    return w;
  };
  mural('pared-fondo.webp', 1200 / 935, 0, -FONDO / 2, 0);
  const anchoLado = altoMural * (1100 / 935);
  // Los laterales arrancan en la esquina del fondo
  mural('pared-izquierda.webp', 1100 / 935, -ANCHO / 2, -FONDO / 2 + anchoLado / 2, Math.PI / 2);
  mural('pared-derecha.webp', 1100 / 935, ANCHO / 2, -FONDO / 2 + anchoLado / 2, -Math.PI / 2);

  // Piso de madera y alfombra
  const piso = plano(ANCHO, FONDO, new THREE.MeshStandardMaterial({ map: tex.piso(ANCHO, FONDO), roughness: 0.55, metalness: 0 }));
  piso.rotation.x = -Math.PI / 2;
  escena.add(piso);
  const alfombra = plano(1.5, 5.2, new THREE.MeshStandardMaterial({ map: tex.alfombra(), roughness: 1 }));
  alfombra.rotation.x = -Math.PI / 2;
  alfombra.position.set(0, 0.004, 1.8);
  escena.add(alfombra);

  // Techo con cornisa
  const techo = plano(ANCHO, FONDO, new THREE.MeshStandardMaterial({ color: 0x2a160d, roughness: 1 }));
  techo.rotation.x = Math.PI / 2;
  techo.position.y = ALTO;
  escena.add(techo);
  const cornisaMat = tex.matMaderaOscura();
  for (const [w, x, z, giro] of paredes) {
    const c = new THREE.Mesh(new THREE.BoxGeometry(w, 0.22, 0.12), cornisaMat);
    c.position.set(x, ALTO - 0.11, z);
    c.rotation.y = giro;
    c.translateZ(0.06);
    escena.add(c);
  }

  // Letrero de bienvenida en la pared izquierda, cerca de la entrada
  const logo = cargarTex('logo-mi-museo-criollo.webp');
  const letrero = plano(2.3, 2.3 * (367 / 1073), new THREE.MeshStandardMaterial({ map: logo, transparent: true, roughness: 0.8 }));
  letrero.position.set(-ANCHO / 2 + 0.01, 2.6, 2.9);
  letrero.rotation.y = Math.PI / 2;
  escena.add(letrero);

  // Luz general cálida y tenue: el protagonismo es de los focos
  const hemi = new THREE.HemisphereLight(0xffe7c4, 0x3b2112, 0.0);
  escena.add(hemi);
  const relleno = new THREE.PointLight(0xffd8a0, 0, 14, 1.6);
  relleno.position.set(0, 4.2, 0.5);
  escena.add(relleno);

  // ---------- Piezas ----------
  const gltf = new GLTFLoader(cargador).setMeshoptDecoder(MeshoptDecoder);
  const montadas: Montada[] = [];
  const conos: THREE.Mesh[] = [];
  const seleccionables: THREE.Object3D[] = [];

  const sombra = tex.sombra();
  const matSombra = new THREE.MeshBasicMaterial({ map: sombra, transparent: true, depthWrite: false, opacity: 0.75 });

  const promesas = piezas.map(async (p) => {
    const grupo = new THREE.Group();
    grupo.position.set(p.x, 0, p.z);
    grupo.rotation.y = THREE.MathUtils.degToRad(p.giro);
    escena.add(grupo);

    const base = construirBase(p, grupo);
    let objeto: THREE.Object3D;

    if (p.base === 'pared') {
      objeto = construirCuadro(p, grupo, cargarTex(p.archivo));
    } else {
      const g = await gltf.loadAsync(`${RUTA}/modelos/${p.archivo}`);
      const modelo = g.scene;
      modelo.traverse((n) => {
        const m = n as THREE.Mesh;
        if (m.isMesh) {
          const mat = m.material as THREE.MeshStandardMaterial;
          mat.metalness = 0;
          mat.envMapIntensity = 0.6;
          if (mat.map) mat.map.anisotropy = 4;
        }
      });
      if (p.giroModelo) modelo.rotation.y = THREE.MathUtils.degToRad(p.giroModelo);
      const envoltura = new THREE.Group();
      envoltura.add(modelo);
      const caja = new THREE.Box3().setFromObject(envoltura);
      const tam = caja.getSize(new THREE.Vector3());
      const escala = p.tam / (p.medida === 'ancho' ? Math.max(tam.x, tam.z) : tam.y);
      envoltura.scale.setScalar(escala);
      caja.setFromObject(envoltura);
      const c = caja.getCenter(new THREE.Vector3());
      envoltura.position.set(-c.x, base.alto - caja.min.y, -c.z);
      grupo.add(envoltura);
      objeto = envoltura;

      // Sombra suave del objeto sobre su base
      const s = Math.max(tam.x, tam.z) * escala * 1.1;
      const manchita = new THREE.Mesh(new THREE.PlaneGeometry(s, s), matSombra);
      manchita.rotation.x = -Math.PI / 2;
      manchita.position.y = base.alto + 0.003;
      grupo.add(manchita);
    }

    objeto.traverse((n) => (n.userData.pieza = p.id));
    base.cuerpo.traverse((n) => (n.userData.pieza = p.id));
    seleccionables.push(objeto, base.cuerpo);

    grupo.updateMatrixWorld(true);
    const caja = new THREE.Box3().setFromObject(objeto);
    const centro = caja.getCenter(new THREE.Vector3());
    const ancla = new THREE.Vector3(centro.x, caja.max.y + 0.22, centro.z);

    // Foco cenital dedicado
    const potencia = p.base === 'pared' ? 28 : 46;
    const foco = new THREE.SpotLight(0xffd6a0, 0, 0, p.base === 'pared' ? 0.42 : 0.36, 0.55, 2);
    const desde = p.base === 'pared' ? new THREE.Vector3(centro.x - 1.6, ALTO - 0.05, centro.z) : new THREE.Vector3(centro.x, ALTO - 0.05, centro.z + 0.55);
    foco.position.copy(desde);
    foco.target.position.copy(centro);
    escena.add(foco, foco.target);
    escena.add(lampara(desde));
    if (p.base !== 'pared' && !liviano) conos.push(conoDeLuz(desde, new THREE.Vector3(centro.x, 0, centro.z)));

    montadas.push({ pieza: p, grupo, objeto, centro, ancla, foco, potencia });
  });

  function lampara(pos: THREE.Vector3) {
    const g = new THREE.Group();
    const aro = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.11, 0.05, 24), new THREE.MeshStandardMaterial({ color: 0x1a0f09, metalness: 0.6, roughness: 0.4 }));
    const luz = new THREE.Mesh(new THREE.CircleGeometry(0.075, 24), new THREE.MeshBasicMaterial({ color: 0xfff1d6 }));
    luz.rotation.x = Math.PI / 2;
    luz.position.y = -0.026;
    g.add(aro, luz);
    g.position.copy(pos).setY(ALTO - 0.025);
    return g;
  }

  function conoDeLuz(arriba: THREE.Vector3, abajo: THREE.Vector3) {
    const largo = arriba.distanceTo(abajo);
    const geo = new THREE.CylinderGeometry(0.07, 0.95, largo, 40, 1, true);
    const mat = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
      uniforms: { intensidad: { value: 0 }, color: { value: new THREE.Color(0xffd9a3) } },
      vertexShader: /* glsl */ `
        varying float vAltura; varying vec3 vNormal; varying vec3 vVista;
        void main() {
          vAltura = uv.y;
          vec4 mv = modelViewMatrix * vec4(position, 1.0);
          vNormal = normalize(normalMatrix * normal);
          vVista = normalize(-mv.xyz);
          gl_Position = projectionMatrix * mv;
        }`,
      fragmentShader: /* glsl */ `
        uniform float intensidad; uniform vec3 color;
        varying float vAltura; varying vec3 vNormal; varying vec3 vVista;
        void main() {
          float borde = pow(abs(dot(vNormal, vVista)), 2.0);
          float caida = smoothstep(0.0, 0.85, vAltura) * (0.35 + 0.65 * vAltura);
          gl_FragColor = vec4(color, 1.0) * borde * caida * intensidad * 0.11;
        }`,
    });
    const cono = new THREE.Mesh(geo, mat);
    cono.position.copy(arriba).lerp(abajo, 0.5);
    cono.lookAt(abajo);
    // La punta angosta del cilindro (+y) queda arriba, junto a la lámpara
    cono.rotateX(-Math.PI / 2);
    cono.raycast = () => {};
    escena.add(cono);
    return cono;
  }

  function placa(p: Pieza, ancho: number) {
    const t = tex.placa(p.titulo, p.subtitulo);
    const m = new THREE.Mesh(
      new THREE.BoxGeometry(ancho, ancho * 0.3, 0.012),
      [0, 0, 0, 0, 1, 0].map((i) =>
        i
          ? new THREE.MeshStandardMaterial({ map: t, metalness: 0.75, roughness: 0.32 })
          : new THREE.MeshStandardMaterial({ color: 0xb8892d, metalness: 0.85, roughness: 0.3 }),
      ),
    );
    return m;
  }

  function construirBase(p: Pieza, grupo: THREE.Group) {
    const cuerpo = new THREE.Group();
    grupo.add(cuerpo);
    const madera = tex.matMadera();
    const caja = (w: number, h: number, d: number, y: number, mat: THREE.Material = madera) => {
      const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
      m.position.y = y;
      cuerpo.add(m);
      return m;
    };
    const vidrio = (w: number, h: number, d: number, y: number) => {
      const mat = new THREE.MeshPhysicalMaterial({
        color: 0xffffff,
        roughness: 0.04,
        metalness: 0,
        transparent: true,
        opacity: 0.1,
        envMapIntensity: 1.6,
        depthWrite: false,
      });
      const v = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
      v.position.y = y + h / 2;
      v.renderOrder = 2;
      v.raycast = () => {};
      grupo.add(v);
      // Aristas de bronce
      const bronce = new THREE.MeshStandardMaterial({ color: 0xc89b45, metalness: 0.85, roughness: 0.3 });
      const t = 0.018;
      for (const sx of [-1, 1])
        for (const sz of [-1, 1]) {
          const a = new THREE.Mesh(new THREE.BoxGeometry(t, h, t), bronce);
          a.position.set((sx * w) / 2, y + h / 2, (sz * d) / 2);
          grupo.add(a);
        }
      for (const [bw, bd, x, z] of [
        [w + 0.03, t * 1.6, 0, d / 2],
        [w + 0.03, t * 1.6, 0, -d / 2],
        [t * 1.6, d + 0.03, w / 2, 0],
        [t * 1.6, d + 0.03, -w / 2, 0],
      ]) {
        const marco = new THREE.Mesh(new THREE.BoxGeometry(bw, 0.03, bd), bronce);
        marco.position.set(x, y + h, z);
        grupo.add(marco);
      }
    };
    const ponerPlaca = (ancho: number, y: number, z: number, inclinada = false) => {
      const pl = placa(p, ancho);
      pl.position.set(0, y, z + 0.008);
      if (inclinada) pl.rotation.x = -0.35;
      cuerpo.add(pl);
    };
    const sombraPiso = (s: number) => {
      const m = new THREE.Mesh(new THREE.PlaneGeometry(s, s), matSombra);
      m.rotation.x = -Math.PI / 2;
      m.position.y = 0.006;
      grupo.add(m);
    };

    let alto = 0;
    switch (p.base) {
      case 'vitrina-alta': {
        caja(1.15, 0.36, 0.92, 0.18);
        caja(1.19, 0.03, 0.96, 0.375, tex.matMaderaOscura());
        alto = 0.39;
        vidrio(1.08, 1.95, 0.86, alto);
        ponerPlaca(0.62, 0.2, 0.46);
        sombraPiso(2.0);
        break;
      }
      case 'vitrina-baja': {
        caja(0.74, 0.98, 0.62, 0.49);
        caja(0.8, 0.04, 0.68, 1.0, tex.matMaderaOscura());
        caja(0.66, 0.05, 0.54, 1.045, new THREE.MeshStandardMaterial({ color: 0x7a0f16, roughness: 0.95 }));
        alto = 1.07;
        vidrio(0.7, 0.6, 0.58, 1.02);
        ponerPlaca(0.44, 0.72, 0.31, true);
        sombraPiso(1.3);
        break;
      }
      case 'columna': {
        caja(0.66, 0.12, 0.66, 0.06, tex.matMaderaOscura());
        caja(0.5, 1.14, 0.5, 0.69);
        caja(0.62, 0.07, 0.62, 1.295, tex.matMaderaOscura());
        alto = 1.33;
        ponerPlaca(0.34, 1.02, 0.25);
        sombraPiso(1.2);
        break;
      }
      case 'plinto': {
        caja(1.0, 0.34, 0.82, 0.17);
        caja(1.04, 0.03, 0.86, 0.345, tex.matMaderaOscura());
        alto = 0.36;
        ponerPlaca(0.56, 0.17, 0.41);
        sombraPiso(1.8);
        break;
      }
      case 'plinto-redondo': {
        const c = new THREE.Mesh(new THREE.CylinderGeometry(0.78, 0.82, 0.32, 48), madera);
        c.position.y = 0.16;
        cuerpo.add(c);
        const t = new THREE.Mesh(new THREE.CylinderGeometry(0.72, 0.76, 0.05, 48), tex.matMaderaOscura());
        t.position.y = 0.345;
        cuerpo.add(t);
        alto = 0.37;
        ponerPlaca(0.6, 0.16, 0.79);
        sombraPiso(2.2);
        break;
      }
      case 'pedestal': {
        caja(0.82, 0.86, 0.56, 0.43, tex.matMaderaOscura());
        caja(0.88, 0.04, 0.62, 0.88, tex.matMadera());
        alto = 0.9;
        ponerPlaca(0.48, 0.6, 0.28);
        sombraPiso(1.4);
        break;
      }
      case 'pared':
        alto = 0;
        break;
    }
    return { cuerpo, alto };
  }

  function construirCuadro(p: Pieza, grupo: THREE.Group, imagen: THREE.Texture) {
    const w = p.tam;
    const h = w * (782 / 1200);
    const cuadro = new THREE.Group();
    const lienzo = plano(w, h, new THREE.MeshStandardMaterial({ map: imagen, roughness: 0.85 }));
    lienzo.position.z = 0.035;
    cuadro.add(lienzo);
    const oro = new THREE.MeshStandardMaterial({ color: 0xb98a37, metalness: 0.9, roughness: 0.32 });
    const m = 0.11;
    const lado = (bw: number, bh: number, x: number, y: number) => {
      const b = new THREE.Mesh(new THREE.BoxGeometry(bw, bh, 0.09), oro);
      b.position.set(x, y, 0.04);
      cuadro.add(b);
    };
    lado(w + 2 * m, m, 0, h / 2 + m / 2);
    lado(w + 2 * m, m, 0, -h / 2 - m / 2);
    lado(m, h, -w / 2 - m / 2, 0);
    lado(m, h, w / 2 + m / 2, 0);
    cuadro.position.y = 2.6;
    grupo.add(cuadro);
    const pl = placa(p, 0.5);
    pl.position.set(0, 2.6 - h / 2 - 0.3, 0.01);
    grupo.add(pl);
    return cuadro;
  }

  // ---------- Polvo flotando en la luz ----------
  const N = liviano ? 150 : 420;
  const posiciones = new Float32Array(N * 3);
  const fases = new Float32Array(N);
  for (let i = 0; i < N; i++) {
    posiciones[i * 3] = (Math.random() - 0.5) * (ANCHO - 0.6);
    posiciones[i * 3 + 1] = Math.random() * (ALTO - 0.4) + 0.2;
    posiciones[i * 3 + 2] = (Math.random() - 0.5) * (FONDO - 1) - 0.4;
    fases[i] = Math.random() * Math.PI * 2;
  }
  const geoPolvo = new THREE.BufferGeometry();
  geoPolvo.setAttribute('position', new THREE.BufferAttribute(posiciones, 3));
  const matPolvo = new THREE.PointsMaterial({
    size: 0.022,
    map: tex.punto(),
    color: 0xffe4b8,
    transparent: true,
    opacity: 0,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
  const polvo = new THREE.Points(geoPolvo, matPolvo);
  polvo.raycast = () => {};
  escena.add(polvo);

  // ---------- Carga ----------
  cargador.onProgress = (_u, hechos, total) => o.alProgreso(hechos / total);
  await Promise.all(promesas);
  o.alProgreso(1);
  montadas.sort((a, b) => piezas.indexOf(a.pieza) - piezas.indexOf(b.pieza));

  // ---------- Interacción ----------
  const rayo = new THREE.Raycaster();
  const puntero = new THREE.Vector2();
  let sobre: Montada | null = null;
  let enFoco: Montada | null = null;
  let viaje: { desde: THREE.Vector3; hasta: THREE.Vector3; mDesde: THREE.Vector3; mHasta: THREE.Vector3; t0: number; dur: number; fin?: () => void } | null = null;

  const buscar = (x: number, y: number) => {
    const r = o.lienzo.getBoundingClientRect();
    puntero.set(((x - r.left) / r.width) * 2 - 1, -((y - r.top) / r.height) * 2 + 1);
    rayo.setFromCamera(puntero, camara);
    const hit = rayo.intersectObjects(seleccionables, true)[0];
    const id = hit?.object.userData.pieza as string | undefined;
    return id ? (montadas.find((m) => m.pieza.id === id) ?? null) : null;
  };

  const resaltar = (m: Montada | null) => {
    if (m === sobre) return;
    sobre = m;
    if (contorno) contorno.selectedObjects = m ? [m.objeto] : [];
    o.lienzo.style.cursor = m ? 'pointer' : '';
    o.alPasarSobre(m?.pieza ?? null);
  };

  o.lienzo.addEventListener('pointermove', (e) => {
    if (e.pointerType !== 'mouse' || viaje || !controles.enabled) return;
    resaltar(buscar(e.clientX, e.clientY));
  });
  o.lienzo.addEventListener('pointerleave', () => resaltar(null));

  // Un toque o clic sin arrastrar elige la pieza
  let inicio = { x: 0, y: 0, t: 0 };
  o.lienzo.addEventListener('pointerdown', (e) => (inicio = { x: e.clientX, y: e.clientY, t: performance.now() }));
  o.lienzo.addEventListener('pointerup', (e) => {
    if (!controles.enabled || viaje) return;
    const movido = Math.hypot(e.clientX - inicio.x, e.clientY - inicio.y);
    if (movido > 6 || performance.now() - inicio.t > 500) return;
    const m = buscar(e.clientX, e.clientY);
    if (m) o.alElegir(m.pieza);
  });

  const suave = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

  function viajar(pos: THREE.Vector3, mira: THREE.Vector3, dur: number, fin?: () => void) {
    controles.enabled = false;
    if (o.movimientoReducido) dur = 0;
    viaje = { desde: camara.position.clone(), hasta: pos.clone(), mDesde: controles.target.clone(), mHasta: mira.clone(), t0: performance.now(), dur, fin };
  }

  function limitesGenerales() {
    controles.minDistance = 2.2;
    controles.maxDistance = 6.4;
    controles.minAzimuthAngle = -0.85;
    controles.maxAzimuthAngle = 0.85;
    controles.minPolarAngle = 1.0;
    controles.maxPolarAngle = 1.66;
    controles.autoRotate = false;
  }

  function limitesFoco(m: Montada) {
    const g = THREE.MathUtils.degToRad(m.pieza.giro);
    const pared = m.pieza.base === 'pared';
    controles.minDistance = m.pieza.dist * 0.5;
    controles.maxDistance = m.pieza.dist * 1.35;
    controles.minAzimuthAngle = g - (pared ? 0.6 : 1.25);
    controles.maxAzimuthAngle = g + (pared ? 0.6 : 1.25);
    controles.minPolarAngle = 0.55;
    controles.maxPolarAngle = 1.72;
    controles.autoRotate = !o.movimientoReducido && !pared;
    controles.autoRotateSpeed = 0.6;
  }
  controles.addEventListener('start', () => (controles.autoRotate = false));

  function enfocar(id: string) {
    const m = montadas.find((x) => x.pieza.id === id);
    if (!m) return;
    enFoco = m;
    resaltar(null);
    const g = THREE.MathUtils.degToRad(m.pieza.giro);
    const pos = m.centro.clone().add(new THREE.Vector3(Math.sin(g), 0, Math.cos(g)).multiplyScalar(m.pieza.dist));
    pos.y = m.centro.y + m.pieza.dist * 0.16;
    viajar(pos, m.centro, 1300, () => limitesFoco(m));
  }

  function vistaGeneral(dur = 1200) {
    enFoco = null;
    const v = camara.aspect < 1 ? VISTA_VERTICAL : VISTA_GENERAL;
    viajar(v.pos, v.mira, dur, limitesGenerales);
  }

  // Encendido de la sala: los focos se prenden uno por uno
  let encendido = -1;
  function entrar() {
    encendido = performance.now();
    vistaGeneral(o.movimientoReducido ? 0 : 3400);
  }

  // Proyección de los marcadores HTML
  const v = new THREE.Vector3();
  function proyectar(id: string) {
    const m = montadas.find((x) => x.pieza.id === id);
    if (!m) return null;
    v.copy(m.ancla).project(camara);
    const delante = v.z < 1;
    return { x: (v.x * 0.5 + 0.5) * ancho, y: (-v.y * 0.5 + 0.5) * alto, visible: delante };
  }

  // Corre el encuadre para que la pieza no quede debajo de la ficha
  const desfase = { x: 0, y: 0, ox: 0, oy: 0 };
  function desplazar(x: number, y: number) {
    desfase.ox = x;
    desfase.oy = y;
  }

  // ---------- Bucle ----------
  let ancho = 1;
  let alto = 1;
  const redimensionar = () => {
    if (!o.contenedor.clientWidth || !o.contenedor.clientHeight) return;
    ancho = o.contenedor.clientWidth;
    alto = o.contenedor.clientHeight;
    camara.aspect = ancho / alto;
    // En vertical se fija el ángulo horizontal (~74°) para que entre la sala de lado a lado
    const vertical = THREE.MathUtils.radToDeg(2 * Math.atan(Math.tan(THREE.MathUtils.degToRad(37)) / camara.aspect));
    camara.fov = camara.aspect < 1 ? Math.min(vertical, 100) : 55;
    camara.updateProjectionMatrix();
    renderer.setSize(ancho, alto, false);
    composer?.setPixelRatio(nitidez);
    composer?.setSize(ancho, alto);
  };
  new ResizeObserver(redimensionar).observe(o.contenedor);
  redimensionar();

  let activo = true;
  new IntersectionObserver(([e]) => (activo = e.isIntersecting)).observe(o.contenedor);

  // Resolución adaptable: si el equipo no llega a ~45 cuadros por segundo, baja la nitidez de a pocos
  let medido = 0;
  let cuadros = 0;
  const medir = (dt: number) => {
    medido += dt;
    cuadros++;
    if (medido < 2) return;
    if (cuadros / medido < 45 && nitidez > 1) {
      nitidez = Math.max(1, nitidez - 0.25);
      renderer.setPixelRatio(nitidez);
      redimensionar();
    }
    medido = 0;
    cuadros = 0;
  };

  const reloj = new THREE.Clock();
  const alCuadro: ((t: number) => void)[] = [];
  const posPolvo = geoPolvo.attributes.position as THREE.BufferAttribute;

  renderer.setAnimationLoop(() => {
    if (!activo || document.hidden) return;
    const dt = Math.min(reloj.getDelta(), 0.05);
    const t = reloj.elapsedTime;
    const ahora = performance.now();

    if (viaje) {
      const k = viaje.dur ? Math.min((ahora - viaje.t0) / viaje.dur, 1) : 1;
      const e = suave(k);
      camara.position.lerpVectors(viaje.desde, viaje.hasta, e);
      controles.target.lerpVectors(viaje.mDesde, viaje.mHasta, e);
      camara.lookAt(controles.target);
      if (k >= 1) {
        const fin = viaje.fin;
        viaje = null;
        fin?.();
        controles.enabled = true;
        controles.update();
      }
    } else if (controles.enabled) {
      controles.update(dt);
      // La cámara nunca sale de la sala
      camara.position.x = THREE.MathUtils.clamp(camara.position.x, -ANCHO / 2 + 0.3, ANCHO / 2 - 0.3);
      camara.position.z = THREE.MathUtils.clamp(camara.position.z, -FONDO / 2 + 0.3, FONDO / 2 - 0.25);
      camara.position.y = THREE.MathUtils.clamp(camara.position.y, 0.35, ALTO - 0.3);
      if (controles.autoRotate) {
        const a = controles.getAzimuthalAngle();
        if (a >= controles.maxAzimuthAngle - 0.02) controles.autoRotateSpeed = -Math.abs(controles.autoRotateSpeed);
        if (a <= controles.minAzimuthAngle + 0.02) controles.autoRotateSpeed = Math.abs(controles.autoRotateSpeed);
      }
    }

    // Encendido escalonado de luces
    if (encendido > 0) {
      const s = (ahora - encendido) / 1000;
      const lento = o.movimientoReducido ? 100 : 1;
      hemi.intensity = Math.min(s * lento * 0.5, 1) * 0.55;
      relleno.intensity = Math.min(s * lento * 0.5, 1) * 9;
      montadas.forEach((m, i) => {
        const k = THREE.MathUtils.clamp((s - 0.5 - i * 0.32) * lento * 3, 0, 1);
        const parpadeo = k < 1 && k > 0 ? 0.6 + 0.4 * Math.sin(ahora * 0.09 + i) : 1;
        m.foco.intensity = m.potencia * k * parpadeo * (enFoco && enFoco !== m ? 0.55 : 1);
      });
      conos.forEach((c, i) => {
        const k = THREE.MathUtils.clamp((s - 0.5 - i * 0.32) * lento * 3, 0, 1);
        (c.material as THREE.ShaderMaterial).uniforms.intensidad.value = k;
      });
      matPolvo.opacity = Math.min(s * 0.3, 0.55);
    }

    // Polvo flotando
    for (let i = 0; i < N; i++) {
      const y = posPolvo.getY(i) + dt * 0.035;
      posPolvo.setY(i, y > ALTO - 0.2 ? 0.2 : y);
      posPolvo.setX(i, posPolvo.getX(i) + Math.sin(t * 0.3 + fases[i]) * dt * 0.02);
    }
    posPolvo.needsUpdate = true;

    const k = o.movimientoReducido ? 1 : 1 - Math.exp(-dt * 5);
    desfase.x += (desfase.ox - desfase.x) * k;
    desfase.y += (desfase.oy - desfase.y) * k;
    if (Math.abs(desfase.x) + Math.abs(desfase.y) > 0.5) camara.setViewOffset(ancho, alto, desfase.x, desfase.y, ancho, alto);
    else if (camara.view?.enabled) camara.clearViewOffset();

    if (composer) composer.render();
    else renderer.render(escena, camara);
    if (encendido > 0) medir(dt);
    for (const f of alCuadro) f(t);
  });

  return {
    piezas: montadas.map((m) => m.pieza),
    entrar,
    enfocar,
    vistaGeneral: () => vistaGeneral(),
    proyectar,
    desplazar,
    alCuadro: (f: (t: number) => void) => alCuadro.push(f),
    get enFoco() {
      return enFoco?.pieza ?? null;
    },
  };
}

export type Sala = Awaited<ReturnType<typeof crearSala>>;
