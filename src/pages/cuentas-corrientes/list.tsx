import { List, ShowButton, useTable } from "@refinedev/antd";
import { Input, Space, Table, Tooltip, Typography } from "antd";
import { FilterBar } from "../../components/filter-bar";
import { formatMonto } from "../../utils/monto";
import type { CuentaCorrienteResumenRow } from "./types";

// Sin botón de crear: las líneas las escribe el sistema cuando nace o cambia un cargo.
export const CuentaCorrienteList = () => {
  const { tableProps, setFilters } = useTable<CuentaCorrienteResumenRow>({
    syncWithLocation: true,
  });

  return (
    <List title="Cuentas corrientes" headerButtons={() => null}>
      <FilterBar>
        <Input.Search
          allowClear
          placeholder="Buscar por nombre o documento"
          style={{ width: 280 }}
          onSearch={(value) =>
            setFilters(value ? [{ field: "search", operator: "eq", value }] : [], "replace")
          }
        />
      </FilterBar>
      <Table {...tableProps} rowKey="id" scroll={{ x: "max-content" }}>
        <Table.Column title="Propietario" dataIndex="nombre" />
        <Table.Column title="Documento" dataIndex="documento" />
        <Table.Column
          title="Saldo"
          dataIndex="saldo"
          align="right"
          render={(saldo: string, record: CuentaCorrienteResumenRow) => (
            <Space size={4} wrap>
              {/* Un saldo negativo es a favor de la administradora: se resalta. */}
              <Typography.Text type={Number(saldo) < 0 ? "danger" : undefined}>{formatMonto(saldo)}</Typography.Text>
              <Tooltip title="Ver movimientos">
                <ShowButton hideText size="small" recordItemId={record.id} />
              </Tooltip>
            </Space>
          )}
        />
      </Table>
    </List>
  );
};
