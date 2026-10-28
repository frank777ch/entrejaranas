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
  /** Número de la sala en el recorrido (boceto del equipo, prototipo C) */
  sala: number;
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
  /** Piezas del prototipo C cuando ya llegaron las artes del equipo de diseño (reemplazan a `objetos`) */
  objetosFija?: Objeto[];
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
    // Las tres piezas siguientes completan las cinco de la sala principal en el prototipo C
    {
      id: 'pinglo',
      categoria: 'Símbolo visual',
      nombre: 'Retrato de Felipe Pinglo',
      texto:
        'Felipe Pinglo Alva (1899-1936) es llamado el padre de la música criolla. Compuso cerca de 300 canciones que retratan la vida de los barrios de Lima.',
      audio: 'El plebeyo, vals de Felipe Pinglo',
      dato: 'Su vals "El plebeyo" cuenta un amor imposible entre clases sociales y es una de las canciones criollas más conocidas.',
    },
    {
      id: 'plaza',
      categoria: 'Símbolo visual',
      nombre: 'Cuadro de la Plaza de Armas',
      texto:
        'Lima fue el gran escenario de la música criolla: sus plazas, balcones y callejones vieron nacer serenatas, jaranas y valses.',
      audio: 'Vals de serenata',
      dato: 'Los callejones y quintas de los Barrios Altos y el Rímac fueron cuna de muchos compositores criollos.',
    },
    {
      id: 'arana',
      categoria: 'Vida cotidiana',
      nombre: 'Araña de velas',
      texto:
        'Las jaranas se celebraban en los salones de las casonas, bajo la luz de arañas de velas. Una buena jarana podía durar toda la noche y hasta días.',
      audio: 'Guitarras y cajón de jarana',
      dato: 'Antes de la luz eléctrica, las velas de las arañas se encendían una a una con una vara larga.',
    },
  ] satisfies Objeto[],
};

