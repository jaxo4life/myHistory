const POS_KEY = 'history-plus:floating-pos';
const SETTINGS_KEY = 'history-plus:settings';
const CARD_WIDTH = 180;
const DRAG_THRESHOLD = 5;
const REFRESH_DEBOUNCE = 500;

type Locale = 'zh' | 'en';
type TopCategory = { name: string; icon: string; color: string };
type StatsResponse =
  | { todayCount: number; siteCount: number; topCategory: TopCategory | null; locale: Locale }
  | { error: true };

const LABELS: Record<Locale, { today: string; site: string; top: string }> = {
  zh: { today: '今日总访问', site: '本站累计', top: '今日主力' },
  en: { today: 'Today', site: 'This site', top: 'Top cat' },
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
  titles: { today: HTMLSpanElement; site: HTMLSpanElement; top: HTMLSpanElement };
  values: { today: HTMLSpanElement; site: HTMLSpanElement; top: HTMLSpanElement };
}

function makeCell(key: string): {
  cell: HTMLDivElement;
  title: HTMLSpanElement;
  value: HTMLSpanElement;
} {
  const cell = document.createElement('div');
  cell.className = 'cell';
  const title = document.createElement('span');
  title.className = 'cell-title';
  const value = document.createElement('span');
  value.className = 'cell-value';
  value.dataset.k = key;
  value.textContent = '–';
  cell.appendChild(title);
  cell.appendChild(value);
  return { cell, title, value };
}

function buildWidget(locale: Locale): Widget {
  const host = document.createElement('div');
  host.id = 'history-plus-floating-stats';
  host.style.cssText = 'all:initial;position:fixed;z-index:2147483647;left:16px;bottom:16px;';

  const root = host.attachShadow({ mode: 'open' });

  const style = document.createElement('style');
  style.textContent = `
    .card {
      width: ${CARD_WIDTH}px;
      padding: 8px;
      border-radius: 12px;
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
    .grid { display:grid; grid-template-columns:1fr 1fr; gap:6px; }
    .cell { display:flex; flex-direction:column; align-items:center; gap:2px; padding:3px 2px; border-radius:8px; }
    .cell.full { grid-column:1 / -1; }
    .cell-title { font-size:10px; color:rgba(255,255,255,0.6); letter-spacing:0.02em; }
    .cell-value { font-size:16px; font-weight:700; line-height:1.15; }
    .cell.full .cell-value { font-size:20px; }
  `;
  root.appendChild(style);

  const card = document.createElement('div');
  card.className = 'card';
  const grid = document.createElement('div');
  grid.className = 'grid';
  const today = makeCell('today');
  const top = makeCell('top');
  const site = makeCell('site');
  site.cell.classList.add('full');
  today.title.textContent = LABELS[locale].today;
  top.title.textContent = LABELS[locale].top;
  site.title.textContent = LABELS[locale].site;
  grid.appendChild(today.cell);
  grid.appendChild(top.cell);
  grid.appendChild(site.cell);
  card.appendChild(grid);
  root.appendChild(card);

  return {
    host,
    card,
    titles: { today: today.title, site: site.title, top: top.title },
    values: { today: today.value, site: site.value, top: top.value },
  };
}

function render(widget: Widget, res: StatsResponse): void {
  const { titles, values } = widget;
  if ('error' in res) {
    values.today.textContent = '–';
    values.site.textContent = '–';
    values.top.textContent = '–';
    values.top.style.color = '';
    return;
  }
  titles.today.textContent = LABELS[res.locale].today;
  titles.site.textContent = LABELS[res.locale].site;
  titles.top.textContent = LABELS[res.locale].top;
  values.today.textContent = String(res.todayCount);
  values.site.textContent = String(res.siteCount);
  if (res.topCategory) {
    values.top.textContent = `${res.topCategory.icon} ${res.topCategory.name}`;
    values.top.style.color = res.topCategory.color;
  } else {
    values.top.textContent = '–';
    values.top.style.color = '';
  }
}

