export function parseCsv<T>(text: string): T[] {
  const [header, ...rows] = text.trim().split(/\r?\n/);
  if (!header) return [];
  const keys = header.split(",").map((x) => x.trim());
  return rows.filter(Boolean).map((row) =>
    Object.fromEntries(row.split(",").map((value, index) => [keys[index], value.trim()]))
  ) as T[];
}
