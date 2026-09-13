import type { ReactNode } from "react";

// Título de un <List>/<Create>/<Edit> con ícono de la sección a la que
// pertenece (ver AGENTS.md, "Título de <List>/<Create>/<Edit>"). El margen
// del ícono queda acá en un solo lugar en vez de repetirse en cada página.
export const PageTitle = ({ icon, children }: { icon: ReactNode; children: ReactNode }) => (
  <>
    <span style={{ marginRight: 8 }}>{icon}</span>
    {children}
  </>
);
