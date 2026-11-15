import { Typography } from "antd";
import { formatearMontoEnMoneda } from "./formato";
import type { Moneda } from "./types";

// Un monto negativo (a favor, como una NC, un anticipo o lo pagado de más) se resalta.
export const MontoEnMoneda = ({ monto, moneda, fuerte = false }: { monto: string; moneda: Moneda; fuerte?: boolean }) => (
  <Typography.Text strong={fuerte} type={Number(monto) < 0 ? "danger" : undefined}>
    {formatearMontoEnMoneda(monto, moneda)}
  </Typography.Text>
);
