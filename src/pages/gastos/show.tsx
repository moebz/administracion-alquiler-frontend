import { useState } from "react";
import { EditButton, Show } from "@refinedev/antd";
import { useOne, usePermissions, useShow } from "@refinedev/core";
import {
  CalendarOutlined,
  CheckCircleOutlined,
  DollarOutlined,
  EditOutlined,
  FileDoneOutlined,
  HomeOutlined,
  NodeIndexOutlined,
  RedoOutlined,
  ShopOutlined,
  SolutionOutlined,
  StopOutlined,
  UserOutlined,
} from "@ant-design/icons";
import {
  Alert,
  App,
  Button,
  Card,
  Descriptions,
  Divider,
  Empty,
  Flex,
  Progress,
  Space,
  Statistic,
  Table,
  Tag,
  theme,
  Tooltip,
  Typography,
} from "antd";
import dayjs from "dayjs";
import { Link } from "react-router";
import { CargoMarcaTag } from "../cargos/cargo-marca-tag";
import { ReapuntarCargoModal } from "../cargos/reapuntar-cargo-modal";
import { extractErrorMessage } from "../../providers/auth";
import { kyInstance } from "../../providers/data";
import { CARGO_DEUDOR_AL, CARGO_ESTADO_COLOR, CARGO_ESTADO_LABEL, CARGO_TIPO_LABEL, type CargoDeudor } from "../cargos/types";
import { CompraDetail } from "../compras/compra-detail";
import type { CompraRow } from "../compras/types";
import { formatMonto } from "../../utils/monto";
import { AnularGastoModal } from "./anular-gasto-modal";
import { EditarMontoModal } from "./editar-monto-modal";
import { RegistrarFacturaModal } from "./registrar-factura-modal";
import { RegistrarPagoModal } from "./registrar-pago-modal";
import {
  A_CARGO_DE_LABEL,
  APROBADO_POR_LABEL,
  GASTO_ESTADO_COLOR,
  GASTO_ESTADO_LABEL,
  GASTO_TIPO_LABEL,
  REINTEGRO_COLOR,
  REINTEGRO_LABEL,
  type CargoGasto,
  type GastoRow,
} from "./types";

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
  // Rehacer cargos y editar el monto van con el permiso del lado gasto de registrar la factura del proveedor.
  const puedeGestionarFactura = permissions?.includes("gastos.registrar_pago") ?? false;
  const puedeReapuntar = permissions?.includes("cargos.reapuntar") ?? false;
  const { message, modal } = App.useApp();

  const [facturaAbierta, setFacturaAbierta] = useState(false);
  const [edicionAbierta, setEdicionAbierta] = useState(false);
  const [pagoAbierto, setPagoAbierto] = useState(false);
  const [anularAbierto, setAnularAbierto] = useState(false);
  const [montoAbierto, setMontoAbierto] = useState(false);
  const [reapuntando, setReapuntando] = useState<CargoGasto | null>(null);

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
  const cargosActivos = gasto?.cargos.filter((cargo) => cargo.estado !== "ANULADO") ?? [];
  const cargoFacturado = cargosActivos.some((cargo) => Number(cargo.facturado) > 0);
  // Los cargos de un gasto son al propietario o al inquilino según a cargo de quién esté.
  const deudor: CargoDeudor = gasto?.a_cargo_de === "PROPIETARIO" ? "PROPIETARIO" : "INQUILINO";
  // El monto se edita en un gasto APROBADO sin factura vigente del proveedor, hasta lo aprobado.
  const puedeEditarMonto = puedeGestionarFactura && gasto?.estado === "APROBADO" && !gasto.documento_compra_id;
  const reintegro = gasto?.reintegro;
  const conReintegro = reintegro && ["PENDIENTE", "PARCIAL", "REINTEGRADO"].includes(reintegro.estado);

  // Confirmar cuántos cargos se anulan y cuántos se crean antes de rehacer.
  const rehacerCargos = () => {
    const plan = gasto?.rehacer_cargos;
    if (!gasto || !plan) return;

    modal.confirm({
      title: "¿Rehacer los cargos con la factura vigente del proveedor?",
      content: `Se ${plan.cargos === 1 ? "anula el cargo" : `anulan los ${plan.cargos} cargos`} con la marca "Factura anulada" y se ${plan.lineas === 1 ? "crea uno" : `crean ${plan.lineas}`} por las líneas de la factura que ningún cargo usa.`,
      okText: "Rehacer",
      cancelText: "Cancelar",
      onOk: async () => {
        const response = await kyInstance.post(`gastos/${gasto.id}/rehacer-cargos`);
        if (!response.ok) {
          message.error(await extractErrorMessage(response, "No se pudieron rehacer los cargos."));
          throw new Error("rehacer rechazado");
        }

        message.success("Cargos rehechos.");
        gastoQuery.refetch();
      },
    });
  };

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
                  <Tooltip title="Cuánto le devolvió el deudor a la administradora, aparte del pago al proveedor">
                    <Tag color={REINTEGRO_COLOR[gasto.reintegro.estado]} style={{ margin: 0 }}>
                      {REINTEGRO_LABEL[gasto.reintegro.estado]}
                    </Tag>
                  </Tooltip>
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
                  <Flex vertical align="flex-end">
                    <Statistic title="Monto" value={formatMonto(gasto.monto)} style={{ textAlign: "right" }} />
                    {/* Mostrar lo aprobado si el monto se editó después de aprobar. */}
                    {gasto.monto_aprobado !== null && Number(gasto.monto_aprobado) !== Number(gasto.monto) && (
                      <Typography.Text type="secondary">Aprobado por {formatMonto(gasto.monto_aprobado)}</Typography.Text>
                    )}
                    {puedeEditarMonto && (
                      <Button size="small" icon={<EditOutlined />} onClick={() => setMontoAbierto(true)} style={{ marginTop: 4 }}>
                        Editar monto
                      </Button>
                    )}
                  </Flex>
                  {compra && compra.estado === "REGISTRADO" && (
                    <Statistic
                      title="Saldo al proveedor"
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
                      Pagado al proveedor {formatMonto(Number(compra.total) - Number(compra.saldo))} de {formatMonto(compra.total)}
                    </Typography.Text>
                  </Flex>
                )}
                {/* Mostrar el reintegro aparte del pago al proveedor: van por caminos distintos. */}
                {reintegro && conReintegro && (
                  <Flex vertical style={{ width: "100%" }}>
                    <Progress
                      percent={Number(reintegro.base) > 0 ? Math.round((Number(reintegro.reintegrado) / Number(reintegro.base)) * 100) : 0}
                      status={reintegro.estado === "REINTEGRADO" ? "success" : "normal"}
                      size="small"
                    />
                    <Typography.Text type="secondary" style={{ textAlign: "right" }}>
                      Reintegrado {formatMonto(reintegro.reintegrado)} de {formatMonto(reintegro.base)}
                    </Typography.Text>
                  </Flex>
                )}
                {reintegro?.absorbido !== null && reintegro?.absorbido !== undefined && (
                  <Typography.Text type="secondary">Absorbido por la administradora {formatMonto(reintegro.absorbido)}</Typography.Text>
                )}
                {puedeAnularEsteGasto && (
                  <Tooltip
                    title={
                      cargoFacturado
                        ? `No se puede anular: un cargo ${CARGO_DEUDOR_AL[deudor]} ya está facturado. Revertí primero lo facturado.`
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
              cargosActivos.length > 0 ? (
                <Alert
                  type="info"
                  showIcon
                  style={{ marginBottom: 16 }}
                  message={`Los cargos ${CARGO_DEUDOR_AL[deudor]} quedan activos con la marca "Factura anulada" hasta que registres la factura de reemplazo.`}
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

        {gasto && gasto.cargos.length > 0 && (
          <Card
            variant="borderless"
            style={{ borderRadius: 16, boxShadow: token.boxShadowTertiary }}
            title={
              <Space>
                <SolutionOutlined />
                Cargos {CARGO_DEUDOR_AL[deudor]}
              </Space>
            }
            extra={
              <Space>
                {puedeGestionarFactura && gasto.rehacer_cargos && (
                  <Tooltip title={gasto.rehacer_cargos.habilitado ? undefined : 'Primero resolvé los cargos marcados "Revisar factura".'}>
                    <Button size="small" icon={<RedoOutlined />} disabled={!gasto.rehacer_cargos.habilitado} onClick={rehacerCargos}>
                      Rehacer cargos
                    </Button>
                  </Tooltip>
                )}
                <Link to={`/administrador/cargos?gasto_id=${gasto.id}&todos_los_estados=1`}>Ver en Cargos</Link>
              </Space>
            }
          >
            <Table<CargoGasto> dataSource={gasto.cargos} rowKey="id" size="small" pagination={false}>
              <Table.Column title="Descripción" dataIndex="descripcion" />
              <Table.Column title="Tipo" dataIndex="tipo" render={(tipo: CargoGasto["tipo"]) => CARGO_TIPO_LABEL[tipo]} />
              <Table.Column title="Monto" dataIndex="monto" render={(monto: CargoGasto["monto"]) => formatMonto(monto)} />
              <Table.Column title="IVA" dataIndex="tasa_iva" render={(tasa: CargoGasto["tasa_iva"]) => `${tasa}%`} />
              <Table.Column title="Facturado" dataIndex="facturado" render={(facturado: CargoGasto["facturado"]) => formatMonto(facturado)} />
              <Table.Column title="Cobrado" dataIndex="cobrado" render={(cobrado: CargoGasto["cobrado"]) => formatMonto(cobrado)} />
              <Table.Column title="Saldo" dataIndex="saldo" render={(saldo: CargoGasto["saldo"]) => formatMonto(saldo)} />
              {/* El cargo al propietario no tiene vencimiento. */}
              {deudor === "INQUILINO" && (
                <Table.Column
                  title="Vencimiento"
                  dataIndex="fecha_vencimiento"
                  render={(fecha: CargoGasto["fecha_vencimiento"]) => (fecha ? dayjs(fecha).format("DD/MM/YYYY") : "—")}
                />
              )}
              <Table.Column
                title="Estado"
                dataIndex="estado"
                render={(estado: CargoGasto["estado"], cargo: CargoGasto) => (
                  <Space size={4} wrap>
                    <Tag color={CARGO_ESTADO_COLOR[estado]} style={{ margin: 0 }}>
                      {CARGO_ESTADO_LABEL[estado]}
                    </Tag>
                    {cargo.marca && (
                      <CargoMarcaTag marca={cargo.marca} deudor={cargo.deudor} accion={cargo.accion_sugerida} tasaIva={cargo.tasa_iva} />
                    )}
                    {puedeReapuntar && (cargo.accion_sugerida?.candidatas.length ?? 0) > 0 && (
                      <Tooltip title="Reapuntar a la factura de reemplazo del proveedor">
                        <Button size="small" icon={<NodeIndexOutlined />} onClick={() => setReapuntando(cargo)} />
                      </Tooltip>
                    )}
                  </Space>
                )}
              />
            </Table>
          </Card>
        )}
      </Space>

      {facturaAbierta && gasto && (
        <RegistrarFacturaModal
          gasto={gasto}
          onClose={() => setFacturaAbierta(false)}
          onRefrescar={() => gastoQuery.refetch()}
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
      {montoAbierto && gasto && (
        <EditarMontoModal
          gasto={gasto}
          onClose={() => setMontoAbierto(false)}
          onSuccess={() => {
            setMontoAbierto(false);
            gastoQuery.refetch();
          }}
        />
      )}
      {reapuntando && (
        <ReapuntarCargoModal
          cargo={reapuntando}
          onClose={() => setReapuntando(null)}
          onSuccess={() => {
            setReapuntando(null);
            gastoQuery.refetch();
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
