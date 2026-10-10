import { useState } from "react";
import { EditButton, Show } from "@refinedev/antd";
import { useOne, usePermissions, useShow } from "@refinedev/core";
import {
  CalendarOutlined,
  CheckCircleOutlined,
  DollarOutlined,
  FileDoneOutlined,
  HomeOutlined,
  ShopOutlined,
  SolutionOutlined,
  StopOutlined,
  UserOutlined,
} from "@ant-design/icons";
import {
  Alert,
  Button,
  Card,
  Descriptions,
  Divider,
  Empty,
  Flex,
  Progress,
  Space,
  Statistic,
  Tag,
  theme,
  Tooltip,
  Typography,
} from "antd";
import dayjs from "dayjs";
import { Link } from "react-router";
import { CARGO_ESTADO_COLOR, CARGO_ESTADO_LABEL, CARGO_TIPO_LABEL } from "../cargos/types";
import { CompraDetail } from "../compras/compra-detail";
import type { CompraRow } from "../compras/types";
import { formatMonto } from "../../utils/monto";
import { AnularGastoModal } from "./anular-gasto-modal";
import { RegistrarFacturaModal } from "./registrar-factura-modal";
import { RegistrarPagoModal } from "./registrar-pago-modal";
import { A_CARGO_DE_LABEL, APROBADO_POR_LABEL, GASTO_ESTADO_COLOR, GASTO_ESTADO_LABEL, GASTO_TIPO_LABEL, type GastoRow } from "./types";

