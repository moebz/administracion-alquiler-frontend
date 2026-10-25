import { formatMonto } from "../../utils/monto";

export type CargoTipo = "ALQUILER" | "EXPENSA" | "MORA" | "OTRO";

export const CARGO_TIPO_LABEL: Record<CargoTipo, string> = {
  ALQUILER: "Alquiler",
  EXPENSA: "Expensa",
  MORA: "Mora",
  OTRO: "Otro",
};

export const CARGO_TIPO_OPTIONS: { label: string; value: CargoTipo }[] = [
  { label: "Alquiler", value: "ALQUILER" },
  { label: "Expensa", value: "EXPENSA" },
  { label: "Mora", value: "MORA" },
  { label: "Otro", value: "OTRO" },
];

// Solo estos dos se cargan a mano: EXPENSA viene de gastos y MORA se materializa al cobrar.
export const CARGO_TIPO_MANUAL_OPTIONS = CARGO_TIPO_OPTIONS.filter(
  (option) => option.value === "ALQUILER" || option.value === "OTRO",
);

export type CargoDeudor = "INQUILINO" | "PROPIETARIO";

export const CARGO_DEUDOR_LABEL: Record<CargoDeudor, string> = {
  INQUILINO: "Inquilino",
  PROPIETARIO: "Propietario",
};

// Para frases como "Cargos al propietario" o "facturado al inquilino".
export const CARGO_DEUDOR_AL: Record<CargoDeudor, string> = {
  INQUILINO: "al inquilino",
  PROPIETARIO: "al propietario",
};

// Marca calculada de un cargo activo cuya factura del proveedor se anuló.
export type CargoMarca = "REVISAR_FACTURA" | "FACTURA_ANULADA";

export const cargoMarcaLabel = (marca: CargoMarca, deudor: CargoDeudor): string => {
  if (marca === "FACTURA_ANULADA") {
    return "Factura anulada";
  }
  return `Revisar factura ${CARGO_DEUDOR_AL[deudor]}`;
};

export const cargoMarcaTooltip = (marca: CargoMarca, deudor: CargoDeudor): string => {
  if (marca === "FACTURA_ANULADA") {
    return "Registrá la factura de reemplazo del proveedor, que rehace el cargo, o anulalo desde Cargos.";
  }
  return `La factura del proveedor de este cargo se reemplazó después de facturárselo ${CARGO_DEUDOR_AL[deudor]}. Si el monto subió, falta cobrarle la diferencia; si bajó por debajo de lo facturado o cambió la tasa, anulá la factura ${CARGO_DEUDOR_AL[deudor]} (si está en plazo) o emití una NC.`;
};

// Línea de la factura vigente del proveedor a la que se puede reapuntar un cargo.
export type LineaCandidata = { id: number; descripcion: string; subtotal: number | string };

// Qué hacer con un cargo marcado "Revisar factura", según las líneas de su tasa en la factura vigente del proveedor.
export type AccionSugerida = {
  codigo: "ESPERANDO_REEMPLAZO" | "ANULAR_O_NC" | "ELEGIR_LINEA" | "AJUSTAR_Y_REAPUNTAR" | "NC_Y_REAPUNTAR";
  facturado: number | string;
  linea: LineaCandidata | null;
  // Solo NC_Y_REAPUNTAR: lo que hay que acreditar antes de reapuntar.
  diferencia: number | string | null;
  candidatas: LineaCandidata[];
};

