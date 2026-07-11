# 悬浮统计窗设计 (Floating Stats Widget)

- 日期：2026-07-11
- 目标版本：0.1.3

## 1. 目标

在所有普通网页（http/https）显示一个极小、可拖动的悬浮卡片，展示 3 个精选数据点，让用户随时感知浏览统计。默认左下角，位置全局记忆。

## 2. 非功能约束（硬性）

- **极小资源占用**：后台 tab 零消耗；前台 tab 刷新时仅索引级查询；无框架、无轮询、无全表扫描。
- content script 用**原生 DOM + 原生 CSS**（不挂 React/Tailwind），Shadow DOM 隔离样式。
- 数据查询走 IndexedDB 索引（`dayKey` / `domain` / `visitTime`，均已在 `database.ts` schema 中）。
- 多 tab 下，全局数据全扩展只算一次（background 单点缓存）。

## 3. 显示内容（"今日+本站"方案）

三行：
1. **今日访问数** — 全局，`dayKey === todayKey()` 的记录数。
2. **本站累计** — 当前页面域名 `domain` 的总记录数。
3. **今日主力分类** — 今日记录中占比最高的分类，显示 `icon + 名称`。

## 4. 交互

- **常驻展开**：始终显示卡片。
- **拖动**：整个卡片为手柄，使用原生 pointer events。
- 默认定位 `position: fixed; left:16px; bottom:16px`。
- 移动 < 5px 视为点击（不触发位移），避免误触。
- **不提供隐藏/关闭按钮**（见第 13 节 YAGNI）。用户靠拖动移到不遮挡的位置。

## 5. 架构

### 5.1 文件职责

- **新增** `src/entrypoints/floating-stats.content.ts`
  - content script（WXT `defineContentScript`，`matches: ['http://*/*','https://*/*']`）
  - 创建 Shadow DOM 容器 → 构建原生 DOM 卡片 → 绑定拖拽 → 收发消息 → 刷新调度
- **修改** `src/db/queries.ts` — 新增 3 个索引查询（见第 6 节）
- **修改** `src/entrypoints/background.ts` — 新增 `FLOATING_STATS` message handler + 内存缓存（见第 7、8 节）

### 5.2 数据流

```
tab 页面
  └─ floating-stats.content.ts
       └─ Shadow DOM → 原生 DOM 卡片
            │ chrome.runtime.sendMessage({type:'FLOATING_STATS', domain})
            ▼
       background.ts (单例)
            ├─ 全局缓存命中? → 直接返回
            └─ 否则: queries.ts 索引查询 → 写缓存 → 返回
```

content script 跑在网页上下文，读不到扩展 IndexedDB，必须经 background 中转。

### 5.3 数据契约

- Request: `{ type: 'FLOATING_STATS', domain: string }`
- Response（成功）: `{ todayCount: number; siteCount: number; topCategory: { name: string; icon: string; color: string } | null }`
- Response（失败）: `{ error: true }` —— content script 据此显示 `–`，避免把真实的 0 误判为错误

## 6. 新增查询（queries.ts，均走索引）

- `getTodayCount(): Promise<number>`
  `db.visits.where('dayKey').equals(todayKey()).count()`
- `getDomainCount(domain: string): Promise<number>`
  `db.visits.where('domain').equals(domain).count()`
- `getTodayTopCategory(): Promise<{ name: string; icon: string; color: string } | null>`
  `db.visits.where('dayKey').equals(todayKey()).toArray()` 取今日小集合 → 内存分类计数（复用 `classifyDomain` + `getCategories()`）→ 取 top1。空集返回 `null`。

> 关键：`getOverview()` 是 `toArray()` 全表加载，本设计**不复用它**，改用上面的索引查询，把 O(全表) 降到 O(索引)。

## 7. 刷新策略（事件驱动，无轮询）

1. **首次挂载**：`requestIdleCallback`（fallback `setTimeout(_, 200)`）后请求一次，不抢页面首屏。
2. **`visibilitychange` → visible**：debounce 500ms 后请求；期间多次 visible 合并为一次（防查询风暴）。
3. **无定时轮询**：后台 tab 不消耗任何 CPU。
4. 本版不做 background → content script 的主动通知（按需刷新已足够实时）。

## 8. 多 tab 对策（background 单点缓存）

background 内存缓存（模块级变量）：

