import { EditButton, Show } from "@refinedev/antd";
import { useGo, useOne, useShow } from "@refinedev/core";
import { CalendarOutlined, DollarOutlined, FileTextOutlined, HomeOutlined } from "@ant-design/icons";
import { Button, Descriptions, Empty, Flex, Skeleton, Space, Tag, Typography } from "antd";
import dayjs from "dayjs";
import { useNavigate } from "react-router";
import { SectionDivider } from "../../components/section-divider";
import {
  CONTRATO_ALQUILER_ESTADO_COLOR,
  CONTRATO_ALQUILER_ESTADO_LABEL,
  EXPENSAS_A_CARGO_LABEL,
  type ContratoAlquilerRow,
} from "../contratos-alquiler/types";
import { formatMonto } from "../../utils/monto";
import { OcupacionTag } from "./ocupacion-tag";
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

  const { query: futuroQuery, result: contratoFuturo } = useOne<ContratoAlquilerRow>({
    resource: "contratos-alquiler",
    id: unidad?.contrato_futuro_id ?? "",
    queryOptions: { enabled: !!unidad?.contrato_futuro_id },
  });
  const cargandoFuturo = !!unidad?.contrato_futuro_id && futuroQuery.isFetching;

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
      {unidad && (
        <Space size="middle" align="center">
          <Typography.Title level={4} style={{ margin: 0 }}>
            {`${unidad.bloque.edificio.nombre} · ${unidad.bloque.nombre} · ${unidad.numero}`}
          </Typography.Title>
          <Tag color={UNIDAD_ESTADO_COLOR[unidad.estado]}>{UNIDAD_ESTADO_LABEL[unidad.estado]}</Tag>
          <OcupacionTag unidad={unidad} />
          <Tag color={unidad.is_active ? "green" : "red"}>{unidad.is_active ? "Activa" : "Inactiva"}</Tag>
        </Space>
      )}

      <SectionDivider icon={<HomeOutlined />}>Datos de la unidad</SectionDivider>
      <Descriptions column={{ xs: 1, md: 2, xl: 3 }} size="small" style={{ paddingLeft: 24 }}>
        <Descriptions.Item label="Propietario">{unidad?.propietario.nombre}</Descriptions.Item>
        <Descriptions.Item label="Piso">{unidad?.piso ?? "—"}</Descriptions.Item>
        <Descriptions.Item label="Superficie">
          {unidad?.superficie_m2 ? `${unidad.superficie_m2} m²` : "—"}
        </Descriptions.Item>
        <Descriptions.Item label="Ambientes">{unidad?.cantidad_ambientes ?? "—"}</Descriptions.Item>
      </Descriptions>

      <Flex align="center" gap={16}>
        <div style={{ flex: 1 }}>
          <SectionDivider icon={<FileTextOutlined />}>
            Contrato de alquiler
            {contrato && (
              <Tag color={CONTRATO_ALQUILER_ESTADO_COLOR[contrato.estado]} style={{ marginLeft: 12 }}>
                {CONTRATO_ALQUILER_ESTADO_LABEL[contrato.estado]}
              </Tag>
            )}
          </SectionDivider>
        </div>
        {contrato ? (
          <Space>
            {!unidad?.contrato_futuro_id && (
              <Button
                onClick={() =>
                  navigate(
                    `/administrador/contratos-alquiler/create?unidad_id=${unidad?.id}&fecha_inicio=${dayjs(contrato.fecha_fin_efectiva).add(1, "day").format("YYYY-MM-DD")}`,
                  )
                }
              >
                Crear próximo contrato
              </Button>
            )}
            <EditButton resource="contratos-alquiler" recordItemId={contrato.id}>
              Editar contrato
            </EditButton>
          </Space>
        ) : (
          <Button
            type="primary"
            onClick={() => navigate(`/administrador/contratos-alquiler/create?unidad_id=${unidad?.id}`)}
          >
            Crear contrato
          </Button>
        )}
      </Flex>
      <Skeleton active loading={cargandoContrato}>
        {contrato ? (
          <Descriptions column={{ xs: 1, md: 2, xl: 3 }} size="small" style={{ paddingLeft: 24 }}>
            <Descriptions.Item label="Inquilino">{contrato.inquilino.nombre}</Descriptions.Item>
            <Descriptions.Item label="Inicio">{dayjs(contrato.fecha_inicio).format("DD/MM/YYYY")}</Descriptions.Item>
            <Descriptions.Item label="Fin">{dayjs(contrato.fecha_fin).format("DD/MM/YYYY")}</Descriptions.Item>
            <Descriptions.Item label="Monto de alquiler">
              <Typography.Text strong>
                {contrato.monto_alquiler_vigente !== undefined && contrato.monto_alquiler_vigente !== null
                  ? formatMonto(contrato.monto_alquiler_vigente)
                  : "—"}
              </Typography.Text>
            </Descriptions.Item>
            <Descriptions.Item label="Día de vencimiento">{contrato.dia_vencimiento}</Descriptions.Item>
            <Descriptions.Item label="Expensas a cargo de">
              {EXPENSAS_A_CARGO_LABEL[contrato.expensas_a_cargo_de]}
            </Descriptions.Item>
          </Descriptions>
        ) : (
          <Empty description="Esta unidad no tiene un contrato vigente." image={Empty.PRESENTED_IMAGE_SIMPLE} />
        )}
      </Skeleton>

      {unidad?.contrato_futuro_id && (
        <>
          <SectionDivider icon={<CalendarOutlined />}>
            Próximo contrato
            <Tag color={CONTRATO_ALQUILER_ESTADO_COLOR.FUTURO} style={{ marginLeft: 12 }}>
              {CONTRATO_ALQUILER_ESTADO_LABEL.FUTURO}
            </Tag>
          </SectionDivider>
          <Skeleton active loading={cargandoFuturo}>
            {contratoFuturo && (
              <Descriptions column={{ xs: 1, md: 2, xl: 3 }} size="small" style={{ paddingLeft: 24 }}>
                <Descriptions.Item label="Inquilino">{contratoFuturo.inquilino.nombre}</Descriptions.Item>
                <Descriptions.Item label="Inicio">
                  {dayjs(contratoFuturo.fecha_inicio).format("DD/MM/YYYY")}
                </Descriptions.Item>
                <Descriptions.Item label="Fin">
                  {dayjs(contratoFuturo.fecha_fin).format("DD/MM/YYYY")}
                </Descriptions.Item>
              </Descriptions>
            )}
          </Skeleton>
        </>
      )}

      <Flex align="center" gap={16}>
        <div style={{ flex: 1 }}>
          <SectionDivider icon={<DollarOutlined />}>Gastos</SectionDivider>
        </div>
        <Space>
          <Button onClick={verGastos}>Ver gastos</Button>
          <Button type="primary" onClick={() => navigate(`/administrador/gastos/create?unidad_id=${unidad?.id}`)}>
            Registrar gasto
          </Button>
        </Space>
      </Flex>
    </Show>
  );
};
