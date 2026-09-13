import { useEffect, useState } from "react";
import { useSelect } from "@refinedev/antd";
import { ApartmentOutlined, HomeOutlined, UserOutlined } from "@ant-design/icons";
import { Col, Form, Input, InputNumber, Select } from "antd";
import type { FormProps } from "antd";
import { SectionDivider } from "../../components/section-divider";
import { SectionRow } from "../../components/section-row";
import { UNIDAD_ESTADO_OPTIONS } from "./types";

type UnidadFormProps = {
  formProps: FormProps;
};

// Form compartido entre Crear y Editar (pages/unidades/create.tsx y edit.tsx):
// mismos campos y mismo cascadeo Edificio→Bloque (ver GastoForm en
// pages/gastos/form.tsx, mismo patrón).
export const UnidadForm = ({ formProps }: UnidadFormProps) => {
  const [edificioId, setEdificioId] = useState<number>();

  // En Editar, la unidad ya tiene un bloque (y por lo tanto un edificio):
  // precarga el select de Edificio con eso. En Crear, `bloqueInicial` es
  // undefined y este efecto no hace nada.
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
    <Form {...formProps} layout="vertical" style={{ maxWidth: 960 }}>
      <SectionDivider icon={<ApartmentOutlined />} style={{ marginTop: 0 }}>
        Ubicación
      </SectionDivider>
      <SectionRow>
        <Col xs={24} md={12}>
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
        </Col>
        <Col xs={24} md={12}>
          <Form.Item label="Bloque" name="bloque_id" rules={[{ required: true }]}>
            <Select
              {...bloqueSelectProps}
              disabled={!edificioId}
              placeholder={edificioId ? "Elegí un bloque" : "Elegí un edificio primero"}
            />
          </Form.Item>
        </Col>
      </SectionRow>

      <SectionDivider icon={<UserOutlined />}>Propietario</SectionDivider>
      <SectionRow>
        <Col xs={24}>
          <Form.Item
            label="Propietario"
            name="propietario_id"
            rules={[{ required: true }]}
            extra="Solo se listan personas con el rol de propietario."
          >
            <Select {...propietarioSelectProps} />
          </Form.Item>
        </Col>
      </SectionRow>

      <SectionDivider icon={<HomeOutlined />}>Datos de la unidad</SectionDivider>
      <SectionRow>
        <Col xs={24} md={8}>
          <Form.Item label="Número" name="numero" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
        </Col>
        <Col xs={24} md={8}>
          <Form.Item label="Piso" name="piso">
            <Input />
          </Form.Item>
        </Col>
        <Col xs={24} md={8}>
          <Form.Item label="Estado" name="estado" rules={[{ required: true }]}>
            <Select options={UNIDAD_ESTADO_OPTIONS} />
          </Form.Item>
        </Col>
        <Col xs={24} md={12}>
          <Form.Item label="Superficie (m²)" name="superficie_m2">
            <InputNumber min={0} style={{ width: "100%" }} />
          </Form.Item>
        </Col>
        <Col xs={24} md={12}>
          <Form.Item label="Cantidad de ambientes" name="cantidad_ambientes">
            <InputNumber min={0} style={{ width: "100%" }} />
          </Form.Item>
        </Col>
      </SectionRow>
    </Form>
  );
};
