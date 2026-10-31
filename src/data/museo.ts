// Contenido del museo virtual: una casona central con cinco arcos, uno por género (propuesta "ideas.pdf").
// Las tomas ilustradas y sus puntos tocables se arman con herramientas/fija-ilustrada.
// Textos de muestra: validar con fuentes antes de la entrega final.

export type GeneroId = 'festejo' | 'marinera' | 'tondero' | 'vals' | 'polka';

export interface Objeto {
  id: string;
  categoria:
    | 'Vestimenta'
    | 'Instrumento'
    | 'Accesorio de baile'
    | 'Vida cotidiana'
    | 'Símbolo visual'
    | 'Personaje'
    | 'Historia'
    | 'Introducción';
  nombre: string;
  texto: string;
  dato: string;
}

export interface Genero {
  id: GeneroId;
  /** Número de la sala en el recorrido (boceto del equipo) */
  sala: number;
  nombre: string;
  /** Color distintivo de la sala */
  color: string;
  ambientacion: string;
  intro: string;
  interpretes: string[];
  /** true: la sala se puede recorrer completa */
  completa: boolean;
  objetos: Objeto[];
}

export const casona = {
  nombre: 'Casona limeña',
  intro:
    'Bienvenido al patio-salón de una casona limeña de estilo virreinal. Desde aquí se abren cinco arcos: cada uno lleva a un género de nuestra música criolla.',
  // En la sala principal solo se tocan los arcos de las cinco salas: sin piezas propias
  objetos: [] as Objeto[],
};

