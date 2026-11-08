import { useCallback, useEffect, useState } from "react";
import { ContainerOutlined } from "@ant-design/icons";
import { Show } from "@refinedev/antd";
import { useInvalidate, usePermissions, useResourceParams } from "@refinedev/core";
import { Alert, App, Button, DatePicker, Descriptions, Flex, Space, Tooltip } from "antd";
import dayjs, { type Dayjs } from "dayjs";
import { FilterBar } from "../../components/filter-bar";
import { PageTitle } from "../../components/page-title";
import { kyInstance } from "../../providers/data";
import { Compensaciones } from "./compensaciones";
import { ControlDocumentosAlert } from "./control-documentos-alert";
import { fraseDeFactura, fraseDeNota, hayPorDocumentar } from "./documentos-propietario";
import { FacturarModal } from "./facturar-modal";
import { FacturasDelPropietario } from "./facturas-del-propietario";
import { FacturasPropietario } from "./facturas-propietario";
import { HistorialLiquidaciones } from "./historial-liquidaciones";
import { LiquidarModal } from "./liquidar-modal";
import { MontoCell, MovimientosTable } from "./movimientos-table";
import { RegistrarFacturaPropietarioModal } from "./registrar-factura-propietario-modal";
import { RegistrarNcPropietarioModal } from "./registrar-nc-propietario-modal";
import { RechazarSolicitudModal } from "../solicitudes-transferencia/rechazar-modal";
import { armarAvisoDePedido } from "../solicitudes-transferencia/textos";
import { TransferirModal } from "./transferir-modal";
import type { CuentaCorrienteDetalle } from "./types";

const FORMATO_FECHA = "DD/MM/YYYY";

