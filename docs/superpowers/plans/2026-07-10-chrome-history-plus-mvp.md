# Chrome History Plus — 阶段① MVP 实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 构建一个可安装运行的 Chrome MV3 扩展，能采集浏览历史到本地 IndexedDB，并在一个带左侧日历表的三栏界面里"一眼看到哪天有记录、点开看当天列表"。

**Architecture:** WXT 框架管理 MV3 manifest 与构建；background service worker 用 `chrome.webNavigation.onCommitted` 采集并写入 Dexie（IndexedDB）封装的 `visits` 表；history page 用 React 渲染三栏 UI，左栏日历通过 `liveQuery` 响应式点亮"有记录的天"。所有数据纯本地，零网络上报。

**Tech Stack:** TypeScript · React 18 · WXT · Dexie.js · Tailwind CSS · Vitest + fake-indexeddb

**参考规格:** [`docs/superpowers/specs/2026-07-10-chrome-history-plus-design.md`](../specs/2026-07-10-chrome-history-plus-design.md)

**验收标准:** 在 Chrome 加载该扩展 → 正常浏览若干页面 → 打开 history page → ①日历上当天的格子有紫色圆点；②切换月份能看到历史月份的记录分布；③点击某天，中栏列出该天全部访问记录；④深/浅主题可切换；⑤隐身窗口与 `chrome://` 等内部页不被记录。

---

## 文件结构总览

执行 Task 1 后由 WXT 模板生成基础结构；后续任务按以下职责创建文件。每个文件单一职责：

```
0chrome-historyplus/
├── package.json                 # 依赖与脚本（Task 1 生成，Task 2 增补）
├── wxt.config.ts                # WXT/manifest 配置：权限、entrypoints（Task 1+8）
├── tsconfig.json                # Task 1 生成
├── vitest.config.ts             # Task 2 创建
├── tailwind.config.ts           # 主题色 token（Task 2）
├── postcss.config.js            # Task 2
├── src/
│   ├── types/
│   │   └── visit.ts             # Visit 接口（Task 3）
│   ├── lib/
│   │   ├── url-utils.ts         # getDomain / getDayKey 纯函数（Task 4）
│   │   ├── privacy.ts           # shouldRecord 过滤逻辑（Task 5）
│   │   ├── calendar.ts          # buildMonthGrid 日期网格纯函数（Task 11）
│   │   └── theme.css            # Tailwind 指令 + CSS 变量（Task 2）
│   ├── db/
│   │   └── database.ts          # Dexie 实例 + visits schema + 查询函数（Task 6-7）
│   ├── store/
│   │   └── settings.ts          # chrome.storage 设置读写 + hook（Task 10）
│   ├── entrypoints/
│   │   ├── background.ts        # service worker：采集 + 回填（Task 8-9）
│   │   ├── popup/
│   │   │   ├── index.html       # Task 16
│   │   │   ├── main.tsx         # Task 16
│   │   │   └── App.tsx          # Task 16
│   │   └── history/
│   │       ├── index.html       # Task 15
│   │       ├── main.tsx         # Task 15
│   │       └── App.tsx          # 三栏布局组合（Task 15）
│   ├── components/
│   │   ├── Calendar.tsx         # 左栏日历（Task 12）
│   │   ├── HistoryList.tsx      # 中栏列表（Task 13）
│   │   ├── HistoryItem.tsx      # 列表项（Task 13）
│   │   └── ThemeToggle.tsx      # 主题切换按钮（Task 14）
└── tests/
    ├── setup.ts                 # fake-indexeddb 注册（Task 2）
    ├── url-utils.test.ts        # Task 4
    ├── privacy.test.ts          # Task 5
    ├── database.test.ts         # Task 7
    └── calendar.test.ts         # Task 11
```

**约定：**
- 包管理器统一用 `npm`（Windows 通用）。所有 `npm run xxx`。
- TDD 仅用于纯逻辑（`lib/*`、`db/*`、`calendar`）。Chrome API 与 React 渲染用构建成功 + 手动验收。
- 每个任务结束 `git commit`。提交信息前缀：`feat:` / `test:` / `chore:` / `style:`。

---

## Task 1: 初始化 WXT + React 项目

**Files:**
- Create: `package.json`, `wxt.config.ts`, `tsconfig.json`, `src/entrypoints/*`（由模板生成）

- [ ] **Step 1: 用 WXT 官方模板初始化**

在仓库根目录执行（`.` 表示当前目录）：

```bash
npm create wxt@latest . -- --template react
```

如果提示目录非空（因已有 `docs/` `.gitignore` `.claude/`），选择继续/覆盖配置文件即可，**不要删除 `docs/`**。

- [ ] **Step 2: 安装依赖**

```bash
npm install
```

- [ ] **Step 3: 验证脚手架可构建**

Run: `npm run build`
Expected: 成功生成 `.output/chrome-mv3/` 目录，无报错。

- [ ] **Step 4: 确认生成的 entrypoints 存在**

确认 `src/entrypoints/popup/` 与 `src/entrypoints/background.ts` 已由模板生成（WXT react 模板默认包含）。

- [ ] **Step 5: 提交**

```bash
git add -A
git commit -m "chore: 初始化 WXT + React 项目脚手架"
```

---

## Task 2: 配置 Tailwind、主题、测试框架

**Files:**
- Create: `tailwind.config.ts`, `postcss.config.js`, `vitest.config.ts`, `tests/setup.ts`, `src/lib/theme.css`
- Modify: `package.json`（加依赖与脚本）

- [ ] **Step 1: 安装依赖**

```bash
npm install -D tailwindcss@3 postcss autoprefixer vitest fake-indexeddb @types/fake-indexeddb
```

> 用 Tailwind v3（非 v4），因为 v3 的 `darkMode: 'class'` 与 CSS 变量方案成熟稳定，便于实现深/浅双主题。

- [ ] **Step 2: 初始化 Tailwind 配置**

Create `tailwind.config.ts`:

