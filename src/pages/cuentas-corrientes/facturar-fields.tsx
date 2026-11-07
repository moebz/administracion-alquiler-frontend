import { useEffect, useState } from "react";
import { usePermissions } from "@refinedev/core";
import { Alert, DatePicker, Select, Space, Table, Tag, Typography } from "antd";
import dayjs, { type Dayjs } from "dayjs";
import { kyInstance } from "../../providers/data";
import { formatMonto } from "../../utils/monto";
import type { PuntoExpedicionOpcion } from "../cobros/types";
import { permisosFaltantes } from "./facturacion";
import { MontoCell } from "./movimientos-table";
import {
  FACTURACION_CONCEPTO_LABEL,
  type FacturacionLinea,
  type FacturacionVistaPrevia,
  type FacturarSeleccion,
} from "./types";

const PERMISO_LABEL: Record<string, string> = {
  "liquidaciones.facturar": "Facturar al propietario",
  "facturas.emitir": "Emitir facturas de venta",
  "facturas.emitir_nc": "Emitir notas de crédito de venta",
};

type Props = {
  propietarioId: number;
  /** Se llama con lo que hay que mandar al confirmar, o con undefined mientras no se puede facturar (cargando, nada por facturar, falta un permiso o el punto). */
  onChange: (seleccion: FacturarSeleccion | undefined) => void;
};

