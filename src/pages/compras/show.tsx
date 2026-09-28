import { Show } from "@refinedev/antd";
import { useShow, usePermissions } from "@refinedev/core";
import { CompraDetail } from "./compra-detail";
import type { CompraRow } from "./types";

const PERMISO_ANULAR = "compras.anular";

// Sin entrada en el menú (ver ARQUITECTURA.md, "Gastos"): toda compra nace
// de un gasto y se ve/gestiona desde ahí (pages/gastos/show.tsx). Esta
// pantalla sigue viva solo como destino del link desde
// pages/pagos-proveedor/show.tsx (un pago puede aplicarse a cuotas de
// compras de distintos gastos, no tiene sentido embeberla ahí).
export const CompraShow = () => {
  const { query, result: compra } = useShow<CompraRow>();
  const { data: permissions } = usePermissions<string[]>({});
  const puedeAnular = permissions?.includes(PERMISO_ANULAR) ?? false;

  return (
    <Show title="Detalle de la compra" isLoading={query.isLoading}>
      <CompraDetail compra={compra} puedeAnular={puedeAnular} onAnulada={() => query.refetch()} />
    </Show>
  );
};
