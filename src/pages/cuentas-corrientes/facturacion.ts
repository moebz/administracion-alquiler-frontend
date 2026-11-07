/** Devuelve los permisos requeridos que el usuario no tiene. */
export const permisosFaltantes = (requeridos: string[], propios: string[] | undefined): string[] =>
  requeridos.filter((permiso) => !(propios ?? []).includes(permiso));
