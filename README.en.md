<p align="center">
  <img src="public/icon/512.png" width="120" alt="myHistory">
</p>

<h1 align="center">myHistory</h1>

<p align="center">Open-source, fully-local, auditable Chrome browsing-history manager — an open alternative to the closed-source <a href="https://browserhistory.net/">Browser History Plus</a>.</p>

<p align="center">
  English | <a href="README.md">中文</a>
</p>

<p align="center">
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
- **Calendar view**: see at a glance which days have activity; click a day to view its history (with a day-summary card)
- **Grouped-by-day list**: Today / Yesterday / Earlier, sticky headers, hover-revealed actions
- **Full-text search** + domain / category / tag filters, stackable

### 📊 Analytics Dashboard
- **Today's focus + day-over-day change** (hero)
- **Visit trend**: 7 / 30 / 90 days / All
- **Week × hour heatmap**: 5-step color scale + peak indicator + legend
- Active hours / visit sources / Top domains (full) / category distribution

### 🗂 Smart Categories
- **19 built-in categories** (Social / Video / Shopping / News / AI / Dev / Tools / Travel / Finance / Crypto / Local …), covering global + Chinese mainstream sites
- **One-click reclassify**: hover any record to see its current category; click the folder icon to add its domain to a chosen category (auto-extracts the registrable domain with multi-part-TLD awareness, e.g. `www.right.com.cn → right.com.cn`; editable)
- **Longest-match + keyword fallback**: precise rules first; unmatched by keyword heuristics; LAN IPs / `localhost` / `.local` auto-classified as "Local"
- **Version migration**: rule upgrades migrate existing users automatically; custom categories preserved
- **Fully customizable**: add/remove categories, edit rules (~90 icons to pick), custom tags

### 🌐 Bilingual (zh / en)
- One-click **中文 / English** toggle; calendar (zh Mon-first / en Sun-first), month names, date formats all follow
- Auto-detects browser language

### 🎨 More
- **Dark / light themes** (design-token layer, deep-dark color layering + dark-friendly shadows)
- Export CSV / JSON
- Bulk select-delete / clear-all (with confirmation)

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

- [x] Calendar / search / categories / tags / analytics / zh-en i18n / dark-light themes / export
- [ ] Automatic local backup
- [ ] Timeline / tag views
- [ ] More languages

---

## 📄 License

MIT
