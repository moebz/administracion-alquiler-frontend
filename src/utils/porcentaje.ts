export const formatPorcentaje = (porcentaje: number | string) =>
  `${Number(porcentaje).toLocaleString("es-PY", { maximumFractionDigits: 4 })}%`;
