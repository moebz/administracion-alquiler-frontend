import { useGetIdentity } from "@refinedev/core";
import { Select } from "antd";
import { useLocation, useNavigate } from "react-router";
import type { Identity } from "../../providers/identity";
import { getAccessibleSections, sectionHomePath, type Section } from "../../providers/sections";
import { capitalize } from "../../utils/strings";

/**
 * Selector de sección activa, visible en cualquier sección del layout
 * autenticado. Solo se muestra si el usuario tiene acceso a más de una —
 * cambiar de sección es navegación normal a la URL de la otra, no hay
 * "contexto" que mutar.
 */
export const SectionSwitcher = () => {
  const { data: identity } = useGetIdentity<Identity>();
  const navigate = useNavigate();
  const location = useLocation();

  const sections = getAccessibleSections(identity?.permissions ?? []);
  if (sections.length < 2) {
    return null;
  }

  const currentSection = sections.find((section) => location.pathname.startsWith(`/${section}`));

  return (
    <Select<Section>
      size="small"
      value={currentSection}
      style={{ minWidth: 170 }}
      onChange={(section) => navigate(sectionHomePath(section))}
      options={sections.map((section) => ({
        value: section,
        label: `Sección: ${capitalize(section)}`,
      }))}
    />
  );
};
