import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import { sitio } from '../data/sitio';

// Índice del buscador. Se genera al compilar a partir del contenido,
// así que todo lo que se agregue en src/content/ aparece solo.
export const prerender = true;

export type Resultado = { tipo: string; titulo: string; texto: string; url: string };

export const GET: APIRoute = async () => {
  const secciones: Resultado[] = [
    {
      tipo: 'Sección',
      titulo: 'Quiénes somos',
      texto: 'Somos Entre Jaranas, una iniciativa de sanmarquinos para que la música criolla siga sonando. Equipo, nosotros.',
      url: '/#nosotros',
    },
    { tipo: 'Sección', titulo: 'Nuestro propósito', texto: 'Misión, visión y valores: pertenencia, innovación, responsabilidad sociocultural, alegría, creatividad y jovialidad.', url: '/#proposito' },
    { tipo: 'Sección', titulo: sitio.museoVirtual.nombre, texto: sitio.museoVirtual.descripcion, url: '/museo-virtual' },
    { tipo: 'Sección', titulo: 'Microdocumentales', texto: 'Experiencias: historias de la música criolla.', url: '/#experiencias' },
    { tipo: 'Sección', titulo: 'Nuevas Promesas', texto: 'Mapa de jóvenes intérpretes de música criolla en Lima. Postula.', url: '/#promesas' },
    { tipo: 'Sección', titulo: 'Noticias', texto: 'Noticias, crónicas y notas de prensa.', url: '/#noticias' },
    { tipo: 'Sección', titulo: 'Contacto', texto: 'Escríbenos: talleres, prensa, alianzas, formulario, correo.', url: '/#contacto' },
  ];

  const noticias = (await getCollection('noticias')).map((n) => ({
    tipo: 'Noticia',
    titulo: n.data.titulo,
    texto: n.data.resumen,
    url: n.data.enlace ?? (n.body?.trim() ? `/noticias/${n.id}` : `/#noticia-${n.id}`),
  }));
  const documentales = (await getCollection('documentales')).map((d) => ({
    tipo: 'Documental',
    titulo: d.data.titulo,
    texto: d.data.descripcion,
    url: `/#documental-${d.id}`,
  }));
  const promesas = (await getCollection('promesas')).map((p) => ({
    tipo: 'Nueva promesa',
    titulo: p.data.nombre,
    texto: `${p.data.distrito}. ${p.data.descripcion}`,
    url: `/#promesa-${p.id}`,
  }));

  const indice: Resultado[] = [...secciones, ...documentales, ...promesas, ...noticias];
  return new Response(JSON.stringify(indice), { headers: { 'Content-Type': 'application/json' } });
};
