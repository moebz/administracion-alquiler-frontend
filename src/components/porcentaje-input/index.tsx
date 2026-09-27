import { InputNumber } from "antd";
import type { InputNumberProps } from "antd";

type PorcentajeInputProps = Omit<InputNumberProps<number>, "value"> & {
  value?: number | string | null;
};

// Number(): el backend manda el porcentaje como string `decimal:4` ("0.5000"), y InputNumber lo mostraría tal cual.
export const PorcentajeInput = ({ value, ...props }: PorcentajeInputProps) => (
  <InputNumber<number>
    min={0}
    max={100}
    style={{ width: "100%" }}
    addonAfter="%"
    value={value === undefined || value === null ? value : Number(value)}
    {...props}
  />
);
