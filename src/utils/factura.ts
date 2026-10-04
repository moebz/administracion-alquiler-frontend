export type TasaIva = 0 | 5 | 10;

export type LineaFactura = {
  cantidad?: number | null;
  precio_unitario?: number | null;
  tasa_iva?: number | null;
};

export const subtotalLinea = (linea: LineaFactura) =>
  Math.round((linea.cantidad ?? 0) * (linea.precio_unitario ?? 0));

export const totalesFactura = (lineas: LineaFactura[]) => {
  const gravadas = { exentas: 0, gravadas_5: 0, gravadas_10: 0 };

  for (const linea of lineas) {
    const subtotal = subtotalLinea(linea);
    if (linea.tasa_iva === 5) gravadas.gravadas_5 += subtotal;
    else if (linea.tasa_iva === 10) gravadas.gravadas_10 += subtotal;
    else gravadas.exentas += subtotal;
  }

  return {
    ...gravadas,
    iva_5: Math.round(gravadas.gravadas_5 / 21),
    iva_10: Math.round(gravadas.gravadas_10 / 11),
    total: gravadas.exentas + gravadas.gravadas_5 + gravadas.gravadas_10,
  };
};
