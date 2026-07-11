# Floating Stats Widget Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在所有 http/https 页面注入一个极小、可拖动的悬浮卡片，显示今日访问数、本站累计、今日主力分类，资源占用极小（后台 tab 零消耗、无框架、无轮询、无全表扫描）。

**Architecture:** content script（原生 DOM + Shadow DOM，不挂 React）通过 `chrome.runtime.sendMessage` 向 background 请求；background 是单例，做内存缓存 + 索引查询后返回；位置全局持久化到 `chrome.storage.local`。

**Tech Stack:** WXT `defineContentScript`、原生 DOM/CSS、Shadow DOM、Dexie 索引查询、vitest + fake-indexeddb。

**Spec:** [docs/superpowers/specs/2026-07-11-floating-stats-widget-design.md](../specs/2026-07-11-floating-stats-widget-design.md)

**对 spec 的一处改进：** `getTodayTopCategory(rules)` 接收 `rules: CategoryDef[]` 参数而非内部调用 `getCategories()`（后者依赖 `chrome.storage`，测试环境不可用）。chrome 依赖留在 background handler 里。这是为了可测性。

---

## 文件结构

- **新增** `src/entrypoints/floating-stats.content.ts` — content script：Shadow DOM 容器、原生 DOM 卡片、拖拽、消息收发、刷新调度。
- **新增** `tests/floating-stats.test.ts` — 三个新查询的单测。
- **修改** `src/db/queries.ts` — 新增 `getTodayCount` / `getDomainCount` / `getTodayTopCategory`（均走索引）。
- **修改** `src/entrypoints/background.ts` — 新增 `FLOATING_STATS` message handler + 内存缓存 + `addVisit` 后失效全局缓存。

---

## Task 1: `getTodayCount` 查询（TDD）

**Files:**
- Create: `tests/floating-stats.test.ts`
- Modify: `src/db/queries.ts`

- [ ] **Step 1: 写失败测试**

创建 `tests/floating-stats.test.ts`：

```ts
import { describe, it, expect, beforeEach } from 'vitest';
import { db } from '../src/db/database';
import { addVisit, getTodayCount, getDomainCount, getTodayTopCategory } from '../src/db/queries';
import { DEFAULT_CATEGORIES } from '../src/lib/categories';
import { todayKey } from '../src/lib/url-utils';
import type { NewVisit } from '../src/types/visit';

const tk = todayKey();

function mk(domain: string, dayKey: string = tk): NewVisit {
  return {
    url: `https://${domain}/`,
    domain,
    title: domain,
    visitTime: Date.now(),
    dayKey,
    transitionType: 'link',
  };
}

