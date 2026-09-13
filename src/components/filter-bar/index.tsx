import { Space } from "antd";
import type { SpaceProps } from "antd";
import type { CSSProperties } from "react";

const DEFAULT_SIZE: SpaceProps["size"] = "large";
const DEFAULT_STYLE: CSSProperties = { marginBottom: 16 };

// Fila de filtros del header de un <List>: cada grupo (label + input) usa el
// gap chico por default de un <Space> anidado, pero entre grupos hace falta
// uno más grande para que se note la separación — si no, todo se ve
// igual de apretado (label+input de un filtro vs. filtro siguiente). Un
// solo lugar para ese gap y el margen inferior antes de la tabla.
export const FilterBar = ({ size = DEFAULT_SIZE, style, ...rest }: SpaceProps) => (
  <Space wrap size={size} style={{ ...DEFAULT_STYLE, ...style }} {...rest} />
);
