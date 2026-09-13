import { useSelect } from "@refinedev/antd";
import { CalendarOutlined, ClockCircleOutlined, DollarOutlined, HomeOutlined } from "@ant-design/icons";
import { Col, DatePicker, Form, InputNumber, Select } from "antd";
import type { FormProps } from "antd";
import dayjs from "dayjs";
import { MontoInput } from "../../components/monto-input";
import { SectionDivider } from "../../components/section-divider";
import { SectionRow } from "../../components/section-row";
import { CONTRATO_ALQUILER_ESTADO_OPTIONS, EXPENSAS_A_CARGO_OPTIONS } from "./types";

type ContratoAlquilerFormProps = {
  formProps: FormProps;
  // El alquiler se cambia creando un reajuste (App\Models\ContratoReajuste),
  // no editando el contrato — el monto vigente ya se ve en el detalle de la
  // unidad (pages/unidades/show.tsx) antes de entrar acá, así que en Editar
  // no se muestra este campo (mismo patrón que mostrarRequiereAprobacion en
  // GastoForm, pages/gastos/form.tsx).
  mostrarMontoAlquiler: boolean;
};

// Form compartido entre Crear y Editar (pages/contratos-alquiler/create.tsx
// y edit.tsx). Sin campo de depósito de garantía: se saca del front hasta
// que se pida explícitamente retomar ese desarrollo — ver ARQUITECTURA.md.
// El modelo/endpoint lo siguen soportando (`deposito`, nullable).
export const ContratoAlquilerForm = ({ formProps, mostrarMontoAlquiler }: ContratoAlquilerFormProps) => {
  const { selectProps: unidadSelectProps } = useSelect({
    resource: "unidades",
    optionLabel: "numero",
    optionValue: "id",
    filters: [{ field: "is_active", operator: "eq", value: true }],
    // Sin esto, si la unidad prellenada no entra en la primera página del
    // select, aparece en blanco aunque el id ya esté seteado en el form.
    defaultValue: formProps.initialValues?.unidad_id,
  });

  const { selectProps: inquilinoSelectProps } = useSelect<{ id: number; nombre: string; documento: string }>({
    resource: "personas",
    optionLabel: (persona) => `${persona.nombre} (${persona.documento})`,
    optionValue: "id",
    filters: [
      { field: "roles", operator: "in", value: ["inquilino"] },
      { field: "is_active", operator: "eq", value: true },
    ],
    // Sin esto, si esta persona ya no entra en el filtro (rol sacado
    // después, persona desactivada) el select aparece EN BLANCO aunque el
    // dato esté (mismo gotcha documentado en CLAUDE.md).
    defaultValue: formProps.initialValues?.inquilino_id,
  });

  return (
    <Form {...formProps} layout="vertical" style={{ maxWidth: 960 }}>
      <SectionDivider icon={<HomeOutlined />} style={{ marginTop: 0 }}>
        Unidad e inquilino
      </SectionDivider>
      <SectionRow>
        <Col xs={24} md={12}>
          <Form.Item label="Unidad" name="unidad_id" rules={[{ required: true }]}>
            <Select {...unidadSelectProps} placeholder="Elegí una unidad" />
          </Form.Item>
        </Col>
        <Col xs={24} md={12}>
          <Form.Item
            label="Inquilino"
            name="inquilino_id"
            rules={[{ required: true }]}
            extra="Solo se listan personas con el rol de inquilino."
          >
            <Select {...inquilinoSelectProps} placeholder="Elegí un inquilino" />
          </Form.Item>
        </Col>
      </SectionRow>

      <SectionDivider icon={<CalendarOutlined />}>Vigencia</SectionDivider>
      <SectionRow>
        <Col xs={24} md={8}>
          <Form.Item
            label="Fecha de inicio"
            name="fecha_inicio"
            rules={[{ required: true }]}
            getValueProps={(value) => ({ value: value ? dayjs(value) : undefined })}
            normalize={(value) => (value ? dayjs(value).format("YYYY-MM-DD") : value)}
          >
            <DatePicker style={{ width: "100%" }} format="DD/MM/YYYY" />
          </Form.Item>
        </Col>
        <Col xs={24} md={8}>
          <Form.Item
            label="Fecha de fin"
            name="fecha_fin"
            rules={[{ required: true }]}
            getValueProps={(value) => ({ value: value ? dayjs(value) : undefined })}
            normalize={(value) => (value ? dayjs(value).format("YYYY-MM-DD") : value)}
          >
            <DatePicker style={{ width: "100%" }} format="DD/MM/YYYY" />
          </Form.Item>
        </Col>
        <Col xs={24} md={8}>
          <Form.Item label="Estado" name="estado" rules={[{ required: true }]}>
            <Select options={CONTRATO_ALQUILER_ESTADO_OPTIONS} />
          </Form.Item>
        </Col>
      </SectionRow>

      <SectionDivider icon={<DollarOutlined />}>Alquiler y expensas</SectionDivider>
      <SectionRow>
        {mostrarMontoAlquiler && (
          <Col xs={24} md={8}>
            <Form.Item label="Monto de alquiler mensual" name="monto_alquiler" rules={[{ required: true }]}>
              <MontoInput />
            </Form.Item>
          </Col>
        )}
        <Col xs={24} md={mostrarMontoAlquiler ? 8 : 12}>
          <Form.Item label="Porcentaje de comisión" name="comision_pct" rules={[{ required: true }]}>
            <InputNumber min={0} max={100} style={{ width: "100%" }} addonAfter="%" />
          </Form.Item>
        </Col>
        <Col xs={24} md={mostrarMontoAlquiler ? 8 : 12}>
          <Form.Item label="Expensas a cargo de" name="expensas_a_cargo_de" rules={[{ required: true }]}>
            <Select options={EXPENSAS_A_CARGO_OPTIONS} />
          </Form.Item>
        </Col>
      </SectionRow>

      <SectionDivider icon={<ClockCircleOutlined />}>Vencimiento y mora</SectionDivider>
      <SectionRow>
        <Col xs={24} md={12}>
          <Form.Item label="Día de vencimiento" name="dia_vencimiento" rules={[{ required: true }]}>
            <InputNumber min={1} max={31} style={{ width: "100%" }} />
          </Form.Item>
        </Col>
        <Col xs={24} md={12}>
          <Form.Item label="Días de gracia" name="dias_gracia" rules={[{ required: true }]}>
            <InputNumber min={0} style={{ width: "100%" }} />
          </Form.Item>
        </Col>
        <Col xs={24} md={12}>
          <Form.Item label="Porcentaje de mora diario" name="mora_pct_diario" rules={[{ required: true }]}>
            <InputNumber min={0} max={100} style={{ width: "100%" }} addonAfter="%" />
          </Form.Item>
        </Col>
        <Col xs={24} md={12}>
          <Form.Item label="Tope de mora (% del alquiler)" name="mora_tope_pct">
            <InputNumber min={0} max={100} style={{ width: "100%" }} addonAfter="%" />
          </Form.Item>
        </Col>
      </SectionRow>
    </Form>
  );
};
