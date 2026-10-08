// Pages Function: recibe el formulario de contacto (POST /api/contacto)
// y lo envía por correo con Resend.
// Variables (Cloudflare → Pages → entrejaranas → Settings → Variables and Secrets):
//   CONTACT_TO_EMAIL    correo que recibe los mensajes
//   RESEND_API_KEY      API key de https://resend.com
//   CONTACT_FROM_EMAIL  opcional, remitente (por defecto onboarding@resend.dev)

import { motivos, type Motivo } from '../../src/data/contacto';

interface Env {
  CONTACT_TO_EMAIL?: string;
  RESEND_API_KEY?: string;
  CONTACT_FROM_EMAIL?: string;
}

type Contexto = { request: Request; env: Env };

const json = (datos: unknown, status = 200) =>
  new Response(JSON.stringify(datos), { status, headers: { 'Content-Type': 'application/json' } });

const escapar = (texto: string) =>
  texto.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export const onRequestPost = async ({ request, env }: Contexto) => {
  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return json({ ok: false, error: 'Formato inválido.' }, 400);
  }
  const campo = (n: string) => String(form.get(n) ?? '').trim();
  const nombre = campo('nombre');
  const email = campo('email');
  const motivo = campo('motivo') as Motivo;
  const mensaje = campo('mensaje');

  // Campo oculto anti-spam: si viene lleno es un bot; respondemos ok sin enviar
  if (campo('web')) return json({ ok: true });

  const errores: Record<string, string> = {};
  if (nombre.length < 2 || nombre.length > 120) errores.nombre = 'Escribe tu nombre';
  if (!EMAIL.test(email) || email.length > 200) errores.email = 'Revisa tu correo';
  if (!(motivo in motivos)) errores.motivo = 'Elige un motivo';
  if (mensaje.length < 10) errores.mensaje = 'Cuéntanos un poco más';
  if (mensaje.length > 5000) errores.mensaje = 'El mensaje es demasiado largo';
  if (Object.keys(errores).length) return json({ ok: false, errores }, 400);

  if (!env.RESEND_API_KEY || !env.CONTACT_TO_EMAIL) {
    console.error('[contacto] Faltan RESEND_API_KEY o CONTACT_TO_EMAIL en las variables de Cloudflare');
    return json({ ok: false, error: 'El formulario no está configurado.' }, 500);
  }

  const asunto = `[Entre Jaranas] ${motivos[motivo]} — ${nombre.replace(/\s+/g, ' ')}`;
  const respuesta = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: env.CONTACT_FROM_EMAIL || 'Entre Jaranas <onboarding@resend.dev>',
      to: env.CONTACT_TO_EMAIL,
      reply_to: email,
      subject: asunto,
      text: `Nombre: ${nombre}\nCorreo: ${email}\nMotivo: ${motivos[motivo]}\n\n${mensaje}`,
      html: `<p><strong>Nombre:</strong> ${escapar(nombre)}<br><strong>Correo:</strong> ${escapar(email)}<br><strong>Motivo:</strong> ${motivos[motivo]}</p><p style="white-space:pre-wrap">${escapar(mensaje)}</p>`,
    }),
  });

  if (!respuesta.ok) {
    console.error('[contacto] Error de Resend:', respuesta.status, await respuesta.text());
    return json({ ok: false, error: 'No pudimos enviar el mensaje.' }, 502);
  }
  return json({ ok: true });
};
