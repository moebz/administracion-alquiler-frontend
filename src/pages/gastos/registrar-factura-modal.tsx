import { useState } from "react";
import { CreditCardOutlined, DeleteOutlined, FileTextOutlined, PlusOutlined, UnorderedListOutlined } from "@ant-design/icons";
import { Alert, App, Button, Checkbox, Col, DatePicker, Descriptions, Form, Input, InputNumber, Modal, Select, Tooltip, Typography } from "antd";
import dayjs from "dayjs";
import { kyInstance } from "../../providers/data";
import { SectionDivider } from "../../components/section-divider";
import { SectionRow } from "../../components/section-row";
import { MontoInput } from "../../components/monto-input";
import { subtotalLinea, totalesFactura, type LineaFactura } from "../../utils/factura";
import { formatMonto } from "../../utils/monto";
import { COMPRA_CONDICION_OPTIONS, type CompraCondicion } from "../compras/types";
import type { CompraRow } from "../compras/types";
import type { CargoPrevisto, GastoRow } from "./types";

const TASA_IVA_OPTIONS = [
  { label: "Exenta", value: 0 },
  { label: "5%", value: 5 },
  { label: "10%", value: 10 },
];

const FORM_GUTTER = 24;
const ROW_STYLE = { paddingLeft: 0 };

type Linea = LineaFactura & { descripcion: string };

type Valores = {
  timbrado_proveedor: string;
  numero: string;
  fecha: string;
  condicion: CompraCondicion;
  detalles: Linea[];
  cantidad_cuotas?: number;
  fecha_primer_vencimiento?: string;
  crear_cargo?: boolean;
  fecha_vencimiento_cargo?: string;
};

const CARGO_TIPO_PREVISTO_LABEL = { EXPENSA: "Expensa", OTRO: "Otro" };

// Avisa qué va a pasar con el cargo al inquilino antes de registrar la factura.
const AvisoCargo = ({ previsto }: { previsto: CargoPrevisto }) => {
  const detalle = `${CARGO_TIPO_PREVISTO_LABEL[previsto.tipo]} de ${formatMonto(previsto.monto)} a ${previsto.inquilino}`;

  // Vencimiento sugerido por el contrato; el usuario lo puede cambiar (no antes de hoy).
  const campoVencimiento = (
    <Form.Item
      label="Vencimiento del cargo"
      name="fecha_vencimiento_cargo"
      extra="Sugerido: el próximo día de vencimiento del contrato, para cobrarlo junto con el alquiler."
      getValueProps={(value) => ({ value: value ? dayjs(value) : undefined })}
      style={{ margin: "12px 0 0", maxWidth: 360 }}
    >
      <DatePicker style={{ width: "100%" }} format="DD/MM/YYYY" disabledDate={(fecha) => fecha.isBefore(dayjs(), "day")} />
    </Form.Item>
  );

  if (previsto.estado === "BLOQUEADO") {
    return (
      <Alert
        type="error"
        showIcon
        style={{ marginBottom: 16 }}
        message="No se puede registrar la factura"
        description="El contrato de este gasto fue anulado, así que no hay a quién cargarle el gasto. Anulá el gasto y registralo de nuevo."
      />
    );
  }

  if (previsto.estado === "YA_TUVO") {
    return (
      <Alert
        type="info"
        showIcon
        style={{ marginBottom: 16 }}
        message="No se crea un cargo nuevo"
        description="Este gasto ya tuvo un cargo al inquilino (activo o anulado). Si hace falta, se gestiona desde Cargos."
      />
    );
  }

  if (previsto.estado === "CONFIRMAR") {
    return (
      <Alert
        type="warning"
        showIcon
        style={{ marginBottom: 16 }}
        message={`Estás a punto de crear un cargo para un contrato ${previsto.contrato_situacion === "RESCINDIDO" ? "rescindido" : "finalizado"}`}
        description={
          <>
            <div>Cargo previsto: {detalle}.</div>
            <div>Sin tildar, la factura se registra sin cargo y el gasto queda sin recuperar: lo absorbe la administradora.</div>
            <Form.Item name="crear_cargo" valuePropName="checked" style={{ margin: "8px 0 0" }}>
              <Checkbox>Crear el cargo al inquilino</Checkbox>
            </Form.Item>
            {campoVencimiento}
          </>
        }
      />
    );
  }

  return (
    <Alert
      type="info"
      showIcon
      style={{ marginBottom: 16 }}
      message="Se creará un cargo al inquilino"
      description={
        <>
          <div>{detalle}.</div>
          {campoVencimiento}
        </>
      }
    />
  );
};

