import { useEffect, useState, type ReactNode } from "react";
import { FilePdfOutlined, LineChartOutlined } from "@ant-design/icons";
import { List } from "@refinedev/antd";
import { usePermissions } from "@refinedev/core";
import { App, Button, DatePicker, Empty, Space, Table, Tag, Typography } from "antd";
import type { ColumnsType } from "antd/es/table";
import type { Dayjs } from "dayjs";
import { Link } from "react-router";
import { FilterBar } from "../../components/filter-bar";
import { PageTitle } from "../../components/page-title";
import { MontoEnMoneda, type Moneda } from "../../components/reporte-de-antiguedad";
import { kyInstance } from "../../providers/data";
import { descargarArchivo } from "../../utils/descargar";
import {
  armarFilasDeResumen,
  armarTextoDeAnulado,
  armarTextoDeQueSeAnulo,
  formatearFecha,
  formatearParaApi,
  nombreDelPdfDeIngresosEgresos,
  obtenerPeriodoPorDefecto,
  rutaDelPdfDeIngresosEgresos,
} from "./helpers";
import type {
  CategoriaDelReporte,
  FilaDeResumen,
  IngresosEgresosReporte,
  MonedaDelReporte,
  MovimientoDelReporte,
  PermisosDeEnlaces,
} from "./types";

const FORMATO_FECHA = "DD/MM/YYYY";

// Muestra el texto como link si el usuario puede ver la pantalla a la que lleva; si no, como texto plano.
const EnlaceSiPuede = ({ puede, to, children }: { puede: boolean; to: string; children: ReactNode }) => {
  if (puede) {
    return <Link to={to}>{children}</Link>;
  }

  return <>{children}</>;
};

// Marca un movimiento que hoy está anulado; el que no lo está no lleva nada.
const TagDeAnulado = ({ anuladoEl }: { anuladoEl: string | null }) => {
  if (anuladoEl === null) {
    return null;
  }

  return <Tag color="red">{armarTextoDeAnulado(anuladoEl)}</Tag>;
};

// Arma las columnas que comparten todas las categorías: la fecha al principio y, al final, el fondo y el monto.
const columnaDeFecha = (titulo: string): ColumnsType<MovimientoDelReporte>[number] => ({
  title: titulo,
  dataIndex: "fecha",
  render: (fecha: string) => formatearFecha(fecha),
});

const columnaDeFondo: ColumnsType<MovimientoDelReporte>[number] = {
  title: "Fondo",
  key: "fondo",
  render: (_: unknown, movimiento) => movimiento.fondo.nombre,
};

const columnaDeMedioDePago: ColumnsType<MovimientoDelReporte>[number] = {
  title: "Medio de pago",
  dataIndex: "medio_pago",
  render: (medio: string | null) => medio ?? "—",
};

const armarColumnaDeMonto = (moneda: Moneda): ColumnsType<MovimientoDelReporte>[number] => ({
  title: "Monto",
  dataIndex: "monto",
  align: "right",
  render: (monto: string) => <MontoEnMoneda monto={monto} moneda={moneda} />,
});

