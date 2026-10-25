import { useState } from "react";
import { CreditCardOutlined, DeleteOutlined, FileTextOutlined, PlusOutlined, UnorderedListOutlined, WalletOutlined } from "@ant-design/icons";
import { usePermissions } from "@refinedev/core";
import { Alert, App, Button, Checkbox, Col, DatePicker, Descriptions, Flex, Form, Input, InputNumber, Modal, Select, Tooltip, Typography } from "antd";
import dayjs from "dayjs";
import { Link } from "react-router";
import { kyInstance } from "../../providers/data";
import { SectionDivider } from "../../components/section-divider";
import { SectionRow } from "../../components/section-row";
import { MontoInput } from "../../components/monto-input";
import { subtotalLinea, totalesFactura, type LineaFactura } from "../../utils/factura";
import { formatMonto } from "../../utils/monto";
import { COMPRA_CONDICION_OPTIONS, type CompraCondicion } from "../compras/types";
import type { CompraRow } from "../compras/types";
import { CARGO_DEUDOR_AL } from "../cargos/types";
import { emparejarFacturados } from "./emparejar";
import type { AnticipoOrigenSituacion, AnticipoProveedor, CargoPrevisto, CargosEsperado, GastoRow } from "./types";

const TASA_IVA_OPTIONS = [
  { label: "Exenta", value: 0 },
  { label: "5%", value: 5 },
  { label: "10%", value: 10 },
];

const FORM_GUTTER = 24;

type Linea = LineaFactura & { descripcion: string };

type Valores = {
  timbrado_proveedor: string;
  numero: string;
  fecha: string;
  condicion: CompraCondicion;
  detalles: Linea[];
  cantidad_cuotas?: number;
  fecha_primer_vencimiento?: string;
  fecha_vencimiento_cargo?: string;
  anticipos?: number[];
};

const CARGO_TIPO_PREVISTO_LABEL = { EXPENSA: "Expensa", OTRO: "Otro" };

const ANTICIPO_ORIGEN_LABEL: Record<AnticipoOrigenSituacion, string> = {
  ESPERA_REEMPLAZO: "factura del proveedor anulada, espera reemplazo",
  ANULADO: "gasto anulado",
  REEMPLAZADA: "ya tiene su factura de reemplazo",
};

// Describe un anticipo para elegirlo: el pago, su saldo y los gastos por los que pasó; avisa si usarlo obliga a pagar de nuevo otra factura.
const AnticipoOpcion = ({ anticipo }: { anticipo: AnticipoProveedor }) => {
  const historial = anticipo.historial
    .map((origen) => `${origen.descripcion} · ${origen.unidad} (${ANTICIPO_ORIGEN_LABEL[origen.situacion]})`)
    .join(" → ");
  const esperando = anticipo.historial.filter((origen) => origen.situacion === "ESPERA_REEMPLAZO").map((origen) => origen.descripcion);

  return (
    <Flex vertical>
      <span>
        Pago #{anticipo.numero} · {formatMonto(anticipo.saldo)}
        {historial && ` · ${historial}`}{" "}
        <Link to={`/administrador/pagos-proveedor/show/${anticipo.id}`} target="_blank" onClick={(event) => event.stopPropagation()}>
          Ver pago
        </Link>
      </span>
      {anticipo.aviso && (
        <Typography.Text type="warning">
          Si lo usás, la factura de reemplazo de {esperando.join(", ")} se va a tener que pagar de nuevo.
        </Typography.Text>
      )}
    </Flex>
  );
};

