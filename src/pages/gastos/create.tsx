import { Create, useForm, useSelect } from "@refinedev/antd";
import { DatePicker, Form, Input, InputNumber, Select, Switch } from "antd";
import dayjs from "dayjs";
import { useSearchParams } from "react-router";
import { A_CARGO_DE_OPTIONS, GASTO_TIPO_OPTIONS } from "./types";

export const GastoCreate = () => {
  const { formProps, saveButtonProps } = useForm({});

  // Prellenado desde el botón "Registrar gasto" del listado/detalle de Unidades.
  const [searchParams] = useSearchParams();
  const unidadIdParam = searchParams.get("unidad_id");
  const unidadId = unidadIdParam ? Number(unidadIdParam) : undefined;

  const { selectProps: unidadSelectProps } = useSelect({
    resource: "unidades",
    optionLabel: "numero",
    optionValue: "id",
    filters: [{ field: "is_active", operator: "eq", value: true }],
    defaultValue: unidadId,
  });

  const { selectProps: proveedorSelectProps } = useSelect<{ id: number; nombre: string; documento: string }>({
    resource: "personas",
    optionLabel: (persona) => `${persona.nombre} (${persona.documento})`,
    optionValue: "id",
    filters: [{ field: "is_active", operator: "eq", value: true }],
  });

  const tipo = Form.useWatch("tipo", formProps.form);

  return (
    <Create saveButtonProps={saveButtonProps} title="Registrar gasto">
      <Form
        {...formProps}
        layout="vertical"
        initialValues={{ unidad_id: unidadId, requiere_aprobacion: false }}
      >
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
    </Create>
  );
};
