// Qué lleva cada toma ilustrada del museo virtual. Todas las medidas van en px del fondo original
// (el que entregó Codex, 1774×887); componer.mjs las escala.
//
// Desde el 31 de octubre todas las salas van pintadas completas por Codex (los jefes de Marce
// prefirieron ese estilo a las artes recortadas del equipo). Se usan `puntos` (arcos o piezas
// pintadas en el fondo, con su recuadro) y, solo donde el equipo quiere su arte tal cual,
// `piezas` (artes sueltas pegadas encima, con `base`/`alto` o `cubrir`).

export const LUGARES = {
  casona: {
    fondo: 'fondos/casona.webp',
    fovH: 100,
    puntos: {
      tondero: { caja: [110, 124, 382, 637], x: 276, y: 430 },
      marinera: { caja: [486, 265, 574, 560], x: 535, y: 442 },
      vals: { caja: [799, 281, 975, 539], x: 887, y: 441 },
      polka: { caja: [1200, 265, 1288, 560], x: 1239, y: 442 },
      festejo: { caja: [1392, 124, 1664, 637], x: 1498, y: 430 },
    },
  },
  // Vals: sala pintada completa por Codex (pedidos/vals-final.md), piezas en el mismo fondo
  vals: {
    fondo: 'fondos/vals.webp',
    fovH: 80,
    // El cancionero va con el arte original del equipo, apoyado en el atril pintado
    piezas: [{ id: 'cancionero', arte: 'artes/vals/cancionero.png', base: [1284, 483], alto: 282 }],
    puntos: {
      'busto-pinglo': { caja: [110, 170, 290, 440] },
      pintura: { caja: [290, 70, 660, 520] },
      pareja: { caja: [690, 150, 1130, 800] },
      guitarra: { caja: [1500, 240, 1720, 760] },
    },
  },
  // Marinera: sala pintada completa por Codex (pedidos/marinera-final.md), piezas en el mismo fondo
  marinera: {
    fondo: 'fondos/marinera.webp',
    fovH: 80,
    puntos: {
      tunante: { caja: [5, 330, 380, 760] },
      'marinera-antigua': { caja: [290, 105, 600, 470] },
      'pareja-marinera': { caja: [560, 200, 930, 760] },
      'marinera-actual': { caja: [1000, 105, 1320, 470] },
      ancla: { caja: [1290, 400, 1480, 720] },
      'guitarra-cajon': { caja: [1500, 410, 1750, 730] },
    },
  },
  // Tondero: sala pintada completa por Codex (pedidos/tondero-final.md), piezas en el mismo fondo
  tondero: {
    fondo: 'fondos/tondero.webp',
    fovH: 80,
    puntos: {
      checo: { caja: [60, 400, 350, 590] },
      morropon: { caja: [355, 120, 690, 460] },
      'pareja-tondero': { caja: [660, 130, 1160, 760] },
      'simbolos-tondero': { caja: [1090, 380, 1370, 680] },
      'teresa-olaya': { caja: [1370, 180, 1760, 750] },
    },
  },
  // Polka: sala pintada completa por Codex (pedidos/polka-final.md), piezas en el mismo fondo
  polka: {
    fondo: 'fondos/polka.webp',
    fovH: 80,
    // El mapa va con el arte original del equipo, dentro del marco pintado
    piezas: [{ id: 'mapa-bohemia', arte: 'artes/polka/mapa.png', cubrir: [1048, 166, 1280, 465], contener: true, margen: 0 }],
    puntos: {
      acordeon: { caja: [70, 330, 300, 520] },
      'cuadro-callao': { caja: [325, 115, 640, 520] },
      'pareja-polka': { caja: [590, 215, 1030, 760] },
      'guardia-vieja': { caja: [1300, 215, 1740, 700] },
    },
  },
  // Festejo: sala pintada completa por Codex (pedidos/festejo-final.md), piezas en el mismo fondo
  festejo: {
    fondo: 'fondos/festejo.webp',
    fovH: 80,
    puntos: {
      'cajon-cajita-quijada': { caja: [20, 310, 355, 620] },
      'origenes-festejo': { caja: [340, 190, 700, 690] },
      'pareja-festejo': { caja: [700, 180, 1140, 700] },
      'santa-cruz': { caja: [1100, 125, 1440, 420] },
      decima: { caja: [1450, 260, 1740, 700] },
    },
  },
};
