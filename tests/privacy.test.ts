import { describe, it, expect } from 'vitest';
import { isInternalUrl, shouldRecord } from '../src/lib/privacy';

describe('isInternalUrl', () => {
  it('识别 chrome 内部页', () => {
    expect(isInternalUrl('chrome://settings/')).toBe(true);
    expect(isInternalUrl('chrome-extension://abc/popup.html')).toBe(true);
    expect(isInternalUrl('edge://version')).toBe(true);
    expect(isInternalUrl('about:blank')).toBe(true);
    expect(isInternalUrl('view-source:https://x.com')).toBe(true);
    expect(isInternalUrl('file:///C:/x.txt')).toBe(true);
  });

  it('放行普通网页', () => {
    expect(isInternalUrl('https://www.reddit.com/')).toBe(false);
  });
});

describe('shouldRecord', () => {
  const baseVisit = { url: 'https://www.reddit.com/', domain: 'www.reddit.com' };

  it('隐身模式不记录', () => {
    expect(shouldRecord({ ...baseVisit, incognito: true }, [])).toBe(false);
  });

  it('内部页不记录', () => {
    expect(shouldRecord({ ...baseVisit, url: 'chrome://settings/', incognito: false }, [])).toBe(false);
  });

  it('黑名单域名不记录（含子域名）', () => {
    expect(shouldRecord({ ...baseVisit, domain: 'bank.com', incognito: false }, ['bank.com'])).toBe(false);
    expect(
      shouldRecord({ url: 'https://x.com', domain: 'mail.bank.com', incognito: false }, ['bank.com']),
    ).toBe(false);
  });

  it('正常页面记录', () => {
    expect(shouldRecord({ ...baseVisit, incognito: false }, [])).toBe(true);
  });

  it('空域名（解析失败）不记录', () => {
    expect(shouldRecord({ url: 'not-a-url', domain: '', incognito: false }, [])).toBe(false);
  });
});
