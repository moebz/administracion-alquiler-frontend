import { useEffect, useState, type ReactNode } from "react";
import { HomeOutlined } from "@ant-design/icons";
import { List } from "@refinedev/antd";
import { usePermissions } from "@refinedev/core";
import { App, Card, Col, Empty, Row, Space, Statistic, theme, Typography } from "antd";
import dayjs from "dayjs";
import { Link } from "react-router";
import { PageTitle } from "../../components/page-title";
import { formatearMontoEnMoneda } from "../../components/reporte-de-antiguedad";
import { kyInstance } from "../../providers/data";
import {
  armarTextoDelPeriodo,
  armarTextoDeContratosMorosos,
  armarTextoDeMontos,
  armarTextoDeSolicitudes,
  armarTextoDeTerminados,
  armarTextoDeUnidades,
  armarTextoSinContratosPorTerminar,
  armarValorDeMorosidad,
  armarValorDeOcupacion,
  elegirMontosAMostrar,
  hayIndicadores,
} from "./helpers";
import type { ContratosPorTerminar, DashboardDatos, MontoPorMoneda } from "./types";

const FORMATO_FECHA = "DD/MM/YYYY";

// Tarjeta de un indicador: su título y, si el usuario puede ver la pantalla del detalle, el link a ella.
const Tarjeta = ({ titulo, enlace, children }: { titulo: string; enlace?: string; children: ReactNode }) => (
  <Col xs={24} md={12} xl={8}>
    <Card title={titulo} extra={enlace && <Link to={enlace}>Ver detalle</Link>} style={{ height: "100%" }}>
      {children}
    </Card>
  </Col>
);

// Un valor grande por moneda: la plata nunca se suma entre monedas distintas.
const MontosPorMoneda = ({ montos, resaltarNegativo = false }: { montos: MontoPorMoneda[]; resaltarNegativo?: boolean }) => {
  const { token } = theme.useToken();

  return (
    <>
      {elegirMontosAMostrar(montos).map((fila) => (
        <Statistic
          key={fila.moneda.id}
          value={formatearMontoEnMoneda(fila.monto, fila.moneda)}
          valueStyle={resaltarNegativo && Number(fila.monto) < 0 ? { color: token.colorError } : undefined}
        />
      ))}
    </>
  );
};

// Contratos vigentes que terminan pronto: unidad, inquilino y fecha de fin; el contrato es un link si se puede editar.
const ContratosQueTerminan = ({ indicador, puedeEditar }: { indicador: ContratosPorTerminar; puedeEditar: boolean }) => {
  // Avisar que no hay ninguno en el plazo.
  if (indicador.contratos.length === 0) {
    return <Typography.Text type="secondary">{armarTextoSinContratosPorTerminar(indicador.dias)}</Typography.Text>;
  }

  return (
    <Space direction="vertical" size={8} style={{ width: "100%" }}>
      {indicador.contratos.map((contrato) => (
        <div key={contrato.id}>
          {puedeEditar ? (
            <Link to={`/administrador/contratos-alquiler/edit/${contrato.id}`}>{contrato.unidad}</Link>
          ) : (
            <Typography.Text>{contrato.unidad}</Typography.Text>
          )}
          <div>
            <Typography.Text type="secondary">
              {contrato.inquilino} · termina el {dayjs(contrato.fecha_fin).format(FORMATO_FECHA)}
            </Typography.Text>
          </div>
        </div>
      ))}
    </Space>
  );
};

