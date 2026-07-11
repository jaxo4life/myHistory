const POS_KEY = 'history-plus:floating-pos';
const SETTINGS_KEY = 'history-plus:settings';
const CARD_WIDTH = 168;
const DRAG_THRESHOLD = 5;
const REFRESH_DEBOUNCE = 500;

type Locale = 'zh' | 'en';
type TopCategory = { name: string; icon: string; color: string };
type StatsResponse =
  | { todayCount: number; siteCount: number; topCategory: TopCategory | null; locale: Locale }
  | { error: true };

const LABELS: Record<Locale, { today: string; site: string; top: string }> = {
  zh: { today: '今日访问', site: '本站累计', top: '今日主力' },
  en: { today: 'Today', site: 'This site', top: 'Top' },
};

async function fetchStats(domain: string): Promise<StatsResponse> {
  // 最多重试 2 次（覆盖 SW 冷启动 / backfill 期间的暂时性失败）
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const res = await chrome.runtime.sendMessage({ type: 'FLOATING_STATS', domain });
      if (res && typeof res === 'object' && 'todayCount' in res) {
        return res as StatsResponse;
      }
    } catch {
      // messaging 失败，落入重试
    }
    if (attempt === 0) await new Promise((r) => setTimeout(r, 1000));
  }
  return { error: true };
}

interface Widget {
  host: HTMLDivElement;
  card: HTMLDivElement;
  labels: { today: HTMLSpanElement; site: HTMLSpanElement; top: HTMLSpanElement };
  values: { today: HTMLSpanElement; site: HTMLSpanElement; cat: HTMLSpanElement };
}

function makeRow(key: string): {
  row: HTMLDivElement;
  label: HTMLSpanElement;
  value: HTMLSpanElement;
} {
  const row = document.createElement('div');
  row.className = 'row';
  const label = document.createElement('span');
  label.className = 'label';
  const value = document.createElement('span');
  value.className = 'value';
  value.dataset.k = key;
  value.textContent = '–';
  row.appendChild(label);
  row.appendChild(value);
  return { row, label, value };
}

function buildWidget(locale: Locale): Widget {
  const host = document.createElement('div');
  host.id = 'history-plus-floating-stats';
  host.style.cssText =
    'all:initial;position:fixed;z-index:2147483647;left:16px;bottom:16px;';

  const root = host.attachShadow({ mode: 'open' });

  const style = document.createElement('style');
  style.textContent = `
    .card {
      width: ${CARD_WIDTH}px;
      padding: 7px 10px;
      border-radius: 10px;
      background: rgba(20,20,22,0.82);
      backdrop-filter: blur(8px);
      color: #fff;
      font: 11px/1.4 -apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif;
      box-shadow: 0 4px 16px rgba(0,0,0,0.2);
      cursor: default;
      user-select: none;
      -webkit-user-select: none;
    }
    .card.dragging { cursor: grabbing; }
    .row { display:flex; justify-content:space-between; align-items:center; gap:8px; }
    .row + .row { margin-top: 1px; }
    .label { color: rgba(255,255,255,0.7); }
    .value { font-weight: 600; }
  `;
  root.appendChild(style);

  const card = document.createElement('div');
  card.className = 'card';
  const today = makeRow('today');
  const site = makeRow('site');
  const cat = makeRow('cat');
  today.label.textContent = LABELS[locale].today;
  site.label.textContent = LABELS[locale].site;
  cat.label.textContent = LABELS[locale].top;
  card.appendChild(today.row);
  card.appendChild(site.row);
  card.appendChild(cat.row);
  root.appendChild(card);

  return {
    host,
    card,
    labels: { today: today.label, site: site.label, top: cat.label },
    values: { today: today.value, site: site.value, cat: cat.value },
  };
}

