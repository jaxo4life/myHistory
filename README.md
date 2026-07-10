# myHistory

开源、纯本地、可审计的 Chrome 浏览历史管理扩展——闭源的 [Browser History Plus](https://browserhistory.net/) 的开源替代。

## 特性

- 📅 **日历视图**：一眼看到哪天有浏览记录，点选某天查看当日历史
- 🔍 **全文搜索**：跨全部历史匹配标题 / URL / 域名
- 🏷 **多维过滤**：域名、自动分类、自定义标签可叠加筛选
- 📊 **分析仪表盘**：30 天访问趋势、0-23 点时段分布、Top 域名
- 🗂 **自动分类**：内置 11 类域名规则，**支持自定义**增删分类与规则
- #️⃣ **自定义标签**：给任意记录打标签，按标签组织
- 💾 **导出**：当前列表导出为 CSV / JSON
- ☑ **批量管理**：多选删除 / 清空全部
- 🌙 **深色 / 浅色双主题**
- ⏱ **突破 Chrome 90 天限制**：长期本地保存浏览历史

## 隐私（核心设计目标）

**所有数据只存在你本机的 IndexedDB，绝不上传任何外部服务器。**

- 隐身模式不记录
- 浏览器内部页（`chrome://`、`about:` 等）、本地文件（`file://`）不记录
- 可配置域名黑名单
- 代码全开源：采集逻辑集中在 [`src/entrypoints/background.ts`](src/entrypoints/background.ts)，可自行审计

## 开发

```bash
npm install
npm run dev    # 开发模式（HMR 热更新，自动加载扩展）
npm run build  # 生产构建到 .output/chrome-mv3
npm test       # 单元测试（vitest）
```

## 本地安装

1. `npm run build`
2. Chrome 打开 `chrome://extensions`
3. 右上角开启「开发者模式」
4. 「加载已解压的扩展程序」→ 选择 `.output/chrome-mv3` 目录
5. 点工具栏扩展图标进入主界面

## 技术栈

WXT · React · TypeScript · Dexie (IndexedDB) · Tailwind CSS · Recharts
