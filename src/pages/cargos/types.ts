import { formatMonto } from "../../utils/monto";

export type CargoTipo = "ALQUILER" | "EXPENSA" | "MORA" | "OTRO" | "AJUSTE";

export const CARGO_TIPO_LABEL: Record<CargoTipo, string> = {
  ALQUILER: "Alquiler",
  EXPENSA: "Expensa",
  MORA: "Mora",
  OTRO: "Otro",
  AJUSTE: "Ajuste",
};

export const CARGO_TIPO_OPTIONS: { label: string; value: CargoTipo }[] = [
  { label: "Alquiler", value: "ALQUILER" },
  { label: "Expensa", value: "EXPENSA" },
  { label: "Mora", value: "MORA" },
  { label: "Otro", value: "OTRO" },
  { label: "Ajuste", value: "AJUSTE" },
];

// Solo estos dos se cargan a mano: EXPENSA viene de gastos, MORA se materializa al cobrar y AJUSTE lo crean las correcciones.
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
  return `La factura del proveedor de este cargo se reemplazó después de facturárselo ${CARGO_DEUDOR_AL[deudor]}. Si la línea nueva vale más, la diferencia queda como ajuste a cobrar; si vale menos, corregí el monto antes de reapuntar; si cambió la tasa, anulá la factura ${CARGO_DEUDOR_AL[deudor]} (si está en plazo) o emití una NC.`;
};

// Línea de la factura vigente del proveedor a la que se puede reapuntar un cargo.
export type LineaCandidata = { id: number; descripcion: string; subtotal: number | string };

// Qué hacer con un cargo marcado "Revisar factura", según las líneas de su tasa en la factura vigente del proveedor.
export type AccionSugerida = {
  codigo: "ESPERANDO_REEMPLAZO" | "ANULAR_O_NC" | "ELEGIR_LINEA" | "AJUSTAR_Y_REAPUNTAR" | "NC_Y_REAPUNTAR";
  facturado: number | string;
  // Monto del cargo más el de sus ajustes: contra lo que se compara la línea nueva.
  monto_vigente: number | string;
  linea: LineaCandidata | null;
  // AJUSTAR_Y_REAPUNTAR: lo que la línea nueva supera al monto vigente y queda como ajuste a cobrar (0 si coincide).
  // NC_Y_REAPUNTAR: lo que la línea nueva queda por debajo del monto vigente y hay que bajar al corregir el monto.
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
  const diferencia = Number(accion.diferencia ?? 0);
  if (accion.codigo === "NC_Y_REAPUNTAR") {
    return `Corregí el monto a ${formatMonto(subtotal)} y reapuntá.`;
  }
  if (diferencia === 0) {
    return `Reapuntá el cargo a la línea nueva "${accion.linea?.descripcion}".`;
  }
  return `Reapuntalo a la línea nueva; la diferencia (${formatMonto(diferencia)}) queda como ajuste a cobrar.`;
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
  // Monto del cargo más el de sus AJUSTE activos: lo que el deudor debe en total por él.
  monto_vigente: number | string;
  // Cargo que corrige, solo en un AJUSTE.
  cargo_ref_id: number | null;
  cargo_ref: { id: number; descripcion: string } | null;
  // El cargo o alguno de sus AJUSTE tiene movimientos en el historial.
  tiene_correcciones: boolean;
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
  // Lo que el proveedor mantiene en la línea del cargo, si el cargo cobra más que eso (por una NC del proveedor).
  monto_segun_proveedor: number | string | null;
  fecha_anulacion: string | null;
  motivo_anulacion: string | null;
  gasto_id: number | null;
  gasto: { id: number; descripcion: string } | null;
};

// Un paso de "Corregir monto": lo que la vista previa dice que se va a hacer, ya en texto.
export type PasoCorreccion =
  | {
      tipo: "BAJAR" | "SUBIR";
      cargo_id: number;
      descripcion: string;
      monto_anterior: string;
      monto_nuevo: string;
      importe: string;
      anula: boolean;
      texto: string;
    }
  | {
      tipo: "NC";
      documento_venta_id: number;
      numero: string;
      lineas: { cargo_id: number; descripcion: string; monto: string }[];
      total: string;
      aplicado_a_cuota: string;
      saldo_a_favor: string;
      texto: string;
    }
  | {
      tipo: "AJUSTE";
      cargo_ref_id: number;
      monto: string;
      fecha_vencimiento: string | null;
      texto: string;
    };

// Respuesta de GET /cargos/{id}/correccion-preview.
export type PlanCorreccion = {
  cargo_id: number;
  monto_vigente: string;
  monto_nuevo: string;
  ajustes: { id: number; monto: string; facturado: string }[];
  pasos: PasoCorreccion[];
  avisos: string[];
  // Permisos que pide el plan y, de esos, los que le faltan al usuario.
  permisos: string[];
  permisos_faltantes: string[];
};

export type CorreccionAccion = "MONTO" | "EMITIR_NC" | "ANULAR_NC" | "CREAR_AJUSTE" | "REAPUNTE";

// Fila del historial de un cargo y sus ajustes: GET /cargos/{id}/correcciones.
export type CorreccionRow = {
  id: number;
  fecha: string;
  cargo_id: number;
  cargo_descripcion: string;
  es_ajuste: boolean;
  accion: CorreccionAccion;
  accion_label: string;
  // Con signo: cuánto cambió el monto de ese cargo.
  monto: string;
  // Monto del cargo después de este movimiento.
  monto_resultante: string;
  motivo: string;
  usuario: string | null;
  documento_venta: { id: number; numero: string | null; documento_ref_id: number | null } | null;
  linea_proveedor: { id: number; descripcion: string; documento_compra_id: number } | null;
};
