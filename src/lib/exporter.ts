import type { Visit } from '../types/visit';

const CSV_HEADERS = ['visitTime', 'dayKey', 'domain', 'title', 'url', 'transitionType'];

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
      [v.visitTime, v.dayKey, v.domain, v.title, v.url, v.transitionType]
        .map(csvEscape)
        .join(','),
    );
  }
  return lines.join('\n');
}

export function visitsToJSON(visits: Visit[]): string {
  return JSON.stringify(visits, null, 2);
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
