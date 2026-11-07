import { useEffect, useState } from "react";
import { CreditCardOutlined, DeleteOutlined, FileTextOutlined, UnorderedListOutlined } from "@ant-design/icons";
import { Alert, App, Button, Col, DatePicker, Descriptions, Form, Input, InputNumber, Modal, Select, Table, Tag, Tooltip, Typography } from "antd";
import dayjs, { type Dayjs } from "dayjs";
import { MontoInput } from "../../components/monto-input";
import { SectionDivider } from "../../components/section-divider";
import { SectionRow } from "../../components/section-row";
import { kyInstance } from "../../providers/data";
import { formatMonto } from "../../utils/monto";
import { COMPRA_CONDICION_OPTIONS, type CompraCondicion } from "../compras/types";
import { armarLineas, armarLineasDelBody, editarLinea, quitarLinea, totalLineas } from "./documentos-propietario";
import type { FacturaPropietarioLinea, FacturaPropietarioVistaPrevia } from "./types";

const FORM_GUTTER = 24;

type Valores = {
  timbrado_proveedor: string;
  numero: string;
  fecha: string;
  condicion: CompraCondicion;
  cantidad_cuotas?: number;
  fecha_primer_vencimiento?: string;
};

type Props = {
  propietarioId: number;
  onClose: () => void;
  /** Se llama después de registrar, para que la cuenta recargue lo que le falta documentar y las facturas. */
  onRegistrada: () => void;
};

