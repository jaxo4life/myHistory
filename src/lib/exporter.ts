import type { Visit } from '../types/visit';
import type { CategoryDef } from './categories';

const CSV_HEADERS = ['visitTime', 'dayKey', 'domain', 'title', 'url', 'transitionType', 'tags'];

function csvEscape(value: unknown): string {
  const s = String(value ?? '');
  if (/[",\n\r]/.test(s)) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

export function visitsToCSV(visits: Visit[]): string {
  const lines = [CSV_HEADERS.join(',')];
  for (const v of visits) {
    lines.push(
      [v.visitTime, v.dayKey, v.domain, v.title, v.url, v.transitionType, (v.tags ?? []).join(';')]
        .map(csvEscape)
        .join(','),
    );
  }
  return lines.join('\n');
}

export function visitsToJSON(visits: Visit[]): string {
  return JSON.stringify(visits, null, 2);
}

export function categoriesToJSON(categories: CategoryDef[]): string {
  return JSON.stringify(categories, null, 2);
}

export function stampedFilename(base: string, ext: string): string {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, '0');
  const ts = `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}_${p(d.getHours())}-${p(d.getMinutes())}-${p(d.getSeconds())}`;
  return `${base}-${ts}.${ext}`;
}

export function parseCategories(text: string): CategoryDef[] {
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    return [];
  }
  if (!Array.isArray(data)) return [];
  const result: CategoryDef[] = [];
  for (const raw of data) {
    if (typeof raw !== 'object' || raw === null) continue;
    const r = raw as Record<string, unknown>;
    if (typeof r.name !== 'string' || !r.name.trim() || !Array.isArray(r.patterns)) continue;
    result.push({
      name: r.name.trim(),
      icon: typeof r.icon === 'string' ? r.icon : undefined,
      color: typeof r.color === 'string' ? r.color : undefined,
      patterns: r.patterns.filter((p): p is string => typeof p === 'string'),
    });
  }
  return result;
}

export function downloadText(filename: string, content: string, mime = 'text/plain'): void {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
