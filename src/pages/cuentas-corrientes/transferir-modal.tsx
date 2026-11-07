import { useEffect, useState } from "react";
import { FileDoneOutlined, FileTextOutlined, WalletOutlined } from "@ant-design/icons";
import { usePermissions } from "@refinedev/core";
import { Alert, App, Checkbox, Col, DatePicker, Descriptions, Flex, Form, Input, Modal, Typography } from "antd";
import dayjs from "dayjs";
import { SectionDivider } from "../../components/section-divider";
import { SectionRow } from "../../components/section-row";
import { extractErrorMessage } from "../../providers/auth";
import { kyInstance } from "../../providers/data";
import { formatMonto } from "../../utils/monto";
import { ValoresFormList, type ValorFormulario } from "../pagos-proveedor/valores-form-list";
import { FacturarFields } from "./facturar-fields";
import { MontoCell } from "./movimientos-table";
import type { FacturarSeleccion, TransferenciaVistaPrevia } from "./types";

type Valores = { fecha: dayjs.Dayjs; concepto?: string; valores: ValorFormulario[] };

type Props = {
  propietarioId: number;
  onClose: () => void;
  /** Se llama después de transferir, para que la cuenta recargue sus movimientos y su historial. */
  onTransferida: () => void;
};

// Registra el desembolso al propietario desde su cuenta corriente. Al elegir la fecha pide el monto sugerido (lo liquidado
// que todavía no se transfirió) y el tope (el saldo a esa fecha); el backend rechaza lo que supere el tope. Con
// "Facturar también hasta el período" corre la misma acción de facturar en la misma transacción: si falla, no se transfiere.
export const TransferirModal = ({ propietarioId, onClose, onTransferida }: Props) => {
  const { message } = App.useApp();
  const { data: permissions } = usePermissions<string[]>({});
  const puedeFacturar = (permissions?.includes("liquidaciones.facturar") && permissions?.includes("facturas.emitir")) ?? false;
  const [form] = Form.useForm<Valores>();
  const [vistaPrevia, setVistaPrevia] = useState<TransferenciaVistaPrevia>();
  const [error, setError] = useState<string>();
  const [guardando, setGuardando] = useState(false);
  const [conFactura, setConFactura] = useState(false);
  // Lo que hay que mandar para facturar; undefined mientras la vista previa de facturación no está lista.
  const [facturacion, setFacturacion] = useState<FacturarSeleccion>();

  const fecha = Form.useWatch("fecha", form);
  const valores = Form.useWatch("valores", form) as ValorFormulario[] | undefined;
  const fechaIso = fecha ? dayjs(fecha).format("YYYY-MM-DD") : undefined;

  // Pedir la vista previa cada vez que cambia la fecha.
  useEffect(() => {
    if (!fechaIso) {
      return;
    }

    let vigente = true;
    setError(undefined);
    kyInstance
      .get(`cuentas-corrientes/${propietarioId}/transferencia-preview`, { searchParams: { fecha: fechaIso } })
      .json<TransferenciaVistaPrevia>()
      .then((previa) => {
        if (!vigente) {
          return;
        }

        setVistaPrevia(previa);

        // Proponer el sugerido en el primer valor solo si el usuario todavía no escribió un monto.
        const primero = form.getFieldValue(["valores", 0, "monto"]);
        if (Number(previa.sugerido) > 0 && !primero) {
          form.setFieldValue(["valores", 0, "monto"], Number(previa.sugerido));
        }
      })
      .catch((falla: { message?: string }) => {
        // Los GET fallidos se rechazan con el mensaje del servidor (ver providers/data.ts).
        if (vigente) {
          setVistaPrevia(undefined);
          setError(falla.message ?? "No se pudo calcular la transferencia.");
        }
      });

    return () => {
      vigente = false;
    };
  }, [propietarioId, fechaIso, form]);

  const total = (valores ?? []).reduce((acum, valor) => acum + (Number(valor?.monto) || 0), 0);
  const superaElTope = vistaPrevia !== undefined && total > Number(vistaPrevia.tope);
  const cuentaOptions = (vistaPrevia?.cuentas ?? []).map((cuenta) => ({
    label: `${cuenta.banco} - ${cuenta.numero_cuenta}`,
    value: cuenta.id,
  }));

  const transferir = async (values: Valores) => {
    setGuardando(true);
    const response = await kyInstance.post(`cuentas-corrientes/${propietarioId}/transferencias`, {
      json: {
        fecha: dayjs(values.fecha).format("YYYY-MM-DD"),
        concepto: values.concepto,
        valores: values.valores,
        facturar: conFactura ? facturacion : undefined,
      },
    });
    setGuardando(false);

    if (response.ok) {
      message.success("Transferencia registrada.");
      onTransferida();
      return;
    }

    // Mostrar los errores de validación en su campo; los demás (como superar el saldo) como mensaje.
    const body = await response.json<{ message?: string; errors?: Record<string, string[]> }>().catch(() => null);
    if (response.status === 422 && body?.errors) {
      form.setFields(
        Object.entries(body.errors).map(([name, errors]) => ({ name: name.split("."), errors })) as Parameters<
          typeof form.setFields
        >[0],
      );
      return;
    }
    message.error(await extractErrorMessage(response, "No se pudo registrar la transferencia."));
  };

  return (
    <Modal
      open
      width={720}
      title="Transferir al propietario"
      okText="Transferir"
      cancelText="Cancelar"
      // Con "Facturar también" tildado hace falta que la facturación esté lista (con nada por facturar no se puede tildar).
      okButtonProps={{ disabled: !vistaPrevia || (conFactura && !facturacion) }}
      confirmLoading={guardando}
      onOk={() => form.submit()}
      onCancel={onClose}
      destroyOnHidden
    >
      {error && <Alert type="error" showIcon message={error} style={{ marginBottom: 16 }} />}

      {vistaPrevia && (
        <Descriptions column={2} size="small" style={{ marginBottom: 16 }}>
          <Descriptions.Item label="Propietario">{vistaPrevia.propietario.nombre}</Descriptions.Item>
          <Descriptions.Item label="Documento">{vistaPrevia.propietario.documento}</Descriptions.Item>
          <Descriptions.Item label="Sugerido">
            <MontoCell monto={vistaPrevia.sugerido} />
          </Descriptions.Item>
          <Descriptions.Item label="Tope">
            <MontoCell monto={vistaPrevia.tope} />
          </Descriptions.Item>
        </Descriptions>
      )}

      <Form form={form} layout="vertical" onFinish={transferir} initialValues={{ fecha: dayjs() }}>
        <SectionDivider icon={<FileTextOutlined />}>Datos de la transferencia</SectionDivider>
        <SectionRow gutter={24}>
          <Col xs={24} md={8}>
            <Form.Item label="Fecha" name="fecha" rules={[{ required: true }]}>
              <DatePicker
                allowClear={false}
                style={{ width: "100%" }}
                format="DD/MM/YYYY"
                // No se transfiere con fecha futura: la plata todavía no salió.
                disabledDate={(dia) => dia.isAfter(dayjs(), "day")}
              />
            </Form.Item>
          </Col>
          <Col xs={24} md={16}>
            <Form.Item label="Concepto" name="concepto">
              <Input placeholder="Transferencia al propietario" maxLength={255} />
            </Form.Item>
          </Col>
        </SectionRow>

        <SectionDivider icon={<WalletOutlined />}>Medios de pago</SectionDivider>
        <ValoresFormList form={form} cuentaOptions={cuentaOptions} cuentaPlaceholder="Cuenta del propietario (opcional)" />

        <Flex justify="flex-end" gap={8} style={{ marginTop: 16 }}>
          <Typography.Text type="secondary">Total a transferir:</Typography.Text>
          <Typography.Text strong type={superaElTope ? "danger" : undefined}>
            {formatMonto(total)}
          </Typography.Text>
          {vistaPrevia && <Typography.Text type="secondary">de {formatMonto(vistaPrevia.tope)}</Typography.Text>}
        </Flex>

        {puedeFacturar && (
          <>
            <SectionDivider icon={<FileDoneOutlined />}>Facturación</SectionDivider>
            <Checkbox
              checked={conFactura}
              onChange={(evento) => {
                setConFactura(evento.target.checked);
                setFacturacion(undefined);
              }}
              style={{ marginBottom: 16 }}
            >
              Facturar también hasta el período
            </Checkbox>
            {conFactura && <FacturarFields propietarioId={propietarioId} onChange={setFacturacion} />}
          </>
        )}
      </Form>
    </Modal>
  );
};
