import { useGetIdentity } from "@refinedev/core";
import type { PropsWithChildren } from "react";
import { Navigate } from "react-router";
import type { Identity } from "../../providers/identity";
import { accessPermission, getPrioritySection, sectionHomePath, type Section } from "../../providers/sections";

/**
 * Guard de una rama de rutas prefijada por sección (ej. `/administrador/*`).
 * Nunca alcanza con ocultar el link: si el usuario no tiene el permiso de
 * acceso a esa sección (ej. un inquilino navegando `/administrador/home` a
 * mano), lo manda a su propia sección en vez de mostrarle la pantalla.
 */
export const SectionRoute = ({ section, children }: PropsWithChildren<{ section: Section }>) => {
  const { data: identity, isLoading } = useGetIdentity<Identity>();

  if (isLoading) {
    return null;
  }

  const permissions = identity?.permissions ?? [];
  if (permissions.includes(accessPermission(section))) {
    return <>{children}</>;
  }

  const ownSection = getPrioritySection(permissions);
  return <Navigate to={ownSection ? sectionHomePath(ownSection) : "/login"} replace />;
};
