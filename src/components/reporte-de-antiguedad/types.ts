// Los montos `decimal:4` del backend llegan como string.
export type Moneda = { id: number; codigo: string; decimales: number };

export type Balde = "por_vencer" | "d1_30" | "d31_60" | "d61_90" | "mas_90";

/** Lo pendiente de un grupo en cada balde de antigüedad. */
export type Baldes = Record<Balde, string>;

/** Los baldes y el total de un grupo, o de un lado del reporte en una moneda. */
export type TotalesDeLado = { baldes: Baldes; total: string };

/** Persona de un grupo del reporte: su nombre y su documento. */
export type PersonaDelReporte = { id: number; nombre: string; documento: string };

/** Columnas de antigüedad en el orden en que se muestran. */
export const BALDES_COLUMNAS: { balde: Balde; titulo: string }[] = [
  { balde: "por_vencer", titulo: "Por vencer" },
  { balde: "d1_30", titulo: "1–30 días" },
  { balde: "d31_60", titulo: "31–60 días" },
  { balde: "d61_90", titulo: "61–90 días" },
  { balde: "mas_90", titulo: "+90 días" },
];