export const generos: Genero[] = [
  {
    id: 'marinera',
    sala: 2,
    nombre: 'Marinera limeña',
    color: '#93171e',
    ambientacion: 'Salón de jarana limeña, con muebles de época y balcón.',
    intro:
      'Baile de pareja de la costa central, elegante y pícaro. También se le llama canto de jarana: se canta en contrapunto y se baila con pañuelo, en un cortejo lleno de gracia.',
    interpretes: ['Augusto Ascuez', 'Elías Ascuez', 'Abelardo Vásquez'],
    completa: true,
    // Artes de la sala de marinera del equipo de Cinthia (Drive, "MUSEO VIRTUAL-VERSIÓN ACTUAL/SALA 3", 30 de octubre)
    objetos: [
      {
        id: 'tunante',
        categoria: 'Personaje',
        nombre: 'Abelardo Gamarra, "El Tunante"',
        texto:
          'Escritor y periodista (1850-1924), nacido en Huamachuco. En 1879, en plena Guerra del Pacífico, propuso que el baile que hasta entonces se llamaba "chilena" pasara a llamarse marinera, en homenaje a la Marina de Guerra del Perú.',
        dato: 'Escribió la letra de "La Concheperla", la primera marinera que se puso en partitura, con música de José Alvarado "Alvaradito".',
      },
      {
        id: 'marinera-antigua',
        categoria: 'Historia',
        nombre: 'La marinera de antes',
        texto:
          'En el siglo XIX este baile se llamaba zamacueca y se bailaba en callejones y fiestas populares: sombrero de paja, faja a la cintura y faldas de lunares, al son de guitarra, cajón y palmas.',
        dato: 'La zamacueca viajó por todo el Pacífico: de ella descienden la cueca chilena, la zamba argentina y la marinera peruana.',
      },
      {
        id: 'pareja-marinera',
        categoria: 'Accesorio de baile',
        nombre: 'Pareja de marinera limeña',
        texto:
          'Baile de salón elegante y pícaro, siempre con el pañuelo en la mano derecha. La dama luce vestido largo de volantes y flores en el cabello; el varón, terno y pañuelo blanco. Se baila con pasos cortos, sin levantar mucho los pies.',
        dato: 'La marinera limeña se baila en tres partes: la marinera, la resbalosa y la fuga.',
      },
      {
        id: 'marinera-actual',
        categoria: 'Historia',
        nombre: 'La marinera de hoy',
        texto:
          'Hoy la marinera limeña se baila en jaranas, peñas y concursos: vestido largo de volantes, terno oscuro, sombrero y pañuelo, en un cortejo de pasos cortos, giros y mucha elegancia.',
        dato: 'El 7 de octubre se celebra el Día de la Marinera, en homenaje al nacimiento de Augusto Ascuez, gran cantor de la jarana limeña.',
      },
      {
        id: 'ancla',
        categoria: 'Símbolo visual',
        nombre: 'Ancla con cuerda',
        texto:
          'El ancla recuerda de dónde viene el nombre del baile: la Marina de Guerra del Perú y sus marinos, héroes de la guerra de 1879. El azul del paño evoca el mar del Callao y el uniforme de la marinería.',
        dato: 'Con el nombre de marinera, el baile se volvió un símbolo de orgullo nacional en los años más difíciles de la guerra.',
      },
      {
        id: 'guitarra-cajon',
        categoria: 'Instrumento',
        nombre: 'Guitarra y cajón',
        texto:
          'La marinera limeña es canto de jarana: se canta en contrapunto y se acompaña con guitarras, cajón y palmas. La guitarra lleva la melodía y el cajón marca el ritmo del zapateo.',
        dato: 'En la jarana limeña se cantan "tres de a cinco": tres marineras seguidas, luego la resbalosa y las fugas.',
      },
    ],
  },
  {
    id: 'tondero',
    sala: 3,
    nombre: 'Tondero',
    color: '#5f7d2e',
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
        dato: 'El tondero se baila en tres partes: la glosa, el dulce y la fuga.',
      },
      {
        id: 'checo',
        categoria: 'Instrumento',
        nombre: 'Checo',
        texto:
          'Es una calabaza seca y hueca, abierta por un lado, que se golpea con las manos. Su sonido grave y redondo marca el ritmo de la música norteña.',
        dato: 'El checo nace del campo: se hace con un mate o calabaza, un fruto que se cultiva en la costa norte.',
      },
      {
        id: 'panuelo-color',
        categoria: 'Accesorio de baile',
        nombre: 'Pañuelo de color',
        texto:
          'Como en la marinera, el pañuelo guía el cortejo. En el tondero suele ser de colores vivos y acompaña giros, persecuciones y coqueteos.',
        dato: 'Muchos pasos del tondero imitan el vuelo y el cortejo de las aves.',
      },
      {
        id: 'canasta',
        categoria: 'Vida cotidiana',
        nombre: 'Canasta de cosecha',
        texto:
          'La canasta recuerda la vida del campo piurano: la cosecha, los mercados y las fiestas del pueblo, donde el tondero no podía faltar.',
        dato: 'El algarrobo, árbol del bosque seco, es un símbolo de Piura y de la costa norte.',
      },
      {
        id: 'mapa',
        categoria: 'Símbolo visual',
        nombre: 'Mapa de Piura',
        texto:
          'Piura es la cuna del tondero. Desde sus valles y pueblos, el baile se extendió por toda la costa norte del Perú.',
        dato: 'El tondero es fruto de la mezcla de herencias españolas, africanas e indígenas en la costa norte.',
      },
    ],
  },
  {
    id: 'vals',
    sala: 1,
    nombre: 'Vals criollo',
    color: '#2b3f6b',
    ambientacion: 'Salón nocturno de luz tenue, con farolas y balcón con vista a la ciudad.',
    intro:
      'El vals criollo nació en los barrios y callejones de Lima y se volvió la voz de la ciudad: canciones de amor, de barrio y de nostalgia, en compás de tres tiempos y con guitarras.',
    interpretes: ['Felipe Pinglo Alva', 'Chabuca Granda', 'Lucha Reyes', 'Óscar Avilés', 'Jesús Vásquez', 'Arturo "Zambo" Cavero'],
    completa: true,
    // Artes de la sala 1 del equipo de Cinthia (Drive, "MUSEO VIRTUAL-VERSIÓN ACTUAL", 23 de octubre)
    objetos: [
      {
        id: 'pareja',
        categoria: 'Vestimenta',
        nombre: 'Pareja de vals',
        texto:
          'En las fiestas criollas el vals se baila en pareja, abrazados y girando por el salón. Ellas lucían vestidos de volantes y ellos terno oscuro con corbata de lazo.',
        dato: 'El vals llegó a Lima en el siglo XIX como baile de salón europeo; en los barrios se acriolló con guitarras y, después, con cajón.',
      },
      {
        id: 'pintura',
        categoria: 'Símbolo visual',
        nombre: 'Pintura de un baile de salón',
        texto:
          'Antes de sonar en callejones y quintas, el vals se bailó en los salones elegantes de Lima. Esta pintura recuerda esas noches de gala, con velas, cuadros y piso de madera.',
        dato: 'El Día de la Canción Criolla, cada 31 de octubre, se instituyó en 1944.',
      },
      {
        id: 'busto-pinglo',
        categoria: 'Símbolo visual',
        nombre: 'Busto de Felipe Pinglo Alva',
        texto:
          'Felipe Pinglo Alva (1899-1936), nacido en los Barrios Altos de Lima, es llamado el padre de la música criolla. Sus valses retratan el amor, el trabajo y la vida del barrio.',
        dato: '"El plebeyo" cuenta un amor imposible entre clases sociales y es uno de los valses más queridos del Perú.',
      },
      {
        id: 'guitarra',
        categoria: 'Instrumento',
        nombre: 'Guitarra criolla',
        texto:
          'La guitarra es el alma del vals: una lleva los acordes y otra, la primera guitarra, adorna la melodía con punteos y bordoneos.',
        dato: 'Óscar Avilés fue llamado "la primera guitarra del Perú".',
      },
      {
        id: 'cancionero',
        categoria: 'Vida cotidiana',
        nombre: 'Cancionero de vals',
        texto:
          'Las letras de los valses se copiaban en cuadernos y se imprimían en cancioneros que se vendían en la calle. Así, cualquiera podía cantar en la jarana las canciones de moda.',
        dato: 'Chabuca Granda compuso "La flor de la canela" (1950), un paseo por la Lima antigua, del puente a la alameda.',
      },
    ],
  },
  {
    id: 'polka',
    sala: 4,
    nombre: 'Polka criolla',
    color: '#a24b78',
    ambientacion: 'Salón de baile social de época, con guirnaldas y pista de baile.',
    intro:
      'La polka llegó de Europa en el siglo XIX y en Lima se acriolló: rápida, juguetona y bailable, en compás de dos tiempos, con guitarras y mandolinas.',
    interpretes: [],
    completa: true,
    // Artes de la sala de polka del equipo de Cinthia (Drive, "MUSEO VIRTUAL-VERSIÓN ACTUAL/SALA 2", 30 de octubre)
    objetos: [
      {
        id: 'acordeon',
        categoria: 'Instrumento',
        nombre: 'Acordeón',
        texto:
          'De fuelle y teclas, el acordeón llegó de Europa junto con la polka y se sumó a guitarras y mandolinas en los bailes de salón y de barrio. Su sonido alegre y continuo marca el paso rápido de la polka.',
        dato: 'El acordeón se patentó en Viena en 1829, en los mismos años en que la polka empezaba a bailarse en Europa.',
      },
      {
        id: 'cuadro-callao',
        categoria: 'Símbolo visual',
        nombre: 'Cuadro del puerto del Callao',
        texto:
          'Ancla, muelle y gaviotas: el Callao es uno de los barrios de origen de la polka criolla. En el puerto, músicos y marinos la tocaban rápida y alegre, y de ahí salieron muchas polkas dedicadas al primer puerto.',
        dato: 'Al Callao se le llama el primer puerto del Perú y a su gente, chalacos; muchas polkas criollas nacieron en sus barrios de pescadores y estibadores.',
      },
      {
        id: 'pareja-polka',
        categoria: 'Vestimenta',
        nombre: 'Pareja de polka',
        texto:
          'La polka se baila en pareja, abrazados y con pasos cortos y saltados. Ella, de vestido entallado con volantes y abanico; él, de terno oscuro y corbatín: así se vestía en los bailes de sociedad de inicios del siglo XX.',
        dato: 'De la fiebre por la polka en el siglo XIX viene el nombre en inglés del estampado de lunares: "polka dots".',
      },
      {
        id: 'mapa-bohemia',
        categoria: 'Historia',
        nombre: 'Mapa: de Bohemia al Perú',
        texto:
          'La polka nació en Bohemia, en la actual República Checa, hacia 1830, y en pocos años se bailaba en París, Londres y toda Europa. Los barcos y los inmigrantes la trajeron a Lima y al Callao, donde se acriolló con guitarras.',
        dato: 'Su nombre vendría del checo "půlka", que significa "medio paso", por sus pasos cortos.',
      },
      {
        id: 'guardia-vieja',
        categoria: 'Personaje',
        nombre: 'La Guardia Vieja',
        texto:
          'Así se llama a la primera generación de músicos criollos de Lima, de fines del siglo XIX e inicios del XX: tocaban valses, polkas y marineras en jaranas y callejones, con guitarras, mandolinas y laúdes, antes de los discos y la radio.',
        dato: 'Muchas canciones de la Guardia Vieja no tienen autor conocido: pasaron de boca en boca. Felipe Pinglo recogió esa herencia y abrió la etapa siguiente de la canción criolla.',
      },
    ],
  },
  {
    id: 'festejo',
    sala: 5,
    nombre: 'Festejo',
    color: '#c4561f',
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
        dato: 'Cada 4 de junio se celebra el Día de la Cultura Afroperuana, en homenaje al nacimiento de Nicomedes Santa Cruz.',
      },
      {
        id: 'quijada',
        categoria: 'Instrumento',
        nombre: 'Quijada de burro',
        texto:
          'Es la mandíbula seca de un burro, mula o caballo. Al golpearla con la palma, los dientes sueltos vibran como un cascabel; también se raspa con un palillo.',
        dato: 'La quijada nació de hacer música con lo que se tenía a mano, y hoy es un símbolo de la percusión afroperuana.',
      },
      {
        id: 'cinta',
        categoria: 'Accesorio de baile',
        nombre: 'Cinta de cintura',
        texto:
          'Cintas y fajas de colores marcan la cintura y resaltan el movimiento de cadera, protagonista del festejo.',
        dato: 'En 2001 el cajón peruano fue declarado Patrimonio Cultural de la Nación.',
      },
      {
        id: 'mascara',
        categoria: 'Vida cotidiana',
        nombre: 'Máscara festiva decorativa',
        texto:
          'Las máscaras recuerdan las comparsas populares, como el son de los diablos, que recorría las calles de Lima en carnavales y fiestas.',
        dato: 'Esta máscara es un recurso de ambientación: evoca lo festivo, pero no es un elemento obligatorio del festejo.',
      },
      {
        id: 'cajita',
        categoria: 'Símbolo visual',
        nombre: 'Cajita afroperuana',
        texto:
          'Pequeña caja de madera con tapa, que se cuelga del cuello o la cintura. Se toca abriendo y cerrando la tapa y golpeando un costado con un palillo.',
        dato: 'La cajita acompaña danzas como el son de los diablos y es uno de los sonidos más reconocibles de la música afroperuana.',
      },
    ],
  },
];
