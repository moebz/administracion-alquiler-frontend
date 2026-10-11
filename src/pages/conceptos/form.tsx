import { DollarOutlined, TagOutlined } from "@ant-design/icons";
import { Checkbox, Col, Form, Input, Select, Space } from "antd";
import type { FormProps } from "antd";
import { MontoInput } from "../../components/monto-input";
import { SectionDivider } from "../../components/section-divider";
import { SectionRow } from "../../components/section-row";

type ConceptoFormProps = {
  formProps: FormProps;
  codigoEditable: boolean;
};

const TASAS_IVA = [
  { value: 0, label: "0% (exento)" },
  { value: 5, label: "5%" },
  { value: 10, label: "10%" },
];

type PrecioFieldProps = {
  value?: number | null;
  onChange?: (value: number | null) => void;
};

// Campo de precio con checkbox "Sin precio": el MontoInput convierte el vacío en 0, así que NULL se elige con el checkbox.
const PrecioField = ({ value, onChange }: PrecioFieldProps) => {
  const sinPrecio = value === null || value === undefined;

  return (
    <Space direction="vertical" style={{ width: "100%" }}>
      <Checkbox
        checked={sinPrecio}
        // Tildado queda null; destildado arranca en 0 para que el usuario cargue el monto.
        onChange={(event) => onChange?.(event.target.checked ? null : 0)}
      >
        Sin sugerencia de precio
      </Checkbox>
      <MontoInput
        disabled={sinPrecio}
        value={sinPrecio ? undefined : value}
        onChange={(nuevo) => onChange?.(nuevo)}
      />
    </Space>
  );
};

export const ConceptoForm = ({ formProps, codigoEditable }: ConceptoFormProps) => (
  <Form {...formProps} layout="vertical" style={{ maxWidth: 720 }}>
    <SectionDivider icon={<TagOutlined />}>Datos generales</SectionDivider>
    <SectionRow>
      <Col xs={24} md={12}>
        <Form.Item
          label="Código"
          name="codigo"
          rules={[{ required: true }, { max: 20 }]}
          extra={codigoEditable ? "No se puede cambiar una vez creado." : undefined}
        >
          <Input disabled={!codigoEditable} />
        </Form.Item>
      </Col>
      <Col xs={24} md={12}>
        <Form.Item label="Descripción" name="descripcion" rules={[{ required: true }, { max: 100 }]}>
          <Input />
        </Form.Item>
      </Col>
    </SectionRow>

    <SectionDivider icon={<DollarOutlined />}>Facturación</SectionDivider>
    <SectionRow>
      <Col xs={24} md={12}>
        <Form.Item
          label="Precio unitario (IVA incluido)"
          name="precio_unitario"
          extra="Es un precio a sugerir: se puede cambiar al armar cada línea de la factura de venta. Tildá «Sin sugerencia de precio» si ese precio se define recién en ese momento."
        >
          <PrecioField />
        </Form.Item>
      </Col>
      <Col xs={24} md={12}>
        <Form.Item
          label="Tasa de IVA"
          name="tasa_iva"
          normalize={(value) => value ?? null}
          extra="Vacío si la tasa la define cada línea de la factura de venta (o factura proveedor de origen, o el alquiler que generó la mora)."
        >
          <Select allowClear options={TASAS_IVA} placeholder="Sin tasa fija" />
        </Form.Item>
      </Col>
    </SectionRow>
  </Form>
);
