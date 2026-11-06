import { Show } from "@refinedev/antd";
import { useShow } from "@refinedev/core";
import { FacturaCobro } from "../cobros/factura-cobro";
import type { CobroFacturaRow } from "../cobros/types";

// Sin entrada en el menú: la factura al inquilino se llega desde el cobro que la saldó, desde una NC que la corrige
// o desde la respuesta de un cobro cubierto solo con saldo a favor, que no deja un cobro que mostrar.
export const FacturaVentaShow = () => {
  const { query, result: factura } = useShow<CobroFacturaRow>();

  return (
    <Show title="Factura al inquilino" isLoading={query.isLoading}>
      {factura && <FacturaCobro factura={factura} onCambio={() => query.refetch()} />}
    </Show>
  );
};
