/**
 * Philippine mobile: strip non-digits, cap length, format as 09XX-XXX-XXXX.
 * Pasted 10-digit numbers starting with 9 get a leading 0.
 */
export function sanitizePhilippineMobileInput(raw: string): string {
  let d = raw.replace(/\D/g, "");
  if (d.length === 10 && d.startsWith("9")) d = `0${d}`;
  d = d.slice(0, 11);
  if (d.length === 0) return "";
  if (d.length <= 4) return d;
  if (d.length <= 7) return `${d.slice(0, 4)}-${d.slice(4)}`;
  return `${d.slice(0, 4)}-${d.slice(4, 7)}-${d.slice(7)}`;
}
