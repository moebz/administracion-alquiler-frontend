import { Show } from "@refinedev/antd";
import { useShow } from "@refinedev/core";
import { FacturaCobro } from "../cobros/factura-cobro";
import type { CobroFacturaRow } from "../cobros/types";

// Sin entrada en el menú: la factura al inquilino se llega desde el cobro que la saldó, desde una NC que la corrige
// o desde la respuesta de un cobro cubierto solo con saldo a favor, que no deja un cobro que mostrar. La factura al
// propietario se llega desde su cuenta corriente.
export const FacturaVentaShow = () => {
  const { query, result: factura } = useShow<CobroFacturaRow>();

  return (
    <Show title={factura?.es_al_propietario ? "Factura al propietario" : "Factura al inquilino"} isLoading={query.isLoading}>
      {factura && <FacturaCobro factura={factura} onCambio={() => query.refetch()} />}
    </Show>
  );
};
