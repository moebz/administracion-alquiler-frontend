import { Tag, Tooltip } from "antd";
import { accionSugeridaTexto, cargoMarcaLabel, cargoMarcaTooltip, type AccionSugerida, type CargoDeudor, type CargoMarca } from "./types";

// Tag de aviso de un cargo cuya factura del proveedor se anuló, con qué hacer en el Tooltip (la acción sugerida si la hay).
export const CargoMarcaTag = ({
  marca,
  deudor,
  accion,
  tasaIva,
}: {
  marca: CargoMarca;
  deudor: CargoDeudor;
  accion?: AccionSugerida | null;
  tasaIva?: number;
}) => (
  <Tooltip title={accion ? accionSugeridaTexto(accion, deudor, tasaIva ?? 0) : cargoMarcaTooltip(marca, deudor)}>
    <Tag color="warning">{cargoMarcaLabel(marca, deudor)}</Tag>
  </Tooltip>
);
