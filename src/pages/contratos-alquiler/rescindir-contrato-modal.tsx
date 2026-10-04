import { useEffect, useState } from "react";
import { Alert, App, DatePicker, Descriptions, Form, Input, Modal, Skeleton } from "antd";
import dayjs, { type Dayjs } from "dayjs";
import { MontoInput } from "../../components/monto-input";
import { extractErrorMessage } from "../../providers/auth";
import { kyInstance } from "../../providers/data";
import { formatMonto } from "../../utils/monto";
import type { ContratoAlquilerRow } from "./types";

type Valores = { fecha_rescision: Dayjs; motivo_rescision: string; monto_cargo_mes?: number };

type CargoResumen = { id: number; descripcion: string; periodo: string; monto?: string };

type VistaPrevia = {
  cargo_mes: { id: number; descripcion: string; monto: string; monto_sugerido: string | null; facturado: boolean } | null;
  cargos_a_anular: CargoResumen[];
  cargos_con_aviso: CargoResumen[];
};

export const RescindirContratoModal = ({
  contrato,
  onClose,
  onSuccess,
}: {
  contrato: ContratoAlquilerRow;
  onClose: () => void;
  onSuccess: () => void;
}) => {
  const { message } = App.useApp();
  const [guardando, setGuardando] = useState(false);
  const [vistaPrevia, setVistaPrevia] = useState<VistaPrevia>();
  const [cargandoVista, setCargandoVista] = useState(false);
  const [form] = Form.useForm<Valores>();
  const fecha = Form.useWatch("fecha_rescision", form);
  const esFutura = !!fecha && fecha.isAfter(dayjs(), "day");
  const fechaIso = fecha?.format("YYYY-MM-DD");

  useEffect(() => {
    if (!fechaIso) {
      return;
    }

    let vigente = true;
    setCargandoVista(true);
    setVistaPrevia(undefined);
    form.setFieldValue("monto_cargo_mes", undefined);
    kyInstance
      .get(`contratos-alquiler/${contrato.id}/rescision-preview`, { searchParams: { fecha_rescision: fechaIso } })
      .then(async (response) => {
        if (!vigente) {
          return;
        }
        if (!response.ok) {
          setVistaPrevia(undefined);
          message.error(await extractErrorMessage(response, "No se pudo calcular el efecto sobre los cargos."));
          return;
        }
        const datos = (await response.json()) as VistaPrevia;
        setVistaPrevia(datos);
        form.setFieldValue(
          "monto_cargo_mes",
          datos.cargo_mes?.monto_sugerido ? Number(datos.cargo_mes.monto_sugerido) : undefined,
        );
      })
      .finally(() => vigente && setCargandoVista(false));

    return () => {
      vigente = false;
    };
  }, [contrato.id, fechaIso, form, message]);

  const cargoMes = vistaPrevia?.cargo_mes;
  const montoEditable = !!cargoMes && !cargoMes.facturado;

  const rescindir = async (values: Valores) => {
    setGuardando(true);
    const response = await kyInstance.patch(`contratos-alquiler/${contrato.id}/rescindir`, {
      json: {
        fecha_rescision: values.fecha_rescision.format("YYYY-MM-DD"),
        motivo_rescision: values.motivo_rescision,
        monto_cargo_mes: montoEditable ? values.monto_cargo_mes : undefined,
      },
    });
    setGuardando(false);

    if (!response.ok) {
      message.error(await extractErrorMessage(response, "No se pudo rescindir el contrato."));
      return;
    }

    const { avisos } = (await response.json()) as { avisos: string[] };
    message.success(esFutura ? "Aviso de salida registrado." : "Contrato rescindido.");
    avisos.forEach((aviso) => message.warning(aviso, 8));
    onSuccess();
  };

  return (
    <Modal
      title="Rescindir contrato"
      open
      onCancel={onClose}
      onOk={() => form.submit()}
      okText="Rescindir"
      cancelText="Cancelar"
      confirmLoading={guardando}
      okButtonProps={{ danger: true, disabled: cargandoVista }}
    >
      <Form form={form} layout="vertical" onFinish={rescindir} initialValues={{ fecha_rescision: dayjs() }}>
        <Form.Item label="Fecha efectiva" name="fecha_rescision" rules={[{ required: true }]}>
          <DatePicker
            style={{ width: "100%" }}
            format="DD/MM/YYYY"
            disabledDate={(date) =>
              date.isBefore(dayjs(contrato.fecha_inicio), "day") || date.isAfter(dayjs(contrato.fecha_fin), "day")
            }
          />
        </Form.Item>
        {esFutura && (
          <Alert
            type="info"
            showIcon
            style={{ marginBottom: 16 }}
            message="Aviso de salida: el contrato sigue vigente hasta esa fecha."
          />
        )}
        <Form.Item label="Motivo" name="motivo_rescision" rules={[{ required: true }, { max: 255 }]}>
          <Input.TextArea rows={3} />
        </Form.Item>

        <Skeleton active loading={cargandoVista}>
          {vistaPrevia && (
            <>
              <Descriptions column={2} size="small" style={{ marginBottom: 16 }}>
                <Descriptions.Item label="Cargo del mes" span={2}>
                  {cargoMes ? cargoMes.descripcion : "No hay un cargo de alquiler activo en el mes de rescisión."}
                </Descriptions.Item>
                {cargoMes && (
                  <Descriptions.Item label="Monto actual">{formatMonto(cargoMes.monto)}</Descriptions.Item>
                )}
                {cargoMes?.monto_sugerido && (
                  <Descriptions.Item label="Prorrateo sugerido">{formatMonto(cargoMes.monto_sugerido)}</Descriptions.Item>
                )}
                <Descriptions.Item label="Cargos que se anulan" span={2}>
                  {vistaPrevia.cargos_a_anular.length === 0
                    ? "Ninguno"
                    : vistaPrevia.cargos_a_anular.map((cargo) => cargo.descripcion).join(", ")}
                </Descriptions.Item>
              </Descriptions>

              {montoEditable && (
                <Form.Item
                  label="Monto del cargo del mes"
                  name="monto_cargo_mes"
                  extra="Es el prorrateo sugerido; podés corregirlo, hasta el monto actual."
                  rules={[{ required: true }]}
                >
                  <MontoInput min={1} max={Number(cargoMes.monto)} />
                </Form.Item>
              )}

              {vistaPrevia.cargos_con_aviso.length > 0 && (
                <Alert
                  type="warning"
                  showIcon
                  style={{ marginBottom: 16 }}
                  message={`Ya tienen facturación y no se modifican: ${vistaPrevia.cargos_con_aviso
                    .map((cargo) => cargo.descripcion)
                    .join(", ")}. Revertilos a mano.`}
                />
              )}
            </>
          )}
        </Skeleton>
      </Form>
    </Modal>
  );
};
