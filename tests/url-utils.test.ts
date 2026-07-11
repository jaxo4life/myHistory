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
    expect(getDomain('chrome://settings/')).toBe('settings');
  });
});

describe('getDayKey', () => {
  it('把时间戳转成本地时区 YYYY-MM-DD', () => {
    const d = new Date(2026, 2, 15, 14, 30);
    expect(getDayKey(d.getTime())).toBe('2026-03-15');
  });

  it('补零', () => {
    const d = new Date(2026, 0, 5, 1, 1);
    expect(getDayKey(d.getTime())).toBe('2026-01-05');
  });
});
