/** {name} 占位插值：把模板里的 {key} 替换为 params[key]。 */
export function interpolate(
  tpl: string,
  params?: Record<string, string | number>,
): string {
  if (!params) return tpl;
  return tpl.replace(/\{(\w+)\}/g, (_, k) =>
    params[k] !== undefined ? String(params[k]) : `{${k}}`,
  );
}
