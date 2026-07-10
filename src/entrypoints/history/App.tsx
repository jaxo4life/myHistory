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

  const visits = useLiveQuery(() => getByDayKey(selectedDayKey), [selectedDayKey]);

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
        <main className="no-scrollbar w-1/2 overflow-y-auto p-4">
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
