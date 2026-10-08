// Opciones del selector "Motivo" del formulario de contacto
export const motivos = {
  consulta: 'Consulta general',
  promesa: 'Quiero ser parte de Nuevas Promesas',
  talleres: 'Talleres',
  prensa: 'Prensa y alianzas',
} as const;

export type Motivo = keyof typeof motivos;
