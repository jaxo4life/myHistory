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
