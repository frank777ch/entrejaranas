// Datos generales del sitio. Editar aquí sin tocar los componentes.

export const sitio = {
  nombre: 'Entre Jaranas',
  lema: 'Una marca que celebra nuestra cultura, la fuerza de nuestra gente y la alegría de lo nuestro.',
  // Texto que aparece en Google y al compartir el link por WhatsApp / redes
  descripcion:
    'Aquí nadie celebra solo. Microdocumentales, museo virtual, talleres y nuevas promesas de la música criolla peruana. Un proyecto de Letras, UNMSM.',

  proyectoDe: ['Facultad de Letras y Ciencias Humanas', 'Universidad Nacional Mayor de San Marcos'],
  // Agregar aliados cuando existan: { nombre: 'Aliado', url: 'https://...' }
  aliados: [] as { nombre: string; url?: string }[],

  museoVirtual: {
    nombre: 'Museo Virtual de la Jarana',
    descripcion:
      'Recorre salas dedicadas a los instrumentos, las voces y los barrios que hicieron la música criolla. Acércate a cada pieza, escucha su historia y vuelve cuando quieras: las salas se irán ampliando.',
    // Pegar aquí el enlace para incrustar (Artsteps, Kuula, Matterport, etc.).
    // Mientras esté vacío, la página muestra "Próximamente".
    embedUrl: '',
  },

  // Dejar en '' las redes que no existan y no se mostrarán
  redes: {
    instagram: '',
    facebook: '',
    tiktok: '',
    youtube: '',
  },
};
