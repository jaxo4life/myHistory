export function interpolate(
  tpl: string,
  params?: Record<string, string | number>,
): string {
  if (!params) return tpl;
  return tpl.replace(/\{(\w+)\}/g, (_, k) =>
    params[k] !== undefined ? String(params[k]) : `{${k}}`,
  );
}
