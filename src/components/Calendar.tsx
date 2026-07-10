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

  const range = useMemo(() => {
    const start = new Date(year, month, 1).getTime();
    const end = new Date(year, month + 1, 1).getTime();
    return { start, end };
  }, [year, month]);

  const counts = useLiveQuery(
    () => getDayCountsInRange(range.start, range.end),
    [range.start, range.end],
  );
  const grid = useMemo(
    () => buildMonthGrid(year, month, weekStart, today),
    [year, month, weekStart, today],
  );

  function shiftMonth(delta: number) {
    let m = month + delta;
    let y = year;
    if (m < 0) {
      m = 11;
      y--;
    } else if (m > 11) {
      m = 0;
      y++;
    }
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

  function dot(cell: CalendarDay) {
    const c = counts?.get(cell.dayKey) ?? 0;
    if (c === 0) return null;
    // dot 模式统一圆点；heatmap 模式按访问量映射透明度
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
        <button onClick={() => shiftMonth(-1)} className="px-2 text-accent" aria-label="上一月">
          ‹
        </button>
        <span className="text-base text-fg">
          {MONTH_NAMES[month]} {year}
        </span>
        <button onClick={() => shiftMonth(1)} className="px-2 text-accent" aria-label="下一月">
          ›
        </button>
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
