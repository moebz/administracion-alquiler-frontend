import { Alert } from "antd";
import { elegirTipoDeControl } from "./compensacion";
import { MontoCell } from "./movimientos-table";
import type { ControlDocumentos } from "./types";

// Avisa si el saldo de la cuenta corriente del propietario coincide con sus papeles (facturas, NC y pagos sin aplicar,
// más lo que falta documentar). Se muestra siempre, en verde si cuadra y en amarillo con los números si no. Solo
// informa: no bloquea la acción donde aparece.
export const ControlDocumentosAlert = ({ control }: { control: ControlDocumentos | undefined }) => {
  if (!control) {
    return null;
  }

  const tipo = elegirTipoDeControl(control);

  if (tipo === "success") {
    return <Alert type="success" showIcon style={{ marginBottom: 16 }} message="La cuenta corriente y los papeles coinciden." />;
  }

  return (
    <Alert
      type="warning"
      showIcon
      style={{ marginBottom: 16 }}
      message="La cuenta corriente y los papeles no coinciden"
      description={
        <>
          <div>
            Saldo de la cuenta corriente: <MontoCell monto={control.saldo} />
          </div>
          <div>
            Documentos abiertos: <MontoCell monto={control.documentos} />
          </div>
          <div>
            Falta documentar: <MontoCell monto={control.por_documentar} />
          </div>
          <div>
            Diferencia: <MontoCell monto={control.diferencia} />
          </div>
        </>
      }
    />
  );
};
