import { useEffect, useState } from "react";
import { FilePdfOutlined, PayCircleOutlined } from "@ant-design/icons";
import { List, useSelect } from "@refinedev/antd";
import { usePermissions } from "@refinedev/core";
import { App, Button, Empty, Flex, Select, Space, Table, Typography } from "antd";
import dayjs from "dayjs";
import { Link } from "react-router";
import { FilterBar } from "../../components/filter-bar";
import { PageTitle } from "../../components/page-title";
import { columnasDeBaldes, MontoEnMoneda, PieDeTotales, type Moneda } from "../../components/reporte-de-antiguedad";
import { kyInstance } from "../../providers/data";
import { descargarArchivo } from "../../utils/descargar";
import {
  armarAvisoDeTransferencias,
  armarEnlaceDelDocumento,
  armarTextoDeDocumento,
  nombreDelPdfDeCuentasPorPagar,
  rutaDelPdfDeCuentasPorPagar,
} from "./helpers";
import type {
  CuentasPorPagarDeuda,
  CuentasPorPagarReporte,
  FiltrosCuentasPorPagar,
  GrupoDePropietario,
  GrupoDeProveedor,
  PermisosDeEnlaces,
} from "./types";

const FORMATO_FECHA = "DD/MM/YYYY";

const filtrarPorLabel = (input: string, option?: { label?: unknown }) =>
  String(option?.label ?? "")
    .toLowerCase()
    .includes(input.toLowerCase());

// Detalle de las deudas de un grupo. La del proveedor lleva Unidad, Vence y Atraso (los de su cuota); la del
// propietario no, porque su alquiler se paga al transferirle y no vence.
const DetalleDeDeudas = ({
  deudas,
  moneda,
  conVencimiento,
  permisos,
}: {
  deudas: CuentasPorPagarDeuda[];
  moneda: Moneda;
  conVencimiento: boolean;
  permisos: PermisosDeEnlaces;
}) => (
  <Table<CuentasPorPagarDeuda>
    size="small"
    pagination={false}
    dataSource={deudas}
    rowKey={(deuda) => `${deuda.tipo}-${deuda.cargo_id ?? deuda.pago_proveedor_id ?? deuda.gasto_id ?? ""}-${deuda.concepto}`}
    scroll={{ x: "max-content" }}
  >
    <Table.Column title="Concepto" dataIndex="concepto" />
    {conVencimiento && (
      <Table.Column
        title="Unidad"
        dataIndex="unidades"
        render={(unidades: string[]) => (unidades.length === 0 ? "—" : unidades.join(", "))}
      />
    )}
    <Table.Column
      title={conVencimiento ? "Fecha" : "Origen"}
      dataIndex="fecha_origen"
      render={(fecha: string) => dayjs(fecha).format(FORMATO_FECHA)}
    />
    {conVencimiento && (
      <Table.Column
        title="Vence"
        dataIndex="vence"
        render={(vence: string | null) => (vence ? dayjs(vence).format(FORMATO_FECHA) : "—")}
      />
    )}
    <Table.Column
      title="Monto"
      dataIndex="monto"
      align="right"
      render={(monto: string) => <MontoEnMoneda monto={monto} moneda={moneda} />}
    />
    <Table.Column
      title="Pendiente"
      dataIndex="pendiente"
      align="right"
      render={(pendiente: string) => <MontoEnMoneda fuerte monto={pendiente} moneda={moneda} />}
    />
    {conVencimiento && (
      <Table.Column
        title="Atraso"
        dataIndex="atraso"
        align="right"
        render={(atraso: number | null) => (atraso === null ? "—" : `${atraso} días`)}
      />
    )}
    <Table.Column
      title="Documento"
      render={(_: unknown, deuda: CuentasPorPagarDeuda) => {
        const texto = armarTextoDeDocumento(deuda);
        const enlace = armarEnlaceDelDocumento(deuda, permisos);

        return enlace ? <Link to={enlace}>{texto}</Link> : texto;
      }}
    />
  </Table>
);

