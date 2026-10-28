// Visor de panoramas 360° (cubemaps de seis caras) con WebGL puro, sin librerías.
// Un solo triángulo cubre la pantalla: cada píxel calcula hacia dónde mira y lee el cubo.
// También muestra imágenes planas (una ilustración o un render de cámara fija) como si
// fueran una ventana frente al visitante: la cámara gira poco y nunca se sale del cuadro.

export interface Vista {
  /** Giro horizontal en grados: 0 = frente, 90 = derecha */
  yaw: number;
  /** Inclinación en grados: + arriba, − abajo */
  pitch: number;
  /** Campo de visión vertical en grados */
  fov: number;
}

export interface Textura {
  tex: WebGLTexture;
  /** Lado de cada cara en píxeles (en una imagen plana, su ancho) */
  lado: number;
  /** Imagen plana: tangentes de la mitad de su campo horizontal y vertical */
  plano?: { tanH: number; tanV: number };
}

/** Rango permitido de giro e inclinación, en grados */
export interface Encierro {
  yaw: [number, number];
  pitch: [number, number];
}

export interface Punto {
  el: HTMLElement;
  yaw: number;
  pitch: number;
}

/** Caras en el orden de WebGL: +X, −X, +Y, −Y, +Z, −Z */
export const CARAS = ['px', 'nx', 'py', 'ny', 'pz', 'nz'] as const;

type Imagen = TexImageSource & { width: number; height: number };

const RAD = Math.PI / 180;
const suave = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

const VERTICE_2 = `#version 300 es
in vec2 p;
out vec2 vP;
void main() { vP = p; gl_Position = vec4(p, 0.0, 1.0); }`;

// Imagen plana: la dirección se proyecta sobre un plano frente a la cámara inicial (−z)
const FRAGMENTO_2 = `#version 300 es
precision highp float;
uniform samplerCube uA;
uniform samplerCube uB;
uniform sampler2D uA2;
uniform sampler2D uB2;
uniform vec4 uPlanoA;
uniform vec4 uPlanoB;
uniform float uMezcla;
uniform vec3 uR;
uniform vec3 uU;
uniform vec3 uF;
uniform vec2 uEsc;
in vec2 vP;
out vec4 color;
vec2 uvPlano(vec3 d, vec4 pl) {
  float z = max(-d.z, 1e-4);
  return vec2(0.5 + d.x / z / pl.y * 0.5, 0.5 - d.y / z / pl.z * 0.5);
}
// Cuando la vista pasa el borde (para dejar una pieza junto a la ficha), fuera de la imagen
// se funde a penumbra en vez de estirar la última columna de píxeles
vec4 plano(sampler2D t, vec3 d, vec4 pl) {
  vec2 uv = uvPlano(d, pl);
  vec2 fuera = max(-uv, uv - 1.0);
  return mix(texture(t, uv), vec4(0.035, 0.03, 0.045, 1.0), smoothstep(0.0, 0.06, max(fuera.x, fuera.y)));
}
void main() {
  vec3 d = uR * vP.x * uEsc.x + uU * vP.y * uEsc.y + uF;
  vec4 a = uPlanoA.x > 0.5 ? plano(uA2, d, uPlanoA) : texture(uA, d);
  vec4 b = uPlanoB.x > 0.5 ? plano(uB2, d, uPlanoB) : texture(uB, d);
  color = mix(a, b, uMezcla);
}`;

const VERTICE_1 = `attribute vec2 p;
varying vec2 vP;
void main() { vP = p; gl_Position = vec4(p, 0.0, 1.0); }`;

