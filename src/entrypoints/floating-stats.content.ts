const POS_KEY = 'history-plus:floating-pos';
const CARD_WIDTH = 200;
const DRAG_THRESHOLD = 5;
const REFRESH_DEBOUNCE = 500;

type TopCategory = { name: string; icon: string; color: string };
type StatsResponse =
  | { todayCount: number; siteCount: number; topCategory: TopCategory | null }
  | { error: true };

async function fetchStats(domain: string): Promise<StatsResponse> {
  try {
    return (await chrome.runtime.sendMessage({
      type: 'FLOATING_STATS',
      domain,
    })) as StatsResponse;
  } catch {
    return { error: true };
  }
}

interface Widget {
  host: HTMLDivElement;
  card: HTMLDivElement;
  elToday: HTMLElement;
  elSite: HTMLElement;
  elCat: HTMLElement;
}

function makeRow(label: string, key: string): { row: HTMLDivElement; value: HTMLSpanElement } {
  const row = document.createElement('div');
  row.className = 'row';
  const lab = document.createElement('span');
  lab.className = 'label';
  lab.textContent = label;
  const val = document.createElement('span');
  val.className = 'value';
  val.dataset.k = key;
  val.textContent = '–';
  row.appendChild(lab);
  row.appendChild(val);
  return { row, value: val };
}

function buildWidget(): Widget {
  const host = document.createElement('div');
  host.id = 'history-plus-floating-stats';
  host.style.cssText =
    'all:initial;position:fixed;z-index:2147483647;left:16px;bottom:16px;';

  const root = host.attachShadow({ mode: 'open' });

  const style = document.createElement('style');
  style.textContent = `
    .card {
      width: ${CARD_WIDTH}px;
      padding: 10px 12px;
      border-radius: 12px;
      background: rgba(20,20,22,0.82);
      backdrop-filter: blur(8px);
      color: #fff;
      font: 12px/1.5 -apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif;
      box-shadow: 0 4px 16px rgba(0,0,0,0.2);
      cursor: default;
      user-select: none;
      -webkit-user-select: none;
    }
    .card.dragging { cursor: grabbing; }
    .row { display:flex; justify-content:space-between; align-items:center; gap:8px; }
    .row + .row { margin-top: 2px; }
    .label { color: rgba(255,255,255,0.7); }
    .value { font-weight: 600; }
  `;
  root.appendChild(style);

  const card = document.createElement('div');
  card.className = 'card';
  const today = makeRow('今日访问', 'today');
  const site = makeRow('本站累计', 'site');
  const cat = makeRow('今日主力', 'cat');
  card.appendChild(today.row);
  card.appendChild(site.row);
  card.appendChild(cat.row);
  root.appendChild(card);

  return { host, card, elToday: today.value, elSite: site.value, elCat: cat.value };
}

function render(widget: Widget, res: StatsResponse): void {
  const { elToday, elSite, elCat } = widget;
  if ('error' in res) {
    elToday.textContent = '–';
    elSite.textContent = '–';
    elCat.textContent = '–';
    elCat.style.color = '';
    return;
  }
  elToday.textContent = String(res.todayCount);
  elSite.textContent = String(res.siteCount);
  if (res.topCategory) {
    elCat.textContent = `${res.topCategory.icon} ${res.topCategory.name}`;
    elCat.style.color = res.topCategory.color;
  } else {
    elCat.textContent = '–';
    elCat.style.color = '';
  }
}

export default defineContentScript({
  matches: ['http://*/*', 'https://*/*'],
  async main() {
    const domain = location.hostname;
    const widget = buildWidget();
    const { host, card } = widget;

    // 应用持久化位置（有则用 left/top，无则保持默认 left/bottom）
    const stored = (await chrome.storage.local.get(POS_KEY))[POS_KEY] as
      | { left: number; top: number }
      | undefined;
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

    // —— 刷新调度（无轮询：idle 一次 + visibilitychange debounce）——
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
  },
});