// Avisa qué va a pasar con los cargos antes de registrar la factura: uno por cada línea, al inquilino o al propietario.
// `estado` es el de `previsto`, salvo REAPUNTAR, que el modal decide con las líneas cargadas.
const AvisoCargo = ({ previsto, estado, lineas }: { previsto: CargoPrevisto; estado: CargosEsperado; lineas: number }) => {
  const alDeudor = CARGO_DEUDOR_AL[previsto.deudor];
  const detalle = `${lineas === 1 ? "Un cargo" : `${lineas} cargos`} de tipo ${CARGO_TIPO_PREVISTO_LABEL[previsto.tipo]} ${alDeudor} ${previsto.deudor_nombre}, por un total de ${formatMonto(previsto.monto)}`;

  // Explicar de dónde sale el vencimiento sugerido: al rehacer, el de los cargos actuales si todavía no pasó.
  let ayudaVencimiento = "Sugerido: el próximo día de vencimiento del contrato, para cobrarlo junto con el alquiler.";
  if (estado === "REHACER" || estado === "REAPUNTAR") {
    ayudaVencimiento = "Sugerido: el vencimiento de los cargos actuales, o el próximo día de vencimiento del contrato si ya pasó.";
  }

  // Vencimiento sugerido; el usuario lo puede cambiar (no antes de hoy). El propietario no tiene.
  const campoVencimiento =
    previsto.deudor === "INQUILINO" ? (
      <Form.Item
        label="Vencimiento de los cargos"
        name="fecha_vencimiento_cargo"
        extra={ayudaVencimiento}
        getValueProps={(value) => ({ value: value ? dayjs(value) : undefined })}
        style={{ margin: "12px 0 0", maxWidth: 360 }}
      >
        <DatePicker style={{ width: "100%" }} format="DD/MM/YYYY" disabledDate={(fecha) => fecha.isBefore(dayjs(), "day")} />
      </Form.Item>
    ) : null;

  if (previsto.estado === "BLOQUEADO") {
    return (
      <Alert
        type="error"
        showIcon
        style={{ marginBottom: 16 }}
        message="No se puede registrar la factura"
        description="El contrato de este gasto fue anulado, así que no hay a quién cargarle el gasto. Anulá el gasto y registralo de nuevo."
      />
    );
  }

  if (previsto.estado === "YA_TUVO") {
    return (
      <Alert
        type="info"
        showIcon
        style={{ marginBottom: 16 }}
        message={`No se crearán cargos nuevos ${alDeudor}`}
        description={`Este gasto ya tuvo cargos ${alDeudor} (activos o anulados). Si hace falta, podés crearlos manualmente desde Cargos.`}
      />
    );
  }

  // Avisar que el contrato terminó: los cargos se crean igual en ese contrato.
  const avisoContratoTerminado = previsto.contrato_terminado && (
    <Alert
      type="warning"
      showIcon
      style={{ marginBottom: 16 }}
      message={`El contrato de este gasto terminó el ${dayjs(previsto.contrato_terminado).format("DD/MM/YYYY")}: los cargos se crean igual al inquilino de ese contrato. Si no corresponde, anulalos desde Cargos.`}
    />
  );

  if (estado === "REAPUNTAR") {
    return (
      <>
        {avisoContratoTerminado}
        <Alert
          type="info"
          showIcon
          style={{ marginBottom: 16 }}
          message="Los cargos ya facturados coinciden con líneas de esta factura y pasan a apuntar a ellas; los demás se rehacen"
          description={campoVencimiento}
        />
      </>
    );
  }

  if (estado === "REVISAR_FACTURA") {
    return (
      <Alert
        type="warning"
        showIcon
        style={{ marginBottom: 16 }}
        message={`Hay cargos ya facturados ${alDeudor}: ningún cargo se va a tocar`}
        description={`Si una línea de esta factura tiene el mismo monto y tasa que cada cargo facturado, los cargos pasan a apuntarla solos. Si no, después vas a poder reapuntarlos desde Cargos, o anular la factura ${alDeudor} antes de registrar esta, así se rehacen solos.`}
      />
    );
  }

  if (estado === "REHACER") {
    return (
      <>
        {avisoContratoTerminado}
        <Alert
          type="warning"
          showIcon
          style={{ marginBottom: 16 }}
          message={`${previsto.cargos_activos === 1 ? "Se anula el cargo actual" : `Se anulan los ${previsto.cargos_activos} cargos actuales`} y se crea uno por cada línea de esta factura`}
          description={
            <>
              <div>{detalle}.</div>
              {campoVencimiento}
            </>
          }
        />
      </>
    );
  }

  return (
    <>
      {avisoContratoTerminado}
      <Alert
        type="info"
        showIcon
        style={{ marginBottom: 16 }}
        message={`Se creará un cargo ${alDeudor} por cada línea de la factura`}
        description={
          <>
            <div>{detalle}.</div>
            {campoVencimiento}
          </>
        }
      />
    </>
  );
};

