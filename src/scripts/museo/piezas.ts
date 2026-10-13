// Piezas de la sala "Mi museo criollo".
// Posiciones en metros: x (izquierda − / derecha +), z (fondo − / entrada +).
// La sala mide 7 m de ancho, 9 m de fondo y 5 m de alto; el centro del piso es (0, 0, 0).

export type Base = 'vitrina-alta' | 'vitrina-baja' | 'columna' | 'plinto' | 'plinto-redondo' | 'pedestal' | 'pared';

export interface Pieza {
  id: string;
  titulo: string;
  subtitulo: string;
  texto: string;
  dato: string;
  /** Archivo en /museo/modelos (o imagen en /museo/texturas si base es 'pared') */
  archivo: string;
  base: Base;
  x: number;
  z: number;
  /** Hacia dónde mira la pieza, en grados (0 = hacia la entrada) */
  giro: number;
  /** Alto final del modelo en metros (o ancho, si medida = 'ancho') */
  tam: number;
  medida?: 'alto' | 'ancho';
  /** Giro extra del modelo dentro de su base, si la IA lo generó de costado */
  giroModelo?: number;
  /** Distancia de la cámara al acercarse */
  dist: number;
}

export const piezas: Pieza[] = [
  {
    id: 'abanico',
    titulo: 'Abanico',
    subtitulo: 'Polka peruano',
    texto:
      'En sus representaciones, este accesorio evoca la elegancia de los antiguos salones; tiene raíces ceremoniales y de distinción social.',
    dato: 'Su encanto despertó controversias. Pues en 1929, El Comercio realizó una encuesta que dividió a Lima en quienes defendían su gracia y quienes preferían tener las manos libres, generando un debate sobre la libertad femenina.',
    archivo: '05-abanico.glb',
    base: 'vitrina-baja',
    x: -2.35,
    z: 0.7,
    giro: 55,
    tam: 0.62,
    medida: 'ancho',
    dist: 1.5,
  },
  {
    id: 'pinglo',
    titulo: 'Felipe Pinglo Alva',
    subtitulo: 'El bardo inmortal',
    texto:
      'Nació en Barrios Altos en 1899. Renovó el vals criollo convirtiendo el barrio, el amor y las desigualdades en poesía musical. Murió de tuberculosis en 1936, a los 36 años.',
    dato: 'Su creatividad lo llevó a componer otros ritmos como el foxtrot y el onestep. En 2016, sus obras fueron declaradas Patrimonio cultural de la Nación.',
    archivo: '04-busto-pinglo.glb',
    base: 'columna',
    x: -2.55,
    z: -1.9,
    giro: 50,
    tam: 0.78,
    dist: 1.9,
  },
  {
    id: 'marinera',
    titulo: 'La marinera limeña',
    subtitulo: 'Vestimenta de la dama',
    texto:
      'La vestimenta se extiende hasta los tobillos, con encajes y una falda de amplio vuelo que acompaña sus movimientos. Tiene sus raíces en la zamacueca. En 1879, Abelardo Gamarra, El Tunante, le dio el nombre en homenaje a la Marina de Guerra.',
    dato: 'La marinera limeña también se llama «canto de jarana»: se canta en tres marineras seguidas, luego viene la resbalosa y al final las fugas.',
    archivo: '01-marinera-vestido.glb',
    base: 'vitrina-alta',
    x: -1.25,
    z: -3.1,
    giro: 12,
    tam: 1.62,
    dist: 2.7,
  },
  {
    id: 'quijada',
    titulo: 'Quijada de burro',
    subtitulo: 'Dientes que hacen música',
    texto:
      'Literalmente una mandíbula seca, la quijada acompaña expresiones como el festejo y el son de los Diablos. Entre golpes y raspados, su sonido dialoga con el cajón y celebra la creatividad de la tradición musical afroperuana.',
    dato: 'La quijada también se emplea en México. Allí acompaña al son jarocho. Un mismo hueso, distintos ritmos.',
    archivo: '06-quijada-burro.glb',
    base: 'pedestal',
    x: -0.05,
    z: -0.9,
    giro: 0,
    giroModelo: -90,
    tam: 0.72,
    medida: 'ancho',
    dist: 1.6,
  },
  {
    id: 'vals',
    titulo: 'Vals peruano',
    subtitulo: 'Todo un barrio en la voz',
    texto:
      'De raíces europeas, encontró en el Perú una cadencia propia. Entre jaranas, se transformó en canción para contar amores, ausencias y desigualdades. Sus versos guardan la memoria de quienes hicieron de la música una manera de narrar la vida.',
    dato: 'Algunos valses fueron poemas antes de ser canciones. Es el caso de Ódiame, cuya letra procede de un poema de Federico Barreto.',
    archivo: '02-vals-pareja.glb',
    base: 'plinto-redondo',
    x: 1.35,
    z: -3.0,
    giro: -10,
    tam: 1.72,
    dist: 3.0,
  },
  {
    id: 'tondero',
    titulo: 'Tondero',
    subtitulo: 'Vestimenta masculina',
    texto:
      'Sombrero de paja, camisa y pantalón componen el atuendo, evocando la vida campesina del norte. Según la localidad, se añaden fajas, alforjas y ponchos de hilo. El pañuelo acompaña el galanteo, mientras el vestido cobra movimiento entre rodeos y zapateos.',
    dato: 'La alforja que integra algunas versiones sirve para transportar provisiones. Su presencia lleva al baile una huella de la vida cotidiana.',
    archivo: '03-tondero-varon.glb',
    base: 'plinto',
    x: 2.3,
    z: 0.35,
    giro: -62,
    tam: 1.78,
    dist: 3.0,
  },
  {
    id: 'plaza',
    titulo: 'La Plaza Mayor de Lima',
    subtitulo: 'La Ciudad de los Reyes',
    texto:
      'Escenario de la fundación española de Lima en 1535 y de la proclamación de la emancipación en 1821. Entre balcones, portales y su antigua pileta, la vida cotidiana se entrelaza con los grandes acontecimientos del Perú.',
    dato: 'Antes de sus jardines, existió un mercado. Este abastecía a la ciudad y hacía circular sus noticias. Trasladado al Mercado Central, inaugurado en 1852, transformó su rostro: donde hoy contemplamos monumentos, antes se negociaba la compra del día.',
    archivo: 'cuadro-plaza.webp',
    base: 'pared',
    x: 3.47,
    z: -2.75,
    giro: -90,
    tam: 2.3,
    medida: 'ancho',
    dist: 2.6,
  },
];
