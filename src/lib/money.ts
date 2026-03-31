export const formatFCFA = (value: number | string | null | undefined) => {
  const amount = Number(value ?? 0);
  return `${new Intl.NumberFormat("fr-CM", {
    style: "decimal",
    maximumFractionDigits: 0,
  }).format(Number.isFinite(amount) ? amount : 0)} FCFA`;
};
