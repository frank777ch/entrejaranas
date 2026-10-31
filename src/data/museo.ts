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
    // Piezas pensadas con el equipo de diseño (Drive, SALA 3, 30 de octubre); la sala la pinta Codex
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
    // Piezas pensadas con el equipo de diseño (Drive, SALA 5, 31 de octubre); la sala la pinta Codex
    objetos: [
      {
        id: 'checo',
        categoria: 'Instrumento',
        nombre: 'Checo',
        texto:
          'Es una calabaza grande, seca y hueca, abierta por un lado, que se golpea con las manos. Su sonido grave y redondo marca el ritmo del tondero y de la música de la costa norte.',
        dato: 'El checo nace del campo: se hace con un mate o calabaza, un fruto que se cultiva en los valles de Piura y Lambayeque.',
      },
      {
        id: 'morropon',
        categoria: 'Símbolo visual',
        nombre: 'Plaza de Morropón',
        texto:
          'Morropón, en Piura, es considerado la cuna del tondero. En su plaza, con su pileta y su iglesia, se celebran las fiestas donde el baile se vive de verdad: entre chicha, guitarras y cajón.',
        dato: 'Morropón se llama a sí mismo "capital del tondero" y cada año celebra un festival dedicado a este baile.',
      },
      {
        id: 'pareja-tondero',
        categoria: 'Accesorio de baile',
        nombre: 'Pareja de tondero',
        texto:
          'Se baila descalzo, con pañuelo en alto y sombrero de paja en la mano. Ella luce vestido de volantes y flor en el cabello; él, camisa blanca y faja. La pareja se busca, se esquiva y se enamora, como las aves en el cortejo.',
        dato: 'El tondero se baila en tres partes: la glosa, el dulce y la fuga.',
      },
      {
        id: 'simbolos-tondero',
        categoria: 'Vida cotidiana',
        nombre: 'Sombrero, chicha y pañuelo',
        texto:
          'Sombrero de paja de ala ancha, chicha de jora en cántaros de barro y pañuelo bordado: así se arma una fiesta norteña. La chicha, bebida de maíz fermentado, acompaña al tondero desde siempre.',
        dato: 'En Piura los sombreros de paja se tejen a mano, con fibra muy fina, y protegen del sol fuerte del norte.',
      },
      {
        id: 'teresa-olaya',
        categoria: 'Personaje',
        nombre: 'Teresa Olaya',
        texto:
          'Teresa Isabel Olaya Díaz es una de las cultoras del tondero de Morropón: bailarina y maestra que ha enseñado a varias generaciones a bailarlo como se baila en su tierra, con pañuelo, vestido de volantes y los pies descalzos.',
        dato: 'Los cultores y cultoras son quienes guardan y enseñan un baile tradicional en su propio pueblo; de ellos aprenden las nuevas generaciones.',
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
    // Piezas pensadas con el equipo de diseño (Drive, SALA 1, 23 de octubre); la sala la pinta Codex
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
    // Piezas pensadas con el equipo de diseño (Drive, SALA 2, 30 de octubre); la sala la pinta Codex
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
    // Piezas pensadas con el equipo de diseño (Drive, SALA 4, 31 de octubre); la sala la pinta Codex
    objetos: [
      {
        id: 'cajon-cajita-quijada',
        categoria: 'Instrumento',
        nombre: 'Cajón, cajita y quijada',
        texto:
          'Los tres instrumentos de la percusión afroperuana. El cajón es una caja de madera que se toca sentado encima; la cajita, una cajita con tapa que se abre y cierra al ritmo; la quijada, la mandíbula seca de un burro cuyos dientes vibran al golpearla.',
        dato: 'En 2001 el cajón peruano fue declarado Patrimonio Cultural de la Nación.',
      },
      {
        id: 'origenes-festejo',
        categoria: 'Historia',
        nombre: 'Los orígenes del festejo',
        texto:
          'El festejo nació en la costa peruana entre los africanos esclavizados y sus descendientes, en los siglos XVII y XVIII. Con tambores, palmas y canto, fue celebración y también resistencia: una manera de mantener viva la memoria de África.',
        dato: 'Cada 4 de junio se celebra el Día de la Cultura Afroperuana, en homenaje al nacimiento de Nicomedes Santa Cruz.',
      },
      {
        id: 'pareja-festejo',
        categoria: 'Vestimenta',
        nombre: 'Pareja de festejo',
        texto:
          'Se baila descalzo, con alegría y mucho movimiento de cadera. Ella lleva vestido rojo de vuelos con enagua blanca y flor en el pelo; él, camisa blanca, chaleco rojo y pantalón blanco. Los colores vivos son parte de la fiesta.',
        dato: 'El festejo se baila en pareja suelta: los bailarines no se toman, se provocan y se responden con el cuerpo.',
      },
      {
        id: 'santa-cruz',
        categoria: 'Personaje',
        nombre: 'Nicomedes y Victoria Santa Cruz',
        texto:
          'Hermanos limeños que rescataron la cultura afroperuana en el siglo XX. Nicomedes (1925-1992), decimista y poeta, llevó la décima y el festejo a la radio y los discos; Victoria (1922-2014), coreógrafa y compositora, recreó danzas y fundó conjuntos que recorrieron el mundo.',
        dato: 'Victoria Santa Cruz es autora del poema "Me gritaron negra", un himno del orgullo afroperuano.',
      },
      {
        id: 'decima',
        categoria: 'Vida cotidiana',
        nombre: 'Una décima manuscrita',
        texto:
          'La décima es un poema de diez versos que los decimistas afroperuanos componen y recitan, muchas veces de memoria o improvisando. Habla de la vida diaria, de amores, de injusticias y de humor, y suele acompañarse de guitarra y cajón.',
        dato: 'Nicomedes Santa Cruz escribió cientos de décimas; con ellas contó la historia del Perú negro.',
      },
    ],
  },
];
