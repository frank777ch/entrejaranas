// Directorio del equipo: comisiones e integrantes (fuente: «Organización de las comisiones»;
// orden, nombres y roles según la hoja de corrección del 21-11-2026; descripciones textuales del PDF).
// Foto grupal de cada comisión: src/assets/directorio/<id>.jpg (por ejemplo plataforma.jpg).

export interface Integrante {
  nombre: string;
  rol?: string;
}

export interface Comision {
  id: string;
  nombre: string;
  descripcion: string[];
  integrantes: Integrante[];
}

export const comisiones: Comision[] = [
  {
    id: 'coordinacion-general',
    nombre: 'Coordinación General',
    descripcion: [
      'La comisión de Coordinación General es la encargada de gestionar la dirección del proyecto, acompañando a sus líderes y brindando las operaciones correspondientes.',
      'Su objetivo principal es realizar el seguimiento oportuno con todas las comisiones, ofreciendo retroalimentación y generando espacios de intercambio de ideas. De esta manera busca cohesionar e involucrar a todos los equipos de la organización para ir en un mismo camino.',
    ],
    integrantes: [{ nombre: 'Alejandro Rodríguez Malqui' }, { nombre: 'Sofía Mantilla Ortiz' }],
  },
  {
    id: 'comunicacion-interna',
    nombre: 'Comunicación Interna',
    descripcion: [
      'La comisión de Comunicación Interna es la encargada de gestionar el flujo de información, la coordinación y el diálogo entre los integrantes del proyecto mediante diversos canales, procesos y dinámicas.',
      'Su objetivo principal es mantener al equipo informado, escuchado, alineado y motivado, facilitando el trabajo colaborativo, la resolución de dificultades y el sentido de pertenencia para alcanzar juntos las metas planteadas.',
    ],
    integrantes: [
      { nombre: 'Alma Navarro Cueva', rol: 'Lideresa de la comisión' },
      { nombre: 'Sharon Toribio Urreta' },
      { nombre: 'Valentín Ayala Huamán' },
    ],
  },
  {
    id: 'economia',
    nombre: 'Economía y Finanzas',
    descripcion: [
      'La Comisión de Economía es responsable de planificar, diseñar, organizar y liderar actividades de recaudación de fondos, así como de convocar a los integrantes para su participación en estas.',
      'Asimismo, se encarga de administrar los fondos recaudados, gestionar los recursos económicos disponibles y distribuir el dinero de acuerdo con las necesidades del proyecto “Entre Jaranas”.',
    ],
    integrantes: [
      { nombre: 'Romina Cruzado Fernández', rol: 'Lideresa de la comisión' },
      { nombre: 'Mayra Cabanillas Herrera' },
      { nombre: 'Leo De la Torre Parra' },
      { nombre: 'Jhonatan Laureano Laime' },
    ],
  },
  {
    id: 'audiovisuales',
    nombre: 'Audiovisuales',
    descripcion: [
      'La comisión de Audiovisuales se encarga de la realización de producción audiovisual necesaria para la página web y las redes sociales de Entre Jaranas, así como la cobertura de los eventos.',
    ],
    integrantes: [
      { nombre: 'Anabely López Díaz', rol: 'Lideresa de la comisión' },
      { nombre: 'Andrea Paco López', rol: 'Sublideresa de la comisión' },
      { nombre: 'Daniel Huamaní Huancas' },
      { nombre: 'Andree Muriano Ponce' },
      { nombre: 'Marjorie Coico Aguilar' },
      { nombre: 'Say Pablo Correa' },
      { nombre: 'Imanol Castro Gómez' },
    ],
  },
  {
    id: 'diseno',
    nombre: 'Diseño Gráfico',
    descripcion: [
      'La comisión de Diseño es la encargada de conceptualizar, diseñar y desarrollar los recursos visuales del proyecto, asegurando la coherencia gráfica y la identidad visual en todos sus materiales.',
      'Entre sus funciones se encuentran la elaboración de flyers, publicaciones para redes sociales, merchandising y otras piezas gráficas, así como la creación y actualización del manual de identidad visual.',
    ],
    integrantes: [
      { nombre: 'Cinthia Quispe Sulla', rol: 'Lideresa de la comisión' },
      { nombre: 'Nicolle Carbajal Olazabal', rol: 'Sublideresa de la comisión' },
      { nombre: 'Pierina Flores Altamirano' },
      { nombre: 'Fabián León Cutisaca' },
      { nombre: 'Lorena Mamani Polo' },
      { nombre: 'Pamela Meneses Ayala' },
    ],
  },
  {
    id: 'plataforma',
    nombre: 'Plataforma',
    descripcion: [
      'La comisión de Plataforma es la encargada de planificar, organizar, diseñar y programar todo lo competente a la página web del proyecto.',
      'Actualiza constantemente la plataforma en función de los contenidos que se producen.',
    ],
    integrantes: [
      { nombre: 'Marcelo Sotomayor Escobar', rol: 'Líder de la comisión' },
      { nombre: 'Jose Pari Yances' },
      { nombre: 'Carla Cossío Molina' },
    ],
  },
  {
    id: 'prensa',
    nombre: 'Prensa',
    descripcion: [
      'La Comisión de Prensa es responsable de planificar, diseñar y ejecutar la estrategia de difusión, cobertura mediática y posicionamiento público del proyecto cultural "Entre Jaranas". Se encarga de gestionar el contacto con medios de comunicación tradicionales, institucionales (RTV San Marcos, Oficina de Imagen FLCH, Escuela de Comunicación Social) y plataformas universitarias alternativas (como 8 gatos). Asimismo, redacta y distribuye las notas de prensa y cartas de presentación, elabora las pautas y planes de medios para las entrevistas, coordina la conducción de eventos, gestiona las vocerías y lidera la atención a medios y reportería de campo durante las activaciones presenciales.',
    ],
    integrantes: [
      { nombre: 'Saomy Medina Inga', rol: 'Lideresa de la comisión' },
      { nombre: 'Sayury Sosa Meza' },
      { nombre: 'Ricardo Pillco Mayuri' },
      { nombre: 'Franz Serva Ponce' },
    ],
  },
  {
    id: 'relaciones-publicas',
    nombre: 'Relaciones Públicas y Protocolo',
    descripcion: [
      'La comisión de Relaciones Públicas es la encargada de contactar, relacionar, planificar y organizar desde un visión protocolar todo lo competente a la participación de los artistas en los medios audiovisuales y producción de eventos presenciales del proyecto.',
      'Actualizan constantemente la búsqueda de entrevistados para difundir en la página web y redes sociales, permisos de posibles lugares para las actividades y planificación e implementación protocolar de los eventos oficiales.',
    ],
    integrantes: [
      { nombre: 'Jharitza Saavedra Vargas', rol: 'Lideresa de la comisión' },
      { nombre: 'Wendy Malpartida Ochoa', rol: 'Sublideresa de la comisión' },
      { nombre: 'Gabriel Agüero Zúñiga' },
      { nombre: 'Gabriel Oyola Barazorda' },
      { nombre: 'Lucero De la Cruz Nalvarte' },
      { nombre: 'Fabiola Navarro Espinal' },
    ],
  },
  {
    id: 'redes',
    nombre: 'Redes',
    descripcion: [
      'La comisión de Redes es la encargada de gestionar las redes sociales oficiales del proyecto, planificar, crear y publicar contenidos alineados con sus objetivos. Entre sus funciones están elaborar la parrilla semanal, redactar copies y guiones, proponer campañas y tendencias, interactuar con la comunidad digital y monitorear métricas para evaluar y mejorar el alcance y la interacción.',
    ],
    integrantes: [
      { nombre: 'Malena Gutiérrez de la Cruz', rol: 'Líder de la comisión' },
      { nombre: 'Elías Ayala García' },
      { nombre: 'Shakira Almanza Mallqui' },
      { nombre: 'Ana Cruz Bustamante' },
    ],
  },
];
