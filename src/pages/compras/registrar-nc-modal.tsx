import { useState, type ReactNode } from "react";
import { FileTextOutlined, UnorderedListOutlined } from "@ant-design/icons";
import { Alert, App, Button, Col, DatePicker, Descriptions, Form, Input, Modal, Table, Tag } from "antd";
import dayjs from "dayjs";
import { MontoInput } from "../../components/monto-input";
import { SectionDivider } from "../../components/section-divider";
import { SectionRow } from "../../components/section-row";
import { extractErrorMessage } from "../../providers/auth";
import { kyInstance } from "../../providers/data";
import { formatMonto } from "../../utils/monto";

type Valores = {
  timbrado_proveedor: string;
  numero: string;
  fecha: string;
  motivo: string;
  // Importe de la NC por línea de la factura, indexado por el id de la línea.
  importes: Record<number, number>;
};

// Línea de la factura que la NC puede corregir: su tope es lo que queda de ella y `importe` precarga el campo.
export type LineaNc = {
  id: number;
  descripcion: string;
  tasa_iva: number;
  tope: number | string;
  importe?: number | string;
};

// Registra una NC sobre una factura de compra: una línea por cada línea de la factura que se corrige, hasta lo que queda
// en ella. Se aplica sola a las cuotas de la factura y el resto queda a favor de quien la emitió. Sirve para la NC del
// proveedor de un gasto y para la del propietario; cada uno pasa su URL, su cabecera, sus líneas y el texto de ayuda.
export const RegistrarNcModal = ({
  titulo,
  url,
  cabecera,
  fechaFactura,
  saldoFactura,
  lineas: lineasFactura,
  contraparte,
  ayuda,
  onClose,
  onSuccess,
}: {
  titulo: string;
  /** Ruta a la que se postea la NC. */
  url: string;
  cabecera: { label: string; valor: ReactNode }[];
  /** YYYY-MM-DD: la NC no puede ser anterior. */
  fechaFactura: string;
  saldoFactura: number | string;
  lineas: LineaNc[];
  /** Quien emitió la factura, para el texto del saldo a favor: "proveedor" o "propietario". */
  contraparte: string;
  ayuda: ReactNode;
  onClose: () => void;
  onSuccess: () => void;
}) => {
  const { message } = App.useApp();
  const [guardando, setGuardando] = useState(false);
  const [form] = Form.useForm<Valores>();

  const importes = Form.useWatch("importes", form) as Record<number, number> | undefined;
  const totalNc = Object.values(importes ?? {}).reduce((acum, importe) => acum + (Number(importe) || 0), 0);
  // La NC se aplica a las cuotas hasta el saldo de la factura; lo que sobra queda a favor de quien la emitió.
  const aplicado = Math.min(totalNc, Number(saldoFactura));
  const aFavor = totalNc - aplicado;

  const registrar = async (values: Valores) => {
    const lineas = lineasFactura
      .map((linea) => ({ detalle_ref_id: linea.id, monto: Number(values.importes?.[linea.id]) || 0 }))
      .filter((linea) => linea.monto > 0);

    if (lineas.length === 0) {
      message.error("Indicá el importe de la NC en al menos una línea.");
      return;
    }

    setGuardando(true);
    const response = await kyInstance.post(url, {
      json: {
        timbrado_proveedor: values.timbrado_proveedor,
        numero: values.numero,
        fecha: dayjs(values.fecha).format("YYYY-MM-DD"),
        motivo: values.motivo,
        lineas,
      },
    });
    setGuardando(false);

    if (response.ok) {
      message.success("NC registrada.");
      onSuccess();
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
      if (deLineas.length > 0) message.error(deLineas.map(([, errors]) => errors.join(" ")).join(" "));
      return;
    }
    message.error(await extractErrorMessage(response, "No se pudo registrar la NC."));
  };

  return (
    <Modal
      title={titulo}
      open
      onCancel={onClose}
      onOk={() => form.submit()}
      okText="Registrar"
      cancelText="Cancelar"
      confirmLoading={guardando}
      width={760}
    >
      <Descriptions column={2} size="small" style={{ marginBottom: 16 }}>
        {cabecera.map((item) => (
          <Descriptions.Item key={item.label} label={item.label}>
            {item.valor}
          </Descriptions.Item>
        ))}
      </Descriptions>

      <Form form={form} layout="vertical" onFinish={registrar} initialValues={{ fecha: dayjs() }}>
        <SectionDivider icon={<FileTextOutlined />}>Datos de la NC</SectionDivider>
        <SectionRow gutter={24}>
          <Col xs={24} md={8}>
            <Form.Item label="Número" name="numero" rules={[{ required: true }, { max: 20 }]}>
              <Input />
            </Form.Item>
          </Col>
          <Col xs={24} md={8}>
            <Form.Item label="Timbrado" name="timbrado_proveedor" rules={[{ required: true }, { max: 20 }]}>
              <Input />
            </Form.Item>
          </Col>
          <Col xs={24} md={8}>
            <Form.Item
              label="Fecha"
              name="fecha"
              rules={[{ required: true }]}
              getValueProps={(value) => ({ value: value ? dayjs(value) : undefined })}
            >
              <DatePicker
                style={{ width: "100%" }}
                format="DD/MM/YYYY"
                // La NC no puede ser anterior a la factura que corrige.
                disabledDate={(fecha) => fecha.isBefore(dayjs(fechaFactura), "day")}
              />
            </Form.Item>
          </Col>
          <Col xs={24}>
            <Form.Item label="Motivo" name="motivo" rules={[{ required: true }, { max: 255 }]}>
              <Input placeholder="Ej.: el proveedor bajó el monto" />
            </Form.Item>
          </Col>
        </SectionRow>

        <SectionDivider icon={<UnorderedListOutlined />}>Líneas que corrige</SectionDivider>
        <Table<LineaNc> dataSource={lineasFactura} rowKey="id" pagination={false} size="small">
          <Table.Column title="Descripción" dataIndex="descripcion" />
          <Table.Column title="IVA" dataIndex="tasa_iva" render={(tasa: number) => <Tag bordered={false}>{tasa}%</Tag>} />
          <Table.Column title="Tope" dataIndex="tope" align="right" render={(tope: LineaNc["tope"]) => formatMonto(tope)} />
          <Table.Column
            title="Importe de la NC"
            key="importe"
            width={240}
            render={(_, linea: LineaNc) => (
              <Form.Item name={["importes", linea.id]} noStyle initialValue={Number(linea.importe ?? 0)}>
                <MontoInput max={Number(linea.tope)} addonAfter={null} />
              </Form.Item>
            )}
          />
          <Table.Column
            title=""
            key="todo"
            width={70}
            render={(_, linea: LineaNc) => (
              <Button
                size="small"
                disabled={Number(linea.tope) <= 0}
                onClick={() => form.setFieldValue(["importes", linea.id], Number(linea.tope))}
              >
                Todo
              </Button>
            )}
          />
        </Table>

        <Alert
          type="info"
          showIcon
          style={{ marginTop: 16 }}
          message={`Se aplican ${formatMonto(aplicado)} a la factura y quedan ${formatMonto(aFavor)} a favor con el ${contraparte}.`}
          description={ayuda}
        />
      </Form>
    </Modal>
  );
};
