<p align="center">
  <img src="public/icon/512.png" width="120" alt="myHistory">
</p>

<p align="center">Open-source, fully-local, auditable Chrome browsing-history manager — an open alternative to the closed-source <a href="https://browserhistory.net/">Browser History Plus</a>.</p>

<p align="center">
  English | <a href="README.md">中文</a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/dynamic/json?url=https://raw.githubusercontent.com/jaxo4life/myHistory/main/package.json&query=$.version&label=version&color=6C5CE7" alt="Version">
  <img src="https://img.shields.io/badge/License-MIT-blue.svg" alt="License">
  <img src="https://img.shields.io/badge/TypeScript-5-3178c6.svg" alt="TypeScript">
  <img src="https://img.shields.io/badge/React-19-61dafb.svg" alt="React">
  <img src="https://img.shields.io/badge/WXT-MV3-34c4c4.svg" alt="WXT">
  <img src="https://img.shields.io/badge/Chrome-Extension-4285F4.svg" alt="Chrome">
</p>

---

Your browsing history **stays on your own machine.** Zero network reporting, zero third parties, fully open-source and auditable.

---

## ✨ Features

### 🔒 Data Sovereignty (Core)
- **Fully local IndexedDB** — never uploads anything to any external server
- **Breaks Chrome's 90-day limit** — keeps history long-term
- **Auditable collection**: logic lives in a single [`background.ts`](src/entrypoints/background.ts), plain to read
- Incognito / internal pages (`chrome://`, `about:`, `file://`) / blacklisted domains are never recorded

### 📅 Browsing
- **Calendar view**: see at a glance which days have activity; dots update live with the current filter; switch between a specific day and "all dates"
- **Filter = global**: setting category / tag / domain / search auto-switches to all dates for cross-date matches; click a day to narrow back down
- **Stackable filters**: domain / category / tag / full-text search, all clearable chips
- **Grouped-by-day list**: Today / Yesterday / Earlier, sticky headers, hover-revealed actions
- **Export current view** as CSV / JSON (with a count preview)
- **Bulk delete**: selected records require a confirmation step

### 📊 Analytics Dashboard
- **Profile hero**: today's visits + day-over-day + auto labels (Night owl / Deep diver / Regular …)
- **Derived metrics**: concentration (top-5 share) / diversity (Shannon entropy) / discovery / loyalty
- **Behavior radar**: Activity / Diversity / Focus / Discovery / Regularity — five-axis profile
- **Trend + 7-day moving average**: smooths daily noise; 7 / 30 / 90 days / All
- **Week × hour heatmap**: 5-step color scale + peak indicator
- **Weekday vs weekend** daily-average comparison
- **Sessions**: count / avg length / longest / **distraction index** (switch rate)
- **Category trend** (stacked area) / tag cloud / visit sources / top domains (full)

### 🗂 Smart Categories
- **21 built-in categories** (Social / Video / Music / Shopping / Life / News / Mail / Search / AI / Work / Cloud / Dev / Learning / Reference / Finance / Crypto / Travel / Games / Tools / Adult / Local), covering global + Chinese mainstream sites
- **One-click reclassify**: hover any record to see its current category; click the folder icon to add its domain to a chosen category (auto-extracts the registrable domain with multi-part-TLD awareness, e.g. `www.right.com.cn → right.com.cn`; editable)
- **Longest-match + keyword fallback**: precise rules first; unmatched by keyword heuristics; LAN IPs / `localhost` / `.local` auto-classified as "Local"
- **Version migration**: rule upgrades migrate existing users automatically; custom categories preserved
- **Fully customizable**: add/remove categories, edit rules (~90 icons to pick), custom tags

### 🌐 Bilingual (zh / en)
- One-click **中文 / English** toggle; calendar (zh Mon-first / en Sun-first), month names, date formats all follow
- Auto-detects browser language

### 🎨 More
- **Dark / light themes** (design-token layer, deep-dark color layering + dark-friendly shadows)
- Manage page: data overview / clear-all (type-to-confirm) / floating-stats toggle

---

## 🔒 Privacy Checklist

- No `fetch` / XHR sending history data anywhere
- Incognito not recorded
- `chrome://` / `about:` / `file://` / `edge://` internal pages not recorded
- Configurable domain blacklist
- Manifest requests no extra host permissions

---

## 📦 Install

```bash
npm install
npm run build      # production build to .output/chrome-mv3
```

1. Open `chrome://extensions`
2. Toggle on **Developer mode** (top-right)
3. **Load unpacked** → select `.output/chrome-mv3`
4. Click the toolbar icon to open

---

## 🛠 Develop

```bash
npm install
npm run dev        # dev mode (HMR, auto-reload)
npm run build      # production build
npm test           # unit tests (vitest)
```

---

## 🧱 Tech Stack

[WXT](https://wxt.dev) (MV3) · React 19 · TypeScript · [Dexie](https://dexie.org) (IndexedDB) · Tailwind CSS · Recharts · self-built lightweight i18n (zero-dep)

---

## 📋 Roadmap

- [x] Calendar / search / categories / tags / analytics dashboard (derived metrics + behavior profile + sessions) / zh-en / dark-light themes / export
- [ ] Automatic local backup
- [ ] Timeline / tag views
- [ ] More languages

---

## 📄 License

MIT
