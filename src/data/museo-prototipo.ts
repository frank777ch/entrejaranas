// Contenido compartido por los dos prototipos del museo (2D ilustrado y 360°).
// Sigue la propuesta "ideas.pdf": una casona central con cinco arcos, uno por género.
// Textos de muestra: validar con fuentes antes de la entrega final.

export type GeneroId = 'festejo' | 'marinera' | 'tondero' | 'vals' | 'polka';
/** Pared de la casona donde está el arco, vista desde el centro */
export type Pared = 'frente' | 'derecha' | 'fondo' | 'izquierda';

export interface Objeto {
  id: string;
  categoria: 'Vestimenta' | 'Instrumento' | 'Accesorio de baile' | 'Vida cotidiana' | 'Símbolo visual' | 'Introducción';
  nombre: string;
  texto: string;
  /** Qué sonaría al abrir la ficha (el audio real se agrega en la versión final) */
  audio: string;
  dato: string;
}

export interface Genero {
  id: GeneroId;
  nombre: string;
  /** Color distintivo de la sala */
  color: string;
  pared: Pared;
  /** Orden del arco en su pared, de izquierda a derecha */
  posicion: number;
  ambientacion: string;
  intro: string;
  interpretes: string[];
  /** true: la sala se puede recorrer completa en el prototipo */
  completa: boolean;
  objetos: Objeto[];
}

export const casona = {
  nombre: 'Casona limeña',
  intro:
    'Bienvenido al patio-salón de una casona limeña de estilo virreinal. Desde aquí se abren cinco arcos: cada uno lleva a un género de nuestra música criolla.',
  objetos: [
    {
      id: 'gramofono',
      categoria: 'Introducción',
      nombre: 'Gramófono',
      texto:
        'La música criolla se escuchó primero en jaranas, callejones y salones. Con los discos y la radio del siglo XX llegó a todas las casas de Lima y del país.',
      audio: 'Vals de fondo, a bajo volumen',
      dato: 'Cada 31 de octubre se celebra en el Perú el Día de la Canción Criolla.',
    },
    {
      id: 'espejo',
      categoria: 'Introducción',
      nombre: 'Espejo de marco dorado',
      texto:
        'Lo criollo es el reflejo de muchas herencias: española, africana y andina se mezclaron en la costa y dieron forma a ritmos, bailes y formas de celebrar.',
      audio: 'Guitarra criolla',
      dato: 'Cinco arcos, cinco géneros: festejo, marinera limeña, tondero, vals criollo y polka. Elige uno y asómate.',
    },
  ] satisfies Objeto[],
};

