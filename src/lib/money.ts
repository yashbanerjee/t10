export function formatMoney(value: number) {
  return new Intl.NumberFormat("en-AE", { style: "currency", currency: "AED" }).format(value);
}
