import { useEffect, useMemo, useState } from "react";
import { useSelect } from "@refinedev/antd";
import { useList } from "@refinedev/core";
import { App, Alert, Button, Col, DatePicker, Descriptions, Flex, Form, Input, Modal, Row, Select, Space, Table, Tag, Tooltip, Typography } from "antd";
import { CalendarOutlined, DeleteOutlined, PlusOutlined, UnorderedListOutlined, WalletOutlined } from "@ant-design/icons";
import dayjs, { type Dayjs } from "dayjs";
import { Link, useNavigate } from "react-router";
import { MontoInput } from "../../components/monto-input";
import { SectionDivider } from "../../components/section-divider";
import { SectionRow } from "../../components/section-row";
import { extractErrorMessage } from "../../providers/auth";
import { kyInstance } from "../../providers/data";
import { formatMonto } from "../../utils/monto";
import { CARGO_TIPO_LABEL } from "../cargos/types";
import type { MedioPagoRow } from "../medios-pago/types";
import type { PersonaCuentaBancariaRow } from "../personas/types";
import type { CobroVistaPrevia, CobroVistaPreviaItem, PuntoExpedicionOpcion } from "./types";

type Valor = {
  medio_pago_id: number;
  fondo_id: number;
  monto: number;
  persona_cuenta_id?: number;
  nro_comprobante?: string;
};
type Valores = { fecha: Dayjs; punto_expedicion_id?: number; valores: Valor[] };
type Fila = CobroVistaPreviaItem & { key: number };

// Muestra la tasa de una fila; la factura abierta no tiene una sola tasa.
const etiquetaTasa = (tasa: Fila["tasa_iva"]) => {
  if (tasa === null) {
    return "—";
  }

  return tasa === 0 ? "Exenta" : `${tasa}%`;
};

const mensajeDeError = (error: unknown, porDefecto: string) =>
  typeof (error as { message?: unknown })?.message === "string" ? (error as { message: string }).message : porDefecto;

