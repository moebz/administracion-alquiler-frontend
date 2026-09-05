import { useGetIdentity } from "@refinedev/core";
import { Typography } from "antd";
import type { Section } from "../../providers/sections";

const { Title, Text } = Typography;

type Identity = {
  name: string;
};

/**
 * Home de test por sección: valida el flujo de login/redirect/guard antes de
 * construir las pantallas reales de cada sección.
 */
export const RoleHome = ({ section }: { section: Section }) => {
  const { data: identity } = useGetIdentity<Identity>();

  return (
    <div>
      <Title level={3}>
        Estás logueado en la sección <Text code>{section}</Text>
      </Title>
      {identity?.name && <Text>Hola, {identity.name}.</Text>}
    </div>
  );
};
