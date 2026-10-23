import { Tag, Tooltip } from "antd";
import { cargoMarcaLabel, cargoMarcaTooltip, type CargoDeudor, type CargoMarca } from "./types";

// Tag de aviso de un cargo cuya factura del proveedor se anuló, con el porqué y qué hacer en el Tooltip.
export const CargoMarcaTag = ({ marca, deudor }: { marca: CargoMarca; deudor: CargoDeudor }) => (
  <Tooltip title={cargoMarcaTooltip(marca, deudor)}>
    <Tag color="warning">{cargoMarcaLabel(marca, deudor)}</Tag>
  </Tooltip>
);