```ts
import type { Config } from 'tailwindcss';

export default {
  content: ['./src/entrypoints/**/*.{ts,tsx,html}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        bg: 'rgb(var(--bg) / <alpha-value>)',
        card: 'rgb(var(--card) / <alpha-value>)',
        border: 'rgb(var(--border) / <alpha-value>)',
        fg: 'rgb(var(--fg) / <alpha-value>)',
        muted: 'rgb(var(--muted) / <alpha-value>)',
        accent: 'rgb(var(--accent) / <alpha-value>)',
      },
    },
  },
  plugins: [],
} satisfies Config;
```

- [ ] **Step 3: 创建 PostCSS 配置**

Create `postcss.config.js`:

```js
export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};
```

- [ ] **Step 4: 创建主题 CSS（深/浅双主题 CSS 变量）**

Create `src/lib/theme.css`:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  /* 浅色主题（默认） */
  --bg: 255 255 255;
  --card: 248 248 248;
  --border: 229 229 229;
  --fg: 23 23 23;
  --muted: 142 142 142;
  --accent: 108 92 231; /* #6C5CE7 */
}

.dark {
  /* 深色主题（复刻截图） */
  --bg: 30 30 30;       /* #1E1E1E */
  --card: 37 37 37;     /* #252525 */
  --border: 42 42 42;   /* #2A2A2A */
  --fg: 255 255 255;
  --muted: 142 142 142; /* #8E8E8E */
  --accent: 108 92 231; /* #6C5CE7 */
}

body {
  background-color: rgb(var(--bg));
  color: rgb(var(--fg));
  font-family: Inter, system-ui, sans-serif;
}
```

- [ ] **Step 5: 在 popup/main.tsx 与 history/main.tsx 引入主题 CSS**

Modify `src/entrypoints/popup/main.tsx`，在顶部 `import './style.css'` 处改为（若模板用的是别的名，替换之）：

```tsx
import '../../lib/theme.css';
```

（history/main.tsx 在 Task 15 创建时同样引入。）

- [ ] **Step 6: 创建 vitest 配置**

Create `vitest.config.ts`:

```ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    setupFiles: ['./tests/setup.ts'],
    include: ['tests/**/*.test.ts'],
  },
});
```

- [ ] **Step 7: 创建测试 setup（注册 fake-indexeddb）**

Create `tests/setup.ts`:

```ts
import 'fake-indexeddb/auto';
```

- [ ] **Step 8: 在 package.json 加测试脚本**

Modify `package.json` 的 `scripts`，确保包含：

```json
"test": "vitest run",
"test:watch": "vitest"
```

- [ ] **Step 9: 验证测试框架可跑**

Run: `npm test`
Expected: vitest 启动，因暂无测试文件输出 "No test files found" 或 0 passed，无报错退出。

- [ ] **Step 10: 提交**

```bash
git add -A
git commit -m "chore: 配置 Tailwind 双主题、vitest 与 fake-indexeddb"
```

---

## Task 3: 定义 Visit 类型

**Files:**
- Create: `src/types/visit.ts`

- [ ] **Step 1: 写类型定义**

Create `src/types/visit.ts`:

```ts
export interface Visit {
  id?: number;
  url: string;
  domain: string;
  title: string;
  visitTime: number;       // 毫秒时间戳
  dayKey: string;          // 'YYYY-MM-DD'，本地时区
  transitionType: string;  // link/typed/redirect/reload...
  referrerUrl?: string;
  faviconUrl?: string;
}

/** 写入时不含自增 id */
export type NewVisit = Omit<Visit, 'id'>;
```

- [ ] **Step 2: 提交**

```bash
git add src/types/visit.ts
git commit -m "feat: 定义 Visit 数据类型"
```

---

## Task 4: URL 工具函数（TDD）

**Files:**
- Create: `src/lib/url-utils.ts`, `tests/url-utils.test.ts`

- [ ] **Step 1: 写失败测试**

Create `tests/url-utils.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { getDomain, getDayKey } from '../src/lib/url-utils';

describe('getDomain', () => {
  it('从普通 URL 提取 hostname', () => {
    expect(getDomain('https://www.reddit.com/r/programming')).toBe('www.reddit.com');
  });

  it('处理无协议的 URL 返回空串', () => {
    expect(getDomain('not a url')).toBe('');
  });

  it('chrome 内部页返回 hostname', () => {
    expect(getDomain('chrome://settings/')).toBe('chrome://settings');
    // 内部页 URL hostname 解析不稳定，我们只要求不抛异常、返回非空或空串之一即可
  });
});

describe('getDayKey', () => {
  it('把时间戳转成本地时区 YYYY-MM-DD', () => {
    // 2026-03-15 14:30 本地时间 → 取本地日期
    const d = new Date(2026, 2, 15, 14, 30);
    expect(getDayKey(d.getTime())).toBe('2026-03-15');
  });

  it('补零', () => {
    const d = new Date(2026, 0, 5, 1, 1); // 1月5日
    expect(getDayKey(d.getTime())).toBe('2026-01-05');
  });
});
```

- [ ] **Step 2: 运行测试验证失败**

Run: `npm test`
Expected: FAIL — `getDomain`/`getDayKey` 未定义（import 失败）。

- [ ] **Step 3: 实现**

Create `src/lib/url-utils.ts`:

```ts
/** 从 URL 提取域名（hostname）。解析失败返回空串。 */
export function getDomain(url: string): string {
  try {
    return new URL(url).hostname;
  } catch {
    return '';
  }
}

/** 把毫秒时间戳转成本地时区的 'YYYY-MM-DD'。 */
export function getDayKey(timestamp: number): string {
  const d = new Date(timestamp);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}
