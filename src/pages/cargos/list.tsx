import { useState } from "react";
import { List, useTable } from "@refinedev/antd";
import { usePermissions } from "@refinedev/core";
import { StopOutlined } from "@ant-design/icons";
import { Alert, App, Button, Input, Space, Table, Tag, Tooltip, Typography } from "antd";
import dayjs from "dayjs";
import { Link, useNavigate, useSearchParams } from "react-router";
import { extractErrorMessage } from "../../providers/auth";
import { kyInstance } from "../../providers/data";
import { formatMonto } from "../../utils/monto";
import { CargoListFilters } from "./cargo-list-filters";
import { buildFiltrosCargos, FILTROS_CARGOS_INICIALES } from "./filtros";
import { GenerarCargosModal } from "./generar-cargos-modal";
import { CARGO_ESTADO_COLOR, CARGO_ESTADO_LABEL, CARGO_TIPO_LABEL, type CargoRow } from "./types";

export const CargoList = () => {
  // Prefiltrar por contrato cuando se llega desde "Ver cargos" del detalle de la unidad, o por gasto desde el detalle del gasto.
  const [searchParams] = useSearchParams();
  const contratoParam = Number(searchParams.get("contrato_id"));
  const gastoParam = Number(searchParams.get("gasto_id"));
  // Mostrar todos los estados (no solo pendientes) cuando se llega a ver un cargo puntual, que puede estar pagado o anulado.
  const todosLosEstados = searchParams.get("todos_los_estados") === "1";
  const filtrosIniciales = {
    ...FILTROS_CARGOS_INICIALES,
    contratoId: contratoParam > 0 ? contratoParam : undefined,
    gastoId: gastoParam > 0 ? gastoParam : undefined,
    ...(todosLosEstados ? { estados: [] } : {}),
  };

  const { tableProps, tableQuery, setFilters } = useTable<CargoRow>({
    syncWithLocation: true,
    filters: { initial: buildFiltrosCargos(filtrosIniciales) },
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
        <>
          {cargo.gasto && (
            <Alert
              type="warning"
              showIcon
              style={{ marginBottom: 16 }}
              message="Este cargo viene de un gasto: al anularlo, el gasto queda sin recuperar y lo absorbe la administradora."
            />
          )}
          <Input.TextArea
            rows={3}
            maxLength={255}
            placeholder="Motivo de la anulación"
            onChange={(event) => {
              motivo = event.target.value;
            }}
          />
        </>
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
      <CargoListFilters inicial={filtrosIniciales} onChange={(filters) => setFilters(filters, "replace")} />
      <Table {...tableProps} rowKey="id" scroll={{ x: "max-content" }}>
        <Table.Column
          title="Inquilino / Unidad"
          dataIndex="contrato"
          render={(contrato: CargoRow["contrato"]) => (
            <>
              <div>{contrato.inquilino.nombre}</div>
              <Link to={`/administrador/unidades/show/${contrato.unidad.id}`}>
                {contrato.unidad.bloque.edificio.nombre} - {contrato.unidad.bloque.nombre} - {contrato.unidad.numero}
              </Link>
            </>
          )}
        />
        <Table.Column
          title="Cargo"
          dataIndex="descripcion"
          render={(descripcion: CargoRow["descripcion"], record: CargoRow) => (
            <>
              <div>
                {record.gasto ? (
                  <Tooltip title="Ver el gasto de origen">
                    <Link to={`/administrador/gastos/show/${record.gasto.id}`}>{descripcion}</Link>
                  </Tooltip>
                ) : (
                  descripcion
                )}
              </div>
              <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                Tipo: {CARGO_TIPO_LABEL[record.tipo]} · Período: {dayjs(`${record.periodo}-01`).format("MM/YYYY")}
              </Typography.Text>
            </>
          )}
        />
        <Table.Column
          title="Monto"
          dataIndex="monto"
          render={(monto: CargoRow["monto"], record: CargoRow) => (
            <>
              <div>{formatMonto(monto)}</div>
              <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                IVA {record.tasa_iva}%
              </Typography.Text>
            </>
          )}
        />
        <Table.Column
          title="Saldo"
          dataIndex="saldo"
          render={(saldo: CargoRow["saldo"], record: CargoRow) => (
            <>
              <div>{formatMonto(saldo)}</div>
              {/* Mostrar la mora solo si corre: es lo que se suma al saldo al cobrar. */}
              {Number(record.mora_al_dia) > 0 && (
                <Typography.Text type="danger" style={{ fontSize: 12 }}>
                  + mora {formatMonto(record.mora_al_dia)} ({record.dias_atraso} días)
                </Typography.Text>
              )}
            </>
          )}
        />
        <Table.Column
          title="Vencimiento"
          dataIndex="fecha_vencimiento"
          render={(fecha: CargoRow["fecha_vencimiento"]) => dayjs(fecha).format("DD/MM/YYYY")}
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
