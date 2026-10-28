// Datos generales del sitio. Editar aquí sin tocar los componentes.

export const sitio = {
  nombre: 'Entre Jaranas',
  lema: 'Una marca que celebra nuestra cultura, la fuerza de nuestra gente y la alegría de lo nuestro.',
  // Texto que aparece en Google y al compartir el link por WhatsApp / redes
  descripcion:
    'Aquí nadie celebra solo. Microdocumentales, museo virtual y nuevas promesas de la música criolla peruana. Un proyecto de Letras, UNMSM.',

  proyectoDe: ['Facultad de Letras y Ciencias Humanas', 'Universidad Nacional Mayor de San Marcos'],
  // Agregar aliados cuando existan: { nombre: 'Aliado', url: 'https://...' }
  aliados: [] as { nombre: string; url?: string }[],

  museoVirtual: {
    nombre: 'Museo Virtual de la Jarana',
    descripcion:
      'Entra a una casona limeña y recorre sus cinco salas: tondero, marinera limeña, vals criollo, polka y festejo. Acércate a cada pieza, escucha su música y conoce su historia.',
    // Salas y piezas: src/data/museo.ts. Imágenes de cada sala: herramientas/fija-ilustrada
  },

  // Dejar en '' las redes que no existan y no se mostrarán
  redes: {
    instagram: 'https://www.instagram.com/entrejaranas/',
    tiktok: 'https://www.tiktok.com/@entrejaranas.proyecto',
    facebook: 'https://www.facebook.com/profile.php?id=61595196627374',
    whatsapp: 'https://whatsapp.com/channel/0029Vb9128ZGOj9vdZ9wBt38',
    youtube: 'https://www.youtube.com/@EntreJaranasWeb',
  },
};

// Cómo se muestra el nombre de cada red en los botones
export const nombresRedes: Record<string, string> = {
  instagram: 'Instagram',
  tiktok: 'TikTok',
  facebook: 'Facebook',
  whatsapp: 'Canal de WhatsApp',
  youtube: 'YouTube',
};

export const redesActivas = Object.entries(sitio.redes).filter(([, url]) => url);