function render(widget: Widget, res: StatsResponse): void {
  const { labels, values } = widget;
  if ('error' in res) {
    values.today.textContent = '–';
    values.site.textContent = '–';
    values.cat.textContent = '–';
    values.cat.style.color = '';
    return;
  }
  // 标签跟随 locale
  labels.today.textContent = LABELS[res.locale].today;
  labels.site.textContent = LABELS[res.locale].site;
  labels.top.textContent = LABELS[res.locale].top;
  values.today.textContent = String(res.todayCount);
  values.site.textContent = String(res.siteCount);
  if (res.topCategory) {
    values.cat.textContent = `${res.topCategory.icon} ${res.topCategory.name}`;
    values.cat.style.color = res.topCategory.color;
  } else {
    values.cat.textContent = '–';
    values.cat.style.color = '';
  }
}

export default defineContentScript({
  matches: ['http://*/*', 'https://*/*'],
  async main() {
    const domain = location.hostname;

    // 一次性读位置 + 语言
    const data = await chrome.storage.local.get([POS_KEY, SETTINGS_KEY]);
    const stored = data[POS_KEY] as { left: number; top: number } | undefined;
    const locale = (
      (data[SETTINGS_KEY] as { locale?: Locale } | undefined)?.locale ?? 'zh'
    ) as Locale;

    const widget = buildWidget(locale);
    const { host, card } = widget;

    if (stored && typeof stored.left === 'number' && typeof stored.top === 'number') {
      host.style.left = `${stored.left}px`;
      host.style.top = `${stored.top}px`;
      host.style.bottom = 'auto';
    }
    document.documentElement.appendChild(host);

    // —— 拖拽 ——
    let dragging = false;
    let moved = false;
    let startX = 0;
    let startY = 0;
    let origLeft = 0;
    let origTop = 0;

    card.addEventListener('pointerdown', (e) => {
      dragging = true;
      moved = false;
      startX = e.clientX;
      startY = e.clientY;
      const rect = host.getBoundingClientRect();
      origLeft = rect.left;
      origTop = rect.top;
      card.classList.add('dragging');
    });

    document.addEventListener('pointermove', (e) => {
      if (!dragging) return;
      const dx = e.clientX - startX;
      const dy = e.clientY - startY;
      if (!moved && Math.abs(dx) <= DRAG_THRESHOLD && Math.abs(dy) <= DRAG_THRESHOLD) return;
      moved = true;
      const maxLeft = window.innerWidth - host.offsetWidth;
      const maxTop = window.innerHeight - host.offsetHeight;
      const left = Math.max(0, Math.min(maxLeft, origLeft + dx));
      const top = Math.max(0, Math.min(maxTop, origTop + dy));
      host.style.left = `${left}px`;
      host.style.top = `${top}px`;
      host.style.bottom = 'auto';
    });

    document.addEventListener('pointerup', async () => {
      if (!dragging) return;
      dragging = false;
      card.classList.remove('dragging');
      if (moved) {
        const left = parseFloat(host.style.left) || 0;
        const top = parseFloat(host.style.top) || 0;
        await chrome.storage.local.set({ [POS_KEY]: { left, top } });
      }
    });

    // —— 刷新调度（无轮询：idle 一次 + visibility/storage 变化 debounce）——
    let timer: number | undefined;
    const refresh = () => {
      fetchStats(domain).then((res) => render(widget, res));
    };
    const schedule = () => {
      if (timer !== undefined) window.clearTimeout(timer);
      timer = window.setTimeout(refresh, REFRESH_DEBOUNCE);
    };
    const kick = () => {
      const idle = (window as unknown as { requestIdleCallback?: (cb: () => void) => void })
        .requestIdleCallback;
      if (idle) idle(refresh);
      else window.setTimeout(refresh, 200);
    };

    kick();
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') schedule();
    });
    // 用户改语言/分类 → background 失效缓存 → 重新拉取并按新 locale 渲染
    chrome.storage.onChanged.addListener((changes, area) => {
      if (area === 'local' && changes[SETTINGS_KEY]) schedule();
    });
  },
});
