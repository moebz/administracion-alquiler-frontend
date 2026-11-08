import { SendOutlined } from "@ant-design/icons";
import { useList, usePermissions } from "@refinedev/core";
import { Badge } from "antd";

// Ícono de "Solicitudes de transferencia" en el menú, con la cantidad de pendientes. Pide el listado del resource
// con estado=PENDIENTE (solo si el usuario puede verlo): cuando Refine invalida el resource, el contador se actualiza.
export const SolicitudesIcon = () => {
  const { data: permissions } = usePermissions<string[]>({});
  const puedeVer = permissions?.includes("liquidaciones.ver") ?? false;
  const { result } = useList({
    resource: "solicitudes-transferencia",
    filters: [{ field: "estado", operator: "eq", value: "PENDIENTE" }],
    pagination: { mode: "off" },
    queryOptions: { enabled: puedeVer },
  });

  return (
    <Badge count={puedeVer ? result.data.length : 0} size="small" offset={[6, -2]}>
      <SendOutlined />
    </Badge>
  );
};
