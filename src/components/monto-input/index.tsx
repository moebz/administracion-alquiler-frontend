import { InputNumber } from "antd";
import type { InputNumberProps } from "antd";

export const MontoInput = (props: InputNumberProps<number>) => (
  <InputNumber<number>
    min={0}
    style={{ width: "100%" }}
    addonAfter="Gs."
    formatter={(value) => (value === undefined ? "" : Number(value).toLocaleString("es-PY"))}
    parser={(value) => (value ? Number(value.replace(/\D/g, "")) : 0)}
    {...props}
  />
);
