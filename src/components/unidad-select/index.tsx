import { useSelect } from "@refinedev/antd";
import { Form, Select } from "antd";

type UnidadSelectProps = {
  // Id de la unidad prellenada (initialValues del form), para que el select
  // la muestre aunque no entre en la primera página de resultados.
  defaultValue?: number;
  // La unidad ya viene decidida (ej. por ?unidad_id= en la URL): el select
  // queda deshabilitado y solo trae la unidad prellenada, no el listado.
  bloqueada?: boolean;
};

// Select de Unidad compartido por los forms (gastos, contratos-alquiler):
// muestra "Edificio · Bloque · Número" y busca en el servidor.
export const UnidadSelect = ({ defaultValue, bloqueada = false }: UnidadSelectProps) => {
  const { selectProps, defaultValueQuery } = useSelect<{
    id: number;
    numero: string;
    bloque: { nombre: string; edificio: { nombre: string } };
  }>({
    resource: "unidades",
    optionLabel: (unidad) => `${unidad.bloque.edificio.nombre} · ${unidad.bloque.nombre} · ${unidad.numero}`,
    optionValue: "id",
    filters: [{ field: "is_active", operator: "eq", value: true }],
    defaultValue,
    // Override necesario: el optionLabel es una función, así que Refine no
    // sabe por qué campo buscar. Manda `search=texto`.
    onSearch: (value) => (value ? [{ field: "search", operator: "eq", value }] : []),
    queryOptions: { enabled: !bloqueada },
    defaultValueQueryOptions: { enabled: true },
    meta: { query: { limit: 20 } },
  });

  const noExiste = bloqueada && defaultValueQuery.isSuccess && !selectProps.options?.length;

  return (
    <Form.Item
      label="Unidad"
      name="unidad_id"
      rules={[{ required: true }]}
      validateStatus={noExiste ? "error" : undefined}
      help={noExiste ? "La unidad indicada no existe." : undefined}
    >
      <Select {...selectProps} disabled={bloqueada} placeholder="Elegí una unidad" />
    </Form.Item>
  );
};
