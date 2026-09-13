import { Row } from "antd";
import type { RowProps } from "antd";
import type { CSSProperties } from "react";

const DEFAULT_GUTTER = 64;
const DEFAULT_STYLE: CSSProperties = { paddingLeft: 24 };

// Row de una sección de form, bajo un SectionDivider: mismo gutter/indent
// por defecto en todo el form, pisable puntualmente vía props si una
// sección puntual lo necesita distinto.
export const SectionRow = ({ gutter = DEFAULT_GUTTER, style, ...rest }: RowProps) => (
  <Row gutter={gutter} style={{ ...DEFAULT_STYLE, ...style }} {...rest} />
);
