// Qué lleva cada toma ilustrada del museo virtual. Todas las medidas van en px del fondo original
// (el que entregó Codex, 1774×887); componer.mjs las escala.
//
// Desde el 31 de octubre todas las salas van pintadas completas por Codex (los jefes de Marce
// prefirieron ese estilo a las artes recortadas del equipo), así que solo se usan `puntos`:
// arcos o piezas pintadas en el fondo, con su recuadro (y su punto, si no es el centro).
// `piezas` (artes sueltas pegadas encima, con `base`/`alto` o `cubrir`) sigue disponible en
// componer.mjs por si vuelve a hacer falta.

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
    puntos: {
      'busto-pinglo': { caja: [110, 170, 290, 440] },
      pintura: { caja: [290, 70, 660, 520] },
      pareja: { caja: [690, 150, 1130, 800] },
      cancionero: { caja: [1170, 290, 1400, 470] },
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
  // Tondero y festejo: pintadas completas por Codex (pedidos/tondero.md y festejo.md)
  tondero: {
    fondo: 'fondos/tondero.webp',
    fovH: 80,
    puntos: {
      sombrero: { caja: [44, 133, 281, 414] },
      checo: { caja: [407, 384, 628, 702] },
      mapa: { caja: [769, 103, 1094, 488] },
      'panuelo-color': { caja: [1160, 155, 1316, 540] },
      canasta: { caja: [1412, 355, 1744, 710] },
    },
  },
  // Polka: sala pintada completa por Codex (pedidos/polka-final.md), piezas en el mismo fondo
  polka: {
    fondo: 'fondos/polka.webp',
    fovH: 80,
    puntos: {
      acordeon: { caja: [70, 330, 300, 520] },
      'cuadro-callao': { caja: [325, 115, 640, 520] },
      'pareja-polka': { caja: [590, 215, 1030, 760] },
      'mapa-bohemia': { caja: [1030, 150, 1290, 490] },
      'guardia-vieja': { caja: [1300, 215, 1740, 700] },
    },
  },
  festejo: {
    fondo: 'fondos/festejo.webp',
    fovH: 80,
    puntos: {
      falda: { caja: [7, 185, 443, 680] },
      quijada: { caja: [503, 140, 739, 650] },
      mascara: { caja: [761, 133, 990, 451] },
      cinta: { caja: [1064, 170, 1330, 577] },
      cajita: { caja: [1382, 362, 1766, 628] },
    },
  },
};
