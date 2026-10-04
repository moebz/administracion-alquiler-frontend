import { useSelect } from "@refinedev/antd";
import { PrinterOutlined } from "@ant-design/icons";
import { Col, Form, Input, Select } from "antd";
import type { FormProps } from "antd";
import { SectionDivider } from "../../components/section-divider";
import { SectionRow } from "../../components/section-row";

type PuntoExpedicionFormProps = {
  formProps: FormProps;
  codigoEditable: boolean;
};

export const PuntoExpedicionForm = ({ formProps, codigoEditable }: PuntoExpedicionFormProps) => {
  const { selectProps: establecimientoSelectProps } = useSelect<{ id: number; codigo: string; nombre: string }>({
    resource: "establecimientos",
    optionLabel: (establecimiento) => `${establecimiento.codigo} - ${establecimiento.nombre}`,
    optionValue: "id",
    filters: [{ field: "is_active", operator: "eq", value: true }],
    defaultValue: formProps.initialValues?.establecimiento_id,
  });

  return (
    <Form {...formProps} layout="vertical" style={{ maxWidth: 720 }}>
      <SectionDivider icon={<PrinterOutlined />} style={{ marginTop: 0 }}>
        Datos generales
      </SectionDivider>
      <SectionRow>
        <Col xs={24} md={12}>
          <Form.Item
            label="Establecimiento"
            name="establecimiento_id"
            rules={[{ required: true }]}
            extra={codigoEditable ? "No se puede cambiar una vez creado." : undefined}
          >
            <Select {...establecimientoSelectProps} disabled={!codigoEditable} />
          </Form.Item>
        </Col>
        <Col xs={24} md={12}>
          <Form.Item
            label="Código"
            name="codigo"
            rules={[{ required: true }, { pattern: /^\d{3}$/, message: "Tienen que ser 3 dígitos, ej. 001" }]}
            extra={codigoEditable ? "No se puede cambiar una vez creado." : undefined}
          >
            <Input disabled={!codigoEditable} maxLength={3} placeholder="001" />
          </Form.Item>
        </Col>
        <Col xs={24}>
          <Form.Item label="Descripción" name="descripcion" rules={[{ max: 100 }]}>
            <Input placeholder="Caja 1, Oficina administrativa..." />
          </Form.Item>
        </Col>
      </SectionRow>
    </Form>
  );
};
