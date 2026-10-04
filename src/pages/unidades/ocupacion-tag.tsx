import { Tag } from "antd";
import dayjs from "dayjs";
import type { UnidadRow } from "./types";

export const OcupacionTag = ({ unidad }: { unidad: Pick<UnidadRow, "contrato_vigente_fecha_fin"> }) =>
  unidad.contrato_vigente_fecha_fin ? (
    <Tag color="blue">{`Ocupada hasta ${dayjs(unidad.contrato_vigente_fecha_fin).format("DD/MM/YYYY")}`}</Tag>
  ) : (
    <Tag>Libre</Tag>
  );
