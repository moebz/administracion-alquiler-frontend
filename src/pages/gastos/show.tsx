import { useState } from "react";
import { EditButton, Show } from "@refinedev/antd";
import { useOne, usePermissions, useShow } from "@refinedev/core";
import { Button, Card, Descriptions, Empty, Space, Tag, Tooltip } from "antd";
import dayjs from "dayjs";
import { CompraDetail } from "../compras/compra-detail";
import type { CompraRow } from "../compras/types";
import { formatMonto } from "../../utils/monto";
import { AnularGastoModal } from "./anular-gasto-modal";
import { RegistrarFacturaModal } from "./registrar-factura-modal";
import { RegistrarPagoModal } from "./registrar-pago-modal";
import { A_CARGO_DE_LABEL, GASTO_ESTADO_COLOR, GASTO_ESTADO_LABEL, GASTO_TIPO_LABEL, type GastoRow } from "./types";

// Acá vive todo lo del gasto Y de su factura (ver ARQUITECTURA.md, "Gastos"):
// antes la factura tenía su propia pantalla en pages/compras, separada del
// gasto que la originó — se unificaron para no tener que saltar entre dos
// listados para ver el estado completo de un mismo gasto. Las Card de acá
// abajo son justamente el límite entre "datos del gasto" y "datos de la
// factura" (App\Models\DocumentoCompra), que siguen siendo dos entidades
// distintas aunque hoy nazcan siempre juntas.
export const GastoShow = () => {
  const { query: gastoQuery, result: gasto } = useShow<GastoRow>();
  const { data: permissions } = usePermissions<string[]>({});

  const puedeRegistrarFactura =
    (permissions?.includes("gastos.registrar_pago") && permissions?.includes("compras.registrar")) ?? false;
  const puedeRegistrarPago =
    (permissions?.includes("gastos.registrar_pago") && permissions?.includes("pagos.registrar")) ?? false;
  const puedeAnularGasto = permissions?.includes("gastos.anular") ?? false;
  const puedeAnularCompra = permissions?.includes("compras.anular") ?? false;

  const [facturaAbierta, setFacturaAbierta] = useState(false);
  const [pagoAbierto, setPagoAbierto] = useState(false);
  const [anularAbierto, setAnularAbierto] = useState(false);

  const { query: compraQuery, result: compra } = useOne<CompraRow>({
    resource: "compras",
    id: gasto?.documento_compra_id ?? "",
    queryOptions: { enabled: !!gasto?.documento_compra_id },
  });

  const refetchTodo = () => {
    gastoQuery.refetch();
    compraQuery.refetch();
  };

  const puedeAnularEsteGasto =
    puedeAnularGasto &&
    !gasto?.documento_compra_id &&
    (gasto?.estado === "SOLICITADO" || gasto?.estado === "APROBADO");

  return (
    <Show
      title="Detalle del gasto"
      isLoading={gastoQuery.isLoading}
      headerButtons={() =>
        gasto?.estado === "SOLICITADO" ? <EditButton recordItemId={gasto.id} /> : null
      }
    >
      <Space direction="vertical" size="large" style={{ width: "100%" }}>
        <Card
          title="Datos del gasto"
          size="small"
          extra={
            puedeAnularEsteGasto && (
              <Tooltip title="Anular este gasto">
                <Button danger size="small" onClick={() => setAnularAbierto(true)}>
                  Anular
                </Button>
              </Tooltip>
            )
          }
        >
          <Descriptions column={2} size="small">
            <Descriptions.Item label="Unidad">
              {gasto &&
                `${gasto.unidad.bloque.edificio.nombre} - ${gasto.unidad.bloque.nombre} - ${gasto.unidad.numero}`}
            </Descriptions.Item>
            <Descriptions.Item label="Tipo">{gasto && GASTO_TIPO_LABEL[gasto.tipo]}</Descriptions.Item>
            <Descriptions.Item label="Descripción">{gasto?.descripcion}</Descriptions.Item>
            <Descriptions.Item label="Fecha">{gasto && dayjs(gasto.fecha).format("DD/MM/YYYY")}</Descriptions.Item>
            <Descriptions.Item label="Período">{gasto?.periodo ?? "—"}</Descriptions.Item>
            <Descriptions.Item label="Monto">{gasto && formatMonto(gasto.monto)}</Descriptions.Item>
            <Descriptions.Item label="Proveedor">{gasto?.proveedor.nombre}</Descriptions.Item>
            <Descriptions.Item label="A cargo de">{gasto && A_CARGO_DE_LABEL[gasto.a_cargo_de]}</Descriptions.Item>
            <Descriptions.Item label="Estado">
              {gasto && <Tag color={GASTO_ESTADO_COLOR[gasto.estado]}>{GASTO_ESTADO_LABEL[gasto.estado]}</Tag>}
            </Descriptions.Item>
            <Descriptions.Item label="Fecha de aprobación">
              {gasto?.fecha_aprobacion ? dayjs(gasto.fecha_aprobacion).format("DD/MM/YYYY HH:mm") : "—"}
            </Descriptions.Item>
            {gasto?.estado === "RECHAZADO" && (
              <Descriptions.Item label="Motivo de rechazo">{gasto.motivo_rechazo}</Descriptions.Item>
            )}
            {gasto?.estado === "ANULADO" && (
              <Descriptions.Item label="Motivo de anulación">{gasto.motivo_anulacion}</Descriptions.Item>
            )}
          </Descriptions>
        </Card>

        {gasto?.documento_compra_id ? (
          <CompraDetail
            compra={compra}
            puedeAnular={puedeAnularCompra}
            onAnulada={refetchTodo}
            headerExtra={
              compra && compra.estado === "REGISTRADO" && Number(compra.saldo) > 0 && puedeRegistrarPago ? (
                <Button size="small" onClick={() => setPagoAbierto(true)}>
                  Registrar pago
                </Button>
              ) : undefined
            }
          />
        ) : (
          gasto?.estado === "APROBADO" && (
            <Card title="Factura" size="small">
              <Empty description="Este gasto todavía no tiene factura registrada." image={Empty.PRESENTED_IMAGE_SIMPLE}>
                {puedeRegistrarFactura && (
                  <Button type="primary" onClick={() => setFacturaAbierta(true)}>
                    Registrar factura
                  </Button>
                )}
              </Empty>
            </Card>
          )
        )}
      </Space>

      {facturaAbierta && gasto && (
        <RegistrarFacturaModal
          gasto={gasto}
          onClose={() => setFacturaAbierta(false)}
          onSuccess={() => {
            setFacturaAbierta(false);
            // Solo el gasto: todavía no había documento_compra_id cuando se
            // armó este cierre, así que compraQuery.refetch() pegaría con el
            // id viejo (vacío). Al refetchear el gasto cambia el id que usa
            // useOne más abajo, y React Query dispara solo el fetch de la
            // compra recién creada.
            gastoQuery.refetch();
          }}
        />
      )}
      {pagoAbierto && gasto && (
        <RegistrarPagoModal
          gasto={gasto}
          onClose={() => setPagoAbierto(false)}
          onSuccess={() => {
            setPagoAbierto(false);
            refetchTodo();
          }}
        />
      )}
      {anularAbierto && gasto && (
        <AnularGastoModal
          gasto={gasto}
          onClose={() => setAnularAbierto(false)}
          onSuccess={() => {
            setAnularAbierto(false);
            gastoQuery.refetch();
          }}
        />
      )}
    </Show>
  );
};
