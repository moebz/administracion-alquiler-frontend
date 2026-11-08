// Lo que devuelve GET /propietario/unidades (Propietario\UnidadController): una fila por unidad que hoy es del propietario.

/** El contrato vigente de la unidad. */
export type ContratoDeUnidad = {
  id: number;
  inquilino: string;
  fecha_inicio: string;
  fecha_fin: string;
  rescision_programada: boolean;
  monto_alquiler: string | null;
};

/** El contrato que ya está firmado pero todavía no empezó. */
export type ContratoFuturoDeUnidad = {
  fecha_inicio: string;
  inquilino: string;
};

/** Los alquileres vencidos y sin pagar del contrato vigente. Sin ninguno, `al_dia` es true y la deuda es "0.0000". */
export type AtrasoDeUnidad = {
  al_dia: boolean;
  deuda: string;
  cantidad: number;
  vencido_desde: string | null;
  dias: number | null;
};

export type UnidadDelPortal = {
  id: number;
  etiqueta: string;
  contrato: ContratoDeUnidad | null;
  contrato_futuro: ContratoFuturoDeUnidad | null;
  atraso: AtrasoDeUnidad | null;
};
