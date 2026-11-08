import { useEffect, useState } from "react";
import { ContainerOutlined } from "@ant-design/icons";
import { Show } from "@refinedev/antd";
import { App, DatePicker, Descriptions, Space } from "antd";
import dayjs, { type Dayjs } from "dayjs";
import { FilterBar } from "../../components/filter-bar";
import { PageTitle } from "../../components/page-title";
import { kyInstance } from "../../providers/data";
import { MontoCell, MovimientosTable } from "../cuentas-corrientes/movimientos-table";
import type { PropietarioCuenta } from "./types";

const FORMATO_FECHA = "DD/MM/YYYY";

const rutaLiquidacion = (id: number): string => `/propietario/liquidaciones/show/${id}`;

// "Mi cuenta": los movimientos del propietario con el saldo acumulado a la fecha que elija. Es el detalle de la cuenta
// corriente del panel interno sin botones ni lo que es de la administradora. Pide la cuenta de quien está logueado.
export const PropietarioCuentaShow = () => {
  const { message } = App.useApp();
  const [saldoAl, setSaldoAl] = useState<Dayjs>(() => dayjs());
  const [cuenta, setCuenta] = useState<PropietarioCuenta>();
  const [cargando, setCargando] = useState(true);

  const fechaIso = saldoAl.format("YYYY-MM-DD");

  // Pedir la cuenta con kyInstance y no con useShow, que no manda el parámetro `saldo_al`.
  useEffect(() => {
    let vigente = true;
    setCargando(true);
    kyInstance
      .get("propietario/cuenta", { searchParams: { saldo_al: fechaIso } })
      .json<PropietarioCuenta>()
      .then((datos) => vigente && setCuenta(datos))
      .catch((error: { message?: string }) => {
        // Los GET fallidos se rechazan con el mensaje del servidor (ver providers/data.ts).
        if (vigente) {
          message.error(error.message ?? "No se pudo cargar tu cuenta.");
        }
      })
      .finally(() => vigente && setCargando(false));

    return () => {
      vigente = false;
    };
  }, [fechaIso, message]);

  const hayPorVencer = cuenta !== undefined && Number(cuenta.por_vencer) !== 0;

  return (
    <Show
      isLoading={cargando}
      title={<PageTitle icon={<ContainerOutlined />}>Mi cuenta</PageTitle>}
      goBack={false}
      headerButtons={() => null}
    >
      <FilterBar>
        <Space>
          <span>Saldo al</span>
          <DatePicker allowClear={false} format={FORMATO_FECHA} value={saldoAl} onChange={(fecha) => fecha && setSaldoAl(fecha)} />
        </Space>
      </FilterBar>

      <Descriptions column={2} size="small" style={{ marginBottom: 16 }}>
        <Descriptions.Item label={`Saldo al ${saldoAl.format(FORMATO_FECHA)}`}>
          {cuenta && <MontoCell monto={cuenta.saldo} />}
        </Descriptions.Item>
        {/* Mostrar lo que vence después de esa fecha solo si hay algo. */}
        {hayPorVencer && (
          <Descriptions.Item label="Por vencer después de esa fecha">
            {cuenta && <MontoCell monto={cuenta.por_vencer} />}
          </Descriptions.Item>
        )}
      </Descriptions>

      <MovimientosTable movimientos={cuenta?.movimientos} loading={cargando} mostrarLiquidacion rutaLiquidacion={rutaLiquidacion} />
    </Show>
  );
};
