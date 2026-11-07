import { useEffect, useState } from "react";
import { App } from "antd";
import { kyInstance } from "../../providers/data";
import { formatMonto } from "../../utils/monto";
import { RegistrarNcModal } from "../compras/registrar-nc-modal";
import type { NotaCreditoPropietarioVistaPrevia } from "./types";

type Props = {
  propietarioId: number;
  facturaId: number;
  onClose: () => void;
  /** Se llama después de registrar, para que la cuenta recargue lo que le falta documentar y las facturas. */
  onRegistrada: () => void;
};

// Registra la NC que emitió el propietario sobre su factura. Pide las líneas a `nc-preview`, que viene con el importe de
// cada una precargado con lo que sobra de su alquiler, y reutiliza el modal de NC del proveedor. No cambia la cuenta corriente.
export const RegistrarNcPropietarioModal = ({ propietarioId, facturaId, onClose, onRegistrada }: Props) => {
  const { message } = App.useApp();
  const [vistaPrevia, setVistaPrevia] = useState<NotaCreditoPropietarioVistaPrevia>();

  useEffect(() => {
    let vigente = true;
    kyInstance
      .get(`cuentas-corrientes/${propietarioId}/facturas-del-propietario/${facturaId}/nc-preview`)
      .json<NotaCreditoPropietarioVistaPrevia>()
      .then((previa) => vigente && setVistaPrevia(previa))
      .catch((falla: { message?: string }) => {
        // Los GET fallidos se rechazan con el mensaje del servidor (ver providers/data.ts).
        if (vigente) {
          message.error(falla.message ?? "No se pudieron armar las líneas de la NC.");
          onClose();
        }
      });

    return () => {
      vigente = false;
    };
  }, [propietarioId, facturaId, message, onClose]);

  if (!vistaPrevia) {
    return null;
  }

  return (
    <RegistrarNcModal
      titulo="Registrar NC del propietario"
      url={`cuentas-corrientes/${propietarioId}/facturas-del-propietario/${facturaId}/notas-credito`}
      cabecera={[
        { label: "Propietario", valor: vistaPrevia.propietario.nombre },
        { label: "Factura", valor: vistaPrevia.numero },
        { label: "Saldo de la factura", valor: formatMonto(vistaPrevia.saldo) },
      ]}
      fechaFactura={vistaPrevia.fecha}
      saldoFactura={vistaPrevia.saldo}
      lineas={vistaPrevia.lineas.map((linea) => ({
        id: linea.detalle_id,
        descripcion: linea.descripcion,
        tasa_iva: linea.tasa_iva,
        tope: linea.tope,
        importe: linea.importe,
      }))}
      contraparte="propietario"
      ayuda="La cuenta corriente no cambia: la NC solo documenta lo que ya bajó el alquiler."
      onClose={onClose}
      onSuccess={onRegistrada}
    />
  );
};
