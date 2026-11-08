import { KeyOutlined } from "@ant-design/icons";
import { List, useTable } from "@refinedev/antd";
import { Space, Table, Tag, Typography } from "antd";
import { PageTitle } from "../../components/page-title";
import { MontoCell } from "../cuentas-corrientes/movimientos-table";
import { armarTextoDeContrato, armarTextoDePago, armarTextoSinContrato } from "./textos";
import type { UnidadDelPortal } from "./types";

// Unidades del propietario con su inquilino, el alquiler, el contrato y si el inquilino está al día con el alquiler.
// Solo lee: todo entra en la fila, no hay detalle.
export const PropietarioUnidadList = () => {
  const { tableProps } = useTable<UnidadDelPortal>({ resource: "propietario/unidades", pagination: { mode: "off" } });

  return (
    <List title={<PageTitle icon={<KeyOutlined />}>Mis unidades</PageTitle>}>
      <Table<UnidadDelPortal> {...tableProps} rowKey="id" scroll={{ x: "max-content" }}>
        <Table.Column title="Unidad" dataIndex="etiqueta" />
        <Table.Column
          title="Inquilino"
          render={(_, unidad: UnidadDelPortal) => {
            // Con contrato vigente, el nombre del inquilino.
            if (unidad.contrato !== null) {
              return unidad.contrato.inquilino;
            }

            // Sin contrato vigente: vacía, o alquilada desde la fecha de un contrato por empezar.
            const sinContrato = armarTextoSinContrato(unidad);
            return (
              <Space size={4} wrap>
                <Tag>{sinContrato.etiqueta}</Tag>
                {sinContrato.inquilino}
              </Space>
            );
          }}
        />
        <Table.Column
          title="Alquiler"
          align="right"
          render={(_, unidad: UnidadDelPortal) =>
            unidad.contrato?.monto_alquiler ? <MontoCell monto={unidad.contrato.monto_alquiler} /> : null
          }
        />
        <Table.Column
          title="Contrato"
          render={(_, unidad: UnidadDelPortal) => (unidad.contrato ? armarTextoDeContrato(unidad.contrato) : null)}
        />
        <Table.Column
          title="Pago del alquiler"
          render={(_, unidad: UnidadDelPortal) => {
            // Sin contrato vigente no hay inquilino a quien medir.
            if (unidad.atraso === null) {
              return null;
            }

            const pago = armarTextoDePago(unidad.atraso);
            return (
              <Space size={4} wrap>
                <Tag color={unidad.atraso.al_dia ? "green" : "red"}>{pago.etiqueta}</Tag>
                {pago.detalle && <Typography.Text>{pago.detalle}</Typography.Text>}
              </Space>
            );
          }}
        />
      </Table>
    </List>
  );
};