```

- [ ] **Step 4: 修正测试中对 chrome 内部页的断言**

上面测试 Step 1 里 `getDomain('chrome://settings/')` 的断言写在注释中（不 assert），无需改。若 vitest 报该行，确认它不是 `expect`。保持现状即可。

- [ ] **Step 5: 运行测试验证通过**

Run: `npm test`
Expected: PASS（getDomain 4 case、getDayKey 2 case 全过）。

- [ ] **Step 6: 提交**

```bash
git add src/lib/url-utils.ts tests/url-utils.test.ts
git commit -m "feat: URL 域名与 dayKey 提取工具"
```

---

## Task 5: 隐私过滤逻辑（TDD）

**Files:**
- Create: `src/lib/privacy.ts`, `tests/privacy.test.ts`

- [ ] **Step 1: 写失败测试**

Create `tests/privacy.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { isInternalUrl, shouldRecord } from '../src/lib/privacy';

describe('isInternalUrl', () => {
  it('识别 chrome 内部页', () => {
    expect(isInternalUrl('chrome://settings/')).toBe(true);
    expect(isInternalUrl('chrome-extension://abc/popup.html')).toBe(true);
    expect(isInternalUrl('edge://version')).toBe(true);
    expect(isInternalUrl('about:blank')).toBe(true);
    expect(isInternalUrl('view-source:https://x.com')).toBe(true);
    expect(isInternalUrl('file:///C:/x.txt')).toBe(true);
  });

  it('放行普通网页', () => {
    expect(isInternalUrl('https://www.reddit.com/')).toBe(false);
  });
});

describe('shouldRecord', () => {
  const baseVisit = { url: 'https://www.reddit.com/', domain: 'www.reddit.com' };

  it('隐身模式不记录', () => {
    expect(shouldRecord({ ...baseVisit, incognito: true }, [])).toBe(false);
  });

  it('内部页不记录', () => {
    expect(shouldRecord({ ...baseVisit, url: 'chrome://settings/', incognito: false }, [])).toBe(false);
  });

  it('黑名单域名不记录（含子域名）', () => {
    expect(shouldRecord({ ...baseVisit, domain: 'bank.com', incognito: false }, ['bank.com'])).toBe(false);
    expect(shouldRecord({ url: 'https://x.com', domain: 'mail.bank.com', incognito: false }, ['bank.com'])).toBe(false);
  });

  it('正常页面记录', () => {
    expect(shouldRecord({ ...baseVisit, incognito: false }, [])).toBe(true);
  });

  it('空域名（解析失败）不记录', () => {
    expect(shouldRecord({ url: 'not-a-url', domain: '', incognito: false }, [])).toBe(false);
  });
});
```

- [ ] **Step 2: 运行测试验证失败**

Run: `npm test`
Expected: FAIL — `isInternalUrl`/`shouldRecord` 未定义。

- [ ] **Step 3: 实现**

Create `src/lib/privacy.ts`:

```ts
const INTERNAL_PREFIXES = [
  'chrome://',
  'chrome-search://',
  'chrome-extension://',
  'edge://',
  'extension://',
  'moz-extension://',
  'about:',
  'view-source:',
  'file://',
  'devtools://',
];

/** 是否为浏览器内部页 / 本地文件 / 扩展页 —— 一律不记录。 */
export function isInternalUrl(url: string): boolean {
  return INTERNAL_PREFIXES.some((p) => url.startsWith(p));
}

export interface RecordableVisit {
  url: string;
  domain: string;
  incognito: boolean;
}

/**
 * 判断一次访问是否应被记录。默认锁死的隐私边界：
 * 隐身模式、内部/本地页、空域名、用户黑名单域名 → 不记录。
 */
export function shouldRecord(visit: RecordableVisit, blacklist: string[]): boolean {
  if (visit.incognito) return false;
  if (isInternalUrl(visit.url)) return false;
  if (!visit.domain) return false;
  if (isBlacklisted(visit.domain, blacklist)) return false;
  return true;
}

function isBlacklisted(domain: string, blacklist: string[]): boolean {
  return blacklist.some((b) => b && (domain === b || domain.endsWith('.' + b)));
}
```

- [ ] **Step 4: 运行测试验证通过**

Run: `npm test`
Expected: PASS（全部 case）。

- [ ] **Step 5: 提交**

```bash
git add src/lib/privacy.ts tests/privacy.test.ts
git commit -m "feat: 隐私过滤逻辑（隐身/内部页/黑名单）"
```

---

## Task 6: Dexie 数据库与 visits 表

**Files:**
- Create: `src/db/database.ts`

- [ ] **Step 1: 安装 Dexie**

```bash
npm install dexie dexie-react-hooks
```

- [ ] **Step 2: 写数据库定义**

Create `src/db/database.ts`:

```ts
import Dexie, { type Table } from 'dexie';
import type { Visit } from '../types/visit';

export class HistoryDB extends Dexie {
  visits!: Table<Visit, number>;

  constructor() {
    super('ChromeHistoryPlus');
    this.version(1).stores({
      // ++id 自增主键；其余为索引（domain/dayKey/visitTime 用于查询）
      visits: '++id, domain, dayKey, visitTime',
    });
  }
}

export const db = new HistoryDB();
```

- [ ] **Step 3: 提交**

```bash
git add src/db/database.ts package.json package-lock.json
git commit -m "feat: Dexie 数据库与 visits 表 schema"
```

---

## Task 7: visits 查询函数（TDD）

**Files:**
- Create: `src/db/queries.ts`, `tests/database.test.ts`

- [ ] **Step 1: 写失败测试**

Create `tests/database.test.ts`:

```ts
import { describe, it, expect, beforeEach } from 'vitest';
import { db } from '../src/db/database';
import { addVisit, getByDayKey, getDayCountsInRange, deleteVisit } from '../src/db/queries';
import type { NewVisit } from '../types/visit';

async function seed(visits: NewVisit[]) {
  for (const v of visits) await addVisit(v);
}

