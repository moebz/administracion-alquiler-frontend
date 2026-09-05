import { useGetIdentity } from "@refinedev/core";
import { Navigate } from "react-router";
import type { Identity } from "../../providers/identity";
import { getPrioritySection, sectionHomePath } from "../../providers/sections";

/**
 * Reemplaza el `NavigateToResource` default en "/" (y al entrar autenticado a
 * `/login`): manda al home de la sección de mayor prioridad del usuario en
 * vez de a un resource fijo.
 */
export const RoleBasedIndex = () => {
  const { data: identity, isLoading } = useGetIdentity<Identity>();

  if (isLoading) {
    return null;
  }

  const section = getPrioritySection(identity?.permissions ?? []);
  if (section) {
    return <Navigate to={sectionHomePath(section)} replace />;
  }

  return <p>Todavía no tenés acceso a ninguna sección. Contactá a un administrador.</p>;
};