export const accionSugeridaTexto = (accion: AccionSugerida, deudor: CargoDeudor, tasaIva: number): string => {
  const al = CARGO_DEUDOR_AL[deudor];

  if (accion.codigo === "ESPERANDO_REEMPLAZO") {
    return "Registrá la factura de reemplazo del proveedor; después vas a poder reapuntar el cargo a su línea nueva.";
  }
  if (accion.codigo === "ANULAR_O_NC") {
    return `La factura de reemplazo del proveedor no tiene una línea libre al ${tasaIva}%: anulá la factura ${al} (si está en plazo) o emití una NC por lo facturado.`;
  }
  if (accion.codigo === "ELEGIR_LINEA") {
    return `La factura de reemplazo del proveedor tiene varias líneas al ${tasaIva}%: reapuntá el cargo a la que le corresponde.`;
  }

  const subtotal = Number(accion.linea?.subtotal ?? 0);
  const facturado = Number(accion.facturado);
  if (accion.codigo === "NC_Y_REAPUNTAR") {
    return `Facturado ${al} ${formatMonto(facturado)}, la línea nueva es ${formatMonto(subtotal)}: emití una NC por ${formatMonto(accion.diferencia ?? 0)} (o anulá la factura ${al} si está en plazo) y después reapuntá.`;
  }
  if (subtotal === facturado) {
    return `Reapuntá el cargo a la línea nueva "${accion.linea?.descripcion}".`;
  }
  return `Ajustá el cargo a ${formatMonto(subtotal)} y reapuntalo a la línea nueva; la diferencia (${formatMonto(subtotal - facturado)}) queda como saldo a cobrar.`;
};

export const CARGO_DEUDOR_COLOR: Record<CargoDeudor, string> = {
  INQUILINO: "geekblue",
  PROPIETARIO: "purple",
};

export const CARGO_DEUDOR_OPTIONS: { label: string; value: CargoDeudor }[] = [
  { label: "Inquilino", value: "INQUILINO" },
  { label: "Propietario", value: "PROPIETARIO" },
];

export const TASA_IVA_OPTIONS = [
  { label: "Exenta", value: 0 },
  { label: "5%", value: 5 },
  { label: "10%", value: 10 },
];

export type CargoEstado = "PENDIENTE" | "PARCIAL" | "VENCIDO" | "PAGADO" | "ANULADO";

export const CARGO_ESTADO_OPTIONS: { label: string; value: CargoEstado }[] = [
  { label: "Pendiente", value: "PENDIENTE" },
  { label: "Parcial", value: "PARCIAL" },
  { label: "Vencido", value: "VENCIDO" },
  { label: "Pagado", value: "PAGADO" },
  { label: "Anulado", value: "ANULADO" },
];

export const CARGO_ESTADO_LABEL: Record<CargoEstado, string> = {
  PENDIENTE: "Pendiente",
  PARCIAL: "Parcial",
  VENCIDO: "Vencido",
  PAGADO: "Pagado",
  ANULADO: "Anulado",
};

export const CARGO_ESTADO_COLOR: Record<CargoEstado, string> = {
  PENDIENTE: "gold",
  PARCIAL: "blue",
  VENCIDO: "red",
  PAGADO: "green",
  ANULADO: "default",
};

export const CARGO_ESTADOS_PENDIENTES: CargoEstado[] = ["PENDIENTE", "PARCIAL", "VENCIDO"];

export type CargoRow = {
  id: number;
  deudor: CargoDeudor;
  persona_id: number;
  persona: { id: number; nombre: string };
  unidad_id: number;
  unidad: {
    id: number;
    numero: string;
    bloque: { id: number; nombre: string; edificio: { id: number; nombre: string } };
  };
  // Solo el cargo al inquilino tiene contrato.
  contrato_id: number | null;
  contrato: { id: number } | null;
  tipo: CargoTipo;
  periodo: string;
  descripcion: string;
  fecha_emision: string;
  // Null en el cargo al propietario: no se le reclama el pago.
  fecha_vencimiento: string | null;
  // Serializados como string: cast `decimal:4` (App\Models\Cargo).
  monto: number | string;
  tasa_iva: 0 | 5 | 10;
  monto_descontado: number | string;
  facturado: number | string;
  // Lo facturado menos lo que sigue impago en la cuota de su factura al inquilino.
  cobrado: number | string;
  // Lo que debe el deudor: monto − cobrado − descontado.
  saldo: number | string;
  dias_atraso: number;
  mora_al_dia: number | string;
  estado: CargoEstado;
  // Solo un cargo activo cuya factura del proveedor se anuló.
  marca: CargoMarca | null;
  // Solo con la marca REVISAR_FACTURA.
  accion_sugerida: AccionSugerida | null;
  fecha_anulacion: string | null;
  motivo_anulacion: string | null;
  gasto_id: number | null;
  gasto: { id: number; descripcion: string } | null;
};
