import { ThemedTitle } from "@refinedev/antd";

export const AppTitle = ({ collapsed }: { collapsed?: boolean }) => (
  <div style={{ display: "flex", justifyContent: "center", width: "100%" }}>
    <ThemedTitle collapsed={!!collapsed} wrapperStyles={{ gap: 4 }} />
  </div>
);
