// Number(): los campos `decimal:2` del backend llegan como string, y un string ignora las opciones de toLocaleString.
export const formatMonto = (monto: number | string) =>
  Number(monto).toLocaleString("es-PY", { style: "currency", currency: "PYG" });
