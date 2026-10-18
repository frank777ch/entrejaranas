// Visor de panoramas 360° (equirectangulares) con WebGL puro, sin librerías.
// Un solo triángulo cubre la pantalla: cada píxel calcula hacia dónde mira y lee el panorama.

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
  alto: number;
}

export interface Punto {
  el: HTMLElement;
  yaw: number;
  pitch: number;
}

const RAD = Math.PI / 180;
const suave = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

const VERTICE_2 = `#version 300 es
in vec2 p;
out vec2 vP;
void main() { vP = p; gl_Position = vec4(p, 0.0, 1.0); }`;

const FRAGMENTO_2 = `#version 300 es
precision highp float;
uniform sampler2D uA;
uniform sampler2D uB;
uniform float uMezcla;
uniform float uLodA;
uniform float uLodB;
uniform vec3 uR;
uniform vec3 uU;
uniform vec3 uF;
uniform vec2 uEsc;
in vec2 vP;
out vec4 color;
vec2 equi(vec3 d) {
  return vec2(0.5 + atan(d.x, -d.z) / 6.28318530718, 0.5 - asin(clamp(d.y, -1.0, 1.0)) / 3.14159265359);
}
void main() {
  vec2 uv = equi(normalize(uR * vP.x * uEsc.x + uU * vP.y * uEsc.y + uF));
  // LOD fijo por cuadro: evita la costura que dejarían las derivadas en el borde del panorama
  vec4 a = textureLod(uA, uv, uLodA);
  vec4 b = textureLod(uB, uv, uLodB);
  color = mix(a, b, uMezcla);
}`;

const VERTICE_1 = `attribute vec2 p;
varying vec2 vP;
void main() { vP = p; gl_Position = vec4(p, 0.0, 1.0); }`;

const FRAGMENTO_1 = (lod: boolean) => `${lod ? '#extension GL_EXT_shader_texture_lod : enable' : ''}
precision highp float;
uniform sampler2D uA;
uniform sampler2D uB;
uniform float uMezcla;
uniform float uLodA;
uniform float uLodB;
uniform vec3 uR;
uniform vec3 uU;
uniform vec3 uF;
uniform vec2 uEsc;
varying vec2 vP;
vec2 equi(vec3 d) {
  return vec2(0.5 + atan(d.x, -d.z) / 6.28318530718, 0.5 - asin(clamp(d.y, -1.0, 1.0)) / 3.14159265359);
}
void main() {
  vec2 uv = equi(normalize(uR * vP.x * uEsc.x + uU * vP.y * uEsc.y + uF));
  ${
    lod
      ? 'gl_FragColor = mix(texture2DLodEXT(uA, uv, uLodA), texture2DLodEXT(uB, uv, uLodB), uMezcla);'
      : 'gl_FragColor = mix(texture2D(uA, uv), texture2D(uB, uv), uMezcla);'
  }
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
  readonly maxTextura: number;
  vista: Vista = { yaw: 0, pitch: 0, fov: 72 };
  fovMin = 28;
  fovMax = 110;
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

  constructor(lienzo: HTMLCanvasElement, { reducido = false } = {}) {
    this.lienzo = lienzo;
    this.reducido = reducido;
    const opciones = { antialias: false, alpha: false, depth: false, stencil: false, premultipliedAlpha: false, powerPreference: 'high-performance' as const };
    const gl2 = lienzo.getContext('webgl2', opciones) as WebGL2RenderingContext | null;
    const gl = gl2 ?? (lienzo.getContext('webgl', opciones) as WebGLRenderingContext | null);
    if (!gl) throw new Error('Este navegador no tiene WebGL');
    this.gl = gl;
    const lod = gl2 ? true : !!gl.getExtension('EXT_shader_texture_lod');
    this.prog = this.programa(gl2 ? VERTICE_2 : VERTICE_1, gl2 ? FRAGMENTO_2 : FRAGMENTO_1(lod));
    for (const n of ['uA', 'uB', 'uMezcla', 'uLodA', 'uLodB', 'uR', 'uU', 'uF', 'uEsc']) this.u[n] = gl.getUniformLocation(this.prog, n);
    this.maxTextura = gl.getParameter(gl.MAX_TEXTURE_SIZE);

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

  /** Descarga y sube un panorama; informa el avance de 0 a 1 */
  async cargar(url: string, alAvanzar?: (p: number) => void): Promise<Textura> {
    const r = await fetch(url);
    if (!r.ok) throw new Error(`No se pudo cargar ${url}`);
    const total = Number(r.headers.get('content-length')) || 0;
    let blob: Blob;
    if (alAvanzar && total && r.body) {
      const lector = r.body.getReader();
      const partes: Uint8Array[] = [];
      let llevo = 0;
      for (;;) {
        const { done, value } = await lector.read();
        if (done) break;
        partes.push(value);
        llevo += value.length;
        alAvanzar(Math.min(1, llevo / total));
      }
      blob = new Blob(partes as BlobPart[], { type: 'image/webp' });
    } else {
      blob = await r.blob();
    }
    const img = 'createImageBitmap' in window ? await createImageBitmap(blob) : await this.imagen(blob);
    return this.subir(img);
  }

  private imagen(blob: Blob) {
    return new Promise<HTMLImageElement>((ok, mal) => {
      const i = new Image();
      i.onload = () => ok(i);
      i.onerror = mal;
      i.src = URL.createObjectURL(blob);
    });
  }

  private subir(img: TexImageSource & { width: number; height: number }): Textura {
    const gl = this.gl;
    const tex = gl.createTexture()!;
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
    gl.generateMipmap(gl.TEXTURE_2D);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    if ('close' in img && typeof img.close === 'function') img.close();
    return { tex, alto: img.height };
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
    const hasta: Vista = { ...desde, ...destino };
    // Giro por el camino más corto
    hasta.yaw = desde.yaw + ((((hasta.yaw - desde.yaw) % 360) + 540) % 360) - 180;
    hasta.pitch = Math.max(-88, Math.min(88, hasta.pitch));
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
      this.inercia.yaw *= 0.9;
      this.inercia.pitch *= 0.9;
      this.sucio = true;
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

  private lod(t: Textura | null) {
    if (!t) return 0;
    // Texeles del panorama por píxel de pantalla, al centro de la vista
    const porPixel = (t.alto / Math.PI) * ((2 * Math.tan((this.vista.fov * RAD) / 2)) / Math.max(1, this.lienzo.height));
    return Math.max(0, Math.log2(porPixel) - 0.25);
  }

  private dibujar() {
    const gl = this.gl;
    const { f, r, u, esc } = this.base();
    gl.viewport(0, 0, this.lienzo.width, this.lienzo.height);
    gl.useProgram(this.prog);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.a!.tex);
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, (this.b ?? this.a)!.tex);
    gl.uniform1f(this.u.uMezcla, this.b ? this.mezcla : 0);
    gl.uniform1f(this.u.uLodA, this.lod(this.a));
    gl.uniform1f(this.u.uLodB, this.lod(this.b ?? this.a));
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
      const antes = activos.get(e.pointerId);
      if (!antes) return;
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
    this.sucio = true;
  }
}
