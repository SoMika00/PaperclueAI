/* Shim: date formatting helper used by the ported promo dialog. */
export function formatDate(value?: string | number | Date): string {
  if (!value) return "";
  const d = new Date(value);
  return Number.isNaN(d.getTime())
    ? ""
    : d.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
}
export function getDateFromTimestamp(timestamp: number): string {
  return formatDate(timestamp);
}
export default formatDate;
