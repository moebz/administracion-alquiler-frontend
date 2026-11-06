import { useState } from "react";
import {
  CalculatorOutlined,
  CalendarOutlined,
  DiffOutlined,
  EditOutlined,
  FileDoneOutlined,
  PlusOutlined,
  StopOutlined,
} from "@ant-design/icons";
import {
  Alert,
  App,
  Button,
  Card,
  Col,
  Descriptions,
  Flex,
  Form,
  Input,
  Modal,
  Row,
  Space,
  Statistic,
  Table,
  Tag,
  theme,
  Tooltip,
  Typography,
} from "antd";
import type { ReactNode } from "react";
import dayjs from "dayjs";
import { Link } from "react-router";
import { extractErrorMessage } from "../../providers/auth";
import { kyInstance } from "../../providers/data";
import { formatMonto } from "../../utils/monto";
import {
  COMPRA_CONDICION_LABEL,
  COMPRA_ESTADO_COLOR,
  COMPRA_ESTADO_LABEL,
  type CompraCuotaRow,
  type CompraDetalleRow,
  type CompraNotaRow,
  type CompraRow,
} from "./types";

// Contenido de la factura de una compra, sin el wrapper <Show> — lo usa
// CompraShow (pantalla propia, todavía viva por el link desde
// pagos-proveedor/show.tsx) y GastoShow (todo el flujo de gastos vive ahí,
// ver ARQUITECTURA.md "Gastos"), cada uno con su propio permiso de anular.
export const CompraDetail = ({
  compra,
  puedeAnular,
  onAnulada,
  onEditar,
  onRegistrarNc,
  onAnularNota,
  accionesCuotas,
  avisoAnulacion,
}: {
  compra: CompraRow | undefined;
  puedeAnular: boolean;
  onAnulada: () => void;
  onEditar?: () => void;
  // Abre el alta de una NC del proveedor; sin esta prop no se ofrece (la NC se registra desde el gasto).
  onRegistrarNc?: () => void;
  // Abre la anulación de una NC; sin esta prop no se ofrece.
  onAnularNota?: (nota: CompraNotaRow) => void;
  accionesCuotas?: ReactNode;
  // Aviso que se muestra en el modal antes de anular (ej. qué pasa con el cargo del gasto).
  avisoAnulacion?: ReactNode;
}) => {
  const { message } = App.useApp();
  const { token } = theme.useToken();
  const [modalAbierto, setModalAbierto] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [form] = Form.useForm<{ motivo_anulacion: string }>();

  const anular = async (values: { motivo_anulacion: string }) => {
    if (!compra) return;
    setGuardando(true);
    const response = await kyInstance.patch(`compras/${compra.id}/anular`, { json: values });
    setGuardando(false);

    if (response.ok) {
      message.success("Compra anulada.");
      setModalAbierto(false);
      onAnulada();
      return;
    }
    message.error(await extractErrorMessage(response, "No se pudo anular la compra."));
  };

  // Los pagos con aplicaciones activas no se anulan con la factura: quedan como anticipo al proveedor.
  const tienePagosActivos = compra?.cuotas.some((cuota) => cuota.pagos.some((pago) => pago.estado === "ACTIVA")) ?? false;
  const total = Number(compra?.total ?? 0);
  // Una factura con notas registradas no se anula, y una con cualquier nota (también anulada) no se edita.
  const notas = compra?.notas ?? [];
  const tieneNotasRegistradas = notas.some((nota) => nota.estado === "REGISTRADO");
  const hoy = dayjs().startOf("day");

  const cardStyle = { borderRadius: token.borderRadiusLG, boxShadow: token.boxShadowTertiary };
  const cardTitle = (icon: ReactNode, text: string) => (
    <Space>
      {icon}
      {text}
    </Space>
  );

  return (
    <Space direction="vertical" size="large" style={{ width: "100%" }}>
      <Row gutter={[24, 24]} align="stretch">
        <Col xs={24} xl={16}>
          <Card
            variant="borderless"
            style={{ ...cardStyle, height: "100%" }}
            title={cardTitle(<FileDoneOutlined />, "Factura")}
            extra={
              <Flex gap={12} align="center">
                {compra && (
                  <Tag bordered={false} color={COMPRA_ESTADO_COLOR[compra.estado]} style={{ margin: 0 }}>
                    {COMPRA_ESTADO_LABEL[compra.estado]}
                  </Tag>
                )}
                {onEditar && compra?.estado === "REGISTRADO" && notas.length === 0 && compra.cuotas.every((cuota) => cuota.pagos.length === 0) && (
                  <Button size="small" icon={<EditOutlined />} onClick={onEditar}>
                    Editar factura
                  </Button>
                )}
                {onRegistrarNc && compra?.estado === "REGISTRADO" && (
                  <Button size="small" icon={<PlusOutlined />} onClick={onRegistrarNc}>
                    Registrar NC
                  </Button>
                )}
                {puedeAnular && compra?.estado === "REGISTRADO" && (
                  <Tooltip title={tieneNotasRegistradas ? "Anulá primero sus notas." : undefined}>
                    <Button
                      danger
                      size="small"
                      icon={<StopOutlined />}
                      disabled={tieneNotasRegistradas}
                      onClick={() => setModalAbierto(true)}
                    >
                      Anular factura
                    </Button>
                  </Tooltip>
                )}
              </Flex>
            }
          >
            <Descriptions
              layout="vertical"
              size="small"
              column={{ xs: 1, sm: 2, lg: 5 }}
              style={{ marginBottom: token.marginLG }}
              items={[
                { key: "numero", label: "Número", children: compra?.numero },
                { key: "timbrado", label: "Timbrado", children: compra?.timbrado_proveedor },
                {
                  key: "ruc",
                  label: "RUC",
                  children: compra ? `${compra.emisor_ruc}${compra.emisor_dv ? `-${compra.emisor_dv}` : ""}` : "—",
                },
                { key: "fecha", label: "Fecha", children: compra ? dayjs(compra.fecha).format("DD/MM/YYYY") : "—" },
                {
                  key: "condicion",
                  label: "Condición",
                  children: compra ? COMPRA_CONDICION_LABEL[compra.condicion] : "—",
                },
              ]}
            />
            {compra?.estado === "ANULADO" && (
              <Alert
                type="warning"
                showIcon
                message="Motivo de anulación"
                description={compra.motivo_anulacion}
                style={{ marginBottom: 24 }}
              />
            )}
            <Table dataSource={compra?.detalles} rowKey="id" pagination={false} size="middle">
              <Table.Column title="Descripción" dataIndex="descripcion" />
              <Table.Column title="Cant." dataIndex="cantidad" align="right" />
              <Table.Column
                title="Precio unit."
                dataIndex="precio_unitario"
                align="right"
                render={(precio: CompraDetalleRow["precio_unitario"]) => formatMonto(precio)}
              />
              <Table.Column
                title="IVA"
                dataIndex="tasa_iva"
                align="right"
                render={(tasa: number) => <Tag bordered={false}>{tasa}%</Tag>}
              />
              <Table.Column
                title="Subtotal"
                dataIndex="subtotal"
                align="right"
                render={(subtotal: CompraDetalleRow["subtotal"]) => <strong>{formatMonto(subtotal)}</strong>}
              />
            </Table>
          </Card>
        </Col>

        <Col xs={24} xl={8}>
          <Card
            variant="borderless"
            style={{ ...cardStyle, height: "100%" }}
            title={cardTitle(<CalculatorOutlined />, "Resumen")}
          >
            <Descriptions
              column={1}
              size="small"
              styles={{ content: { justifyContent: "flex-end" } }}
              items={[
                ["Exentas", compra?.exentas],
                ["Gravadas 5%", compra?.gravadas_5],
                ["Gravadas 10%", compra?.gravadas_10],
                ["IVA 5%", compra?.iva_5],
                ["IVA 10%", compra?.iva_10],
              ].map(([label, monto]) => ({
                key: label as string,
                label: label as string,
                children: formatMonto(monto ?? 0),
              }))}
            />
            <Statistic title="Total" value={formatMonto(total)} valueStyle={{ color: token.colorPrimary }} />
          </Card>
        </Col>
      </Row>

      {notas.length > 0 && (
        <Card variant="borderless" style={cardStyle} title={cardTitle(<DiffOutlined />, "Notas del proveedor")}>
          <Table<CompraNotaRow> dataSource={notas} rowKey="id" pagination={false} size="middle">
            <Table.Column
              title="Nota"
              key="nota"
              render={(_, nota: CompraNotaRow) => (
                <Flex vertical>
                  <span>
                    {nota.tipo === "NOTA_CREDITO" ? "NC" : "ND"} {nota.numero}
                  </span>
                  {nota.motivo && <Typography.Text type="secondary">{nota.motivo}</Typography.Text>}
                </Flex>
              )}
            />
            <Table.Column title="Fecha" dataIndex="fecha" render={(fecha: string) => dayjs(fecha).format("DD/MM/YYYY")} />
            <Table.Column title="Total" dataIndex="total" align="right" render={(monto: CompraNotaRow["total"]) => formatMonto(monto)} />
            <Table.Column
              title="Saldo a favor"
              dataIndex="saldo_a_favor"
              align="right"
              render={(saldo: CompraNotaRow["saldo_a_favor"], nota: CompraNotaRow) =>
                saldo === null || nota.estado === "ANULADO" ? "—" : <strong>{formatMonto(saldo)}</strong>
              }
            />
            <Table.Column
              title="Estado"
              key="estado"
              render={(_, nota: CompraNotaRow) => (
                <Space size={4} wrap>
                  <Tooltip title={nota.motivo_anulacion}>
                    <Tag bordered={false} color={COMPRA_ESTADO_COLOR[nota.estado]} style={{ margin: 0 }}>
                      {COMPRA_ESTADO_LABEL[nota.estado]}
                    </Tag>
                  </Tooltip>
                  {onAnularNota && nota.tipo === "NOTA_CREDITO" && nota.estado === "REGISTRADO" && (
                    <Tooltip title="Anular NC">
                      <Button danger size="small" icon={<StopOutlined />} onClick={() => onAnularNota(nota)} />
                    </Tooltip>
                  )}
                </Space>
              )}
            />
          </Table>
        </Card>
      )}

      <Card
        variant="borderless"
        style={cardStyle}
        title={cardTitle(<CalendarOutlined />, "Cuotas y pagos")}
        extra={accionesCuotas}
      >
        <Table dataSource={compra?.cuotas} rowKey="id" pagination={false} size="middle">
          <Table.Column title="N°" dataIndex="numero_cuota" width={60} />
          <Table.Column
            title="Vencimiento"
            dataIndex="fecha_vencimiento"
            render={(fecha: string) => dayjs(fecha).format("DD/MM/YYYY")}
          />
          <Table.Column
            title="Estado"
            key="estado"
            render={(_, cuota: CompraCuotaRow) =>
              Number(cuota.saldo) === 0 ? (
                <Tag color="success" bordered={false}>
                  Pagada
                </Tag>
              ) : dayjs(cuota.fecha_vencimiento).isBefore(hoy) ? (
                <Tag color="error" bordered={false}>
                  Vencida
                </Tag>
              ) : (
                <Tag color="warning" bordered={false}>
                  Pendiente
                </Tag>
              )
            }
          />
          <Table.Column
            title="Monto"
            dataIndex="monto"
            align="right"
            render={(monto: CompraCuotaRow["monto"]) => formatMonto(monto)}
          />
          <Table.Column
            title="Saldo"
            dataIndex="saldo"
            align="right"
            render={(saldo: CompraCuotaRow["saldo"]) => <strong>{formatMonto(saldo)}</strong>}
          />
          <Table.Column
            title="Pagos aplicados"
            dataIndex="pagos"
            render={(pagos: CompraCuotaRow["pagos"]) =>
              pagos.length === 0 ? (
                <Typography.Text type="secondary">Sin pagos</Typography.Text>
              ) : (
                <Flex gap={6} wrap>
                  {pagos.map((pago) => (
                    <Link key={pago.id} to={`/administrador/pagos-proveedor/show/${pago.pago_proveedor_id}`}>
                      <Tag
                        bordered={false}
                        color={pago.estado === "ANULADA" ? "default" : "blue"}
                        style={{
                          cursor: "pointer",
                          textDecoration: pago.estado === "ANULADA" ? "line-through" : undefined,
                        }}
                      >
                        Pago #{pago.pago_proveedor_numero} · {formatMonto(pago.monto_aplicado)}
                      </Tag>
                    </Link>
                  ))}
                </Flex>
              )
            }
          />
        </Table>
      </Card>

      <Modal
        title="Anular compra"
        open={modalAbierto}
        onCancel={() => setModalAbierto(false)}
        afterClose={() => form.resetFields()}
        onOk={() => form.submit()}
        okText="Anular"
        okButtonProps={{ danger: true }}
        cancelText="Cancelar"
        confirmLoading={guardando}
      >
        {tienePagosActivos && (
          <Alert
            type="info"
            showIcon
            style={{ marginBottom: 16 }}
            message="Los pagos aplicados no se anulan: quedan como anticipo al proveedor, para aplicarlos a otra factura."
          />
        )}
        {avisoAnulacion}
        <Form form={form} layout="vertical" onFinish={anular}>
          <Form.Item label="Motivo" name="motivo_anulacion" rules={[{ required: true }, { max: 255 }]}>
            <Input.TextArea rows={3} />
          </Form.Item>
        </Form>
      </Modal>
    </Space>
  );
};
