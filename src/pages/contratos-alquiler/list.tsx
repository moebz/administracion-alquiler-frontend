import { useState } from "react";
import { EditButton, List, useTable } from "@refinedev/antd";
import { usePermissions, type CrudFilter } from "@refinedev/core";
import { Button, DatePicker, Select, Space, Table, Tag, Tooltip } from "antd";
import dayjs, { type Dayjs } from "dayjs";
import { useNavigate } from "react-router";
import { FilterBar } from "../../components/filter-bar";
import { formatMonto } from "../../utils/monto";
import { formatPorcentaje } from "../../utils/porcentaje";
import {
  CONTRATO_ALQUILER_ESTADO_COLOR,
  CONTRATO_ALQUILER_ESTADO_LABEL,
  CONTRATO_ALQUILER_ESTADO_OPTIONS,
  type ContratoAlquilerEstado,
  type ContratoAlquilerRow,
} from "./types";
import { RescindirContratoModal } from "./rescindir-contrato-modal";

const { RangePicker } = DatePicker;

type RangoFechas = [Dayjs, Dayjs] | null;

export const ContratoAlquilerList = () => {
  const { tableProps, tableQuery, setFilters } = useTable<ContratoAlquilerRow>({
    syncWithLocation: true,
    sorters: { initial: [{ field: "fecha_inicio", order: "desc" }] },
  });
  const navigate = useNavigate();
  const { data: permissions } = usePermissions<string[]>({});
  const puedeCrear = permissions?.includes("contratos_alquiler.crear") ?? false;
  const puedeRescindir = permissions?.includes("contratos_alquiler.gestionar_estado") ?? false;

  const [rescindiendo, setRescindiendo] = useState<ContratoAlquilerRow>();
  const [estado, setEstado] = useState<ContratoAlquilerEstado>();
  const [venceEntre, setVenceEntre] = useState<RangoFechas>(null);

  // Mismo criterio que pages/personas/list.tsx: recalcula el array completo de filtros en cada cambio.
  const applyFilters = (overrides: { estado?: ContratoAlquilerEstado; venceEntre?: RangoFechas }) => {
    const nextEstado = "estado" in overrides ? overrides.estado : estado;
    const nextVenceEntre = "venceEntre" in overrides ? overrides.venceEntre : venceEntre;

    setEstado(nextEstado);
    setVenceEntre(nextVenceEntre ?? null);

    const filters: CrudFilter[] = [];
    if (nextEstado) {
      filters.push({ field: "estado", operator: "eq", value: nextEstado });
    }
    if (nextVenceEntre?.[0]) {
      filters.push({ field: "fecha_fin", operator: "gte", value: nextVenceEntre[0].format("YYYY-MM-DD") });
    }
    if (nextVenceEntre?.[1]) {
      filters.push({ field: "fecha_fin", operator: "lte", value: nextVenceEntre[1].format("YYYY-MM-DD") });
    }
    setFilters(filters, "replace");
  };

  return (
    // Sin botón "Crear": los contratos se crean desde la unidad
    // (pages/unidades/list.tsx, "Crear contrato"), que precarga unidad_id.
    // title explícito: sin esto, Refine arma el título default con
    // pluralize.plural() sobre el label del resource, y esa librería no
    // entiende español — "Contratos de alquiler" queda "Contratos de
    // alquilers" (mismo motivo por el que Create/Edit ya lo hacen).
    <List headerButtons={() => null} title="Contratos de alquiler">
      <FilterBar>
        <Space>
          <span>Estado</span>
          <Select
            style={{ minWidth: 160 }}
            allowClear
            placeholder="Todos"
            options={CONTRATO_ALQUILER_ESTADO_OPTIONS}
            value={estado}
            onChange={(value) => applyFilters({ estado: value })}
          />
        </Space>
        <Space>
          <span>Vence entre</span>
          <RangePicker
            format="DD/MM/YYYY"
            value={venceEntre}
            onChange={(value) => applyFilters({ venceEntre: value as RangoFechas })}
          />
        </Space>
      </FilterBar>
      <Table {...tableProps} rowKey="id">
        <Table.Column
          title="Unidad"
          dataIndex="unidad"
          render={(unidad: ContratoAlquilerRow["unidad"]) =>
            `${unidad.bloque.edificio.nombre} - ${unidad.bloque.nombre} - ${unidad.numero}`
          }
        />
        <Table.Column
          title="Propietario"
          dataIndex="unidad"
          render={(unidad: ContratoAlquilerRow["unidad"]) => unidad.propietario.nombre}
        />
        <Table.Column
          title="Inquilino"
          dataIndex="inquilino"
          render={(inquilino: ContratoAlquilerRow["inquilino"]) => inquilino.nombre}
        />
        <Table.Column
          title="Monto"
          dataIndex="monto_alquiler_vigente"
          render={(monto: ContratoAlquilerRow["monto_alquiler_vigente"]) =>
            monto === null ? "—" : formatMonto(monto)
          }
        />
        <Table.Column title="Día venc." dataIndex="dia_vencimiento" />
        <Table.Column
          title="Mora diaria"
          dataIndex="mora_pct_diario"
          render={(porcentaje: ContratoAlquilerRow["mora_pct_diario"]) => formatPorcentaje(porcentaje)}
        />
        <Table.Column
          dataIndex="fecha_inicio"
          title="Inicio"
          render={(fechaInicio: ContratoAlquilerRow["fecha_inicio"]) => dayjs(fechaInicio).format("DD/MM/YYYY")}
        />
        <Table.Column
          dataIndex="fecha_fin_efectiva"
          title="Fin"
          render={(_, record: ContratoAlquilerRow) => dayjs(record.fecha_fin_efectiva).format("DD/MM/YYYY")}
        />
        <Table.Column
          title="Estado"
          dataIndex="estado"
          render={(estadoContrato: ContratoAlquilerRow["estado"], record: ContratoAlquilerRow) => (
            <Space size={4} wrap>
              <Tag color={CONTRATO_ALQUILER_ESTADO_COLOR[estadoContrato]}>
                {CONTRATO_ALQUILER_ESTADO_LABEL[estadoContrato]}
              </Tag>
              {record.rescision_programada && (
                <Tooltip title={record.motivo_rescision}>
                  <Tag color="orange">Sale el {dayjs(record.fecha_rescision).format("DD/MM/YYYY")}</Tag>
                </Tooltip>
              )}
            </Space>
          )}
        />
        <Table.Column
          title="Acciones"
          dataIndex="actions"
          render={(_, record: ContratoAlquilerRow) => (
            <Space>
              <EditButton hideText size="small" recordItemId={record.id} />
              {puedeCrear && record.estado !== "FUTURO" && (
                <Button
                  size="small"
                  onClick={() => navigate(`/administrador/contratos-alquiler/create?renovar=${record.id}`)}
                >
                  Renovar
                </Button>
              )}
              {puedeRescindir && record.estado === "VIGENTE" && !record.fecha_rescision && (
                <Button size="small" danger onClick={() => setRescindiendo(record)}>
                  Rescindir
                </Button>
              )}
            </Space>
          )}
        />
      </Table>
      {rescindiendo && (
        <RescindirContratoModal
          contrato={rescindiendo}
          onClose={() => setRescindiendo(undefined)}
          onSuccess={() => {
            setRescindiendo(undefined);
            tableQuery.refetch();
          }}
        />
      )}
    </List>
  );
};