export const CuentaCorrienteShow = () => {
  const { id } = useResourceParams();
  const { message } = App.useApp();
  const invalidate = useInvalidate();
  const { data: permissions } = usePermissions<string[]>({});
  const puedeVerLiquidaciones = permissions?.includes("liquidaciones.ver") ?? false;
  const puedeLiquidar = permissions?.includes("liquidaciones.confirmar") ?? false;
  const puedeAnular = permissions?.includes("liquidaciones.anular") ?? false;
  // Transferir saca plata de caja: pide el permiso propio y también el de registrar pagos (ver el backend).
  const puedeTransferir = (permissions?.includes("liquidaciones.transferir") && permissions?.includes("pagos.registrar")) ?? false;
  // Rechazar la solicitud de transferencia del propietario pide el permiso de transferir (ver el backend).
  const puedeRechazarSolicitud = permissions?.includes("liquidaciones.transferir") ?? false;
  // Facturar emite una factura (consume numeración): pide el permiso propio y también el de emitir facturas.
  const puedeFacturar = (permissions?.includes("liquidaciones.facturar") && permissions?.includes("facturas.emitir")) ?? false;
  // Registrar la factura o la NC del propietario carga el papel de otro como compra: pide el permiso propio y el de registrar compras.
  const puedeRegistrarDocumentos = (permissions?.includes("liquidaciones.registrar_documentos") && permissions?.includes("compras.registrar")) ?? false;

  const [saldoAl, setSaldoAl] = useState<Dayjs>(() => dayjs());
  const [detalle, setDetalle] = useState<CuentaCorrienteDetalle>();
  const [cargando, setCargando] = useState(true);
  const [liquidando, setLiquidando] = useState(false);
  const [transfiriendo, setTransfiriendo] = useState(false);
  const [rechazandoSolicitud, setRechazandoSolicitud] = useState(false);
  const [facturando, setFacturando] = useState(false);
  const [registrandoFactura, setRegistrandoFactura] = useState(false);
  // Factura del propietario sobre la que se registra una NC desde "Por documentar".
  const [facturaConNc, setFacturaConNc] = useState<number>();
  // Se incrementa al confirmar o anular una liquidación, al transferir, al facturar, al registrar o anular un documento del propietario o al anular una compensación, para recargar el detalle, el historial, las facturas y las compensaciones.
  const [version, setVersion] = useState(0);

  const fechaIso = saldoAl.format("YYYY-MM-DD");

  // Pedir el detalle con kyInstance y no con useShow, que no manda el parámetro `saldo_al`.
  useEffect(() => {
    if (!id) {
      return;
    }

    let vigente = true;
    setCargando(true);
    kyInstance
      .get(`cuentas-corrientes/${id}`, { searchParams: { saldo_al: fechaIso } })
      .json<CuentaCorrienteDetalle>()
      .then((datos) => vigente && setDetalle(datos))
      .catch((error: { message?: string }) => {
        // Los GET fallidos se rechazan con el mensaje del servidor (ver providers/data.ts).
        if (vigente) {
          message.error(error.message ?? "No se pudo cargar la cuenta corriente.");
        }
      })
      .finally(() => vigente && setCargando(false));

    return () => {
      vigente = false;
    };
  }, [id, fechaIso, version, message]);

  const recargar = useCallback(() => setVersion((actual) => actual + 1), []);

  // Recargar la cuenta y el contador de solicitudes del menú: transferir o rechazar cambian las pendientes.
  const recargarSolicitudes = useCallback(() => {
    setVersion((actual) => actual + 1);
    invalidate({ resource: "solicitudes-transferencia", invalidates: ["list"] });
  }, [invalidate]);

  const porDocumentar = detalle?.por_documentar;
  const solicitudPendiente = detalle?.solicitud_pendiente ?? null;
  const hayPorVencer = detalle !== undefined && Number(detalle.por_vencer) !== 0;
  const liquidable = detalle?.liquidar.disponible ?? false;

  return (
    <Show
      isLoading={cargando}
      title={<PageTitle icon={<ContainerOutlined />}>Cuenta corriente</PageTitle>}
      headerButtons={({ defaultButtons }) => (
        <Space>
          {defaultButtons}
          {puedeLiquidar && (
            // El botón usa como corte la fecha de "Saldo al"; si no se puede liquidar con ella, el tooltip dice por qué.
            <Tooltip title={liquidable ? undefined : detalle?.liquidar.motivo}>
              <span>
                <Button type="primary" disabled={!liquidable} onClick={() => setLiquidando(true)}>
                  Liquidar
                </Button>
              </span>
            </Tooltip>
          )}
          {puedeTransferir && <Button onClick={() => setTransfiriendo(true)}>Transferir</Button>}
          {puedeFacturar && <Button onClick={() => setFacturando(true)}>Facturar</Button>}
          {puedeRegistrarDocumentos && <Button onClick={() => setRegistrandoFactura(true)}>Registrar factura del propietario</Button>}
        </Space>
      )}
    >
      <FilterBar>
        <Space>
          <span>Saldo al</span>
          <DatePicker
            allowClear={false}
            format={FORMATO_FECHA}
            value={saldoAl}
            onChange={(fecha) => fecha && setSaldoAl(fecha)}
          />
        </Space>
      </FilterBar>

      <Descriptions column={2} size="small" style={{ marginBottom: 16 }}>
        <Descriptions.Item label="Propietario">{detalle?.propietario.nombre}</Descriptions.Item>
        <Descriptions.Item label="Documento">{detalle?.propietario.documento}</Descriptions.Item>
        <Descriptions.Item label={`Saldo al ${saldoAl.format(FORMATO_FECHA)}`}>
          {detalle && <MontoCell monto={detalle.saldo} />}
        </Descriptions.Item>
        {hayPorVencer && (
          <Descriptions.Item label="Por vencer después de esa fecha">
            {detalle && <MontoCell monto={detalle.por_vencer} />}
          </Descriptions.Item>
        )}
      </Descriptions>

      {/* La solicitud de transferencia pendiente del propietario, con las dos formas de atenderla. */}
      {solicitudPendiente && (
        <Alert
          type="info"
          showIcon
          style={{ marginBottom: 16 }}
          message={
            <Flex align="center" gap={8} wrap>
              <span>{armarAvisoDePedido(solicitudPendiente)}</span>
              {puedeTransferir && (
                <Button size="small" onClick={() => setTransfiriendo(true)}>
                  Transferir
                </Button>
              )}
              {puedeRechazarSolicitud && (
                <Button size="small" onClick={() => setRechazandoSolicitud(true)}>
                  Rechazar
                </Button>
              )}
            </Flex>
          }
        />
      )}

      {/* Lo que le falta documentar al propietario con el corte de "Saldo al": solo si falta algo. */}
      {hayPorDocumentar(porDocumentar) && (
        <Alert
          type="warning"
          showIcon
          style={{ marginBottom: 16 }}
          message="Por documentar"
          description={
            <>
              {porDocumentar.notas.map((nota) => (
                <Flex key={`nota-${nota.factura_id}`} align="center" gap={8}>
                  <span>{fraseDeNota(nota)}</span>
                  {puedeRegistrarDocumentos && (
                    <Button size="small" onClick={() => setFacturaConNc(nota.factura_id)}>
                      Registrar NC
                    </Button>
                  )}
                </Flex>
              ))}
              {porDocumentar.facturas.map((factura) => (
                <div key={`factura-${factura.cargo_id}`}>{fraseDeFactura(factura)}</div>
              ))}
            </>
          }
        />
      )}

      {/* Control de saldo contra documentos: se muestra siempre, en verde si cuadra y en amarillo si no. */}
      <ControlDocumentosAlert control={detalle?.control} />

      <MovimientosTable movimientos={detalle?.movimientos} loading={cargando} mostrarLiquidacion />

      {puedeVerLiquidaciones && id && (
        <div style={{ marginTop: 24 }}>
          <HistorialLiquidaciones
            propietarioId={Number(id)}
            puedeAnular={puedeAnular}
            version={version}
            onAnulada={recargar}
          />
        </div>
      )}

      {puedeVerLiquidaciones && id && (
        <div style={{ marginTop: 24 }}>
          <FacturasPropietario propietarioId={Number(id)} version={version} />
        </div>
      )}

      {puedeVerLiquidaciones && id && (
        <div style={{ marginTop: 24 }}>
          <FacturasDelPropietario propietarioId={Number(id)} version={version} onCambio={recargar} />
        </div>
      )}

      {puedeVerLiquidaciones && id && (
        <div style={{ marginTop: 24 }}>
          <Compensaciones propietarioId={Number(id)} version={version} onCambio={recargar} />
        </div>
      )}

      {liquidando && detalle && (
        <LiquidarModal
          propietarioId={detalle.propietario.id}
          corte={detalle.saldo_al}
          onClose={() => setLiquidando(false)}
          onConfirmada={() => {
            setLiquidando(false);
            recargar();
          }}
        />
      )}

      {transfiriendo && detalle && (
        <TransferirModal
          propietarioId={detalle.propietario.id}
          onClose={() => setTransfiriendo(false)}
          onTransferida={() => {
            setTransfiriendo(false);
            recargarSolicitudes();
          }}
        />
      )}

      {rechazandoSolicitud && solicitudPendiente && (
        <RechazarSolicitudModal
          solicitud={solicitudPendiente}
          onClose={() => setRechazandoSolicitud(false)}
          onRechazada={() => {
            setRechazandoSolicitud(false);
            recargarSolicitudes();
          }}
        />
      )}

      {registrandoFactura && detalle && (
        <RegistrarFacturaPropietarioModal
          propietarioId={detalle.propietario.id}
          onClose={() => setRegistrandoFactura(false)}
          onRegistrada={() => {
            setRegistrandoFactura(false);
            recargar();
          }}
        />
      )}

      {facturaConNc !== undefined && detalle && (
        <RegistrarNcPropietarioModal
          propietarioId={detalle.propietario.id}
          facturaId={facturaConNc}
          onClose={() => setFacturaConNc(undefined)}
          onRegistrada={() => {
            setFacturaConNc(undefined);
            recargar();
          }}
        />
      )}

      {facturando && detalle && (
        <FacturarModal
          propietarioId={detalle.propietario.id}
          onClose={() => setFacturando(false)}
          onFacturada={() => {
            setFacturando(false);
            recargar();
          }}
        />
      )}
    </Show>
  );
};
