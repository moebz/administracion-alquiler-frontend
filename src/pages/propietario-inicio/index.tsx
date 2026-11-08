import { useCallback, useEffect, useState } from "react";
import { HomeOutlined } from "@ant-design/icons";
import { List } from "@refinedev/antd";
import { usePermissions } from "@refinedev/core";
import { App, Button, Card, Col, Row, Space, Statistic, Tooltip, Typography } from "antd";
import { Link } from "react-router";
import { PageTitle } from "../../components/page-title";
import { extractErrorMessage } from "../../providers/auth";
import { kyInstance } from "../../providers/data";
import { formatMonto } from "../../utils/monto";
import { frasesPorDocumentar, hayPorDocumentar } from "../cuentas-corrientes/documentos-propietario";
import { MovimientosTable } from "../cuentas-corrientes/movimientos-table";
import { armarTextosDeSolicitud } from "../solicitudes-transferencia/textos";
import type { SolicitudTransferencia } from "../solicitudes-transferencia/types";
import { SolicitarTransferenciaModal } from "./solicitar-transferencia-modal";
import type { PropietarioInicioDatos } from "./types";

/** Dice por qué no se puede pedir ahora, o undefined si se puede. */
const getMotivoSinPedir = (inicio: PropietarioInicioDatos | undefined): string | undefined => {
  // Sin saldo no hay nada que pedir.
  if (inicio && Number(inicio.disponible) <= 0) {
    return "No tenés saldo disponible";
  }

  // Con una pendiente hay que cancelarla antes de pedir otro monto.
  if (inicio?.solicitud?.estado === "PENDIENTE") {
    return "Ya tenés una solicitud pendiente";
  }

  return undefined;
};

// Inicio del portal del propietario: lo disponible para pedir y su última solicitud, los gastos que esperan su
// aprobación, los documentos que le faltan emitir y lo que vence después de hoy. El texto de cada tarjeta lo arma el backend.
export const PropietarioInicio = () => {
  const { message, modal } = App.useApp();
  const { data: permissions } = usePermissions<string[]>({});
  const puedeSolicitar = permissions?.includes("transferencias.solicitar") ?? false;
  const [inicio, setInicio] = useState<PropietarioInicioDatos>();
  const [cargando, setCargando] = useState(true);
  const [solicitando, setSolicitando] = useState(false);
  // Se incrementa al pedir o cancelar, para recargar el inicio.
  const [version, setVersion] = useState(0);

  useEffect(() => {
    let vigente = true;
    kyInstance
      .get("propietario/inicio")
      .json<PropietarioInicioDatos>()
      .then((datos) => vigente && setInicio(datos))
      .catch((error: { message?: string }) => {
        // Los GET fallidos se rechazan con el mensaje del servidor (ver providers/data.ts).
        if (vigente) {
          message.error(error.message ?? "No se pudo cargar el inicio.");
        }
      })
      .finally(() => vigente && setCargando(false));

    return () => {
      vigente = false;
    };
  }, [message, version]);

  const recargar = useCallback(() => setVersion((actual) => actual + 1), []);

  // Cancelar la solicitud pendiente después de confirmar.
  const confirmarCancelacion = (solicitud: SolicitudTransferencia) => {
    modal.confirm({
      title: "¿Cancelar la solicitud?",
      content: "Después podés pedir otro monto.",
      okText: "Cancelar solicitud",
      cancelText: "Volver",
      okButtonProps: { danger: true },
      onOk: async () => {
        const response = await kyInstance.patch(`propietario/solicitudes-transferencia/${solicitud.id}/cancelar`);

        if (response.ok) {
          message.success("Cancelaste tu solicitud.");
          recargar();
          return;
        }

        message.error(await extractErrorMessage(response, "No se pudo cancelar la solicitud."));
      },
    });
  };

  const gastosPendientes = inicio?.gastos_pendientes ?? 0;
  const frases = inicio && hayPorDocumentar(inicio.por_documentar) ? frasesPorDocumentar(inicio.por_documentar, "tu") : [];
  const solicitud = inicio?.solicitud ?? null;
  const motivoSinPedir = getMotivoSinPedir(inicio);

  return (
    <List title={<PageTitle icon={<HomeOutlined />}>Inicio</PageTitle>} headerButtons={() => null}>
      <Row gutter={[16, 16]}>
        <Col xs={24} md={8}>
          <Space direction="vertical" size={16} style={{ width: "100%" }}>
            <Card
              loading={cargando}
              title="Disponible para pedir"
              extra={
                puedeSolicitar && (
                  // Si no se puede pedir, el tooltip dice por qué.
                  <Tooltip title={motivoSinPedir}>
                    <span>
                      <Button type="primary" disabled={cargando || motivoSinPedir !== undefined} onClick={() => setSolicitando(true)}>
                        Solicitar transferencia
                      </Button>
                    </span>
                  </Tooltip>
                )
              }
            >
              <Statistic value={inicio ? formatMonto(inicio.disponible) : undefined} />
              <Typography.Text type="secondary">Incluye lo que venció hasta hoy, liquidado o no.</Typography.Text>
            </Card>

            {/* La última solicitud: solo si ya pidió alguna. */}
            {puedeSolicitar && solicitud && (
              <Card title="Tu solicitud">
                {armarTextosDeSolicitud(solicitud).map((texto) => (
                  <div key={texto}>{texto}</div>
                ))}
                {solicitud.estado === "PENDIENTE" && (
                  <Button style={{ marginTop: 12 }} onClick={() => confirmarCancelacion(solicitud)}>
                    Cancelar
                  </Button>
                )}
                <div style={{ marginTop: 8 }}>
                  <Link to="/propietario/transferencias">Ver todas mis transferencias</Link>
                </div>
              </Card>
            )}
          </Space>
        </Col>

        {/* Los gastos solo se muestran si hay alguno esperando: sin gastos pendientes no hay nada que aprobar. */}
        {gastosPendientes > 0 && (
          <Col xs={24} md={8}>
            <Card title="Gastos esperando tu aprobación">
              <Statistic value={gastosPendientes} />
              <Link to="/propietario/gastos">Ver gastos</Link>
            </Card>
          </Col>
        )}

        <Col xs={24} md={8}>
          <Card loading={cargando} title="Documentos que te faltan emitir">
            {/* Mostrar una frase por documento, o avisar que no falta nada. */}
            {frases.length > 0 ? (
              frases.map((frase) => <div key={frase.clave}>{frase.texto}</div>)
            ) : (
              <Typography.Text type="secondary">No te falta emitir nada.</Typography.Text>
            )}
          </Card>
        </Col>
      </Row>

      {/* Lo que vence después de hoy: solo si trae algo. */}
      {inicio && inicio.por_vencer.length > 0 && (
        <Row style={{ marginTop: 24 }}>
          <Col span={24}>
            <Typography.Title level={5}>Lo que vence después de hoy</Typography.Title>
            <MovimientosTable movimientos={inicio.por_vencer} />
          </Col>
        </Row>
      )}

      {solicitando && (
        <SolicitarTransferenciaModal
          onClose={() => setSolicitando(false)}
          onSolicitada={() => {
            setSolicitando(false);
            recargar();
          }}
        />
      )}
    </List>
  );
};
