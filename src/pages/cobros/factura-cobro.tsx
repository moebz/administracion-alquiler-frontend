import { FileDoneOutlined } from "@ant-design/icons";
import { Descriptions, Table, Tag, Tooltip, Typography } from "antd";
import dayjs from "dayjs";
import { Link } from "react-router";
import { SectionDivider } from "../../components/section-divider";
import { formatMonto } from "../../utils/monto";
import type { CobroFacturaDetalleRow, CobroFacturaRow } from "./types";

// Líneas de totales de la factura, en el orden en que se leen en una factura impresa.
const TOTALES_FACTURA: {
  label: string;
  key: "exentas" | "gravadas_5" | "iva_5" | "gravadas_10" | "iva_10";
}[] = [
  { label: "Exentas", key: "exentas" },
  { label: "Gravadas 5%", key: "gravadas_5" },
  { label: "IVA 5%", key: "iva_5" },
  { label: "Gravadas 10%", key: "gravadas_10" },
  { label: "IVA 10%", key: "iva_10" },
];

type FacturaCobroProps = {
  factura: CobroFacturaRow;
};

// Una factura al inquilino a la que se aplica el cobro: la que emitió este cobro o una que ya estaba
// abierta (por ejemplo, la de un cobro anulado) y este cobro saldó.
export const FacturaCobro = ({ factura }: FacturaCobroProps) => (
  <>
    <SectionDivider icon={<FileDoneOutlined />}>
      {factura.emitida_por_este_cobro ? "Factura emitida" : "Factura cobrada"}
    </SectionDivider>
    <Descriptions
      column={{ xs: 1, md: 2, xl: 3 }}
      size="small"
      style={{ marginBottom: 16 }}
    >
      <Descriptions.Item label="Número">
        {factura.numero ?? "—"}
      </Descriptions.Item>
      <Descriptions.Item label="Fecha">
        {dayjs(factura.fecha).format("DD/MM/YYYY")}
      </Descriptions.Item>
      <Descriptions.Item label="Condición">Contado</Descriptions.Item>
      <Descriptions.Item label="Estado">
        {factura.estado === "ANULADO" ? (
          <Tag color="default">Anulada</Tag>
        ) : (
          <Tag color="green">Emitida</Tag>
        )}
      </Descriptions.Item>
      {/* Mostrar el saldo solo si la factura sigue debiendo algo (por ejemplo, con este cobro anulado). */}
      {factura.estado === "EMITIDO" && Number(factura.saldo) > 0 && (
        <Descriptions.Item label="Saldo pendiente">
          {formatMonto(factura.saldo)}
        </Descriptions.Item>
      )}
      {factura.estado === "ANULADO" && (
        <Descriptions.Item label="Motivo de anulación">
          {factura.motivo_anulacion}
        </Descriptions.Item>
      )}
    </Descriptions>
    <Table
      dataSource={factura.detalles}
      rowKey="id"
      pagination={false}
      size="small"
      summary={() => (
        <Table.Summary>
          {TOTALES_FACTURA.filter(({ key }) => Number(factura[key]) !== 0).map(
            ({ label, key }) => (
              <Table.Summary.Row key={key}>
                <Table.Summary.Cell index={0} colSpan={2} align="right">
                  <Typography.Text type="secondary">{label}</Typography.Text>
                </Table.Summary.Cell>
                <Table.Summary.Cell index={2} align="right">
                  {formatMonto(factura[key])}
                </Table.Summary.Cell>
              </Table.Summary.Row>
            )
          )}
          <Table.Summary.Row>
            <Table.Summary.Cell index={0} colSpan={2} align="right">
              <Typography.Text strong>Total</Typography.Text>
            </Table.Summary.Cell>
            <Table.Summary.Cell index={2} align="right">
              <Typography.Text strong>
                {formatMonto(factura.total)}
              </Typography.Text>
            </Table.Summary.Cell>
          </Table.Summary.Row>
        </Table.Summary>
      )}
    >
      <Table.Column
        title="Descripción"
        dataIndex="descripcion"
        render={(
          descripcion: CobroFacturaDetalleRow["descripcion"],
          record: CobroFacturaDetalleRow
        ) =>
          record.cargo_id ? (
            <Tooltip title="Ver cargo">
              <Link
                to={`/administrador/cargos?cargo_id=${record.cargo_id}&todos_los_estados=1`}
              >
                {descripcion}
              </Link>
            </Tooltip>
          ) : (
            descripcion
          )
        }
      />
      <Table.Column
        title="IVA"
        dataIndex="tasa_iva"
        render={(tasa: CobroFacturaDetalleRow["tasa_iva"]) =>
          tasa === 0 ? "Exenta" : `${tasa}%`
        }
      />
      <Table.Column
        title="Subtotal"
        dataIndex="subtotal"
        align="right"
        render={(subtotal: CobroFacturaDetalleRow["subtotal"]) =>
          formatMonto(subtotal)
        }
      />
    </Table>
  </>
);
