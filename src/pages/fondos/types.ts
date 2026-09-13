export type FondoTipo = "CAJA" | "BANCO" | "OTRO";

export const FONDO_TIPO_OPTIONS: { label: string; value: FondoTipo }[] = [
  { label: "Caja", value: "CAJA" },
  { label: "Banco", value: "BANCO" },
  { label: "Otro", value: "OTRO" },
];

export const FONDO_TIPO_LABEL: Record<FondoTipo, string> = {
  CAJA: "Caja",
  BANCO: "Banco",
  OTRO: "Otro",
};

export type TipoCuenta = "CORRIENTE" | "AHORRO";

export const TIPO_CUENTA_OPTIONS: { label: string; value: TipoCuenta }[] = [
  { label: "Corriente", value: "CORRIENTE" },
  { label: "Ahorro", value: "AHORRO" },
];

export const TIPO_CUENTA_LABEL: Record<TipoCuenta, string> = {
  CORRIENTE: "Corriente",
  AHORRO: "Ahorro",
};

export type FondoRow = {
  id: number;
  nombre: string;
  tipo: FondoTipo;
  banco_id: number | null;
  banco: { id: number; nombre: string } | null;
  tipo_cuenta: TipoCuenta | null;
  numero_cuenta: string | null;
  titular: string | null;
  is_active: boolean;
  fecha_baja: string | null;
};