const FRAGMENTO_1 = `precision highp float;
uniform samplerCube uA;
uniform samplerCube uB;
uniform sampler2D uA2;
uniform sampler2D uB2;
uniform vec4 uPlanoA;
uniform vec4 uPlanoB;
uniform float uMezcla;
uniform vec3 uR;
uniform vec3 uU;
uniform vec3 uF;
uniform vec2 uEsc;
varying vec2 vP;
vec2 uvPlano(vec3 d, vec4 pl) {
  float z = max(-d.z, 1e-4);
  return vec2(0.5 + d.x / z / pl.y * 0.5, 0.5 - d.y / z / pl.z * 0.5);
}
vec4 plano(sampler2D t, vec3 d, vec4 pl) {
  vec2 uv = uvPlano(d, pl);
  vec2 fuera = max(-uv, uv - 1.0);
  return mix(texture2D(t, uv), vec4(0.035, 0.03, 0.045, 1.0), smoothstep(0.0, 0.06, max(fuera.x, fuera.y)));
}
void main() {
  vec3 d = uR * vP.x * uEsc.x + uU * vP.y * uEsc.y + uF;
  vec4 a = uPlanoA.x > 0.5 ? plano(uA2, d, uPlanoA) : textureCube(uA, d);
  vec4 b = uPlanoB.x > 0.5 ? plano(uB2, d, uPlanoB) : textureCube(uB, d);
  gl_FragColor = mix(a, b, uMezcla);
}`;

interface Animacion {
  desde: Vista;
  hasta: Vista;
  inicio: number;
  ms: number;
  listo: () => void;
}

export class Visor {
  readonly gl: WebGL2RenderingContext | WebGLRenderingContext;
  /** Lado máximo de una cara de cubemap que admite la GPU */
  readonly maxTextura: number;
  private anisotropia: EXT_texture_filter_anisotropic | null;
  vista: Vista = { yaw: 0, pitch: 0, fov: 72 };
  fovMin = 28;
  fovMax = 110;
  /** Límite de giro opcional (en una imagen plana, además, nunca se sale del cuadro) */
  encierro: Encierro | null = null;
  /** Cuánto sigue la cámara al mouse sin hacer clic, de 0 (nada) a 1 (todo el margen) */
  deriva = 0;
  /** Deja que la vista pase el borde inferior de la imagen plana (cuando la hoja de la ficha tapa
   *  la parte de abajo, en celular); los costados y el borde superior nunca se pasan */
  pasarAbajo = false;
  /** Se llama cuando el visitante gira la vista con el dedo o el mouse */
  alArrastrar: () => void = () => {};

  private lienzo: HTMLCanvasElement;
  private prog: WebGLProgram;
  private u: Record<string, WebGLUniformLocation | null> = {};
  private a: Textura | null = null;
  private b: Textura | null = null;
  private mezcla = 0;
  private anim: Animacion | null = null;
  private fundido: { inicio: number; ms: number; listo: () => void } | null = null;
  private puntos: Punto[] = [];
  private sucio = true;
  private nitidez = 1;
  private inercia = { yaw: 0, pitch: 0 };
  private reducido: boolean;
  private tocando = false;
  private mouse: { x: number; y: number } | null = null;
  private vacioCubo: WebGLTexture;
  private vacio2D: WebGLTexture;
  private readonly gl2: boolean;

  constructor(lienzo: HTMLCanvasElement, { reducido = false } = {}) {
    this.lienzo = lienzo;
    this.reducido = reducido;
    const opciones = { antialias: false, alpha: false, depth: false, stencil: false, premultipliedAlpha: false, powerPreference: 'high-performance' as const };
    const gl2 = lienzo.getContext('webgl2', opciones) as WebGL2RenderingContext | null;
    const gl = gl2 ?? (lienzo.getContext('webgl', opciones) as WebGLRenderingContext | null);
    if (!gl) throw new Error('Este navegador no tiene WebGL');
    this.gl = gl;
    this.gl2 = !!gl2;
    this.prog = this.programa(gl2 ? VERTICE_2 : VERTICE_1, gl2 ? FRAGMENTO_2 : FRAGMENTO_1);
    for (const n of ['uA', 'uB', 'uA2', 'uB2', 'uPlanoA', 'uPlanoB', 'uMezcla', 'uR', 'uU', 'uF', 'uEsc']) this.u[n] = gl.getUniformLocation(this.prog, n);
    this.maxTextura = gl.getParameter(gl.MAX_CUBE_MAP_TEXTURE_SIZE);
    this.anisotropia =
      gl.getExtension('EXT_texture_filter_anisotropic') ?? gl.getExtension('WEBKIT_EXT_texture_filter_anisotropic') ?? gl.getExtension('MOZ_EXT_texture_filter_anisotropic');

    // Triángulo que cubre toda la pantalla
    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(this.prog, 'p');
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    gl.useProgram(this.prog);
    gl.uniform1i(this.u.uA, 0);
    gl.uniform1i(this.u.uB, 1);
    gl.uniform1i(this.u.uA2, 2);
    gl.uniform1i(this.u.uB2, 3);
    // Texturas vacías para que cada unidad tenga siempre algo de su tipo
    const negro = new Uint8Array([0, 0, 0, 255]);
    this.vacioCubo = gl.createTexture()!;
    gl.bindTexture(gl.TEXTURE_CUBE_MAP, this.vacioCubo);
    for (let i = 0; i < 6; i++) gl.texImage2D(gl.TEXTURE_CUBE_MAP_POSITIVE_X + i, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, negro);
    this.vacio2D = gl.createTexture()!;
    gl.bindTexture(gl.TEXTURE_2D, this.vacio2D);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, negro);