export const generos: Genero[] = [
  {
    id: 'marinera',
    sala: 2,
    nombre: 'Marinera limeña',
    color: '#93171e',
    pared: 'izquierda',
    posicion: 1,
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
        audio: 'Guitarra de salón',
        dato: 'En 1929, El Comercio hizo una encuesta que dividió a Lima entre quienes defendían la gracia del abanico y quienes preferían tener las manos libres.',
      },
      {
        id: 'cuadro',
        categoria: 'Símbolo visual',
        nombre: 'Cuadro de una pareja bailando',
        texto:
          'Las pinturas costumbristas retrataron la vida de Lima: sus fiestas, sus calles y sus bailes. Una pareja bailando resume el espíritu de la jarana.',
        audio: 'Marinera con guitarra y cajón',
        dato: 'Pancho Fierro, acuarelista limeño del siglo XIX, pintó escenas de bailes populares que hoy son una fuente para conocer esa época.',
      },
    ],
  },
  {
    id: 'tondero',
    sala: 3,
    nombre: 'Tondero',
    color: '#5f7d2e',
    pared: 'izquierda',
    posicion: 0,
    ambientacion: 'Casa norteña de luz clara, con algarrobos y paisaje de Piura al fondo.',
    intro:
      'Baile alegre del norte del Perú, sobre todo de Piura y Lambayeque. Recrea el cortejo de las aves: la pareja se busca, se esquiva y se enamora al ritmo de guitarras, cajón y checo.',
    interpretes: [],
    completa: true,
    objetos: [
      {
        id: 'sombrero',
        categoria: 'Vestimenta',
        nombre: 'Sombrero de paja',
        texto:
          'En Piura el sombrero de paja se teje a mano, con paciencia y paja muy fina. Protege del sol del norte y completa el traje del bailarín de tondero.',
        audio: 'Tondero con guitarra y cajón',
        dato: 'El tondero se baila en tres partes: la glosa, el dulce y la fuga.',
      },
      {
        id: 'checo',
        categoria: 'Instrumento',
        nombre: 'Checo',
        texto:
          'Es una calabaza seca y hueca, abierta por un lado, que se golpea con las manos. Su sonido grave y redondo marca el ritmo de la música norteña.',
        audio: 'Ritmo de checo',
        dato: 'El checo nace del campo: se hace con un mate o calabaza, un fruto que se cultiva en la costa norte.',
      },
      {
        id: 'panuelo-color',
        categoria: 'Accesorio de baile',
        nombre: 'Pañuelo de color',
        texto:
          'Como en la marinera, el pañuelo guía el cortejo. En el tondero suele ser de colores vivos y acompaña giros, persecuciones y coqueteos.',
        audio: 'Guitarra y palmas',
        dato: 'Muchos pasos del tondero imitan el vuelo y el cortejo de las aves.',
      },
      {
        id: 'canasta',
        categoria: 'Vida cotidiana',
        nombre: 'Canasta de cosecha',
        texto:
          'La canasta recuerda la vida del campo piurano: la cosecha, los mercados y las fiestas del pueblo, donde el tondero no podía faltar.',
        audio: 'Fiesta de pueblo norteño',
        dato: 'El algarrobo, árbol del bosque seco, es un símbolo de Piura y de la costa norte.',
      },
      {
        id: 'mapa',
        categoria: 'Símbolo visual',
        nombre: 'Mapa de Piura',
        texto:
          'Piura es la cuna del tondero. Desde sus valles y pueblos, el baile se extendió por toda la costa norte del Perú.',
        audio: 'Tondero completo',
        dato: 'El tondero es fruto de la mezcla de herencias españolas, africanas e indígenas en la costa norte.',
      },
    ],
  },
  {
    id: 'vals',
    sala: 1,
    nombre: 'Vals criollo',
    color: '#2b3f6b',
    pared: 'frente',
    posicion: 0,
    ambientacion: 'Salón nocturno de luz tenue, con farolas y balcón con vista a la ciudad.',
    intro:
      'El vals criollo nació en los barrios y callejones de Lima y se volvió la voz de la ciudad: canciones de amor, de barrio y de nostalgia, en compás de tres tiempos y con guitarras.',
    interpretes: ['Felipe Pinglo Alva', 'Chabuca Granda', 'Lucha Reyes', 'Óscar Avilés', 'Jesús Vásquez', 'Arturo "Zambo" Cavero'],
    completa: true,
    objetos: [
      {
        id: 'saco',
        categoria: 'Vestimenta',
        nombre: 'Saco elegante',
        texto:
          'Para las serenatas y las reuniones, los músicos criollos vestían saco, camisa blanca y, a veces, pañuelo al cuello. La elegancia era una forma de respeto a la música.',
        audio: 'Vals instrumental',
        dato: 'El Día de la Canción Criolla, cada 31 de octubre, se instituyó en 1944.',
      },
      {
        id: 'guitarra',
        categoria: 'Instrumento',
        nombre: 'Guitarra criolla',
        texto:
          'La guitarra es el alma del vals: una lleva los acordes y otra, la primera guitarra, adorna la melodía con punteos y bordoneos.',
        audio: 'Punteo de guitarra criolla',
        dato: 'Óscar Avilés fue llamado "la primera guitarra del Perú".',
      },
      {
        id: 'partitura',
        categoria: 'Accesorio de baile',
        nombre: 'Partitura musical',
        texto:
          'Muchos valses se aprendían de oído, de jarana en jarana. Otros quedaron escritos en partituras y cancioneros que pasaban de mano en mano por los barrios.',
        audio: 'Melodía del vals',
        dato: 'Felipe Pinglo Alva compuso "El plebeyo", uno de los valses más queridos del Perú.',
      },
      {
        id: 'farol',
        categoria: 'Vida cotidiana',
        nombre: 'Farol antiguo',
        texto:
          'Los faroles iluminaban las calles y callejones de la Lima antigua, escenario de serenatas y jaranas que duraban hasta el amanecer.',
        audio: 'Vals nocturno',
        dato: 'Chabuca Granda compuso "La flor de la canela" (1950), un paseo por la Lima antigua, del puente a la alameda.',
      },
      {
        id: 'disco',
        categoria: 'Símbolo visual',
        nombre: 'Disco de vinilo',
        texto:
          'Con los discos y la radio, el vals criollo salió de los barrios y llegó a todo el país. Cada familia tenía sus valses favoritos.',
        audio: 'Vals de disco antiguo',
        dato: 'Lucha Reyes, "la Morena de Oro del Perú", grabó valses que siguen sonando en cada fiesta.',
      },
    ],
    // Artes de la sala 1 del equipo de Cinthia (Drive, "MUSEO VIRTUAL-VERSIÓN ACTUAL", 23 de octubre)
    objetosFija: [
      {
        id: 'pareja-vals',
        categoria: 'Vestimenta',
        nombre: 'Pareja de vals',
        texto:
          'En las fiestas criollas el vals se baila en pareja, abrazados y girando por el salón. Ellas lucían vestidos de volantes y ellos terno oscuro con corbata de lazo.',
        audio: 'Vals para bailar',
        dato: 'El vals llegó a Lima en el siglo XIX como baile de salón europeo; en los barrios se acriolló con guitarras y, después, con cajón.',
      },
      {
        id: 'pintura-vals',
        categoria: 'Símbolo visual',
        nombre: 'Pintura de un baile de salón',
        texto:
          'Antes de sonar en callejones y quintas, el vals se bailó en los salones elegantes de Lima. Esta pintura recuerda esas noches de gala, con velas, cuadros y piso de madera.',
        audio: 'Vals instrumental',
        dato: 'El Día de la Canción Criolla, cada 31 de octubre, se instituyó en 1944.',
      },
      {
        id: 'busto-pinglo',
        categoria: 'Símbolo visual',
        nombre: 'Busto de Felipe Pinglo Alva',
        texto:
          'Felipe Pinglo Alva (1899-1936), nacido en los Barrios Altos de Lima, es llamado el padre de la música criolla. Sus valses retratan el amor, el trabajo y la vida del barrio.',
        audio: 'El plebeyo, vals de Felipe Pinglo',
        dato: '"El plebeyo" cuenta un amor imposible entre clases sociales y es uno de los valses más queridos del Perú.',
      },
      {
        id: 'guitarra-vals',
        categoria: 'Instrumento',
        nombre: 'Guitarra criolla',
        texto:
          'La guitarra es el alma del vals: una lleva los acordes y otra, la primera guitarra, adorna la melodía con punteos y bordoneos.',
        audio: 'Punteo de guitarra criolla',
        dato: 'Óscar Avilés fue llamado "la primera guitarra del Perú".',
      },
      {
        id: 'cancionero',
        categoria: 'Vida cotidiana',
        nombre: 'Cancionero de vals',
        texto:
          'Las letras de los valses se copiaban en cuadernos y se imprimían en cancioneros que se vendían en la calle. Así, cualquiera podía cantar en la jarana las canciones de moda.',
        audio: 'La flor de la canela',
        dato: 'Chabuca Granda compuso "La flor de la canela" (1950), un paseo por la Lima antigua, del puente a la alameda.',
      },
    ],
  },
  {
    id: 'polka',
    sala: 4,
    nombre: 'Polka criolla',
    color: '#a24b78',
    pared: 'derecha',
    posicion: 0,
    ambientacion: 'Salón de baile social de época, con guirnaldas y pista de baile.',
    intro:
      'La polka llegó de Europa en el siglo XIX y en Lima se acriolló: rápida, juguetona y bailable, en compás de dos tiempos, con guitarras y mandolinas.',
    interpretes: [],
    completa: true,
    objetos: [
      {
        id: 'chaleco',
        categoria: 'Vestimenta',
        nombre: 'Chaleco de época',
        texto:
          'En los bailes sociales de época, los caballeros vestían chaleco, saco y corbata. La polka se bailaba en salones, clubes y fiestas de barrio.',
        audio: 'Polka instrumental',
        dato: 'La polka nació en Bohemia, en la actual República Checa, hacia 1830.',
      },
      {
        id: 'mandolina',
        categoria: 'Instrumento',
        nombre: 'Mandolina',
        texto:
          'De cuerdas dobles y sonido brillante, la mandolina adorna la melodía con trémolos rápidos, ideales para el ritmo saltarín de la polka.',
        audio: 'Mandolina en trémolo',
        dato: 'Las estudiantinas, grupos con mandolinas, bandurrias y guitarras, fueron muy populares en el Perú a inicios del siglo XX.',
      },
      {
        id: 'zapatos',
        categoria: 'Accesorio de baile',
        nombre: 'Zapatos de baile',
        texto:
          'La polka se baila con pasos cortos, rápidos y saltados. Los zapatos de baile debían ser firmes y ligeros para aguantar toda la noche.',
        audio: 'Polka rápida',
        dato: 'Su compás de dos tiempos la hace una de las danzas más ágiles del repertorio criollo.',
      },
      {
        id: 'invitacion',
        categoria: 'Vida cotidiana',
        nombre: 'Invitación antigua de baile',
        texto:
          'Las invitaciones impresas anunciaban los bailes de sociedad y su programa de piezas: valses, polkas y otros ritmos de moda.',
        audio: 'Salón de baile',
        dato: 'De la fiebre por la polka en el siglo XIX viene el nombre en inglés del estampado de lunares: "polka dots".',
      },
      {
        id: 'reloj',
        categoria: 'Símbolo visual',
        nombre: 'Reloj de bolsillo antiguo',
        texto:
          'El reloj de bolsillo, colgado de una cadena, era el accesorio del caballero elegante y recuerda los salones de baile de inicios del siglo XX.',
        audio: 'Polka con mandolina',
        dato: 'En la polka criolla la guitarra marca un bajo y un acorde alternados, como un paso que invita a saltar.',
      },
    ],
  },
  {
    id: 'festejo',
    sala: 5,
    nombre: 'Festejo',
    color: '#c4561f',
    pared: 'derecha',
    posicion: 1,
    ambientacion: 'Patio o callejón afroperuano, de colores cálidos y paredes de adobe.',
    intro:
      'Ritmo afroperuano lleno de energía, con cajón, quijada y palmas. Es celebración, memoria y resistencia, y se baila con alegría y movimiento de cadera.',
    interpretes: ['Nicomedes Santa Cruz', 'Victoria Santa Cruz', 'Porfirio Vásquez', 'Perú Negro', 'Eva Ayllón', 'Susana Baca'],
    completa: true,
    objetos: [
      {
        id: 'falda',
        categoria: 'Vestimenta',
        nombre: 'Falda amplia',
        texto:
          'Las bailarinas de festejo usan faldas amplias y coloridas que giran y se levantan con cada movimiento de cadera.',
        audio: 'Festejo con cajón y palmas',
        dato: 'Cada 4 de junio se celebra el Día de la Cultura Afroperuana, en homenaje al nacimiento de Nicomedes Santa Cruz.',
      },
      {
        id: 'quijada',
        categoria: 'Instrumento',
        nombre: 'Quijada de burro',
        texto:
          'Es la mandíbula seca de un burro, mula o caballo. Al golpearla con la palma, los dientes sueltos vibran como un cascabel; también se raspa con un palillo.',
        audio: 'Quijada y cajón',
        dato: 'La quijada nació de hacer música con lo que se tenía a mano, y hoy es un símbolo de la percusión afroperuana.',
      },
      {
        id: 'cinta',
        categoria: 'Accesorio de baile',
        nombre: 'Cinta de cintura',
        texto:
          'Cintas y fajas de colores marcan la cintura y resaltan el movimiento de cadera, protagonista del festejo.',
        audio: 'Palmas y cajón',
        dato: 'En 2001 el cajón peruano fue declarado Patrimonio Cultural de la Nación.',
      },
      {
        id: 'mascara',
        categoria: 'Vida cotidiana',
        nombre: 'Máscara festiva decorativa',
        texto:
          'Las máscaras recuerdan las comparsas populares, como el son de los diablos, que recorría las calles de Lima en carnavales y fiestas.',
        audio: 'Comparsa de cajón, quijada y palmas',
        dato: 'Esta máscara es un recurso de ambientación: evoca lo festivo, pero no es un elemento obligatorio del festejo.',
      },
      {
        id: 'cajita',
        categoria: 'Símbolo visual',
        nombre: 'Cajita afroperuana',
        texto:
          'Pequeña caja de madera con tapa, que se cuelga del cuello o la cintura. Se toca abriendo y cerrando la tapa y golpeando un costado con un palillo.',
        audio: 'Cajita y cajón',
        dato: 'La cajita acompaña danzas como el son de los diablos y es uno de los sonidos más reconocibles de la música afroperuana.',
      },
    ],
  },
];

/** Objetos de cada sala según la tabla del PDF (se muestran en el asomo) */
export const objetosPorSala: Record<GeneroId, string[]> = {
  festejo: ['Falda amplia', 'Quijada de burro', 'Cinta de cintura', 'Máscara festiva decorativa', 'Cajita afroperuana'],
  marinera: ['Manto femenino', 'Arpa', 'Pañuelo blanco', 'Abanico tradicional', 'Cuadro de una pareja bailando'],
  tondero: ['Sombrero de paja', 'Checo', 'Pañuelo de color', 'Canasta de cosecha', 'Mapa de Piura'],
  vals: ['Saco elegante', 'Guitarra criolla', 'Partitura musical', 'Farol antiguo', 'Disco de vinilo'],
  polka: ['Chaleco de época', 'Mandolina', 'Zapatos de baile', 'Invitación antigua de baile', 'Reloj de bolsillo antiguo'],
};
