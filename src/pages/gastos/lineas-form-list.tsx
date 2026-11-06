import { DeleteOutlined, PlusOutlined } from "@ant-design/icons";
import { Alert, Button, Col, Form, Input, InputNumber, Select, Tooltip, Typography } from "antd";
import { MontoInput } from "../../components/monto-input";
import { SectionRow } from "../../components/section-row";
import { subtotalLinea, type LineaFactura } from "../../utils/factura";
import { formatMonto } from "../../utils/monto";

const TASA_IVA_OPTIONS = [
  { label: "Exenta", value: 0 },
  { label: "5%", value: 5 },
  { label: "10%", value: 10 },
];

export type LineaDocumento = LineaFactura & { descripcion: string };

// Líneas libres (descripción, cantidad, precio unitario e IVA) de una factura o ND del proveedor, en el campo `detalles`
// del form. `detalles` son los valores observados con Form.useWatch, para calcular el subtotal; `rules` valida la lista
// (ej. que sume el monto del gasto) y `precioNuevaLinea` precarga el precio de la línea que se agrega.
export const LineasFormList = ({
  detalles,
  rules,
  precioNuevaLinea,
}: {
  detalles: Partial<LineaDocumento>[];
  rules?: { validator: () => Promise<void> }[];
  precioNuevaLinea?: number;
}) => (
  <Form.List name="detalles" rules={rules}>
    {(fields, { add, remove }, { errors }) => (
      <>
        {fields.map(({ key, name }) => (
          <SectionRow key={key} gutter={12} align="top">
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
        <Button type="dashed" icon={<PlusOutlined />} onClick={() => add({ cantidad: 1, tasa_iva: 10, precio_unitario: precioNuevaLinea })}>
          Agregar línea
        </Button>
        {errors.length > 0 && <Alert type="error" showIcon message={errors} style={{ marginTop: 16 }} />}
      </>
    )}
  </Form.List>
);