// Registra la factura que emitió el propietario por sus alquileres, como compra. Al elegir el período arma una línea por
// alquiler con lo que le falta facturar; el usuario carga los datos del papel y puede quitar líneas o editar montos para
// que coincidan con él. Registrar no cambia la cuenta corriente: solo documenta alquileres que ya existen.
export const RegistrarFacturaPropietarioModal = ({ propietarioId, onClose, onRegistrada }: Props) => {
  const { message } = App.useApp();
  const [form] = Form.useForm<Valores>();
  const condicion = Form.useWatch("condicion", form);

  const [periodo, setPeriodo] = useState<Dayjs>(() => dayjs());
  const [propietario, setPropietario] = useState<string>();
  const [lineas, setLineas] = useState<FacturaPropietarioLinea[]>([]);
  const [errorVistaPrevia, setErrorVistaPrevia] = useState<string>();
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);

  const periodoIso = periodo.format("YYYY-MM");
  const total = totalLineas(lineas);

  // Pedir las líneas prearmadas cada vez que cambia el período.
  useEffect(() => {
    let vigente = true;
    setCargando(true);
    setErrorVistaPrevia(undefined);
    kyInstance
      .get(`cuentas-corrientes/${propietarioId}/facturas-del-propietario/preview`, { searchParams: { periodo: periodoIso } })
      .json<FacturaPropietarioVistaPrevia>()
      .then((previa) => {
        if (vigente) {
          setPropietario(previa.propietario.nombre);
          setLineas(armarLineas(previa.lineas));
        }
      })
      .catch((falla: { message?: string }) => {
        // Los GET fallidos se rechazan con el mensaje del servidor, como "No hay alquileres por documentar".
        if (vigente) {
          setLineas([]);
          setErrorVistaPrevia(falla.message ?? "No se pudieron armar las líneas de la factura.");
        }
      })
      .finally(() => vigente && setCargando(false));

    return () => {
      vigente = false;
    };
  }, [propietarioId, periodoIso]);

  const registrar = async (values: Valores) => {
    setGuardando(true);
    const response = await kyInstance.post(`cuentas-corrientes/${propietarioId}/facturas-del-propietario`, {
      json: {
        periodo: periodoIso,
        timbrado_proveedor: values.timbrado_proveedor,
        numero: values.numero,
        fecha: dayjs(values.fecha).format("YYYY-MM-DD"),
        condicion: values.condicion,
        cantidad_cuotas: values.condicion === "CREDITO" ? values.cantidad_cuotas : undefined,
        fecha_primer_vencimiento:
          values.condicion === "CREDITO" && values.fecha_primer_vencimiento
            ? dayjs(values.fecha_primer_vencimiento).format("YYYY-MM-DD")
            : undefined,
        lineas: armarLineasDelBody(lineas),
      },
    });
    setGuardando(false);

    if (response.ok) {
      message.success("Factura del propietario registrada.");
      onRegistrada();
      return;
    }

    const body = await response.json<{ message?: string; errors?: Record<string, string[]> }>().catch(() => null);
    if (response.status === 422 && body?.errors) {
      // Mostrar bajo su campo los errores de la cabecera, y como mensaje los de las líneas (la tabla no tiene campo por línea).
      const deLineas = Object.entries(body.errors).filter(([name]) => name.startsWith("lineas"));
      form.setFields(
        Object.entries(body.errors)
          .filter(([name]) => !name.startsWith("lineas"))
          .map(([name, errors]) => ({ name: name.split("."), errors })) as Parameters<typeof form.setFields>[0],
      );
      if (deLineas.length > 0) {
        message.error(deLineas.map(([, errors]) => errors.join(" ")).join(" "));
      }
      return;
    }
    message.error(body?.message ?? "No se pudo registrar la factura del propietario.");
  };

  return (
    <Modal
      open
      width={960}
      title="Registrar factura del propietario"
      okText="Registrar"
      cancelText="Cancelar"
      okButtonProps={{ disabled: lineas.length === 0 || cargando }}
      confirmLoading={guardando}
      onOk={() => form.submit()}
      onCancel={onClose}
      destroyOnHidden
    >
      {propietario && (
        <Descriptions column={2} size="small" style={{ marginBottom: 16 }}>
          <Descriptions.Item label="Propietario">{propietario}</Descriptions.Item>
        </Descriptions>
      )}

      <Form form={form} layout="vertical" onFinish={registrar} initialValues={{ condicion: "CONTADO", fecha: dayjs() }}>
        <SectionDivider icon={<FileTextOutlined />}>Datos de la factura</SectionDivider>
        <SectionRow gutter={FORM_GUTTER}>
          <Col xs={24} md={12}>
            <Form.Item label="Timbrado del propietario" name="timbrado_proveedor" rules={[{ required: true }, { max: 20 }]}>
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
          <Col xs={24} md={12}>
            <Form.Item label="Alquileres hasta el período" extra="Arma una línea por cada alquiler que todavía no documentó.">
              <DatePicker
                allowClear={false}
                picker="month"
                style={{ width: "100%" }}
                format="MM/YYYY"
                value={periodo}
                onChange={(valor) => valor && setPeriodo(valor)}
              />
            </Form.Item>
          </Col>
        </SectionRow>

        <SectionDivider icon={<UnorderedListOutlined />}>Detalle</SectionDivider>
        {errorVistaPrevia && <Alert type="info" showIcon message={errorVistaPrevia} style={{ marginBottom: 16 }} />}
        <Table<FacturaPropietarioLinea>
          dataSource={lineas}
          loading={cargando}
          rowKey="cargo_id"
          pagination={false}
          size="small"
          locale={{ emptyText: "No hay líneas para registrar." }}
        >
          <Table.Column
            title="Descripción"
            dataIndex="descripcion"
            render={(descripcion: string, linea: FacturaPropietarioLinea) => (
              <Input
                value={descripcion}
                maxLength={255}
                onChange={(evento) => setLineas((actuales) => editarLinea(actuales, linea.cargo_id, { descripcion: evento.target.value }))}
              />
            )}
          />
          {/* La tasa la fija el contrato: si el papel trae otra, el papel está mal. */}
          <Table.Column title="IVA" dataIndex="tasa_iva" render={(tasa: number) => <Tag bordered={false}>{tasa}%</Tag>} />
          <Table.Column
            title="Monto"
            dataIndex="monto"
            width={220}
            render={(monto: number, linea: FacturaPropietarioLinea) => (
              <MontoInput
                min={1}
                addonAfter={null}
                value={monto}
                onChange={(valor) => setLineas((actuales) => editarLinea(actuales, linea.cargo_id, { monto: Number(valor) || 0 }))}
              />
            )}
          />
          <Table.Column
            title=""
            key="quitar"
            width={50}
            render={(_, linea: FacturaPropietarioLinea) => (
              <Tooltip title="Quitar línea">
                <Button
                  size="small"
                  danger
                  icon={<DeleteOutlined />}
                  onClick={() => setLineas((actuales) => quitarLinea(actuales, linea.cargo_id))}
                />
              </Tooltip>
            )}
          />
        </Table>
        <Descriptions column={1} size="small" style={{ margin: "16px 0", maxWidth: 360, marginLeft: "auto" }}>
          <Descriptions.Item label="Total">
            <Typography.Text strong>{formatMonto(total)}</Typography.Text>
          </Descriptions.Item>
        </Descriptions>

        <SectionDivider icon={<CreditCardOutlined />}>Condición de pago</SectionDivider>
        <SectionRow gutter={FORM_GUTTER}>
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
