/** Định dạng số tiền VND theo quy ước SRS 1.3, ví dụ 45000 → "45.000 ₫". */
export function formatVnd(amount: number): string {
  const digits = Math.round(amount).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return `${digits} ₫`;
}
