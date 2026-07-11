import { useEffect, useMemo, useRef, useState } from 'react';
import { buildMonthGrid, weekdayLabels, type CalendarDay } from '../lib/calendar';
import { getDayCountsInRange } from '../db/queries';
import { getDayKey } from '../lib/url-utils';
import { formatMonthTitle, formatMonthAbbr } from '../lib/date-format';
import { useLiveQuery } from 'dexie-react-hooks';
import { useI18n } from '../i18n';

interface Props {
  weekStart: 0 | 1;
  selectedDayKey: string;
  onSelect: (dayKey: string) => void;
}

export function Calendar({ weekStart, selectedDayKey, onSelect }: Props) {
  const { t, locale } = useI18n();
  const today = useMemo(() => Date.now(), []);
  const todayKey = useMemo(() => getDayKey(today), [today]);
  const todayDate = useMemo(() => new Date(today), [today]);
  const [year, setYear] = useState(todayDate.getFullYear());
  const [month, setMonth] = useState(todayDate.getMonth());
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerYear, setPickerYear] = useState(year);
  const pickerRef = useRef<HTMLDivElement>(null);

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

  const canGoNext =
    year < todayDate.getFullYear() ||
    (year === todayDate.getFullYear() && month < todayDate.getMonth());
  const canPickerNextYear = pickerYear < todayDate.getFullYear();

  useEffect(() => {
    if (!pickerOpen) return;
    const handler = (e: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) {
        setPickerOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [pickerOpen]);

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

  function togglePicker() {
    setPickerYear(year);
    setPickerOpen((o) => !o);
  }

  function pickMonth(m: number) {
    setMonth(m);
    setYear(pickerYear);
    setPickerOpen(false);
  }

  function cellClass(cell: CalendarDay): string {
    if (cell.dayKey > todayKey) {
      return 'flex h-10 w-10 items-center justify-center rounded text-sm relative cursor-not-allowed text-faint/40';
    }
    const base =
      'flex h-10 w-10 items-center justify-center rounded text-sm relative cursor-pointer text-fg transition-colors';
    const selected = cell.dayKey === selectedDayKey ? 'bg-accent text-white' : 'hover:bg-border';
    const todayRing = cell.isToday && cell.dayKey !== selectedDayKey ? 'ring-1 ring-accent' : '';
    return `${base} ${selected} ${todayRing}`;
  }

  function dot(cell: CalendarDay) {
    const c = counts?.[cell.dayKey] ?? 0;
    if (c === 0) return null;
    return (
      <span
        className="absolute bottom-1 h-2 w-2 rounded-full bg-accent"
        style={c >= 10 ? { opacity: 1 } : { opacity: 0.4 + (c / 10) * 0.6 }}
      />
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <div ref={pickerRef} className="relative flex items-center justify-between">
        <button onClick={() => shiftMonth(-1)} className="px-2 text-accent" aria-label={t('cal.prevMonth')}>
          ‹
        </button>
        <button
          onClick={togglePicker}
          className="rounded px-2 py-1 text-base text-fg transition-colors hover:bg-card"
        >
          {formatMonthTitle(year, month, locale)}
        </button>
        <button
          onClick={() => shiftMonth(1)}
          disabled={!canGoNext}
          className="px-2 text-accent transition-colors disabled:cursor-not-allowed disabled:text-faint/40"
          aria-label={t('cal.nextMonth')}
        >
          ›
        </button>

        {pickerOpen && (
          <div className="absolute left-1/2 top-full z-20 mt-1 w-56 -translate-x-1/2 rounded-lg bg-bg p-3 shadow-elevated ring-1 ring-border">
            <div className="mb-2 flex items-center justify-between text-sm">
              <button onClick={() => setPickerYear((y) => y - 1)} className="px-2 text-accent" aria-label={t('cal.prevYear')}>
                ‹
              </button>
              <span className="font-medium text-fg">{pickerYear}</span>
              <button
                onClick={() => setPickerYear((y) => y + 1)}
                disabled={!canPickerNextYear}
                className="px-2 text-accent transition-colors disabled:cursor-not-allowed disabled:text-faint/40"
                aria-label={t('cal.nextYear')}
              >
                ›
              </button>
            </div>
            <div className="grid grid-cols-3 gap-1">
              {Array.from({ length: 12 }, (_, m) => {
                const isFuture =
                  pickerYear > todayDate.getFullYear() ||
                  (pickerYear === todayDate.getFullYear() && m > todayDate.getMonth());
                const isSelected = pickerYear === year && m === month;
                return (
                  <button
                    key={m}
                    onClick={() => pickMonth(m)}
                    disabled={isFuture}
                    className={`rounded px-1 py-1.5 text-xs transition-colors ${
                      isSelected
                        ? 'bg-accent text-white'
                        : isFuture
                          ? 'cursor-not-allowed text-faint/40'
                          : 'text-fg hover:bg-card'
                    }`}
                  >
                    {formatMonthAbbr(m, locale)}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
      <div className="grid grid-cols-7 text-center text-xs text-muted">
        {weekdayLabels(weekStart, locale).map((w, i) => (
          <div key={i}>{w}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-y-1">
        {grid.map((cell, i) => (
          <div key={i} className="flex h-10 w-10 items-center justify-center">
            {cell.isCurrentMonth && (
              <button
                className={cellClass(cell)}
                onClick={() => onSelect(cell.dayKey)}
                disabled={cell.dayKey > todayKey}
              >
                {cell.dayOfMonth}
                {dot(cell)}
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
