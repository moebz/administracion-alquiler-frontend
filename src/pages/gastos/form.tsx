import { useEffect, useState } from "react";
import { useSelect } from "@refinedev/antd";
import { useOne } from "@refinedev/core";
import { Col, DatePicker, Divider, Form, Input, InputNumber, Row, Select, Switch } from "antd";
import type { FormProps } from "antd";
import dayjs from "dayjs";
import type { ContratoAlquilerRow } from "../contratos-alquiler/types";
import type { UnidadRow } from "../unidades/types";
import { A_CARGO_DE_LABEL, A_CARGO_DE_OPTIONS, type ACargoDe, GASTO_TIPO_OPTIONS } from "./types";

type GastoFormProps = {
  formProps: FormProps;
  // "Requiere aprobación" solo define el estado inicial del gasto al
  // registrarlo (GastoService::registrar()); editarlo después no tiene
  // ningún efecto, así que el campo no se muestra en Editar.
  mostrarRequiereAprobacion: boolean;
};

// Form compartido entre Crear y Editar (pages/gastos/create.tsx y edit.tsx):
// mismos campos, misma sugerencia de "a cargo de". Lo que difiere entre
// ambos (armado del useForm, prellenado por query param, estado/lectura)
// queda en cada página.
export const GastoForm = ({ formProps, mostrarRequiereAprobacion }: GastoFormProps) => {
  const { selectProps: unidadSelectProps } = useSelect({
    resource: "unidades",
    optionLabel: "numero",
    optionValue: "id",
    filters: [{ field: "is_active", operator: "eq", value: true }],
    defaultValue: formProps.initialValues?.unidad_id,
  });

  // Filtro de rubro para el select de Proveedor: no se guarda en el gasto,
  // solo estrecha las opciones (mismo patrón que Edificio→Bloque en
  // pages/unidades/create.tsx).
  const [rubroId, setRubroId] = useState<number>();

  const { selectProps: rubroSelectProps } = useSelect({
    resource: "rubros",
    optionLabel: "nombre",
    optionValue: "id",
    filters: [{ field: "is_active", operator: "eq", value: true }],
  });

  const { selectProps: proveedorSelectProps } = useSelect<{ id: number; nombre: string; documento: string }>({
    resource: "personas",
    optionLabel: (persona) => `${persona.nombre} (${persona.documento})`,
    optionValue: "id",
    filters: [
      { field: "is_active", operator: "eq", value: true },
      { field: "es_proveedor", operator: "eq", value: true },
      ...(rubroId ? [{ field: "rubro_id" as const, operator: "eq" as const, value: rubroId }] : []),
    ],
    // Override necesario: el optionLabel de arriba es una función, así que
    // Refine no puede derivar solo de ahí por qué campo buscar. Manda
    // `search=texto` (mismo filtro que ya usa PersonaController::index).
    onSearch: (value) => (value ? [{ field: "search", operator: "eq", value }] : []),
    defaultValue: formProps.initialValues?.proveedor_id,
  });

  const rubroSeleccionado = rubroSelectProps.options?.find((option) => option.value === rubroId);

  const tipo = Form.useWatch("tipo", formProps.form);
  const unidadSeleccionadaId = Form.useWatch("unidad_id", formProps.form);
  const aCargoDe = Form.useWatch("a_cargo_de", formProps.form);
  const esExpensa = tipo === "EXPENSA";
  // La aprobación es siempre del propietario (ver
  // App\Http\Controllers\Propietario\GastoController en el backend): un
  // gasto a cargo del inquilino no puede requerirla.
  const esACargoDePropietario = aCargoDe === "PROPIETARIO";

  // Sugerencia de "a cargo de" para expensas: MODELO_DATOS.md ("Gastos") la
  // ata a contratos_alquiler.expensas_a_cargo_de del contrato vigente de la
  // unidad, o PROPIETARIO si no hay contrato — misma regla que
  // GastoService::registrarExpensa() en el backend, acá solo como sugerencia
  // editable (no se fuerza el valor).
  const { result: unidadSeleccionada, query: unidadQuery } = useOne<UnidadRow>({
    resource: "unidades",
    id: unidadSeleccionadaId ?? "",
    queryOptions: { enabled: esExpensa && !!unidadSeleccionadaId },
  });
  const contratoVigenteId = unidadSeleccionada?.contrato_vigente_id ?? null;

  const { result: contratoVigente, query: contratoQuery } = useOne<ContratoAlquilerRow>({
    resource: "contratos-alquiler",
    id: contratoVigenteId ?? "",
    queryOptions: { enabled: esExpensa && !!contratoVigenteId },
  });

  // Mientras la unidad todavía no cargó, `contratoVigenteId` es null igual
  // que "sin contrato" — sin este chequeo se sugeriría PROPIETARIO de
  // entrada y después "saltaría" a INQUILINO cuando llegue el dato real.
  const cargandoSugerencia = unidadQuery.isFetching || contratoQuery.isFetching;
  const aCargoDeSugerido: ACargoDe | undefined = !esExpensa || !unidadSeleccionadaId || cargandoSugerencia
    ? undefined
    : contratoVigenteId
      ? contratoVigente?.expensas_a_cargo_de
      : "PROPIETARIO";

  useEffect(() => {
    if (!aCargoDeSugerido) return;
    // Solo mientras el campo no fue tocado a mano: es una sugerencia inicial,
    // no se le pisa una elección explícita del usuario.
    if (formProps.form?.isFieldsTouched(["a_cargo_de"])) return;
    formProps.form?.setFieldValue("a_cargo_de", aCargoDeSugerido);
  }, [aCargoDeSugerido, formProps.form]);

  useEffect(() => {
    if (esACargoDePropietario) return;
    // El switch queda oculto para este caso (ver abajo); si ya estaba
    // tildado de cuando "a cargo de" era Propietario, hay que destildarlo
    // para no mandar requiere_aprobacion=true al backend sin que se vea.
    formProps.form?.setFieldValue("requiere_aprobacion", false);
  }, [esACargoDePropietario, formProps.form]);

  return (
    <Form {...formProps} layout="vertical" style={{ maxWidth: 960 }}>
      <Divider orientation="left" orientationMargin={0} style={{ marginTop: 0 }}>
        Unidad y tipo
      </Divider>
      <Row gutter={16}>
        <Col xs={24} md={12}>
          <Form.Item label="Unidad" name="unidad_id" rules={[{ required: true }]}>
            <Select {...unidadSelectProps} placeholder="Elegí una unidad" />
          </Form.Item>
        </Col>
        <Col xs={24} md={12}>
          <Form.Item label="Tipo" name="tipo" rules={[{ required: true }]}>
            <Select options={GASTO_TIPO_OPTIONS} />
          </Form.Item>
        </Col>
      </Row>

      <Divider orientation="left" orientationMargin={0}>
        Detalle
      </Divider>
      <Row gutter={16}>
        <Col xs={24}>
          <Form.Item label="Descripción" name="descripcion" rules={[{ required: true }]}>
            <Input placeholder="Ej.: Reparación de cañería en baño" maxLength={255} showCount />
          </Form.Item>
        </Col>
        <Col xs={24} md={esExpensa ? 8 : 12}>
          <Form.Item
            label="Fecha"
            name="fecha"
            rules={[{ required: true }]}
            getValueProps={(value) => ({ value: value ? dayjs(value) : undefined })}
            normalize={(value) => (value ? dayjs(value).format("YYYY-MM-DD") : value)}
          >
            <DatePicker style={{ width: "100%" }} format="DD/MM/YYYY" />
          </Form.Item>
        </Col>
        {esExpensa && (
          <Col xs={24} md={8}>
            <Form.Item
              label="Período"
              name="periodo"
              rules={[{ required: true, message: "Elegí el período de la expensa" }]}
              getValueProps={(value) => ({ value: value ? dayjs(value, "YYYY-MM") : undefined })}
              normalize={(value) => (value ? dayjs(value).format("YYYY-MM") : value)}
            >
              <DatePicker style={{ width: "100%" }} picker="month" format="MM/YYYY" placeholder="Elegí un mes" />
            </Form.Item>
          </Col>
        )}
        <Col xs={24} md={esExpensa ? 8 : 12}>
          <Form.Item label="Monto" name="monto" rules={[{ required: true }]}>
            <InputNumber<number>
              min={0}
              style={{ width: "100%" }}
              addonAfter="Gs."
              formatter={(value) => (value === undefined ? "" : `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, "."))}
              parser={(value) => (value ? Number(value.replace(/\./g, "")) : 0)}
            />
          </Form.Item>
        </Col>
      </Row>

      <Divider orientation="left" orientationMargin={0}>
        Proveedor
      </Divider>
      <Row gutter={16}>
        <Col xs={24} md={8}>
          <Form.Item label="Rubro" extra="Solo para buscar proveedores. No se guarda en el gasto.">
            <Select
              options={rubroSelectProps.options}
              onSearch={rubroSelectProps.onSearch}
              filterOption={rubroSelectProps.filterOption}
              showSearch
              allowClear
              value={rubroId}
              onChange={(value) => setRubroId(value)}
              placeholder="Todos los rubros"
            />
          </Form.Item>
        </Col>
        <Col xs={24} md={16}>
          <Form.Item label="Proveedor" name="proveedor_id" rules={[{ required: true, message: "Elegí un proveedor" }]}>
            <Select
              {...proveedorSelectProps}
              placeholder={
                rubroSeleccionado ? `Buscá un proveedor de ${rubroSeleccionado.label}` : "Buscá un proveedor por nombre"
              }
            />
          </Form.Item>
        </Col>
      </Row>

      <Divider orientation="left" orientationMargin={0}>
        Responsabilidad{mostrarRequiereAprobacion && esACargoDePropietario ? " y aprobación" : ""}
      </Divider>
      <Row gutter={16}>
        <Col xs={24} md={12}>
          <Form.Item
            label="A cargo de"
            name="a_cargo_de"
            rules={[{ required: true }]}
            extra={
              aCargoDeSugerido
                ? `Sugerido por el contrato vigente de la unidad: ${A_CARGO_DE_LABEL[aCargoDeSugerido]}. Podés cambiarlo.`
                : undefined
            }
          >
            <Select options={A_CARGO_DE_OPTIONS} />
          </Form.Item>
        </Col>
        {mostrarRequiereAprobacion && esACargoDePropietario && (
          <Col xs={24} md={12}>
            <Form.Item
              label="Requiere aprobación"
              name="requiere_aprobacion"
              valuePropName="checked"
              extra="Activado, el gasto queda Solicitado y necesita aprobación del propietario antes de poder pagarse. Si no, se registra directamente como Aprobado."
            >
              <Switch />
            </Form.Item>
          </Col>
        )}
      </Row>
    </Form>
  );
};
