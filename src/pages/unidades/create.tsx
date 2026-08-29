import { Create, useForm, useSelect } from "@refinedev/antd";
import { Form, Input, InputNumber, Select } from "antd";
import { useState } from "react";
import { UNIDAD_ESTADO_OPTIONS } from "./types";

export const UnidadCreate = () => {
  const { formProps, saveButtonProps } = useForm({});
  const [edificioId, setEdificioId] = useState<number>();

  const { selectProps: edificioSelectProps } = useSelect({
    resource: "edificios",
    optionLabel: "nombre",
    optionValue: "id",
    filters: [{ field: "is_active", operator: "eq", value: true }],
  });

  const { selectProps: bloqueSelectProps } = useSelect({
    resource: "bloques",
    optionLabel: "nombre",
    optionValue: "id",
    filters: [
      { field: "is_active", operator: "eq", value: true },
      { field: "edificio_id", operator: "eq", value: edificioId },
    ],
    queryOptions: { enabled: !!edificioId },
  });

  const { selectProps: propietarioSelectProps } = useSelect({
    resource: "users",
    optionLabel: "name",
    optionValue: "id",
    filters: [
      { field: "role", operator: "eq", value: "propietario" },
      { field: "is_active", operator: "eq", value: true },
    ],
  });

  return (
    <Create saveButtonProps={saveButtonProps} title="Crear unidad">
      <Form {...formProps} layout="vertical" initialValues={{ estado: "DISPONIBLE" }}>
        <Form.Item label="Edificio" required>
          <Select
            options={edificioSelectProps.options}
            onSearch={edificioSelectProps.onSearch}
            filterOption={edificioSelectProps.filterOption}
            showSearch
            value={edificioId}
            onChange={(value) => setEdificioId(value)}
            placeholder="Elegí un edificio para ver sus bloques"
          />
        </Form.Item>
        <Form.Item label="Bloque" name="bloque_id" rules={[{ required: true }]}>
          <Select
            {...bloqueSelectProps}
            disabled={!edificioId}
            placeholder={edificioId ? "Elegí un bloque" : "Elegí un edificio primero"}
          />
        </Form.Item>
        <Form.Item label="Propietario" name="propietario_id" rules={[{ required: true }]}>
          <Select {...propietarioSelectProps} />
        </Form.Item>
        <Form.Item label="Número" name="numero" rules={[{ required: true }]}>
          <Input />
        </Form.Item>
        <Form.Item label="Piso" name="piso">
          <Input />
        </Form.Item>
        <Form.Item label="Superficie (m²)" name="superficie_m2">
          <InputNumber min={0} style={{ width: "100%" }} />
        </Form.Item>
        <Form.Item label="Cantidad de ambientes" name="cantidad_ambientes">
          <InputNumber min={0} style={{ width: "100%" }} />
        </Form.Item>
        <Form.Item label="Estado" name="estado" rules={[{ required: true }]}>
          <Select options={UNIDAD_ESTADO_OPTIONS} />
        </Form.Item>
      </Form>
    </Create>
  );
};