const valoresIniciales = (gasto: GastoRow, compra?: CompraRow) =>
  compra
    ? {
        timbrado_proveedor: compra.timbrado_proveedor,
        numero: compra.numero,
        fecha: compra.fecha,
        condicion: compra.condicion,
        detalles: compra.detalles.map((detalle) => ({
          descripcion: detalle.descripcion,
          cantidad: Number(detalle.cantidad),
          precio_unitario: Number(detalle.precio_unitario),
          tasa_iva: detalle.tasa_iva,
        })),
        cantidad_cuotas: compra.cuotas.length,
        fecha_primer_vencimiento: compra.cuotas[0]?.fecha_vencimiento,
      }
    : {
        condicion: "CONTADO",
        detalles: [{ descripcion: gasto.descripcion, cantidad: 1, precio_unitario: Number(gasto.monto), tasa_iva: 10 }],
        fecha_vencimiento_cargo: gasto.cargo_previsto?.fecha_vencimiento,
      };

// Con `compra` edita esa factura (PUT) en vez de registrar una nueva (POST).
export const RegistrarFacturaModal = ({
  gasto,
  compra,
  onClose,
  onSuccess,
}: {
  gasto: GastoRow;
  compra?: CompraRow;
  onClose: () => void;
  onSuccess: () => void;
}) => {
  const { message } = App.useApp();
  const [guardando, setGuardando] = useState(false);
  const [form] = Form.useForm<Valores>();
  const condicion = Form.useWatch("condicion", form);
  const detalles = Form.useWatch("detalles", form) ?? [];
  const montoGasto = Number(gasto.monto);
  const totales = totalesFactura(detalles);
  const diferencia = montoGasto - totales.total;
  // Solo al registrar: editar la factura no toca el cargo.
  const previsto = compra ? null : gasto.cargo_previsto;

  const registrar = async (values: Valores) => {
    setGuardando(true);
    const response = await kyInstance[compra ? "put" : "post"](`gastos/${gasto.id}/factura`, {
      json: {
        ...values,
        fecha: dayjs(values.fecha).format("YYYY-MM-DD"),
        fecha_primer_vencimiento: values.condicion === "CREDITO" && values.fecha_primer_vencimiento
          ? dayjs(values.fecha_primer_vencimiento).format("YYYY-MM-DD")
          : undefined,
        fecha_vencimiento_cargo: values.fecha_vencimiento_cargo
          ? dayjs(values.fecha_vencimiento_cargo).format("YYYY-MM-DD")
          : undefined,
      },
    });
    setGuardando(false);

    if (response.ok) {
      message.success(compra ? "Factura actualizada." : "Factura registrada.");
      onSuccess();
      return;
    }

    const body = await response.json<{ message?: string; errors?: Record<string, string[]> }>().catch(() => null);
    if (response.status === 422 && body?.errors) {
      form.setFields(
        Object.entries(body.errors).map(([name, errors]) => ({
          name: name.split(".").map((parte) => (/^\d+$/.test(parte) ? Number(parte) : parte)) as never,
          errors,
        })),
      );
      return;
    }
    message.error(body?.message ?? (compra ? "No se pudo actualizar la factura." : "No se pudo registrar la factura."));
  };

  return (
    <Modal
      title={compra ? "Editar factura del proveedor" : "Registrar factura del proveedor"}
      open
      onCancel={onClose}
      onOk={() => form.submit()}
      okText={compra ? "Guardar" : "Registrar"}
      cancelText="Cancelar"
      confirmLoading={guardando}
      okButtonProps={{ disabled: previsto?.estado === "BLOQUEADO" }}
      width={960}
    >
      <Descriptions column={2} size="small" style={{ marginBottom: 16 }}>
        <Descriptions.Item label="Gasto">{gasto.descripcion}</Descriptions.Item>
        <Descriptions.Item label="Proveedor">{gasto.proveedor.nombre}</Descriptions.Item>
        <Descriptions.Item label="Monto">{formatMonto(gasto.monto)}</Descriptions.Item>
      </Descriptions>
      <Form
        form={form}
        layout="vertical"
        onFinish={registrar}
        initialValues={valoresIniciales(gasto, compra)}
      >
        {previsto && <AvisoCargo previsto={previsto} />}
        <SectionDivider icon={<FileTextOutlined />} style={{ marginTop: 16 }}>
          Datos de la factura
        </SectionDivider>
        <SectionRow gutter={FORM_GUTTER} style={ROW_STYLE}>
          <Col xs={24} md={12}>
            <Form.Item label="Timbrado del proveedor" name="timbrado_proveedor" rules={[{ required: true }, { max: 20 }]}>
              <Input />
            </Form.Item>
          </Col>
          <Col xs={24} md={12}>
            <Form.Item label="Número de factura" name="numero" rules={[{ required: true }, { max: 20 }]}>
              <Input placeholder="001-001-0000001" />
            </Form.Item>
          </Col>
          <Col xs={24} md={12}>
            <Form.Item
              label="Fecha"
              name="fecha"
              rules={[{ required: true }]}
              getValueProps={(value) => ({ value: value ? dayjs(value) : undefined })}
            >
              <DatePicker style={{ width: "100%" }} format="DD/MM/YYYY" />
            </Form.Item>
          </Col>
        </SectionRow>

        <SectionDivider icon={<UnorderedListOutlined />}>Detalle</SectionDivider>
        <Form.List
          name="detalles"
          rules={[
            {
              validator: async () => {
                if (diferencia > 0) throw new Error(`Faltan ${formatMonto(diferencia)} para completar el monto del gasto (${formatMonto(montoGasto)}).`);
                if (diferencia < 0) throw new Error(`Las líneas superan en ${formatMonto(-diferencia)} el monto del gasto (${formatMonto(montoGasto)}).`);
              },
            },
          ]}
        >
          {(fields, { add, remove }, { errors }) => (
            <>
              {fields.map(({ key, name }) => (
                <SectionRow key={key} gutter={12} style={ROW_STYLE} align="top">
                  <Col xs={24} md={8}>
                    <Form.Item label={name === 0 ? "Descripción" : undefined} name={[name, "descripcion"]} rules={[{ required: true }, { max: 255 }]}>
                      <Input />
                    </Form.Item>
                  </Col>
                  <Col xs={12} md={3}>
                    <Form.Item label={name === 0 ? "Cantidad" : undefined} name={[name, "cantidad"]} rules={[{ required: true }]}>
                      <InputNumber style={{ width: "100%" }} min={0.0001} />
                    </Form.Item>
                  </Col>
                  <Col xs={12} md={5}>
                    <Form.Item label={name === 0 ? "Precio unitario" : undefined} name={[name, "precio_unitario"]} rules={[{ required: true }]}>
                      <MontoInput min={1} />
                    </Form.Item>
                  </Col>
                  <Col xs={12} md={4}>
                    <Form.Item label={name === 0 ? "IVA" : undefined} name={[name, "tasa_iva"]} rules={[{ required: true }]}>
                      <Select options={TASA_IVA_OPTIONS} />
                    </Form.Item>
                  </Col>
                  <Col xs={10} md={3}>
                    <Form.Item label={name === 0 ? "Subtotal" : undefined}>
                      <Typography.Text>{formatMonto(subtotalLinea(detalles[name] ?? {}))}</Typography.Text>
                    </Form.Item>
                  </Col>
                  <Col xs={2} md={1}>
                    <Form.Item label={name === 0 ? " " : undefined}>
                      <Tooltip title="Quitar línea">
                        <Button size="small" icon={<DeleteOutlined />} disabled={fields.length === 1} onClick={() => remove(name)} />
                      </Tooltip>
                    </Form.Item>
                  </Col>
                </SectionRow>
              ))}
              <Button
                type="dashed"
                icon={<PlusOutlined />}
                onClick={() => add({ cantidad: 1, tasa_iva: 10, precio_unitario: diferencia > 0 ? diferencia : undefined })}
              >
                Agregar línea
              </Button>
              {errors.length > 0 && <Alert type="error" showIcon message={errors} style={{ marginTop: 16 }} />}
            </>
          )}
        </Form.List>
        <Descriptions column={1} size="small" style={{ margin: "16px 0", maxWidth: 360, marginLeft: "auto" }}>
          <Descriptions.Item label="Exentas">{formatMonto(totales.exentas)}</Descriptions.Item>
          {totales.gravadas_5 > 0 && (
            <Descriptions.Item label="Gravadas 5% / IVA">
              {formatMonto(totales.gravadas_5)} / {formatMonto(totales.iva_5)}
            </Descriptions.Item>
          )}
          {totales.gravadas_10 > 0 && (
            <Descriptions.Item label="Gravadas 10% / IVA">
              {formatMonto(totales.gravadas_10)} / {formatMonto(totales.iva_10)}
            </Descriptions.Item>
          )}
          <Descriptions.Item label="Total">
            <Typography.Text type={diferencia === 0 ? "success" : "danger"}>
              {formatMonto(totales.total)} de {formatMonto(montoGasto)}
              {diferencia > 0 && ` (faltan ${formatMonto(diferencia)})`}
              {diferencia < 0 && ` (sobran ${formatMonto(-diferencia)})`}
            </Typography.Text>
          </Descriptions.Item>
        </Descriptions>

        <SectionDivider icon={<CreditCardOutlined />}>Condición de pago</SectionDivider>
        <SectionRow gutter={FORM_GUTTER} style={ROW_STYLE}>
          <Col xs={24} md={12}>
            <Form.Item label="Condición" name="condicion" rules={[{ required: true }]}>
              <Select options={COMPRA_CONDICION_OPTIONS} />
            </Form.Item>
          </Col>
          {condicion === "CREDITO" && (
            <>
              <Col xs={24} md={12}>
                <Form.Item label="Cantidad de cuotas" name="cantidad_cuotas" rules={[{ required: true }]}>
                  <InputNumber style={{ width: "100%" }} min={1} precision={0} />
                </Form.Item>
              </Col>
              <Col xs={24} md={12}>
                <Form.Item
                  label="Fecha del primer vencimiento"
                  name="fecha_primer_vencimiento"
                  rules={[{ required: true }]}
                  getValueProps={(value) => ({ value: value ? dayjs(value) : undefined })}
                >
                  <DatePicker style={{ width: "100%" }} format="DD/MM/YYYY" />
                </Form.Item>
              </Col>
            </>
          )}
        </SectionRow>
      </Form>
    </Modal>
  );
};