export default defineContentScript({
  matches: ['http://*/*', 'https://*/*'],
  async main() {
    const domain = location.hostname;
    let widget: Widget | null = null;
    let abortController: AbortController | null = null;
    let timer: number | undefined;

    const refresh = () => {
      const w = widget;
      if (w) fetchStats(domain).then((res) => render(w, res));
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

    function mount(locale: Locale, pos: { left: number; top: number } | undefined) {
      if (widget) return;
      const w = buildWidget(locale);
      widget = w;
      if (pos && typeof pos.left === 'number' && typeof pos.top === 'number') {
        w.host.style.left = `${pos.left}px`;
        w.host.style.top = `${pos.top}px`;
        w.host.style.bottom = 'auto';
      }
      document.documentElement.appendChild(w.host);

      abortController = new AbortController();
      const { signal } = abortController;

      let dragging = false;
      let moved = false;
      let startX = 0;
      let startY = 0;
      let origLeft = 0;
      let origTop = 0;

      w.card.addEventListener(
        'pointerdown',
        (e) => {
          dragging = true;
          moved = false;
          startX = e.clientX;
          startY = e.clientY;
          const rect = w.host.getBoundingClientRect();
          origLeft = rect.left;
          origTop = rect.top;
          w.card.classList.add('dragging');
        },
        { signal },
      );

      document.addEventListener(
        'pointermove',
        (e) => {
          if (!dragging) return;
          const dx = e.clientX - startX;
          const dy = e.clientY - startY;
          if (!moved && Math.abs(dx) <= DRAG_THRESHOLD && Math.abs(dy) <= DRAG_THRESHOLD) return;
          moved = true;
          const maxLeft = window.innerWidth - w.host.offsetWidth;
          const maxTop = window.innerHeight - w.host.offsetHeight;
          const left = Math.max(0, Math.min(maxLeft, origLeft + dx));
          const top = Math.max(0, Math.min(maxTop, origTop + dy));
          w.host.style.left = `${left}px`;
          w.host.style.top = `${top}px`;
          w.host.style.bottom = 'auto';
        },
        { signal },
      );

      document.addEventListener(
        'pointerup',
        async () => {
          if (!dragging) return;
          dragging = false;
          w.card.classList.remove('dragging');
          if (moved) {
            const left = parseFloat(w.host.style.left) || 0;
            const top = parseFloat(w.host.style.top) || 0;
            const stored = (await chrome.storage.local.get(POS_KEY)) as Record<string, unknown>;
            const existing = stored[POS_KEY];
            const map: { [d: string]: { left: number; top: number } } = {};
            // 旧全局格式 {left,top} 丢弃；否则继承现有 per-domain map
            if (
              existing &&
              typeof existing === 'object' &&
              typeof (existing as Record<string, unknown>).left !== 'number'
            ) {
              Object.assign(map, existing as Record<string, unknown>);
            }
            map[domain] = { left, top };
            await chrome.storage.local.set({ [POS_KEY]: map });
          }
        },
        { signal },
      );

      kick();
    }

    function unmount() {
      abortController?.abort();
      abortController = null;
      if (timer !== undefined) {
        window.clearTimeout(timer);
        timer = undefined;
      }
      widget?.host.remove();
      widget = null;
    }

    async function readSettings() {
      const data = (await chrome.storage.local.get([POS_KEY, SETTINGS_KEY])) as Record<
        string,
        unknown
      >;
      const s = data[SETTINGS_KEY] as {
        locale?: Locale;
        floatingStats?: boolean;
        hiddenSites?: string[];
      } | undefined;
      const hiddenSites = s?.hiddenSites ?? [];
      // per-domain 位置：POS_KEY 存 { [domain]: {left,top} }；
      // 兼容旧全局格式 {left,top}（升级后各站沿用旧位置，直到单独拖拽）
      let pos: { left: number; top: number } | undefined;
      const rawPos = data[POS_KEY];
      if (rawPos && typeof rawPos === 'object') {
        const r = rawPos as Record<string, unknown>;
        if (typeof r.left === 'number' && typeof r.top === 'number') {
          pos = { left: r.left, top: r.top }; // 旧全局格式
        } else {
          const entry = r[domain] as { left?: number; top?: number } | undefined;
          if (entry && typeof entry.left === 'number' && typeof entry.top === 'number') {
            pos = { left: entry.left, top: entry.top };
          }
        }
      }
      return {
        pos,
        locale: (s?.locale ?? 'zh') as Locale,
        floating: (s?.floatingStats ?? true) && !hiddenSites.includes(domain),
      };
    }

    const init = await readSettings();
    if (init.floating) mount(init.locale, init.pos);

    chrome.storage.onChanged.addListener((changes, area) => {
      if (area !== 'local' || !changes[SETTINGS_KEY]) return;
      void readSettings().then((cur) => {
        if (!cur.floating) {
          if (widget) unmount();
          return;
        }
        if (!widget) mount(cur.locale, cur.pos);
        else schedule();
      });
    });

    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible' && widget) schedule();
    });
  },
});
