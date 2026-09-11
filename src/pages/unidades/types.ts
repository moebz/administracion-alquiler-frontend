// "Ocupada" no es un estado propio: se deriva de `contrato_vigente_fecha_fin`
// (ver pages/unidades/list.tsx), no de `estado` (ver MODELO_DATOS.md).
export type UnidadEstado = "DISPONIBLE" | "NO_DISPONIBLE" | "MANTENIMIENTO";

export const UNIDAD_ESTADO_OPTIONS: { label: string; value: UnidadEstado }[] = [
  { label: "Disponible", value: "DISPONIBLE" },
  { label: "No disponible", value: "NO_DISPONIBLE" },
  { label: "En mantenimiento", value: "MANTENIMIENTO" },
];

export const UNIDAD_ESTADO_LABEL: Record<UnidadEstado, string> = {
  DISPONIBLE: "Disponible",
  NO_DISPONIBLE: "No disponible",
  MANTENIMIENTO: "En mantenimiento",
};

export const UNIDAD_ESTADO_COLOR: Record<UnidadEstado, string> = {
  DISPONIBLE: "green",
  NO_DISPONIBLE: "red",
  MANTENIMIENTO: "gold",
};

export type UnidadRow = {
  id: number;
  bloque_id: number;
  bloque: {
    id: number;
    nombre: string;
    edificio_id: number;
    edificio: { id: number; nombre: string };
  };
  propietario_id: number;
  propietario: { id: number; nombre: string };
  numero: string;
  piso: string | null;
  superficie_m2: number | null;
  cantidad_ambientes: number | null;
  estado: UnidadEstado;
  contrato_vigente_fecha_fin: string | null;
  // Id del contrato VIGENTE, si existe (ver pages/unidades/show.tsx, que lo usa
  // para pedir el contrato completo a contratos-alquiler/:id).
  contrato_vigente_id: number | null;
  is_active: boolean;
  fecha_baja: string | null;
};
