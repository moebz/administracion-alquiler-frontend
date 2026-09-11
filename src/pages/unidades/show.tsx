import { EditButton, Show } from "@refinedev/antd";
import { useGo, useOne, useShow } from "@refinedev/core";
import { Button, Card, Descriptions, Empty, Space, Tag, Typography } from "antd";
import dayjs from "dayjs";
import { useNavigate } from "react-router";
import {
  CONTRATO_ALQUILER_ESTADO_COLOR,
  CONTRATO_ALQUILER_ESTADO_LABEL,
  EXPENSAS_A_CARGO_LABEL,
  type ContratoAlquilerRow,
} from "../contratos-alquiler/types";
import { UNIDAD_ESTADO_COLOR, UNIDAD_ESTADO_LABEL, type UnidadRow } from "./types";

export const UnidadShow = () => {
  const { query: unidadQuery, result: unidad } = useShow<UnidadRow>();
  const navigate = useNavigate();

  const { query: contratoQuery, result: contrato } = useOne<ContratoAlquilerRow>({
    resource: "contratos-alquiler",
    id: unidad?.contrato_vigente_id ?? "",
    queryOptions: { enabled: !!unidad?.contrato_vigente_id },
  });
  const cargandoContrato = !!unidad?.contrato_vigente_id && contratoQuery.isFetching;

  const go = useGo();
  const verGastos = () =>
    go({
      to: { resource: "gastos", action: "list" },
      query: { filters: [{ field: "unidad_id", operator: "eq", value: unidad?.id }] },
    });

  return (
    // title explícito por el mismo motivo que Create/Edit (ver comentario en
    // pages/contratos-alquiler/list.tsx): pluralize.plural() no entiende español.
    <Show title="Detalle de la unidad" isLoading={unidadQuery.isLoading}>
      <Space direction="vertical" size="large" style={{ width: "100%" }}>
        <Card title="Datos de la unidad" size="small">
          <Descriptions column={2} size="small">
            <Descriptions.Item label="Edificio">{unidad?.bloque.edificio.nombre}</Descriptions.Item>
            <Descriptions.Item label="Bloque">{unidad?.bloque.nombre}</Descriptions.Item>
            <Descriptions.Item label="Número">{unidad?.numero}</Descriptions.Item>
            <Descriptions.Item label="Piso">{unidad?.piso ?? "—"}</Descriptions.Item>
            <Descriptions.Item label="Superficie">
              {unidad?.superficie_m2 ? `${unidad.superficie_m2} m²` : "—"}
            </Descriptions.Item>
            <Descriptions.Item label="Ambientes">{unidad?.cantidad_ambientes ?? "—"}</Descriptions.Item>
            <Descriptions.Item label="Propietario">{unidad?.propietario.nombre}</Descriptions.Item>
            <Descriptions.Item label="Estado">
              {unidad && <Tag color={UNIDAD_ESTADO_COLOR[unidad.estado]}>{UNIDAD_ESTADO_LABEL[unidad.estado]}</Tag>}
            </Descriptions.Item>
            <Descriptions.Item label="Activa">
              {unidad && (
                <Tag color={unidad.is_active ? "green" : "red"}>{unidad.is_active ? "Activa" : "Inactiva"}</Tag>
              )}
            </Descriptions.Item>
          </Descriptions>
        </Card>

        <Card
          title="Contrato de alquiler"
          size="small"
          loading={cargandoContrato}
          extra={
            contrato ? (
              <EditButton resource="contratos-alquiler" recordItemId={contrato.id} size="small">
                Editar contrato
              </EditButton>
            ) : (
              <Button
                size="small"
                type="primary"
                onClick={() => navigate(`/administrador/contratos-alquiler/create?unidad_id=${unidad?.id}`)}
              >
                Crear contrato
              </Button>
            )
          }
        >
          {contrato ? (
            <Descriptions column={2} size="small">
              <Descriptions.Item label="Inquilino">{contrato.inquilino.nombre}</Descriptions.Item>
              <Descriptions.Item label="Estado">
                <Tag color={CONTRATO_ALQUILER_ESTADO_COLOR[contrato.estado]}>
                  {CONTRATO_ALQUILER_ESTADO_LABEL[contrato.estado]}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Inicio">{dayjs(contrato.fecha_inicio).format("DD/MM/YYYY")}</Descriptions.Item>
              <Descriptions.Item label="Fin">{dayjs(contrato.fecha_fin).format("DD/MM/YYYY")}</Descriptions.Item>
              <Descriptions.Item label="Monto de alquiler">
                {contrato.monto_alquiler_vigente?.toLocaleString("es-PY", {
                  style: "currency",
                  currency: "PYG",
                }) ?? "—"}
              </Descriptions.Item>
              <Descriptions.Item label="Día de vencimiento">{contrato.dia_vencimiento}</Descriptions.Item>
              <Descriptions.Item label="Expensas a cargo de">
                {EXPENSAS_A_CARGO_LABEL[contrato.expensas_a_cargo_de]}
              </Descriptions.Item>
            </Descriptions>
          ) : (
            !cargandoContrato && (
              <Empty description="Esta unidad no tiene un contrato vigente." image={Empty.PRESENTED_IMAGE_SIMPLE} />
            )
          )}
        </Card>

        {/* Sin `title`/`extra`: no hay más contenido que estos dos botones, un
            Card con head + body separados dejaría el body vacío. */}
        <Card size="small">
          <Space style={{ width: "100%", justifyContent: "space-between" }} wrap>
            <Typography.Text strong>Gastos</Typography.Text>
            <Space>
              <Button size="small" onClick={verGastos}>
                Ver gastos
              </Button>
              <Button
                size="small"
                type="primary"
                onClick={() => navigate(`/administrador/gastos/create?unidad_id=${unidad?.id}`)}
              >
                Registrar gasto
              </Button>
            </Space>
          </Space>
        </Card>
      </Space>
    </Show>
  );
};