// Arma las columnas del detalle de una categoría, cada una con las suyas.
const armarColumnasDeCategoria = (
  categoria: CategoriaDelReporte,
  moneda: Moneda,
  permisos: PermisosDeEnlaces,
): ColumnsType<MovimientoDelReporte> => {
  const monto = armarColumnaDeMonto(moneda);

  // Cobros: el recibo, el inquilino y el concepto del cobro.
  if (categoria.clave === "COBROS") {
    return [
      columnaDeFecha("Fecha"),
      {
        title: "Recibo",
        key: "recibo",
        render: (_: unknown, movimiento) => (
          <Space size={4} wrap>
            <EnlaceSiPuede puede={permisos.puedeVerCobros} to={`/administrador/cobros/show/${movimiento.cobro_cliente_id}`}>
              {movimiento.numero}
            </EnlaceSiPuede>
            <TagDeAnulado anuladoEl={movimiento.anulado_el} />
          </Space>
        ),
      },
      { title: "Inquilino", key: "persona", render: (_: unknown, movimiento) => movimiento.persona?.nombre ?? "—" },
      { title: "Concepto", dataIndex: "concepto" },
      columnaDeFondo,
      columnaDeMedioDePago,
      monto,
    ];
  }

  // Pagos a proveedores: el pago, el proveedor y el concepto.
  if (categoria.clave === "PAGOS_PROVEEDORES") {
    return [
      columnaDeFecha("Fecha"),
      {
        title: "Pago",
        key: "pago",
        render: (_: unknown, movimiento) => (
          <Space size={4} wrap>
            <EnlaceSiPuede puede={permisos.puedeVerPagos} to={`/administrador/pagos-proveedor/show/${movimiento.pago_proveedor_id}`}>
              {movimiento.numero}
            </EnlaceSiPuede>
            <TagDeAnulado anuladoEl={movimiento.anulado_el} />
          </Space>
        ),
      },
      { title: "Proveedor", key: "persona", render: (_: unknown, movimiento) => movimiento.persona?.nombre ?? "—" },
      { title: "Concepto", dataIndex: "concepto" },
      columnaDeFondo,
      columnaDeMedioDePago,
      monto,
    ];
  }

  // Transferencias: el pago y el propietario, que lleva a su cuenta corriente.
  if (categoria.clave === "TRANSFERENCIAS_PROPIETARIOS") {
    return [
      columnaDeFecha("Fecha"),
      {
        title: "Pago",
        key: "pago",
        render: (_: unknown, movimiento) => (
          <Space size={4} wrap>
            <EnlaceSiPuede puede={permisos.puedeVerPagos} to={`/administrador/pagos-proveedor/show/${movimiento.pago_proveedor_id}`}>
              {movimiento.numero}
            </EnlaceSiPuede>
            <TagDeAnulado anuladoEl={movimiento.anulado_el} />
          </Space>
        ),
      },
      {
        title: "Propietario",
        key: "persona",
        render: (_: unknown, movimiento) => {
          if (!movimiento.persona) {
            return "—";
          }

          return (
            <EnlaceSiPuede puede={permisos.puedeVerCuenta} to={`/administrador/cuentas-corrientes/show/${movimiento.persona.id}`}>
              {movimiento.persona.nombre}
            </EnlaceSiPuede>
          );
        },
      },
      columnaDeFondo,
      columnaDeMedioDePago,
      monto,
    ];
  }

  // Anulaciones: la fecha es la de la anulación, y dice qué se anuló y por qué.
  if (categoria.clave === "ANULACIONES") {
    return [
      columnaDeFecha("Fecha de la anulación"),
      { title: "Qué se anuló", key: "que", render: (_: unknown, movimiento) => armarTextoDeQueSeAnulo(movimiento) },
      { title: "Persona", key: "persona", render: (_: unknown, movimiento) => movimiento.persona?.nombre ?? "—" },
      { title: "Motivo", dataIndex: "motivo" },
      columnaDeFondo,
      monto,
    ];
  }

  // Otros movimientos: solo el concepto, con su signo.
  return [
    columnaDeFecha("Fecha"),
    {
      title: "Concepto",
      key: "concepto",
      render: (_: unknown, movimiento) => (
        <Space size={4} wrap>
          <span>{movimiento.concepto}</span>
          <TagDeAnulado anuladoEl={movimiento.anulado_el} />
        </Space>
      ),
    },
    columnaDeFondo,
    monto,
  ];
};

// Detalle de una categoría: sus movimientos, del más viejo al más nuevo.
const DetalleDeCategoria = ({
  categoria,
  moneda,
  permisos,
}: {
  categoria: CategoriaDelReporte;
  moneda: Moneda;
  permisos: PermisosDeEnlaces;
}) => (
  <Table<MovimientoDelReporte>
    size="small"
    pagination={false}
    dataSource={categoria.movimientos}
    rowKey="movimiento_id"
    scroll={{ x: "max-content" }}
    columns={armarColumnasDeCategoria(categoria, moneda, permisos)}
  />
);

