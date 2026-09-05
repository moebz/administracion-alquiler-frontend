// Secciones del layout autenticado, en orden de prioridad para el redirect post-login. Ver ARQUITECTURA.md.
export const SECTIONS = ["administrador", "propietario", "inquilino"] as const;

export type Section = (typeof SECTIONS)[number];

export const isSection = (value: string): value is Section =>
  (SECTIONS as readonly string[]).includes(value);

export const accessPermission = (section: Section): string => `acceso.${section}`;

export const getAccessibleSections = (permissions: string[]): Section[] =>
  SECTIONS.filter((section) => permissions.includes(accessPermission(section)));

export const getPrioritySection = (permissions: string[]): Section | null =>
  getAccessibleSections(permissions)[0] ?? null;

export const sectionHomePath = (section: Section): string => `/${section}/home`;
