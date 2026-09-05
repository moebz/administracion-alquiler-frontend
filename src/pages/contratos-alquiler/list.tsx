import { useState } from "react";
import { EditButton, List, useTable } from "@refinedev/antd";
import type { CrudFilter } from "@refinedev/core";
import { App, Button, DatePicker, Popconfirm, Select, Space, Table, Tag } from "antd";
import type { Dayjs } from "dayjs";
import { kyInstance } from "../../providers/data";
import { extractErrorMessage } from "../../providers/auth";
import {
  CONTRATO_ALQUILER_ESTADO_COLOR,
  CONTRATO_ALQUILER_ESTADO_LABEL,
  CONTRATO_ALQUILER_ESTADO_OPTIONS,
  type ContratoAlquilerEstado,
  type ContratoAlquilerRow,
} from "./types";

const { RangePicker } = DatePicker;

type RangoFechas = [Dayjs, Dayjs] | null;

export const ContratoAlquilerList = () => {
  const { tableProps, tableQuery, setFilters } = useTable<ContratoAlquilerRow>({
    syncWithLocation: true,
    sorters: { initial: [{ field: "fecha_inicio", order: "desc" }] },
  });
  const { message } = App.useApp();

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

  const rescindir = async (record: ContratoAlquilerRow) => {
    const response = await kyInstance.patch(`contratos-alquiler/${record.id}/rescindir`);
    if (response.ok) {
      message.success("Contrato rescindido.");
      tableQuery.refetch();
    } else {
      message.error(await extractErrorMessage(response, "No se pudo rescindir el contrato."));
    }
  };

  return (
    // Sin botón "Crear": los contratos se crean desde la unidad
    // (pages/unidades/list.tsx, "Crear contrato"), que precarga unidad_id.
    // title explícito: sin esto, Refine arma el título default con
    // pluralize.plural() sobre el label del resource, y esa librería no
    // entiende español — "Contratos de alquiler" queda "Contratos de
    // alquilers" (mismo motivo por el que Create/Edit ya lo hacen).
    <List headerButtons={() => null} title="Contratos de alquiler">
      <Space wrap style={{ marginBottom: 16 }}>
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
      </Space>
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
          dataIndex="monto_alquiler"
          render={(monto: number) => monto.toLocaleString("es-UY", { style: "currency", currency: "UYU" })}
        />
        <Table.Column title="Día venc." dataIndex="dia_vencimiento" />
        <Table.Column
          title="Mora diaria"
          dataIndex="porcentaje_mora_diario"
          render={(porcentaje: number) => `${porcentaje}%`}
        />
        <Table.Column dataIndex="fecha_inicio" title="Inicio" />
        <Table.Column dataIndex="fecha_fin" title="Fin" />
        <Table.Column
          title="Estado"
          dataIndex="estado"
          render={(estadoContrato: ContratoAlquilerRow["estado"]) => (
            <Tag color={CONTRATO_ALQUILER_ESTADO_COLOR[estadoContrato]}>
              {CONTRATO_ALQUILER_ESTADO_LABEL[estadoContrato]}
            </Tag>
          )}
        />
        <Table.Column
          title="Acciones"
          dataIndex="actions"
          render={(_, record: ContratoAlquilerRow) => (
            <Space>
              <EditButton hideText size="small" recordItemId={record.id} />
              {record.estado === "VIGENTE" && (
                <Popconfirm
                  title="¿Rescindir este contrato?"
                  okText="Rescindir"
                  cancelText="Cancelar"
                  onConfirm={() => rescindir(record)}
                >
                  <Button size="small" danger>
                    Rescindir
                  </Button>
                </Popconfirm>
              )}
            </Space>
          )}
        />
      </Table>
    </List>
  );
};
