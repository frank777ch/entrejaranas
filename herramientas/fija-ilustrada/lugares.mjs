// Qué lleva cada toma ilustrada del museo virtual. Todas las medidas van en px del fondo original
// (el que entregó Codex, ~1774×887); componer.mjs las escala.
//
// - piezas: artes del equipo que se pegan encima. `base` es el centro del punto de apoyo y `alto`
//   su altura; `cubrir` llena un hueco (el interior de un marco). `ajuste` son opciones de
//   ImageMagick para entonarlas con la luz de la sala.
// - puntos: arcos o piezas que ya vienen pintadas en el fondo, con su recuadro (y su punto, si no
//   es el centro del recuadro).

/** Las artes del equipo vienen con luz pareja: se oscurecen un poco para la noche de la sala */
const NOCHE = ['-modulate', '90,94,100'];

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
      gramofono: { caja: [667, 460, 745, 545] },
      espejo: { caja: [679, 390, 726, 460] },
      plaza: { caja: [382, 288, 452, 388] },
      pinglo: { caja: [1335, 275, 1393, 395] },
      arana: { caja: [820, 103, 954, 255] },
    },
  },
  vals: {
    fondo: 'fondos/vals.webp',
    fovH: 80,
    piezas: [
      { id: 'pintura', arte: 'artes/vals/pintura.png', cubrir: [341, 156, 615, 339], recorte: 0.02, ajuste: ['-modulate', '86,92,100'] },
      { id: 'busto-pinglo', arte: 'artes/vals/busto-pinglo.png', base: [170, 366], alto: 165, ajuste: NOCHE },
      { id: 'cancionero', arte: 'artes/vals/cancionero.png', base: [1250, 388], alto: 165, ajuste: NOCHE },
      { id: 'guitarra', arte: 'artes/vals/guitarra.png', base: [1636, 606], alto: 320, sombra: 0.4, ajuste: NOCHE },
      { id: 'pareja', arte: 'artes/vals/pareja.png', base: [887, 712], alto: 525, sombra: 0.42, ajuste: NOCHE },
    ],
  },
  // Marinera: artes del equipo (30 de octubre) sobre el fondo vacío de pedidos/marinera-v2.md
  marinera: {
    fondo: 'fondos/marinera.webp',
    fovH: 80,
    piezas: [
      { id: 'marinera-antigua', arte: 'artes/marinera/marinera-antigua.png', cubrir: [441, 193, 618, 416], contener: true, ajuste: ['-modulate', '94,96,100'] },
      { id: 'marinera-actual', arte: 'artes/marinera/marinera-actual.png', cubrir: [1140, 190, 1324, 418], contener: true, ajuste: ['-modulate', '94,96,100'] },
      { id: 'ancla', arte: 'artes/marinera/ancla.png', base: [560, 655], alto: 200, sombra: 0.3, ajuste: NOCHE },
      { id: 'tunante', arte: 'artes/marinera/tunante.png', base: [272, 715], alto: 255, sombra: 0.3, ajuste: NOCHE },
      { id: 'guitarra-cajon', arte: 'artes/marinera/guitarra-cajon.png', base: [1245, 668], alto: 255, sombra: 0.35, ajuste: NOCHE },
      { id: 'pareja-marinera', arte: 'artes/marinera/pareja.png', base: [887, 740], alto: 520, sombra: 0.42, ajuste: NOCHE },
    ],
  },
  // Tondero y festejo: piezas provisionales pintadas por Codex hasta que lleguen las artes del equipo
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
  // Polka: artes del equipo (30 de octubre) sobre el fondo vacío de pedidos/polka-v2.md (sala de día: sin ajuste)
  polka: {
    fondo: 'fondos/polka.webp',
    fovH: 80,
    piezas: [
      { id: 'mapa-bohemia', arte: 'artes/polka/mapa.png', cubrir: [1131, 181, 1286, 403], contener: true, margen: 0.05 },
      { id: 'cuadro-callao', arte: 'artes/polka/cuadro-callao.png', base: [532, 420], alto: 230 },
      { id: 'acordeon', arte: 'artes/polka/acordeon.png', base: [232, 446], alto: 135 },
      { id: 'guardia-vieja', arte: 'artes/polka/guardia-vieja.png', base: [1535, 575], alto: 340, sombra: 0.35 },
      { id: 'pareja-polka', arte: 'artes/polka/pareja.png', base: [874, 705], alto: 510, sombra: 0.42 },
    ],
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
