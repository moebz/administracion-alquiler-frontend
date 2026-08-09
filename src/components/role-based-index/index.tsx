import { useGetIdentity } from "@refinedev/core";
import { Navigate } from "react-router";
import { getPriorityRole, roleHomePath } from "../../providers/roles";

type Identity = {
  roles: string[];
};

/**
 * Reemplaza el `NavigateToResource` default en "/" (y al entrar autenticado a
 * `/login`): manda al home del rol de mayor jerarquía del usuario en vez de a
 * un resource fijo. Ver DECISIONES.md ("Login con multi-rol").
 */
export const RoleBasedIndex = () => {
  const { data: identity, isLoading } = useGetIdentity<Identity>();

  if (isLoading) {
    return null;
  }

  const role = getPriorityRole(identity?.roles ?? []);
  if (role) {
    return <Navigate to={roleHomePath(role)} replace />;
  }

  // Usuario autenticado pero sin ningún rol de negocio asignado todavía.
  return <p>Todavía no tenés un rol asignado. Contactá a un administrador.</p>;
};
