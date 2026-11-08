import { useEffect, useState } from "react";
import { StopOutlined } from "@ant-design/icons";
import { usePermissions } from "@refinedev/core";
import { App, Button, Input, Space, Table, Tag, Tooltip, Typography } from "antd";
import dayjs from "dayjs";
import { Link } from "react-router";
import { extractErrorMessage } from "../../providers/auth";
import { kyInstance } from "../../providers/data";
import { nombreDelLado, rutaDeLaFactura } from "./compensacion";
import { MontoCell } from "./movimientos-table";
import { COMPENSACION_ESTADO_COLOR, COMPENSACION_ESTADO_LABEL, type Compensacion, type CompensacionAplicacion } from "./types";

const FORMATO_FECHA = "DD/MM/YYYY";

type Props = {
  propietarioId: number;
  /** Cambia cuando la cuenta transfirió o anuló algo, para volver a pedir las compensaciones. */
  version: number;
  /** Se llama después de anular una compensación, para que la cuenta recargue el detalle, el control y las demás tablas. */
  onCambio: () => void;
};

// Compensaciones del propietario, de la más nueva a la más vieja. Nacen solas al transferirle (no hay acción para
// crearlas) y se anulan enteras: las facturas de los dos lados vuelven a quedar abiertas.
export const Compensaciones = ({ propietarioId, version, onCambio }: Props) => {
  const { message, modal } = App.useApp();
  const { data: permissions } = usePermissions<string[]>({});
  const puedeVerPagos = permissions?.includes("pagos.ver") ?? false;
  const puedeAnular = permissions?.includes("compensaciones.anular") ?? false;

  const [filas, setFilas] = useState<Compensacion[]>();
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    let vigente = true;
    setCargando(true);
    kyInstance
      .get(`cuentas-corrientes/${propietarioId}/compensaciones`)
      .json<Compensacion[]>()
      .then((datos) => vigente && setFilas(datos))
      .catch((error: { message?: string }) => {
        if (vigente) {
          message.error(error.message ?? "No se pudieron cargar las compensaciones.");
        }
      })
      .finally(() => vigente && setCargando(false));

    return () => {
      vigente = false;
    };
  }, [propietarioId, version, message]);

  // Pide el motivo y anula la compensación entera.
  const anular = (compensacion: Compensacion) => {
    let motivo = "";

    modal.confirm({
      title: "¿Anular la compensación?",
      content: (
        <>
          <Typography.Paragraph>
            Las facturas de los dos lados vuelven a quedar abiertas hasta la próxima transferencia, que las vuelve a compensar.
          </Typography.Paragraph>
          <Input.TextArea
            rows={3}
            maxLength={255}
            placeholder="Motivo de la anulación"
            onChange={(event) => {
              motivo = event.target.value;
            }}
          />
        </>
      ),
      okText: "Anular",
      okButtonProps: { danger: true },
      cancelText: "Cancelar",
      onOk: async () => {
        if (!motivo.trim()) {
          message.error("Ingresá el motivo de la anulación.");
          throw new Error("motivo requerido");
        }

        const response = await kyInstance.patch(`cuentas-corrientes/${propietarioId}/compensaciones/${compensacion.id}/anular`, {
          json: { motivo_anulacion: motivo },
        });
        if (!response.ok) {
          message.error(await extractErrorMessage(response, "No se pudo anular la compensación."));
          throw new Error("anulación rechazada");
        }

        message.success("Compensación anulada.");
        onCambio();
      },
    });
  };

  return (
    <Table<Compensacion>
      title={() => <Typography.Text strong>Compensaciones</Typography.Text>}
      dataSource={filas}
      loading={cargando}
      rowKey="id"
      pagination={{ pageSize: 10, hideOnSinglePage: true }}
      scroll={{ x: "max-content" }}
      locale={{ emptyText: "Todavía no se compensó nada." }}
      // Cada fila se despliega con lo que cerró de cada factura.
      expandable={{
        rowExpandable: (compensacion) => compensacion.aplicaciones.length > 0,
        expandedRowRender: (compensacion) => (
          <Table<CompensacionAplicacion>
            dataSource={compensacion.aplicaciones}
            rowKey={(aplicacion) => `${aplicacion.lado}-${aplicacion.documento_id}`}
            size="small"
            pagination={false}
          >
            <Table.Column title="Factura" dataIndex="lado" render={(lado: CompensacionAplicacion["lado"]) => nombreDelLado(lado)} />
            <Table.Column
              title="N.º"
              dataIndex="numero"
              render={(numero: string | null, aplicacion: CompensacionAplicacion) => (
                <Link to={rutaDeLaFactura(aplicacion)}>{numero ?? aplicacion.documento_id}</Link>
              )}
            />
            <Table.Column title="Monto" dataIndex="monto" align="right" render={(monto: string) => <MontoCell monto={monto} />} />
          </Table>
        ),
      }}
    >
      <Table.Column title="Fecha" dataIndex="fecha" render={(fecha: string) => dayjs(fecha).format(FORMATO_FECHA)} />
      <Table.Column title="Monto" dataIndex="monto" align="right" render={(monto: string) => <MontoCell monto={monto} />} />
      <Table.Column
        title="Transferencia"
        dataIndex="transferencia"
        render={(transferencia: Compensacion["transferencia"]) => {
          if (!transferencia) {
            return "—";
          }

          // Enlazar al pago solo si el usuario puede verlo.
          return puedeVerPagos ? (
            <Link to={`/administrador/pagos-proveedor/show/${transferencia.id}`}>N° {transferencia.numero}</Link>
          ) : (
            `N° ${transferencia.numero}`
          );
        }}
      />
      <Table.Column
        title="Estado"
        dataIndex="estado"
        render={(estado: Compensacion["estado"], compensacion: Compensacion) => (
          <Space size={4} wrap>
            <Tag color={COMPENSACION_ESTADO_COLOR[estado]}>{COMPENSACION_ESTADO_LABEL[estado]}</Tag>
            {puedeAnular && estado === "ACTIVA" && (
              <Tooltip title="Anular">
                <Button size="small" danger icon={<StopOutlined />} onClick={() => anular(compensacion)} />
              </Tooltip>
            )}
          </Space>
        )}
      />
    </Table>
  );
};