// Cobra al inquilino cargos enteros y facturas abiertas de un contrato: el usuario elige hasta qué fila cubre el cobro
// (el orden de imputación lo fija el sistema, ver ARQUITECTURA.md, "Cargos de alquiler") y el total a cobrar es ese
// acumulado. Solo se emite factura si el cobro cubre algún cargo por facturar.
export const CobrarModal = ({ contratoId, onClose }: { contratoId: number; onClose: () => void }) => {
  const { message } = App.useApp();
  const navigate = useNavigate();
  const [form] = Form.useForm<Valores>();

  const [guardando, setGuardando] = useState(false);
  const [cargando, setCargando] = useState(true);
  const [errorVistaPrevia, setErrorVistaPrevia] = useState<string>();
  const [vistaPrevia, setVistaPrevia] = useState<CobroVistaPrevia>();
  const [puntos, setPuntos] = useState<PuntoExpedicionOpcion[]>([]);
  // Índice de la última fila que cubre el cobro.
  const [hasta, setHasta] = useState(0);

  const fecha = Form.useWatch("fecha", form) as Dayjs | undefined;
  const fechaIso = fecha?.format("YYYY-MM-DD");
  const valores = Form.useWatch("valores", form) as Valor[] | undefined;

  // Recalcular la vista previa (la mora depende de la fecha) y los puntos con rango usable cada vez que cambia la fecha.
  useEffect(() => {
    if (!fechaIso) {
      return;
    }

    let vigente = true;
    setCargando(true);
    setErrorVistaPrevia(undefined);

    Promise.all([
      kyInstance.get("cobros/previsualizar", { searchParams: { contrato_id: contratoId, fecha: fechaIso } }).json<CobroVistaPrevia>(),
      kyInstance.get("cobros/puntos-expedicion", { searchParams: { fecha: fechaIso } }).json<PuntoExpedicionOpcion[]>(),
    ])
      .then(([previa, opciones]) => {
        if (!vigente) {
          return;
        }
        setVistaPrevia(previa);
        setHasta(0);
        setPuntos(opciones);

        // Precargar el punto si hay uno solo, y soltar el elegido si ya no tiene un rango usable a esta fecha.
        const elegido = form.getFieldValue("punto_expedicion_id") as number | undefined;
        if (opciones.length === 1) {
          form.setFieldValue("punto_expedicion_id", opciones[0].id);
        } else if (elegido && !opciones.some((opcion) => opcion.id === elegido)) {
          form.setFieldValue("punto_expedicion_id", undefined);
        }
      })
      .catch((error) => {
        if (vigente) {
          setErrorVistaPrevia(mensajeDeError(error, "No se pudieron calcular los cargos a cobrar."));
        }
      })
      .finally(() => {
        if (vigente) {
          setCargando(false);
        }
      });

    return () => {
      vigente = false;
    };
  }, [contratoId, fechaIso, form]);

  const filas: Fila[] = useMemo(() => (vistaPrevia?.items ?? []).map((item, key) => ({ ...item, key })), [vistaPrevia]);
  const total = filas[hasta] ? Number(filas[hasta].acumulado) : 0;
  // Emitir factura solo si el cobro cubre alguna fila que no es una factura abierta.
  const emiteFactura = filas.slice(0, hasta + 1).some((fila) => fila.documento_venta_id === null);

  // Explica bajo el punto de expedición por qué no hace falta o por qué no hay ninguno para elegir.
  const ayudaPunto = () => {
    if (!emiteFactura) {
      return "Este cobro no emite factura: solo salda facturas ya emitidas.";
    }

    if (!cargando && puntos.length === 0) {
      return "No hay un punto con un timbrado vigente y números disponibles para facturar a esta fecha.";
    }

    return undefined;
  };
  const sumaValores = (valores ?? []).reduce((acum, valor) => acum + (Number(valor?.monto) || 0), 0);

  // Con un solo medio de pago, el monto acompaña al total elegido.
  useEffect(() => {
    const actuales = form.getFieldValue("valores") as Valor[] | undefined;
    if (total > 0 && actuales?.length === 1) {
      form.setFieldValue(["valores", 0, "monto"], total);
    }
  }, [total, form]);

  const { selectProps: medioPagoSelectProps, query: medioPagoQuery } = useSelect<MedioPagoRow>({
    resource: "medios-pago",
    optionLabel: "nombre",
    optionValue: "id",
    filters: [{ field: "is_active", operator: "eq", value: true }],
  });
  // Sin cheques todavía (ver ARQUITECTURA.md, "Compras y pagos a proveedores").
  const mediosPagoOptions = (medioPagoQuery.data?.data ?? [])
    .filter((medio) => !medio.codigo.startsWith("CHEQUE"))
    .map((medio) => ({ label: medio.nombre, value: medio.id }));

  const { selectProps: fondoSelectProps } = useSelect({
    resource: "fondos",
    optionLabel: "nombre",
    optionValue: "id",
    filters: [{ field: "is_active", operator: "eq", value: true }],
  });

  const inquilinoId = vistaPrevia?.contrato.inquilino.id;
  const { result: cuentas } = useList<PersonaCuentaBancariaRow>({
    resource: `personas/${inquilinoId}/cuentas-bancarias`,
    pagination: { mode: "off" },
    filters: [{ field: "is_active", operator: "eq", value: true }],
    queryOptions: { enabled: !!inquilinoId },
  });
  const cuentaOptions = (cuentas?.data ?? []).map((cuenta) => ({
    label: `${cuenta.banco.nombre} - ${cuenta.numero_cuenta}`,
    value: cuenta.id,
  }));

  const cobrar = async (values: Valores) => {
    setGuardando(true);
    const response = await kyInstance.post("cobros", {
      json: {
        contrato_id: contratoId,
        fecha: values.fecha.format("YYYY-MM-DD"),
        punto_expedicion_id: emiteFactura ? values.punto_expedicion_id : undefined,
        valores: values.valores,
      },
    });
    setGuardando(false);

    if (response.ok) {
      const cobro = await response.json<{ id: number }>();
      message.success("Cobro registrado.");
      onClose();
      navigate(`/administrador/cobros/show/${cobro.id}`);
      return;
    }

    const body = await response.json<{ message?: string; errors?: Record<string, string[]> }>().catch(() => null);
    if (response.status === 422 && body?.errors) {
      form.setFields(
        Object.entries(body.errors).map(([name, errors]) => ({ name: name.split("."), errors })) as Parameters<
          typeof form.setFields
        >[0],
      );
      return;
    }
    message.error(await extractErrorMessage(response, "No se pudo registrar el cobro."));
  };

  const valoresCoincidenConElTotal = total > 0 && sumaValores === total;

  return (
    <Modal
      title="Cobrar cargos"
      open
      onCancel={onClose}
      onOk={() => form.submit()}
      okText="Cobrar"
      cancelText="Cancelar"
      confirmLoading={guardando}
      okButtonProps={{ disabled: cargando || !valoresCoincidenConElTotal }}
      width={820}
    >
      <Descriptions column={2} size="small" style={{ marginBottom: 16 }}>
        <Descriptions.Item label="Inquilino">{vistaPrevia?.contrato.inquilino.nombre ?? "—"}</Descriptions.Item>
        <Descriptions.Item label="Unidad">{vistaPrevia?.contrato.unidad ?? "—"}</Descriptions.Item>
      </Descriptions>

      {errorVistaPrevia && <Alert type="error" showIcon message={errorVistaPrevia} style={{ marginBottom: 16 }} />}

      <Form form={form} layout="vertical" onFinish={cobrar} initialValues={{ fecha: dayjs(), valores: [{}] }}>
        <SectionDivider icon={<CalendarOutlined />}>Datos del cobro</SectionDivider>
        <SectionRow gutter={24}>
          <Col xs={24} md={8}>
            <Form.Item
              label="Fecha"
              name="fecha"
              rules={[{ required: true }]}
              getValueProps={(value) => ({ value: value ? dayjs(value) : undefined })}
            >
              <DatePicker
                allowClear={false}
                style={{ width: "100%" }}
                format="DD/MM/YYYY"
                disabledDate={(dia) => dia.isAfter(dayjs(), "day")}
              />
            </Form.Item>
          </Col>
          <Col xs={24} md={16}>
            <Form.Item
              label="Punto de expedición"
              name="punto_expedicion_id"
              rules={[{ required: emiteFactura, message: "Elegí el punto de expedición" }]}
              extra={ayudaPunto()}
            >
              <Select
                options={puntos.map((punto) => ({ label: punto.etiqueta, value: punto.id }))}
                placeholder="Punto con rango de facturas usable"
                loading={cargando}
                disabled={!emiteFactura}
              />
            </Form.Item>
          </Col>
        </SectionRow>

        <SectionDivider icon={<UnorderedListOutlined />}>Cargos a cobrar</SectionDivider>
        {!cargando && filas.length === 0 && !errorVistaPrevia && (
          <Alert type="info" showIcon message="Este contrato no tiene nada pendiente para cobrar." style={{ marginBottom: 12 }} />
        )}
        {filas.length > 0 && (
          <>
            <Typography.Paragraph type="secondary">
              Los cargos se cobran enteros y en un orden fijo (mora, facturas abiertas, alquileres y el resto, lo vencido
              antes que lo que todavía no vence). Elegí hasta qué fila cubre el cobro.
            </Typography.Paragraph>
            <Table<Fila>
              dataSource={filas}
              rowKey="key"
              loading={cargando}
              pagination={false}
              size="small"
              rowSelection={{
                type: "radio",
                columnTitle: "Hasta",
                selectedRowKeys: [hasta],
                onChange: (keys) => setHasta(Number(keys[0])),
              }}
            >
              <Table.Column
                title="Cargo"
                dataIndex="descripcion"
                render={(descripcion: string, fila: Fila) => (
                  <Space size={4} wrap>
                    <span>{descripcion}</span>
                    {fila.documento_venta_id !== null && (
                      <Tooltip title="Ya facturada y todavía impaga (por ejemplo, por un cobro anulado): se cobra sin volver a facturar.">
                        <Tag color="blue">Factura abierta</Tag>
                      </Tooltip>
                    )}
                    {fila.cobro_anulado_id !== null && (
                      <Link to={`/administrador/cobros/show/${fila.cobro_anulado_id}`} target="_blank">
                        Ver cobro anulado
                      </Link>
                    )}
                    {fila.cargo_id === null && fila.documento_venta_id === null && (
                      <Tooltip title="Mora calculada a la fecha del cobro: se guarda como cargo al cobrar.">
                        <Tag color="orange">Mora del día</Tag>
                      </Tooltip>
                    )}
                  </Space>
                )}
              />
              <Table.Column title="Tipo" dataIndex="tipo" render={(tipo: Fila["tipo"]) => (tipo ? CARGO_TIPO_LABEL[tipo] : "Factura")} />
              <Table.Column
                title="Vence"
                dataIndex="fecha_vencimiento"
                render={(vence: string, fila: Fila) => (
                  <Typography.Text type={fila.vencido ? "danger" : undefined}>{dayjs(vence).format("DD/MM/YYYY")}</Typography.Text>
                )}
              />
              <Table.Column title="IVA" dataIndex="tasa_iva" render={etiquetaTasa} />
              <Table.Column title="Saldo" dataIndex="saldo" align="right" render={(saldo: string) => formatMonto(saldo)} />
              <Table.Column
                title="Acumulado"
                dataIndex="acumulado"
                align="right"
                render={(acumulado: string) => formatMonto(acumulado)}
              />
              <Table.Column
                title=""
                dataIndex="key"
                render={(key: number) => (key <= hasta ? <Tag color="green">Incluido</Tag> : null)}
              />
            </Table>
          </>
        )}
        {(vistaPrevia?.excluidos.length ?? 0) > 0 && (
          <Alert
            type="warning"
            showIcon
            style={{ marginTop: 12 }}
            message="Esperando la factura de reemplazo del proveedor"
            description={
              <>
                <div>Estos cargos no entran en el cobro ni en el total:</div>
                <ul style={{ margin: 0, paddingLeft: 20 }}>
                  {vistaPrevia?.excluidos.map((excluido) => (
                    <li key={excluido.cargo_id}>
                      {excluido.descripcion} · {formatMonto(excluido.saldo)}
                    </li>
                  ))}
                </ul>
              </>
            }
          />
        )}

        <SectionDivider icon={<WalletOutlined />}>Medios de cobro</SectionDivider>
        <Form.List name="valores">
          {(fields, { add, remove }) => (
            <Space direction="vertical" size={12} style={{ width: "100%" }}>
              {fields.map((field) => {
                const medioId = form.getFieldValue(["valores", field.name, "medio_pago_id"]);
                const medio = (medioPagoQuery.data?.data ?? []).find((m) => m.id === medioId);

                return (
                  <Row key={field.key} gutter={[8, 8]} align="middle">
                    <Col xs={24} md={6}>
                      <Form.Item
                        {...field}
                        name={[field.name, "medio_pago_id"]}
                        rules={[{ required: true, message: "Medio" }]}
                        noStyle
                      >
                        <Select {...medioPagoSelectProps} options={mediosPagoOptions} placeholder="Medio" style={{ width: "100%" }} />
                      </Form.Item>
                    </Col>
                    <Col xs={24} md={6}>
                      <Form.Item
                        {...field}
                        name={[field.name, "fondo_id"]}
                        rules={[{ required: true, message: "Fondo" }]}
                        noStyle
                      >
                        <Select {...fondoSelectProps} placeholder="Fondo" style={{ width: "100%" }} />
                      </Form.Item>
                    </Col>
                    <Col xs={24} md={6}>
                      <Form.Item {...field} name={[field.name, "monto"]} rules={[{ required: true, message: "Monto" }]} noStyle>
                        <MontoInput style={{ width: "100%" }} />
                      </Form.Item>
                    </Col>
                    <Col xs={20} md={5}>
                      <Form.Item
                        {...field}
                        name={[field.name, "nro_comprobante"]}
                        rules={medio?.requiere_datos_bancarios ? [{ required: true, message: "Comprobante" }] : []}
                        noStyle
                      >
                        <Input placeholder="N° comprobante" style={{ width: "100%" }} />
                      </Form.Item>
                    </Col>
                    <Col xs={4} md={1}>
                      <Button icon={<DeleteOutlined />} disabled={fields.length === 1} onClick={() => remove(field.name)} />
                    </Col>
                    {medio?.requiere_datos_bancarios && (
                      <Col xs={24} md={12}>
                        <Form.Item {...field} name={[field.name, "persona_cuenta_id"]} noStyle>
                          <Select
                            options={cuentaOptions}
                            placeholder="Cuenta del inquilino (opcional)"
                            allowClear
                            style={{ width: "100%" }}
                          />
                        </Form.Item>
                      </Col>
                    )}
                  </Row>
                );
              })}
              <Button type="dashed" icon={<PlusOutlined />} onClick={() => add()}>
                Agregar medio de cobro
              </Button>
            </Space>
          )}
        </Form.List>

        <Flex justify="flex-end" gap={8} style={{ marginTop: 16 }}>
          <Typography.Text type="secondary">Total cobrado:</Typography.Text>
          <Typography.Text strong type={sumaValores === total ? undefined : "danger"}>
            {formatMonto(sumaValores)}
          </Typography.Text>
          <Typography.Text type="secondary">de {formatMonto(total)} a cobrar</Typography.Text>
        </Flex>
      </Form>
    </Modal>
  );
};
