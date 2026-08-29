export type UnidadEstado = "DISPONIBLE" | "OCUPADA" | "MANTENIMIENTO";

export const UNIDAD_ESTADO_OPTIONS: { label: string; value: UnidadEstado }[] = [
  { label: "Disponible", value: "DISPONIBLE" },
  { label: "Ocupada", value: "OCUPADA" },
  { label: "En mantenimiento", value: "MANTENIMIENTO" },
];

export const UNIDAD_ESTADO_LABEL: Record<UnidadEstado, string> = {
  DISPONIBLE: "Disponible",
  OCUPADA: "Ocupada",
  MANTENIMIENTO: "En mantenimiento",
};

export const UNIDAD_ESTADO_COLOR: Record<UnidadEstado, string> = {
  DISPONIBLE: "green",
  OCUPADA: "blue",
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
  is_active: boolean;
  fecha_baja: string | null;
};