    new ResizeObserver(() => this.ajustar()).observe(lienzo);
    this.ajustar();
    this.arrastre();
    requestAnimationFrame(this.cuadro);
  }

  private programa(v: string, f: string) {
    const gl = this.gl;
    const crear = (tipo: number, src: string) => {
      const s = gl.createShader(tipo)!;
      gl.shaderSource(s, src);
      gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s) ?? 'shader');
      return s;
    };
    const p = gl.createProgram()!;
    gl.attachShader(p, crear(gl.VERTEX_SHADER, v));
    gl.attachShader(p, crear(gl.FRAGMENT_SHADER, f));
    gl.linkProgram(p);
    if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(p) ?? 'programa');
    return p;
  }

  private ajustar() {
    const max = matchMedia('(hover: none)').matches ? 1.75 : 2;
    this.nitidez = Math.min(devicePixelRatio || 1, max);
    const w = Math.round(this.lienzo.clientWidth * this.nitidez);
    const h = Math.round(this.lienzo.clientHeight * this.nitidez);
    if (w && h && (this.lienzo.width !== w || this.lienzo.height !== h)) {
      this.lienzo.width = w;
      this.lienzo.height = h;
    }
    this.sucio = true;
  }

  get aspecto() {
    return this.lienzo.clientWidth / Math.max(1, this.lienzo.clientHeight);
  }

  /** Campo de visión horizontal en grados para un fov vertical */
  fovHorizontal(fov = this.vista.fov) {
    return (2 * Math.atan(Math.tan((fov * RAD) / 2) * this.aspecto)) / RAD;
  }

  /** fov vertical necesario para que entre un ancho horizontal dado */
  fovParaAncho(ancho: number) {
    return (2 * Math.atan(Math.tan((ancho * RAD) / 2) / this.aspecto)) / RAD;
  }

  /** Descarga un archivo informando el avance en bytes */
  private async bajar(url: string, alAvanzar?: (bytes: number, total: number) => void): Promise<Blob> {
    const r = await fetch(url);
    if (!r.ok) throw new Error(`No se pudo cargar ${url}`);
    const total = Number(r.headers.get('content-length')) || 0;
    if (!alAvanzar || !r.body) return r.blob();
    const lector = r.body.getReader();
    const partes: Uint8Array[] = [];
    let llevo = 0;
    for (;;) {
      const { done, value } = await lector.read();
      if (done) break;
      partes.push(value);
      llevo += value.length;
      alAvanzar(llevo, total);
    }
    return new Blob(partes as BlobPart[], { type: r.headers.get('content-type') ?? 'image/webp' });
  }

  private imagen(blob: Blob): Promise<Imagen> {
    if ('createImageBitmap' in window) return createImageBitmap(blob);
    return new Promise((ok, mal) => {
      const i = new Image();
      i.onload = () => ok(i);
      i.onerror = mal;
      i.src = URL.createObjectURL(blob);
    });
  }

  /** Descarga las seis caras (`base` + `-px.webp`, etc.); informa el avance de 0 a 1 */
  async cargar(base: string, alAvanzar?: (p: number) => void): Promise<Textura> {
    const llevo = new Array(6).fill(0);
    const totales = new Array(6).fill(0);
    const avisar = () => {
      const t = totales.reduce((a, b) => a + b, 0);
      if (alAvanzar && totales.every(Boolean)) alAvanzar(Math.min(1, llevo.reduce((a, b) => a + b, 0) / t));
    };
    const caras = await Promise.all(
      CARAS.map(async (c, i) => {
        const blob = await this.bajar(`${base}-${c}.webp`, (b, t) => {
          llevo[i] = b;
          totales[i] = t || 1;
          avisar();
        });
        return this.imagen(blob);
      }),
    );
    return this.subir(caras);
  }

  /** Descarga una imagen plana; `fovH` es el campo horizontal que abarca, en grados */
  async cargarPlano(url: string, fovH: number, alAvanzar?: (p: number) => void): Promise<Textura> {
    const blob = await this.bajar(url, alAvanzar && ((b, t) => alAvanzar(t ? Math.min(1, b / t) : 0)));
    const img = await this.imagen(blob);
    const gl = this.gl;
    const tex = gl.createTexture()!;
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
    const { width: w, height: h } = img;
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
    if ('close' in img && typeof img.close === 'function') img.close();
    // WebGL 1 no hace mipmaps de imágenes que no miden potencias de 2
    const mip = this.gl2 || ((w & (w - 1)) === 0 && (h & (h - 1)) === 0);
    if (mip) gl.generateMipmap(gl.TEXTURE_2D);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, mip ? gl.LINEAR_MIPMAP_LINEAR : gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    if (this.anisotropia) {
      const max = gl.getParameter(this.anisotropia.MAX_TEXTURE_MAX_ANISOTROPY_EXT);
      gl.texParameterf(gl.TEXTURE_2D, this.anisotropia.TEXTURE_MAX_ANISOTROPY_EXT, Math.min(8, max));
    }
    this.sucio = true;
    const tanH = Math.tan((fovH * RAD) / 2);
    return { tex, lado: w, plano: { tanH, tanV: (tanH * h) / w } };
  }

  /** Dirección (yaw, pitch) de un punto de la imagen plana, con x e y de 0 a 1 desde arriba a la izquierda */
  static direccionPlano(t: Textura, x: number, y: number) {
    const { tanH, tanV } = t.plano!;
    const dx = (2 * x - 1) * tanH;
    const dy = (1 - 2 * y) * tanV;
    return { yaw: Math.atan(dx) / RAD, pitch: Math.atan2(dy, Math.hypot(1, dx)) / RAD };
  }

  /** La imagen que se ve ahora (la de destino durante un fundido) */
  get actual() {
    return this.b ?? this.a;
  }

  /** fov vertical con el que la imagen plana llena justo la pantalla */
  fovCubrir(t = this.actual) {
    if (!t?.plano) return this.fovMax;
    const { tanH, tanV } = t.plano;
    return (2 * Math.atan(Math.min(tanV, tanH / this.aspecto))) / RAD;
  }

  /** Rango de giro posible con un fov: el encierro y, en una imagen plana, los bordes del cuadro */
  rango(fov = this.vista.fov): Encierro {
    let yaw: [number, number] = this.encierro ? [...this.encierro.yaw] : [-Infinity, Infinity];
    let pitch: [number, number] = this.encierro ? [...this.encierro.pitch] : [-88, 88];
    const t = this.actual;
    if (t?.plano) {
      const H = Math.atan(t.plano.tanH) / RAD;
      const V = Math.atan(t.plano.tanV) / RAD;
      const h = this.fovHorizontal(fov) / 2;
      const v = fov / 2;
      const mx = Math.max(0, H - h);
      const my = Math.max(0, V - v);
      yaw = [Math.max(yaw[0], -mx), Math.min(yaw[1], mx)];
      pitch = [this.pasarAbajo ? pitch[0] : Math.max(pitch[0], -my), Math.min(pitch[1], my)];
    }
    if (yaw[0] > yaw[1]) yaw = [(yaw[0] + yaw[1]) / 2, (yaw[0] + yaw[1]) / 2];
    if (pitch[0] > pitch[1]) pitch = [(pitch[0] + pitch[1]) / 2, (pitch[0] + pitch[1]) / 2];
    return { yaw, pitch };
  }

  /** Ajusta una vista para que quede dentro de lo permitido */
  acotar(v: Vista): Vista {
    const fov = Math.max(this.fovMin, Math.min(this.fovMax, this.fovCubrir(), v.fov));
    const r = this.rango(fov);
    const dentro = (x: number, [a, b]: [number, number]) => Math.max(a, Math.min(b, x));
    return { fov, yaw: dentro(v.yaw, r.yaw), pitch: dentro(v.pitch, r.pitch) };
  }

  /** Deja de seguir al mouse hasta que vuelva a moverse (tras usar las flechas) */
  soltarMouse() {
    this.mouse = null;
  }

  private get libre() {
    return !this.encierro && !this.actual?.plano;
  }

  private subir(caras: Imagen[]): Textura {
    const gl = this.gl;
    const tex = gl.createTexture()!;
    gl.bindTexture(gl.TEXTURE_CUBE_MAP, tex);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
    caras.forEach((img, i) => {
      gl.texImage2D(gl.TEXTURE_CUBE_MAP_POSITIVE_X + i, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
      if ('close' in img && typeof img.close === 'function') img.close();
    });
    gl.generateMipmap(gl.TEXTURE_CUBE_MAP);
    gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
    gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    if (this.anisotropia) {
      const max = gl.getParameter(this.anisotropia.MAX_TEXTURE_MAX_ANISOTROPY_EXT);
      gl.texParameterf(gl.TEXTURE_CUBE_MAP, this.anisotropia.TEXTURE_MAX_ANISOTROPY_EXT, Math.min(8, max));
    }
    this.sucio = true;
    return { tex, lado: caras[0].width };
  }

  liberar(t: Textura | null) {
    if (t && t !== this.a && t !== this.b) this.gl.deleteTexture(t.tex);
  }

  /** Cambia de panorama con un fundido (o al instante) */
  mostrar(t: Textura, ms = 0): Promise<void> {
    if (!this.a || ms <= 0 || this.reducido) {
      this.fundido?.listo();
      this.fundido = null;
      this.a = t;
      this.b = null;
      this.mezcla = 0;
      this.sucio = true;
      return Promise.resolve();
    }
    this.fundido?.listo();
    this.b = t;
    this.mezcla = 0;
    return new Promise((listo) => {
      this.fundido = { inicio: performance.now(), ms, listo };
      this.sucio = true;
    });
  }

  /** Reemplaza el panorama actual por otro igual pero más nítido, sin que se note */
  reemplazar(antes: Textura, despues: Textura) {
    if (this.a === antes) this.a = despues;
    if (this.b === antes) this.b = despues;
    this.sucio = true;
  }

  /** Anima la cámara hasta una vista */
  ir(destino: Partial<Vista>, ms = 800): Promise<void> {
    this.anim?.listo();
    this.inercia = { yaw: 0, pitch: 0 };
    const desde = { ...this.vista };
    let hasta: Vista = { ...desde, ...destino };
    if (this.libre) {
      // Giro por el camino más corto
      hasta.yaw = desde.yaw + ((((hasta.yaw - desde.yaw) % 360) + 540) % 360) - 180;
      hasta.pitch = Math.max(-88, Math.min(88, hasta.pitch));
    } else hasta = this.acotar(hasta);
    if (ms <= 0 || this.reducido) {
      this.vista = hasta;
      this.anim = null;
      this.sucio = true;
      return Promise.resolve();
    }
    return new Promise((listo) => {
      this.anim = { desde, hasta, inicio: performance.now(), ms, listo };
      this.sucio = true;
    });
  }

  colocarPuntos(puntos: Punto[]) {
    this.puntos = puntos;
    this.sucio = true;
  }

  private base() {
    const { yaw, pitch } = this.vista;
    const y = yaw * RAD;
    const p = pitch * RAD;
    const f = [Math.sin(y) * Math.cos(p), Math.sin(p), -Math.cos(y) * Math.cos(p)];
    const r = [Math.cos(y), 0, Math.sin(y)];
    // u = r × f
    const u = [r[1] * f[2] - r[2] * f[1], r[2] * f[0] - r[0] * f[2], r[0] * f[1] - r[1] * f[0]];
    const ty = Math.tan((this.vista.fov * RAD) / 2);
    return { f, r, u, esc: [ty * this.aspecto, ty] };
  }

  private cuadro = (ahora: number) => {
    requestAnimationFrame(this.cuadro);
    if (this.anim) {
      const t = Math.min(1, (ahora - this.anim.inicio) / this.anim.ms);
      const k = suave(t);
      const { desde, hasta } = this.anim;
      this.vista = {
        yaw: desde.yaw + (hasta.yaw - desde.yaw) * k,
        pitch: desde.pitch + (hasta.pitch - desde.pitch) * k,
        fov: desde.fov + (hasta.fov - desde.fov) * k,
      };
      if (t >= 1) {
        const fin = this.anim.listo;
        this.anim = null;
        fin();
      }
      this.sucio = true;
    } else if (!this.tocando && Math.abs(this.inercia.yaw) + Math.abs(this.inercia.pitch) > 0.01) {
      this.vista.yaw += this.inercia.yaw;
      this.vista.pitch = Math.max(-88, Math.min(88, this.vista.pitch + this.inercia.pitch));
      if (!this.libre) this.vista = this.acotar(this.vista);
      this.inercia.yaw *= 0.9;
      this.inercia.pitch *= 0.9;
      this.sucio = true;
    } else if (this.deriva > 0 && this.mouse && !this.tocando && !this.reducido) {
      // La mirada sigue al mouse con suavidad, dentro del margen que deja el encuadre
      const r = this.rango();
      const medio = (a: number, b: number, t: number) => (a + b) / 2 + ((b - a) / 2) * t * this.deriva;
      const yaw = medio(r.yaw[0], r.yaw[1], this.mouse.x);
      const pitch = medio(r.pitch[0], r.pitch[1], -this.mouse.y);
      const dy = yaw - this.vista.yaw;
      const dp = pitch - this.vista.pitch;
      if (Math.abs(dy) + Math.abs(dp) > 0.005) {
        this.vista.yaw += dy * 0.06;
        this.vista.pitch += dp * 0.06;
        this.sucio = true;
      }
    }
    if (this.fundido) {
      const t = Math.min(1, (ahora - this.fundido.inicio) / this.fundido.ms);
      this.mezcla = suave(t);
      if (t >= 1) {
        this.a = this.b;
        this.b = null;
        this.mezcla = 0;
        const fin = this.fundido.listo;
        this.fundido = null;
        fin();
      }
      this.sucio = true;
    }
    if (!this.sucio || !this.a) return;
    this.sucio = false;
    this.dibujar();
  };

  private dibujar() {
    const gl = this.gl;
    const { f, r, u, esc } = this.base();
    gl.viewport(0, 0, this.lienzo.width, this.lienzo.height);
    gl.useProgram(this.prog);
    const a = this.a!;
    const b = this.b ?? a;
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_CUBE_MAP, a.plano ? this.vacioCubo : a.tex);
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_CUBE_MAP, b.plano ? this.vacioCubo : b.tex);
    gl.activeTexture(gl.TEXTURE2);
    gl.bindTexture(gl.TEXTURE_2D, a.plano ? a.tex : this.vacio2D);
    gl.activeTexture(gl.TEXTURE3);
    gl.bindTexture(gl.TEXTURE_2D, b.plano ? b.tex : this.vacio2D);
    gl.uniform4f(this.u.uPlanoA, a.plano ? 1 : 0, a.plano?.tanH ?? 1, a.plano?.tanV ?? 1, 0);
    gl.uniform4f(this.u.uPlanoB, b.plano ? 1 : 0, b.plano?.tanH ?? 1, b.plano?.tanV ?? 1, 0);
    gl.uniform1f(this.u.uMezcla, this.b ? this.mezcla : 0);
    gl.uniform3fv(this.u.uR, r);
    gl.uniform3fv(this.u.uU, u);
    gl.uniform3fv(this.u.uF, f);
    gl.uniform2fv(this.u.uEsc, esc);
    gl.drawArrays(gl.TRIANGLES, 0, 3);

    // Puntos tocables en HTML, proyectados sobre la vista
    const w = this.lienzo.clientWidth;
    const h = this.lienzo.clientHeight;
    for (const p of this.puntos) {
      const y = p.yaw * RAD;
      const pi = p.pitch * RAD;
      const d = [Math.sin(y) * Math.cos(pi), Math.sin(pi), -Math.cos(y) * Math.cos(pi)];
      const z = d[0] * f[0] + d[1] * f[1] + d[2] * f[2];
      const x = (d[0] * r[0] + d[1] * r[1] + d[2] * r[2]) / z / esc[0];
      const yy = (d[0] * u[0] + d[1] * u[1] + d[2] * u[2]) / z / esc[1];
      const visible = z > 0.1 && Math.abs(x) < 1.15 && Math.abs(yy) < 1.15;
      p.el.style.visibility = visible ? '' : 'hidden';
      if (visible) p.el.style.transform = `translate3d(${((x + 1) / 2) * w}px, ${((1 - yy) / 2) * h}px, 0)`;
    }
  }

  /** Mirar arrastrando con el mouse o el dedo; rueda o pellizco para acercar */
  private arrastre() {
    const el = this.lienzo;
    const activos = new Map<number, { x: number; y: number }>();
    let distancia = 0;
    let ultimo = 0;
    el.addEventListener('pointerdown', (e) => {
      el.setPointerCapture(e.pointerId);
      activos.set(e.pointerId, { x: e.clientX, y: e.clientY });
      this.anim?.listo();
      this.anim = null;
      this.inercia = { yaw: 0, pitch: 0 };
      el.classList.add('arrastrando');
      this.tocando = true;
      if (activos.size === 2) {
        const [a, b] = [...activos.values()];
        distancia = Math.hypot(a.x - b.x, a.y - b.y);
      }
    });
    el.addEventListener('pointermove', (e) => {
      if (e.pointerType === 'mouse') {
        const caja = el.getBoundingClientRect();
        this.mouse = { x: ((e.clientX - caja.left) / caja.width) * 2 - 1, y: ((e.clientY - caja.top) / caja.height) * 2 - 1 };
      }
      const antes = activos.get(e.pointerId);
      // Con el mouse, si la cámara lo sigue, arrastrar no gira
      if (!antes || (e.pointerType === 'mouse' && this.deriva > 0)) return;
      const ahora = { x: e.clientX, y: e.clientY };
      activos.set(e.pointerId, ahora);
      if (activos.size === 2) {
        const [a, b] = [...activos.values()];
        const d = Math.hypot(a.x - b.x, a.y - b.y);
        if (distancia) this.zoom(this.vista.fov * (distancia / d));
        distancia = d;
        return;
      }
      const grados = this.vista.fov / Math.max(1, el.clientHeight);
      const dy = (ahora.x - antes.x) * grados;
      const dp = (ahora.y - antes.y) * grados;
      this.vista.yaw -= dy;
      this.vista.pitch = Math.max(-88, Math.min(88, this.vista.pitch + dp));
      if (!this.libre) this.vista = this.acotar(this.vista);
      const t = performance.now();
      const dt = Math.max(8, t - ultimo);
      ultimo = t;
      this.inercia = { yaw: (-dy * 16) / dt, pitch: (dp * 16) / dt };
      this.sucio = true;
      this.alArrastrar();
    });
    const soltar = (e: PointerEvent) => {
      activos.delete(e.pointerId);
      distancia = 0;
      if (!activos.size) {
        el.classList.remove('arrastrando');
        this.tocando = false;
      }
      if (performance.now() - ultimo > 80) this.inercia = { yaw: 0, pitch: 0 };
    };
    el.addEventListener('pointerup', soltar);
    el.addEventListener('pointercancel', soltar);
    el.addEventListener('pointerleave', () => (this.mouse = null));
    el.addEventListener(
      'wheel',
      (e) => {
        e.preventDefault();
        this.zoom(this.vista.fov * Math.exp(e.deltaY * 0.0012));
      },
      { passive: false },
    );
  }

  private zoom(fov: number) {
    this.vista.fov = Math.max(this.fovMin, Math.min(this.fovMax, fov));
    if (!this.libre) this.vista = this.acotar(this.vista);
    this.sucio = true;
  }
}
