import { useGetIdentity } from "@refinedev/core";
import type { PropsWithChildren } from "react";
import { Navigate } from "react-router";
import { getPriorityRole, roleHomePath, type Role } from "../../providers/roles";

type Identity = {
  roles: string[];
};

/**
 * Guard de una rama de rutas prefijada por rol (ej. `/administrador/*`).
 * Nunca alcanza con ocultar el link: si el usuario no tiene el rol pedido
 * (ej. un `inquilino` navegando `/administrador/home` a mano), lo manda a su
 * propio home en vez de mostrarle la pantalla. Ver DECISIONES.md.
 */
export const RoleRoute = ({ role, children }: PropsWithChildren<{ role: Role }>) => {
  const { data: identity, isLoading } = useGetIdentity<Identity>();

  if (isLoading) {
    return null;
  }

  const roles = identity?.roles ?? [];
  if (roles.includes(role)) {
    return <>{children}</>;
  }

  const ownRole = getPriorityRole(roles);
  return <Navigate to={ownRole ? roleHomePath(ownRole) : "/login"} replace />;
};
