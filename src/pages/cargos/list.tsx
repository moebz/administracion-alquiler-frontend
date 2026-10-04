import { useState } from "react";
import { List, useTable } from "@refinedev/antd";
import { usePermissions } from "@refinedev/core";
import { StopOutlined } from "@ant-design/icons";
import { App, Button, Input, Space, Table, Tag, Tooltip } from "antd";
import dayjs from "dayjs";
import { Link, useNavigate } from "react-router";
import { extractErrorMessage } from "../../providers/auth";
import { kyInstance } from "../../providers/data";
import { formatMonto } from "../../utils/monto";
import { CargoListFilters } from "./cargo-list-filters";
import { buildFiltrosCargos, FILTROS_CARGOS_INICIALES } from "./filtros";
import { GenerarCargosModal } from "./generar-cargos-modal";
import { CARGO_ESTADO_COLOR, CARGO_ESTADO_LABEL, CARGO_TIPO_LABEL, type CargoRow } from "./types";

export const CargoList = () => {
  const { tableProps, tableQuery, setFilters } = useTable<CargoRow>({
    syncWithLocation: true,
    filters: { initial: buildFiltrosCargos(FILTROS_CARGOS_INICIALES) },
  });
  const { message, modal } = App.useApp();
  const navigate = useNavigate();
  const { data: permissions } = usePermissions<string[]>({});
  const puedeGenerar = permissions?.includes("cargos.generar") ?? false;
  const puedeCrear = permissions?.includes("cargos.crear") ?? false;
  const puedeAnular = permissions?.includes("cargos.anular") ?? false;

  const [generando, setGenerando] = useState(false);

  const anular = (cargo: CargoRow) => {
    let motivo = "";

    modal.confirm({
      title: "¿Anular este cargo?",
      content: (
        <Input.TextArea
          rows={3}
          maxLength={255}
          placeholder="Motivo de la anulación"
          onChange={(event) => {
            motivo = event.target.value;
          }}
        />
      ),
      okText: "Anular",
      okButtonProps: { danger: true },
      cancelText: "Cancelar",
      onOk: async () => {
        if (!motivo.trim()) {
          message.error("Ingresá el motivo de la anulación.");
          throw new Error("motivo requerido");
        }

        const response = await kyInstance.patch(`cargos/${cargo.id}/anular`, { json: { motivo_anulacion: motivo } });
        if (!response.ok) {
          message.error(await extractErrorMessage(response, "No se pudo anular el cargo."));
          throw new Error("anulación rechazada");
        }

        message.success("Cargo anulado.");
        tableQuery.refetch();
      },
    });
  };

  return (
    <List
      title="Cargos"
      headerButtons={() => (
        <Space>
          {puedeGenerar && <Button onClick={() => setGenerando(true)}>Generar cargos</Button>}
          {puedeCrear && (
            <Button type="primary" onClick={() => navigate("/administrador/cargos/create")}>
              Nuevo cargo
            </Button>
          )}
        </Space>
      )}
    >
      <CargoListFilters onChange={(filters) => setFilters(filters, "replace")} />
      <Table {...tableProps} rowKey="id" scroll={{ x: "max-content" }}>
        <Table.Column
          title="Inquilino / Unidad"
          dataIndex="contrato"
          render={(contrato: CargoRow["contrato"]) => (
            <Link to={`/administrador/contratos-alquiler/edit/${contrato.id}`}>
              <div>{contrato.inquilino.nombre}</div>
              <span>
                {contrato.unidad.bloque.edificio.nombre} - {contrato.unidad.bloque.nombre} - {contrato.unidad.numero}
              </span>
            </Link>
          )}
        />
        <Table.Column
          title="Período"
          dataIndex="periodo"
          render={(periodo: CargoRow["periodo"]) => dayjs(`${periodo}-01`).format("MM/YYYY")}
        />
        <Table.Column title="Tipo" dataIndex="tipo" render={(tipo: CargoRow["tipo"]) => CARGO_TIPO_LABEL[tipo]} />
        <Table.Column title="Descripción" dataIndex="descripcion" />
        <Table.Column
          title="Vencimiento"
          dataIndex="fecha_vencimiento"
          render={(fecha: CargoRow["fecha_vencimiento"]) => dayjs(fecha).format("DD/MM/YYYY")}
        />
        <Table.Column title="Monto" dataIndex="monto" render={(monto: CargoRow["monto"]) => formatMonto(monto)} />
        <Table.Column title="Saldo" dataIndex="saldo" render={(saldo: CargoRow["saldo"]) => formatMonto(saldo)} />
        <Table.Column
          title="Mora al día"
          dataIndex="mora_al_dia"
          render={(mora: CargoRow["mora_al_dia"], record: CargoRow) =>
            Number(mora) > 0 ? (
              <Tooltip title={`${record.dias_atraso} días de atraso`}>
                <span>{formatMonto(mora)}</span>
              </Tooltip>
            ) : (
              "—"
            )
          }
        />
        <Table.Column
          title="Estado"
          dataIndex="estado"
          render={(estado: CargoRow["estado"], record: CargoRow) => (
            <Space size={4} wrap>
              <Tooltip title={record.motivo_anulacion}>
                <Tag color={CARGO_ESTADO_COLOR[estado]}>{CARGO_ESTADO_LABEL[estado]}</Tag>
              </Tooltip>
              {puedeAnular && estado !== "ANULADO" && (
                <Tooltip title="Anular cargo">
                  <Button size="small" danger icon={<StopOutlined />} onClick={() => anular(record)} />
                </Tooltip>
              )}
            </Space>
          )}
        />
      </Table>
      {generando && (
        <GenerarCargosModal
          onClose={() => setGenerando(false)}
          onSuccess={() => {
            setGenerando(false);
            tableQuery.refetch();
          }}
        />
      )}
    </List>
  );
};
