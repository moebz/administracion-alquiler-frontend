import { Tag, Tooltip } from "antd";
import { formatMonto } from "../../utils/monto";

// Tag de aviso de un cargo que cobra más de lo que el proveedor mantiene en su línea (por una NC del proveedor).
// Solo avisa: el cargo no cambia solo, se corrige a mano.
export const MontoSegunProveedorTag = ({
  montoSegunProveedor,
  monto,
}: {
  montoSegunProveedor: number | string;
  monto: number | string;
}) => (
  <Tooltip title={`El proveedor bajó esta línea a ${formatMonto(montoSegunProveedor)} y este cargo sigue en ${formatMonto(monto)}`}>
    <Tag color="warning">NC del proveedor</Tag>
  </Tooltip>
);