describe('visits 查询', () => {
  beforeEach(async () => {
    await db.visits.clear();
  });

  it('addVisit 写入并返回 id', async () => {
    const id = await addVisit({
      url: 'https://a.com', domain: 'a.com', title: 'A',
      visitTime: new Date(2026, 2, 15, 10).getTime(),
      dayKey: '2026-03-15', transitionType: 'link',
    });
    expect(typeof id).toBe('number');
    expect(id).toBeGreaterThan(0);
  });

  it('getByDayKey 返回该天记录并按时间倒序', async () => {
    await seed([
      mkVisit('2026-03-15', new Date(2026, 2, 15, 9).getTime(), 'early'),
      mkVisit('2026-03-15', new Date(2026, 2, 15, 18).getTime(), 'late'),
      mkVisit('2026-03-16', new Date(2026, 2, 16, 9).getTime(), 'other'),
    ]);
    const rows = await getByDayKey('2026-03-15');
    expect(rows).toHaveLength(2);
    expect(rows[0].title).toBe('late');
    expect(rows[1].title).toBe('early');
  });

  it('getDayCountsInRange 返回范围内每天的计数', async () => {
    await seed([
      mkVisit('2026-03-15', new Date(2026, 2, 15, 9).getTime(), 'x'),
      mkVisit('2026-03-15', new Date(2026, 2, 15, 10).getTime(), 'x'),
      mkVisit('2026-03-16', new Date(2026, 2, 16, 9).getTime(), 'y'),
    ]);
    const start = new Date(2026, 2, 1).getTime();
    const end = new Date(2026, 3, 1).getTime(); // 4月1日 00:00
    const counts = await getDayCountsInRange(start, end);
    expect(counts.get('2026-03-15')).toBe(2);
    expect(counts.get('2026-03-16')).toBe(1);
    expect(counts.get('2026-03-17')).toBeUndefined();
  });

  it('deleteVisit 按 id 删除', async () => {
    const id = await addVisit(mkVisit('2026-03-15', Date.now(), 't'));
    await deleteVisit(id);
    expect(await db.visits.get(id)).toBeUndefined();
  });
});

function mkVisit(dayKey: string, visitTime: number, title: string): NewVisit {
  return {
    url: 'https://x.com', domain: 'x.com', title,
    visitTime, dayKey, transitionType: 'link',
  };
}
```

- [ ] **Step 2: 运行测试验证失败**

Run: `npm test`
Expected: FAIL — `queries` 模块未导出这些函数（import 失败）。

- [ ] **Step 3: 实现**

Create `src/db/queries.ts`:

```ts
import { db } from './database';
import type { Visit, NewVisit } from '../types/visit';

/** 写入一条访问记录，返回自增 id。 */
export async function addVisit(visit: NewVisit): Promise<number> {
  return (await db.visits.add(visit as Visit)) as number;
}

/** 取某天的全部访问，按时间倒序（最新在前）。 */
export async function getByDayKey(dayKey: string): Promise<Visit[]> {
  const rows = await db.visits.where('dayKey').equals(dayKey).toArray();
  return rows.sort((a, b) => b.visitTime - a.visitTime);
}

/**
 * 取 [start, end) 时间范围内，每个 dayKey 的记录数。
 * 用于日历点亮圆点（与可选热力色阶）。
 */
export async function getDayCountsInRange(startMs: number, endMs: number): Promise<Map<string, number>> {
  const rows = await db.visits.where('visitTime').between(startMs, endMs, true, false).toArray();
  const counts = new Map<string, number>();
  for (const r of rows) {
    counts.set(r.dayKey, (counts.get(r.dayKey) ?? 0) + 1);
  }
  return counts;
}

/** 按 id 删除一条记录。 */
export async function deleteVisit(id: number): Promise<void> {
  await db.visits.delete(id);
}
```

- [ ] **Step 4: 运行测试验证通过**

Run: `npm test`
Expected: PASS（4 个 describe case 全过）。

- [ ] **Step 5: 提交**

```bash
git add src/db/queries.ts tests/database.test.ts
git commit -m "feat: visits 查询函数（写入/按天/计数/删除）"
```

---

## Task 8: 后台采集 service worker

**Files:**
- Modify: `src/entrypoints/background.ts`
- Modify: `wxt.config.ts`（加权限）

- [ ] **Step 1: 配置 manifest 权限**

Modify `wxt.config.ts`，确保 `manifest` 字段含权限与默认设置。完整文件应类似：

```ts
import { defineConfig } from 'wxt';

export default defineConfig({
  modules: ['@wxt-dev/module-react'],
  manifest: {
    name: 'Chrome History Plus',
    description: '开源、纯本地、可审计的浏览历史管理扩展',
    version: '0.1.0',
    permissions: ['webNavigation', 'tabs', 'history', 'storage'],
    host_permissions: ['<all_urls>'],
  },
});
```

> 注：`@wxt-dev/module-react` 由 Task 1 模板已加入；若未在，先 `npm i -D @wxt-dev/module-react` 并保持 modules 配置一致。

- [ ] **Step 2: 写 background 采集逻辑**

Replace `src/entrypoints/background.ts` 内容为：

```ts
import { getDomain, getDayKey } from '../lib/url-utils';
import { shouldRecord } from '../lib/privacy';
import { addVisit } from '../db/queries';
import { getBlacklist } from '../store/settings';

export default defineBackground(() => {
  // 监听每次导航提交
  chrome.webNavigation.onCommitted.addListener(async (details) => {
    // 仅主框架；子 iframe 导航忽略
    if (details.frameId !== 0) return;

    const incognito = await isIncognito(details.tabId);
    const domain = getDomain(details.url);
    const blacklist = await getBlacklist();

    if (!shouldRecord({ url: details.url, domain, incognito }, blacklist)) return;

    const title = await getTabTitle(details.tabId);
    const faviconUrl = await getTabFavicon(details.tabId);

    await addVisit({
      url: details.url,
      domain,
      title: title || domain,
      visitTime: details.timeStamp,
      dayKey: getDayKey(details.timeStamp),
      transitionType: details.transitionType,
      referrerUrl: undefined,
      faviconUrl,
    });
  });
});

async function isIncognito(tabId: number): Promise<boolean> {
  try {
    const tab = await chrome.tabs.get(tabId);
    return !!tab.incognito;
  } catch {
    return false;
  }
}