describe('getTodayCount', () => {
  beforeEach(async () => {
    await db.visits.clear();
  });

  it('只计今日记录，忽略其他日期', async () => {
    await addVisit(mk('a.com'));
    await addVisit(mk('b.com'));
    await addVisit(mk('c.com', '2020-01-01'));
    expect(await getTodayCount()).toBe(2);
  });

  it('无今日记录返回 0', async () => {
    expect(await getTodayCount()).toBe(0);
  });
});
```

> 注：此时 `getDomainCount` / `getTodayTopCategory` 尚未导出，TS 会报错。先注释掉 import 中这两项，或按 Task 2/3 逐步放开。简化做法：本 Task 先只 import `getTodayCount`，Task 2、Task 3 再补 import。

- [ ] **Step 2: 跑测试确认失败**

Run: `npm test -- tests/floating-stats.test.ts`
Expected: FAIL，`getTodayCount is not a function`

- [ ] **Step 3: 实现 `getTodayCount`**

在 `src/db/queries.ts` 末尾追加（`todayKey` 已在文件顶部 import）：

```ts
export async function getTodayCount(): Promise<number> {
  return db.visits.where('dayKey').equals(todayKey()).count();
}
```

- [ ] **Step 4: 跑测试确认通过**

Run: `npm test -- tests/floating-stats.test.ts`
Expected: PASS（`getTodayCount` 两个用例通过）

- [ ] **Step 5: 提交**

```bash
git add tests/floating-stats.test.ts src/db/queries.ts
git commit -m "feat(db): getTodayCount 索引查询今日访问数"
```

---

## Task 2: `getDomainCount` 查询（TDD）

**Files:**
- Modify: `tests/floating-stats.test.ts`
- Modify: `src/db/queries.ts`

- [ ] **Step 1: 在测试文件补 import 与用例**

在 `tests/floating-stats.test.ts` 顶部 import 行加入 `getDomainCount`，并在文件末尾追加：

```ts
describe('getDomainCount', () => {
  beforeEach(async () => {
    await db.visits.clear();
  });

  it('按域名计数（不限日期）', async () => {
    await addVisit(mk('a.com'));
    await addVisit(mk('a.com'));
    await addVisit(mk('b.com'));
    expect(await getDomainCount('a.com')).toBe(2);
    expect(await getDomainCount('b.com')).toBe(1);
    expect(await getDomainCount('none.com')).toBe(0);
  });

  it('空域名返回 0，不抛错', async () => {
    expect(await getDomainCount('')).toBe(0);
  });
});
```

- [ ] **Step 2: 跑测试确认失败**

Run: `npm test -- tests/floating-stats.test.ts`
Expected: FAIL，`getDomainCount is not a function`

- [ ] **Step 3: 实现 `getDomainCount`**

在 `src/db/queries.ts` 追加：

```ts
export async function getDomainCount(domain: string): Promise<number> {
  if (!domain) return 0;
  return db.visits.where('domain').equals(domain).count();
}
```

- [ ] **Step 4: 跑测试确认通过**

Run: `npm test -- tests/floating-stats.test.ts`
Expected: PASS

- [ ] **Step 5: 提交**

```bash
git add tests/floating-stats.test.ts src/db/queries.ts
git commit -m "feat(db): getDomainCount 索引查询域名计数"
```

---

## Task 3: `getTodayTopCategory` 查询（TDD，接收 rules）

**Files:**
- Modify: `src/db/queries.ts`（顶部 import 加 `type CategoryDef`）
- Modify: `tests/floating-stats.test.ts`

- [ ] **Step 1: 修改 queries.ts import**

`src/db/queries.ts` 顶部这条：

```ts
import { classifyDomain, DEFAULT_CATEGORY_ICON, DEFAULT_CATEGORY_COLOR } from '../lib/categories';
```

改为：

```ts
import { classifyDomain, DEFAULT_CATEGORY_ICON, DEFAULT_CATEGORY_COLOR, type CategoryDef } from '../lib/categories';
```

- [ ] **Step 2: 在测试文件补 import 与用例**

在 `tests/floating-stats.test.ts` 顶部 import 行加入 `getTodayTopCategory`（`DEFAULT_CATEGORIES` 已 import），并在文件末尾追加：

```ts
describe('getTodayTopCategory', () => {
  beforeEach(async () => {
    await db.visits.clear();
  });

  it('返回今日占比最高的分类（含 icon/color）', async () => {
    await addVisit(mk('github.com')); // 开发
    await addVisit(mk('gitlab.com')); // 开发
    await addVisit(mk('youtube.com')); // 视频
    const top = await getTodayTopCategory(DEFAULT_CATEGORIES);
    expect(top).not.toBeNull();
    expect(top!.name).toBe('开发');
    expect(typeof top!.icon).toBe('string');
    expect(top!.icon.length).toBeGreaterThan(0);
    expect(top!.color).toMatch(/^#/);
  });

  it('今日无记录返回 null', async () => {
    expect(await getTodayTopCategory(DEFAULT_CATEGORIES)).toBeNull();
  });

  it('只统计今日，忽略历史记录的分类', async () => {
    await addVisit(mk('youtube.com', '2020-01-01')); // 历史视频
    await addVisit(mk('github.com')); // 今日开发
    const top = await getTodayTopCategory(DEFAULT_CATEGORIES);
    expect(top!.name).toBe('开发');
  });
});
```

- [ ] **Step 3: 跑测试确认失败**

Run: `npm test -- tests/floating-stats.test.ts`
Expected: FAIL，`getTodayTopCategory is not a function`

- [ ] **Step 4: 实现 `getTodayTopCategory`**

在 `src/db/queries.ts` 追加：

```ts
export async function getTodayTopCategory(
  rules: CategoryDef[],
): Promise<{ name: string; icon: string; color: string } | null> {
  const rows = await db.visits.where('dayKey').equals(todayKey()).toArray();
  if (rows.length === 0) return null;
  const map = new Map<string, number>();
  for (const r of rows) {
    const c = classifyDomain(r.domain, rules);
    map.set(c, (map.get(c) ?? 0) + 1);
  }
  let bestName = '';
  let bestCount = 0;
  for (const [name, count] of map) {
    if (count > bestCount) {
      bestCount = count;
      bestName = name;
    }
  }
  const def = rules.find((r) => r.name === bestName);
  return {
    name: bestName,
    icon: def?.icon ?? DEFAULT_CATEGORY_ICON,
    color: def?.color ?? DEFAULT_CATEGORY_COLOR,
  };
}
```

- [ ] **Step 5: 跑测试确认通过**

Run: `npm test -- tests/floating-stats.test.ts`
Expected: PASS（全部用例通过）

- [ ] **Step 6: 提交**

```bash
git add tests/floating-stats.test.ts src/db/queries.ts
git commit -m "feat(db): getTodayTopCategory 今日主力分类（接收 rules，可测）"
```

---

## Task 4: background message handler + 内存缓存

**Files:**
- Modify: `src/entrypoints/background.ts`

> 这一步是集成胶水（chrome message + db），单测成本高、价值低，靠 Task 6 端到端验证。本任务用 `npm run compile` 保证类型正确。

- [ ] **Step 1: 在 background.ts 顶部补 import**

`src/entrypoints/background.ts` 现有顶部：

```ts
import { getDomain, getDayKey } from '../lib/url-utils';
import { shouldRecord } from '../lib/privacy';
import { addVisit } from '../db/queries';
import { getBlacklist } from '../store/settings';
```

改为（增加三个查询 + `getCategories`）：

```ts
import { getDomain, getDayKey } from '../lib/url-utils';
import { shouldRecord } from '../lib/privacy';
import { addVisit, getTodayCount, getDomainCount, getTodayTopCategory } from '../db/queries';
import { getBlacklist, getCategories } from '../store/settings';
```

- [ ] **Step 2: 在 `defineBackground(() => { ... })` 内、`chrome.action.onClicked` 之前，加入缓存与 handler**

在 `export default defineBackground(() => {` 这一行之后插入：

```ts
  // —— 悬浮统计窗：内存缓存（多 tab 单点去重）——
  const FLOAT_TTL = 5000;
  let floatGlobal: {
    todayCount: number;
    topCategory: { name: string; icon: string; color: string } | null;
    at: number;
  } | null = null;
  const floatDomain = new Map<string, { count: number; at: number }>();

  function invalidateFloatGlobal() {
    floatGlobal = null;
  }

  chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
    if (msg?.type === 'FLOATING_STATS') {
      handleFloatingStats(typeof msg.domain === 'string' ? msg.domain : '').then(sendResponse);
      return true; // 异步响应
    }
    return false;
  });

  async function handleFloatingStats(domain: string): Promise<{
    todayCount: number;
    siteCount: number;
    topCategory: { name: string; icon: string; color: string } | null;
  } | { error: true }> {
    const now = Date.now();
    try {
      // 全局：命中缓存直接用，否则重算一次
      let todayCount: number;
      let topCategory: { name: string; icon: string; color: string } | null;
      if (floatGlobal && now - floatGlobal.at < FLOAT_TTL) {
        todayCount = floatGlobal.todayCount;
        topCategory = floatGlobal.topCategory;
      } else {
        const rules = await getCategories();
        const [tc, cat] = await Promise.all([getTodayCount(), getTodayTopCategory(rules)]);
        todayCount = tc;
        topCategory = cat;
        floatGlobal = { todayCount, topCategory, at: now };
      }
      // per-domain：命中缓存直接用，否则索引 count
      let siteCount: number;
      const dc = floatDomain.get(domain);
      if (dc && now - dc.at < FLOAT_TTL) {
        siteCount = dc.count;
      } else {
        siteCount = await getDomainCount(domain);
        floatDomain.set(domain, { count: siteCount, at: now });
      }
      return { todayCount, siteCount, topCategory };
    } catch {
      return { error: true };
    }
  }
```

- [ ] **Step 3: 在 `addVisit(...)` 调用后失效全局缓存**

`src/entrypoints/background.ts` 中 `webNavigation.onCommitted` listener 内的：

```ts
    await addVisit({
      url: details.url,
      domain,
      title: tab?.title || domain,
      visitTime: details.timeStamp,
      dayKey: getDayKey(details.timeStamp),
      transitionType: details.transitionType,
      referrerUrl: undefined,
      faviconUrl: tab?.favIconUrl,
    });
```

在其后追加一行：

```ts
    invalidateFloatGlobal();
```

> `backfillFromHistory` 里的批量 `addVisit` 不失效（一次性历史回填，不需要实时刷新悬浮窗；TTL 自然过期即可）。

- [ ] **Step 4: 类型检查**

Run: `npm run compile`
Expected: 无错误。

- [ ] **Step 5: 提交**

```bash
git add src/entrypoints/background.ts
git commit -m "feat(bg): FLOATING_STATS handler + 单点缓存（多 tab 去重）"
```

---

## Task 5: content script 悬浮窗

**Files:**
- Create: `src/entrypoints/floating-stats.content.ts`

> content script 是浏览器 DOM + chrome 集成，靠 Task 6 端到端验证。本任务用 `npm run compile` 保证类型正确。

- [ ] **Step 1: 创建 content script 文件**

创建 `src/entrypoints/floating-stats.content.ts`：

```ts
import { defineContentScript } from 'wxt';

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
  render: (res: StatsResponse) => void;
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
  card.innerHTML = `
    <div class="row"><span class="label">今日访问</span><span class="value" data-k="today">–</span></div>
    <div class="row"><span class="label">本站累计</span><span class="value" data-k="site">–</span></div>
    <div class="row"><span class="label">今日主力</span><span class="value" data-k="cat">–</span></div>
  `;
  root.appendChild(card);

  const elToday = card.querySelector('[data-k="today"]') as HTMLElement;
  const elSite = card.querySelector('[data-k="site"]') as HTMLElement;
  const elCat = card.querySelector('[data-k="cat"]') as HTMLElement;

  function render(res: StatsResponse) {
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

  return { host, card, render };
}

export default defineContentScript({
  matches: ['http://*/*', 'https://*/*'],
  async main() {
    const domain = location.hostname;
    const { host, card, render } = buildWidget();

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
      fetchStats(domain).then(render);
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
```

- [ ] **Step 2: 类型检查**

Run: `npm run compile`
Expected: 无错误。

> 若 `import { defineContentScript } from 'wxt'` 报类型找不到，运行 `npm run postinstall`（即 `wxt prepare`）生成 `.wxt/types` 后再 compile。

- [ ] **Step 3: 跑全部测试确认未回归**

Run: `npm test`
Expected: 全部通过（含 floating-stats.test.ts 的新用例）。

- [ ] **Step 4: 提交**

```bash
git add src/entrypoints/floating-stats.content.ts
git commit -m "feat(content): 悬浮统计窗（原生 DOM + shadow + 拖拽 + 事件驱动刷新）"
```

---

## Task 6: 端到端验证 + 版本号 + 收尾

**Files:**
- Modify: `wxt.config.ts`（版本号 `0.1.2` → `0.1.3`）

- [ ] **Step 1: 构建扩展**

Run: `npm run build`
Expected: 构建成功，产物在 `.output/chrome-mv3`。

- [ ] **Step 2: 手动加载并验证（Chrome）**

1. 打开 `chrome://extensions`，开启"开发者模式"，"加载已解压的扩展程序"，选 `.output/chrome-mv3` 目录。
2. 打开任意 http(s) 网页（如 https://github.com）：
   - ✅ 左下角出现半透明深色悬浮卡片，显示「今日访问 / 本站累计 / 今日主力」三行真实数据。
   - ✅ 拖动卡片到屏幕其他位置，刷新页面后位置保持。
   - ✅ 在该页面再浏览产生新访问后，切到其他标签再切回，今日访问数 +1（visibilitychange 刷新）。
3. 打开第二个普通网页标签：
   - ✅ 该标签也显示悬浮卡片；两个标签的「今日访问」「今日主力」一致（全局数据），「本站累计」各自不同。
4. 后台标签不应刷新（无可观察的异常）。
5. 打开 `chrome://settings` 等内部页：
   - ✅ 无悬浮卡片（注入限制，正常）。

- [ ] **Step 3: 提升版本号**

`wxt.config.ts` 中：

```ts
    version: '0.1.2',
```

改为：

```ts
    version: '0.1.3',
```

- [ ] **Step 4: 提交**

```bash
git add wxt.config.ts
git commit -m "feat: 全页面悬浮统计窗，版本升至 0.1.3"
```

---

## 自审记录（写计划后）

- **Spec 覆盖**：第 3 节显示内容 → Task 1-3 查询 + Task 5 渲染；第 6 节索引查询 → Task 1-3；第 7 节刷新 → Task 5 的 kick/visibilitychange；第 8 节多 tab 缓存 → Task 4；第 9 节拖拽/位置 → Task 5；第 10 节样式 → Task 5 style；第 11 节范围限制 → Task 6 Step 2 验证项；第 12 节错误处理 → Task 4 catch + Task 5 error 分支。全部覆盖。
- **Placeholder**：无 TODO/TBD，所有代码步骤均含完整代码。
- **类型一致性**：`StatsResponse`（Task 5）与 `handleFloatingStats` 返回（Task 4）结构一致（成功三字段 / `{error:true}`）；`getTodayTopCategory(rules: CategoryDef[])`（Task 3）与 Task 4 调用 `getTodayTopCategory(rules)` 一致；`FLOATING_STATS` 消息 type 在 Task 4 与 Task 5 一致；`history-plus:floating-pos` key 一致。
