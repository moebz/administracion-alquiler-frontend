import { useState } from "react";
import { Alert, App, Button, Descriptions, Form, Input, List, Modal } from "antd";
import { MontoInput } from "../../components/monto-input";
import { extractErrorMessage } from "../../providers/auth";
import { kyInstance } from "../../providers/data";
import { formatMonto } from "../../utils/monto";
import { describirPermisosFaltantes } from "./correccion";
import type { CargoRow, PlanCorreccion } from "./types";

type CargoCorregible = Pick<CargoRow, "id" | "descripcion" | "monto" | "monto_vigente">;

type Valores = { monto: number; motivo: string };

// Corrige el monto de un cargo: el usuario escribe el monto correcto y el motivo, "Revisar" pide la vista previa de lo que
// se va a hacer (bajar o subir el monto, NC al inquilino, ajuste nuevo) y recién "Confirmar" lo hace, con el plan que vio.
export const CorregirMontoModal = ({
  cargo,
  onClose,
  onSuccess,
}: {
  cargo: CargoCorregible;
  onClose: () => void;
  onSuccess: () => void;
}) => {
  const { message } = App.useApp();
  const [form] = Form.useForm<Valores>();
  const [plan, setPlan] = useState<PlanCorreccion | null>(null);
  const [cargando, setCargando] = useState(false);

  const ajustes = Number(cargo.monto_vigente) - Number(cargo.monto);

  const revisar = async () => {
    const { monto } = await form.validateFields(["monto"]);

    setCargando(true);
    try {
      const response = await kyInstance.get(`cargos/${cargo.id}/correccion-preview`, { searchParams: { monto } });
      setPlan(await response.json<PlanCorreccion>());
    } catch (error) {
      // Los GET fallidos se rechazan con el mensaje del servidor (ver providers/data.ts).
      message.error((error as { message?: string }).message ?? "No se pudo revisar la corrección.");
      setPlan(null);
    }
    setCargando(false);
  };

  const confirmar = async () => {
    if (!plan) {
      return;
    }
    const { monto, motivo } = await form.validateFields();

    setCargando(true);
    const response = await kyInstance.patch(`cargos/${cargo.id}/corregir-monto`, {
      json: { monto, motivo, plan_esperado: plan.pasos },
    });
    setCargando(false);

    if (response.ok) {
      message.success("Monto corregido.");
      onSuccess();
      return;
    }

    message.error(await extractErrorMessage(response, "No se pudo corregir el monto."));
    // Pedir revisar de nuevo: el plan que vio el usuario pudo haber cambiado.
    setPlan(null);
  };

  return (
    <Modal
      title="Corregir monto"
      open
      onCancel={onClose}
      width={640}
      footer={[
        <Button key="cancelar" onClick={onClose}>
          Cancelar
        </Button>,
        plan ? (
          <Button key="confirmar" type="primary" loading={cargando} disabled={plan.permisos_faltantes.length > 0} onClick={confirmar}>
            Confirmar
          </Button>
        ) : (
          <Button key="revisar" type="primary" loading={cargando} onClick={revisar}>
            Revisar
          </Button>
        ),
      ]}
    >
      <Descriptions column={2} size="small" style={{ marginBottom: 16 }}>
        <Descriptions.Item label="Cargo" span={2}>
          {cargo.descripcion}
        </Descriptions.Item>
        <Descriptions.Item label="Monto del cargo">{formatMonto(cargo.monto)}</Descriptions.Item>
        {/* Mostrar los ajustes activos: el monto vigente los suma. */}
        {ajustes > 0 && <Descriptions.Item label="Ajustes activos">{formatMonto(ajustes)}</Descriptions.Item>}
        <Descriptions.Item label="Monto vigente">{formatMonto(cargo.monto_vigente)}</Descriptions.Item>
      </Descriptions>

      <Form
        form={form}
        layout="vertical"
        initialValues={{ monto: Number(cargo.monto_vigente) }}
        // Cambiar el monto invalida la vista previa: hay que revisar de nuevo.
        onValuesChange={(cambios) => {
          if ("monto" in cambios) {
            setPlan(null);
          }
        }}
      >
        <Form.Item label="Monto correcto" name="monto" rules={[{ required: true }]}>
          <MontoInput />
        </Form.Item>
        <Form.Item label="Motivo" name="motivo" rules={[{ required: true }, { max: 255 }]}>
          <Input placeholder="Ej.: alquiler cargado por menos de lo que dice el contrato" />
        </Form.Item>
      </Form>

      {plan && (
        <>
          <List
            size="small"
            bordered
            header="Qué se va a hacer"
            dataSource={plan.pasos}
            renderItem={(paso) => <List.Item>{paso.texto}</List.Item>}
            style={{ marginBottom: 16 }}
          />
          {plan.avisos.map((aviso) => (
            <Alert key={aviso} type="warning" showIcon style={{ marginBottom: 8 }} message={aviso} />
          ))}
          {plan.permisos_faltantes.length > 0 && (
            <Alert
              type="error"
              showIcon
              message={describirPermisosFaltantes(plan.permisos_faltantes)}
            />
          )}
        </>
      )}
    </Modal>
  );
};
