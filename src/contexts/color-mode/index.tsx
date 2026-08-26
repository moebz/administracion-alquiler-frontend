import type { PropsWithChildren } from "react";
import { ConfigProvider, theme } from "antd";
import esES from "antd/locale/es_ES";
import { RefineThemes } from "@refinedev/antd";

export const ColorModeContextProvider: React.FC<PropsWithChildren> = ({
  children,
}) => {
  return (
    <ConfigProvider
      // you can change the theme colors here. example: ...RefineThemes.Magenta,
      theme={{
        ...RefineThemes.Blue,
        algorithm: theme.defaultAlgorithm,
      }}
      // Textos propios de antd que no pasan por el i18nProvider de Refine
      // (paginación de tablas, Popconfirm "Sí"/"No", DatePicker, etc.) —
      // ver `providers/i18n.ts` para la traducción de los textos de Refine.
      locale={esES}
    >
      {children}
    </ConfigProvider>
  );
};