// Acá vive todo lo del gasto Y de su factura (ver ARQUITECTURA.md, "Gastos"):
// antes la factura tenía su propia pantalla en pages/compras, separada del
// gasto que la originó — se unificaron para no tener que saltar entre dos
// listados para ver el estado completo de un mismo gasto. Las secciones de
// acá abajo son justamente el límite entre "datos del gasto" y "datos de la
// factura" (App\Models\DocumentoCompra), que siguen siendo dos entidades
// distintas aunque hoy nazcan siempre juntas.
export const GastoShow = () => {
  const { query: gastoQuery, result: gasto } = useShow<GastoRow>();
  const { token } = theme.useToken();
  const { data: permissions } = usePermissions<string[]>({});

  const puedeRegistrarFactura =
    (permissions?.includes("gastos.registrar_pago") && permissions?.includes("compras.registrar")) ?? false;
  const puedeEditarFactura =
    (permissions?.includes("gastos.registrar_pago") && permissions?.includes("compras.editar")) ?? false;
  const puedeRegistrarPago =
    (permissions?.includes("gastos.registrar_pago") && permissions?.includes("pagos.registrar")) ?? false;
  const puedeAnularGasto = permissions?.includes("gastos.anular") ?? false;
  const puedeAnularCompra = permissions?.includes("compras.anular") ?? false;

  const [facturaAbierta, setFacturaAbierta] = useState(false);
  const [edicionAbierta, setEdicionAbierta] = useState(false);
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
    puedeAnularGasto && !gasto?.documento_compra_id && (gasto?.estado === "SOLICITADO" || gasto?.estado === "APROBADO");

  // Un cargo ya facturado no se anula: el backend lo rechaza con 422, así que se deshabilita el botón y se explica por qué.
  const cargoActivo = gasto?.cargo && gasto.cargo.estado !== "ANULADO" ? gasto.cargo : null;
  const cargoFacturado = !!cargoActivo && Number(cargoActivo.facturado) > 0;

  return (
    <Show
      title="Detalle del gasto"
      isLoading={gastoQuery.isLoading}
      contentProps={{
        style: { background: "transparent", boxShadow: "none" },
        styles: { body: { padding: 0 } },
      }}
      headerButtons={() => (gasto?.estado === "SOLICITADO" ? <EditButton recordItemId={gasto.id} /> : null)}
    >
      <Space direction="vertical" size="large" style={{ width: "100%" }}>
        {gasto && (
          <Card
            variant="borderless"
            styles={{ body: { padding: 0 } }}
            style={{ overflow: "hidden", boxShadow: token.boxShadowTertiary, borderRadius: token.borderRadiusLG }}
          >
            <Flex justify="space-between" align="flex-start" wrap gap={24} style={{ padding: token.paddingLG }}>
              <Flex vertical gap={token.marginXS} style={{ minWidth: 0, flex: "1 1 320px" }}>
                <Space size={token.marginXS} wrap>
                  <Tag color={GASTO_ESTADO_COLOR[gasto.estado]} style={{ margin: 0 }}>
                    {GASTO_ESTADO_LABEL[gasto.estado]}
                  </Tag>
                  <Tag style={{ margin: 0 }}>
                    {GASTO_TIPO_LABEL[gasto.tipo]}
                    {gasto.tipo === "EXPENSA" && gasto.periodo && ` de ${dayjs(gasto.periodo, "YYYY-MM").format("MM/YYYY")}`}
                  </Tag>
                </Space>
                <Typography.Title level={3} style={{ margin: 0 }}>
                  {gasto.descripcion}
                </Typography.Title>
                <Typography.Text type="secondary">
                  <HomeOutlined /> {gasto.unidad.bloque.edificio.nombre} · {gasto.unidad.bloque.nombre} ·{" "}
                  {gasto.unidad.numero}
                </Typography.Text>
              </Flex>
              <Flex vertical align="flex-end" gap={token.margin}>
                <Flex gap={token.marginXL} wrap justify="flex-end">
                  <Statistic title="Monto" value={formatMonto(gasto.monto)} style={{ textAlign: "right" }} />
                  {compra && compra.estado === "REGISTRADO" && (
                    <Statistic
                      title="Saldo pendiente"
                      value={formatMonto(compra.saldo)}
                      valueStyle={{ color: Number(compra.saldo) > 0 ? token.colorWarning : token.colorSuccess }}
                      style={{ textAlign: "right" }}
                    />
                  )}
                </Flex>
                {compra && compra.estado === "REGISTRADO" && (
                  <Flex vertical style={{ width: "100%" }}>
                    <Progress
                      percent={
                        Number(compra.total) > 0
                          ? Math.round(((Number(compra.total) - Number(compra.saldo)) / Number(compra.total)) * 100)
                          : 0
                      }
                      status={Number(compra.saldo) === 0 ? "success" : "normal"}
                      size="small"
                    />
                    <Typography.Text type="secondary" style={{ textAlign: "right" }}>
                      Pagado {formatMonto(Number(compra.total) - Number(compra.saldo))} de {formatMonto(compra.total)}
                    </Typography.Text>
                  </Flex>
                )}
                {puedeAnularEsteGasto && (
                  <Tooltip
                    title={
                      cargoFacturado
                        ? "No se puede anular: el cargo al inquilino ya está facturado. Revertí primero lo facturado."
                        : undefined
                    }
                  >
                    <Button danger icon={<StopOutlined />} disabled={cargoFacturado} onClick={() => setAnularAbierto(true)}>
                      Anular gasto
                    </Button>
                  </Tooltip>
                )}
              </Flex>
            </Flex>

            <Divider style={{ margin: 0 }} />

            <Descriptions
              layout="vertical"
              size="small"
              column={{ xs: 1, sm: 2, lg: 3, xl: 5 }}
              style={{ padding: token.paddingLG }}
              items={[
                {
                  key: "proveedor",
                  label: (
                    <Space>
                      <ShopOutlined />
                      Proveedor
                    </Space>
                  ),
                  children: gasto.proveedor.nombre,
                },
                {
                  key: "a_cargo_de",
                  label: (
                    <Space>
                      <UserOutlined />A cargo de
                    </Space>
                  ),
                  children: A_CARGO_DE_LABEL[gasto.a_cargo_de],
                },
                {
                  key: "fecha",
                  label: (
                    <Space>
                      <CalendarOutlined />
                      Fecha
                    </Space>
                  ),
                  children: dayjs(gasto.fecha).format("DD/MM/YYYY"),
                },
                {
                  key: "aprobacion",
                  label: (
                    <Space>
                      <CheckCircleOutlined />
                      Aprobación
                    </Space>
                  ),
                  children: gasto.fecha_aprobacion ? dayjs(gasto.fecha_aprobacion).format("DD/MM/YYYY HH:mm") : "—",
                },
                {
                  key: "aprobado_por",
                  label: (
                    <Space>
                      <UserOutlined />
                      Aprobado por
                    </Space>
                  ),
                  children: gasto.aprobado_por ? APROBADO_POR_LABEL[gasto.aprobado_por] : "—",
                },
              ]}
            />

            {(gasto.estado === "RECHAZADO" || gasto.estado === "ANULADO") && (
              <Alert
                type={gasto.estado === "RECHAZADO" ? "error" : "warning"}
                showIcon
                banner
                message={gasto.estado === "RECHAZADO" ? "Motivo de rechazo" : "Motivo de anulación"}
                description={gasto.estado === "RECHAZADO" ? gasto.motivo_rechazo : gasto.motivo_anulacion}
              />
            )}
          </Card>
        )}

        {gasto?.documento_compra_id ? (
          <CompraDetail
            compra={compra}
            puedeAnular={puedeAnularCompra}
            onAnulada={refetchTodo}
            avisoAnulacion={
              gasto.cargo && gasto.cargo.estado !== "ANULADO" ? (
                <Alert
                  type="info"
                  showIcon
                  style={{ marginBottom: 16 }}
                  message="El cargo al inquilino se mantiene. Si corresponde, anulalo desde Cargos."
                />
              ) : undefined
            }
            onEditar={puedeEditarFactura ? () => setEdicionAbierta(true) : undefined}
            accionesCuotas={
              compra && compra.estado === "REGISTRADO" && Number(compra.saldo) > 0 && puedeRegistrarPago ? (
                <Button type="primary" icon={<DollarOutlined />} onClick={() => setPagoAbierto(true)}>
                  Registrar pago
                </Button>
              ) : undefined
            }
          />
        ) : (
          gasto?.estado === "APROBADO" && (
            <Card
              variant="borderless"
              style={{ borderRadius: 16, boxShadow: token.boxShadowTertiary }}
              title={
                <Space>
                  <FileDoneOutlined />
                  Factura
                </Space>
              }
            >
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

        {gasto?.cargo && (
          <Card
            variant="borderless"
            style={{ borderRadius: 16, boxShadow: token.boxShadowTertiary }}
            title={
              <Space>
                <SolutionOutlined />
                Cargo al inquilino
              </Space>
            }
            extra={<Link to="/administrador/cargos">Ver en Cargos</Link>}
          >
            <Descriptions
              size="small"
              column={{ xs: 1, sm: 2, lg: 5 }}
              items={[
                { key: "tipo", label: "Tipo", children: CARGO_TIPO_LABEL[gasto.cargo.tipo] },
                { key: "monto", label: "Monto", children: formatMonto(gasto.cargo.monto) },
                { key: "saldo", label: "Saldo", children: formatMonto(gasto.cargo.saldo) },
                {
                  key: "vencimiento",
                  label: "Vencimiento",
                  children: dayjs(gasto.cargo.fecha_vencimiento).format("DD/MM/YYYY"),
                },
                {
                  key: "estado",
                  label: "Estado",
                  children: (
                    <Tag color={CARGO_ESTADO_COLOR[gasto.cargo.estado]}>{CARGO_ESTADO_LABEL[gasto.cargo.estado]}</Tag>
                  ),
                },
              ]}
            />
          </Card>
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
      {edicionAbierta && gasto && compra && (
        <RegistrarFacturaModal
          gasto={gasto}
          compra={compra}
          onClose={() => setEdicionAbierta(false)}
          onSuccess={() => {
            setEdicionAbierta(false);
            refetchTodo();
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