// Reporte de cuentas por pagar: lo que la administradora tiene para pagar a hoy, a los proveedores (por sus facturas)
// y a los propietarios (el alquiler entero, hasta pagárselo). Solo lectura: sin filtro de fechas, el saldo es siempre
// el de hoy y el período lo dan las columnas de antigüedad.
export const CuentasPorPagarList = () => {
  const { message } = App.useApp();
  const { data: permissions } = usePermissions<string[]>({});
  // Los links son enlaces solo si el usuario puede ver la pantalla a la que llevan.
  const puedeVerGastos = permissions?.includes("gastos.ver") ?? false;
  const puedeVerPagos = permissions?.includes("pagos.ver") ?? false;
  const puedeVerCuenta = permissions?.includes("cuenta_corriente.ver") ?? false;
  const permisos: PermisosDeEnlaces = { puedeVerGastos, puedeVerPagos };

  const [filtros, setFiltros] = useState<FiltrosCuentasPorPagar>({});
  const [reporte, setReporte] = useState<CuentasPorPagarReporte>();
  const [cargando, setCargando] = useState(true);
  const [descargando, setDescargando] = useState(false);

  const { selectProps: edificioSelectProps } = useSelect({
    resource: "edificios",
    optionLabel: "nombre",
    optionValue: "id",
  });

  const { selectProps: unidadSelectProps } = useSelect<{ id: number; numero: string; bloque: { nombre: string } }>({
    resource: "unidades",
    optionLabel: (unidad) => `${unidad.bloque.nombre} - ${unidad.numero}`,
    optionValue: "id",
    filters: filtros.edificioId ? [{ field: "edificio_id", operator: "eq", value: filtros.edificioId }] : [],
  });

  // Pedir el reporte con kyInstance, porque no es un listado de recursos paginado.
  useEffect(() => {
    let vigente = true;
    setCargando(true);

    const searchParams: Record<string, number> = {};

    if (filtros.edificioId) {
      searchParams.edificio_id = filtros.edificioId;
    }

    if (filtros.unidadId) {
      searchParams.unidad_id = filtros.unidadId;
    }

    kyInstance
      .get("reportes/cuentas-por-pagar", { searchParams })
      .json<CuentasPorPagarReporte>()
      .then((datos) => vigente && setReporte(datos))
      .catch((error: { message?: string }) => {
        // Los GET fallidos se rechazan con el mensaje del servidor (ver providers/data.ts).
        if (vigente) {
          message.error(error.message ?? "No se pudo cargar el reporte.");
        }
      })
      .finally(() => vigente && setCargando(false));

    return () => {
      vigente = false;
    };
  }, [filtros, message]);

  // Descargar el PDF con los filtros activos, o mostrar por qué no se pudo.
  const descargarPdf = async () => {
    setDescargando(true);
    try {
      const hoy = reporte?.saldo_al ?? dayjs().format("YYYY-MM-DD");
      await descargarArchivo(rutaDelPdfDeCuentasPorPagar(filtros), nombreDelPdfDeCuentasPorPagar(hoy));
    } catch (error) {
      message.error((error as { message?: string }).message ?? "No se pudo descargar el PDF.");
    } finally {
      setDescargando(false);
    }
  };

  const totales = reporte?.totales ?? [];

  return (
    <List
      title={<PageTitle icon={<PayCircleOutlined />}>Cuentas por pagar</PageTitle>}
      headerButtons={() => (
        <Button icon={<FilePdfOutlined />} loading={descargando} onClick={descargarPdf}>
          Descargar PDF
        </Button>
      )}
    >
      <Flex justify="space-between" align="flex-start" wrap gap={8}>
        <FilterBar>
          <Space>
            <span>Edificio</span>
            <Select
              options={edificioSelectProps.options}
              loading={edificioSelectProps.loading}
              style={{ minWidth: 180 }}
              allowClear
              placeholder="Todos"
              value={filtros.edificioId}
              onChange={(value) => setFiltros({ edificioId: value, unidadId: undefined })}
            />
          </Space>
          <Space>
            <span>Unidad</span>
            <Select
              options={unidadSelectProps.options}
              loading={unidadSelectProps.loading}
              filterOption={filtrarPorLabel}
              showSearch
              style={{ minWidth: 160 }}
              allowClear
              placeholder="Todas"
              value={filtros.unidadId}
              onChange={(value) => setFiltros({ ...filtros, unidadId: value })}
            />
          </Space>
        </FilterBar>
        {reporte && <Typography.Text strong>Saldo al {dayjs(reporte.saldo_al).format(FORMATO_FECHA)}</Typography.Text>}
      </Flex>

      <Typography.Title level={4}>Proveedores</Typography.Title>
      <Table<GrupoDeProveedor>
        loading={cargando}
        dataSource={reporte?.proveedores ?? []}
        rowKey="clave"
        pagination={false}
        scroll={{ x: "max-content" }}
        locale={{ emptyText: <Empty description="Sin deudas con proveedores" /> }}
        summary={() => <PieDeTotales totales={totales} lado="proveedores" columnasAntes={2} />}
        expandable={{
          expandedRowRender: (grupo) => <DetalleDeDeudas deudas={grupo.deudas} moneda={grupo.moneda} conVencimiento permisos={permisos} />,
        }}
        columns={[
          {
            title: "Proveedor",
            key: "proveedor",
            render: (_: unknown, grupo: GrupoDeProveedor) => (
              <>
                <div>{grupo.proveedor.nombre}</div>
                <Typography.Text type="secondary">{grupo.proveedor.documento}</Typography.Text>
              </>
            ),
          },
          {
            title: "Unidades",
            key: "unidades",
            render: (_: unknown, grupo: GrupoDeProveedor) => (grupo.unidades.length === 0 ? "—" : grupo.unidades.join(", ")),
          },
          ...columnasDeBaldes<GrupoDeProveedor>(
            (grupo) => grupo.moneda,
            (grupo) => grupo.baldes,
            (grupo) => grupo.total,
          ),
        ]}
      />

      <Typography.Title level={4} style={{ marginTop: 32 }}>
        Propietarios
      </Typography.Title>
      <Table<GrupoDePropietario>
        loading={cargando}
        dataSource={reporte?.propietarios ?? []}
        rowKey="clave"
        pagination={false}
        scroll={{ x: "max-content" }}
        locale={{ emptyText: <Empty description="Sin deudas con propietarios" /> }}
        summary={() => <PieDeTotales totales={totales} lado="propietarios" columnasAntes={2} />}
        expandable={{
          expandedRowRender: (grupo) => (
            <>
              <DetalleDeDeudas deudas={grupo.deudas} moneda={grupo.moneda} conVencimiento={false} permisos={permisos} />
              {/* Avisar la plata ya transferida que el filtro no puede mostrar porque no es de una unidad. */}
              {grupo.transferencias_fuera_del_filtro !== null && (
                <Typography.Text type="secondary" style={{ display: "block", marginTop: 8 }}>
                  {armarAvisoDeTransferencias(grupo.transferencias_fuera_del_filtro, grupo.moneda)}
                </Typography.Text>
              )}
            </>
          ),
        }}
        columns={[
          {
            title: "Propietario",
            key: "propietario",
            render: (_: unknown, grupo: GrupoDePropietario) => (
              <>
                <div>
                  {puedeVerCuenta ? (
                    <Link to={`/administrador/cuentas-corrientes/show/${grupo.propietario.id}`}>{grupo.propietario.nombre}</Link>
                  ) : (
                    grupo.propietario.nombre
                  )}
                </div>
                <Typography.Text type="secondary">{grupo.propietario.documento}</Typography.Text>
              </>
            ),
          },
          {
            title: "Unidades",
            key: "unidades",
            render: (_: unknown, grupo: GrupoDePropietario) => grupo.unidades.join(", "),
          },
          ...columnasDeBaldes<GrupoDePropietario>(
            (grupo) => grupo.moneda,
            (grupo) => grupo.baldes,
            (grupo) => grupo.total,
          ),
        ]}
      />
    </List>
  );
};
