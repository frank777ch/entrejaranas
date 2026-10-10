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
    subtitulo: 'Polka criolla',
    texto:
      'La polka llegó de Europa central en el siglo XIX y en Lima se volvió criolla: alegre, saltarina y de compás binario. Las damas la bailaban con abanico en mano, un accesorio para refrescarse… y también para coquetear.',
    dato: 'En la polka criolla la pareja avanza con pasitos saltados y vueltas rápidas: es de los ritmos más alegres del repertorio criollo.',
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
      'Nacido en Barrios Altos (Lima, 1899–1936), es considerado el padre de la música criolla. Compuso valses, polkas, marineras y one-steps que retratan la vida, los amores y las penas del pueblo limeño.',
    dato: 'Su vals «El plebeyo» es una de las canciones más queridas y cantadas del Perú.',
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
      'Es el baile de pareja más representativo del Perú. En Lima se baila con elegancia y picardía, pañuelo en mano, al compás de guitarras y cajón. Su nombre se lo dio en 1879 Abelardo Gamarra, «El Tunante», en homenaje a la Marina de Guerra; antes se la conocía como zamacueca o chilena.',
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
    subtitulo: 'Instrumento criollo',
    texto:
      'Es la mandíbula seca de un burro, caballo o mula. Al golpearla con el puño, los dientes sueltos vibran en sus cavidades y suenan como una sonaja; también se raspa con un palo sobre las muelas. Es un instrumento de percusión de origen afroperuano.',
    dato: 'Acompaña al cajón en el festejo, el landó y la zamacueca. ¡Es de los pocos instrumentos que nacen de un hueso!',
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
    subtitulo: 'Ritmo de nuestra tierra',
    texto:
      'Llegó de Europa en el siglo XIX y en los callejones y solares de Lima se volvió nuestro: más ágil, más pícaro, con guitarra y cajón. Se baila en pareja, con giros cortos, mucha cercanía y complicidad.',
    dato: 'Cada 31 de octubre celebramos el Día de la Canción Criolla, instituido en 1944.',
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
    subtitulo: 'Vestimenta del varón',
    texto:
      'Baile alegre del norte del Perú, sobre todo de Piura y Lambayeque. Representa el cortejo de una pareja, inspirado en el galanteo de las aves. El varón luce sombrero de paja, camisa blanca, faja, pañuelo y una manta tejida al hombro.',
    dato: 'El tondero tiene tres partes: glosa, dulce y fuga. Se acompaña con guitarra y cajón.',
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
      'Desde la fundación de Lima, la Plaza Mayor fue su corazón. A su alrededor se levantan la Catedral, el Palacio de Gobierno y la Municipalidad, y en ella se cruzaban vendedores, paseantes, aguadores y músicos: el escenario donde nació el alma criolla.',
    dato: 'Francisco Pizarro fundó Lima el 18 de enero de 1535 con el nombre de Ciudad de los Reyes.',
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
