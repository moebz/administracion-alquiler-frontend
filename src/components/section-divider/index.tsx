import { ConfigProvider, Divider, theme } from "antd";
import type { CSSProperties, ReactNode } from "react";

// Divider de sección de un form (línea + ícono + texto, todo en el mismo
// color): se calcula una sola vez y se aplica en los dos lugares que lo
// necesitan (la línea vía ConfigProvider, porque son pseudo-elementos del
// Divider que no se pueden pisar con `style`; el título vía `style` normal).
// Cambiar el color de las secciones es tocar esta única línea.
export const SectionDivider = ({
  icon,
  style,
  children,
}: {
  icon: ReactNode;
  style?: CSSProperties;
  children: ReactNode;
}) => {
  const { token } = theme.useToken();
  // Variante más clara del primary (no el primary "puro"): mantiene la
  // relación de color con el resto de la UI sin competir en intensidad con
  // acciones/links que sí usan colorPrimary. La línea va un escalón más
  // clara todavía que el ícono/texto, para que no sea lo más marcado del
  // Divider.
  const color = token.colorPrimaryBorderHover;
  const lineColor = token.colorPrimaryBorder;
  return (
    <ConfigProvider theme={{ components: { Divider: { colorSplit: lineColor } } }}>
      <Divider orientation="left" orientationMargin={0} style={style}>
        <span style={{ color }}>
          <span style={{ marginRight: 8 }}>{icon}</span>
          {children}
        </span>
      </Divider>
    </ConfigProvider>
  );
};
