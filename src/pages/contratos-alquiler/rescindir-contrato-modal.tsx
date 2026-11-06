import { useEffect, useState } from "react";
import { Alert, App, DatePicker, Descriptions, Form, Input, List, Modal, Skeleton } from "antd";
import dayjs, { type Dayjs } from "dayjs";
import { MontoInput } from "../../components/monto-input";
import { extractErrorMessage } from "../../providers/auth";
import { kyInstance } from "../../providers/data";
import { formatMonto } from "../../utils/monto";
import { describirPermisosFaltantes } from "../cargos/correccion";
import type { PlanCorreccion } from "../cargos/types";
import type { ContratoAlquilerRow } from "./types";

type Valores = { fecha_rescision: Dayjs; motivo_rescision: string; monto_cargo_mes?: number };

type CargoResumen = { id: number; descripcion: string; periodo: string; monto?: string };

type VistaPrevia = {
  cargo_mes: {
    id: number;
    descripcion: string;
    monto: string;
    // Monto del alquiler más sus ajustes activos: lo que se prorratea y el tope del monto elegido.
    monto_vigente: string;
    monto_sugerido: string;
    cubria_desde: string;
    cubria_hasta: string;
    dias_cubiertos: number;
    dias_prorrateados: number;
    facturado: boolean;
  } | null;
  // Plan de "Corregir monto" que prorratea el mes con el monto elegido; null si el monto no cambia.
  correccion_mes: PlanCorreccion | null;
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
  // Monto con el que se armó el plan mostrado, para pedir uno nuevo cuando el usuario cambia el monto.
  const [montoDelPlan, setMontoDelPlan] = useState<number>();
  const [cargandoPlan, setCargandoPlan] = useState(false);
  const [form] = Form.useForm<Valores>();
  const fecha = Form.useWatch("fecha_rescision", form);
  const esFutura = !!fecha && fecha.isAfter(dayjs(), "day");
  const fechaIso = fecha?.format("YYYY-MM-DD");
  const monto = Form.useWatch("monto_cargo_mes", form);
  const montoVigente = vistaPrevia?.cargo_mes ? Number(vistaPrevia.cargo_mes.monto_vigente) : undefined;

  useEffect(() => {
    if (!fechaIso) {
      return;
    }

    let vigente = true;
    setCargandoVista(true);
    setVistaPrevia(undefined);
    setMontoDelPlan(undefined);
    form.setFieldValue("monto_cargo_mes", undefined);
    kyInstance
      .get(`contratos-alquiler/${contrato.id}/rescision-preview`, { searchParams: { fecha_rescision: fechaIso } })
      .json<VistaPrevia>()
      .then((datos) => {
        if (!vigente) {
          return;
        }
        const sugerido = datos.cargo_mes ? Number(datos.cargo_mes.monto_sugerido) : undefined;
        setVistaPrevia(datos);
        setMontoDelPlan(sugerido);
        form.setFieldValue("monto_cargo_mes", sugerido);
      })
      .catch((error: { message?: string }) => {
        // Los GET fallidos se rechazan con el mensaje del servidor (ver providers/data.ts).
        if (vigente) {
          message.error(error.message ?? "No se pudo calcular el efecto sobre los cargos.");
        }
      })
      .finally(() => vigente && setCargandoVista(false));

    return () => {
      vigente = false;
    };
  }, [contrato.id, fechaIso, form, message]);

  // Pedir de nuevo el plan del mes cuando el usuario elige otro monto, esperando a que termine de escribir.
  useEffect(() => {
    const sinPlanNuevo = !fechaIso || !monto || montoVigente === undefined || monto > montoVigente;
    if (sinPlanNuevo || monto === montoDelPlan) {
      return;
    }

    let vigente = true;
    setCargandoPlan(true);
    const espera = setTimeout(() => {
      kyInstance
        .get(`contratos-alquiler/${contrato.id}/rescision-preview`, {
          searchParams: { fecha_rescision: fechaIso, monto_cargo_mes: monto },
        })
        .json<VistaPrevia>()
        .then((datos) => {
          if (vigente) {
            setVistaPrevia(datos);
            setMontoDelPlan(monto);
          }
        })
        .catch((error: { message?: string }) => {
          if (vigente) {
            message.error(error.message ?? "No se pudo calcular el efecto sobre los cargos.");
          }
        })
        .finally(() => vigente && setCargandoPlan(false));
    }, 400);

    return () => {
      vigente = false;
      clearTimeout(espera);
      setCargandoPlan(false);
    };
  }, [contrato.id, fechaIso, form, message, monto, montoDelPlan, montoVigente]);

  const cargoMes = vistaPrevia?.cargo_mes;
  const plan = vistaPrevia?.correccion_mes ?? null;
  // Esperar el plan del monto elegido antes de rescindir: lo que se confirma es lo que se mostró.
  const planDesactualizado = !!monto && monto !== montoDelPlan;
  const faltanPermisos = (plan?.permisos_faltantes.length ?? 0) > 0;

  const rescindir = async (values: Valores) => {
    setGuardando(true);
    const response = await kyInstance.patch(`contratos-alquiler/${contrato.id}/rescindir`, {
      json: {
        fecha_rescision: values.fecha_rescision.format("YYYY-MM-DD"),
        motivo_rescision: values.motivo_rescision,
        monto_cargo_mes: cargoMes ? values.monto_cargo_mes : undefined,
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
      okButtonProps={{ danger: true, disabled: cargandoVista || cargandoPlan || planDesactualizado || faltanPermisos }}
    >
      <Form form={form} layout="vertical" onFinish={rescindir} initialValues={{ fecha_rescision: dayjs() }}>
        <Form.Item
          label="Fecha efectiva"
          name="fecha_rescision"
          extra={`El contrato vence el ${dayjs(contrato.fecha_fin).format("DD/MM/YYYY")}.`}
          rules={[{ required: true }]}
        >
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
              <Descriptions column={1} size="small" style={{ marginBottom: 16 }}>
                <Descriptions.Item label="Cargo del mes">
                  {cargoMes
                    ? `${cargoMes.descripcion} · ${formatMonto(cargoMes.monto_vigente)}`
                    : "No hay un cargo de alquiler activo en el mes de rescisión."}
                </Descriptions.Item>
                {cargoMes && Number(cargoMes.monto_vigente) !== Number(cargoMes.monto) && (
                  <Descriptions.Item label="Ajustes activos">
                    {formatMonto(Number(cargoMes.monto_vigente) - Number(cargoMes.monto))}
                  </Descriptions.Item>
                )}
                {cargoMes && (
                  <Descriptions.Item label="Período del cargo">
                    {`${dayjs(cargoMes.cubria_desde).format("DD/MM/YYYY")} al ${dayjs(cargoMes.cubria_hasta).format("DD/MM/YYYY")}`}
                  </Descriptions.Item>
                )}
                {cargoMes && (
                  <Descriptions.Item label="Días prorrateados">
                    {`${cargoMes.dias_prorrateados} de ${cargoMes.dias_cubiertos}`}
                  </Descriptions.Item>
                )}
                <Descriptions.Item label="Cargos que se anulan">
                  {vistaPrevia.cargos_a_anular.length === 0
                    ? "Ninguno"
                    : vistaPrevia.cargos_a_anular.map((cargo) => cargo.descripcion).join(", ")}
                </Descriptions.Item>
              </Descriptions>

              {cargoMes && (
                <Form.Item
                  label="Monto del cargo del mes"
                  name="monto_cargo_mes"
                  extra={`Prorrateo de ${cargoMes.dias_prorrateados} de ${cargoMes.dias_cubiertos} días; podés corregirlo hasta ${formatMonto(cargoMes.monto_vigente)}.`}
                  rules={[{ required: true }]}
                >
                  <MontoInput min={1} max={Number(cargoMes.monto_vigente)} />
                </Form.Item>
              )}

              {/* Mostrar los pasos de "Corregir monto" que prorratean el mes: bajar el monto, NC sobre la factura, ajuste anulado. */}
              {plan && (
                <List
                  size="small"
                  bordered
                  header="Qué se va a hacer con el alquiler del mes"
                  dataSource={plan.pasos}
                  renderItem={(paso) => <List.Item>{paso.texto}</List.Item>}
                  style={{ marginBottom: 16 }}
                />
              )}
              {plan?.avisos.map((aviso) => (
                <Alert key={aviso} type="warning" showIcon style={{ marginBottom: 8 }} message={aviso} />
              ))}
              {faltanPermisos && plan && (
                <Alert
                  type="error"
                  showIcon
                  style={{ marginBottom: 16 }}
                  message={describirPermisosFaltantes(plan.permisos_faltantes)}
                />
              )}

              {vistaPrevia.cargos_con_aviso.length > 0 && (
                <Alert
                  type="warning"
                  showIcon
                  style={{ marginBottom: 16 }}
                  message={`Los períodos posteriores ya tienen facturación y no se modifican: ${vistaPrevia.cargos_con_aviso
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