// Inicio de la sección administrador: los números de hoy que importan para manejar la cartera, cada uno con el link al
// reporte o listado del detalle. Solo se muestran los indicadores que el backend manda, que son los que el usuario
// tiene permitidos; el link de cada uno además pide que pueda entrar a esa pantalla.
export const Dashboard = () => {
  const { message } = App.useApp();
  const { data: permissions } = usePermissions<string[]>({});
  const [datos, setDatos] = useState<DashboardDatos>();
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    let vigente = true;
    kyInstance
      .get("dashboard")
      .json<DashboardDatos>()
      .then((respuesta) => vigente && setDatos(respuesta))
      .catch((error: { message?: string }) => {
        // Los GET fallidos se rechazan con el mensaje del servidor (ver providers/data.ts).
        if (vigente) {
          message.error(error.message ?? "No se pudo cargar el inicio.");
        }
      })
      .finally(() => vigente && setCargando(false));

    return () => {
      vigente = false;
    };
  }, [message]);

  // Devolver el link solo si el usuario tiene el permiso de la pantalla a la que lleva.
  const armarEnlace = (permiso: string, ruta: string): string | undefined => (permissions?.includes(permiso) ? ruta : undefined);

  // Mientras llega la respuesta, mostrar un solo esqueleto: no se sabe qué tarjetas vendrán.
  if (cargando) {
    return (
      <List title={<PageTitle icon={<HomeOutlined />}>Inicio</PageTitle>} headerButtons={() => null}>
        <Card loading />
      </List>
    );
  }

  const indicadores = datos ?? {};
  const { morosidad, ocupacion, fondos, neto_del_mes: netoDelMes, solicitudes_pendientes: solicitudes, contratos_por_terminar: contratos } = indicadores;
  const textoDeContratosMorosos = morosidad && armarTextoDeContratosMorosos(morosidad);
  const textoDeTerminados = morosidad && armarTextoDeTerminados(morosidad.terminados);
  const textoDeUnidades = ocupacion && armarTextoDeUnidades(ocupacion);

  return (
    <List title={<PageTitle icon={<HomeOutlined />}>Inicio</PageTitle>} headerButtons={() => null}>
      {/* Sin ningún indicador permitido, avisar en vez de dejar la pantalla en blanco. */}
      {!hayIndicadores(indicadores) && <Empty description="No hay indicadores para tu rol" />}

      <Row gutter={[16, 16]}>
        {morosidad && (
          <Tarjeta titulo="Morosidad" enlace={armarEnlace("cuentas_por_cobrar.ver", "/administrador/cuentas-por-cobrar")}>
            <Statistic value={armarValorDeMorosidad(morosidad)} />
            {textoDeContratosMorosos && <div>{textoDeContratosMorosos}</div>}
            {morosidad.contratos_morosos > 0 && <Typography.Text strong>Vencido: {armarTextoDeMontos(morosidad.monto_vencido)}</Typography.Text>}
            {textoDeTerminados && (
              <div style={{ marginTop: 8 }}>
                <Typography.Text type="secondary">{textoDeTerminados}</Typography.Text>
              </div>
            )}
          </Tarjeta>
        )}

        {ocupacion && (
          <Tarjeta titulo="Ocupación" enlace={armarEnlace("unidades.ver", "/administrador/unidades")}>
            <Statistic value={armarValorDeOcupacion(ocupacion)} />
            {textoDeUnidades && <Typography.Text type="secondary">{textoDeUnidades}</Typography.Text>}
          </Tarjeta>
        )}

        {fondos && (
          // El link va al listado de fondos, que pide fondos.ver además de fondos.ver_saldo.
          <Tarjeta titulo="Plata en los fondos" enlace={armarEnlace("fondos.ver", "/administrador/fondos")}>
            <MontosPorMoneda montos={fondos.montos} />
          </Tarjeta>
        )}

        {netoDelMes && (
          <Tarjeta titulo="Neto del mes" enlace={armarEnlace("ingresos_egresos.ver", "/administrador/ingresos-egresos")}>
            <MontosPorMoneda montos={netoDelMes.montos} resaltarNegativo />
            <Typography.Text type="secondary">{armarTextoDelPeriodo(netoDelMes.desde, netoDelMes.hasta)}</Typography.Text>
          </Tarjeta>
        )}

        {solicitudes && (
          <Tarjeta titulo="Solicitudes de transferencia pendientes" enlace={armarEnlace("rendiciones.ver", "/administrador/solicitudes-transferencia")}>
            <Statistic value={armarTextoDeSolicitudes(solicitudes.cantidad)} />
            {solicitudes.cantidad > 0 && <Typography.Text type="secondary">Suman {armarTextoDeMontos(solicitudes.montos)}</Typography.Text>}
          </Tarjeta>
        )}

        {contratos && (
          <Tarjeta
            titulo={`Contratos que terminan en los próximos ${contratos.dias} días`}
            enlace={armarEnlace("contratos_alquiler.ver", "/administrador/contratos-alquiler")}
          >
            <ContratosQueTerminan indicador={contratos} puedeEditar={permissions?.includes("contratos_alquiler.editar") ?? false} />
          </Tarjeta>
        )}
      </Row>
    </List>
  );
};