// Elige el período y el punto de expedición y muestra lo que "Facturar al propietario" emitiría: las líneas de la
// factura (reintegro y comisión que faltan) y las NC de comisión que sobran. Lo usan el modal "Facturar" y el atajo
// "Facturar también" del modal "Transferir".
export const FacturarFields = ({ propietarioId, onChange }: Props) => {
  const { data: permissions } = usePermissions<string[]>({});

  const [periodo, setPeriodo] = useState<Dayjs>(() => dayjs());
  const [puntoId, setPuntoId] = useState<number>();
  const [puntos, setPuntos] = useState<PuntoExpedicionOpcion[]>([]);
  const [vistaPrevia, setVistaPrevia] = useState<FacturacionVistaPrevia>();
  const [error, setError] = useState<string>();
  const [cargando, setCargando] = useState(true);

  const periodoIso = periodo.format("YYYY-MM");

  // Pedir los puntos de expedición con un rango de facturas usable hoy, y precargar el punto si hay uno solo.
  useEffect(() => {
    let vigente = true;
    kyInstance
      .get("cobros/puntos-expedicion", { searchParams: { fecha: dayjs().format("YYYY-MM-DD") } })
      .json<PuntoExpedicionOpcion[]>()
      .then((opciones) => {
        if (!vigente) {
          return;
        }

        setPuntos(opciones);
        if (opciones.length === 1) {
          setPuntoId(opciones[0].id);
        }
      })
      .catch(() => vigente && setPuntos([]));

    return () => {
      vigente = false;
    };
  }, []);

  // Pedir la vista previa cada vez que cambia el período.
  useEffect(() => {
    let vigente = true;
    setCargando(true);
    setError(undefined);
    setVistaPrevia(undefined);
    kyInstance
      .get(`cuentas-corrientes/${propietarioId}/facturacion-preview`, { searchParams: { periodo: periodoIso } })
      .json<FacturacionVistaPrevia>()
      .then((previa) => vigente && setVistaPrevia(previa))
      .catch((falla: { message?: string }) => {
        // Los GET fallidos se rechazan con el mensaje del servidor (ver providers/data.ts); "nada por facturar" llega por acá.
        if (vigente) {
          setError(falla.message ?? "No se pudo calcular la facturación.");
        }
      })
      .finally(() => vigente && setCargando(false));

    return () => {
      vigente = false;
    };
  }, [propietarioId, periodoIso]);

  const faltantes = vistaPrevia ? permisosFaltantes(vistaPrevia.permisos, permissions) : [];
  const emiteFactura = (vistaPrevia?.lineas.length ?? 0) > 0;
  const listo = vistaPrevia !== undefined && faltantes.length === 0 && (!emiteFactura || puntoId !== undefined);

  // Avisar al que lo usa qué mandar al confirmar, o que todavía no se puede.
  useEffect(() => {
    if (!listo || !vistaPrevia) {
      onChange(undefined);
      return;
    }

    onChange({
      periodo: vistaPrevia.periodo,
      punto_expedicion_id: emiteFactura ? puntoId : undefined,
      esperado: { lineas: vistaPrevia.lineas, notas: vistaPrevia.notas },
    });
  }, [listo, vistaPrevia, emiteFactura, puntoId, onChange]);

  return (
    <>
      <Space wrap size="large" style={{ marginBottom: 16 }}>
        <Space>
          <span>Hasta el período</span>
          <DatePicker
            picker="month"
            allowClear={false}
            format="MM/YYYY"
            value={periodo}
            onChange={(valor) => valor && setPeriodo(valor)}
          />
        </Space>
        <Space>
          <span>Punto de expedición</span>
          <Select
            style={{ minWidth: 260 }}
            value={puntoId}
            onChange={setPuntoId}
            options={puntos.map((punto) => ({ label: punto.etiqueta, value: punto.id }))}
            placeholder="Punto con rango de facturas usable"
            disabled={!emiteFactura}
          />
        </Space>
      </Space>

      {error && <Alert type="info" showIcon message={error} style={{ marginBottom: 16 }} />}

      {faltantes.length > 0 && (
        <Alert
          type="warning"
          showIcon
          style={{ marginBottom: 16 }}
          message={`Te falta el permiso: ${faltantes.map((permiso) => PERMISO_LABEL[permiso] ?? permiso).join(", ")}.`}
        />
      )}

      {emiteFactura && !puntoId && puntos.length === 0 && !cargando && (
        <Alert
          type="warning"
          showIcon
          message="No hay un punto con un timbrado vigente y números disponibles para facturar hoy."
          style={{ marginBottom: 16 }}
        />
      )}

      {vistaPrevia && (
        <>
          {emiteFactura && (
            <Table<FacturacionLinea>
              title={() => <Typography.Text strong>Factura al propietario</Typography.Text>}
              dataSource={vistaPrevia.lineas}
              rowKey="cargo_id"
              size="small"
              pagination={false}
              scroll={{ x: "max-content" }}
              summary={() => (
                <Table.Summary.Row>
                  <Table.Summary.Cell index={0} colSpan={3}>
                    <Typography.Text strong>Total (a crédito, vence a los 30 días)</Typography.Text>
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={1} align="right">
                    <Typography.Text strong>{formatMonto(vistaPrevia.total)}</Typography.Text>
                  </Table.Summary.Cell>
                </Table.Summary.Row>
              )}
            >
              <Table.Column
                title="Concepto"
                dataIndex="concepto"
                render={(concepto: FacturacionLinea["concepto"]) => <Tag>{FACTURACION_CONCEPTO_LABEL[concepto]}</Tag>}
              />
              <Table.Column title="Descripción" dataIndex="descripcion" />
              <Table.Column
                title="IVA"
                dataIndex="tasa_iva"
                render={(tasa: number) => (tasa === 0 ? "Exenta" : `${tasa}%`)}
              />
              <Table.Column title="Monto" dataIndex="monto" align="right" render={(monto: string) => <MontoCell monto={monto} />} />
            </Table>
          )}

          {vistaPrevia.notas.length > 0 && (
            <Table
              title={() => <Typography.Text strong>Notas de crédito de comisión</Typography.Text>}
              dataSource={vistaPrevia.notas}
              rowKey="documento_venta_id"
              size="small"
              pagination={false}
              style={{ marginTop: 16 }}
              expandable={{
                defaultExpandAllRows: true,
                expandedRowRender: (nota) => (
                  <Space direction="vertical" size={0}>
                    {nota.lineas.map((linea) => (
                      <Typography.Text key={linea.cargo_id} type="secondary">
                        {linea.descripcion}: {formatMonto(linea.monto)}
                      </Typography.Text>
                    ))}
                  </Space>
                ),
              }}
            >
              <Table.Column title="Sobre la factura" dataIndex="numero" render={(numero: string | null) => numero ?? "—"} />
              <Table.Column title="Monto" dataIndex="total" align="right" render={(monto: string) => <MontoCell monto={monto} />} />
            </Table>
          )}
        </>
      )}
    </>
  );
};