- `globalCache: { todayCount: number; topCategory: {...}|null; at: number } | null`，TTL 5s。
- `domainCache: Map<string, { count: number; at: number }>`，TTL 5s。

逻辑：

- **请求处理**：全局命中缓存（`Date.now() - at < 5000`）直接返回；否则调用 `getTodayCount()` + `getTodayTopCategory()` 重算并写缓存。domain 同理用 `getDomainCount()`。
- **lazy 失效**：`addVisit` 成功后，置 `globalCache = null`（零成本标记 stale）；下次有 tab 请求才重算。domain 缓存按 TTL 自然过期即可。

效果：全局数据（`todayCount`、`topCategory`）全扩展只算一次；10 个 tab 同时切前台时，background 只重算一次全局数据，其余命中缓存，各 tab 仅各查一次索引级 domain count。

## 9. 拖拽与位置持久化

- `pointerdown`：记录起始 pointer 坐标 + 卡片当前 `left/top`；设 `dragging=true`，`moved=false`。
- `pointermove`：累计位移 > 5px 时 `moved=true`；更新 `left/top`，clamp 到视口 `[0, innerWidth - width] × [0, innerHeight - height]`。
- `pointerup`：若 `moved`，写入 `chrome.storage.local` 的 `history-plus:floating-pos = { left, top }`；清除 dragging。
- **挂载时**读 `history-plus:floating-pos`：
  - 有值 → 应用 `{left, top}`（移除默认 bottom）。
  - 无值 → 用默认左下角（CSS `left:16px; bottom:16px`）。
- 存储格式：`{ left: number; top: number } | null`。全局统一，所有站点共用。

## 10. UI / 样式

- Shadow DOM 内一个 `<style>` + 容器 div。
- 固定宽度 ~200px，圆角 12px。
- 背景 `rgba(20,20,22,0.82)` + `backdrop-filter: blur(8px)`（不支持时降级为纯色）；白色文字。
- `box-shadow: 0 4px 16px rgba(0,0,0,0.2)`。
- `z-index: 2147483647`（确保在最上层）。
- 系统字体栈，字号 12px，行高紧凑。
- 三行结构：`icon/色点 + 标签（左）+ 数值（右）`。
- `cursor: default`，拖动中 `cursor: grabbing`。
- 半透明深色中性配色，不读宿主主题，在明暗页面都可读。

## 11. 范围限制（非缺陷）

- `chrome://`、`chrome-extension://`、`edge://`、Web Store 等内部页：浏览器禁止 content script 注入，悬浮窗不出现。
- `file://` 本地页面：matches 未包含，不注入。
- 隐私模式（incognito）：扩展默认不在隐私模式运行，悬浮窗不在隐私页出现。

## 12. 错误处理

- background 查询异常 → catch，返回 `{ error: true }`；content script 把三行都显示 `–`。正常的 `0`（今天确实没访问）正常显示，不与错误混淆。
- `topCategory` 为 `null`（今日无记录，无法算主力分类）→ 第三行显示 `–`，属正常状态而非错误。
- content script `sendMessage` 失败/超时 → 显示 `–`，下次 visibility 重试。
- `domain` 为空（如 `about:blank`）→ `siteCount` 显示 `–`。

## 13. 不做（YAGNI）

- 不挂 React / Tailwind（资源占用考虑）。
- 不提供隐藏/关闭按钮（隐藏会引入"恢复显示"入口的复杂度与永久消失风险；靠拖动移开足够）。
- 不做定时轮询。
- 不做 background → content 的主动通知。
- 不做每域名位置记忆（全局统一）。
- 不做悬浮窗内容可配置（固定 3 项）。
- 未来可选：在管理页增加"启用/禁用悬浮窗"全局开关。

## 14. 测试

- `getTodayCount` / `getDomainCount` / `getTodayTopCategory` 为纯 DB 逻辑，按现有 vitest + fake-indexeddb 单测（含空集、多记录、分类 top1 选取等用例）。
- background 缓存命中/失效、content script 拖拽、DOM 渲染、注入范围：手动验证。

## 15. 文件清单

新增：
- `src/entrypoints/floating-stats.content.ts`
- 对应查询的测试用例（追加到现有 `tests/*.test.ts` 或新建）

修改：
- `src/db/queries.ts`（3 个索引查询）
- `src/entrypoints/background.ts`（`FLOATING_STATS` handler + 缓存 + `addVisit` 后失效）
