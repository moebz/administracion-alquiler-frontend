import { Edit, useForm, useSelect } from "@refinedev/antd";
import { DatePicker, Descriptions, Form, InputNumber, Select } from "antd";
import dayjs from "dayjs";
import { CONTRATO_ALQUILER_ESTADO_OPTIONS, EXPENSAS_A_CARGO_OPTIONS } from "./types";

// Sin `monto_alquiler`/`deposito` editables a propósito: el alquiler se
// cambia creando un reajuste (App\Models\ContratoReajuste), no editando el
// contrato, y el depósito no se edita desde acá — ver ARQUITECTURA.md.
export const ContratoAlquilerEdit = () => {
  const { formProps, saveButtonProps, formLoading } = useForm({});

  const { selectProps: unidadSelectProps } = useSelect({
    resource: "unidades",
    optionLabel: "numero",
    optionValue: "id",
    filters: [{ field: "is_active", operator: "eq", value: true }],
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
    <Edit saveButtonProps={saveButtonProps} isLoading={formLoading} title="Editar contrato de alquiler">
      <Descriptions column={1} size="small" style={{ marginBottom: 24 }} bordered>
        <Descriptions.Item label="Alquiler vigente">
          {formProps.initialValues?.monto_alquiler_vigente ?? "—"}
        </Descriptions.Item>
        <Descriptions.Item label="Depósito de garantía">
          {formProps.initialValues?.deposito_garantia?.monto ?? "Sin depósito registrado"}
        </Descriptions.Item>
      </Descriptions>
      <Form {...formProps} layout="vertical">
        <Form.Item label="Unidad" name="unidad_id" rules={[{ required: true }]}>
          <Select {...unidadSelectProps} placeholder="Elegí una unidad" />
        </Form.Item>
        <Form.Item
          label="Inquilino"
          name="inquilino_id"
          rules={[{ required: true }]}
          extra="Solo se listan personas con el rol de inquilino."
        >
          <Select {...inquilinoSelectProps} placeholder="Elegí un inquilino" />
        </Form.Item>
        <Form.Item
          label="Fecha de inicio"
          name="fecha_inicio"
          rules={[{ required: true }]}
          getValueProps={(value) => ({ value: value ? dayjs(value) : undefined })}
          normalize={(value) => (value ? dayjs(value).format("YYYY-MM-DD") : value)}
        >
          <DatePicker style={{ width: "100%" }} format="DD/MM/YYYY" />
        </Form.Item>
        <Form.Item
          label="Fecha de fin"
          name="fecha_fin"
          rules={[{ required: true }]}
          getValueProps={(value) => ({ value: value ? dayjs(value) : undefined })}
          normalize={(value) => (value ? dayjs(value).format("YYYY-MM-DD") : value)}
        >
          <DatePicker style={{ width: "100%" }} format="DD/MM/YYYY" />
        </Form.Item>
        <Form.Item label="Día de vencimiento" name="dia_vencimiento" rules={[{ required: true }]}>
          <InputNumber min={1} max={31} style={{ width: "100%" }} />
        </Form.Item>
        <Form.Item label="Días de gracia" name="dias_gracia" rules={[{ required: true }]}>
          <InputNumber min={0} style={{ width: "100%" }} />
        </Form.Item>
        <Form.Item label="Porcentaje de mora diario" name="mora_pct_diario" rules={[{ required: true }]}>
          <InputNumber min={0} max={100} style={{ width: "100%" }} addonAfter="%" />
        </Form.Item>
        <Form.Item label="Tope de mora (% del alquiler)" name="mora_tope_pct">
          <InputNumber min={0} max={100} style={{ width: "100%" }} addonAfter="%" />
        </Form.Item>
        <Form.Item label="Porcentaje de comisión" name="comision_pct" rules={[{ required: true }]}>
          <InputNumber min={0} max={100} style={{ width: "100%" }} addonAfter="%" />
        </Form.Item>
        <Form.Item label="Expensas a cargo de" name="expensas_a_cargo_de" rules={[{ required: true }]}>
          <Select options={EXPENSAS_A_CARGO_OPTIONS} />
        </Form.Item>
        <Form.Item label="Estado" name="estado" rules={[{ required: true }]}>
          <Select options={CONTRATO_ALQUILER_ESTADO_OPTIONS} />
        </Form.Item>
      </Form>
    </Edit>
  );
};
