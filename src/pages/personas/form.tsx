import { useSelect } from "@refinedev/antd";
import { IdcardOutlined, PhoneOutlined, SafetyCertificateOutlined, UserOutlined } from "@ant-design/icons";
import { Col, Form, Input, Select } from "antd";
import type { FormProps } from "antd";
import { SectionDivider } from "../../components/section-divider";
import { SectionRow } from "../../components/section-row";
import { capitalize } from "../../utils/strings";
import { TIPO_PERSONA_OPTIONS } from "./types";

type PersonaFormProps = {
  formProps: FormProps;
};

// Form compartido entre Crear y Editar (pages/personas/create.tsx y edit.tsx):
// mismos campos y mismos selects, la única diferencia entre ambos es el
// prellenado de initialValues (ver GastoForm en pages/gastos/form.tsx, mismo
// patrón).
export const PersonaForm = ({ formProps }: PersonaFormProps) => {
  const { selectProps: tipoIdentificacionSelectProps } = useSelect({
    resource: "tipos-identificacion",
    optionLabel: "nombre",
    optionValue: "id",
    defaultValue: formProps.initialValues?.tipo_identificacion_id,
  });

  const { selectProps: ciudadSelectProps } = useSelect({
    resource: "ciudades",
    optionLabel: "nombre",
    optionValue: "id",
    filters: [{ field: "is_active", operator: "eq", value: true }],
    defaultValue: formProps.initialValues?.ciudad_id,
  });

  const { selectProps: roleSelectProps } = useSelect({
    resource: "roles",
    optionLabel: (role: { name: string }) => capitalize(role.name),
    optionValue: "name",
    defaultValue: formProps.initialValues?.roles,
  });

  return (
    <Form {...formProps} layout="vertical" style={{ maxWidth: 960 }}>
      <SectionDivider icon={<IdcardOutlined />} style={{ marginTop: 0 }}>
        Identificación
      </SectionDivider>
      <SectionRow>
        <Col xs={24} md={8}>
          <Form.Item label="Tipo de identificación" name="tipo_identificacion_id" rules={[{ required: true }]}>
            <Select {...tipoIdentificacionSelectProps} />
          </Form.Item>
        </Col>
        <Col xs={24} md={8}>
          <Form.Item label="Documento" name="documento" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
        </Col>
        <Col xs={24} md={8}>
          {/* Solo aplica si el tipo de identificación es R.U.C. (ver Store/UpdatePersonaRequest). */}
          <Form.Item label="DV" name="dv">
            <Input />
          </Form.Item>
        </Col>
      </SectionRow>

      <SectionDivider icon={<UserOutlined />}>Datos personales</SectionDivider>
      <SectionRow>
        <Col xs={24} md={12}>
          <Form.Item label="Tipo de persona" name="tipo_persona" rules={[{ required: true }]}>
            <Select options={TIPO_PERSONA_OPTIONS} />
          </Form.Item>
        </Col>
        <Col xs={24} md={12}>
          <Form.Item label="Nombre" name="nombre" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
        </Col>
      </SectionRow>

      <SectionDivider icon={<PhoneOutlined />}>Contacto</SectionDivider>
      <SectionRow>
        <Col xs={24} md={12}>
          <Form.Item label="Dirección" name="direccion">
            <Input />
          </Form.Item>
        </Col>
        <Col xs={24} md={12}>
          <Form.Item label="Ciudad" name="ciudad_id">
            <Select {...ciudadSelectProps} allowClear />
          </Form.Item>
        </Col>
        <Col xs={24} md={12}>
          <Form.Item label="Teléfono" name="telefono">
            <Input />
          </Form.Item>
        </Col>
        <Col xs={24} md={12}>
          <Form.Item label="Email de contacto" name="email_contacto">
            <Input />
          </Form.Item>
        </Col>
      </SectionRow>

      <SectionDivider icon={<SafetyCertificateOutlined />}>Acceso</SectionDivider>
      <SectionRow>
        <Col xs={24}>
          <Form.Item label="Roles" name="roles">
            <Select mode="multiple" {...roleSelectProps} placeholder="Sin rol" />
          </Form.Item>
        </Col>
      </SectionRow>
    </Form>
  );
};
