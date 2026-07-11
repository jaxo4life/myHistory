<p align="center">
  <img src="public/icon/512.png" width="120" alt="myHistory">
</p>

<h1 align="center">myHistory</h1>

<p align="center">开源、纯本地、可审计的 Chrome 浏览历史管理扩展 —— 闭源 <a href="https://browserhistory.net/">Browser History Plus</a> 的开源替代。</p>

<p align="center">
  <a href="README.en.md">English</a> | 中文
</p>

<p align="center">
  <img src="https://img.shields.io/badge/License-MIT-blue.svg" alt="License">
  <img src="https://img.shields.io/badge/TypeScript-5-3178c6.svg" alt="TypeScript">
  <img src="https://img.shields.io/badge/React-19-61dafb.svg" alt="React">
  <img src="https://img.shields.io/badge/WXT-MV3-34c4c4.svg" alt="WXT">
  <img src="https://img.shields.io/badge/Chrome-Extension-4285F4.svg" alt="Chrome">
</p>

---

你的浏览历史**只存在你自己的电脑上**。零网络上报、零第三方、代码全开源可审计。

---

## ✨ 特性

### 🔒 数据主权（核心）
- **纯本地 IndexedDB**,绝不上传任何外部服务器
- **突破 Chrome 90 天限制**,长期保存浏览历史
- **可审计采集**:逻辑集中在 [`background.ts`](src/entrypoints/background.ts),单文件一目了然
- 隐身模式 / 内部页(`chrome://`、`about:`、`file://`)/ 黑名单域名 一律不记录

### 📅 浏览
- **日历视图**:一眼看到哪天有记录,点选某天查看当日历史(附当日概览卡)
- **按天分组列表**:今天 / 昨天 / 更早,sticky 标题,操作悬停浮现
- **全文搜索** + 域名 / 分类 / 标签 多维筛选叠加

### 📊 分析仪表盘
- **今日焦点 + 昨日环比**(Hero 区)
- **访问趋势**:7 / 30 / 90 天 / 全部 切换
- **一周 × 时段热力图**:5 档色阶 + 峰值定位 + 图例
- 活跃时段 / 访问来源 / Top 域名(全量)/ 分类分布

### 🗂 智能分类
- **19 个内置分类**(社交 / 视频 / 购物 / 新闻 / AI / 开发 / 工具 / 旅行 / 金融 / 加密 / 本地 …),覆盖全球 + 中国主流站点
- **一键归类**:每条记录 hover 即见当前分类,点按钮把域名加入指定分类(自动提取主域,支持多段 TLD 如 `www.right.com.cn → right.com.cn`,可手动改写)
- **最长匹配 + 关键词兜底**:精确规则优先,未命中按关键词归类;内网 IP / `localhost` / `.local` 自动归"本地"
- **版本迁移**:规则升级自动迁移老用户,自定义分类不丢
- **完全可定制**:管理页增删分类、编辑规则(~90 个图标可选)、自定义标签

### 🌐 中英文 + 本地化
- 一键切换 **中文 / English**,日历(中文周一 / 英文周日)、月份、日期格式全跟随
- 自动检测浏览器语言

### 🎨 其他
- **深色 / 浅色双主题**(设计令牌层,深色色彩重分层 + 深色友好阴影)
- 导出 CSV / JSON
- 批量选择删除 / 清空全部(防误删确认)

---

## 🔒 隐私自检

- 无任何 `fetch` / XHR 向外部发送历史数据
- 隐身模式不记录
- `chrome://` / `about:` / `file://` / `edge://` 等内部页不记录
- 可配置域名黑名单
- manifest 不申请多余 host 权限

---

## 📦 安装

```bash
npm install
npm run build      # 生产构建到 .output/chrome-mv3
```

1. Chrome 打开 `chrome://extensions`
2. 右上角开启「**开发者模式**」
3. 「**加载已解压的扩展程序**」→ 选择 `.output/chrome-mv3`
4. 点工具栏扩展图标进入主界面

---

## 🛠 开发

```bash
npm install
npm run dev        # 开发模式(HMR 热更新,自动加载扩展)
npm run build      # 生产构建
npm test           # 单元测试(vitest)
```

---

## 🧱 技术栈

[WXT](https://wxt.dev) (MV3) · React 19 · TypeScript · [Dexie](https://dexie.org) (IndexedDB) · Tailwind CSS · Recharts · 自建轻量 i18n(零依赖)

---

## 📋 路线

- [x] 日历 / 搜索 / 分类 / 标签 / 分析 / 中英文 i18n / 深浅主题 / 导出
- [ ] 自动本地备份
- [ ] 时间线 / 标签视图
- [ ] 更多语言

---

## 📄 License

MIT
