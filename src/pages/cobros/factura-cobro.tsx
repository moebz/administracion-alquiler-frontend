import { useState } from "react";
import { FileDoneOutlined, StopOutlined } from "@ant-design/icons";
import { usePermissions } from "@refinedev/core";
import {
  Alert,
  App,
  Button,
  Descriptions,
  Flex,
  Form,
  Input,
  Modal,
  Space,
  Table,
  Tag,
  Tooltip,
  Typography,
} from "antd";
import dayjs from "dayjs";
import { Link } from "react-router";
import { SectionDivider } from "../../components/section-divider";
import { extractErrorMessage } from "../../providers/auth";
import { kyInstance } from "../../providers/data";
import { formatMonto } from "../../utils/monto";
import { EmitirNcModal } from "./emitir-nc-modal";
import { describirAplicacionesActivas } from "./nota-credito";
import {
  NOTA_CREDITO_ESTADO_COLOR,
  NOTA_CREDITO_ESTADO_LABEL,
  type CobroFacturaDetalleRow,
  type CobroFacturaRow,
  type NotaCreditoAplicacionRow,
  type NotaCreditoRow,
} from "./types";

// Líneas de totales de la factura, en el orden en que se leen en una factura impresa.
const TOTALES_FACTURA: {
  label: string;
  key: "exentas" | "gravadas_5" | "iva_5" | "gravadas_10" | "iva_10";
}[] = [
  { label: "Exentas", key: "exentas" },
  { label: "Gravadas 5%", key: "gravadas_5" },
  { label: "IVA 5%", key: "iva_5" },
  { label: "Gravadas 10%", key: "gravadas_10" },
  { label: "IVA 10%", key: "iva_10" },
];

const PERMISO_ANULAR = "facturas.anular";
const PERMISO_EMITIR_NC = "facturas.emitir_nc";
const PERMISO_ANULAR_COBROS = "cobros.anular";

type FacturaCobroProps = {
  factura: CobroFacturaRow;
  // Se llama al anular la factura o al emitir o anular una NC o su aplicación, para recargar la página que la muestra.
  onCambio: () => void;
};

// Devuelve el título de la sección según cómo se muestra la factura.
const getTituloFactura = (emitidaPorEsteCobro: boolean | null) => {
  // Sin cobro (la página propia de la factura) no se dice quién la emitió.
  if (emitidaPorEsteCobro === null) {
    return "Factura";
  }

  // Con cobro, distinguir la que emitió de la que ya estaba abierta y el cobro saldó.
  if (emitidaPorEsteCobro) {
    return "Factura emitida";
  }

  return "Factura cobrada";
};

// Datos de una anulación que pide el motivo en un modal de confirmación.
type ConfirmacionConMotivo = {
  title: string;
  content?: React.ReactNode;
  // Ruta del PATCH, sin el prefijo de la API.
  url: string;
  // Campos del PATCH además del motivo.
  extra?: Record<string, unknown>;
  okDisabled?: boolean;
  exito: string;
  error: string;
};

