import { useEffect, useState } from "react";
import { useSelect } from "@refinedev/antd";
import { CalendarOutlined, DollarOutlined, FileTextOutlined } from "@ant-design/icons";
import { Col, DatePicker, Form, Input, Radio, Select } from "antd";
import type { FormProps } from "antd";
import dayjs from "dayjs";
import { MontoInput } from "../../components/monto-input";
import { SectionDivider } from "../../components/section-divider";
import { SectionRow } from "../../components/section-row";
import { extractErrorMessage } from "../../providers/auth";
import { kyInstance } from "../../providers/data";
import { CONTRATO_ALQUILER_ESTADO_LABEL, type ContratoAlquilerRow } from "../contratos-alquiler/types";
import { CARGO_DEUDOR_OPTIONS, CARGO_TIPO_MANUAL_OPTIONS, TASA_IVA_OPTIONS } from "./types";

const filtrarPorLabel = (input: string, option?: { label?: unknown }) =>
  String(option?.label ?? "")
    .toLowerCase()
    .includes(input.toLowerCase());

export const CargoForm = ({ formProps }: { formProps: FormProps }) => {
  const form = formProps.form;

  const { selectProps: contratoSelectProps } = useSelect<ContratoAlquilerRow>({
    resource: "contratos-alquiler",
    filters: [{ field: "estado", operator: "ne", value: "ANULADO" }],
    optionLabel: (contrato) =>
      `${contrato.inquilino.nombre} — ${contrato.unidad.bloque.edificio.nombre} - ${contrato.unidad.bloque.nombre} - ${contrato.unidad.numero} (${CONTRATO_ALQUILER_ESTADO_LABEL[contrato.estado]})`,
    optionValue: "id",
  });

  // Al propietario se le carga en una unidad (no en un contrato): el select muestra de quién es.
  const { selectProps: unidadSelectProps } = useSelect<{
    id: number;
    numero: string;
    bloque: { nombre: string; edificio: { nombre: string } };
    propietario: { nombre: string };
  }>({
    resource: "unidades",
    optionLabel: (unidad) =>
      `${unidad.bloque.edificio.nombre} · ${unidad.bloque.nombre} · ${unidad.numero} — Propietario: ${unidad.propietario.nombre}`,
    optionValue: "id",
    filters: [{ field: "is_active", operator: "eq", value: true }],
  });

  const deudor = Form.useWatch("deudor", form);
  const alPropietario = deudor === "PROPIETARIO";
  const tipo = Form.useWatch("tipo", form);
  const contratoId = Form.useWatch("contrato_id", form);
  const periodo = Form.useWatch("periodo", form);
  const esAlquiler = tipo === "ALQUILER";
  // Tasa que toma un cargo de alquiler del concepto de su contrato; se muestra sin editar.
  const [tasaAlquiler, setTasaAlquiler] = useState<number | null>(null);

  // Al propietario solo se le carga un cargo OTRO, sin contrato ni vencimiento; al cambiar de deudor se limpia lo del otro.
  useEffect(() => {
    if (alPropietario) {
      form?.setFieldsValue({ tipo: "OTRO", contrato_id: undefined, fecha_vencimiento: undefined });
    } else {
      form?.setFieldValue("unidad_id", undefined);
    }
  }, [alPropietario, form]);

  // OTRO arranca con el mes actual; ALQUILER exige elegir el período.
  useEffect(() => {
    if (tipo === "OTRO" && !form?.getFieldValue("periodo")) {
      form?.setFieldValue("periodo", dayjs().format("YYYY-MM"));
    }
  }, [tipo, form]);

  // En ALQUILER el monto y el vencimiento salen del contrato y el período (reajuste vigente, prorrateo, día de vencimiento), editables después.
  useEffect(() => {
    if (!esAlquiler || !contratoId || !periodo) {
      return;
    }

    let vigente = true;
    kyInstance.get("cargos/calcular-alquiler", { searchParams: { contrato_id: contratoId, periodo } }).then(async (response) => {
      if (!vigente) {
        return;
      }
      if (!response.ok) {
        form?.setFieldsValue({ monto: undefined, fecha_vencimiento: undefined });
        setTasaAlquiler(null);
        form?.setFields([{ name: "periodo", errors: [await extractErrorMessage(response, "No se pudo calcular el alquiler.")] }]);
        return;
      }
      const calculo = (await response.json()) as { monto: string | null; fecha_vencimiento: string; tasa_iva: number };
      setTasaAlquiler(calculo.tasa_iva);
      form?.setFieldsValue({
        monto: calculo.monto === null ? undefined : Number(calculo.monto),
        fecha_vencimiento: calculo.fecha_vencimiento,
      });
    });

    return () => {
      vigente = false;
    };
  }, [esAlquiler, contratoId, periodo, form]);

  return (
    <Form {...formProps} layout="vertical">
      <SectionDivider icon={<FileTextOutlined />} style={{ marginTop: 0 }}>
        Deudor
      </SectionDivider>
      <SectionRow>
        <Col xs={24} md={8}>
          <Form.Item label="Deudor" name="deudor" rules={[{ required: true }]}>
            <Radio.Group options={CARGO_DEUDOR_OPTIONS} optionType="button" buttonStyle="solid" />
          </Form.Item>
        </Col>
        <Col xs={24} md={16}>
          {alPropietario ? (
            <Form.Item label="Unidad" name="unidad_id" rules={[{ required: true }]}>
              <Select
                {...unidadSelectProps}
                onSearch={undefined}
                filterOption={filtrarPorLabel}
                showSearch
                placeholder="Elegí una unidad"
              />
            </Form.Item>
          ) : (
            <Form.Item label="Contrato" name="contrato_id" rules={[{ required: true }]}>
              <Select
                {...contratoSelectProps}
                onSearch={undefined}
                filterOption={filtrarPorLabel}
                showSearch
                placeholder="Elegí un contrato"
              />
            </Form.Item>
          )}
        </Col>
      </SectionRow>

      <SectionDivider icon={<CalendarOutlined />}>Cargo</SectionDivider>
      <SectionRow>
        <Col xs={24} md={8}>
          <Form.Item label="Tipo" name="tipo" rules={[{ required: true }]}>
            <Select
              options={alPropietario ? CARGO_TIPO_MANUAL_OPTIONS.filter((option) => option.value === "OTRO") : CARGO_TIPO_MANUAL_OPTIONS}
              disabled={alPropietario}
            />
          </Form.Item>
        </Col>
        <Col xs={24} md={8}>
          <Form.Item
            label="Período"
            name="periodo"
            rules={[{ required: esAlquiler }]}
            getValueProps={(value) => ({ value: value ? dayjs(`${value}-01`) : undefined })}
            normalize={(value) => (value ? dayjs(value).format("YYYY-MM") : value)}
          >
            <DatePicker picker="month" format="MM/YYYY" style={{ width: "100%" }} />
          </Form.Item>
        </Col>
        {!esAlquiler && (
          <Col xs={24} md={8}>
            <Form.Item label="Descripción" name="descripcion" rules={[{ required: true }, { max: 255 }]}>
              <Input />
            </Form.Item>
          </Col>
        )}
      </SectionRow>

      <SectionDivider icon={<DollarOutlined />}>{alPropietario ? "Importe" : "Importe y vencimiento"}</SectionDivider>
      <SectionRow>
        <Col xs={24} md={8}>
          <Form.Item label="Monto" name="monto" rules={[{ required: true }]}>
            <MontoInput />
          </Form.Item>
        </Col>
        <Col xs={24} md={8}>
          {esAlquiler ? (
            <Form.Item label="IVA" extra="Sale del concepto de alquiler del destino del contrato.">
              <Input disabled value={tasaAlquiler === null ? "—" : `${tasaAlquiler}%`} />
            </Form.Item>
          ) : (
            <Form.Item label="IVA" name="tasa_iva" rules={[{ required: true }]}>
              <Select options={TASA_IVA_OPTIONS} placeholder="Elegí la tasa" />
            </Form.Item>
          )}
        </Col>
        {/* El cargo al propietario no tiene vencimiento: no se le reclama el pago, se le descuenta en la liquidación. */}
        {!alPropietario && (
          <Col xs={24} md={8}>
            <Form.Item
              label="Vencimiento"
              name="fecha_vencimiento"
              rules={[{ required: !esAlquiler }]}
              getValueProps={(value) => ({ value: value ? dayjs(value) : undefined })}
              normalize={(value) => (value ? dayjs(value).format("YYYY-MM-DD") : value)}
            >
              <DatePicker style={{ width: "100%" }} format="DD/MM/YYYY" />
            </Form.Item>
          </Col>
        )}
      </SectionRow>
    </Form>
  );
};