const valoresIniciales = (gasto: GastoRow, compra?: CompraRow) =>
  compra
    ? {
        timbrado_proveedor: compra.timbrado_proveedor,
        numero: compra.numero,
        fecha: compra.fecha,
        condicion: compra.condicion,
        detalles: compra.detalles.map((detalle) => ({
          descripcion: detalle.descripcion,
          cantidad: Number(detalle.cantidad),
          precio_unitario: Number(detalle.precio_unitario),
          tasa_iva: detalle.tasa_iva,
        })),
        cantidad_cuotas: compra.cuotas.length,
        fecha_primer_vencimiento: compra.cuotas[0]?.fecha_vencimiento,
      }
    : {
        condicion: "CONTADO",
        detalles: [{ descripcion: gasto.descripcion, cantidad: 1, precio_unitario: Number(gasto.monto), tasa_iva: 10 }],
        fecha_vencimiento_cargo: gasto.cargo_previsto?.fecha_vencimiento ?? undefined,
        anticipos: gasto.anticipos_proveedor.filter((anticipo) => anticipo.tildado).map((anticipo) => anticipo.id),
      };

// Con `compra` edita esa factura (PUT) en vez de registrar una nueva (POST). `onRefrescar` vuelve a pedir el gasto
// cuando el backend avisa que lo que va a pasar con los cargos cambió desde que se abrió el modal.
export const RegistrarFacturaModal = ({
  gasto,
  compra,
  onClose,
  onSuccess,
  onRefrescar,
}: {
  gasto: GastoRow;
  compra?: CompraRow;
  onClose: () => void;
  onSuccess: () => void;
  onRefrescar?: () => void;
}) => {
  const { message } = App.useApp();
  const { data: permissions } = usePermissions<string[]>({});
  const [guardando, setGuardando] = useState(false);
  const [form] = Form.useForm<Valores>();
  const condicion = Form.useWatch("condicion", form);
  const detalles = Form.useWatch("detalles", form) ?? [];
  const montoGasto = Number(gasto.monto);
  const totales = totalesFactura(detalles);
  const diferencia = montoGasto - totales.total;
  // Solo al registrar se crean cargos por primera vez; al editar, los activos se rehacen.
  const previsto = compra ? null : gasto.cargo_previsto;
  // Decidir con las líneas cargadas si los cargos ya facturados se reapuntan, con la misma regla que el backend.
  let estadoCargos: CargosEsperado = previsto?.estado === "BLOQUEADO" ? "NINGUNO" : (previsto?.estado ?? "NINGUNO");
  if (previsto?.estado === "REVISAR_FACTURA" && emparejarFacturados(previsto.cargos_facturados, detalles) !== null) {
    estadoCargos = "REAPUNTAR";
  }
  // Solo cuentan los cargos de la factura vigente: los marcados vienen de una factura anulada y no se rehacen.
  const cargosActivos = compra ? gasto.cargos.filter((cargo) => cargo.estado !== "ANULADO" && !cargo.marca) : [];
  // Un cargo ya facturado no se puede rehacer: el backend rechaza la edición con 422, así que se bloquea el guardado.
  const hayCargoFacturado = cargosActivos.some((cargo) => Number(cargo.facturado) > 0);
  // Los anticipos se ofrecen solo al registrar, y a quien puede aplicarlos (sin ese permiso el backend rechaza mandarlos).
  const mostrarAnticipos = !compra && (permissions?.includes("pagos.aplicar") ?? false) && gasto.anticipos_proveedor.length > 0;
  const alDeudorDelGasto = CARGO_DEUDOR_AL[gasto.a_cargo_de === "PROPIETARIO" ? "PROPIETARIO" : "INQUILINO"];

  const registrar = async (values: Valores) => {
    setGuardando(true);
    // Mandar los anticipos elegidos en el orden de la lista, y solo si se ofrecieron.
    const anticiposElegidos = mostrarAnticipos
      ? gasto.anticipos_proveedor.filter((anticipo) => values.anticipos?.includes(anticipo.id)).map((anticipo) => anticipo.id)
      : [];
    const response = await kyInstance[compra ? "put" : "post"](`gastos/${gasto.id}/factura`, {
      json: {
        ...values,
        // Mandar el aviso mostrado: si al guardar lo que pasa con los cargos es otra cosa, el backend lo rechaza.
        cargos_esperado: compra ? undefined : estadoCargos,
        anticipos: anticiposElegidos.length > 0 ? anticiposElegidos : undefined,
        fecha: dayjs(values.fecha).format("YYYY-MM-DD"),
        fecha_primer_vencimiento: values.condicion === "CREDITO" && values.fecha_primer_vencimiento
          ? dayjs(values.fecha_primer_vencimiento).format("YYYY-MM-DD")
          : undefined,
        fecha_vencimiento_cargo: values.fecha_vencimiento_cargo
          ? dayjs(values.fecha_vencimiento_cargo).format("YYYY-MM-DD")
          : undefined,
      },
    });
    setGuardando(false);

    if (response.ok) {
      message.success(compra ? "Factura actualizada." : "Factura registrada.");
      onSuccess();
      return;
    }

    const body = await response.json<{ message?: string; errors?: Record<string, string[]> }>().catch(() => null);

    // Volver a pedir el gasto si lo previsto cambió con el modal abierto: el aviso se actualiza y el modal no se cierra.
    if (response.status === 422 && !body?.errors && body?.message?.startsWith("Lo que va a pasar con los cargos cambió")) {
      message.warning(body.message);
      onRefrescar?.();
      return;
    }

    if (response.status === 422 && body?.errors) {
      form.setFields(
        Object.entries(body.errors).map(([name, errors]) => ({
          name: name.split(".").map((parte) => (/^\d+$/.test(parte) ? Number(parte) : parte)) as never,
          errors,
        })),
      );
      return;
    }
    message.error(body?.message ?? (compra ? "No se pudo actualizar la factura." : "No se pudo registrar la factura."));
  };

  return (
    <Modal
      title={compra ? "Editar factura del proveedor" : "Registrar factura del proveedor"}
      open
      onCancel={onClose}
      onOk={() => form.submit()}
      okText={compra ? "Guardar" : "Registrar"}
      cancelText="Cancelar"
      confirmLoading={guardando}
      okButtonProps={{ disabled: previsto?.estado === "BLOQUEADO" || hayCargoFacturado }}
      width={960}
    >
      <Descriptions column={2} size="small" style={{ marginBottom: 16 }}>
        <Descriptions.Item label="Gasto">{gasto.descripcion}</Descriptions.Item>
        <Descriptions.Item label="Proveedor">{gasto.proveedor.nombre}</Descriptions.Item>
        <Descriptions.Item label="Monto">{formatMonto(gasto.monto)}</Descriptions.Item>
      </Descriptions>
      <Form
        form={form}
        layout="vertical"
        onFinish={registrar}
        initialValues={valoresIniciales(gasto, compra)}
      >
        {previsto && <AvisoCargo previsto={previsto} estado={estadoCargos} lineas={detalles.length} />}
        {cargosActivos.length > 0 && !hayCargoFacturado && (
          <Alert
            type="warning"
            showIcon
            style={{ marginBottom: 16 }}
            message={`Se rehacen los cargos ${alDeudorDelGasto}`}
            description={`${cargosActivos.length === 1 ? "Se anula el cargo actual" : `Se anulan los ${cargosActivos.length} cargos actuales`} y se crea uno por cada línea editada, con el mismo período${gasto.a_cargo_de === "PROPIETARIO" ? "" : " y vencimiento"}.`}
          />
        )}
        {hayCargoFacturado && (
          <Alert
            type="error"
            showIcon
            style={{ marginBottom: 16 }}
            message="No se puede editar la factura"
            description={`Un cargo de este gasto ya está facturado ${alDeudorDelGasto}. Revertí primero lo facturado.`}
          />
        )}
        <SectionDivider icon={<FileTextOutlined />} style={{ marginTop: 16 }}>
          Datos de la factura
        </SectionDivider>
        <SectionRow gutter={FORM_GUTTER}>
          <Col xs={24} md={12}>
            <Form.Item label="Timbrado del proveedor" name="timbrado_proveedor" rules={[{ required: true }, { max: 20 }]}>
              <Input />
            </Form.Item>
          </Col>
          <Col xs={24} md={12}>
            <Form.Item label="Número de factura" name="numero" rules={[{ required: true }, { max: 20 }]}>
              <Input placeholder="001-001-0000001" />
            </Form.Item>
          </Col>
          <Col xs={24} md={12}>
            <Form.Item
              label="Fecha"
              name="fecha"
              rules={[{ required: true }]}
              getValueProps={(value) => ({ value: value ? dayjs(value) : undefined })}
            >
              <DatePicker style={{ width: "100%" }} format="DD/MM/YYYY" />
            </Form.Item>
          </Col>
        </SectionRow>

        <SectionDivider icon={<UnorderedListOutlined />}>Detalle</SectionDivider>
        <Form.List
          name="detalles"
          rules={[
            {
              validator: async () => {
                if (diferencia > 0) throw new Error(`Faltan ${formatMonto(diferencia)} para completar el monto del gasto (${formatMonto(montoGasto)}).`);
                if (diferencia < 0) throw new Error(`Las líneas superan en ${formatMonto(-diferencia)} el monto del gasto (${formatMonto(montoGasto)}).`);
              },
            },
          ]}
        >
          {(fields, { add, remove }, { errors }) => (
            <>
              {fields.map(({ key, name }) => (
                <SectionRow key={key} gutter={12} align="top">
                  <Col xs={24} md={8}>
                    <Form.Item label={name === 0 ? "Descripción" : undefined} name={[name, "descripcion"]} rules={[{ required: true }, { max: 255 }]}>
                      <Input />
                    </Form.Item>
                  </Col>
                  <Col xs={12} md={3}>
                    <Form.Item label={name === 0 ? "Cantidad" : undefined} name={[name, "cantidad"]} rules={[{ required: true }]}>
                      <InputNumber style={{ width: "100%" }} min={0.0001} />
                    </Form.Item>
                  </Col>
                  <Col xs={12} md={5}>
                    <Form.Item label={name === 0 ? "Precio unitario" : undefined} name={[name, "precio_unitario"]} rules={[{ required: true }]}>
                      <MontoInput min={1} />
                    </Form.Item>
                  </Col>
                  <Col xs={12} md={4}>
                    <Form.Item label={name === 0 ? "IVA" : undefined} name={[name, "tasa_iva"]} rules={[{ required: true }]}>
                      <Select options={TASA_IVA_OPTIONS} />
                    </Form.Item>
                  </Col>
                  <Col xs={10} md={3}>
                    <Form.Item label={name === 0 ? "Subtotal" : undefined}>
                      <Typography.Text>{formatMonto(subtotalLinea(detalles[name] ?? {}))}</Typography.Text>
                    </Form.Item>
                  </Col>
                  <Col xs={2} md={1}>
                    <Form.Item label={name === 0 ? " " : undefined}>
                      <Tooltip title="Quitar línea">
                        <Button size="small" icon={<DeleteOutlined />} disabled={fields.length === 1} onClick={() => remove(name)} />
                      </Tooltip>
                    </Form.Item>
                  </Col>
                </SectionRow>
              ))}
              <Button
                type="dashed"
                icon={<PlusOutlined />}
                onClick={() => add({ cantidad: 1, tasa_iva: 10, precio_unitario: diferencia > 0 ? diferencia : undefined })}
              >
                Agregar línea
              </Button>
              {errors.length > 0 && <Alert type="error" showIcon message={errors} style={{ marginTop: 16 }} />}
            </>
          )}
        </Form.List>
        <Descriptions column={1} size="small" style={{ margin: "16px 0", maxWidth: 360, marginLeft: "auto" }}>
          <Descriptions.Item label="Exentas">{formatMonto(totales.exentas)}</Descriptions.Item>
          {totales.gravadas_5 > 0 && (
            <Descriptions.Item label="Gravadas 5% / IVA">
              {formatMonto(totales.gravadas_5)} / {formatMonto(totales.iva_5)}
            </Descriptions.Item>
          )}
          {totales.gravadas_10 > 0 && (
            <Descriptions.Item label="Gravadas 10% / IVA">
              {formatMonto(totales.gravadas_10)} / {formatMonto(totales.iva_10)}
            </Descriptions.Item>
          )}
          <Descriptions.Item label="Total">
            <Typography.Text type={diferencia === 0 ? "success" : "danger"}>
              {formatMonto(totales.total)} de {formatMonto(montoGasto)}
              {diferencia > 0 && ` (faltan ${formatMonto(diferencia)})`}
              {diferencia < 0 && ` (sobran ${formatMonto(-diferencia)})`}
            </Typography.Text>
          </Descriptions.Item>
        </Descriptions>

        {mostrarAnticipos && (
          <>
            <SectionDivider icon={<WalletOutlined />}>Anticipos al proveedor</SectionDivider>
            <Form.Item name="anticipos" extra="Pagos ya hechos a este proveedor que se aplican a esta factura. Lo que no se elija sigue disponible como anticipo.">
              <Checkbox.Group
                style={{ display: "flex", flexDirection: "column", gap: 8 }}
                options={gasto.anticipos_proveedor.map((anticipo) => ({ value: anticipo.id, label: <AnticipoOpcion anticipo={anticipo} /> }))}
              />
            </Form.Item>
          </>
        )}

        <SectionDivider icon={<CreditCardOutlined />}>Condición de pago</SectionDivider>
        <SectionRow gutter={FORM_GUTTER}>
          <Col xs={24} md={12}>
            <Form.Item label="Condición" name="condicion" rules={[{ required: true }]}>
              <Select options={COMPRA_CONDICION_OPTIONS} />
            </Form.Item>
          </Col>
          {condicion === "CREDITO" && (
            <>
              <Col xs={24} md={12}>
                <Form.Item label="Cantidad de cuotas" name="cantidad_cuotas" rules={[{ required: true }]}>
                  <InputNumber style={{ width: "100%" }} min={1} precision={0} />
                </Form.Item>
              </Col>
              <Col xs={24} md={12}>
                <Form.Item
                  label="Fecha del primer vencimiento"
                  name="fecha_primer_vencimiento"
                  rules={[{ required: true }]}
                  getValueProps={(value) => ({ value: value ? dayjs(value) : undefined })}
                >
                  <DatePicker style={{ width: "100%" }} format="DD/MM/YYYY" />
                </Form.Item>
              </Col>
            </>
          )}
        </SectionRow>
      </Form>
    </Modal>
  );
};
