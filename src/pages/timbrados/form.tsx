import { useSelect } from "@refinedev/antd";
import { CalendarOutlined, DeleteOutlined, FileProtectOutlined, PlusOutlined, UnorderedListOutlined } from "@ant-design/icons";
import { Alert, Button, Col, DatePicker, Form, Input, InputNumber, Select, Tooltip, Typography } from "antd";
import type { FormProps } from "antd";
import dayjs from "dayjs";
import { SectionDivider } from "../../components/section-divider";
import { SectionRow } from "../../components/section-row";
import { NUMERO_MAXIMO, TIMBRADO_TIPO_OPTIONS, TIPO_COMPROBANTE_OPTIONS, type TimbradoRangoRow } from "./types";

type TimbradoFormProps = {
  formProps: FormProps;
  esEdicion: boolean;
};

const FORM_MAX_WIDTH = 960;
const ROW_GUTTER = 12;
const FECHA_PROPS = {
  getValueProps: (value: string | undefined) => ({ value: value ? dayjs(value) : undefined }),
  normalize: (value: unknown) => (value ? dayjs(value as string).format("YYYY-MM-DD") : value),
};

export const TimbradoForm = ({ formProps, esEdicion }: TimbradoFormProps) => {
  const { selectProps: puntoSelectProps } = useSelect<{ id: number; codigo_completo: string }>({
    resource: "puntos-expedicion",
    optionLabel: "codigo_completo",
    optionValue: "id",
    filters: [{ field: "is_active", operator: "eq", value: true }],
    defaultValue: formProps.initialValues?.rangos?.map((rango: TimbradoRangoRow) => rango.punto_expedicion_id),
  });

  const tipo = Form.useWatch("tipo", formProps.form);
  const rangos: Partial<TimbradoRangoRow>[] = Form.useWatch("rangos", formProps.form) ?? [];
  const esPreimpreso = tipo === "PREIMPRESO";
  const esElectronico = tipo === "ELECTRONICO";

  return (
    <Form {...formProps} layout="vertical" style={{ maxWidth: FORM_MAX_WIDTH }}>
      <SectionDivider icon={<FileProtectOutlined />} style={{ marginTop: 0 }}>
        Datos del timbrado
      </SectionDivider>
      <SectionRow>
        <Col xs={24} md={12}>
          <Form.Item
            label="Número de timbrado"
            name="numero_timbrado"
            rules={[{ required: true }, { pattern: /^\d{8}$/, message: "Tienen que ser 8 dígitos" }]}
            extra={esEdicion ? undefined : "No se puede cambiar una vez creado."}
          >
            <Input disabled={esEdicion} maxLength={8} />
          </Form.Item>
        </Col>
        <Col xs={24} md={12}>
          <Form.Item
            label="Tipo"
            name="tipo"
            rules={[{ required: true }]}
            extra={esEdicion ? undefined : "No se puede cambiar una vez creado."}
          >
            <Select options={TIMBRADO_TIPO_OPTIONS} disabled={esEdicion} />
          </Form.Item>
        </Col>
      </SectionRow>

      <SectionDivider icon={<CalendarOutlined />}>Vigencia</SectionDivider>
      <SectionRow>
        <Col xs={24} md={12}>
          <Form.Item label="Vigencia desde" name="vigencia_desde" rules={[{ required: true }]} {...FECHA_PROPS}>
            <DatePicker style={{ width: "100%" }} format="DD/MM/YYYY" />
          </Form.Item>
        </Col>
        {esPreimpreso && (
          <Col xs={24} md={12}>
            <Form.Item label="Vigencia hasta" name="vigencia_hasta" rules={[{ required: true }]} preserve={false} {...FECHA_PROPS}>
              <DatePicker style={{ width: "100%" }} format="DD/MM/YYYY" />
            </Form.Item>
          </Col>
        )}
        {esElectronico && (
          <Col xs={24} md={12}>
            <Form.Item label="Vigencia hasta">
              <Typography.Text type="secondary">Sin fecha de fin</Typography.Text>
            </Form.Item>
          </Col>
        )}
      </SectionRow>

      <SectionDivider icon={<UnorderedListOutlined />}>Rangos</SectionDivider>
      <Form.List
        name="rangos"
        rules={[
          {
            validator: async (_, value) => {
              if (!value?.length) throw new Error("Cargá al menos un rango.");
            },
          },
        ]}
      >
        {(fields, { add, remove }, { errors }) => (
          <>
            {fields.map(({ key, name }) => {
              const usado = !!rangos[name]?.usado;
              const primera = name === 0;
              return (
                <SectionRow key={key} gutter={ROW_GUTTER} align="top">
                  <Form.Item name={[name, "id"]} hidden>
                    <Input />
                  </Form.Item>
                  <Form.Item name={[name, "usado"]} hidden>
                    <Input />
                  </Form.Item>
                  <Col xs={24} md={6}>
                    <Form.Item
                      label={primera ? "Punto de expedición" : undefined}
                      name={[name, "punto_expedicion_id"]}
                      rules={[{ required: true }]}
                    >
                      <Select {...puntoSelectProps} disabled={usado} />
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={5}>
                    <Form.Item
                      label={primera ? "Tipo de comprobante" : undefined}
                      name={[name, "tipo_comprobante"]}
                      rules={[{ required: true }]}
                    >
                      <Select options={TIPO_COMPROBANTE_OPTIONS} disabled={usado} />
                    </Form.Item>
                  </Col>
                  {esElectronico && (
                    <>
                      <Col xs={12} md={3}>
                        <Form.Item
                          label={primera ? "Serie" : undefined}
                          name={[name, "serie"]}
                          preserve={false}
                          rules={[{ pattern: /^[A-Za-z]{2}$/, message: "2 letras" }]}
                          normalize={(value) => (typeof value === "string" ? value.toUpperCase() : value)}
                        >
                          <Input maxLength={2} placeholder="Sin serie" disabled={usado} />
                        </Form.Item>
                      </Col>
                      <Col xs={12} md={8}>
                        <Form.Item label={primera ? "Numeración" : undefined}>
                          <Typography.Text type="secondary">
                            1 – {NUMERO_MAXIMO.toLocaleString("es-PY")}
                          </Typography.Text>
                        </Form.Item>
                      </Col>
                    </>
                  )}
                  {esPreimpreso && (
                    <>
                      <Col xs={12} md={4}>
                        <Form.Item
                          label={primera ? "Desde" : undefined}
                          name={[name, "numero_desde"]}
                          preserve={false}
                          rules={[{ required: true }]}
                        >
                          <InputNumber style={{ width: "100%" }} min={1} max={NUMERO_MAXIMO} precision={0} disabled={usado} />
                        </Form.Item>
                      </Col>
                      <Col xs={12} md={4}>
                        <Form.Item
                          label={primera ? "Hasta" : undefined}
                          name={[name, "numero_hasta"]}
                          preserve={false}
                          dependencies={[["rangos", name, "numero_desde"]]}
                          rules={[
                            { required: true },
                            ({ getFieldValue }) => ({
                              validator: async (_, value) => {
                                const desde = getFieldValue(["rangos", name, "numero_desde"]);
                                if (value && desde && value < desde) throw new Error("No puede ser menor que Desde.");
                              },
                            }),
                          ]}
                        >
                          <InputNumber style={{ width: "100%" }} min={1} max={NUMERO_MAXIMO} precision={0} disabled={usado} />
                        </Form.Item>
                      </Col>
                    </>
                  )}
                  <Col xs={2} md={1}>
                    <Form.Item label={primera ? " " : undefined}>
                      <Tooltip title={usado ? "Tiene números emitidos: no se puede quitar" : "Quitar rango"}>
                        <Button size="small" icon={<DeleteOutlined />} disabled={usado} onClick={() => remove(name)} />
                      </Tooltip>
                    </Form.Item>
                  </Col>
                </SectionRow>
              );
            })}
            <Button
              type="dashed"
              icon={<PlusOutlined />}
              onClick={() => add({ tipo_comprobante: "FACTURA" })}
              style={{ marginLeft: 24 }}
            >
              Agregar rango
            </Button>
            {errors.length > 0 && <Alert type="error" showIcon message={errors} style={{ marginTop: 16 }} />}
          </>
        )}
      </Form.List>
    </Form>
  );
};