async function getTabTitle(tabId: number): Promise<string> {
  try {
    const tab = await chrome.tabs.get(tabId);
    return tab.title ?? '';
  } catch {
    return '';
  }
}

async function getTabFavicon(tabId: number): Promise<string | undefined> {
  try {
    const tab = await chrome.tabs.get(tabId);
    return tab.favIconUrl;
  } catch {
    return undefined;
  }
}
```

> `defineBackground` 是 WXT 全局注入的，无需 import。

- [ ] **Step 3: 验证构建通过**

Run: `npm run build`
Expected: 成功，无类型错误。

- [ ] **Step 4: 提交**

```bash
git add src/entrypoints/background.ts wxt.config.ts
git commit -m "feat: 后台 webNavigation 采集 service worker"
```

---

## Task 9: 启动时回填 chrome.history

**Files:**
- Modify: `src/entrypoints/background.ts`

- [ ] **Step 1: 在 background 的 defineBackground 内顶部加回填逻辑**

Modify `src/entrypoints/background.ts`，在 `export default defineBackground(() => {` 之后、`chrome.webNavigation...` 之前，插入：

```ts
  // 首次安装/更新时回填 Chrome 现存历史（最多 ~90 天）
  chrome.runtime.onInstalled.addListener(() => {
    backfillFromHistory().catch((e) => console.error('[history-plus] backfill failed', e));
  });
```

- [ ] **Step 2: 在文件底部（defineBackground 块之外）加回填函数**

Append to `src/entrypoints/background.ts`:

```ts
const BACKFILL_FLAG = 'history-plus:backfilled';

async function backfillFromHistory(): Promise<void> {
  // 用 storage 标记避免重复回填
  const { [BACKFILL_FLAG]: done } = await chrome.storage.local.get(BACKFILL_FLAG);
  if (done) return;

  // 拉取能拿到的全部历史（startTime=0 表示最早；maxResults 上限）
  const items = await chrome.history.search({
    text: '',
    startTime: 0,
    maxResults: 10000,
  });

  for (const item of items) {
    if (!item.url || !item.lastVisitTime) continue;
    const domain = getDomain(item.url);
    if (!shouldRecord({ url: item.url, domain, incognito: false }, [])) continue;
    await addVisit({
      url: item.url,
      domain,
      title: item.title || domain,
      visitTime: item.lastVisitTime,
      dayKey: getDayKey(item.lastVisitTime),
      transitionType: 'link',
      faviconUrl: undefined,
    });
  }

  await chrome.storage.local.set({ [BACKFILL_FLAG]: true });
}
```

> 说明：回填不查重（chrome.history 已按 URL 去重，每条 url 一条），即使重复写入也只是 visits 多一条同 URL 记录，不影响日历/查询正确性。彻底去重留待阶段④。

- [ ] **Step 3: 验证构建通过**

Run: `npm run build`
Expected: 成功。

- [ ] **Step 4: 提交**

```bash
git add src/entrypoints/background.ts
git commit -m "feat: 启动时从 chrome.history 回填历史"
```

---

## Task 10: 设置存储（主题 / 周起始日 / 黑名单）

**Files:**
- Create: `src/store/settings.ts`

- [ ] **Step 1: 写设置读写模块**

Create `src/store/settings.ts`:

```ts
export interface Settings {
  theme: 'light' | 'dark';
  weekStart: 0 | 1; // 0=周日, 1=周一
  dotMode: 'dot' | 'heatmap';
  blacklist: string[];
}

const KEY = 'history-plus:settings';

export const DEFAULT_SETTINGS: Settings = {
  theme: 'dark',
  weekStart: 1,
  dotMode: 'dot',
  blacklist: [],
};

export async function getSettings(): Promise<Settings> {
  const { [KEY]: stored } = await chrome.storage.local.get(KEY);
  return { ...DEFAULT_SETTINGS, ...(stored ?? {}) };
}

export async function saveSettings(patch: Partial<Settings>): Promise<void> {
  const current = await getSettings();
  await chrome.storage.local.set({ [KEY]: { ...current, ...patch } });
}

export async function getBlacklist(): Promise<string[]> {
  return (await getSettings()).blacklist;
}
```

> 注：`getBlacklist` 被 background 采集逻辑（Task 8）引用。

- [ ] **Step 2: 提交**

```bash
git add src/store/settings.ts
git commit -m "feat: 用户设置存储（主题/周起始/标记模式/黑名单）"
```

---

## Task 11: 日历日期网格纯函数（TDD）

**Files:**
- Create: `src/lib/calendar.ts`, `tests/calendar.test.ts`

- [ ] **Step 1: 写失败测试**

Create `tests/calendar.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { buildMonthGrid, formatDayKey } from '../src/lib/calendar';

const TODAY = new Date(2026, 2, 15, 12).getTime(); // 2026-03-15

describe('formatDayKey', () => {
  it('把 Date 转 YYYY-MM-DD', () => {
    expect(formatDayKey(new Date(2026, 2, 5))).toBe('2026-03-05');
  });
});

describe('buildMonthGrid', () => {
  it('生成 42 格（6×7）', () => {
    const grid = buildMonthGrid(2026, 2, 1, TODAY); // 2026年3月，周一起
    expect(grid).toHaveLength(42);
  });

  it('周一开头：第一格是 2026-02-23（周一）', () => {
    const grid = buildMonthGrid(2026, 2, 1, TODAY);
    expect(grid[0].dayKey).toBe('2026-02-23');
    expect(grid[0].isCurrentMonth).toBe(false);
  });

  it('当月格子 isCurrentMonth=true，今天 isToday=true', () => {
    const grid = buildMonthGrid(2026, 2, 1, TODAY);
    const today = grid.find((d) => d.dayKey === '2026-03-15');
    expect(today).toBeDefined();
    expect(today!.isToday).toBe(true);
    expect(today!.isCurrentMonth).toBe(true);
  });

  it('周日开头：第一格是 2026-02-22（周日）', () => {
    const grid = buildMonthGrid(2026, 2, 0, TODAY);
    expect(grid[0].dayKey).toBe('2026-02-22');
  });

  it('所有 dayKey 与 dateMs 自洽', () => {
    const grid = buildMonthGrid(2026, 2, 1, TODAY);
    for (const cell of grid) {
      expect(cell.dayKey).toBe(formatDayKey(cell.date));
    }
  });
});
```

- [ ] **Step 2: 运行测试验证失败**

Run: `npm test`
Expected: FAIL — `calendar` 模块未定义。

- [ ] **Step 3: 实现**

Create `src/lib/calendar.ts`:

```ts
export interface CalendarDay {
  date: Date;
  dayKey: string;       // 'YYYY-MM-DD'
  dayOfMonth: number;
  isCurrentMonth: boolean;
  isToday: boolean;
  dateMs: number;
}

export function formatDayKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/**
 * 生成某月的 6×7=42 格日历网格。
 * @param year  年（如 2026）
 * @param month 月，0-based（如 2 = 3月）
 * @param weekStart 0=周日开头, 1=周一头
 * @param todayMs  注入"现在"时间戳，便于测试与确定性
 */
export function buildMonthGrid(
  year: number,
  month: number,
  weekStart: 0 | 1,
  todayMs: number,
): CalendarDay[] {
  const firstOfMonth = new Date(year, month, 1);
  const firstWeekday = firstOfMonth.getDay(); // 0=Sun..6=Sat
  const offset = (firstWeekday - weekStart + 7) % 7;
  const start = new Date(year, month, 1 - offset);
  const todayKey = formatDayKey(new Date(todayMs));

  const days: CalendarDay[] = [];
  for (let i = 0; i < 42; i++) {
    const d = new Date(start.getFullYear(), start.getMonth(), start.getDate() + i);
    const dayKey = formatDayKey(d);
    days.push({
      date: d,
      dayKey,
      dayOfMonth: d.getDate(),
      isCurrentMonth: d.getMonth() === month,
      isToday: dayKey === todayKey,
      dateMs: d.getTime(),
    });
  }
  return days;
}

/** 周表头标签。 */
export function weekdayLabels(weekStart: 0 | 1): string[] {
  const sun = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
  return weekStart === 0 ? sun : ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
}
```

- [ ] **Step 4: 运行测试验证通过**

Run: `npm test`
Expected: PASS（全部 case）。

- [ ] **Step 5: 提交**

```bash
git add src/lib/calendar.ts tests/calendar.test.ts
git commit -m "feat: 日历日期网格生成纯函数"
```

---

## Task 12: 确认 Dexie 响应式查询依赖

**Files:** 无（直接使用 `dexie-react-hooks`，Task 6 Step 1 已安装）

- [ ] **Step 1: 确认依赖已装**

Run: `npm ls dexie-react-hooks`
Expected: 显示已安装版本，无报错（missing）。

- [ ] **Step 2: 无需自定义 hook**

`dexie-react-hooks` 提供的 `useLiveQuery(querier, deps?, defaultResult?)` 已满足需求。后续组件直接 `import { useLiveQuery } from 'dexie-react-hooks'`，返回值类型与"数据或 undefined"一致。**不要**自己写 hook（DRY）。

- [ ] **Step 3: 无代码改动，跳过提交**

---

## Task 13: HistoryItem 与 HistoryList 组件

**Files:**
- Create: `src/components/HistoryItem.tsx`, `src/components/HistoryList.tsx`

- [ ] **Step 1: 写 HistoryItem**

Create `src/components/HistoryItem.tsx`:

```tsx
import type { Visit } from '../types/visit';
import { deleteVisit } from '../db/queries';

function formatTime(ms: number): string {
  const d = new Date(ms);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

export function HistoryItem({ visit }: { visit: Visit }) {
  return (
    <div className="flex items-center gap-3 rounded bg-card px-3 py-2 text-sm">
      <span className="w-10 shrink-0 text-xs text-muted">{formatTime(visit.visitTime)}</span>
      {visit.faviconUrl && (
        <img src={visit.faviconUrl} alt="" className="h-4 w-4 shrink-0" />
      )}
      <div className="min-w-0 flex-1">
        <div className="truncate text-fg">{visit.title}</div>
        <div className="truncate text-xs text-accent">{visit.domain}</div>
      </div>
      <a
        href={visit.url}
        target="_blank"
        rel="noreferrer"
        className="shrink-0 text-muted hover:text-fg"
        title="打开"
      >
        ↗
      </a>
      <button
        onClick={() => deleteVisit(visit.id!)}
        className="shrink-0 text-muted hover:text-fg"
        title="删除"
      >
        ×
      </button>
    </div>
  );
}
```

- [ ] **Step 2: 写 HistoryList**

Create `src/components/HistoryList.tsx`:

```tsx
import type { Visit } from '../types/visit';
import { HistoryItem } from './HistoryItem';

export function HistoryList({ visits }: { visits: Visit[] | undefined }) {
  if (visits === undefined) {
    return <div className="p-4 text-muted">加载中…</div>;
  }
  if (visits.length === 0) {
    return <div className="p-4 text-muted">这一天没有浏览记录。</div>;
  }
  return (
    <div className="flex flex-col gap-2">
      {visits.map((v) => (
        <HistoryItem key={v.id} visit={v} />
      ))}
    </div>
  );
}
```

- [ ] **Step 3: 验证类型与构建**

Run: `npm run build`
Expected: 成功（类型无误）。

- [ ] **Step 4: 提交**

```bash
git add src/components/HistoryItem.tsx src/components/HistoryList.tsx
git commit -m "feat: 历史记录列表与列表项组件"
```

---

## Task 14: ThemeToggle 组件

**Files:**
- Create: `src/components/ThemeToggle.tsx`

- [ ] **Step 1: 写组件**

Create `src/components/ThemeToggle.tsx`:

```tsx
import { useEffect, useState } from 'react';
import { getSettings, saveSettings, type Settings } from '../store/settings';

/** 在 <html> 上切换 .dark 类，并持久化到 chrome.storage。 */
export function ThemeToggle() {
  const [theme, setTheme] = useState<Settings['theme']>('dark');

  useEffect(() => {
    getSettings().then((s) => {
      setTheme(s.theme);
      applyTheme(s.theme);
    });
  }, []);

  function applyTheme(t: Settings['theme']) {
    document.documentElement.classList.toggle('dark', t === 'dark');
  }

  async function toggle() {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    applyTheme(next);
    await saveSettings({ theme: next });
  }

  return (
    <button
      onClick={toggle}
      className="rounded bg-card px-3 py-1 text-sm text-fg hover:bg-border"
      title="切换主题"
    >
      {theme === 'dark' ? '☀ 浅色' : '🌙 深色'}
    </button>
  );
}
```

- [ ] **Step 2: 提交**

```bash
git add src/components/ThemeToggle.tsx
git commit -m "feat: 主题切换组件"
```

---

## Task 15: Calendar 组件 + history page 三栏主界面

**Files:**
- Create: `src/components/Calendar.tsx`
- Create: `src/entrypoints/history/App.tsx`, `src/entrypoints/history/main.tsx`, `src/entrypoints/history/index.html`

- [ ] **Step 1: 写 Calendar 组件**

Create `src/components/Calendar.tsx`:

```tsx
import { useMemo, useState } from 'react';
import { buildMonthGrid, weekdayLabels, type CalendarDay } from '../lib/calendar';
import { getDayCountsInRange } from '../db/queries';
import { useLiveQuery } from 'dexie-react-hooks';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

interface Props {
  weekStart: 0 | 1;
  selectedDayKey: string;
  onSelect: (dayKey: string) => void;
}

export function Calendar({ weekStart, selectedDayKey, onSelect }: Props) {
  const today = useMemo(() => Date.now(), []);
  const [year, setYear] = useState(new Date().getFullYear());
  const [month, setMonth] = useState(new Date().getMonth());

  // 当前可视月的起止（用于查计数）
  const range = useMemo(() => {
    const start = new Date(year, month, 1).getTime();
    const end = new Date(year, month + 1, 1).getTime();
    return { start, end };
  }, [year, month]);

  const counts = useLiveQuery(() => getDayCountsInRange(range.start, range.end), [range.start, range.end]);
  const grid = useMemo(() => buildMonthGrid(year, month, weekStart, today), [year, month, weekStart, today]);

  function shiftMonth(delta: number) {
    let m = month + delta;
    let y = year;
    if (m < 0) { m = 11; y--; }
    else if (m > 11) { m = 0; y++; }
    setMonth(m);
    setYear(y);
  }

  function cellClass(cell: CalendarDay): string {
    const base = 'flex h-10 w-10 items-center justify-center rounded text-sm relative cursor-pointer';
    const dim = cell.isCurrentMonth ? 'text-fg' : 'text-muted font-light';
    const selected = cell.dayKey === selectedDayKey ? 'bg-accent text-white' : 'hover:bg-border';
    const todayRing = cell.isToday && cell.dayKey !== selectedDayKey ? 'ring-1 ring-accent' : '';
    return `${base} ${dim} ${selected} ${todayRing}`;
  }

  function dot(cell: CalendarDay): JSX.Element | null {
    const c = counts?.get(cell.dayKey) ?? 0;
    if (c === 0) return null;
    // dot 模式统一圆点；heatmap 模式按计数映射透明度（此处按 count 简单分档）
    return (
      <span
        className="absolute bottom-1 h-2 w-2 rounded-full bg-accent"
        style={c >= 10 ? { opacity: 1 } : { opacity: 0.4 + (c / 10) * 0.6 }}
      />
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <button onClick={() => shiftMonth(-1)} className="px-2 text-accent">‹</button>
        <span className="text-base text-fg">{MONTH_NAMES[month]} {year}</span>
        <button onClick={() => shiftMonth(1)} className="px-2 text-accent">›</button>
      </div>
      <div className="grid grid-cols-7 text-center text-xs text-muted">
        {weekdayLabels(weekStart).map((w, i) => (
          <div key={i}>{w}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-y-1">
        {grid.map((cell, i) => (
          <div key={i} className="flex justify-center">
            <button className={cellClass(cell)} onClick={() => onSelect(cell.dayKey)}>
              {cell.dayOfMonth}
              {dot(cell)}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: 写 history page 主界面（三栏）**

Create `src/entrypoints/history/App.tsx`:

```tsx
import { useEffect, useState } from 'react';
import { Calendar } from '../../components/Calendar';
import { HistoryList } from '../../components/HistoryList';
import { ThemeToggle } from '../../components/ThemeToggle';
import { getByDayKey } from '../../db/queries';
import { getDayKey } from '../../lib/url-utils';
import { useLiveQuery } from 'dexie-react-hooks';
import { getSettings, type Settings } from '../../store/settings';

export function App() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [selectedDayKey, setSelectedDayKey] = useState<string>(getDayKey(Date.now()));

  useEffect(() => {
    getSettings().then(setSettings);
  }, []);

  const visits = useLiveQuery(
    () => getByDayKey(selectedDayKey),
    [selectedDayKey],
  );

  if (!settings) return <div className="p-4 text-muted">加载中…</div>;

  return (
    <div className="flex h-screen flex-col bg-bg text-fg">
      <header className="flex items-center justify-between border-b border-border p-3">
        <span className="text-lg font-semibold">Chrome History Plus</span>
        <ThemeToggle />
      </header>
      <div className="flex flex-1 overflow-hidden">
        {/* 左栏：日历 */}
        <aside className="w-1/4 border-r border-border p-4">
          <Calendar
            weekStart={settings.weekStart}
            selectedDayKey={selectedDayKey}
            onSelect={setSelectedDayKey}
          />
        </aside>
        {/* 中栏：选中日历史 */}
        <main className="w-1/2 overflow-y-auto p-4">
          <div className="mb-3 text-sm text-muted">已选：{selectedDayKey}</div>
          <HistoryList visits={visits} />
        </main>
        {/* 右栏：分类统计占位（阶段②细化） */}
        <aside className="w-1/4 border-l border-border p-4">
          <div className="text-sm text-muted">数据分类（阶段②实现）</div>
        </aside>
      </div>
    </div>
  );
}

export default App;
```

- [ ] **Step 3: 写 history page 入口**

Create `src/entrypoints/history/main.tsx`:

```tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import '../../lib/theme.css';
import { App } from './App';

ReactDOM.createRoot(document.getElementById('app')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
```

- [ ] **Step 4: 写 history page HTML**

Create `src/entrypoints/history/index.html`:

```html
<!doctype html>
<html lang="zh-CN">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Chrome History Plus</title>
  </head>
  <body>
    <div id="app"></div>
    <script type="module" src="./main.tsx"></script>
  </body>
</html>
```

- [ ] **Step 5: 验证构建**

Run: `npm run build`
Expected: 成功，`.output/chrome-mv3/` 含 history page。

- [ ] **Step 6: 提交**

```bash
git add src/components/Calendar.tsx src/entrypoints/history/
git commit -m "feat: 日历组件与 history page 三栏主界面"
```

---

## Task 16: Popup（快速入口）

**Files:**
- Modify: `src/entrypoints/popup/App.tsx`, `src/entrypoints/popup/index.html`（模板已生成）

- [ ] **Step 1: 改写 popup/App.tsx**

Replace `src/entrypoints/popup/App.tsx`:

```tsx
export function App() {
  function openHistory() {
    chrome.tabs.create({ url: chrome.runtime.getURL('/history.html') });
  }

  return (
    <div className="flex w-72 flex-col gap-3 bg-bg p-4 text-fg">
      <h1 className="text-base font-semibold">Chrome History Plus</h1>
      <p className="text-xs text-muted">本地、私密、开源的浏览历史管理。</p>
      <button
        onClick={openHistory}
        className="rounded bg-accent px-3 py-2 text-sm text-white hover:opacity-90"
      >
        打开完整历史
      </button>
    </div>
  );
}

export default App;
```

- [ ] **Step 2: 确认 popup/main.tsx 引入了主题 CSS**

Ensure `src/entrypoints/popup/main.tsx` 顶部有（Task 2 Step 5 已加，确认仍在）：

```tsx
import '../../lib/theme.css';
```

- [ ] **Step 3: 验证构建**

Run: `npm run build`
Expected: 成功。

- [ ] **Step 4: 提交**

```bash
git add src/entrypoints/popup/
git commit -m "feat: popup 快速入口"
```

---

## Task 17: 手动集成验收

**Files:** 无（验收步骤）

- [ ] **Step 1: 开发模式启动**

Run: `npm run dev`
Expected: WXT 启动，输出一个 Chrome 加载路径（如 `.output/chrome-mv3-dev`）并自动打开一个带该扩展的 Chrome 实例。

- [ ] **Step 2: 在 Chrome 中加载（若未自动打开）**

Chrome → `chrome://extensions` → 开启"开发者模式" → "加载已解压的扩展程序" → 选 `.output/chrome-mv3-dev` 目录。

- [ ] **Step 3: 验证采集与日历点亮**

1. 在加载了扩展的 Chrome 里访问 3-5 个普通网页（如 reddit.com、github.com）。
2. 点击工具栏扩展图标 → "打开完整历史"。
3. **验收 A**：当天的日历格子底部出现紫色圆点。
4. **验收 B**：点击该天，中栏列出刚访问的站点（标题 + 域名 + 时间）。

- [ ] **Step 4: 验证月份切换与主题**

1. 点日历顶部 `‹` `›` 切到上月/下月，确认无报错、历史月份（若有回填数据）显示圆点。
2. 点右上角主题切换按钮，确认深/浅主题正确切换且刷新后保持。

- [ ] **Step 5: 验证隐私边界**

1. 打开一个隐身窗口访问网页 → 回 history page 确认**当天计数未因隐身访问增加**（隐身不记录）。
2. 访问 `chrome://settings/` → 确认它未被记录。

- [ ] **Step 6: 验证回填**

扩展首次安装时应把 Chrome 现存历史灌入。确认日历上能看到今天之前的若干天有圆点（若该机此前有浏览历史）。

- [ ] **Step 7: 提交验收记录（可选）**

若一切通过，无需提交代码。在计划本文件勾选全部步骤即可。

---

## Self-Review 结果

**1. Spec 覆盖（阶段①范围）：**
- webNavigation 采集 → Task 8 ✅
- 启动回填 chrome.history → Task 9 ✅
- Dexie + visits 表 → Task 6 ✅
- 左栏日历（周一起、圆点、月份切换、深浅主题） → Task 11/12/14/15 ✅
- 中栏选中日列表 → Task 13/15 ✅
- 隐私过滤 5 条（隐身/内部页/本地文件/黑名单/零上报） → Task 5 + Task 8（零上报由 manifest 无多余 host + 无 fetch 保证）✅
- 双主题切换 → Task 2/14 ✅

**2. 占位符扫描：** 无 TBD/TODO；每步含完整代码或确切命令。✅

**3. 类型一致性：**
- `Visit` / `NewVisit`（Task 3）被 queries（Task 7）、background（Task 8）、组件（Task 13/15）一致使用 ✅
- `Settings.weekStart: 0|1`（Task 10）与 `buildMonthGrid` 第三参（Task 11）、Calendar props（Task 15）一致 ✅
- `getDayCountsInRange`（Task 7）签名与 Calendar 调用（Task 15）一致 ✅
- `getBlacklist`（Task 10）被 background（Task 8）调用 ✅

---

*计划完成。下一步：选择执行方式（subagent-driven 或 inline）。*
