import { useEffect, useState } from "react";
import { FilePdfOutlined, FundOutlined } from "@ant-design/icons";
import { List, useSelect } from "@refinedev/antd";
import { usePermissions } from "@refinedev/core";
import { App, Button, Empty, Flex, Select, Space, Table, Tag, Typography } from "antd";
import dayjs from "dayjs";
import { Link } from "react-router";
import { FilterBar } from "../../components/filter-bar";
import { PageTitle } from "../../components/page-title";
import { columnasDeBaldes, MontoEnMoneda, PieDeTotales, type Moneda } from "../../components/reporte-de-antiguedad";
import { kyInstance } from "../../providers/data";
import { descargarArchivo } from "../../utils/descargar";
import type { CargoDeudor } from "../cargos/types";
import {
  armarEtiquetaDeMarca,
  armarTextoDeDocumentos,
  formatearOrigen,
  nombreDelPdfDeCuentasPorCobrar,
  rutaDelPdfDeCuentasPorCobrar,
} from "./helpers";
import {
  type CuentasPorCobrarDeuda,
  type CuentasPorCobrarReporte,
  type FiltrosCuentasPorCobrar,
  type GrupoDeInquilino,
  type GrupoDePropietario,
} from "./types";

const FORMATO_FECHA = "DD/MM/YYYY";

const filtrarPorLabel = (input: string, option?: { label?: unknown }) =>
  String(option?.label ?? "")
    .toLowerCase()
    .includes(input.toLowerCase());

// Detalle de las deudas de un grupo. La del inquilino lleva Vence y Atraso; la del propietario no, porque no vence:
// se compensa al transferirle.
const DetalleDeDeudas = ({
  deudas,
  moneda,
  deudor,
  conVencimiento,
}: {
  deudas: CuentasPorCobrarDeuda[];
  moneda: Moneda;
  deudor: CargoDeudor;
  conVencimiento: boolean;
}) => (
  <Table<CuentasPorCobrarDeuda>
    size="small"
    pagination={false}
    dataSource={deudas}
    rowKey={(deuda) => `${deuda.tipo}-${deuda.cargo_id ?? deuda.documentos.numeros.join("-")}-${deuda.fecha_origen}`}
    scroll={{ x: "max-content" }}
  >
    <Table.Column
      title="Concepto"
      dataIndex="concepto"
      render={(concepto: string, deuda: CuentasPorCobrarDeuda) => (
        <Space size={4} wrap>
          <span>{concepto}</span>
          {deuda.marca && (
            <Tag color={deuda.marca === "FACTURA_ANULADA" ? "orange" : "gold"}>{armarEtiquetaDeMarca(deuda.marca, deudor)}</Tag>
          )}
        </Space>
      )}
    />
    <Table.Column
      title="Origen"
      render={(_: unknown, deuda: CuentasPorCobrarDeuda) =>
        conVencimiento ? formatearOrigen(deuda.periodo, deuda.fecha_origen) : dayjs(deuda.fecha_origen).format(FORMATO_FECHA)
      }
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
      render={(_: unknown, deuda: CuentasPorCobrarDeuda) => armarTextoDeDocumentos(deuda.documentos)}
    />
  </Table>
);

// Reporte de cuentas por cobrar: lo que la administradora tiene para cobrar a hoy, de los inquilinos (por contrato) y
// de los propietarios (hasta compensarles al transferir). Solo lectura: sin filtro de fechas, el saldo es siempre el
// de hoy y el período lo dan las columnas de antigüedad.
export const CuentasPorCobrarList = () => {
  const { message } = App.useApp();
  const { data: permissions } = usePermissions<string[]>({});
  // El contrato y el propietario son enlaces solo si el usuario puede ver la pantalla a la que llevan.
  const puedeVerCargos = permissions?.includes("cargos.ver") ?? false;
  const puedeVerCuenta = permissions?.includes("cuenta_corriente.ver") ?? false;

  const [filtros, setFiltros] = useState<FiltrosCuentasPorCobrar>({});
  const [reporte, setReporte] = useState<CuentasPorCobrarReporte>();
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
      .get("reportes/cuentas-por-cobrar", { searchParams })
      .json<CuentasPorCobrarReporte>()
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
      await descargarArchivo(rutaDelPdfDeCuentasPorCobrar(filtros), nombreDelPdfDeCuentasPorCobrar(hoy));
    } catch (error) {
      message.error((error as { message?: string }).message ?? "No se pudo descargar el PDF.");
    } finally {
      setDescargando(false);
    }
  };

  const totales = reporte?.totales ?? [];

  return (
    <List
      title={<PageTitle icon={<FundOutlined />}>Cuentas por cobrar</PageTitle>}
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

      <Typography.Title level={4}>Inquilinos</Typography.Title>
      <Table<GrupoDeInquilino>
        loading={cargando}
        dataSource={reporte?.inquilinos ?? []}
        rowKey="clave"
        pagination={false}
        scroll={{ x: "max-content" }}
        locale={{ emptyText: <Empty description="Sin deudas de inquilinos" /> }}
        summary={() => <PieDeTotales totales={totales} lado="inquilinos" columnasAntes={2} />}
        expandable={{
          expandedRowRender: (grupo) => (
            <DetalleDeDeudas deudas={grupo.deudas} moneda={grupo.moneda} deudor="INQUILINO" conVencimiento />
          ),
        }}
        columns={[
          {
            title: "Inquilino",
            key: "persona",
            render: (_: unknown, grupo: GrupoDeInquilino) => (
              <>
                <div>{grupo.persona.nombre}</div>
                <Typography.Text type="secondary">{grupo.persona.documento}</Typography.Text>
              </>
            ),
          },
          {
            title: "Contrato",
            key: "contrato",
            render: (_: unknown, grupo: GrupoDeInquilino) => (
              <>
                <div>
                  {puedeVerCargos ? (
                    <Link to={`/administrador/cargos?contrato_id=${grupo.contrato.id}`}>{grupo.contrato.unidad}</Link>
                  ) : (
                    grupo.contrato.unidad
                  )}
                </div>
                <Typography.Text type="secondary">
                  {dayjs(grupo.contrato.fecha_inicio).format(FORMATO_FECHA)} → {dayjs(grupo.contrato.fecha_fin).format(FORMATO_FECHA)}
                </Typography.Text>
              </>
            ),
          },
          ...columnasDeBaldes<GrupoDeInquilino>(
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
        locale={{ emptyText: <Empty description="Sin deudas de propietarios" /> }}
        summary={() => <PieDeTotales totales={totales} lado="propietarios" columnasAntes={2} />}
        expandable={{
          expandedRowRender: (grupo) => (
            <DetalleDeDeudas deudas={grupo.deudas} moneda={grupo.moneda} deudor="PROPIETARIO" conVencimiento={false} />
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
