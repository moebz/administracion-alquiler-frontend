import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const currentDir = path.dirname(fileURLToPath(import.meta.url));

// Mismo mecanismo manual documentado en ESTADO.md ("copiar el link del log a
// mano"), automatizado acá: con MAIL_MAILER=log el backend vuelca el mail
// entero (con el link de /update-password) a este archivo en vez de mandarlo
// de verdad. Si el backend corre en un lugar donde este path relativo no
// aplica (ej. Docker con el repo montado distinto), pisalo con
// PLAYWRIGHT_BACKEND_LOG_PATH.
const LOG_PATH =
  process.env.PLAYWRIGHT_BACKEND_LOG_PATH ??
  path.resolve(currentDir, "../../../backend/storage/logs/laravel.log");

/**
 * Busca, de atrás para adelante, el último link de /update-password logueado
 * para un email dado (el más reciente si se reenvió la invitación o se pidió
 * "olvidé mi contraseña" varias veces).
 */
export const getLatestUpdatePasswordLink = async (email: string): Promise<string> => {
  const content = await readFile(LOG_PATH, "utf-8");

  const encodedEmail = encodeURIComponent(email);
  const pattern = new RegExp(
    `https?:\\/\\/[^\\s"]+\\/update-password\\?token=[^&\\s"]+&email=${encodedEmail}`,
    "g",
  );

  const matches = [...content.matchAll(pattern)];
  if (matches.length === 0) {
    throw new Error(
      `No encontré ningún link de /update-password para ${email} en ${LOG_PATH}. ` +
        "¿MAIL_MAILER=log en el backend? ¿Se disparó la invitación/recuperación antes de este chequeo?",
    );
  }

  return matches[matches.length - 1][0];
};