// Una factura al inquilino a la que se aplica el cobro: la que emitió este cobro o una que ya estaba
// abierta (por ejemplo, la de un cobro anulado) y este cobro saldó.
export const FacturaCobro = ({ factura, onCambio }: FacturaCobroProps) => {
  const { message, modal } = App.useApp();
  const { data: permissions } = usePermissions<string[]>({});
  const puedeAnular = permissions?.includes(PERMISO_ANULAR) ?? false;
  // La factura al propietario no admite "Emitir NC": sus NC las emiten "Facturar al propietario" y "Corregir monto".
  const puedeEmitirNc = (permissions?.includes(PERMISO_EMITIR_NC) ?? false) && !factura.es_al_propietario;
  const puedeAnularCobros = permissions?.includes(PERMISO_ANULAR_COBROS) ?? false;

  const [modalAbierto, setModalAbierto] = useState(false);
  const [emitiendoNc, setEmitiendoNc] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [form] = Form.useForm<{ motivo_anulacion: string }>();

  const anular = async (values: { motivo_anulacion: string }) => {
    setGuardando(true);
    const response = await kyInstance.patch(
      `facturas-venta/${factura.id}/anular`,
      { json: values }
    );
    setGuardando(false);

    // Cerrar el modal y recargar el cobro, con la factura ya ANULADO.
    if (response.ok) {
      message.success("Factura anulada.");
      setModalAbierto(false);
      onCambio();
      return;
    }

    // Mostrar el motivo del rechazo (cobro aplicado, plazo vencido).
    message.error(
      await extractErrorMessage(response, "No se pudo anular la factura.")
    );
  };

  // Anular con un modal de confirmación que pide el motivo (anular una NC o la aplicación de una NC).
  const confirmarAnulacion = (confirmacion: ConfirmacionConMotivo) => {
    let motivo = "";

    modal.confirm({
      title: confirmacion.title,
      content: (
        <>
          {confirmacion.content}
          <Input.TextArea
            rows={3}
            maxLength={255}
            placeholder="Motivo de la anulación"
            onChange={(event) => {
              motivo = event.target.value;
            }}
          />
        </>
      ),
      okText: "Anular",
      okButtonProps: { danger: true, disabled: confirmacion.okDisabled },
      cancelText: "Cancelar",
      onOk: async () => {
        if (!motivo.trim()) {
          message.error("Ingresá el motivo de la anulación.");
          throw new Error("motivo requerido");
        }

        const response = await kyInstance.patch(confirmacion.url, {
          json: { motivo_anulacion: motivo, ...confirmacion.extra },
        });
        if (!response.ok) {
          message.error(await extractErrorMessage(response, confirmacion.error));
          throw new Error("anulación rechazada");
        }

        message.success(confirmacion.exito);
        onCambio();
      },
    });
  };

  // Anular una NC: lista sus aplicaciones activas, que se anulan con ella, y avisa si falta el permiso para anularlas.
  const anularNota = (nota: NotaCreditoRow) => {
    const textos = describirAplicacionesActivas(nota.aplicaciones);
    const faltaPermiso = textos.length > 0 && !puedeAnularCobros;

    confirmarAnulacion({
      title: `¿Anular la NC ${nota.numero ?? ""}?`,
      content: (
        <>
          {textos.length > 0 && (
            <Alert
              type="warning"
              showIcon
              style={{ marginBottom: 16 }}
              message="Al anular la NC se anulan sus aplicaciones"
              description={textos.map((texto) => (
                <div key={texto}>{texto}</div>
              ))}
            />
          )}
          {faltaPermiso && (
            <Alert
              type="error"
              showIcon
              style={{ marginBottom: 16 }}
              message="No tenés permiso para anular las aplicaciones de la NC (cobros.anular)."
            />
          )}
        </>
      ),
      url: `facturas-venta/${nota.id}/anular-nc`,
      extra: { confirmar_aplicaciones: textos.length > 0 },
      okDisabled: faltaPermiso,
      exito: "NC anulada.",
      error: "No se pudo anular la NC.",
    });
  };

  // Anular solo una aplicación de la NC: la cuota queda abierta y el saldo vuelve a la NC.
  const anularAplicacion = (
    aplicacion: NotaCreditoAplicacionRow,
    nota: NotaCreditoRow
  ) => {
    confirmarAnulacion({
      title: "¿Anular la aplicación de la NC?",
      content: (
        <p>
          {describirAplicacionesActivas([aplicacion])[0]} El saldo vuelve a la NC{" "}
          {nota.numero}.
        </p>
      ),
      url: `nc-venta-aplicaciones/${aplicacion.id}/anular`,
      exito: "Aplicación anulada.",
      error: "No se pudo anular la aplicación.",
    });
  };

  // Ofrecer emitir una NC solo si queda algo por acreditar en alguna línea con cargo.
  const hayPorAcreditar = factura.detalles.some(
    (detalle) => Number(detalle.tope_nc ?? 0) > 0
  );

  return (
    <>
      <SectionDivider icon={<FileDoneOutlined />}>
        {getTituloFactura(factura.emitida_por_este_cobro)}
      </SectionDivider>
      {/* Ofrecer anular solo una factura emitida; deshabilitado, el tooltip explica por qué todavía no se puede. */}
      {factura.estado === "EMITIDO" && (puedeAnular || puedeEmitirNc) && (
        <Flex justify="flex-end" gap={8} style={{ marginBottom: 8 }}>
          {puedeEmitirNc && (
            <Tooltip title={hayPorAcreditar ? undefined : "No queda nada por acreditar"}>
              <Button
                size="small"
                disabled={!hayPorAcreditar}
                onClick={() => setEmitiendoNc(true)}
              >
                Emitir NC
              </Button>
            </Tooltip>
          )}
          {puedeAnular && (
            <Tooltip title={factura.motivo_no_anulable}>
              <Button
                danger
                size="small"
                disabled={factura.motivo_no_anulable !== null}
                onClick={() => setModalAbierto(true)}
              >
                Anular factura
              </Button>
            </Tooltip>
          )}
        </Flex>
      )}
      <Descriptions
        column={{ xs: 1, md: 2, xl: 3 }}
        size="small"
        style={{ marginBottom: 16 }}
      >
        <Descriptions.Item label="Número">
          {factura.numero ?? "—"}
        </Descriptions.Item>
        <Descriptions.Item label="Fecha">
          {dayjs(factura.fecha).format("DD/MM/YYYY")}
        </Descriptions.Item>
        <Descriptions.Item label="Condición">Contado</Descriptions.Item>
        <Descriptions.Item label="Estado">
          {factura.estado === "ANULADO" ? (
            <Tag color="default">Anulada</Tag>
          ) : (
            <Tag color="green">Emitida</Tag>
          )}
        </Descriptions.Item>
        {/* Mostrar el saldo solo si la factura sigue debiendo algo (por ejemplo, con este cobro anulado). */}
        {factura.estado === "EMITIDO" && Number(factura.saldo) > 0 && (
          <Descriptions.Item label="Saldo pendiente">
            {formatMonto(factura.saldo)}
          </Descriptions.Item>
        )}
        {factura.estado === "ANULADO" && (
          <Descriptions.Item label="Motivo de anulación">
            {factura.motivo_anulacion}
          </Descriptions.Item>
        )}
      </Descriptions>
      <Table
        dataSource={factura.detalles}
        rowKey="id"
        pagination={false}
        size="small"
        summary={() => (
          <Table.Summary>
            {TOTALES_FACTURA.filter(
              ({ key }) => Number(factura[key]) !== 0
            ).map(({ label, key }) => (
              <Table.Summary.Row key={key}>
                <Table.Summary.Cell index={0} colSpan={2} align="right">
                  <Typography.Text type="secondary">{label}</Typography.Text>
                </Table.Summary.Cell>
                <Table.Summary.Cell index={2} align="right">
                  {formatMonto(factura[key])}
                </Table.Summary.Cell>
              </Table.Summary.Row>
            ))}
            <Table.Summary.Row>
              <Table.Summary.Cell index={0} colSpan={2} align="right">
                <Typography.Text strong>Total</Typography.Text>
              </Table.Summary.Cell>
              <Table.Summary.Cell index={2} align="right">
                <Typography.Text strong>
                  {formatMonto(factura.total)}
                </Typography.Text>
              </Table.Summary.Cell>
            </Table.Summary.Row>
          </Table.Summary>
        )}
      >
        <Table.Column
          title="Descripción"
          dataIndex="descripcion"
          render={(
            descripcion: CobroFacturaDetalleRow["descripcion"],
            record: CobroFacturaDetalleRow
          ) =>
            record.cargo_id ? (
              <Tooltip title="Ver cargo">
                <Link
                  to={`/administrador/cargos?cargo_id=${record.cargo_id}&todos_los_estados=1`}
                >
                  {descripcion}
                </Link>
              </Tooltip>
            ) : (
              descripcion
            )
          }
        />
        <Table.Column
          title="IVA"
          dataIndex="tasa_iva"
          render={(tasa: CobroFacturaDetalleRow["tasa_iva"]) =>
            tasa === 0 ? "Exenta" : `${tasa}%`
          }
        />
        <Table.Column
          title="Subtotal"
          dataIndex="subtotal"
          align="right"
          render={(subtotal: CobroFacturaDetalleRow["subtotal"]) =>
            formatMonto(subtotal)
          }
        />
      </Table>
      {/* Listar las NC de la factura, con anular NC dentro de las 168 h y anular aplicación en las que no vienen de un cobro. */}
      {factura.notas.length > 0 && (
        <>
          <SectionDivider icon={<FileDoneOutlined />}>
            Notas de crédito
          </SectionDivider>
          <Table<NotaCreditoRow>
            dataSource={factura.notas}
            rowKey="id"
            pagination={false}
            size="small"
            expandable={{
              rowExpandable: (nota) => nota.aplicaciones.length > 0,
              expandedRowRender: (nota) => (
                <Table<NotaCreditoAplicacionRow>
                  dataSource={nota.aplicaciones}
                  rowKey="id"
                  pagination={false}
                  size="small"
                >
                  <Table.Column
                    title="Aplicada a"
                    key="destino"
                    render={(_, aplicacion: NotaCreditoAplicacionRow) => (
                      <Link
                        to={`/administrador/facturas-venta/show/${aplicacion.documento_venta_id}`}
                      >
                        Factura {aplicacion.numero_factura}
                      </Link>
                    )}
                  />
                  <Table.Column
                    title="Monto"
                    dataIndex="monto_aplicado"
                    align="right"
                    render={(monto: NotaCreditoAplicacionRow["monto_aplicado"]) =>
                      formatMonto(monto)
                    }
                  />
                  <Table.Column
                    title="Cobro"
                    key="cobro"
                    render={(_, aplicacion: NotaCreditoAplicacionRow) =>
                      aplicacion.cobro_cliente_id !== null ? (
                        <Link to={`/administrador/cobros/show/${aplicacion.cobro_cliente_id}`}>
                          Cobro {aplicacion.numero_cobro}
                        </Link>
                      ) : (
                        "Sin cobro"
                      )
                    }
                  />
                  <Table.Column
                    title="Estado"
                    key="estado"
                    render={(_, aplicacion: NotaCreditoAplicacionRow) =>
                      aplicacion.estado === "ACTIVA" ? (
                        <Space size={4} wrap>
                          <Tag color="green">Activa</Tag>
                          {puedeAnularCobros && aplicacion.cobro_cliente_id === null && (
                            <Tooltip title="Anular aplicación">
                              <Button
                                danger
                                size="small"
                                icon={<StopOutlined />}
                                onClick={() => anularAplicacion(aplicacion, nota)}
                              />
                            </Tooltip>
                          )}
                        </Space>
                      ) : (
                        <Tooltip title={aplicacion.motivo_anulacion}>
                          <Tag color="default">Anulada</Tag>
                        </Tooltip>
                      )
                    }
                  />
                </Table>
              ),
            }}
          >
            <Table.Column
              title="Nota"
              key="nota"
              render={(_, nota: NotaCreditoRow) => (
                <Flex vertical>
                  <span>NC {nota.numero ?? "—"}</span>
                  {nota.motivo && (
                    <Typography.Text type="secondary">
                      {nota.motivo}
                    </Typography.Text>
                  )}
                </Flex>
              )}
            />
            <Table.Column
              title="Fecha"
              dataIndex="fecha"
              render={(fecha: string) => dayjs(fecha).format("DD/MM/YYYY")}
            />
            <Table.Column
              title="Total"
              dataIndex="total"
              align="right"
              render={(total: NotaCreditoRow["total"]) => formatMonto(total)}
            />
            <Table.Column
              title="Saldo a favor"
              dataIndex="saldo_a_favor"
              align="right"
              render={(saldo: NotaCreditoRow["saldo_a_favor"], nota: NotaCreditoRow) =>
                nota.estado === "ANULADO" ? "—" : <strong>{formatMonto(saldo)}</strong>
              }
            />
            <Table.Column
              title="Estado"
              key="estado"
              render={(_, nota: NotaCreditoRow) => (
                <Space size={4} wrap>
                  <Tooltip title={nota.motivo_anulacion}>
                    <Tag bordered={false} color={NOTA_CREDITO_ESTADO_COLOR[nota.estado]} style={{ margin: 0 }}>
                      {NOTA_CREDITO_ESTADO_LABEL[nota.estado]}
                    </Tag>
                  </Tooltip>
                  {/* Ofrecer anular solo una NC emitida; deshabilitado, el tooltip explica por qué ya no se puede (168 h). */}
                  {puedeAnular && nota.estado === "EMITIDO" && (
                    <Tooltip title={nota.motivo_no_anulable ?? "Anular NC"}>
                      <Button
                        danger
                        size="small"
                        icon={<StopOutlined />}
                        disabled={nota.motivo_no_anulable !== null}
                        onClick={() => anularNota(nota)}
                      />
                    </Tooltip>
                  )}
                </Space>
              )}
            />
          </Table>
        </>
      )}
      {emitiendoNc && (
        <EmitirNcModal
          factura={factura}
          onClose={() => setEmitiendoNc(false)}
          onSuccess={() => {
            setEmitiendoNc(false);
            onCambio();
          }}
        />
      )}
      <Modal
        title={`Anular factura ${factura.numero ?? ""}`}
        open={modalAbierto}
        onCancel={() => setModalAbierto(false)}
        afterClose={() => form.resetFields()}
        onOk={() => form.submit()}
        okText="Anular"
        okButtonProps={{ danger: true }}
        cancelText="Cancelar"
        confirmLoading={guardando}
      >
        <Form form={form} layout="vertical" onFinish={anular}>
          <p>
            Sus cargos vuelven a quedar pendientes de facturar y el número queda
            usado en el timbrado.
          </p>
          <Form.Item
            label="Motivo"
            name="motivo_anulacion"
            rules={[{ required: true }, { max: 255 }]}
          >
            <Input.TextArea rows={3} />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
};
