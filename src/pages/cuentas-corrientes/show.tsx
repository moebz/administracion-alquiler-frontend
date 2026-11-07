import { useCallback, useEffect, useState } from "react";
import { ContainerOutlined } from "@ant-design/icons";
import { Show } from "@refinedev/antd";
import { usePermissions, useResourceParams } from "@refinedev/core";
import { App, Button, DatePicker, Descriptions, Space, Tooltip } from "antd";
import dayjs, { type Dayjs } from "dayjs";
import { FilterBar } from "../../components/filter-bar";
import { PageTitle } from "../../components/page-title";
import { kyInstance } from "../../providers/data";
import { HistorialLiquidaciones } from "./historial-liquidaciones";
import { LiquidarModal } from "./liquidar-modal";
import { MontoCell, MovimientosTable } from "./movimientos-table";
import { TransferirModal } from "./transferir-modal";
import type { CuentaCorrienteDetalle } from "./types";

const FORMATO_FECHA = "DD/MM/YYYY";

export const CuentaCorrienteShow = () => {
  const { id } = useResourceParams();
  const { message } = App.useApp();
  const { data: permissions } = usePermissions<string[]>({});
  const puedeVerLiquidaciones = permissions?.includes("liquidaciones.ver") ?? false;
  const puedeLiquidar = permissions?.includes("liquidaciones.confirmar") ?? false;
  const puedeAnular = permissions?.includes("liquidaciones.anular") ?? false;
  // Transferir saca plata de caja: pide el permiso propio y también el de registrar pagos (ver el backend).
  const puedeTransferir = (permissions?.includes("liquidaciones.transferir") && permissions?.includes("pagos.registrar")) ?? false;

  const [saldoAl, setSaldoAl] = useState<Dayjs>(() => dayjs());
  const [detalle, setDetalle] = useState<CuentaCorrienteDetalle>();
  const [cargando, setCargando] = useState(true);
  const [liquidando, setLiquidando] = useState(false);
  const [transfiriendo, setTransfiriendo] = useState(false);
  // Se incrementa al confirmar o anular una liquidación o al transferir, para recargar el detalle y el historial.
  const [version, setVersion] = useState(0);

  const fechaIso = saldoAl.format("YYYY-MM-DD");

  // Pedir el detalle con kyInstance y no con useShow, que no manda el parámetro `saldo_al`.
  useEffect(() => {
    if (!id) {
      return;
    }

    let vigente = true;
    setCargando(true);
    kyInstance
      .get(`cuentas-corrientes/${id}`, { searchParams: { saldo_al: fechaIso } })
      .json<CuentaCorrienteDetalle>()
      .then((datos) => vigente && setDetalle(datos))
      .catch((error: { message?: string }) => {
        // Los GET fallidos se rechazan con el mensaje del servidor (ver providers/data.ts).
        if (vigente) {
          message.error(error.message ?? "No se pudo cargar la cuenta corriente.");
        }
      })
      .finally(() => vigente && setCargando(false));

    return () => {
      vigente = false;
    };
  }, [id, fechaIso, version, message]);

  const recargar = useCallback(() => setVersion((actual) => actual + 1), []);

  const hayPorVencer = detalle !== undefined && Number(detalle.por_vencer) !== 0;
  const liquidable = detalle?.liquidar.disponible ?? false;

  return (
    <Show
      isLoading={cargando}
      title={<PageTitle icon={<ContainerOutlined />}>Cuenta corriente</PageTitle>}
      headerButtons={({ defaultButtons }) => (
        <Space>
          {defaultButtons}
          {puedeLiquidar && (
            // El botón usa como corte la fecha de "Saldo al"; si no se puede liquidar con ella, el tooltip dice por qué.
            <Tooltip title={liquidable ? undefined : detalle?.liquidar.motivo}>
              <span>
                <Button type="primary" disabled={!liquidable} onClick={() => setLiquidando(true)}>
                  Liquidar
                </Button>
              </span>
            </Tooltip>
          )}
          {puedeTransferir && <Button onClick={() => setTransfiriendo(true)}>Transferir</Button>}
        </Space>
      )}
    >
      <FilterBar>
        <Space>
          <span>Saldo al</span>
          <DatePicker
            allowClear={false}
            format={FORMATO_FECHA}
            value={saldoAl}
            onChange={(fecha) => fecha && setSaldoAl(fecha)}
          />
        </Space>
      </FilterBar>

      <Descriptions column={2} size="small" style={{ marginBottom: 16 }}>
        <Descriptions.Item label="Propietario">{detalle?.propietario.nombre}</Descriptions.Item>
        <Descriptions.Item label="Documento">{detalle?.propietario.documento}</Descriptions.Item>
        <Descriptions.Item label={`Saldo al ${saldoAl.format(FORMATO_FECHA)}`}>
          {detalle && <MontoCell monto={detalle.saldo} />}
        </Descriptions.Item>
        {hayPorVencer && (
          <Descriptions.Item label="Por vencer después de esa fecha">
            {detalle && <MontoCell monto={detalle.por_vencer} />}
          </Descriptions.Item>
        )}
      </Descriptions>

      <MovimientosTable movimientos={detalle?.movimientos} loading={cargando} mostrarLiquidacion />

      {puedeVerLiquidaciones && id && (
        <div style={{ marginTop: 24 }}>
          <HistorialLiquidaciones
            propietarioId={Number(id)}
            puedeAnular={puedeAnular}
            version={version}
            onAnulada={recargar}
          />
        </div>
      )}

      {liquidando && detalle && (
        <LiquidarModal
          propietarioId={detalle.propietario.id}
          corte={detalle.saldo_al}
          onClose={() => setLiquidando(false)}
          onConfirmada={() => {
            setLiquidando(false);
            recargar();
          }}
        />
      )}

      {transfiriendo && detalle && (
        <TransferirModal
          propietarioId={detalle.propietario.id}
          onClose={() => setTransfiriendo(false)}
          onTransferida={() => {
            setTransfiriendo(false);
            recargar();
          }}
        />
      )}
    </Show>
  );
};
