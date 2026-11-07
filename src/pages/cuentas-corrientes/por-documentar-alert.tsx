import { Alert } from "antd";
import { frasesPorDocumentar, hayPorDocumentar } from "./documentos-propietario";
import type { PorDocumentar } from "./types";

// Avisa en un modal lo que le falta documentar al propietario (su factura o su NC por los alquileres). Solo informa:
// no bloquea la acción del modal. No muestra nada si no falta nada.
export const PorDocumentarAlert = ({ porDocumentar }: { porDocumentar: PorDocumentar | undefined }) => {
  if (!hayPorDocumentar(porDocumentar)) {
    return null;
  }

  return (
    <Alert
      type="warning"
      showIcon
      style={{ marginBottom: 16 }}
      message="Falta documentar al propietario"
      description={frasesPorDocumentar(porDocumentar).map((frase) => (
        <div key={frase.clave}>{frase.texto}</div>
      ))}
    />
  );
};
