import { Edit, useForm, useSelect } from "@refinedev/antd";
import { DatePicker, Descriptions, Form, Input, InputNumber, Select, Switch, Tag } from "antd";
import dayjs from "dayjs";
import { A_CARGO_DE_OPTIONS, GASTO_ESTADO_COLOR, GASTO_ESTADO_LABEL, GASTO_TIPO_OPTIONS, type GastoEstado } from "./types";

// El estado (SOLICITADO/APROBADO/RECHAZADO/...) no se edita acá: cambia vía
// las acciones dedicadas Aprobar/Rechazar del listado (pages/gastos/list.tsx).
export const GastoEdit = () => {
  const { formProps, saveButtonProps, formLoading } = useForm({});

  const estado = formProps.initialValues?.estado as GastoEstado | undefined;

  const { selectProps: unidadSelectProps } = useSelect({
    resource: "unidades",
    optionLabel: "numero",
    optionValue: "id",
    filters: [{ field: "is_active", operator: "eq", value: true }],
    defaultValue: formProps.initialValues?.unidad_id,
  });

  const { selectProps: proveedorSelectProps } = useSelect<{ id: number; nombre: string; documento: string }>({
    resource: "personas",
    optionLabel: (persona) => `${persona.nombre} (${persona.documento})`,
    optionValue: "id",
    filters: [{ field: "is_active", operator: "eq", value: true }],
    defaultValue: formProps.initialValues?.proveedor_id,
  });

  const tipo = Form.useWatch("tipo", formProps.form);

  return (
    <Edit saveButtonProps={saveButtonProps} isLoading={formLoading} title="Editar gasto">
      {estado && (
        <Descriptions column={1} size="small" style={{ marginBottom: 24 }} bordered>
          <Descriptions.Item label="Estado">
            <Tag color={GASTO_ESTADO_COLOR[estado]}>{GASTO_ESTADO_LABEL[estado]}</Tag>
          </Descriptions.Item>
          {formProps.initialValues?.motivo_rechazo && (
            <Descriptions.Item label="Motivo de rechazo">{formProps.initialValues.motivo_rechazo}</Descriptions.Item>
          )}
        </Descriptions>
      )}
      <Form {...formProps} layout="vertical">
        <Form.Item label="Unidad" name="unidad_id" rules={[{ required: true }]}>
          <Select {...unidadSelectProps} placeholder="Elegí una unidad" />
        </Form.Item>
        <Form.Item label="Tipo" name="tipo" rules={[{ required: true }]}>
          <Select options={GASTO_TIPO_OPTIONS} />
        </Form.Item>
        {tipo === "EXPENSA" && (
          <Form.Item
            label="Período"
            name="periodo"
            rules={[{ required: true, pattern: /^\d{4}-\d{2}$/, message: "Formato AAAA-MM" }]}
          >
            <Input placeholder="2026-01" />
          </Form.Item>
        )}
        <Form.Item label="Descripción" name="descripcion" rules={[{ required: true }]}>
          <Input />
        </Form.Item>
        <Form.Item
          label="Fecha"
          name="fecha"
          rules={[{ required: true }]}
          getValueProps={(value) => ({ value: value ? dayjs(value) : undefined })}
          normalize={(value) => (value ? dayjs(value).format("YYYY-MM-DD") : value)}
        >
          <DatePicker style={{ width: "100%" }} format="DD/MM/YYYY" />
        </Form.Item>
        <Form.Item label="Monto" name="monto" rules={[{ required: true }]}>
          <InputNumber min={0} style={{ width: "100%" }} />
        </Form.Item>
        <Form.Item label="Proveedor" name="proveedor_id" rules={[{ required: true }]}>
          <Select {...proveedorSelectProps} placeholder="Elegí un proveedor" />
        </Form.Item>
        <Form.Item label="A cargo de" name="a_cargo_de" rules={[{ required: true }]}>
          <Select options={A_CARGO_DE_OPTIONS} />
        </Form.Item>
        <Form.Item label="Requiere aprobación" name="requiere_aprobacion" valuePropName="checked">
          <Switch />
        </Form.Item>
      </Form>
    </Edit>
  );
};
