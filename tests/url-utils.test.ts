import { describe, it, expect } from 'vitest';
import { getDomain, getDayKey, extractRegistrableDomain } from '../src/lib/url-utils';

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

describe('extractRegistrableDomain', () => {
  it('普通两段原样: example.com', () => {
    expect(extractRegistrableDomain('example.com')).toBe('example.com');
  });
  it('去单层子域: www.example.com → example.com', () => {
    expect(extractRegistrableDomain('www.example.com')).toBe('example.com');
  });
  it('去多层子域: aaa.bbb.ccc.com → ccc.com', () => {
    expect(extractRegistrableDomain('aaa.bbb.ccc.com')).toBe('ccc.com');
  });
  it('多段TLD com.cn: www.right.com.cn → right.com.cn', () => {
    expect(extractRegistrableDomain('www.right.com.cn')).toBe('right.com.cn');
  });
  it('多段TLD com.hk: google.com.hk → google.com.hk', () => {
    expect(extractRegistrableDomain('google.com.hk')).toBe('google.com.hk');
  });
  it('多段TLD co.uk: www.bbc.co.uk → bbc.co.uk', () => {
    expect(extractRegistrableDomain('www.bbc.co.uk')).toBe('bbc.co.uk');
  });
  it('IP 原样: 10.0.0.1', () => {
    expect(extractRegistrableDomain('10.0.0.1')).toBe('10.0.0.1');
  });
});
