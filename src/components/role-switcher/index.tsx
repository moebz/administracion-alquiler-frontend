import { useGetIdentity } from "@refinedev/core";
import { Select } from "antd";
import { useLocation, useNavigate } from "react-router";
import { isRole, ROLE_PRIORITY, roleHomePath, type Role } from "../../providers/roles";

type Identity = {
  roles: string[];
};

/**
 * Selector de rol activo, visible en cualquier sección del layout autenticado.
 * Solo se muestra si el usuario tiene más de un rol — cambiar de rol es
 * navegación normal a la URL del otro rol, no hay "contexto" que mutar (ver
 * ARQUITECTURA.md).
 */
export const RoleSwitcher = () => {
  const { data: identity } = useGetIdentity<Identity>();
  const navigate = useNavigate();
  const location = useLocation();

  const roles = (identity?.roles ?? []).filter(isRole);
  if (roles.length < 2) {
    return null;
  }

  const currentRole = roles.find((role) => location.pathname.startsWith(`/${role}`));

  return (
    <Select<Role>
      size="small"
      value={currentRole}
      style={{ minWidth: 170 }}
      onChange={(role) => navigate(roleHomePath(role))}
      options={ROLE_PRIORITY.filter((role) => roles.includes(role)).map((role) => ({
        value: role,
        label: `Rol: ${role}`,
      }))}
    />
  );
};
