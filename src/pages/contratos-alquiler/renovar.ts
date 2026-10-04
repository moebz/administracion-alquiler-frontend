import dayjs from "dayjs";
import type { ContratoAlquilerRow } from "./types";

export const valoresRenovacion = (contrato: ContratoAlquilerRow) => ({
  unidad_id: contrato.unidad_id,
  inquilino_id: contrato.inquilino_id,
  fecha_inicio: dayjs(contrato.fecha_fin_efectiva).add(1, "day").format("YYYY-MM-DD"),
  monto_alquiler: contrato.monto_alquiler_vigente === null ? undefined : Number(contrato.monto_alquiler_vigente),
  comision_pct: Number(contrato.comision_pct),
  mora_pct_diario: Number(contrato.mora_pct_diario),
  mora_tope_pct: contrato.mora_tope_pct === null ? undefined : Number(contrato.mora_tope_pct),
  dia_vencimiento: contrato.dia_vencimiento,
  dias_gracia: contrato.dias_gracia,
  expensas_a_cargo_de: contrato.expensas_a_cargo_de,
});
