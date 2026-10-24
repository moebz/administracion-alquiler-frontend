import { Row } from "antd";
import type { RowProps } from "antd";

const DEFAULT_GUTTER = 64;

// Row de una sección de form, bajo un SectionDivider: mismo gutter por
// defecto en todo el form, pisable puntualmente vía props si una sección
// puntual lo necesita distinto.
export const SectionRow = ({ gutter = DEFAULT_GUTTER, ...rest }: RowProps) => (
  <Row gutter={gutter} {...rest} />
);