export const generos: Genero[] = [
  {
    id: 'marinera',
    nombre: 'Marinera limeña',
    color: '#93171e',
    pared: 'frente',
    posicion: 0,
    ambientacion: 'Salón de jarana limeña, con muebles de época y balcón.',
    intro:
      'Baile de pareja de la costa central, elegante y pícaro. También se le llama canto de jarana: se canta en contrapunto y se baila con pañuelo, en un cortejo lleno de gracia.',
    interpretes: ['Augusto Ascuez', 'Elías Ascuez', 'Abelardo Vásquez'],
    completa: true,
    objetos: [
      {
        id: 'manto',
        categoria: 'Vestimenta',
        nombre: 'Traje y manto femenino',
        texto:
          'La bailarina luce un traje de época de falda amplia, que se recoge y se mueve con el baile. El manto y los adornos hablan de la elegancia de los salones limeños.',
        audio: 'Marinera limeña instrumental',
        dato: 'La marinera limeña se baila en tres partes: la marinera, la resbalosa y la fuga.',
      },
      {
        id: 'arpa',
        categoria: 'Instrumento',
        nombre: 'Arpa',
        texto:
          'El arpa llegó al Perú con los españoles y se volvió parte de la música popular. Su sonido acompañó muchas reuniones de jarana junto a guitarras y cajón.',
        audio: 'Fragmento de arpa',
        dato: 'Antes de llamarse marinera, este baile era conocido como zamacueca o chilena. El nombre "marinera" se le dio en 1879, en homenaje a la Marina de Guerra del Perú.',
      },
      {
        id: 'panuelo',
        categoria: 'Accesorio de baile',
        nombre: 'Pañuelo blanco',
        texto:
          'El pañuelo es el gran compañero del baile: se agita, se ofrece y se esconde. Con él la pareja conversa sin palabras durante el cortejo.',
        audio: 'Palmas y cajón',
        dato: 'Bailarines y bailarinas usan el pañuelo en la mano derecha y lo mueven al compás de la música.',
      },
      {
        id: 'abanico',
        categoria: 'Vida cotidiana',
        nombre: 'Abanico',
        texto:
          'En los salones limeños, el abanico era señal de elegancia y distinción. Servía para refrescarse, pero también para coquetear y comunicarse con discreción.',
        audio: 'Murmullo de salón y guitarra',
        dato: 'En 1929, El Comercio hizo una encuesta que dividió a Lima entre quienes defendían la gracia del abanico y quienes preferían tener las manos libres.',
      },
      {
        id: 'cuadro',
        categoria: 'Símbolo visual',
        nombre: 'Cuadro de una pareja bailando',
        texto:
          'Las pinturas costumbristas retrataron la vida de Lima: sus fiestas, sus calles y sus bailes. Una pareja bailando resume el espíritu de la jarana.',
        audio: 'Canto de jarana',
        dato: 'Pancho Fierro, acuarelista limeño del siglo XIX, pintó escenas de bailes populares que hoy son una fuente para conocer esa época.',
      },
    ],
  },
  {
    id: 'tondero',
    nombre: 'Tondero',
    color: '#5f7d2e',
    pared: 'derecha',
    posicion: 0,
    ambientacion: 'Casa norteña de luz clara, con algarrobos y paisaje de Piura al fondo.',
    intro: 'Baile alegre del norte del Perú, sobre todo de Piura y Lambayeque. Evoca el cortejo de las aves y el campo norteño.',
    interpretes: [],
    completa: false,
    objetos: [],
  },
  {
    id: 'vals',
    nombre: 'Vals criollo',
    color: '#2b3f6b',
    pared: 'derecha',
    posicion: 1,
    ambientacion: 'Salón nocturno de luz tenue, con farolas y balcón con vista a la ciudad.',
    intro: 'El vals criollo nació en los barrios de Lima y se volvió la voz de la ciudad. Felipe Pinglo Alva es su gran compositor.',
    interpretes: [],
    completa: false,
    objetos: [],
  },
  {
    id: 'polka',
    nombre: 'Polka criolla',
    color: '#a24b78',
    pared: 'izquierda',
    posicion: 0,
    ambientacion: 'Salón de baile social de época, con guirnaldas y pista de baile.',
    intro: 'La polka llegó de Europa en el siglo XIX y en Lima se acriolló: más rápida, juguetona y bailable.',
    interpretes: [],
    completa: false,
    objetos: [],
  },
  {
    id: 'festejo',
    nombre: 'Festejo',
    color: '#c4561f',
    pared: 'izquierda',
    posicion: 1,
    ambientacion: 'Patio o callejón afroperuano, de colores cálidos y paredes de adobe.',
    intro: 'Ritmo afroperuano lleno de energía, con cajón, quijada y palmas. Es celebración, memoria y resistencia.',
    interpretes: [],
    completa: false,
    objetos: [],
  },
];

/** Objetos de cada categoría para las salas que aún no se recorren (tabla del PDF) */
export const objetosPorSala: Record<GeneroId, string[]> = {
  festejo: ['Falda amplia', 'Quijada de burro', 'Cinta de cintura', 'Máscara festiva decorativa', 'Cajita afroperuana'],
  marinera: ['Manto femenino', 'Arpa', 'Pañuelo blanco', 'Abanico tradicional', 'Cuadro de una pareja bailando'],
  tondero: ['Sombrero de paja', 'Checo', 'Pañuelo de color', 'Canasta de cosecha', 'Mapa de Piura'],
  vals: ['Saco elegante', 'Guitarra criolla', 'Partitura musical', 'Farol antiguo', 'Disco de vinilo'],
  polka: ['Chaleco de época', 'Mandolina', 'Zapatos de baile', 'Invitación antigua de baile', 'Reloj de bolsillo antiguo'],
};
