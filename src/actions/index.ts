import { ActionError, defineAction } from 'astro:actions';
import { CONTACT_FROM_EMAIL, CONTACT_TO_EMAIL, RESEND_API_KEY } from 'astro:env/server';
import { z } from 'astro/zod';
import { Resend } from 'resend';
import { motivos, type Motivo } from '../data/contacto';

const escapar = (texto: string) =>
  texto.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);

export const server = {
  contacto: defineAction({
    accept: 'form',
    input: z.object({
      nombre: z.string().trim().min(2, 'Escribe tu nombre').max(120),
      email: z.email('Revisa tu correo'),
      motivo: z.enum(Object.keys(motivos) as [Motivo, ...Motivo[]]),
      mensaje: z.string().trim().min(10, 'Cuéntanos un poco más').max(5000),
      // Campo oculto anti-spam: las personas no lo ven, los bots lo llenan
      web: z.string().optional(),
    }),
    handler: async ({ nombre, email, motivo, mensaje, web }) => {
      // Si el campo oculto viene lleno es un bot: respondemos ok sin enviar nada
      if (web) return { ok: true };

      const asunto = `[Entre Jaranas] ${motivos[motivo]} — ${nombre.replace(/\s+/g, ' ')}`;

      if (!RESEND_API_KEY) {
        console.info('\n[contacto] RESEND_API_KEY no configurada. Mensaje recibido:\n', {
          para: CONTACT_TO_EMAIL,
          asunto,
          email,
          mensaje,
        });
        return { ok: true };
      }

      const resend = new Resend(RESEND_API_KEY);
      const { error } = await resend.emails.send({
        from: CONTACT_FROM_EMAIL,
        to: CONTACT_TO_EMAIL,
        replyTo: email,
        subject: asunto,
        text: `Nombre: ${nombre}\nCorreo: ${email}\nMotivo: ${motivos[motivo]}\n\n${mensaje}`,
        html: `<p><strong>Nombre:</strong> ${escapar(nombre)}<br><strong>Correo:</strong> ${escapar(email)}<br><strong>Motivo:</strong> ${motivos[motivo]}</p><p style="white-space:pre-wrap">${escapar(mensaje)}</p>`,
      });

      if (error) {
        console.error('[contacto] Error de Resend:', error);
        throw new ActionError({ code: 'INTERNAL_SERVER_ERROR', message: 'No pudimos enviar el mensaje.' });
      }
      return { ok: true };
    },
  }),
};