// Resumen de una moneda: el saldo inicial, el total de cada categoría (que se despliega en sus movimientos), el neto
// del período y el saldo final.
const ResumenDeMoneda = ({
  bloque,
  desde,
  hasta,
  cargando,
  permisos,
}: {
  bloque: MonedaDelReporte;
  desde: string;
  hasta: string;
  cargando: boolean;
  permisos: PermisosDeEnlaces;
}) => (
  <>
    <Typography.Title level={4}>Resumen ({bloque.moneda.codigo})</Typography.Title>
    <Table<FilaDeResumen>
      loading={cargando}
      showHeader={false}
      pagination={false}
      dataSource={armarFilasDeResumen(bloque, desde, hasta)}
      rowKey="key"
      scroll={{ x: "max-content" }}
      locale={{ emptyText: <Empty description="Sin movimientos" /> }}
      expandable={{
        rowExpandable: (fila) => (fila.categoria?.movimientos.length ?? 0) > 0,
        expandedRowRender: (fila) =>
          fila.categoria ? <DetalleDeCategoria categoria={fila.categoria} moneda={bloque.moneda} permisos={permisos} /> : null,
      }}
      columns={[
        {
          title: "Concepto",
          dataIndex: "etiqueta",
          render: (etiqueta: string, fila) => <Typography.Text strong={fila.tipo !== "CATEGORIA"}>{etiqueta}</Typography.Text>,
        },
        {
          title: "Monto",
          dataIndex: "monto",
          align: "right",
          render: (monto: string, fila) => <MontoEnMoneda fuerte={fila.tipo !== "CATEGORIA"} monto={monto} moneda={bloque.moneda} />,
        },
      ]}
    />
  </>
);

// Reporte de ingresos vs. egresos: la plata que entró y salió de los fondos (caja y bancos) en un período, con el
// saldo al empezar, el neto y el saldo al terminar. Solo lectura. Filtra solo por período: los fondos son de la
// administradora, no de una unidad.
export const IngresosEgresosList = () => {
  const { message } = App.useApp();
  const { data: permissions } = usePermissions<string[]>({});
  // Los números y el propietario son enlaces solo si el usuario puede ver la pantalla a la que llevan.
  const permisos: PermisosDeEnlaces = {
    puedeVerCobros: permissions?.includes("cobros.ver") ?? false,
    puedeVerPagos: permissions?.includes("pagos.ver") ?? false,
    puedeVerCuenta: permissions?.includes("cuenta_corriente.ver") ?? false,
  };

  const [periodo, setPeriodo] = useState<[Dayjs, Dayjs]>(() => obtenerPeriodoPorDefecto());
  const [reporte, setReporte] = useState<IngresosEgresosReporte>();
  const [cargando, setCargando] = useState(true);
  const [descargando, setDescargando] = useState(false);

  const desde = formatearParaApi(periodo[0]);
  const hasta = formatearParaApi(periodo[1]);

  // Pedir el reporte con kyInstance, porque no es un listado de recursos paginado.
  useEffect(() => {
    let vigente = true;
    setCargando(true);

    kyInstance
      .get("reportes/ingresos-egresos", { searchParams: { desde, hasta } })
      .json<IngresosEgresosReporte>()
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
  }, [desde, hasta, message]);

  // Descargar el PDF con el período elegido, o mostrar por qué no se pudo.
  const descargarPdf = async () => {
    setDescargando(true);
    try {
      await descargarArchivo(rutaDelPdfDeIngresosEgresos(desde, hasta), nombreDelPdfDeIngresosEgresos(desde, hasta));
    } catch (error) {
      message.error((error as { message?: string }).message ?? "No se pudo descargar el PDF.");
    } finally {
      setDescargando(false);
    }
  };

  return (
    <List
      title={<PageTitle icon={<LineChartOutlined />}>Ingresos vs. egresos</PageTitle>}
      headerButtons={() => (
        <Button icon={<FilePdfOutlined />} loading={descargando} onClick={descargarPdf}>
          Descargar PDF
        </Button>
      )}
    >
      <FilterBar>
        <Space>
          <span>Período</span>
          <DatePicker.RangePicker
            allowClear={false}
            format={FORMATO_FECHA}
            value={periodo}
            onChange={(fechas) => {
              // Ignorar un cambio sin las dos fechas: el período siempre tiene desde y hasta.
              if (fechas?.[0] && fechas[1]) {
                setPeriodo([fechas[0], fechas[1]]);
              }
            }}
          />
        </Space>
      </FilterBar>

      {(reporte?.monedas ?? []).map((bloque) => (
        <ResumenDeMoneda
          key={bloque.moneda.id}
          bloque={bloque}
          desde={reporte?.desde ?? desde}
          hasta={reporte?.hasta ?? hasta}
          cargando={cargando}
          permisos={permisos}
        />
      ))}
    </List>
  );
};
