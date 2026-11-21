// Directorio del equipo: comisiones e integrantes (fuente: «Organización de las comisiones»).
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
      'Gestiona la dirección del proyecto, acompañando a sus líderes y brindando las operaciones correspondientes.',
      'Hace el seguimiento oportuno con todas las comisiones, ofreciendo retroalimentación y generando espacios de intercambio de ideas, para cohesionar e involucrar a todos los equipos en un mismo camino.',
    ],
    integrantes: [{ nombre: 'Alejandro Rodríguez Malqui' }, { nombre: 'Sofia Mantilla Ortiz' }],
  },
  {
    id: 'plataforma',
    nombre: 'Plataforma',
    descripcion: [
      'Planifica, organiza, diseña y programa todo lo que compete a la página web del proyecto.',
      'Actualiza constantemente la plataforma en función de los contenidos que se producen.',
    ],
    integrantes: [
      { nombre: 'Marcelo Sotomayor Escobar', rol: 'Líder de la comisión' },
      { nombre: 'Jose Pari Yances' },
      { nombre: 'Carla Cossío Molina' },
    ],
  },
  {
    id: 'comunicacion-interna',
    nombre: 'Comunicación Interna',
    descripcion: [
      'Gestiona el flujo de información, la coordinación y el diálogo entre los integrantes del proyecto mediante diversos canales, procesos y dinámicas.',
      'Mantiene al equipo informado, escuchado, alineado y motivado, facilitando el trabajo colaborativo, la resolución de dificultades y el sentido de pertenencia.',
    ],
    integrantes: [
      { nombre: 'Alma Navarro Cueva', rol: 'Líder de la comisión' },
      { nombre: 'Sharon Toribio Urreta' },
      { nombre: 'Valentín Ayala Huamán' },
    ],
  },
  {
    id: 'economia',
    nombre: 'Economía',
    descripcion: [
      'Planifica, diseña, organiza y lidera las actividades de recaudación de fondos, y convoca a los integrantes para participar en ellas.',
      'Administra los fondos recaudados, gestiona los recursos económicos disponibles y los distribuye según las necesidades de Entre Jaranas.',
    ],
    integrantes: [
      { nombre: 'Romina Cruzado Fernandez', rol: 'Líder de la comisión' },
      { nombre: 'Mayra Cabanillas Herrera' },
      { nombre: 'Leo De la Torre Parra' },
      { nombre: 'Jhonatan Laureano Laime' },
    ],
  },
  {
    id: 'diseno',
    nombre: 'Diseño',
    descripcion: [
      'Conceptualiza, diseña y desarrolla los recursos visuales del proyecto, asegurando la coherencia gráfica y la identidad visual en todos sus materiales.',
      'Elabora flyers, publicaciones para redes sociales, merchandising y otras piezas gráficas, y crea y actualiza el manual de identidad visual.',
    ],
    integrantes: [
      { nombre: 'Cinthia Quispe Sulla', rol: 'Líder de la comisión' },
      { nombre: 'Nicolle Carbajal Olazabal', rol: 'Sublíder de la comisión' },
      { nombre: 'Pierina Flores Altamirano' },
      { nombre: 'Fabián León Cutisaca' },
      { nombre: 'Lorena Mamani Polo' },
      { nombre: 'Pamela Meneses Ayala' },
    ],
  },
  {
    id: 'audiovisuales',
    nombre: 'Audiovisuales',
    descripcion: [
      'Realiza la producción audiovisual para la página web y las redes sociales de Entre Jaranas, y la cobertura de los eventos.',
    ],
    integrantes: [
      { nombre: 'Andrea Paco López' },
      { nombre: 'Anabely López Díaz' },
      { nombre: 'Marjorie Coico Aguilar' },
      { nombre: 'Say Pablo Correa' },
      { nombre: 'Daniel Huamani Cáceres' },
      { nombre: 'Andre Muriano Ponce' },
      { nombre: 'Imanol Castro Gómez' },
    ],
  },
  {
    id: 'relaciones-publicas',
    nombre: 'Relaciones Públicas',
    descripcion: [
      'Contacta, relaciona, planifica y organiza, desde una visión protocolar, la participación de los artistas en los medios audiovisuales y la producción de los eventos presenciales del proyecto.',
      'Busca constantemente entrevistados para la página web y las redes sociales, gestiona permisos de posibles lugares para las actividades y planifica el protocolo de los eventos oficiales.',
    ],
    integrantes: [
      { nombre: 'Jharitza Saavedra Vargas', rol: 'Coordinadora general' },
      { nombre: 'Wendy Malpartida Ochoa', rol: 'Subcoordinadora' },
      { nombre: 'Gabriel Oyola Barazorda' },
      { nombre: 'Gabriel Moises Aguero Zuñiga' },
      { nombre: 'Lucero De la Cruz Nalvarte' },
      { nombre: 'Fabiola Navarro Espinal' },
    ],
  },
  {
    id: 'redes',
    nombre: 'Redes',
    descripcion: [
      'Gestiona las redes sociales oficiales del proyecto: planifica, crea y publica contenidos alineados con sus objetivos.',
      'Elabora la parrilla semanal, redacta copies y guiones, propone campañas y tendencias, interactúa con la comunidad digital y monitorea métricas para mejorar el alcance.',
    ],
    integrantes: [
      { nombre: 'Malena Gutiérrez de la Cruz', rol: 'Líder de la comisión' },
      { nombre: 'Elías Ayala García' },
      { nombre: 'Shakira Almanza Mallqui' },
      { nombre: 'Ana Cruz Bustamante' },
    ],
  },
  {
    id: 'prensa',
    nombre: 'Prensa',
    descripcion: [
      'Planifica, diseña y ejecuta la estrategia de difusión, cobertura mediática y posicionamiento público de Entre Jaranas.',
      'Gestiona el contacto con medios tradicionales, institucionales (RTV San Marcos, Oficina de Imagen FLCH, Escuela de Comunicación Social) y universitarios alternativos como 8 Gatos; redacta notas de prensa, elabora pautas y planes de medios, coordina la conducción de eventos y lidera la atención a medios en las activaciones presenciales.',
    ],
    integrantes: [
      { nombre: 'Saomy Medina Inga', rol: 'Coordinación general' },
      { nombre: 'Sayuri Sosa Meza' },
      { nombre: 'Ricardo Pillco Mayuri' },
      { nombre: 'Franz Serva Ponce' },
    ],
  },
];

