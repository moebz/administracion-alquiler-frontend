import { Edit, useForm, useSelect } from "@refinedev/antd";
import { Form, Input, InputNumber, Select } from "antd";
import { useEffect, useState } from "react";
import { UNIDAD_ESTADO_OPTIONS } from "./types";

export const UnidadEdit = () => {
  const { formProps, saveButtonProps, formLoading } = useForm({});
  const [edificioId, setEdificioId] = useState<number>();

  const bloqueInicial = formProps.initialValues?.bloque;
  useEffect(() => {
    if (bloqueInicial?.edificio_id && edificioId === undefined) {
      setEdificioId(bloqueInicial.edificio_id);
    }
  }, [bloqueInicial, edificioId]);

  const { selectProps: edificioSelectProps } = useSelect({
    resource: "edificios",
    optionLabel: "nombre",
    optionValue: "id",
    filters: [{ field: "is_active", operator: "eq", value: true }],
    defaultValue: bloqueInicial?.edificio_id,
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
    defaultValue: formProps.initialValues?.bloque_id,
  });

  const { selectProps: propietarioSelectProps } = useSelect<{ id: number; nombre: string; documento: string }>({
    resource: "personas",
    optionLabel: (persona) => `${persona.nombre} (${persona.documento})`,
    optionValue: "id",
    filters: [
      { field: "roles", operator: "in", value: ["propietario"] },
      { field: "is_active", operator: "eq", value: true },
    ],
    // Sin esto, si esta persona ya no entra en el filtro (rol sacado
    // después, persona desactivada) el select aparece EN BLANCO aunque el
    // dato esté (mismo gotcha documentado en CLAUDE.md).
    defaultValue: formProps.initialValues?.propietario_id,
  });

  return (
    <Edit saveButtonProps={saveButtonProps} isLoading={formLoading} title="Editar unidad">
      <Form {...formProps} layout="vertical">
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
        <Form.Item
          label="Propietario"
          name="propietario_id"
          rules={[{ required: true }]}
          extra="Solo se listan personas con el rol de propietario."
        >
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
    </Edit>
  );
};
