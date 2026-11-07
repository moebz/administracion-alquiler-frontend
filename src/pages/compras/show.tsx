import { Show } from "@refinedev/antd";
import { useShow, usePermissions } from "@refinedev/core";
import { CompraDetail } from "./compra-detail";
import type { CompraRow } from "./types";

const PERMISO_ANULAR = "compras.anular";

// Sin entrada en el menú (ver ARQUITECTURA.md, "Gastos"): toda compra nace
// de un gasto y se ve/gestiona desde ahí (pages/gastos/show.tsx), salvo la
// factura del propietario, que se registra desde su cuenta corriente. Esta
// pantalla sigue viva como destino del link desde
// pages/pagos-proveedor/show.tsx (un pago puede aplicarse a cuotas de
// compras de distintos gastos, no tiene sentido embeberla ahí) y desde la
// cuenta corriente del propietario.
export const CompraShow = () => {
  const { query, result: compra } = useShow<CompraRow>();
  const { data: permissions } = usePermissions<string[]>({});
  // La factura del propietario se anula desde su cuenta corriente (la ruta genérica la rechaza).
  const puedeAnular = (permissions?.includes(PERMISO_ANULAR) ?? false) && !compra?.es_del_propietario;

  return (
    <Show
      title={compra?.es_del_propietario ? "Factura del propietario" : "Detalle de la compra"}
      isLoading={query.isLoading}
      contentProps={{
        style: { background: "transparent", boxShadow: "none" },
        styles: { body: { padding: 0 } },
      }}
    >
      <CompraDetail compra={compra} puedeAnular={puedeAnular} onAnulada={() => query.refetch()} />
    </Show>
  );
};
