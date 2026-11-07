import { ContainerOutlined } from "@ant-design/icons";
import { Show } from "@refinedev/antd";
import { useShow } from "@refinedev/core";
import { Alert, Descriptions, Tag } from "antd";
import dayjs from "dayjs";
import { PageTitle } from "../../components/page-title";
import { MontoCell, MovimientosTable } from "../cuentas-corrientes/movimientos-table";
import { LIQUIDACION_ESTADO_LABEL, type LiquidacionDetalle } from "../cuentas-corrientes/types";

const FORMATO_FECHA = "DD/MM/YYYY";

// Sin entrada en el menú: se llega desde la cuenta corriente del propietario, por el historial o por la columna
// "Liquidación" de sus movimientos. Por ahora se ve solo en pantalla, sin imprimir ni generar PDF.
export const LiquidacionShow = () => {
  const { query, result: liquidacion } = useShow<LiquidacionDetalle>();
  const anulada = liquidacion?.estado === "ANULADA";

  return (
    <Show
      isLoading={query.isLoading}
      title={<PageTitle icon={<ContainerOutlined />}>{liquidacion ? `Liquidación N.º ${liquidacion.id}` : "Liquidación"}</PageTitle>}
    >
      {liquidacion && (
        <>
          {anulada && (
            <Alert
              type="warning"
              showIcon
              style={{ marginBottom: 16 }}
              message={`Anulada${liquidacion.fecha_anulacion ? ` el ${dayjs(liquidacion.fecha_anulacion).format(FORMATO_FECHA)}` : ""}: ${liquidacion.motivo_anulacion ?? ""}`}
              description="Sus movimientos volvieron a quedar sin liquidar; los totales son los que tenía cuando se confirmó."
            />
          )}
          <Descriptions column={2} size="small" style={{ marginBottom: 16 }}>
            <Descriptions.Item label="Propietario">{liquidacion.propietario.nombre}</Descriptions.Item>
            <Descriptions.Item label="Documento">{liquidacion.propietario.documento}</Descriptions.Item>
            <Descriptions.Item label="Corte">{dayjs(liquidacion.corte).format(FORMATO_FECHA)}</Descriptions.Item>
            <Descriptions.Item label="Estado">
              <Tag color={anulada ? "default" : "green"}>{LIQUIDACION_ESTADO_LABEL[liquidacion.estado]}</Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Saldo anterior">
              <MontoCell monto={liquidacion.saldo_anterior} />
            </Descriptions.Item>
            <Descriptions.Item label="Total">
              <MontoCell monto={liquidacion.total} />
            </Descriptions.Item>
            <Descriptions.Item label="Saldo final">
              <MontoCell monto={liquidacion.saldo_final} />
            </Descriptions.Item>
          </Descriptions>
          {!anulada && <MovimientosTable movimientos={liquidacion.movimientos} />}
        </>
      )}
    </Show>
  );
};
