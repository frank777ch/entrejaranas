// Servidor de la herramienta de panoramas (no forma parte del sitio)
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const aqui = path.dirname(fileURLToPath(import.meta.url));
const raiz = path.resolve(aqui, '../..');

export default {
  root: aqui,
  publicDir: path.join(raiz, 'public'),
  logLevel: 'warn',
  server: { port: 5199, fs: { allow: [raiz] } },
};
