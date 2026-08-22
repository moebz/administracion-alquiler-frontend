import { useGetIdentity } from "@refinedev/core";
import { Typography } from "antd";
import type { Role } from "../../providers/roles";

const { Title, Text } = Typography;

type Identity = {
  name: string;
};

/**
 * Home de test por rol: valida el flujo de login/redirect/guard antes de
 * construir las pantallas reales de cada rol. Ver PROGRESO.md.
 */
export const RoleHome = ({ role }: { role: Role }) => {
  const { data: identity } = useGetIdentity<Identity>();

  return (
    <div>
      <Title level={3}>
        Estás logueado como <Text code>{role}</Text>
      </Title>
      {identity?.name && <Text>Hola, {identity.name}.</Text>}
    </div>
  );
};
